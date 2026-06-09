import { Router } from "express";
import { db } from "../db";
import { getPrediction } from "../services/mlService";
import { buildFeatures } from "../utils/buildFeatures";
import dotenv from "dotenv";

dotenv.config();

const router = Router();

// Config (adjust via env)
const ALERT_CONSECUTIVE = Number(process.env.ALERT_CONSECUTIVE || 3); // require N consecutive suspicious windows
const ALERT_COOLDOWN = Number(process.env.ALERT_COOLDOWN || 300); // seconds
const MIN_COUNT = Number(process.env.MIN_COUNT || 3); // match live_sniffer SEND_THRESHOLD default
const MIN_DST_HOST_COUNT = Number(process.env.MIN_DST_HOST_COUNT || 5); // minimal distinct srcs
const MIN_SERROR_RATE = Number(process.env.MIN_SERROR_RATE || 0.3); // minimal serror_rate to consider
const ML_THRESHOLD = Number(process.env.ML_THRESHOLD || 0.4); // fallback when ML service omits prediction
const WHITELIST_PREFIXES = (process.env.WHITELIST_PREFIXES || "").split(",").map(s => s.trim()).filter(Boolean);
const DOS_COUNT_THRESHOLD = Number(process.env.DOS_COUNT_THRESHOLD || 200);
const DOS_SERROR_THRESHOLD = Number(process.env.DOS_SERROR_THRESHOLD || 0.8);
const DOS_DST_HOST_COUNT = Number(process.env.DOS_DST_HOST_COUNT || 50);

// In-memory state (per-destination IP). For production, use Redis.
type StateEntry = { consecutive: number; lastAlertAt?: number; lastSeenAt: number };
const state = new Map<string, StateEntry>();

function isWhitelisted(ip: string | undefined): boolean {
  if (!ip) return false;
  for (const p of WHITELIST_PREFIXES) {
    if (!p) continue;
    if (ip.startsWith(p)) return true; // simple prefix match (e.g., "192.168.")
  }
  return false;
}

function nowSec(): number {
  return Math.floor(Date.now() / 1000);
}

