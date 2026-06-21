import json
from pathlib import Path

import joblib
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
)
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder

MODEL_DIR = Path(__file__).resolve().parent
RESULTS_MD = MODEL_DIR.parent / "docs" / "model_results.md"
RESULTS_JSON = MODEL_DIR / "evaluation_results.json"

OFFICIAL_TEST_URL = (
    "https://raw.githubusercontent.com/defcom17/NSL_KDD/master/KDDTest%2B.txt"
)

FEATURE_COLUMNS = [
    "duration",
    "protocol_type",
    "service",
    "flag",
    "src_bytes",
    "dst_bytes",
    "land",
    "wrong_fragment",
    "urgent",
    "hot",
    "num_failed_logins",
    "logged_in",
    "num_compromised",
    "root_shell",
    "su_attempted",
    "num_root",
    "num_file_creations",
    "num_shells",
    "num_access_files",
    "num_outbound_cmds",
    "is_host_login",
    "is_guest_login",
    "count",
    "srv_count",
    "serror_rate",
    "srv_serror_rate",
    "rerror_rate",
    "srv_rerror_rate",
    "same_srv_rate",
    "diff_srv_rate",
    "srv_diff_host_rate",
    "dst_host_count",
    "dst_host_srv_count",
    "dst_host_same_srv_rate",
    "dst_host_diff_srv_rate",
    "dst_host_same_src_port_rate",
    "dst_host_srv_diff_host_rate",
    "dst_host_serror_rate",
    "dst_host_srv_serror_rate",
    "dst_host_rerror_rate",
    "dst_host_srv_rerror_rate",
]

CATEGORICAL_COLUMNS = ["protocol_type", "service", "flag"]

TRAIN_CANDIDATES = [
    "NSL-KDD-Train.csv",
    "NSL-KDD-Train.txt",
    "KDDTrain+.txt",
]

TEST_CANDIDATES = [
    "NSL-KDD-Test.txt",
    "KDDTest+.txt",
]


def to_binary_label(value) -> str:
    label = str(value).strip().lower()
    if label.startswith("normal"):
        return "Normal"
    return "Suspicious"


def pct(value: float) -> str:
    return f"{value * 100:.1f}%"


def find_file(candidates: list[str]) -> Path | None:
    for name in candidates:
        path = MODEL_DIR / name
        if path.exists():
            return path
    return None


def download_official_test() -> Path:
    import urllib.request

    target = MODEL_DIR / "NSL-KDD-Test.txt"
    print(f"Downloading official NSL-KDD test set to {target.name} ...")
    urllib.request.urlretrieve(OFFICIAL_TEST_URL, target)
    return target


def load_training_frame(path: Path) -> pd.DataFrame:
    if path.suffix.lower() == ".csv":
        df = pd.read_csv(path)
        if "class" in df.columns and "label" not in df.columns:
            df = df.rename(columns={"class": "label"})
        return df

    columns = FEATURE_COLUMNS + ["label", "difficulty"]
    df = pd.read_csv(path, header=None, names=columns)
    return df


def load_official_test_frame(path: Path) -> pd.DataFrame:
    columns = FEATURE_COLUMNS + ["label", "difficulty"]
    df = pd.read_csv(path, header=None, names=columns)
    df["label"] = df["label"].astype(str).str.replace(r"\.\d+$", "", regex=True)
    return df


def fit_encoders(df: pd.DataFrame) -> dict[str, LabelEncoder]:
    encoders: dict[str, LabelEncoder] = {}
    for col in CATEGORICAL_COLUMNS:
        enc = LabelEncoder()
        enc.fit(df[col].astype(str))
        encoders[col] = enc
    return encoders


def encode_features(df: pd.DataFrame, encoders: dict[str, LabelEncoder]) -> pd.DataFrame:
    encoded = df[FEATURE_COLUMNS].copy()
    for col in CATEGORICAL_COLUMNS:
        enc = encoders[col]
        known = set(enc.classes_)
        values = []
        for raw in df[col].astype(str):
            if raw in known:
                values.append(int(enc.transform([raw])[0]))
            else:
                values.append(-1)
        encoded[col] = values
    return encoded


