# NetGuard AI

Network intrusion detection demo: live packet capture → Express backend → FastAPI ML service → PostgreSQL → React dashboard.

## Setup

### 1. Train the ML model (required on fresh clone)

Model artifacts (`model.pkl`, `encoders.pkl`) are gitignored. Generate them before starting the ML service:

```bash
cd ml-service
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

cd model
# Place NSL-KDD-Train.csv in this directory, then:
python train_real_dataset.py
```

Do **not** use `train_sample.py` for production — it trains on 3 features only and is incompatible with `app.py`. Use `train_real_dataset.py`.

### 2. PostgreSQL

Create the database and apply the schema:

```bash
psql -U postgres -c "CREATE USER netguard_user WITH PASSWORD 'your_password';"
psql -U postgres -c "CREATE DATABASE netguard_ai OWNER netguard_user;"
psql -U netguard_user -d netguard_ai -f backend/src/db/schema.sql
```

Configure environment variables in `backend/.env` and `frontend/.env` (see existing files for required keys).

### 3. Start services

**ML service** (port 8000):

```bash
cd ml-service
source venv/bin/activate
uvicorn app:app --reload --host 127.0.0.1 --port 8000
```

**Backend** (port 5000):

```bash
cd backend
pnpm install
pnpm dev
```

**Frontend** (port 5173):

```bash
cd frontend
pnpm install
pnpm dev
```

Open the dashboard at `http://localhost:5173`.

### 4. Live capture (optional, requires root)

```bash
cd ml-service
sudo venv/bin/python sensors/live_sniffer.py \
  --iface wlo1 \
  --backend http://127.0.0.1:5000/api/analyze \
  --window 5 \
  --send-threshold 3
```

Replace `wlo1` with your network interface (`ip link`).

---

## Development notes

### Charts

Example counts for bar charts:

```js
const suspicious = logs.filter(log => log.prediction === "Suspicious").length;
const normal = logs.length - suspicious;
```

### Dataset

For the final project, replace `sample_data.csv` with a cleaned subset of CICIDS2017 so the report can reference a real intrusion-detection dataset.

### Optional: request validation

```bash
npm install zod
```

Validate `duration > 0`, `src_bytes >= 0`, `dst_bytes >= 0` before sending data to the ML model.

### Report statement

The Random Forest classifier was trained using a processed subset of the NSL-KDD intrusion detection dataset. The model was configured as a binary classifier, categorizing network traffic into Normal and Suspicious classes. Performance was evaluated using accuracy, precision, recall, and F1-score metrics.