router.post("/", async (req, res) => {
  try {
    const {
      source_ip,
      destination_ip,
      protocol,
      service,
      flag,
      duration,
      src_bytes,
      dst_bytes,
      count,
      dst_host_count,
      serror_rate,
    } = req.body;

    // 1) quick filter: ignore whitelisted destinations (still record if you want; here we skip)
    // if (isWhitelisted(destination_ip) || isWhitelisted(source_ip)) {
    //   return res.status(200).json({ message: "Whitelisted - ignored" });
    // }

    // 2) build features and call ML service
    const features = buildFeatures({
      protocol,
      service,
      flag,
      duration,
      src_bytes,
      dst_bytes,
      count,
      dst_host_count,
      serror_rate,
    });

    const maybeCount = Number(req.body.count ?? 0);
    const maybeSerror = Number(req.body.serror_rate ?? 0);
    const maybeDstHosts = Number(req.body.dst_host_count ?? 0);

    // If this rule matches, treat as suspicious immediately (bypass ML)
    const isDeterministicDos = (maybeCount >= DOS_COUNT_THRESHOLD)
      && (maybeSerror >= DOS_SERROR_THRESHOLD)
      && (maybeDstHosts >= DOS_DST_HOST_COUNT);

    let mlResponse;
    if (isDeterministicDos) {
      // create traffic_logs row with Suspicious and also insert into alerts (existing code path)
      // You can shortcut by setting mlResponse/predictedLabel accordingly:
      mlResponse = { prediction: "Suspicious", confidence: 1.0, model_label: "rule:detection" };
      // then proceed to insertTraffic (the code below will insert) and alert handling
    } else {
      mlResponse = await getPrediction(features);
    }


    const attackProb = Number(mlResponse.confidence ?? 0);

    // Map raw model labels without fragile substring checks (e.g. "abnormal" ≠ "normal")
    function modelLabelToText(lbl: unknown): "Suspicious" | "Normal" | null {
      if (lbl === null || typeof lbl === "undefined") return null;
      const s = String(lbl).toLowerCase().trim();

      const suspiciousExact = new Set([
        "1", "true", "suspicious", "anomaly", "attack", "malicious", "intrusion",
      ]);
      const normalExact = new Set(["0", "false", "normal", "benign"]);

      if (suspiciousExact.has(s) || s.startsWith("rule:")) return "Suspicious";
      if (normalExact.has(s)) return "Normal";
      if (/^(attack|anomaly|malicious|intrusion|suspicious)/.test(s)) return "Suspicious";
      if (/^(normal|benign)$/.test(s)) return "Normal";

      return null;
    }

    // Trust ML service prediction first; only re-threshold when it is missing or unknown
    const mlPrediction = mlResponse.prediction;
    let predictedLabel: "Suspicious" | "Normal";
    if (mlPrediction === "Suspicious" || mlPrediction === "Normal") {
      predictedLabel = mlPrediction;
    } else {
      const fromModelLabel = modelLabelToText(mlResponse.model_label);
      predictedLabel = fromModelLabel ?? (attackProb >= ML_THRESHOLD ? "Suspicious" : "Normal");
    }

    // logging for debugging
    console.info("ML_RESPONSE:", { predictedLabel, attackProb, mlResponse });

    // 3) numeric gating to avoid tiny events
    const nCount = Number(count ?? 0);
    const nDstHostCount = Number(dst_host_count ?? 0);
    const nSerror = Number(serror_rate ?? 0);
    const passesNumericGate = (nCount >= MIN_COUNT) || (nDstHostCount >= MIN_DST_HOST_COUNT) || (nSerror >= MIN_SERROR_RATE);

    // 4) update consecutive state
    const key = destination_ip || `${source_ip}->${destination_ip}` || "unknown";
    const entry = state.get(key) ?? { consecutive: 0, lastSeenAt: nowSec() };

    const isSuspectThisWindow = predictedLabel === "Suspicious";

    if (isSuspectThisWindow && passesNumericGate) {
      entry.consecutive = (entry.consecutive || 0) + 1;
    } else {
      entry.consecutive = 0;
    }
    entry.lastSeenAt = nowSec();

    const lastAlertAt = entry.lastAlertAt ?? 0;
    const inCooldown = (nowSec() - lastAlertAt) < ALERT_COOLDOWN;

    // 5) ALWAYS store into traffic_logs
    const insertTrafficQuery = `
      INSERT INTO traffic_logs (
        source_ip,
        destination_ip,
        protocol,
        service,
        prediction,
        confidence,
        duration,
        protocol_type,
        flag,
        src_bytes,
        dst_bytes,
        created_at
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11, CURRENT_TIMESTAMP)
      RETURNING *
    `;
    const trafficValues = [
      source_ip,
      destination_ip,
      protocol ?? "tcp",
      service ?? "http",
      predictedLabel,
      attackProb,
      duration ?? null,
      features.protocol_type ?? protocol ?? "tcp",
      features.flag ?? flag ?? "SF",
      src_bytes ?? 0,
      dst_bytes ?? 0,
    ];

    const trafficResult = await db.query(insertTrafficQuery, trafficValues);
    const insertedTraffic = trafficResult.rows[0];

    // 6) If alert conditions met, insert into alerts table (create alerts table separately)
    let insertedAlert = null;
    let alerted = false;

    if (entry.consecutive >= ALERT_CONSECUTIVE && !inCooldown) {
      // Create alerts table if you prefer to log alerts separately. Insert features JSON for context.
      const insertAlertQuery = `
        INSERT INTO alerts (
          source_ip,
          destination_ip,
          protocol,
          service,
          prediction,
          confidence,
          features,
          created_at
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7, CURRENT_TIMESTAMP)
        RETURNING *
      `;
      const alertValues = [
        source_ip,
        destination_ip,
        protocol ?? "tcp",
        service ?? "http",
        "Suspicious",
        attackProb,
        JSON.stringify(features),
      ];
      try {
        const alertResult = await db.query(insertAlertQuery, alertValues);
        insertedAlert = alertResult.rows[0];
      } catch (err) {
        // If alerts table doesn't exist, log and continue (so traffic still recorded)
        // @ts-ignore
        console.warn("Failed to insert alert (alerts table missing?), create alerts table if desired. Error:", err.message || err);
        insertedAlert = null;
      }

      entry.lastAlertAt = nowSec();
      entry.consecutive = 0;
      alerted = true;
    }

    // persist state
    state.set(key, entry);

    // 7) response
    res.json({
      message: "analyzed",
      ml: mlResponse,
      features,
      numericGate: passesNumericGate,
      consecutive: entry.consecutive,
      alerted,
      insertedTraffic,
      insertedAlert,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "analysis failed", details: String(err) });
  }
});

export default router;
