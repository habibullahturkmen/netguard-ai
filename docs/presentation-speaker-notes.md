# NetGuard AI — Presentation Speaker Notes

**Team:** Cyber Experts · **Institution:** Humber Polytechnic  
**Use with:** [NetGuard-AI-Presentation.md](NetGuard-AI-Presentation.md) and images in [presentation-images/](presentation-images/)

This document explains **what each slide is for**, **what to say**, and **how to handle questions**. Aim for **12–15 minutes** total (~1 minute per slide), leaving time for a live demo or Q&A if your instructor allows it.

---

## How to use this guide

| Column | Meaning |
|--------|---------|
| **Purpose** | Why this slide exists in the story |
| **Say this** | Suggested script — adapt to your own words |
| **Emphasize** | Must-land points for marks and clarity |
| **Transition** | One sentence into the next slide |
| **If asked…** | Likely questions and short answers |

**Tip:** Split slides among teammates (e.g. 3 slides each for a 5-person team). Person 1 opens and closes; one person owns the architecture + detection slides; one owns demo scenarios.

---

## Slide 1 — Title

**Purpose:** Introduce the project, team, and tech stack. Set a professional tone in the first 30 seconds.

**Say this:**

> Good [morning/afternoon]. We are **Cyber Experts**, and today we are presenting **NetGuard AI** — a lightweight, machine-learning-based network monitoring and intrusion detection system.
>
> Our stack is **Python** for ML and live capture, **Node.js** for the API, **React** for the dashboard, and **PostgreSQL** for storage. This is our **Final Group Project** for Humber Polytechnic.

**Emphasize:**

- Project name and what it does (monitoring + intrusion detection)
- That it is **ML-based** but also practical for **labs and small environments**
- Team name and institution

**Transition:**

> To set the context, let us start with why a system like this is needed.

**If asked…**

- *“What makes this different from Snort or Suricata?”* — Those are mature signature-based IDS tools. We built an **educational, lightweight** stack that combines **ML anomaly detection** with **simple rules** and a **web dashboard**, not a production replacement for enterprise IDS.

**Timing:** ~30–45 seconds

---

## Slide 2 — Introduction

**Purpose:** Explain the problem space and introduce NetGuard AI’s high-level pipeline.

**Say this:**

> Networks today face threats like unauthorized access, **port scanning**, and **denial-of-service** attacks. Many traditional tools rely on **fixed signatures** — they need constant updates and often miss **new or behavioral** attacks.
>
> Manual log review also does not scale. Full enterprise IDS platforms are powerful but **expensive and complex** for classrooms and small teams.
>
> **NetGuard AI** addresses that gap. It is a lightweight IDS for **labs, classrooms, and small organizations**. Traffic is collected via **live capture or API**, features are extracted, each flow is classified as **Normal or Suspicious** using **ML plus rules**, results are stored in **PostgreSQL**, and everything is shown on a **web dashboard**.

**Emphasize:**

- The **five-step pipeline** (collect → features → classify → store → dashboard)
- Target audience: **education and small scale**, not Fortune 500 SOC

**Transition:**

> That motivation leads directly to our formal problem statement.

**If asked…**

- *“Who is the end user?”* — A **lab administrator**, **student**, or **small IT team** who needs visibility into suspicious traffic without deploying a full commercial IDS.

**Timing:** ~1 minute

---

## Slide 3 — Problem Statement

**Purpose:** Show you understand real-world challenges and how your design responds.

**Say this:**

> We identified four main challenges.
>
> First, **signature-based tools** need constant rule updates and can miss **zero-day** or **behavioral** attacks.
>
> Second, **manual log review** does not scale — administrators miss patterns in high-volume traffic.
>
> Third, **enterprise IDS** is costly and complex — smaller teams need something simpler.
>
> Fourth, **detection alone is not enough** — results must be **visible and actionable** on a dashboard.
>
> Our response is a **hybrid approach**: **machine learning** learns patterns from historical data like NSL-KDD, **rule-based detection** gives fast, explainable labels for **DoS** and **port scans**, and a **single dashboard** ties it all together.

**Emphasize:**

- **Hybrid ML + rules** — this is a core design decision, not an afterthought
- **Actionable dashboard** — aligns with proposal objectives

**Transition:**

> From that problem, we defined clear project objectives and mapped them to what we actually delivered.

**If asked…**

- *“Why not rules only?”* — Rules are great for known patterns like SYN floods, but ML helps catch **broader anomalies** not hand-coded in every rule.
- *“Why not ML only?”* — Rules give **100% confidence** and **named attack types** for demos and explainability; ML handles the rest.

