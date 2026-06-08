from fastapi import FastAPI
from pydantic import BaseModel
import joblib
import numpy as np
import pandas as pd

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
# FEATURE ORDER (CRITICAL)
# must match training exactly
# -----------------------------
FEATURES = [
    "duration",
    "protocol_type",
    "service",
    "flag",
    "src_bytes",
    "dst_bytes"
]

@app.post("/predict")
def predict(data: TrafficData):

    df = pd.DataFrame([data.model_dump()])

    # encode categorical features
    for col in ["protocol_type", "service", "flag"]:
        if df[col].iloc[0] in encoders[col].classes_:
            df[col] = encoders[col].transform(df[col])
        else:
            df[col] = 0

    features = df.values

    prediction = model.predict(features)[0]

    confidence = float(max(model.predict_proba(features)[0]))

    return {
        "prediction": "Suspicious" if prediction == 1 else "Normal",
        "confidence": confidence
    }

#
# @app.post("/predict")
# def predict(data: TrafficData):
#
#     # convert request → dict
#     input_dict = data.model_dump()
#
#     # build dataframe (important for encoding consistency)
#     df = pd.DataFrame([input_dict])
#
#     # encode categorical features using training encoders
#     for col in ["protocol_type", "service", "flag"]:
#         if col in df.columns:
#             if df[col].iloc[0] in encoders[col].classes_:
#                 df[col] = encoders[col].transform(df[col])
#             else:
#                 # fallback for unseen values
#                 df[col] = 0
#
#     # reorder features exactly as training expects
#     df = df[FEATURES]
#
#     # convert to numpy
#     features = df.values
#
#     # prediction
#     prediction = model.predict(features)[0]
#
#     # confidence
#     confidence = float(np.max(model.predict_proba(features)[0]))
#
#     return {
#         "prediction": "Suspicious" if prediction == 1 else "Normal",
#         "confidence": round(confidence, 2)
#     }
