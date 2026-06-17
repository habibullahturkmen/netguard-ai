# NetGuard AI — Attack Testing Guide

Lab-only attack simulations for demos. Run only on networks and hosts **you own or control**.

**Setup first:** [testing-the-project.md](./testing-the-project.md)

**After code update:** apply DB migration:

```bash
psql -U netguard_user -d netguard_ai -f backend/src/db/migrate_attack_type.sql
```

---

## Detection summary

| Attack | Method | `attack_type` | `prediction` |
|--------|--------|---------------|--------------|
| Normal traffic | Browse / curl Test 1 | `none` | Normal |
| DoS / SYN flood | curl Test 2, hping3 live | `dos` | Suspicious |
| Port scan | curl Test 3, nmap live | `port_scan` | Suspicious |
| ML anomaly | Unusual feature patterns | `ml_anomaly` | Suspicious |
| Alert | 3 consecutive suspicious windows | shown in **Alerts** panel | Suspicious |

**Rules (defaults):**

| Rule | Conditions |
|------|------------|
| **DoS** | `count ≥ 200` AND `serror_rate ≥ 0.8` AND `dst_host_count ≥ 50` |
| **Port scan** | `count ≥ 50` AND `unique_dport_count ≥ 20` |

Tune via `backend/.env`: `DOS_*`, `SCAN_COUNT_THRESHOLD`, `SCAN_UNIQUE_DPORT_THRESHOLD`.

---

## Before every demo

```env
# backend/.env
WHITELIST_ENABLED=false
```

Start all services (ML `:8000`, backend `:5000`, frontend `:5173`).

---

## Test 1 — Normal traffic (baseline)

**Goal:** Confirm ML path and dashboard logging.

```bash
curl -X POST http://127.0.0.1:5000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "source_ip": "192.168.1.10",
    "destination_ip": "8.8.8.8",
    "protocol": "tcp",
    "service": "http",
    "flag": "SF",
    "duration": 12,
    "src_bytes": 5000,
    "dst_bytes": 3000
  }'
```

**Expect:**

- `"prediction": "Normal"`
- `"attack_type": "none"`
- Dashboard **Traffic Logs** row within ~5s

**Live variant:** run sniffer, browse for 2 minutes → mostly Normal rows.

---

## Test 2 — DoS rule (curl, no tools)

**Goal:** Deterministic DoS detection without hping3.

```bash
curl -X POST http://127.0.0.1:5000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "destination_ip": "192.168.1.16",
    "source_ip": "192.168.2.14",
    "duration": 5.0,
    "protocol": "tcp",
    "service": "other",
    "flag": "SF",
    "src_bytes": 0,
    "dst_bytes": 0,
    "count": 200,
    "srv_count": 200,
    "serror_rate": 0.95,
    "dst_host_count": 180
  }'
```

**Expect:**

- `"prediction": "Suspicious"`
- `"attack_type": "dos"`
- `"attack_type_label": "DoS"`
- `"confidence": 1`
- Dashboard: **Attack Type = DoS**, **100%** attack prob

Also in `backend/src/http/test_routes.http`.

---

## Test 3 — Port scan rule (curl, no tools)

**Goal:** Port scan detection without nmap.

```bash
curl -X POST http://127.0.0.1:5000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "destination_ip": "192.168.1.20",
    "source_ip": "192.168.1.10",
    "duration": 5.0,
    "protocol": "tcp",
    "service": "other",
    "flag": "REJ",
    "count": 80,
    "unique_dport_count": 25
  }'
```

**Expect:**

- `"attack_type": "port_scan"`
- `"attack_type_label": "Port Scan"`
- Dashboard: **Attack Type = Port Scan**

---

## Test 4 — DoS live (hping3 SYN flood)

**Goal:** Live capture + DoS rule on real packets.

**Linux / WSL only.** Lab network only.

**Terminal A — sniffer:**

```bash
cd ml-service
source venv/bin/activate
sudo venv/bin/python sensors/live_sniffer.py \
  --iface wlo1 \
  --backend http://127.0.0.1:5000/api/analyze \
  --window 5 \
  --send-threshold 3 \
  --debug
```

**Terminal B — flood (10–30 s, then Ctrl+C):**

