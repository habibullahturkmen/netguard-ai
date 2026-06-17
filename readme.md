# NetGuard AI

Network intrusion detection demo: live packet capture → Express backend → FastAPI ML service → PostgreSQL → React dashboard.

## Documentation

| Doc | Contents |
|-----|----------|
| **[docs/attack-readme.md](docs/attack-readme.md)** | **Attack demos: DoS, port scan, hping3, nmap, alert chain** |
| [docs/testing-the-project.md](docs/testing-the-project.md) | Full install (Windows + Linux), train model, smoke tests |
| [docs/features-v1.md](docs/features-v1.md) | Detection capabilities and limits |

## Quick start (Linux)

After clone, you **must train the model locally** — `model.pkl` and `encoders.pkl` are not in GitHub.

```bash
# 1. Database
sudo -u postgres psql -c "CREATE USER netguard_user WITH PASSWORD 'your_password';"
sudo -u postgres psql -c "CREATE DATABASE netguard_ai OWNER netguard_user;"
psql -U netguard_user -d netguard_ai -f backend/src/db/schema.sql

# 2. ML model
cd ml-service && python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cd model && python train_real_dataset.py   # needs NSL-KDD-Train.csv

# 3. Apps
cd ../../backend && pnpm install
cd ../frontend && pnpm install
# Create backend/.env and frontend/.env — see testing doc
```

Start services (3 terminals): ML `:8000` → backend `:5000` → frontend `:5173`.

**Windows, env templates, verification steps, and hping3 tests:** see [docs/testing-the-project.md](docs/testing-the-project.md).

## Live capture (optional)

```bash
cd ml-service
sudo venv/bin/python sensors/live_sniffer.py \
  --iface wlo1 \
  --backend http://127.0.0.1:5000/api/analyze \
  --window 5 \
  --send-threshold 3
```

Replace `wlo1` with your interface (`ip link` on Linux).

## Whitelist

| Profile | `backend/.env` |
|---------|----------------|
| Local testing | `WHITELIST_ENABLED=false` |
| Production / demo | `WHITELIST_ENABLED=true` |

Restart backend after changing `.env`.

---

## Development notes

### Report statement

The Random Forest classifier was trained using a processed subset of the NSL-KDD intrusion detection dataset. The model was configured as a binary classifier, categorizing network traffic into Normal and Suspicious classes. Performance was evaluated using accuracy, precision, recall, and F1-score metrics.
