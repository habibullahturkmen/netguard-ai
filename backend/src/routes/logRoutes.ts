import { Router } from "express";
import { db } from "../db";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const page = Number(req.query.page);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));

    if (!Number.isNaN(page) && page >= 1) {
      const offset = (page - 1) * limit;
      const countResult = await db.query(
        "SELECT COUNT(*)::int AS total FROM traffic_logs"
      );
      const total = countResult.rows[0]?.total ?? 0;
      const result = await db.query(
        "SELECT * FROM traffic_logs ORDER BY created_at DESC LIMIT $1 OFFSET $2",
        [limit, offset]
      );

      return res.json({
        data: result.rows,
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      });
    }

    const recentLimit = Math.min(
      1000,
      Math.max(1, Number(req.query.recent) || 500)
    );
    const result = await db.query(
      "SELECT * FROM traffic_logs ORDER BY created_at DESC LIMIT $1",
      [recentLimit]
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch logs" });
  }
});

export default router;
