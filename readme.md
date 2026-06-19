# NetGuard AI

Network intrusion detection demo: live packet capture → Express backend → FastAPI ML service → PostgreSQL → React dashboard.

## Documentation

| Doc | Contents |
|-----|----------|
| **[docs/NetGuard-AI-Written-Report.md](docs/NetGuard-AI-Written-Report.md)** | **Written report (APA 7) — submit alongside slides** |
| [docs/presentation-slides](docs/presentation-slides.pdf) | Humber-branded slide graphics (PNG) |
| **[docs/attack-readme.md](docs/attack-readme.md)** | **Attack demos: DoS, port scan, hping3, nmap, alert chain** |
| [docs/testing-the-project.md](docs/testing-the-project.md) | Full install (Windows + Linux), train model, smoke tests |
| [docs/features-v1.md](docs/features-v1.md) | Detection capabilities and limits |

## Quick start (Linux)

After clone, you **must train the model locally** — `model.pkl` and `encoders.pkl` are not in GitHub.

```bash
# 1. Database
sudo -u postgres psql -c "CREATE USER netguard_user WITH PASSWORD 'your_password';"
sudo -u postgres psql -c "CREATE DATABASE netguard_ai OWNER netguard_user;"
psql -U netguard_user -d netguard_ai -f backend/src/db/schema.sql

# 2. ML model
cd ml-service && python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cd model && python train_real_dataset.py   # needs NSL-KDD-Train.csv

# 3. Apps
cd ../../backend && pnpm install
cd ../frontend && pnpm install
# Create backend/.env and frontend/.env — see testing doc
```

Start services (3 terminals): ML `:8000` → backend `:5000` → frontend `:5173`.

**Windows, env templates, verification steps, and hping3 tests:** see [docs/testing-the-project.md](docs/testing-the-project.md).

## Live capture (optional)

```bash
cd ml-service
sudo venv/bin/python sensors/live_sniffer.py \
  --iface wlo1 \
  --backend http://127.0.0.1:5000/api/analyze \
  --window 5 \
  --send-threshold 3
```

Replace `wlo1` with your interface (`ip link` on Linux).

## Whitelist

| Profile | `backend/.env` |
|---------|----------------|
| Local testing | `WHITELIST_ENABLED=false` |
| Production / demo | `WHITELIST_ENABLED=true` |

Restart backend after changing `.env`.

---

## Development notes

### Report statement

The Random Forest classifier was trained using a processed subset of the NSL-KDD intrusion detection dataset. The model was configured as a binary classifier, categorizing network traffic into Normal and Suspicious classes. Performance was evaluated using accuracy, precision, recall, and F1-score metrics.

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

Microsoft. (n.d.). *TypeScript* [Computer software]. https://www.typescriptlang.org/

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