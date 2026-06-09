#!/usr/bin/env python3
"""
Flow/window aggregator: group packets by destination IP over a time window,
build approximate KDD-style features and POST to backend /api/analyze.

Usage (example):
  sudo venv/bin/python sensors/flow_aggregator.py --iface wlo1 --backend http://127.0.0.1:5000/api/analyze --window 5
"""

import time
import argparse
import threading
import requests
from collections import defaultdict, Counter
from scapy.all import sniff, IP, TCP, UDP

DEFAULT_BACKEND = "http://127.0.0.1:5000/api/analyze"

PORT_TO_SERVICE = {
    80: "http", 443: "https", 53: "domain", 22: "ssh", 25: "smtp",
    123: "ntp", 161: "snmp", 3306: "mysql"
}


class WindowAggregator:
    def __init__(self, backend, window=5, threshold_send=1):
        self.backend = backend
        self.window = window
        self.lock = threading.Lock()
        self.reset()
        self.threshold_send = threshold_send

    def reset(self):
        # Map dest_ip -> stats
        self.stats = defaultdict(lambda: {
            "count": 0,
            "srv_count": 0,
            "src_bytes": 0,
            "dst_bytes": 0,
            "unique_src_ips": set(),
            "unique_dst_ports": set(),
            "syn_count": 0,
            "syn_ack_count": 0,
            "flags_counter": Counter(),
            "last_src": None,
        })

    def add_packet(self, pkt):
        if not IP in pkt:
            return
        dst = pkt[IP].dst
        src = pkt[IP].src
        entry = self.stats[dst]
        entry["count"] += 1
        entry["unique_src_ips"].add(src)
        length = len(pkt)
        entry["src_bytes"] += length  # approximate
        # dst_bytes unknown from single direction packet; keep 0
        # ports / service
        dport = None
        sport = None
        if TCP in pkt:
            dport = pkt[TCP].dport
            sport = pkt[TCP].sport
            flags = pkt[TCP].flags
            entry["flags_counter"][str(flags)] += 1
            # detect SYN flag (S) vs SYN-ACK (SA)
            fstr = str(flags)
            if "S" in fstr and "A" not in fstr:
                entry["syn_count"] += 1
            if "S" in fstr and "A" in fstr:
                entry["syn_ack_count"] += 1
        elif UDP in pkt:
            dport = pkt[UDP].dport
            sport = pkt[UDP].sport

        if dport:
            entry["unique_dst_ports"].add(dport)
            service = PORT_TO_SERVICE.get(dport)
            if service:
                entry["srv_count"] += 1
        entry["last_src"] = src

    def compute_features_for_dst(self, dst, stat):
        count = stat["count"]
        srv_count = stat["srv_count"]
        src_bytes = stat["src_bytes"]
        dst_bytes = stat["dst_bytes"]
        unique_src_count = len(stat["unique_src_ips"])
        unique_dst_ports = len(stat["unique_dst_ports"])
        syn = stat["syn_count"]
        syn_ack = stat["syn_ack_count"]

        # approximate rates
        serror_rate = 0.0
        if count > 0:
            # define serror as many SYNs without corresponding SYN-ACKs
            serror_rate = max(0.0, (syn - syn_ack) / max(1, count))
        srv_serror_rate = serror_rate
        rerror_rate = 0.0
        srv_rerror_rate = 0.0
        same_srv_rate = (srv_count / count) if count else 0.0
        diff_srv_rate = 1.0 - same_srv_rate
        srv_diff_host_rate = 0.0

        # dst_host_* approximations (we aggregate per dest host so dst_host_count =
        # number of unique sources contacting this dest recently)
        dst_host_count = unique_src_count
        dst_host_srv_count = unique_src_count
        dst_host_same_srv_rate = 0.0
        dst_host_diff_srv_rate = 0.0
        dst_host_same_src_port_rate = 0.0
        dst_host_srv_diff_host_rate = 0.0
        dst_host_serror_rate = serror_rate
        dst_host_srv_serror_rate = serror_rate
        dst_host_rerror_rate = 0.0
        dst_host_srv_rerror_rate = 0.0

        features = {
            # Basic fields used by model/back-end
            "duration": float(self.window),
            "protocol_type": "tcp",  # aggregated; could be mixed
            "service": "other",
            "flag": "SF",
            "src_bytes": src_bytes,
            "dst_bytes": dst_bytes,

            # Behavioral features (approx)
            "count": count,
            "srv_count": srv_count,
            "serror_rate": round(serror_rate, 3),
            "srv_serror_rate": round(srv_serror_rate, 3),
            "rerror_rate": rerror_rate,
            "srv_rerror_rate": srv_rerror_rate,
            "same_srv_rate": round(same_srv_rate, 3),
            "diff_srv_rate": round(diff_srv_rate, 3),
            "srv_diff_host_rate": srv_diff_host_rate,

            "dst_host_count": dst_host_count,
            "dst_host_srv_count": dst_host_srv_count,
            "dst_host_same_srv_rate": dst_host_same_srv_rate,
            "dst_host_diff_srv_rate": dst_host_diff_srv_rate,
            "dst_host_same_src_port_rate": dst_host_same_src_port_rate,
            "dst_host_srv_diff_host_rate": dst_host_srv_diff_host_rate,
            "dst_host_serror_rate": dst_host_serror_rate,
            "dst_host_srv_serror_rate": dst_host_srv_serror_rate,
            "dst_host_rerror_rate": dst_host_rerror_rate,
            "dst_host_srv_rerror_rate": dst_host_srv_rerror_rate,
        }

        # include example metadata for backend
        features["destination_ip"] = dst
        features["source_ip"] = stat["last_src"]
        # choose service string if unique dst port set
        if stat["unique_dst_ports"]:
            port = next(iter(stat["unique_dst_ports"]))
            features["service"] = PORT_TO_SERVICE.get(port, "other")

        return features

    def flush_window(self):
        with self.lock:
            if not self.stats:
                return
            to_send = []
            for dst, stat in list(self.stats.items()):
                if stat["count"] >= self.threshold_send:
                    features = self.compute_features_for_dst(dst, stat)
                    to_send.append(features)
            # reset stats now (start next window)
            self.reset()
        # send outside lock
        for f in to_send:
            try:
                r = requests.post(self.backend, json=f, timeout=3)
                if r.status_code in (200, 201):
                    print(f"[SENT] dst={f.get('destination_ip')} count={f['count']} -> {r.status_code}")
                else:
                    print(f"[WARN] backend returned {r.status_code}: {r.text}")
            except Exception as e:
                print(f"[ERROR] failed to send to backend: {e}")

    def start_periodic_flush(self):
        def loop():
            while True:
                time.sleep(self.window)
                self.flush_window()
        t = threading.Thread(target=loop, daemon=True)
        t.start()


def packet_handler(pkt, aggregator):
    try:
        aggregator.add_packet(pkt)
    except Exception as e:
        print("pkt handle err", e)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--iface", default="eth0")
    parser.add_argument("--backend", default=DEFAULT_BACKEND)
    parser.add_argument("--window", type=int, default=5, help="window seconds")
    parser.add_argument("--threshold", type=int, default=5, help="min count to send")
    args = parser.parse_args()

    agg = WindowAggregator(backend=args.backend, window=args.window, threshold_send=args.threshold)
    agg.start_periodic_flush()
    print("Flow aggregator running on iface", args.iface, "window", args.window, "-> backend", args.backend)
    sniff(iface=args.iface, prn=lambda p: packet_handler(p, agg), store=False)


if __name__ == "__main__":
    main()
