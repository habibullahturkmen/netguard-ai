# NetGuard AI — Testing the Project

Step-by-step guide to verify ML classification, rule-based DoS detection, alerts, whitelist, live capture, and **SYN flood simulation** with `hping3`.

For feature descriptions, see [features-v1.md](./features-v1.md).

---

## Prerequisites

1. PostgreSQL running + schema applied (`backend/src/db/schema.sql`)
2. `model.pkl` + `encoders.pkl` trained (`ml-service/model/train_real_dataset.py`)
3. `backend/.env`: **`WHITELIST_ENABLED=false`** for most tests (especially live capture and hping3)
4. Three terminals: ML service, backend, frontend

```bash
# Terminal 1 — ML (port 8000)
cd ml-service && source venv/bin/activate
uvicorn app:app --reload --host 127.0.0.1 --port 8000

# Terminal 2 — Backend (port 5000)
cd backend && pnpm dev

# Terminal 3 — Frontend (port 5173)
cd frontend && pnpm dev
```

Open the dashboard: `http://localhost:5173`

---

## Test 1: Normal traffic (ML path)

Use `backend/src/http/test_routes.http` or curl:

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

**Expect:** `prediction: "Normal"` (or Suspicious with low attack prob), new row on dashboard within ~5s.

---

## Test 2: Rule-based DoS (API, bypasses ML)

Simulates aggregated window stats that match the deterministic DoS rule:

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
- `"confidence": 1`
- `"model_label": "rule:detection"`
- Dashboard: Suspicious with **100.0%** attack prob

**Note:** if `WHITELIST_ENABLED=true` and destination is `192.168.1.16`, the request is skipped.

---

## Test 3: ML service directly

```bash
curl -X POST http://127.0.0.1:8000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "duration": 12,
    "protocol_type": "tcp",
    "service": "http",
    "flag": "SF",
    "src_bytes": 5000,
    "dst_bytes": 3000
  }'
```

**Expect:** JSON with `prediction`, `confidence`, `threshold`, `classes`.

---

## Test 4: Alert engine (3 consecutive suspicious)

Send the **DoS payload** from Test 2 three times to the same `destination_ip`:

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
    }' | jq '{alerted, consecutive, prediction: .insertedTraffic.prediction}'
done
```

**Expect:** on the 3rd request, `"alerted": true` and `insertedAlert` populated.

Verify in PostgreSQL:

```bash
psql -U netguard_user -d netguard_ai -c "SELECT * FROM alerts ORDER BY created_at DESC LIMIT 5;"
```

---

## Test 5: Whitelist

Set in `backend/.env`:

```env
WHITELIST_ENABLED=true
WHITELIST_PREFIXES=127.,192.168.
```

Restart the backend, then:

```bash
curl -X POST http://127.0.0.1:5000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"source_ip":"192.168.1.10","destination_ip":"192.168.1.1","protocol":"tcp","src_bytes":100}'
```

**Expect:** `{"message":"Whitelisted - ignored","destination_ip":"192.168.1.1"}` — no DB row.

Outbound to a public IP (e.g. `8.8.8.8`) should still be analyzed.

Set `WHITELIST_ENABLED=false` again before live capture or hping3 tests.

---

## Test 6: Live capture (real network)

```bash
ip link   # find your interface, e.g. wlo1 or eth0

cd ml-service
sudo venv/bin/python sensors/live_sniffer.py \
  --iface wlo1 \
  --backend http://127.0.0.1:5000/api/analyze \
  --window 5 \
  --send-threshold 3 \
  --debug
