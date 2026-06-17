import express from "express";
import cors from "cors";
import logRoutes from "./routes/logRoutes";
import analyzeRoutes from "./routes/analyzeRoutes";
import alertRoutes from "./routes/alertRoutes";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/logs", logRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/analyze", analyzeRoutes);

export default app;
