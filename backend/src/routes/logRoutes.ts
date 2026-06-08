import { Router } from "express";
import { db } from "../db";

const router = Router();

router.get("/", async (_, res) => {
  try {
    const result = await db.query(
      "SELECT * FROM traffic_logs ORDER BY created_at DESC"
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch logs",
    });
  }
});

export default router;
