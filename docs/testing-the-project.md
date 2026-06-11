# NetGuard AI — Testing the Project

Step-by-step guide: **install → train model → configure → run services → test** ML classification, rule-based DoS detection, alerts, whitelist, live capture, and SYN flood simulation.

For feature descriptions, see [features-v1.md](./features-v1.md).

---

## What is not in the GitHub repo

These files are **gitignored** or must be created locally after clone:

| File / artifact | Location | How to get it |
|-----------------|----------|---------------|
| `model.pkl` | `ml-service/model/` | Run `train_real_dataset.py` (see below) |
| `encoders.pkl` | `ml-service/model/` | Run `train_real_dataset.py` (see below) |
| `backend/.env` | `backend/` | Create from template in this doc (not committed) |
| `frontend/.env` | `frontend/` | Create from template in this doc (not committed) |
| Python `venv/` | `ml-service/` | Create with `python -m venv venv` |
| `node_modules/` | `backend/`, `frontend/` | `pnpm install` |

**`NSL-KDD-Train.csv`** may or may not be in your clone (large dataset). If missing, download an NSL-KDD training CSV and save it as `ml-service/model/NSL-KDD-Train.csv` before training.

The ML service **will not start** without `model.pkl` and `encoders.pkl`.

---

## Required software

| Tool | Version | Used for |
|------|---------|----------|
| **Git** | any | Clone repo |
| **Python** | 3.10+ | ML service, live sniffer |
| **Node.js** | 18+ | Backend, frontend |
| **pnpm** | 8+ | Package manager (`npm install -g pnpm`) |
| **PostgreSQL** | 14+ | Traffic logs + alerts |
| **curl** | any | API tests (or PowerShell on Windows) |

**Linux only (optional tests):**

| Tool | Used for |
|------|----------|
| **hping3** | Test 7 — SYN flood simulation |
| **jq** | Pretty-print JSON in terminal |

**Windows live capture (optional):**

