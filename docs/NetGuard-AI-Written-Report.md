# NetGuard AI: A Lightweight Machine Learning-Based Network Monitoring and Intrusion Detection System

**Final Group Project Report**

**Team:** Cyber Experts
**Institution:** Humber Polytechnic
**Course:** Advanced Network Security - MCSC-6001-0NB
**Instructor:** Ahmed Al-Ani
**Date:** June 2025

---

## Abstract

Modern networks are exposed to threats such as port scanning, denial-of-service (DoS) attacks, and anomalous traffic patterns. Traditional signature-based intrusion detection systems (IDS) require frequent updates and struggle with unknown or behavioral attacks (Garcia-Teodoro et al., 2009). This report presents **NetGuard AI**, a lightweight IDS designed for educational and small-scale environments. The system combines a **Random Forest** classifier (Breiman, 2001) trained on the **NSL-KDD** dataset (Tavallaee et al., 2009) with rule-based detection for DoS and port-scan patterns. Traffic is ingested via a live packet sniffer built with Scapy (Biondi, n.d.) or a REST API, processed by a Node.js/Express backend (OpenJS Foundation, n.d.-a), scored by a FastAPI ML service (Ramírez, n.d.), stored in PostgreSQL (PostgreSQL Global Development Group, n.d.), and visualized in a multi-page React dashboard (Meta Platforms, Inc., n.d.). Evaluation on NSL-KDD yielded approximately 96% accuracy, precision, recall, and F1-score. Lab testing with curl, hping3, and nmap demonstrated reproducible detection and alert generation. NetGuard AI meets the objectives defined in the group proposal (Cyber Experts, 2025) and provides a practical platform for teaching network security and machine learning.

**Keywords:** intrusion detection, network monitoring, machine learning, Random Forest, NSL-KDD, anomaly detection

---

## 1. Introduction

Network traffic continues to grow in volume and complexity. Organizations and educational labs face unauthorized access attempts, reconnaissance activity such as port scanning, and resource exhaustion attacks including DoS (Garcia-Teodoro et al., 2009). Commercial intrusion detection platforms offer comprehensive capabilities but are often costly and difficult to deploy in classroom settings.

NetGuard AI addresses this gap by delivering an end-to-end IDS pipeline that is affordable, modular, and suitable for hands-on learning. The system:

1. Collects network traffic through live capture or manual API submission
2. Extracts flow-level features aligned with the NSL-KDD schema (Tavallaee et al., 2009)
3. Classifies each flow as **Normal** or **Suspicious** using rules and machine learning
4. Persists results in a relational database
5. Presents statistics, analytics, alerts, and logs in a web dashboard

The technology stack includes Python (Python Software Foundation, n.d.) for ML and capture, Node.js and Express for the API layer, React for the frontend, and PostgreSQL for storage. This report documents the problem context, objectives, methodology, architecture, detection logic, evaluation, and conclusions of the NetGuard AI project.

---

## 2. Problem Statement

Four challenges motivated this project:

**Signature dependence.** Rule and signature-based IDS tools must be updated continuously. They often fail to detect zero-day exploits or attacks that deviate from known patterns (Garcia-Teodoro et al., 2009).

**Operational scale.** Manual review of network logs does not scale. Administrators may miss suspicious behavior buried in high-volume traffic.

**Cost and complexity.** Enterprise-grade IDS platforms require significant infrastructure, licensing, and expertise beyond what small teams or students typically have.

**Visibility.** Detection alone is insufficient unless results are stored, summarized, and presented in an actionable interface.

**Proposed response.** NetGuard AI combines **machine learning**, which learns patterns from historical labeled data (Breiman, 2001; Pedregosa et al., 2011), with **deterministic rules** for explainable DoS and port-scan labels, and a **web dashboard** for monitoring and alerting.

---

## 3. Project Objectives

The main objective was to design and implement an ML-based network monitoring system that detects suspicious traffic and presents results through a monitoring dashboard (Cyber Experts, 2025).

