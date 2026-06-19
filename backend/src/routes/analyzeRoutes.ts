import { Router } from "express";
import { db } from "../db";
import { getPrediction } from "../services/mlService";
import { buildFeatures } from "../utils/buildFeatures";
import dotenv from "dotenv";

dotenv.config();

const router = Router();

const ALERT_CONSECUTIVE = Number(process.env.ALERT_CONSECUTIVE || 3);
const ALERT_COOLDOWN = Number(process.env.ALERT_COOLDOWN || 300);
const MIN_COUNT = Number(process.env.MIN_COUNT || 3);
const MIN_DST_HOST_COUNT = Number(process.env.MIN_DST_HOST_COUNT || 5);
const MIN_SERROR_RATE = Number(process.env.MIN_SERROR_RATE || 0.3);
const ML_THRESHOLD = Number(process.env.ML_THRESHOLD || 0.4);
const WHITELIST_ENABLED =
  process.env.WHITELIST_ENABLED === "true" || process.env.WHITELIST_ENABLED === "1";
const WHITELIST_PREFIXES = (process.env.WHITELIST_PREFIXES || "")
  .split(",")
  .map((s) => s.trim().replace(/^["']|["']$/g, ""))
  .filter(Boolean);
const DOS_COUNT_THRESHOLD = Number(process.env.DOS_COUNT_THRESHOLD || 200);
const DOS_SERROR_THRESHOLD = Number(process.env.DOS_SERROR_THRESHOLD || 0.8);
const DOS_DST_HOST_COUNT = Number(process.env.DOS_DST_HOST_COUNT || 50);
const SCAN_COUNT_THRESHOLD = Number(process.env.SCAN_COUNT_THRESHOLD || 50);
const SCAN_UNIQUE_DPORT_THRESHOLD = Number(process.env.SCAN_UNIQUE_DPORT_THRESHOLD || 20);

type AttackType = "none" | "dos" | "port_scan" | "ml_anomaly";

type StateEntry = { consecutive: number; lastAlertAt?: number; lastSeenAt: number };
const state = new Map<string, StateEntry>();

function isWhitelisted(ip: string | undefined): boolean {
  if (!ip) return false;
  for (const p of WHITELIST_PREFIXES) {
    if (!p) continue;
    if (ip.startsWith(p)) return true;
  }
  return false;
}

function nowSec(): number {
  return Math.floor(Date.now() / 1000);
}

function formatAttackType(type: AttackType): string {
  switch (type) {
    case "dos": return "DoS";
    case "port_scan": return "Port Scan";
    case "ml_anomaly": return "ML Anomaly";
    default: return "—";
  }
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
      unique_dport_count,
    } = req.body;

    if (WHITELIST_ENABLED && isWhitelisted(destination_ip)) {
      return res.status(200).json({ message: "Whitelisted - ignored", destination_ip });
    }

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
      unique_dport_count,
    });

    const maybeCount = Number(count ?? req.body.count ?? 0);
    const maybeSerror = Number(serror_rate ?? 0);
    const maybeDstHosts = Number(dst_host_count ?? 0);
    const maybeUniqueDports = Number(
      unique_dport_count ?? req.body.unique_dport_count ?? 0
    );

    const isDeterministicDos =
      maybeCount >= DOS_COUNT_THRESHOLD &&
      maybeSerror >= DOS_SERROR_THRESHOLD &&
      maybeDstHosts >= DOS_DST_HOST_COUNT;

    const isPortScan =
      !isDeterministicDos &&
      maybeCount >= SCAN_COUNT_THRESHOLD &&
      maybeUniqueDports >= SCAN_UNIQUE_DPORT_THRESHOLD;

    let mlResponse: {
      prediction: string;
      confidence: number;
      model_label?: string;
    };
    let attackType: AttackType = "none";

    if (isDeterministicDos) {
      mlResponse = {
        prediction: "Suspicious",
        confidence: 1.0,
        model_label: "rule:dos",
      };
      attackType = "dos";
    } else if (isPortScan) {
      mlResponse = {
        prediction: "Suspicious",
        confidence: 1.0,
        model_label: "rule:portscan",
      };
      attackType = "port_scan";
    } else {
      mlResponse = await getPrediction(features);
    }

    const attackProb = Number(mlResponse.confidence ?? 0);

    let predictedLabel: "Suspicious" | "Normal";
    if (isDeterministicDos || isPortScan) {
      predictedLabel = "Suspicious";
    } else if (mlResponse.prediction === "Suspicious" || mlResponse.prediction === "Normal") {
      predictedLabel = mlResponse.prediction;
      attackType = predictedLabel === "Suspicious" ? "ml_anomaly" : "none";
    } else {
      predictedLabel = attackProb >= ML_THRESHOLD ? "Suspicious" : "Normal";
      attackType = predictedLabel === "Suspicious" ? "ml_anomaly" : "none";
    }

    console.info("ANALYZE:", {
      predictedLabel,
      attackType,
      attackProb,
      maybeCount,
      maybeUniqueDports,
      rule: isDeterministicDos ? "dos" : isPortScan ? "port_scan" : "ml",
    });

    const nCount = Number(count ?? 0);
    const nDstHostCount = Number(dst_host_count ?? 0);
    const nSerror = Number(serror_rate ?? 0);
    const passesNumericGate =
      nCount >= MIN_COUNT ||
      nDstHostCount >= MIN_DST_HOST_COUNT ||
      nSerror >= MIN_SERROR_RATE ||
      maybeUniqueDports >= SCAN_UNIQUE_DPORT_THRESHOLD;

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
    const inCooldown = nowSec() - lastAlertAt < ALERT_COOLDOWN;

    const insertTrafficQuery = `
      INSERT INTO traffic_logs (
        source_ip,
        destination_ip,
        protocol,
        service,
        prediction,
        attack_type,
        confidence,
        duration,
        protocol_type,
        flag,
        src_bytes,
        dst_bytes,
        created_at
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12, CURRENT_TIMESTAMP)
      RETURNING *
    `;
    const trafficValues = [
      source_ip,
      destination_ip,
      protocol ?? "tcp",
      service ?? "http",
      predictedLabel,
      attackType,
      attackProb,
      duration ?? null,
      features.protocol_type ?? protocol ?? "tcp",
      features.flag ?? flag ?? "SF",
      src_bytes ?? 0,
      dst_bytes ?? 0,
    ];

    const trafficResult = await db.query(insertTrafficQuery, trafficValues);
    const insertedTraffic = trafficResult.rows[0];

    let insertedAlert = null;
    let alerted = false;

    if (entry.consecutive >= ALERT_CONSECUTIVE && !inCooldown) {
      const insertAlertQuery = `
        INSERT INTO alerts (
          source_ip,
          destination_ip,
          protocol,
          service,
          prediction,
          attack_type,
          confidence,
          features,
          created_at
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8, CURRENT_TIMESTAMP)
        RETURNING *
      `;
      const alertValues = [
        source_ip,
        destination_ip,
        protocol ?? "tcp",
        service ?? "http",
        "Suspicious",
        attackType,
        attackProb,
        JSON.stringify({ ...features, unique_dport_count: maybeUniqueDports }),
      ];
      try {
        const alertResult = await db.query(insertAlertQuery, alertValues);
        insertedAlert = alertResult.rows[0];
      } catch (err) {
        // @ts-ignore
        console.warn("Failed to insert alert:", err.message || err);
      }

      entry.lastAlertAt = nowSec();
      entry.consecutive = 0;
      alerted = true;
    }

    state.set(key, entry);

    res.json({
      message: "analyzed",
      attack_type: attackType,
      attack_type_label: formatAttackType(attackType),
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