**Timing:** ~1 minute

---

## Slide 4 — Project Objectives

**Purpose:** Prove alignment with the proposal — every objective checked off.

**Say this:**

> Our **main objective** was to design and implement an ML-based network monitoring system that detects suspicious traffic and presents results through a dashboard.
>
> We broke that into six specific objectives from our proposal, and **all six are delivered**:
>
> 1. **Capture and analyze traffic** — live sniffer plus manual API for testing  
> 2. **Extract features** — 41 NSL-KDD-style features per time window  
> 3. **Train on public datasets** — Random Forest on **NSL-KDD**  
> 4. **Classify traffic** — binary Normal/Suspicious plus **attack type** labels  
> 5. **Store logs** — PostgreSQL with `traffic_logs` and `alerts`  
> 6. **Visualize** — multi-page **React** dashboard  

**Emphasize:**

- Point at each **✅** — evaluators want to see proposal → delivery mapping
- **41 features** and **NSL-KDD** show technical depth

**Transition:**

> Not everything in cybersecurity belongs in v1 — slide 5 clarifies what we included, what we added, and what we intentionally left out.

**If asked…**

- *“Did you miss any proposal goals?”* — Core goals are met; extras like alert engine and port-scan rules **exceed** minimum scope.

**Timing:** ~1 minute

---

## Slide 5 — Scope of the Project

**Purpose:** Show realistic boundaries — what you built, what you added, what you did not promise.

**Say this:**

> **Included**, as proposed: traffic monitoring, feature extraction, ML anomaly detection, log storage, and a dashboard with statistics and alerts.
>
> **We also implemented** beyond the minimum: **DoS rules**, **port scan rules**, **attack type labels**, an **alert engine** after three consecutive suspicious events, **paginated logs**, separate UI pages, and an optional **IP whitelist** for trusted destinations.
>
> **Out of scope** by design: we do **not** auto-block traffic or integrate with a firewall, we do **not** detect application-layer attacks like SQL injection, and we do **not** send email or Slack notifications. Those are natural **future work** items.

**Emphasize:**

- Being **honest about limits** shows maturity
- **Alert engine** and **attack types** are differentiators for your demo

**Transition:**

> Next is how we built it — our methodology from dataset to testing.

**If asked…**

- *“Why no firewall integration?”* — Would require root access, policy management, and legal/operational risk; our focus was **detection and visibility** in a lab.
- *“Why no SQL injection detection?”* — That needs **application-layer** inspection (HTTP payloads), not flow-level features.

**Timing:** ~1 minute

---

## Slide 6 — Methodology

**Purpose:** Walk through the engineering pipeline in order — shows systematic work.

**Say this:**

> Our methodology follows six phases.
>
> **Phase 1 — Dataset:** We studied NSL-KDD and CICIDS2017 as proposed; we **trained on NSL-KDD** using `train_real_dataset.py`.
>
> **Phase 2 — Preprocessing:** We cleaned data, applied **label encoding** for protocol, service, and flag, and aligned a **41-feature schema** with our runtime API.
>
> **Phase 3 — Model:** We used a **Random Forest** with 100 trees for **binary** Normal vs Suspicious classification.
>
> **Phase 4 — Backend:** **Node.js / Express / TypeScript** exposes `/api/analyze`, `/api/logs`, and `/api/alerts`, and writes to PostgreSQL.
>
> **Phase 5 — Frontend:** **React** dashboard with Overview, Traffic, Analytics, Alerts, and Logs.
>
> **Phase 6 — Testing:** Manual **curl** payloads, **live sniffer**, and lab tools like **hping3** and **nmap** — only on networks we control.

**Emphasize:**

- **End-to-end pipeline** — not just a model in a notebook
- **Same 41 features** at train time and runtime (important for ML credibility)

**Transition:**

> Methodology becomes clearer when you see how the components connect — that is our architecture.

**If asked…**

- *“Why NSL-KDD and not CICIDS2017?”* — NSL-KDD is well-documented for coursework, smaller to train, and matches our **41-feature** design; CICIDS2017 is listed as **future work** for modern traffic.

**Timing:** ~1–1.5 minutes

---

## Slide 7 — System Architecture

**Purpose:** Technical centerpiece — how data flows through the system.

**Say this:**