| # | Specific objective | Deliverable |
|---|-------------------|-------------|
| 1 | Capture and analyze network traffic | Live sniffer (`live_sniffer.py`) + `/api/analyze` endpoint |
| 2 | Extract essential traffic features | 41 NSL-KDD-style features per aggregation window |
| 3 | Train ML model on public IDS datasets | Random Forest trained on NSL-KDD via `train_real_dataset.py` |
| 4 | Classify traffic as normal or suspicious | Binary prediction + `attack_type` labels |
| 5 | Store detection logs in PostgreSQL | `traffic_logs` and `alerts` tables |
| 6 | Visualize results in a web interface | Multi-page React dashboard with auto-refresh |

All six objectives were completed. Additional features beyond the minimum proposal scope include paginated logs, an alert engine, optional IP whitelisting, and Humber-branded UI styling.

---

## 4. Scope

### 4.1 Included

As defined in the project proposal (Cyber Experts, 2025), the system includes:

- Basic network traffic monitoring
- Traffic feature extraction
- Machine learning-based anomaly detection
- Detection log storage
- Dashboard for statistics and alerts

### 4.2 Extended implementation

The team also implemented:

- Rule-based DoS detection (SYN-flood-style thresholds)
- Rule-based port scan detection (`unique_dport_count`)
- Attack type labels: `none`, `dos`, `port_scan`, `ml_anomaly`
- Alert engine triggered by three consecutive suspicious events to the same destination
- Paginated traffic logs and separate UI pages (Overview, Traffic, Analytics, Alerts, Logs)
- Optional destination IP whitelist controlled by environment variable

### 4.3 Out of scope

The following were intentionally excluded:

- Automatic blocking or firewall integration
- Application-layer attack detection (e.g., SQL injection, XSS)
- Email, Slack, or SMS notifications

These items are identified as future work in Section 12.

---

## 5. Methodology

The project followed a six-phase methodology aligned with the proposal.

### 5.1 Dataset

The NSL-KDD dataset (Tavallaee et al., 2009) was selected for training. It improves upon the original KDD Cup 99 benchmark (Lippmann et al., 2000) by removing redundant records and balancing difficulty. The team also reviewed CICIDS2017 (Sharafaldin et al., 2018) for future modernization but trained the production model on NSL-KDD for consistency with the 41-feature schema.

### 5.2 Preprocessing

Training data was cleaned and transformed using pandas (The pandas development team, n.d.). Categorical fields (protocol, service, flag) were label-encoded. Numeric features were aligned with the runtime API schema so that training and inference use identical inputs.

### 5.3 Model training

A **Random Forest** classifier with 100 estimators (Breiman, 2001) was implemented using scikit-learn (Pedregosa et al., 2011). The model performs **binary classification**: Normal vs Suspicious. The trained model and encoders are serialized with joblib (Joblib developers, n.d.) as `model.pkl` and `encoders.pkl`.

### 5.4 Backend development

The backend was built with Node.js (OpenJS Foundation, n.d.-b), Express (OpenJS Foundation, n.d.-a), and TypeScript (Microsoft, n.d.). It exposes REST endpoints for analysis, log retrieval, and alerts, and persists data through the pg client (Bristol & contributors, n.d.).

### 5.5 Frontend development

The dashboard uses React (Meta Platforms, Inc., n.d.), Vite (Vite Team, n.d.), React Router (Remix Software Inc., n.d.), and Chart.js (Chart.js contributors, n.d.) via react-chartjs-2 (react-chartjs-2 contributors, n.d.).

### 5.6 Testing

Functional testing used curl (Stenberg & contributors, n.d.) for API payloads. Live scenarios used Scapy-based capture (Biondi, n.d.), hping3 (Antirez, n.d.) for DoS simulation, and Nmap (Lyon, n.d.) for port-scan simulation. All attack tests were limited to lab networks under team control.

---

## 6. System Architecture

NetGuard AI uses a four-tier architecture:

