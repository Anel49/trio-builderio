import type { Request, Response } from "express";
import { pool } from "./db";

export async function createFeedback(req: Request, res: Response) {
  try {
    const userId = (req as any).session?.userId;
    if (!userId) {
      return res.status(401).json({ ok: false, error: "Not authenticated" });
    }

    const { categories, details } = req.body;

    // Validate required fields
    if (!categories || !Array.isArray(categories) || categories.length === 0) {
      return res.status(400).json({
        ok: false,
        error: "Missing required field: categories (must be a non-empty array)",
      });
    }

    if (
      !details ||
      typeof details !== "string" ||
      details.trim().length === 0
    ) {
      return res.status(400).json({
        ok: false,
        error: "Missing required field: details (must be a non-empty string)",
      });
    }

    // Insert feedback into database
    const result = await pool.query(
      `insert into feedback (status, categories, details, created_by_id, updated_by_id, created_at, updated_at)
       values ($1, $2, $3, $4, $4, now(), now())
       returning id, status, created_at`,
      ["submitted", JSON.stringify({ categories }), details.trim(), userId],
    );

    const feedback = result.rows[0];

    res.json({
      ok: true,
      feedback: {
        id: feedback.id,
        status: feedback.status,
        createdAt: feedback.created_at,
      },
    });
  } catch (error: any) {
    console.error("[createFeedback] Error:", error);
    res.status(500).json({ ok: false, error: String(error?.message || error) });
  }
}