> Traffic enters from two sources: our **live sniffer** (`live_sniffer.py` with Scapy) or **manual API** calls for testing.
>
> Everything goes to the **backend** at `/api/analyze` on port **5000**.
>
> The backend first runs **rules**: if DoS or port-scan thresholds match, we mark the flow **Suspicious** with a specific **attack_type** and skip ML for that decision.
>
> If rules do not fire, the backend sends features to the **ML service** on port **8000** at `/predict`. The model returns Normal or Suspicious plus a probability.
>
> Every result is saved to **`traffic_logs`** in PostgreSQL. If we see **three consecutive suspicious** windows to the same destination, we also insert an **alert**.
>
> The **React dashboard** on port **5173** reads logs and alerts and refreshes every few seconds.

**Emphasize:**

- **Rules before ML** — faster and explainable for known attacks
- **Three-tier stack:** sniffer → backend → ML → DB → UI
- Port numbers if instructor cares about deployment

**Transition:**

> Architecture is the map; slide 8 is the detail — exactly how we decide Normal vs Suspicious.

**If asked…**

- *“What if the ML service is down?”* — The backend can still apply **rules** and log results; ML-dependent flows may fail or fall back depending on error handling — worth knowing your actual code path.
- *“Why separate ML service?”* — Python ecosystem for scikit-learn; Node for API and DB; **separation of concerns** and easier scaling in theory.

**Timing:** ~1.5 minutes (important slide — do not rush)

---

## Slide 8 — Detection Methods

**Purpose:** Prove you understand detection logic — rules and ML thresholds.

**Say this:**

> We use **three detection paths**.
>
> **Machine learning:** Random Forest with **100 estimators** and **41 NSL-KDD features** — duration, byte counts, error rates, host statistics, and so on. Output is Normal or Suspicious with an **attack probability**. We use threshold **0.4** — if probability is at or above 40%, we treat it as Suspicious and label **`ml_anomaly`**.
>
> **Rule-based DoS:** All three must be true in one window: **count ≥ 200**, **serror_rate ≥ 0.8**, **dst_host_count ≥ 50**. That matches SYN-flood-style patterns. Result: Suspicious, **`dos`**, confidence **100%**.
>
> **Rule-based port scan:** **count ≥ 50** and **unique_dport_count ≥ 20** — many connections to different ports on one host. Result: Suspicious, **`port_scan`**, confidence **100%**.

**Emphasize:**

- **Concrete numbers** — evaluators may ask you to recite thresholds
- **attack_type** field distinguishes DoS, port scan, and ML anomaly

**Transition:**

> Detections are persisted in PostgreSQL — let us look at the database design.

**If asked…**

- *“Why threshold 0.4?”* — Tuned for demo balance: lower catches more anomalies but increases false positives; 0.4 was chosen to align backend and ML service behavior.
- *“What is serror_rate?”* — Share of connections with **SYN errors**, common in flood traffic.

**Timing:** ~1.5 minutes

---

## Slide 9 — Database Design

**Purpose:** Show data model and alert logic.

**Say this:**

> The main table is **`traffic_logs`**. It stores source and destination IP, protocol, service, **prediction**, **attack_type**, **confidence**, flow stats like duration and bytes, and **created_at**.
>
> **attack_type** can be **`none`**, **`dos`**, **`port_scan`**, or **`ml_anomaly`**.
>
> The **`alerts`** table stores **confirmed** incidents. An alert is created when we detect **three consecutive suspicious** windows targeting the **same destination IP**, with a **five-minute cooldown** to avoid duplicate alerts.
>
> Alerts retain attack type, confidence, a JSON **features** snapshot, and timestamp — useful for forensics and demo.

**Emphasize:**

- Difference between **every log row** vs **alert row** (volume vs confirmed incident)
- **3 consecutive suspicious** — matches your demo on slide 12

**Transition:**

> Data is useless without visibility — the dashboard is how users interact with the system.

**If asked…**

- *“Why JSON features on alerts?”* — Preserves the **exact feature vector** at alert time for debugging and report appendices.

**Timing:** ~1 minute

---

## Slide 10 — Web Dashboard

**Purpose:** Show the user-facing product — ideally live-demo this slide.

**Say this:**

> Our dashboard is a **multi-page React app** styled with **Humber branding** — navy and gold.
>
> **Overview** shows total logs, normal vs suspicious counts, charts over time, classification breakdown, attack types, and a **recent predictions** table.
>
> **Traffic** has a bar chart of normal vs suspicious distribution.
>
> **Analytics** breaks down protocol, service, flags, and status in pie charts.
>
> **Alerts** lists confirmed suspicious events from the alert engine.
>
> **Logs** is a **paginated** full history with an **Attack Type** column.
>
> The UI **auto-refreshes every 5 seconds** so live capture feels real-time during a demo.

