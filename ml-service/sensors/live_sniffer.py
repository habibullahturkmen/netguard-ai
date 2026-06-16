#!/usr/bin/env python3
"""
Live sniffer with short-window aggregation and optional rule-based DoS detection.

Usage:
  sudo ./sensors/live_sniffer.py --iface wlo1 --backend http://127.0.0.1:5000/api/analyze --window 5 --threshold 3 --debug
"""

import time
import argparse
import json
import requests
import threading
from collections import defaultdict, Counter
from scapy.all import sniff, IP, TCP, UDP

# Defaults
BACKEND_URL = "http://127.0.0.1:5000/api/analyze"
ML_TIMEOUT = 3
ALERT_CONFIDENCE_THRESHOLD = 0.7
INTERFACE = "wlo1"
WINDOW_SECONDS = 5
SEND_THRESHOLD = 3   # min packets per dst to send aggregate
DEBUG = False

PORT_TO_SERVICE = {
    80: "http", 443: "https", 53: "domain", 22: "ssh", 25: "smtp",
    123: "ntp", 161: "snmp", 3306: "mysql"
}

# In-memory aggregation state keyed by destination IP
state_lock = threading.Lock()
state = defaultdict(lambda: {
    "count": 0,
    "srv_count": 0,
    "src_bytes": 0,
    "dst_bytes": 0,
    "tcp_count": 0,
    "udp_count": 0,
    "unique_src": set(),
    "unique_dports": set(),
    "syn": 0,
    "synack": 0,
    "flags": Counter(),
    "last_src": None,
})

def pkt_update_state(pkt):
    if not IP in pkt:
        return
    dst = pkt[IP].dst
    src = pkt[IP].src
    entry = state[dst]
    entry["count"] += 1
    entry["unique_src"].add(src)
    entry["src_bytes"] += len(pkt)
    entry["last_src"] = src

    if TCP in pkt:
        entry["tcp_count"] += 1
        dport = pkt[TCP].dport
        entry["unique_dports"].add(dport)
        flags = str(pkt[TCP].flags)
        entry["flags"][flags] += 1
        f = flags.upper()
        if "S" in f and "A" not in f:
            entry["syn"] += 1
        if "S" in f and "A" in f:
            entry["synack"] += 1
        if dport in PORT_TO_SERVICE:
            entry["srv_count"] += 1
    elif UDP in pkt:
        entry["udp_count"] += 1
        dport = pkt[UDP].dport
        entry["unique_dports"].add(dport)
        if dport in PORT_TO_SERVICE:
            entry["srv_count"] += 1

def compute_features(dst, entry, window_seconds):
    count = entry["count"]
    srv_count = entry["srv_count"]
    src_bytes = entry["src_bytes"]
    dst_bytes = entry["dst_bytes"]
    unique_src_count = len(entry["unique_src"])
    syn = entry["syn"]
    synack = entry["synack"]

    protocol = "tcp" if entry["tcp_count"] >= entry["udp_count"] else "udp"

    serror_rate = 0.0
    if count > 0:
        serror_rate = max(0.0, (syn - synack) / max(1, count))
    srv_serror_rate = serror_rate
    same_srv_rate = (srv_count / count) if count else 0.0
    diff_srv_rate = 1.0 - same_srv_rate

    dst_host_count = unique_src_count
    dst_host_srv_count = unique_src_count

    service = "other"
    if entry["unique_dports"]:
        port = next(iter(entry["unique_dports"]))
        service = PORT_TO_SERVICE.get(port, "other")

    features = {
        "destination_ip": dst,
        "source_ip": entry["last_src"],
        "duration": float(window_seconds),
        "protocol": protocol,
        "protocol_type": protocol,
        "service": service,
        "flag": "SF",
        "src_bytes": src_bytes,
        "dst_bytes": dst_bytes,
        "count": count,
        "srv_count": srv_count,
        "serror_rate": round(serror_rate, 3),
        "srv_serror_rate": round(srv_serror_rate, 3),
        "rerror_rate": 0.0,
        "srv_rerror_rate": 0.0,
        "same_srv_rate": round(same_srv_rate, 3),
        "diff_srv_rate": round(diff_srv_rate, 3),
        "srv_diff_host_rate": 0.0,
        "dst_host_count": dst_host_count,
        "dst_host_srv_count": dst_host_srv_count,
        "dst_host_same_srv_rate": 0.0,
        "dst_host_diff_srv_rate": 0.0,
        "dst_host_same_src_port_rate": 0.0,
        "dst_host_srv_diff_host_rate": 0.0,
        "dst_host_serror_rate": round(serror_rate, 3),
        "dst_host_srv_serror_rate": round(serror_rate, 3),
        "dst_host_rerror_rate": 0.0,
        "dst_host_srv_rerror_rate": 0.0,
    }
    return features