```bash
sudo hping3 --flood --rand-source -S -p 80 192.168.1.16
```

**Expect:**

- Sniffer: `[ALERT] Suspicious type=DoS conf=1.00 dst=192.168.1.16`
- Dashboard: Attack Type **DoS**, 100% prob

Replace `192.168.1.16` with a target you control. Replace `wlo1` with your interface.

---

## Test 5 — Port scan live (nmap)

**Goal:** Live port scan detected by rule (many distinct ports in 5s window).

**Terminal A — sniffer** (same as Test 4).

**Terminal B — scan:**

```bash
nmap -sS -p 1-1000 192.168.1.16
```

Use the sniffer host’s view of traffic to the target. Scan a host on your LAN from another machine, or scan localhost if sniffer sees loopback traffic.

**Expect:**

- Sniffer: `type=Port Scan` when window has ≥50 packets and ≥20 unique ports
- Dashboard: Attack Type **Port Scan**

If not triggered, scan more ports faster (`-p 1-5000`) or lower thresholds in `.env`:

```env
SCAN_COUNT_THRESHOLD=30
SCAN_UNIQUE_DPORT_THRESHOLD=15
```

---

## Test 6 — Normal live (false-positive check)

**Goal:** Confirm browsing does not flood alerts.

1. Start sniffer + dashboard
2. Browse web normally for **2 minutes**
3. Check dashboard

**Expect:** Mostly **Normal** / attack type **—**, few or no alerts.

---

## Test 7 — Alert chain (3× DoS curl)

**Goal:** Consecutive suspicious windows create an **Alert** (visible on dashboard).

**Linux / macOS:**

```bash
for i in 1 2 3; do
  curl -s -X POST http://127.0.0.1:5000/api/analyze \
    -H "Content-Type: application/json" \
    -d '{
      "destination_ip": "10.0.0.99",
      "source_ip": "192.168.2.14",
      "protocol": "tcp",
      "service": "other",
      "count": 200,
      "serror_rate": 0.95,
      "dst_host_count": 180
    }' | jq '{alerted, consecutive, attack_type, attack_type_label}'
done
```

**Windows PowerShell:**

```powershell
1..3 | ForEach-Object {
  Invoke-RestMethod -Method Post -Uri http://127.0.0.1:5000/api/analyze `
    -ContentType "application/json" `
    -Body '{"destination_ip":"10.0.0.99","source_ip":"192.168.2.14","protocol":"tcp","service":"other","count":200,"serror_rate":0.95,"dst_host_count":180}'
}
```

**Expect:**

- 3rd response: `"alerted": true`
- Dashboard **Alerts** panel: new row, Attack Type **DoS**
- API: `GET http://127.0.0.1:5000/api/alerts`

**SQL check:**

```bash
psql -U netguard_user -d netguard_ai \
  -c "SELECT id, destination_ip, attack_type, confidence, created_at FROM alerts ORDER BY created_at DESC LIMIT 5;"
```

---

## Suggested demo order (5 min)

| Step | Test | Show on screen |
|------|------|----------------|
| 1 | Test 1 curl | Normal log |
| 2 | Test 2 curl | DoS + Attack Type column |
| 3 | Test 3 curl | Port Scan row |
| 4 | Test 7 ×3 curl | **Alerts** panel fills |
| 5 | Test 4 hping3 OR Test 5 nmap | Live sniffer terminal + dashboard updating |
| 6 | Test 6 browse | Mostly Normal |

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `column "attack_type" does not exist` | Run `migrate_attack_type.sql` |
| Port scan not detected live | More ports / faster scan; lower `SCAN_*` thresholds |
| DoS curl works, hping3 does not | Wrong `--iface`; sniffer must see flood packets |
| Whitelisted / ignored | `WHITELIST_ENABLED=false` |
| No alerts | Same `destination_ip` 3×; check `ALERT_CONSECUTIVE=3` |
| Alerts panel empty but SQL has rows | Restart backend; refresh dashboard |

---

## Related files

- HTTP examples: `backend/src/http/test_routes.http`
- Features: [features-v1.md](./features-v1.md)
- Full setup: [testing-the-project.md](./testing-the-project.md)