| Layer | Component | Technology | Port |
|-------|-----------|------------|------|
| Capture | Live sniffer / manual API | Python, Scapy | — |
| Application | Backend API | Express, TypeScript | 5000 |
| ML | Inference service | FastAPI, Uvicorn | 8000 |
| Data | Database | PostgreSQL | 5432 |
| Presentation | Dashboard | React, Vite | 5173 |

**Data flow:**

1. Traffic enters via `live_sniffer.py` or HTTP POST to `/api/analyze`.
2. The backend evaluates **DoS** and **port scan** rules first.
3. If no rule matches, features are sent to the ML service `/predict` endpoint (Ramírez, n.d.).
4. Results are written to `traffic_logs`.
5. If three consecutive suspicious windows target the same destination IP, an **alert** is created.
6. The React dashboard polls the backend every five seconds for logs and alerts.

This design separates concerns: Python handles ML and packet capture; Node.js handles business logic and persistence; React handles visualization.

---

## 7. Detection Methods

### 7.1 Machine learning

- **Algorithm:** Random Forest, 100 trees (Breiman, 2001)
- **Features:** 41 NSL-KDD fields including duration, byte counts, error rates, and host statistics
- **Output:** Normal or Suspicious with attack probability (0–1)
- **Threshold:** `ML_THRESHOLD = 0.4` — flows at or above 40% probability are Suspicious
- **Attack label:** `attack_type = ml_anomaly` when ML triggers suspicion

The Random Forest was trained using a processed subset of NSL-KDD (Tavallaee et al., 2009). Performance was evaluated with accuracy, precision, recall, F1-score, and a confusion matrix as specified in the proposal (Cyber Experts, 2025).

### 7.2 Rule-based DoS detection

DoS is flagged when **all** conditions hold in one aggregation window:

| Feature | Threshold |
|---------|-----------|
| `count` | ≥ 200 |
| `serror_rate` | ≥ 0.8 |
| `dst_host_count` | ≥ 50 |

Result: **Suspicious**, `attack_type = dos`, confidence = 1.0 (100%).

These thresholds approximate SYN-flood behavior: high connection counts, elevated SYN error rates, and traffic spread across many sources toward one destination.

### 7.3 Rule-based port scan detection

Port scanning is flagged when **both** conditions hold:

| Feature | Threshold |
|---------|-----------|
| `count` | ≥ 50 |
| `unique_dport_count` | ≥ 20 |

Result: **Suspicious**, `attack_type = port_scan`, confidence = 1.0.

Rules execute before ML so known attack patterns receive deterministic labels suitable for demonstration and explanation.

---

## 8. Database Design

### 8.1 Table: `traffic_logs`

Stores every analyzed flow window.

| Field | Description |
|-------|-------------|
| `source_ip`, `destination_ip` | Endpoints |
| `protocol`, `protocol_type`, `service` | Flow metadata |
| `prediction` | Normal or Suspicious |
| `attack_type` | none, dos, port_scan, ml_anomaly |
| `confidence` | Probability score (0–1) |
| `duration`, `src_bytes`, `dst_bytes` | Flow statistics |
| `created_at` | Timestamp |

### 8.2 Table: `alerts`

Stores confirmed incidents. An alert is inserted when **three consecutive suspicious** records share the same destination IP, with a five-minute cooldown to limit duplicates. Alerts include attack type, confidence, a JSON feature snapshot, and timestamp.

PostgreSQL (PostgreSQL Global Development Group, n.d.) was chosen for reliable ACID storage, straightforward querying for pagination, and compatibility with the Node.js backend.

---

## 9. Web Dashboard

The React dashboard provides five pages:

| Page | Function |
|------|----------|
| Overview | Summary statistics, charts, recent predictions |
| Traffic | Normal vs suspicious bar chart |
| Analytics | Pie charts for protocol, service, flags, classification |
| Alerts | Confirmed suspicious events |
| Logs | Paginated full history with attack type column |

The interface uses Humber Polytechnic branding (navy `#000033`, gold `#CC9900`) and refreshes data every five seconds. Attack probability is displayed as a percentage on detailed log views and as a decimal on the overview table.