**Emphasize:**

- **Live demo** if possible: open Overview, trigger a curl DoS, show row appear
- **Five pages** map to different user tasks (summary vs detail vs alerts)

**Transition:**

> The UI reflects model quality — slide 11 covers evaluation metrics.

**If asked…**

- *“Can you export logs?”* — Currently via API/DB; CSV export could be future work.

**Timing:** ~1 minute (+ demo time if separate)

**Demo tip:** Have backend, ML, and frontend already running. Keep `WHITELIST_ENABLED=false` for local attack tests.

---

## Slide 11 — Evaluation Metrics

**Purpose:** Quantify ML performance and system behavior.

**Say this:**

> On **NSL-KDD**, our Random Forest achieved roughly **96.2% accuracy**, **95.8% precision**, **96.5% recall**, and **96.1% F1-score**. We also used a **confusion matrix** as proposed.
>
> These metrics show the model **generalizes well** on held-out test data for binary Normal vs Suspicious classification.
>
> For **system evaluation**: API scoring is **near real-time** — typically under a few seconds per flow. **Usability** is supported by separate dashboard pages. **Lab testing** is documented with reproducible steps using curl, hping3, and nmap in `docs/attack-readme.md`.

**Emphasize:**

- **Precision vs recall** — precision = fewer false alarms; recall = catch more attacks
- Metrics are on **dataset evaluation**, not necessarily your live Wi‑Fi traffic

**Transition:**

> Numbers are good — slide 12 shows how we prove the system works in the lab.

**If asked…**

- *“Is 96% on live traffic?”* — No; it is on **NSL-KDD test split**. Live traffic validation is qualitative via **demo scenarios**.
- *“False positives?”* — Possible on ML path; rules are deterministic. Whitelist can reduce noise to trusted IPs.

**Timing:** ~1 minute

---

## Slide 12 — Demo Scenarios (Lab Only)

**Purpose:** Show practical validation — critical if you live-demo.

**Say this:**

> We defined six lab scenarios — **only on networks and hosts we own**.
>
> 1. **Normal traffic** — typical HTTP-style curl → **Normal**, attack_type **none**  
> 2. **DoS via API** — high count and serror_rate → **DoS**, **100%** confidence  
> 3. **Port scan via API** — high unique_dport_count → **Port Scan**  
> 4. **DoS live** — hping3 SYN flood with live sniffer → DoS on dashboard  
> 5. **Port scan live** — nmap with sniffer → port scan rows  
> 6. **Alert chain** — three DoS curls to the **same destination IP** → row on **Alerts** page  

**Emphasize:**

> **Safety:** Never run hping3 or nmap against systems you do not control — say this clearly for academic integrity.

- Scenario **6** proves the **alert engine**, not just single log lines

**Transition:**

> These demos support the outcomes we promised in the proposal.

**If asked…**

- *“Show us now.”* — Walk through scenario 2 or 6 with pre-written curl from `test_routes.http`.
- *“Why three times for alert?”* — Reduces one-off false positives; mimics **sustained** attack behavior.

**Timing:** ~1 minute (+ live demo 2–3 minutes if scheduled)

**Prep checklist:**

- [ ] ML service :8000, backend :5000, frontend :5173 running  
- [ ] `WHITELIST_ENABLED=false` in backend `.env`  
- [ ] curl commands ready in terminal tabs  

---

## Slide 13 — Expected Outcomes

**Purpose:** Close the loop back to proposal promises.

**Say this:**

> We mapped each **expected outcome** from the proposal to what we delivered.
>
> Classify traffic as normal or suspicious — **done** with ML and rules.  
> Demonstrate ML effectiveness — **~96% accuracy** on NSL-KDD.  
> Simple dashboard — **multi-page React UI** with Humber styling.  
> Efficient PostgreSQL storage — **traffic_logs**, **alerts**, pagination.  
> Practical for education — **documented setup**, attack readme, and testing guide.  

**Emphasize:**

- This slide answers *“Did you achieve what you said you would?”* — say **yes** with evidence

**Transition:**

> With outcomes met, we can summarize conclusions and future direction.

**If asked…**

- *“What was hardest?”* — Good team answer: feature alignment between sniffer, API, and model; or tuning rules vs ML; pick something real.

