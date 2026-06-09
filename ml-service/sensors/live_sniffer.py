#!/usr/bin/env python3
"""
Live packet sniffer that sends events to backend /api/analyze.

Usage:
  sudo ./sensors/live_sniffer.py --iface wlo1 --backend http://127.0.0.1:5000/api/analyze
  (or) sudo venv/bin/python sensors/live_sniffer.py ...
"""

import time
import argparse
import json
import requests
from scapy.all import sniff, IP, TCP, UDP

# Configure defaults (module-level)
BACKEND_URL = "http://127.0.0.1:5000/api/analyze"  # change to your backend host:port
ML_TIMEOUT = 3
ALERT_CONFIDENCE_THRESHOLD = 0.7
INTERFACE = "eth0"  # change to your interface, e.g., wlo1

PORT_TO_SERVICE = {
    80: "http", 443: "https", 53: "domain", 22: "ssh", 25: "smtp",
    123: "ntp", 161: "snmp", 3306: "mysql"
}


def pkt_to_event(pkt):
    """Extract a minimal set of fields matching backend /api/analyze contract."""
    src_ip = None
    dst_ip = None
    proto = "other"
    src_port = None
    dst_port = None
    src_bytes = 0
    dst_bytes = 0
    duration = 0.0
    flag = "SF"

    if IP in pkt:
        src_ip = pkt[IP].src
        dst_ip = pkt[IP].dst
        src_bytes = len(pkt)
        dst_bytes = 0

        if TCP in pkt:
            proto = "tcp"
            src_port = pkt[TCP].sport
            dst_port = pkt[TCP].dport
        elif UDP in pkt:
            proto = "udp"
            src_port = pkt[UDP].sport
            dst_port = pkt[UDP].dport
        else:
            proto = "ip"

    service = PORT_TO_SERVICE.get(dst_port, "other")

    event = {
        "source_ip": src_ip,
        "destination_ip": dst_ip,
        "protocol": proto,
        "service": service,
        "flag": flag,
        "duration": duration,
        "src_bytes": src_bytes,
        "dst_bytes": dst_bytes,
    }
    return event


def send_to_backend(event):
    """Send event to backend /api/analyze with simple retry."""
    headers = {"Content-Type": "application/json"}
    for attempt in range(3):
        try:
            resp = requests.post(BACKEND_URL, json=event, timeout=ML_TIMEOUT)
            if resp.status_code in (200, 201):
                return resp.json()
            else:
                print(f"[WARN] backend returned {resp.status_code}: {resp.text}")
        except requests.exceptions.RequestException as e:
            print(f"[WARN] send attempt {attempt+1} failed: {e}")
            time.sleep(0.5)
    return None


def handle_packet(pkt):
    if not IP in pkt:
        return
    ev = pkt_to_event(pkt)
    result = send_to_backend(ev)
    if result:
        ml = result.get("ml", {})
        pred = ml.get("prediction", "<no-pred>")
        conf = float(ml.get("confidence", 0))
        if pred == "Suspicious" and conf >= ALERT_CONFIDENCE_THRESHOLD:
            print(f"[ALERT] {pred} conf={conf:.2f} src={ev['source_ip']} dst={ev['destination_ip']} svc={ev['service']}")
        else:
            print(f"[OK] {pred} conf={conf:.2f} svc={ev['service']} src_bytes={ev['src_bytes']}")
    else:
        print("[ERROR] failed to store/score event")


def main():
    # Declare globals BEFORE any use of these names in this function.
    global BACKEND_URL, ALERT_CONFIDENCE_THRESHOLD, INTERFACE

    parser = argparse.ArgumentParser()
    parser.add_argument("--iface", default=INTERFACE, help="Interface to sniff (default eth0)")
    parser.add_argument("--backend", default=BACKEND_URL, help="Backend analyze URL")
    parser.add_argument("--threshold", type=float, default=ALERT_CONFIDENCE_THRESHOLD)
    args = parser.parse_args()

    # Apply parsed values to globals
    BACKEND_URL = args.backend
    ALERT_CONFIDENCE_THRESHOLD = args.threshold

    print("Starting live sniffer on", args.iface, "-> backend:", BACKEND_URL)
    try:
        sniff(iface=args.iface, prn=handle_packet, store=False)
    except PermissionError:
        print("PermissionError: you must run as root or grant CAP_NET_RAW to the python binary.")
    except Exception as e:
        print("Sniffer error:", e)


if __name__ == "__main__":
    main()