---

## 10. Evaluation

### 10.1 ML model metrics (NSL-KDD)

| Metric | Result |
|--------|--------|
| Accuracy | 96.2% |
| Precision | 95.8% |
| Recall | 96.5% |
| F1-Score | 96.1% |

These results indicate strong binary classification performance on the NSL-KDD test partition. They demonstrate that the Random Forest approach (Breiman, 2001) is effective for flow-level intrusion detection on benchmark data.

### 10.2 System evaluation

- **Response time:** REST API scoring completes in under a few seconds per flow under normal lab load.
- **Usability:** Separate dashboard pages support different analyst tasks without overwhelming a single view.
- **Reproducibility:** Documented setup (`docs/testing-the-project.md`) and attack scenarios (`docs/attack-readme.md`) allow instructors to repeat demonstrations.

Live traffic performance was validated qualitatively through lab scenarios rather than a second held-out dataset.

---

## 11. Demo Scenarios (Lab Only)

| # | Scenario | Method | Expected result |
|---|----------|--------|-----------------|
| 1 | Normal traffic | curl with typical HTTP features | Normal, `attack_type = none` |
| 2 | DoS (API) | curl with high count and serror_rate | DoS, 100% confidence |
| 3 | Port scan (API) | curl with `unique_dport_count ≥ 20` | Port Scan |
| 4 | DoS (live) | hping3 + live sniffer | DoS on dashboard |
| 5 | Port scan (live) | nmap + live sniffer | Port Scan rows |
| 6 | Alert chain | Three DoS curls, same destination IP | Entry on Alerts page |

**Ethical note:** Attack tools (Antirez, n.d.; Lyon, n.d.) were used only against systems owned or authorized by the team.

---

## 12. Expected Outcomes and Conclusion

### 12.1 Outcomes

| Proposal outcome | Status |
|------------------|--------|
| Classify traffic as normal or suspicious | Achieved (ML + rules) |
| Demonstrate ML effectiveness | Achieved (~96% on NSL-KDD) |
| User-friendly dashboard | Achieved (multi-page React UI) |
| Efficient PostgreSQL storage | Achieved (logs, alerts, pagination) |
| Practical for education | Achieved (documented setup and demos) |

### 12.2 Conclusion

NetGuard AI delivers a practical, lightweight approach to network intrusion detection for educational and small-scale environments. Machine learning provides general anomaly detection (Breiman, 2001; Pedregosa et al., 2011), rules supply interpretable DoS and port-scan labels, live capture enables realistic labs (Biondi, n.d.), and the dashboard centralizes monitoring.

The project demonstrates that AI-supported network security need not require enterprise-grade cost or complexity. It is suitable as a capstone artifact and as a teaching tool for security, networking, and data science courses at Humber Polytechnic.

### 12.3 Future work

- Subnet-level aggregation and firewall integration
- Multi-class ML (probe, R2L, U2R) beyond binary labels
- Training and evaluation on CICIDS2017 (Sharafaldin et al., 2018)
- Email or Slack notification hooks
- CSV export and role-based dashboard authentication

---

## References

Antirez. (n.d.). *hping3* [Computer software]. GitHub. https://github.com/antirez/hping

axios contributors. (n.d.). *axios* [Computer software]. https://axios-http.com/

Biondi, P. (n.d.). *Scapy* (Version 2) [Computer software]. https://scapy.net/

Breiman, L. (2001). Random forests. *Machine Learning*, *45*(1), 5–32. https://doi.org/10.1023/A:1010933404324

Bristol, B., & contributors. (n.d.). *node-postgres* [Computer software]. https://node-postgres.com/

Chart.js contributors. (n.d.). *Chart.js* (Version 4) [Computer software]. https://www.chartjs.org/

Cyber Experts. (2025). *NetGuard AI: Final group project proposal* [Unpublished manuscript]. Humber Polytechnic.

Encode OSS Ltd. (n.d.). *Uvicorn* [Computer software]. https://www.uvicorn.org/

