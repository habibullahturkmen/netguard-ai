"""
DEPRECATED — not compatible with the production ML service.

This script trains on 3 features (duration, src_bytes, dst_bytes) only.
app.py expects the full 41-feature NSL-KDD vector from train_real_dataset.py.

To train the production model:
  cd ml-service/model
  python train_real_dataset.py

To run this demo script anyway (overwrites model.pkl):
  ALLOW_SAMPLE_TRAIN=1 python train_sample.py
"""

import os
import sys

import pandas as pd
from sklearn.ensemble import RandomForestClassifier
import joblib


def main() -> None:
    df = pd.read_csv("sample_data.csv")

    X = df[["duration", "src_bytes", "dst_bytes"]]
    y = df["label"]

    model = RandomForestClassifier(
        n_estimators=100,
        random_state=42,
    )

    model.fit(X, y)
    joblib.dump(model, "model.pkl")

    print("Sample model saved (3-feature demo only — not for production)")


if __name__ == "__main__":
    print(
        "WARNING: train_sample.py is incompatible with app.py.\n"
        "Use train_real_dataset.py for the production model.\n"
        "Set ALLOW_SAMPLE_TRAIN=1 to run this demo script anyway.",
        file=sys.stderr,
    )
    if os.getenv("ALLOW_SAMPLE_TRAIN") != "1":
        sys.exit(1)
    main()
