from fastapi import FastAPI
from pydantic import BaseModel
import joblib
import numpy as np
import pandas as pd
import os
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ml-service")

app = FastAPI()

# load artifacts
model = joblib.load("model/model.pkl")
encoders = joblib.load("model/encoders.pkl")

# -----------------------------
# INPUT SCHEMA (API CONTRACT)
# -----------------------------
class TrafficData(BaseModel):
    duration: float
    protocol_type: str = "tcp"
    service: str = "http"
    flag: str = "SF"

    src_bytes: float
    dst_bytes: float

    land: float = 0
    wrong_fragment: float = 0
    urgent: float = 0
    hot: float = 0
    num_failed_logins: float = 0
    logged_in: float = 1
    num_compromised: float = 0
    root_shell: float = 0
    su_attempted: float = 0
    num_root: float = 0
    num_file_creations: float = 0
    num_shells: float = 0
    num_access_files: float = 0
    num_outbound_cmds: float = 0
    is_host_login: float = 0
    is_guest_login: float = 0

    count: float = 1
    srv_count: float = 1
    serror_rate: float = 0
    srv_serror_rate: float = 0
    rerror_rate: float = 0
    srv_rerror_rate: float = 0
    same_srv_rate: float = 1
    diff_srv_rate: float = 0
    srv_diff_host_rate: float = 0

    dst_host_count: float = 1
    dst_host_srv_count: float = 1
    dst_host_same_srv_rate: float = 1
    dst_host_diff_srv_rate: float = 0
    dst_host_same_src_port_rate: float = 0
    dst_host_srv_diff_host_rate: float = 0
    dst_host_serror_rate: float = 0
    dst_host_srv_serror_rate: float = 0
    dst_host_rerror_rate: float = 0
    dst_host_srv_rerror_rate: float = 0


# -----------------------------
# FEATURE ORDER (if you have a specific order, set FEATURES accordingly)
# must match training exactly if you rely on column order; otherwise we send as-is
# -----------------------------
FEATURES = [
    "duration",
    "protocol_type",
    "service",
    "flag",
    "src_bytes",
    "dst_bytes"
]

ML_THRESHOLD = float(os.getenv("ML_THRESHOLD", "0.4"))


@app.post("/predict")
def predict(data: TrafficData):
    input_dict = data.model_dump()
    df = pd.DataFrame([input_dict])

    # encode categorical features
    for col in ["protocol_type", "service", "flag"]:
        if col in df.columns:
            try:
                if df[col].iloc[0] in encoders[col].classes_:
                    df[col] = encoders[col].transform(df[col])
                else:
                    df[col] = 0
            except Exception:
                df[col] = 0

    # reorder to training columns (fill missing with 0)
    TRAINING_ORDER = [
        "duration","protocol_type","service","flag","src_bytes","dst_bytes",
        "land","wrong_fragment","urgent","hot","num_failed_logins","logged_in",
        "num_compromised","root_shell","su_attempted","num_root","num_file_creations",
        "num_shells","num_access_files","num_outbound_cmds","is_host_login","is_guest_login",
        "count","srv_count","serror_rate","srv_serror_rate","rerror_rate","srv_rerror_rate",
        "same_srv_rate","diff_srv_rate","srv_diff_host_rate","dst_host_count","dst_host_srv_count",
        "dst_host_same_srv_rate","dst_host_diff_srv_rate","dst_host_same_src_port_rate",
        "dst_host_srv_diff_host_rate","dst_host_serror_rate","dst_host_srv_serror_rate",
        "dst_host_rerror_rate","dst_host_srv_rerror_rate"
    ]
    df = df.reindex(columns=TRAINING_ORDER, fill_value=0)
    features = df.values

    # get model outputs
    model_label = None
    proba = None
    try:
        model_label = model.predict(features)[0]
    except Exception:
        model_label = None
    try:
        proba = model.predict_proba(features)[0]
    except Exception:
        proba = None

    classes_list = list(getattr(model, "classes_", []))
    classes_lower = [str(c).lower() for c in classes_list]

    # determine attack index robustly
    attack_index = None
    attack_keywords = ["anomaly", "attack", "malicious", "malware", "intrusion"]
    if classes_list:
        for i, c in enumerate(classes_lower):
            if any(k in c for k in attack_keywords):
                attack_index = i
                break
        if attack_index is None and len(classes_list) == 2:
            # pick the non-normal class
            if "normal" in classes_lower[0] or "benign" in classes_lower[0]:
                attack_index = 1
            else:
                attack_index = 0

    # fallback if still None
    if attack_index is None and proba is not None:
        attack_index = int(np.argmax(proba))
    if attack_index is None:
        attack_index = 0

    # compute attack probability
    if proba is not None:
        try:
            attack_prob = float(proba[attack_index])
        except Exception:
            attack_prob = float(np.max(proba))
        proba_list = proba.tolist()
    else:
        # approximate from model_label text if no proba
        s = str(model_label).lower() if model_label is not None else ""
        attack_prob = 1.0 if any(k in s for k in attack_keywords) else 0.0
        proba_list = None

    # map model_label conservatively
    def model_label_to_text(lbl):
        if lbl is None:
            return None
        s = str(lbl).lower().strip()
        suspicious_exact = {"1", "true", "suspicious", "anomaly", "attack", "malicious", "intrusion"}
        normal_exact = {"0", "false", "normal", "benign"}
        if s in suspicious_exact or s.startswith("rule:"):
            return "Suspicious"
        if s in normal_exact:
            return "Normal"
        if s.startswith(("attack", "anomaly", "malicious", "intrusion", "suspicious")):
            return "Suspicious"
        if s in ("normal", "benign"):
            return "Normal"
        return None

    model_label_text = model_label_to_text(model_label)

    # FINAL decision: prefer probability-based decision unless model_label explicitly says Suspicious
    threshold = float(os.getenv("ML_THRESHOLD", ML_THRESHOLD))
    prob_based_label = "Suspicious" if attack_prob >= threshold else "Normal"
    if model_label_text == "Suspicious":
        predicted_label = "Suspicious"
    else:
        # use probability-based label (override model.predict "normal" strings)
        predicted_label = prob_based_label

    logger.info("predict -> label=%s attack_prob=%.3f threshold=%.3f model_label=%s classes=%s features=%s",
                predicted_label, attack_prob, threshold, model_label, classes_list, df.iloc[0].to_dict())

    return {
        "prediction": predicted_label,
        "confidence": round(attack_prob, 3),
        "model_label": model_label,
        "raw_proba": proba_list,
        "classes": classes_list,
        "threshold": threshold,
    }
