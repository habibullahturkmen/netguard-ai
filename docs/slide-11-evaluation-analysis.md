# Slide 11 — Evaluation Metrics Analysis

**Project:** NetGuard AI · **Team:** Cyber Experts · **Institution:** Humber Polytechnic
**Purpose:** Detailed analysis backing **Slide 11 — Evaluation Metrics** in the presentation
**Source data:** `ml-service/docs/model_results.md`, `ml-service/model/evaluation_results.json`
**Generated from:** `train_real_dataset.py` (Random Forest, 100 estimators, 41 NSL-KDD features)

---

## Executive summary

NetGuard AI’s machine learning component was evaluated on the **official NSL-KDD test set (KDDTest+)**:

| Evaluation | Dataset | Accuracy | F1 (Suspicious) | Use in presentation |
|------------|---------|----------|-----------------|---------------------|
| **Official test (report this)** | KDDTest+ | **77.2%** | **75.7%** | ✅ Main Slide 11 numbers |

KDDTest+ is the standard held-out benchmark from Tavallaee et al. (2009). The model trains on `NSL-KDD-Train.csv` and is never fit on test rows.

System-level evaluation (API latency, dashboard usability, lab demos) is separate from these ML metrics and is also covered on Slide 11.

---

## 1. ML model setup

| Item | Value |
|------|-------|
| Algorithm | Random Forest (Breiman, 2001) |
| Library | scikit-learn (Pedregosa et al., 2011) |
| Estimators | 100 trees |
| Features | 41 NSL-KDD flow fields |
| Training file | `NSL-KDD-Train.csv` (151,165 rows) |
| Official test file | `NSL-KDD-Test.txt` (KDDTest+, 22,544 rows) |
| Task | Binary classification: **Normal** vs **Suspicious** |
| Label mapping | `normal` → Normal; all attack types → Suspicious |

Non-normal attack names in the official test (e.g. neptune, mscan, warezclient) are collapsed to **Suspicious** for binary IDS evaluation, consistent with the project proposal.

---

## 2. Confusion matrix — TN, FP, FN, TP

### What is a confusion matrix?

A **confusion matrix** is a table that compares **what actually happened** (ground truth) with **what the model predicted**. Each cell is a **count of flows**, not a percentage.

For NetGuard AI (Normal vs Suspicious):

|  | **Predicted Normal** | **Predicted Suspicious** |
|--|----------------------|---------------------------|
| **Actually Normal** | TN | FP |
| **Actually Suspicious** | FN | TP |

### What TN, FP, FN, TP mean

| Term | Full name | Plain English | NetGuard AI example (official test) |
|------|-----------|---------------|-------------------------------------|
| **TN** | True Negative | Normal traffic correctly called **Normal** | **9,431** flows |
| **FP** | False Positive | Normal traffic wrongly called **Suspicious** (false alarm) | **280** flows |
| **FN** | False Negative | Attack traffic wrongly called **Normal** (missed attack) | **4,855** flows |
| **TP** | True Positive | Attack traffic correctly called **Suspicious** | **7,978** flows |

**Memory aid**

- **True** = the model was **right**
- **False** = the model was **wrong**
- **Positive** = predicted **Suspicious** (the “alert” class)
- **Negative** = predicted **Normal**

### How metrics are calculated from the matrix

Using our official test counts:

```
Accuracy  = (TN + TP) / total
          = (9431 + 7978) / 22544 ≈ 77.2%

Precision = TP / (TP + FP)
          = 7978 / (7978 + 280) ≈ 96.6%
          → “When we alert, how often are we right?”

Recall    = TP / (TP + FN)
          = 7978 / (7978 + 4855) ≈ 62.2%
          → “Of all real attacks, how many did we catch?”

F1-Score  = balance of precision and recall ≈ 75.7%
```

**Why accuracy alone is misleading:** 77.2% accuracy does not show whether errors are mostly **false alarms** (FP) or **missed attacks** (FN). The confusion matrix exposes that split.

### Why we need a confusion matrix

1. **One number is not enough** — accuracy hides the *type* of mistakes.
2. **Security cares about error type**
   - **FP (false alarm)** → wasted investigation, alert fatigue on the dashboard
   - **FN (missed attack)** → threat goes undetected
3. **Required for precision, recall, and F1** — those metrics are derived from TN/FP/FN/TP.
4. **Academic / proposal requirement** — IDS and ML evaluations standardly report a confusion matrix alongside accuracy.
5. **Honest analysis** — shows you understand *how* the model fails, not just a headline percentage.

### One sentence for the presentation

> “Our confusion matrix shows the model is conservative: it rarely flags normal traffic incorrectly (**280** false positives), but it misses some attacks on the official test (**4,855** false negatives), which explains high **precision** and moderate **recall**.”

---

## 3. ML evaluation — official NSL-KDD test set

**Why this matters:** KDDTest+ is the standard held-out benchmark from Tavallaee et al. (2009). The model never trains on these rows, so scores reflect generalization to unseen attack patterns.

### 3.1 Metrics (Suspicious = positive class)

| Metric | Value | Interpretation |
|--------|-------|----------------|
| **Accuracy** | **77.2%** | 77.2% of all test flows classified correctly |
| **Precision** | **96.6%** | When the model predicts Suspicious, it is correct ~97% of the time |
| **Recall** | **62.2%** | The model catches ~62% of truly suspicious flows |
| **F1-Score** | **75.7%** | Harmonic mean of precision and recall |