| Tool | Used for |
|------|----------|
| **Npcap** | Packet capture for Scapy ([npcap.com](https://npcap.com/)) |
| **WSL2** | Recommended for hping3 and easier sniffer testing |

---

## Installation & setup

### Linux (Debian / Ubuntu)

#### 1. Clone the repository

```bash
git clone <your-repo-url> netguard-ai
cd netguard-ai
```

#### 2. Install system packages

```bash
sudo apt update
sudo apt install -y python3 python3-venv python3-pip postgresql postgresql-contrib curl jq
```

Optional (for Test 7):

```bash
sudo apt install -y hping3
```

Install Node.js 18+ and pnpm if not already installed:

```bash
# Node via nvm or nodesource — then:
npm install -g pnpm
```

#### 3. PostgreSQL — create database and user

```bash
sudo -u postgres psql <<'EOF'
CREATE USER netguard_user WITH PASSWORD 'your_password';
CREATE DATABASE netguard_ai OWNER netguard_user;
EOF

psql -U netguard_user -d netguard_ai -f backend/src/db/schema.sql
```

#### 4. Python ML environment

```bash
cd ml-service
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

#### 5. Train the model (required — artifacts not on GitHub)

```bash
cd model

# If NSL-KDD-Train.csv is missing, download NSL-KDD and place it here as NSL-KDD-Train.csv
ls NSL-KDD-Train.csv   # must exist

python train_real_dataset.py
```

Verify artifacts were created:

```bash
ls -lh model.pkl encoders.pkl feature_schema.json
```

Expected: two `.pkl` files (~1–8 MB each depending on dataset).

Do **not** use `train_sample.py` for this project — it only trains 3 features and breaks `app.py`.

#### 6. Backend and frontend dependencies

```bash
cd ../../backend
pnpm install

cd ../frontend
pnpm install
```

#### 7. Environment files

**`backend/.env`:**

```env
PORT=5000
ML_SERVICE_URL=http://127.0.0.1:8000
DB_HOST=localhost
DB_PORT=5432
DB_USER=netguard_user
DB_PASSWORD=your_password
DB_NAME=netguard_ai

CAPTURE_INTERFACE=wlo1
API_URL=http://localhost:5000

ALERT_CONSECUTIVE=3
ALERT_COOLDOWN=300
MIN_COUNT=3
MIN_DST_HOST_COUNT=5
MIN_SERROR_RATE=0.3
ML_THRESHOLD=0.40

WHITELIST_ENABLED=false
WHITELIST_PREFIXES=127.,192.168.
```

**`frontend/.env`:**

```env
VITE_API_URL=http://localhost:5000
```

Find your network interface for live capture:

```bash
ip link
# common names: wlo1 (Wi‑Fi), eth0 (Ethernet)
```

Set `CAPTURE_INTERFACE` in `backend/.env` and use the same name with `--iface` for the sniffer.

---

### Windows

#### 1. Clone the repository

```powershell
git clone <your-repo-url> netguard-ai
cd netguard-ai
```

#### 2. Install software

Install manually or via winget/chocolatey:

- [Python 3.10+](https://www.python.org/downloads/) — check **“Add Python to PATH”**
- [Node.js 18+](https://nodejs.org/)
- [PostgreSQL](https://www.postgresql.org/download/windows/)
- [Npcap](https://npcap.com/) — required only for live packet capture (Test 6)
- pnpm: `npm install -g pnpm`

Optional: install **WSL2** (Ubuntu) for hping3 and Linux-style sniffer tests (Test 7).

#### 3. PostgreSQL — create database and user

Open **pgAdmin** or `psql` from the PostgreSQL bin folder:

```sql
CREATE USER netguard_user WITH PASSWORD 'your_password';
CREATE DATABASE netguard_ai OWNER netguard_user;
```

Apply schema (adjust path to your clone):

```powershell
psql -U netguard_user -d netguard_ai -f backend\src\db\schema.sql
```

#### 4. Python ML environment

```powershell
cd ml-service
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

#### 5. Train the model (required — artifacts not on GitHub)

```powershell
cd model

# Place NSL-KDD-Train.csv in this folder if not present
dir NSL-KDD-Train.csv

python train_real_dataset.py
```

Verify:

```powershell
dir model.pkl, encoders.pkl, feature_schema.json
```

#### 6. Backend and frontend dependencies

```powershell
cd ..\..\backend
pnpm install

cd ..\frontend
pnpm install
```

#### 7. Environment files

Create `backend\.env` and `frontend\.env` with the same content as the Linux section above.

For live capture on Windows, find interface names with Python (run as Administrator):

```powershell
cd ml-service
venv\Scripts\activate
python -c "from scapy.all import get_if_list; print(get_if_list())"
```

Use the interface name with `--iface` (often `\Device\NPF_{...}`).

**Windows notes:**

| Feature | Native Windows | WSL2 (recommended) |
|---------|----------------|---------------------|
| API tests (Tests 1–5, 8) | PowerShell / curl | Same as Linux |
| Live sniffer (Test 6) | Admin + Npcap | `sudo` in WSL on bridged adapter |
| hping3 flood (Test 7) | Not available natively | `sudo apt install hping3` in WSL |

---

## Prerequisites checklist (before testing)

Complete every item before running tests:

- [ ] Repo cloned
- [ ] PostgreSQL running; `netguard_ai` database exists
- [ ] Schema applied (`backend/src/db/schema.sql`)
- [ ] `backend/.env` and `frontend/.env` created with correct DB password
- [ ] `ml-service/venv` created; `pip install -r requirements.txt` done
- [ ] **`model.pkl` and `encoders.pkl` exist** in `ml-service/model/` (trained locally)
- [ ] `backend` and `frontend` — `pnpm install` done
- [ ] **`WHITELIST_ENABLED=false`** for initial testing
- [ ] Ports **8000**, **5000**, **5173** are free

---

## Verify setup (smoke tests)

Run these **before** the full test suite.

### 1. ML service loads model

**Linux:**

```bash
cd ml-service
source venv/bin/activate
uvicorn app:app --host 127.0.0.1 --port 8000
```

**Windows:**

```powershell
cd ml-service
venv\Scripts\activate
uvicorn app:app --host 127.0.0.1 --port 8000
```

**Expect:** server starts with no `FileNotFoundError` for `model.pkl`. Open `http://127.0.0.1:8000/docs`.

**Fail?** → Train model (Setup step 5). Missing `encoders.pkl` → re-run `train_real_dataset.py`.

### 2. ML predict endpoint

```bash
curl -X POST http://127.0.0.1:8000/predict \
  -H "Content-Type: application/json" \
  -d '{"duration":12,"protocol_type":"tcp","service":"http","flag":"SF","src_bytes":5000,"dst_bytes":3000}'
```

**Expect:** JSON with `"prediction"`, `"confidence"`, `"threshold"`.

### 3. Backend connects to DB + ML

**Linux / Windows (new terminal):**

```bash
cd backend
pnpm dev
```

**Expect:** `Server running on port 5000` with no PostgreSQL connection errors.

### 4. Frontend loads logs

**Linux / Windows (new terminal):**

```bash
cd frontend
pnpm dev
```

Open `http://localhost:5173` — empty dashboard is OK if no logs yet.

### 5. End-to-end analyze

With ML + backend running:

```bash
curl -X POST http://127.0.0.1:5000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"source_ip":"192.168.1.10","destination_ip":"8.8.8.8","protocol":"tcp","service":"http","flag":"SF","duration":12,"src_bytes":5000,"dst_bytes":3000}'
```

**Expect:** `"message":"analyzed"` and `insertedTraffic` in the response. Row appears on dashboard within ~5s.

---

## Start all services (daily workflow)

Use **three terminals** (four if running live sniffer).

**Linux:**

```bash
# Terminal 1 — ML (port 8000)
cd ml-service && source venv/bin/activate
uvicorn app:app --reload --host 127.0.0.1 --port 8000

# Terminal 2 — Backend (port 5000)
cd backend && pnpm dev

# Terminal 3 — Frontend (port 5173)
cd frontend && pnpm dev
```

**Windows:**

```powershell
# Terminal 1 — ML
cd ml-service
venv\Scripts\activate
uvicorn app:app --reload --host 127.0.0.1 --port 8000

# Terminal 2 — Backend
cd backend
pnpm dev

# Terminal 3 — Frontend
cd frontend
pnpm dev
```

Dashboard: `http://localhost:5173`

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

Same as smoke test #2 above. Confirms model + encoders work independently of the backend.

---

## Test 4: Alert engine (3 consecutive suspicious)

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
    }' | jq '{alerted, consecutive, prediction: .insertedTraffic.prediction}'
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

Set `WHITELIST_ENABLED=false` again before live capture or hping3 tests.

---

## Test 6: Live capture (real network)

**Linux:**

```bash
ip link   # find interface: wlo1, eth0, etc.

cd ml-service
source venv/bin/activate
sudo venv/bin/python sensors/live_sniffer.py \
  --iface wlo1 \
  --backend http://127.0.0.1:5000/api/analyze \
  --window 5 \
  --send-threshold 3 \
  --debug
```

**Windows (Administrator PowerShell + Npcap):**

```powershell
cd ml-service
venv\Scripts\activate
python sensors/live_sniffer.py --iface "YOUR_INTERFACE" --backend http://127.0.0.1:5000/api/analyze --window 5 --send-threshold 3 --debug
```

Browse the web or generate normal traffic. Watch terminal:

- `[OK] Normal conf=0.12 dst=...`
- `[ALERT] Suspicious conf=0.85 dst=...` (when confidence ≥ 0.7)

Dashboard updates every 5 seconds.

---

## Test 7: SYN flood simulation with hping3 (live DoS test)

**Linux / WSL only.** Not available on native Windows without WSL.

### Is this an attack?

**Yes.** Deliberate SYN flood / DoS simulation:

```bash
sudo hping3 --flood --rand-source -S -p 80 192.168.1.16
```

Use only on a **lab network you control**. Unauthorized use may be illegal.

### Setup

1. All services running (ML, backend, frontend)
2. `WHITELIST_ENABLED=false`
3. Live sniffer on the interface that sees traffic to `192.168.1.16`
4. Target host exists on your LAN (or use an IP you control)

### Run

**Terminal A — sniffer** (same as Test 6).

**Terminal B — flood (10–30 s, then Ctrl+C):**

```bash
sudo hping3 --flood --rand-source -S -p 80 192.168.1.16
```

### Expect

- Sniffer: `[ALERT] Suspicious conf=1.00 dst=192.168.1.16`
- Dashboard: Suspicious, 100% attack prob
- After ~3 windows: `"alerted": true` in API / row in `alerts` table

Install hping3: `sudo apt install hping3`

---

## Test 8: Fetch logs API

```bash
curl http://127.0.0.1:5000/api/logs | jq '.[0:3]'
```

---

## Suggested demo order

1. Complete **Prerequisites checklist** and **Verify setup**
2. Start ML, backend, frontend → open dashboard
3. **Test 1** — normal curl → Normal in UI
4. **Test 2** — DoS curl → Suspicious at 100%
5. **Test 4** — DoS curl ×3 → `alerted: true` / `alerts` table
6. **Test 6** — live sniffer → browse → logs appear
7. **Test 7** — hping3 SYN flood (Linux/WSL lab only)
8. **Test 5** (optional) — enable whitelist → LAN destination skipped

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `FileNotFoundError: model.pkl` | Run `train_real_dataset.py` in `ml-service/model/` |
| `NSL-KDD-Train.csv` not found | Download NSL-KDD; save as `ml-service/model/NSL-KDD-Train.csv` |
| ML service crashes on start | Check both `model.pkl` and `encoders.pkl` exist |
| Backend `ECONNREFUSED` to ML | Start ML service on port 8000; check `ML_SERVICE_URL` |
| Backend DB error | PostgreSQL running? Password in `backend/.env` correct? Schema applied? |
| Empty dashboard | Backend running? `VITE_API_URL=http://localhost:5000` in `frontend/.env`? |
| Sniffer permission denied (Linux) | Use `sudo` |
| Sniffer no packets (Windows) | Run as Administrator; install Npcap; correct `--iface` |
| hping3 not found (Windows) | Use WSL2 or skip Test 7 |

---

## Related files

- HTTP examples: `backend/src/http/test_routes.http`
- Demo payloads: `ml-service/docs/demo_requests.json`
- Features: [features-v1.md](./features-v1.md)
- Quick overview: [readme.md](../readme.md)