def send_aggregate(features):
    if DEBUG:
        print("[DEBUG] sending aggregate:", json.dumps(features))
    headers = {"Content-Type": "application/json"}
    try:
        r = requests.post(BACKEND_URL, json=features, timeout=ML_TIMEOUT)
        if r.status_code in (200, 201):
            return r.json()
        else:
            print(f"[WARN] backend {r.status_code}: {r.text}")
    except Exception as e:
        print("[ERROR] send failed:", e)
    return None

def flush_worker(window_seconds, send_threshold):
    while True:
        time.sleep(window_seconds)
        to_send = []
        with state_lock:
            items = list(state.items())
            state.clear()  # reset for next window
        for dst, entry in items:
            if entry["count"] >= send_threshold:
                features = compute_features(dst, entry, window_seconds)
                to_send.append(features)
        # send outside lock
        for f in to_send:
            resp = send_aggregate(f)
            if resp:
                ml = resp.get("ml") or resp.get("ml_response") or resp
                # print concise result
                if isinstance(ml, dict):
                    pred = ml.get("prediction", "<no-pred>")
                    conf = float(ml.get("confidence", 0.0))
                else:
                    # fallback if backend returns flat ml keys
                    pred = resp.get("prediction", "<no-pred>")
                    conf = float(resp.get("confidence", 0.0))
                if pred == "Suspicious" and conf >= ALERT_CONFIDENCE_THRESHOLD:
                    print(f"[ALERT] {pred} conf={conf:.2f} dst={f['destination_ip']} count={f['count']}")
                else:
                    print(f"[OK] {pred} conf={conf:.2f} dst={f['destination_ip']} count={f['count']}")

def packet_handler(pkt):
    with state_lock:
        pkt_update_state(pkt)

def main():
    global BACKEND_URL, ALERT_CONFIDENCE_THRESHOLD, INTERFACE, WINDOW_SECONDS, SEND_THRESHOLD, DEBUG

    parser = argparse.ArgumentParser()
    parser.add_argument("--iface", default=INTERFACE, help="Interface to sniff")
    parser.add_argument("--backend", default=BACKEND_URL, help="Backend analyze URL")
    parser.add_argument("--threshold", type=float, default=ALERT_CONFIDENCE_THRESHOLD, help="Alert confidence threshold")
    parser.add_argument("--window", type=int, default=WINDOW_SECONDS, help="Aggregation window seconds")
    parser.add_argument("--send-threshold", type=int, default=SEND_THRESHOLD, help="Min packets per dst to send")
    parser.add_argument("--debug", action="store_true", help="Enable debug logging (prints payloads)")
    args = parser.parse_args()

    BACKEND_URL = args.backend
    ALERT_CONFIDENCE_THRESHOLD = args.threshold
    INTERFACE = args.iface
    WINDOW_SECONDS = args.window
    SEND_THRESHOLD = args.send_threshold
    DEBUG = args.debug

    # start background flush thread
    t = threading.Thread(target=flush_worker, args=(WINDOW_SECONDS, SEND_THRESHOLD), daemon=True)
    t.start()

    print("Starting live sniffer on", INTERFACE, "-> backend:", BACKEND_URL, "window:", WINDOW_SECONDS, "send_threshold:", SEND_THRESHOLD)
    sniff(iface=INTERFACE, prn=packet_handler, store=False)

if __name__ == "__main__":
    main()