```

Browse the web or generate normal traffic. Watch terminal output:

- `[OK] Normal conf=0.12 dst=...`
- `[ALERT] Suspicious conf=0.85 dst=...` (sniffer prints when confidence ≥ 0.7)

Dashboard should update every 5 seconds.

---

## Test 7: SYN flood simulation with hping3 (live DoS test)

### Is this an attack?

**Yes.** This command is a deliberate **SYN flood / DoS simulation**:

```bash
sudo hping3 --flood --rand-source -S -p 80 192.168.1.16
```

| Flag | Meaning |
|------|---------|
| `--flood` | Send packets as fast as possible |
| `--rand-source` | Spoof random source IPs (simulates distributed sources) |
| `-S` | TCP SYN flag (connection attempts without completing handshake) |
| `-p 80` | Target port 80 |
| `192.168.1.16` | Victim host on your LAN |

This is **not** normal traffic. Use it only in a **lab you control** — your own VM, isolated network, or a target you own and have permission to stress-test. Unauthorized use against real systems may be illegal.

### Why NetGuard should detect it

If the live sniffer sees this traffic, aggregated windows toward `192.168.1.16` should show:

- **High `count`** (`--flood`)
- **High `serror_rate`** (many SYNs, few SYN-ACKs)
- **High `dst_host_count`** (`--rand-source` → many unique spoofed sources)

That matches the backend’s **rule-based DoS** thresholds (`count ≥ 200`, `serror_rate ≥ 0.8`, `dst_host_count ≥ 50`).

### Setup

1. All services running (ML, backend, frontend)
2. `WHITELIST_ENABLED=false` in `backend/.env` (destination `192.168.1.16` must not be skipped)
3. Live sniffer running on the interface that sees traffic **to** `192.168.1.16`
4. Target `192.168.1.16` must exist on your network (VM or spare machine). If it does not, pick an IP you control and use it consistently.

### Run the test

**Terminal A — sniffer:**

```bash
cd ml-service
sudo venv/bin/python sensors/live_sniffer.py \
  --iface wlo1 \
  --backend http://127.0.0.1:5000/api/analyze \
  --window 5 \
  --send-threshold 3 \
  --debug
```

**Terminal B — flood (short burst, then Ctrl+C):**

```bash
sudo hping3 --flood --rand-source -S -p 80 192.168.1.16
```

Run for **10–30 seconds**, then stop with `Ctrl+C`.

### What to expect

**Sniffer terminal:**

- `[ALERT] Suspicious conf=1.00 dst=192.168.1.16 count=...` (rule path → confidence 1.0)

**Dashboard:**

- New rows for destination `192.168.1.16`
- Prediction **Suspicious**, attack prob **100%**

**After ~3 suspicious windows (15+ seconds of sustained flood):**

- API responses may include `"alerted": true`
- Row in `alerts` table:

```bash
psql -U netguard_user -d netguard_ai \
  -c "SELECT destination_ip, confidence, created_at FROM alerts ORDER BY created_at DESC LIMIT 5;"
```

### Troubleshooting

| Issue | Check |
|-------|--------|
| No sniffer output | Wrong `--iface`; sniffer must see packets to `.16` |
| Whitelisted / ignored | `WHITELIST_ENABLED=false` |
| Normal instead of Suspicious | Flood too short; need ≥3 packets/window and rule thresholds in one window |
| Target unreachable | `192.168.1.16` must be on your LAN; ping it first |
| hping3 not installed | `sudo apt install hping3` (Debian/Ubuntu) |

### Cleanup

Stop hping3 with `Ctrl+C`. The flood can disrupt the target host’s network stack temporarily — use a disposable VM if possible.

---

## Test 8: Fetch logs API

```bash
curl http://127.0.0.1:5000/api/logs | jq '.[0:3]'
```

---

## Suggested demo order

1. Start ML, backend, frontend → open dashboard
2. **Test 1** — normal curl → Normal in UI
3. **Test 2** — DoS curl → Suspicious at 100%
4. **Test 4** — DoS curl ×3 → `alerted: true` / `alerts` table
5. **Test 6** — live sniffer → browse → logs appear
6. **Test 7** — hping3 SYN flood → Suspicious + optional alert (lab only)
7. **Test 5** (optional) — enable whitelist → LAN destination skipped

---

## Related files

- HTTP examples: `backend/src/http/test_routes.http`
- Demo payloads: `ml-service/docs/demo_requests.json`
- Setup: [readme.md](../readme.md)