### 3.2 Confusion matrix

Rows = actual, columns = predicted.

|  | Predicted Normal | Predicted Suspicious |
|--|------------------|----------------------|
| **Actual Normal** | 9,431 (TN) | 280 (FP) |
| **Actual Suspicious** | 4,855 (FN) | 7,978 (TP) |

**Support:** 9,711 Normal · 12,833 Suspicious · **22,544 total**

### 3.3 Reading the confusion matrix

See **Section 2** for definitions of TN, FP, FN, and TP. Summary for this evaluation:

- **TN (9,431):** Normal traffic correctly allowed.
- **FP (280):** Normal traffic flagged Suspicious — low rate (~2.9% of normal flows).
- **FN (4,855):** Attacks missed — main weakness (~37.8% of suspicious flows).
- **TP (7,978):** Attacks correctly detected.

### 3.4 Classification report (sklearn)

```
              precision    recall  f1-score   support

      Normal       0.66      0.97      0.79      9711
  Suspicious       0.97      0.62      0.76     12833

    accuracy                           0.77     22544
   macro avg       0.81      0.80      0.77     22544
weighted avg       0.83      0.77      0.77     22544
```

### 3.5 Analysis

**Strengths**

- **High precision (96.6%)** — few false alarms on normal traffic; suitable for a demo dashboard where noisy alerts frustrate users.
- **Strong normal recall (97%)** — most benign flows stay classified as Normal.
- **77.2% overall accuracy** on a challenging public benchmark shows the model learned meaningful flow patterns.

**Limitations**

- **Moderate suspicious recall (62.2%)** — many attack flows in KDDTest+ are missed, likely because:
  - Training file uses simplified binary labels (`normal` / `anomaly`) while the test set contains diverse attack names not seen as separate classes during training.
  - Train and test distributions differ (different preprocessing / row counts vs official KDDTrain+).
- **Not live-network performance** — these numbers apply to NSL-KDD feature vectors, not your Wi‑Fi or lab sniffer traffic.

**Conclusion for Slide 11:** Report **77.2% accuracy** and **75.7% F1** as the ML evaluation result. Emphasize **96.6% precision** (trustworthy alerts) and acknowledge **62.2% recall** (room for improvement / future work).

---

## 4. System evaluation (non-ML)

These items appear on Slide 11 alongside ML metrics:

| Area | Finding | Evidence |
|------|---------|----------|
| **Response time** | Near real-time | REST `/predict` and `/api/analyze` complete in seconds per flow window |
| **Usability** | Multi-page dashboard | Overview, Traffic, Analytics, Alerts, Logs with 5s auto-refresh |
| **Lab testing** | Reproducible | Documented curl, hping3, and nmap scenarios in `docs/attack-readme.md` |

Live demos validate **rules, pipeline, and UI** — not the offline F1 score.

---

## 5. What to say on Slide 11 (30–45 seconds)

> We evaluated our Random Forest using the **official NSL-KDD test set**, the standard benchmark from Tavallaee et al. (2009). On **22,544 held-out flows**, we achieved **77.2% accuracy**, **96.6% precision**, **62.2% recall**, and **75.7% F1-score** for detecting suspicious traffic.
>
> High **precision** means when we flag traffic as suspicious, we are usually correct — important for avoiding alert fatigue. **Recall** is lower because some attack types in the official test were not represented the same way in our training file — that is a known area for future improvement.
>
> We also tested the system in the lab: the API responds in real time, the dashboard is multi-page and auto-refreshes, and we reproduced DoS and port-scan scenarios with curl, hping3, and nmap.

---

## 6. Likely Q&A

| Question | Answer |
|----------|--------|
| Is 77% good? | For a student capstone with a single Random Forest and binary mapping, it is reasonable on KDDTest+, especially with **96.6% precision**. Literature reports vary by algorithm and preprocessing. |
| Does this apply to live traffic? | No. Live validation uses **lab demo scenarios**, not this F1 score. |
| What metric matters most for IDS? | Depends on goal: **precision** reduces false alarms; **recall** catches more attacks. We prioritize precision in demo use; production might tune threshold differently. |
| What is TN/FP/FN/TP? | Counts in the confusion matrix: **TN** = correct Normal, **FP** = false alarm, **FN** = missed attack, **TP** = correct Suspicious. See **Section 2**. |
| Why a confusion matrix? | Shows *types* of errors, not just accuracy; required for precision/recall/F1. |
| How was the model evaluated? | `train_real_dataset.py` — full train fit, metrics on KDDTest+, auto-written to `model_results.md`. |

---

## 7. Reproducing these results

```bash
cd ml-service
source venv/bin/activate
cd model
python train_real_dataset.py
```

Outputs:

- `ml-service/docs/model_results.md`
- `ml-service/model/evaluation_results.json`
- `model.pkl`, `encoders.pkl`

---

## 8. References

- Tavallaee, M., et al. (2009). NSL-KDD dataset.
- Breiman, L. (2001). Random forests.
- Pedregosa, F., et al. (2011). scikit-learn.

Full APA list: `docs/presentation-references.md`

---

*Cyber Experts — Humber Polytechnic — Slide 11 evaluation analysis*
