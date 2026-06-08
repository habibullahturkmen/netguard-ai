// import { Router } from "express";
// import { db } from "../db";
// import { getPrediction } from "../services/mlService";
//
// const router = Router();
//
// router.post("/", async (req, res) => {
//   try {
//     const {
//       source_ip,
//       destination_ip,
//       protocol,
//       duration,
//       src_bytes,
//       dst_bytes,
//     } = req.body;
//
//     const predictionResult = await getPrediction(
//       duration,
//       src_bytes,
//       dst_bytes
//     );
//
//     const query = `
//       INSERT INTO traffic_logs
//       (
//         source_ip,
//         destination_ip,
//         protocol,
//         prediction,
//         confidence
//       )
//       VALUES ($1,$2,$3,$4,$5)
//       RETURNING *
//     `;
//
//     const values = [
//       source_ip,
//       destination_ip,
//       protocol,
//       predictionResult.prediction,
//       predictionResult.confidence,
//     ];
//
//     const result = await db.query(query, values);
//
//     res.status(201).json({
//       message: "Traffic analyzed successfully",
//       data: result.rows[0],
//     });
//
//   } catch (error) {
//     console.error(error);
//
//     res.status(500).json({
//       message: "Analysis failed",
//     });
//   }
// });
//
// export default router;

import { Router } from "express";
import { db } from "../db";
import { getPrediction } from "../services/mlService";
import { buildFeatures } from "../utils/buildFeatures";

const router = Router();

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
    } = req.body;

    // 🔥 STEP 1: build full ML feature vector
    const features = buildFeatures({
      protocol,
      service,
      flag,
      duration,
      src_bytes,
      dst_bytes,
    });

    // 🔥 STEP 2: call ML service
    const mlResponse = await getPrediction(features);

    // 🔥 STEP 3: store in DB
    const query = `
      INSERT INTO traffic_logs (
        source_ip,
        destination_ip,
        protocol,
        service,
        prediction,
        confidence
      )
      VALUES ($1,$2,$3,$4,$5,$6)
      RETURNING *
    `;

    const values = [
      source_ip,
      destination_ip,
      protocol ?? "tcp",
      service ?? "http",
      mlResponse.prediction,
      mlResponse.confidence,
    ];

    const result = await db.query(query, values);

    res.json({
      message: "Traffic analyzed successfully",
      data: result.rows[0],
      ml: mlResponse,
      features
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "analysis failed" });
  }
});

export default router;