def compute_metrics(y_true, y_pred, sample_count: int) -> dict:
    y_true_bin = pd.Series(y_true).map(to_binary_label)
    y_pred_bin = pd.Series(y_pred).map(to_binary_label)
    labels = ["Normal", "Suspicious"]
    cm = confusion_matrix(y_true_bin, y_pred_bin, labels=labels)

    return {
        "accuracy": accuracy_score(y_true_bin, y_pred_bin),
        "precision": precision_score(
            y_true_bin, y_pred_bin, pos_label="Suspicious", zero_division=0
        ),
        "recall": recall_score(
            y_true_bin, y_pred_bin, pos_label="Suspicious", zero_division=0
        ),
        "f1_score": f1_score(
            y_true_bin, y_pred_bin, pos_label="Suspicious", zero_division=0
        ),
        "confusion_matrix": {
            "labels": labels,
            "matrix": cm.tolist(),
        },
        "classification_report": classification_report(
            y_true_bin, y_pred_bin, labels=labels, zero_division=0
        ),
        "test_samples": sample_count,
    }


def evaluate_holdout(train_df: pd.DataFrame) -> dict:
    X = train_df[FEATURE_COLUMNS + ["label"]].copy()
    y = train_df["label"]

    encoders = fit_encoders(train_df)
    X_encoded = encode_features(train_df, encoders)

    X_train, X_test, y_train, y_test = train_test_split(
        X_encoded,
        y,
        test_size=0.2,
        random_state=42,
        stratify=y.map(to_binary_label),
    )

    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)

    metrics = compute_metrics(y_test, y_pred, len(y_test))
    metrics["split"] = "internal_holdout_20pct"
    metrics["description"] = (
        "20% stratified holdout from the local training file. "
        "Optimistic because train and test share the same file and label style."
    )
    return metrics


def train_and_evaluate_official(train_df: pd.DataFrame, test_df: pd.DataFrame) -> tuple:
    encoders = fit_encoders(train_df)
    X_train = encode_features(train_df, encoders)
    y_train = train_df["label"]

    X_test = encode_features(test_df, encoders)
    y_test = test_df["label"]

    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)

    metrics = compute_metrics(y_test, y_pred, len(y_test))
    metrics["split"] = "official_nsl_kdd_test"
    metrics["description"] = (
        "Official NSL-KDD test set (KDDTest+). Model trained on the full local training file. "
        "This is the recommended benchmark for reporting."
    )
    return model, encoders, metrics


def metrics_table(metrics: dict) -> str:
    return "\n".join(
        [
            "| Metric | Value |",
            "|--------|-------|",
            f"| Accuracy | {pct(metrics['accuracy'])} |",
            f"| Precision (Suspicious) | {pct(metrics['precision'])} |",
            f"| Recall (Suspicious) | {pct(metrics['recall'])} |",
            f"| F1-Score (Suspicious) | {pct(metrics['f1_score'])} |",
            f"| Test samples | {metrics['test_samples']} |",
        ]
    )


def confusion_section(metrics: dict) -> str:
    cm = metrics["confusion_matrix"]["matrix"]
    return f"""|  | Normal | Suspicious |
|--|--------|------------|
| **Normal** | {cm[0][0]} | {cm[0][1]} |
| **Suspicious** | {cm[1][0]} | {cm[1][1]} |"""