**Timing:** ~45 seconds

---

## Slide 14 — Conclusion

**Purpose:** Strong closing argument — value, limitations, future.

**Say this:**

> **NetGuard AI** is a practical, lightweight IDS for **education and small-scale** use.
>
> **Machine learning** handles general anomaly detection. **Rules** give clear **DoS** and **port-scan** labels. **Live capture** makes lab demos realistic. The **dashboard** brings monitoring, analytics, and alerts together.
>
> We showed that AI can support network security **without** the cost and complexity of enterprise platforms.
>
> **Future work** includes subnet-level alerts, **firewall integration**, **multi-class** ML beyond binary labels, training on **CICIDS2017**, and **email or Slack** notifications.

**Emphasize:**

- **Educational value** — what you learned as a team
- **Honest future work** — shows you understand gaps

**Transition:**

> We have documented everything for reproducibility — our references slide.

**If asked…**

- *“Would you deploy this in production?”* — Not as-is; it needs hardening, auth, HTTPS, monitoring, and legal review — but it is a **strong proof of concept**.

**Timing:** ~1 minute

---

## Slide 15 — References (APA 7)

**Purpose:** Cite academic sources and project proposal; point to Slide 16 for software.

**Say this:**

> Our references follow **APA 7th edition**. Key academic sources include Tavallaee et al. (2009) for NSL-KDD, Breiman (2001) for Random Forest, Pedregosa et al. (2011) for scikit-learn, and Sharafaldin et al. (2018) for CICIDS2017 as future work. We also cite Garcia-Teodoro et al. (2009) for anomaly-based IDS background and Lippmann et al. (2000) for the original KDD benchmark. Our group proposal is cited as Cyber Experts (2025). Software references continue on the next slide; the full list is in our written report.

**Emphasize:** Name at least **three** academic sources aloud.

**Transition:** > Software and lab tools are listed on our final slide.

**Timing:** ~45 seconds

---

## Slide 16 — References (continued)

**Purpose:** Complete the APA reference list for all tools; close with thank you.

**Say this:**

> Slide 16 lists the software we used: Python, FastAPI, Scapy, Express, Node.js, React, PostgreSQL, pandas, Chart.js, curl, hping3, Nmap, and others — all formatted in APA 7. The complete reference section with in-text citations throughout the report is in **`docs/NetGuard-AI-Written-Report.md`**, which we submit alongside these slides. **Thank you — we welcome your questions.**

**Emphasize:** Full bibliography exists in the **written report**; slides show everything, report has hanging-indent formatting.

**If asked…**

- *“Can we see the report?”* — Yes, `docs/NetGuard-AI-Written-Report.md` or exported PDF.

**Timing:** ~30 seconds

---

## Suggested presentation roles (5 teammates)

| Teammate | Slides | Role |
|----------|--------|------|
| A | 1, 2, 15–16 | Opening, intro, references + Q&A |
| B | 3, 4, 13 | Problem, objectives, outcomes |
| C | 5, 6 | Scope, methodology |
| D | 7, 8, 9 | Architecture, detection, database |
| E | 10, 11, 12 | Dashboard, metrics, demo |

Adjust for team size. Everyone should be able to answer one question on **architecture** and one on **detection rules**.

---

## Quick Q&A cheat sheet

| Question | Short answer |
|----------|--------------|
| What dataset? | NSL-KDD, binary Normal vs Suspicious |
| What algorithm? | Random Forest, 100 trees |
| How is DoS detected? | count ≥ 200, serror_rate ≥ 0.8, dst_host_count ≥ 50 |
| How is port scan detected? | count ≥ 50, unique_dport_count ≥ 20 |
| When is an alert created? | 3 consecutive suspicious windows, same destination |
| ML threshold? | 0.4 (40% probability) |
| Ports? | ML 8000, backend 5000, frontend 5173, PostgreSQL 5432 |
| Live capture tool? | `live_sniffer.py` (Scapy) |
| Out of scope? | Firewall block, app-layer attacks, notifications |

---

## Pre-presentation checklist

- [ ] Slide images display correctly (PDF or Markdown viewer)
- [ ] All services start without errors
- [ ] Model trained (`model.pkl` exists locally)
- [ ] Database migrated (`attack_type` column if using alerts)
- [ ] Demo curls tested once the same day
- [ ] Each member read their slides + this notes section
- [ ] Timer run-through once (~12 min talk + 3 min demo + 5 min Q&A)

---

*Good luck — Cyber Experts.*
