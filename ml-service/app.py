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

ML_THRESHOLD = float(os.getenv("ML_THRESHOLD", "0.6"))


@app.post("/predict")
def predict(data: TrafficData):
    # convert request → dict
    input_dict = data.model_dump()

    # build dataframe (important for encoding consistency)
    df = pd.DataFrame([input_dict])

    # encode categorical features using training encoders
    for col in ["protocol_type", "service", "flag"]:
        if col in df.columns:
            try:
                if df[col].iloc[0] in encoders[col].classes_:
                    df[col] = encoders[col].transform(df[col])
                else:
                    # fallback for unseen values
                    df[col] = 0
            except Exception:
                # encoder not found or unexpected structure
                df[col] = 0

    # note: many training pipelines expect exact column ordering.
    # if your model was trained with a fixed FEATURES order, uncomment the next line
    # df = df[FEATURES]

    # convert to numpy
    features = df.values

    # compute probability for attack class robustly
    try:
        proba = model.predict_proba(features)[0]
        # determine index of the positive/attack class (assume label '1' used for attacks)
        attack_index = None
        if hasattr(model, "classes_"):
            try:
                attack_index = list(model.classes_).index(1)
            except ValueError:
                # fallback: if classes_ doesn't include 1, choose the last column as attack
                attack_index = len(proba) - 1
        else:
            attack_index = len(proba) - 1

        attack_prob = float(proba[attack_index])
    except Exception as e:
        # if predict_proba is not available, fallback to predict
        logger.exception("predict_proba failed, falling back to predict: %s", e)
        prediction_raw = model.predict(features)[0]
        attack_prob = 1.0 if prediction_raw == 1 else 0.0
        proba = None

    # apply threshold to decide final label
    threshold = float(os.getenv("ML_THRESHOLD", ML_THRESHOLD))
    prediction = 1 if attack_prob >= threshold else 0

    label = "Suspicious" if prediction == 1 else "Normal"

    # log input and decision for debugging
    logger.info("predict called; label=%s prob=%.3f threshold=%.3f input=%s", label, attack_prob, threshold, input_dict)

    return {
        "prediction": label,
        "confidence": round(attack_prob, 3),
        "raw_proba": proba.tolist() if proba is not None else None,
        "threshold": threshold,
    }