def write_results(
    official_metrics: dict | None,
    holdout_metrics: dict,
    feature_count: int,
    train_path: Path,
    test_path: Path | None,
) -> None:
    primary = official_metrics or holdout_metrics
    primary_name = (
        "Official NSL-KDD test set (KDDTest+)"
        if official_metrics
        else "Internal holdout (20% of training file)"
    )

    md_parts = [
        "# Model evaluation results",
        "",
        "Auto-generated by `train_real_dataset.py`.",
        "",
        f"- **Training file:** `{train_path.name}`",
        f"- **Features:** {feature_count} NSL-KDD fields",
        "- **Task:** Binary Normal vs Suspicious",
        "",
        "## Primary evaluation",
        "",
        f"**Dataset:** {primary_name}",
        "",
        primary["description"],
        "",
        metrics_table(primary),
        "",
        "### Confusion matrix",
        "",
        "Rows = actual, columns = predicted.",
        "",
        confusion_section(primary),
        "",
        "### Classification report",
        "",
        "```",
        primary["classification_report"].rstrip(),
        "```",
    ]

    if official_metrics and holdout_metrics:
        md_parts.extend(
            [
                "",
                "## Secondary evaluation (internal holdout)",
                "",
                holdout_metrics["description"],
                "",
                metrics_table(holdout_metrics),
                "",
                "### Confusion matrix",
                "",
                confusion_section(holdout_metrics),
                "",
                "### Why the numbers differ",
                "",
                "- The **official test set** includes attack types held out from training labels and is the standard NSL-KDD benchmark.",
                "- The **internal holdout** comes from the same training file (often pre-binarized `normal` / `anomaly`) and is usually much easier.",
                "- Report the **official test** results in your presentation; mention the holdout as a supplementary check only.",
            ]
        )

    RESULTS_MD.write_text("\n".join(md_parts) + "\n", encoding="utf-8")

    payload = {
        "feature_count": feature_count,
        "training_file": train_path.name,
        "official_test_file": test_path.name if test_path else None,
        "primary_evaluation": {
            k: primary[k]
            for k in [
                "split",
                "accuracy",
                "precision",
                "recall",
                "f1_score",
                "confusion_matrix",
                "test_samples",
            ]
        },
        "internal_holdout": {
            k: holdout_metrics[k]
            for k in [
                "split",
                "accuracy",
                "precision",
                "recall",
                "f1_score",
                "confusion_matrix",
                "test_samples",
            ]
        }
        if holdout_metrics
        else None,
    }
    RESULTS_JSON.write_text(json.dumps(payload, indent=2), encoding="utf-8")


def print_metrics(title: str, metrics: dict) -> None:
    print(title)
    print(f"  Accuracy:  {pct(metrics['accuracy'])}")
    print(f"  Precision: {pct(metrics['precision'])}")
    print(f"  Recall:    {pct(metrics['recall'])}")
    print(f"  F1-Score:  {pct(metrics['f1_score'])}")
    print(f"  Samples:   {metrics['test_samples']}")
    print(f"  Confusion matrix: {metrics['confusion_matrix']['matrix']}")


def main() -> None:
    train_path = find_file(TRAIN_CANDIDATES)
    if train_path is None:
        raise FileNotFoundError(
            "Training file not found. Place NSL-KDD-Train.csv in ml-service/model/."
        )

    test_path = find_file(TEST_CANDIDATES)
    if test_path is None:
        test_path = download_official_test()

    train_df = load_training_frame(train_path)
    test_df = load_official_test_frame(test_path)

    holdout_metrics = evaluate_holdout(train_df)
    model, encoders, official_metrics = train_and_evaluate_official(train_df, test_df)

    joblib.dump(model, MODEL_DIR / "model.pkl")
    joblib.dump(encoders, MODEL_DIR / "encoders.pkl")

    with open(MODEL_DIR / "feature_schema.json", "w", encoding="utf-8") as f:
        json.dump(FEATURE_COLUMNS, f)

    write_results(
        official_metrics,
        holdout_metrics,
        feature_count=len(FEATURE_COLUMNS),
        train_path=train_path,
        test_path=test_path,
    )

    print("Model saved: model.pkl, encoders.pkl")
    print_metrics("Official NSL-KDD test (primary):", official_metrics)
    print_metrics("Internal holdout (secondary):", holdout_metrics)
    print(f"Results written to {RESULTS_MD} and {RESULTS_JSON}")


if __name__ == "__main__":
    main()
