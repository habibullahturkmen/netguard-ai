import pandas as pd
import joblib
import json

from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split

df = pd.read_csv("NSL-KDD-Train.csv")

X = df.drop("class", axis=1)
y = df["class"]

# categorical encoding
encoders = {}

for col in ["protocol_type", "service", "flag"]:
    enc = LabelEncoder()
    X[col] = enc.fit_transform(X[col])
    encoders[col] = enc

# train/test split
X_train, X_test, y_train, y_test = train_test_split(
    X, y,
    test_size=0.2,
    random_state=42,
    stratify=y
)

model = RandomForestClassifier(
    n_estimators=100,
    random_state=42
)

model.fit(X_train, y_train)

# save artifacts
joblib.dump(model, "model.pkl")
joblib.dump(encoders, "encoders.pkl")

with open("feature_schema.json", "w") as f:
    json.dump(list(X.columns), f)