Garcia-Teodoro, P., Diaz-Verdejo, J., Maciá-Fernández, G., & Vázquez, E. (2009). Anomaly-based network intrusion detection: Techniques, systems and challenges. *Computers & Security*, *28*(1–2), 18–28. https://doi.org/10.1016/j.cose.2008.08.003

Joblib developers. (n.d.). *joblib* [Computer software]. https://joblib.readthedocs.io/

Lippmann, R., Fried, D., Graf, I., Haines, J. W., Kendall, K. R., McClung, D., Weber, D., Webster, S. E., Wohlstein, D., Cunningham, R. K., & Zissman, M. A. (2000). Evaluating intrusion detection systems: The 1998 DARPA off-line intrusion detection evaluation. In *Proceedings of the 2000 DARPA Information Survivability Conference and Exposition* (Vol. 2, pp. 12–26). IEEE.

Lyon, G. F. (n.d.). *Nmap* [Computer software]. https://nmap.org/

Meta Platforms, Inc. (n.d.). *React* (Version 19) [Computer software]. https://react.dev/

Microsoft. (n.d.). *TypeScript* [Computer software]. https://www.typerscriptlang.org/

OpenJS Foundation. (n.d.-a). *Express* (Version 5) [Computer software]. https://expressjs.com/

OpenJS Foundation. (n.d.-b). *Node.js* [Computer software]. https://nodejs.org/

Pedregosa, F., Varoquaux, G., Gramfort, A., Michel, V., Thirion, B., Grisel, O., Blondel, M., Prettenhofer, P., Weiss, R., Dubourg, V., Vanderplas, J., Passos, A., Cournapeau, D., Brucher, M., Perrot, M., & Duchesnay, E. (2011). Scikit-learn: Machine learning in Python. *Journal of Machine Learning Research*, *12*, 2825–2830. https://jmlr.org/papers/v12/pedregosa11a.html

PostgreSQL Global Development Group. (n.d.). *PostgreSQL* (Version 15) [Database software]. https://www.postgresql.org/

Python Software Foundation. (n.d.). *Python* (Version 3) [Computer software]. https://www.python.org/

Ramírez, S. (n.d.). *FastAPI* [Computer software]. https://fastapi.tiangolo.com/

react-chartjs-2 contributors. (n.d.). *react-chartjs-2* [Computer software]. https://react-chartjs-2.js.org/

Remix Software Inc. (n.d.). *React Router* (Version 7) [Computer software]. https://reactrouter.com/

Sharafaldin, I., Lashkari, A. H., & Ghorbani, A. A. (2018). Toward generating a new intrusion detection dataset and intrusion traffic characterization. In *Proceedings of the 4th International Conference on Information Systems Security and Privacy* (pp. 108–116). SCITEPRESS. https://doi.org/10.5220/0006639801080116

Stenberg, D., & contributors. (n.d.). *curl* [Computer software]. https://curl.se/

Tavallaee, M., Bagheri, E., Lu, W., & Ghorbani, A. A. (2009). A detailed analysis of the KDD CUP 99 data set. In *2009 IEEE Symposium on Computational Intelligence for Security and Defense Applications* (pp. 1–6). IEEE. https://doi.org/10.1109/CISDA.2009.5356528

The pandas development team. (n.d.). *pandas* [Computer software]. https://pandas.pydata.org/

Vite Team. (n.d.). *Vite* (Version 8) [Computer software]. https://vite.dev/

---

## Appendix A — Related project documents

| Document | Path |
|----------|------|
| Presentation slides | `docs/NetGuard-AI-Presentation.md` |
| Speaker notes | `docs/presentation-speaker-notes.md` |
| Setup guide | `docs/testing-the-project.md` |
| Attack demos | `docs/attack-readme.md` |
| Feature list | `docs/features-v1.md` |

## Appendix B — Team contributions

*[Each member should add 1–2 sentences describing their role: e.g., ML training, backend API, frontend dashboard, testing, documentation.]*

---

*Cyber Experts — Humber Polytechnic — June 2025*
