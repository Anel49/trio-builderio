import type { Request, Response } from "express";
import { pool } from "./db";

export async function isUsersBlocked(
  userId1: number,
  userId2: number,
): Promise<boolean> {
  try {
    const result = await pool.query(
      `select count(*) as count from user_blocks
       where (actor_id = $1 and target_id = $2)
          or (actor_id = $2 and target_id = $1)`,
      [userId1, userId2],
    );
    return parseInt(result.rows[0]?.count || "0", 10) > 0;
  } catch (error) {
    console.error("[isUsersBlocked] Error:", error);
    return false;
  }
}

export async function getBlockStatus(req: Request, res: Response) {
  try {
    const userId = (req as any).session?.userId;
    const { otherUserId } = req.query;

    if (!userId) {
      return res.status(401).json({ ok: false, error: "Not authenticated" });
    }

    if (!otherUserId || typeof otherUserId !== "string") {
      return res.status(400).json({
        ok: false,
        error: "Missing or invalid required parameter: otherUserId",
      });
    }

    const otherUserIdNum = parseInt(otherUserId, 10);
    if (isNaN(otherUserIdNum)) {
      return res.status(400).json({
        ok: false,
        error: "Invalid otherUserId",
      });
    }

    const isBlocked = await isUsersBlocked(userId, otherUserIdNum);

    res.json({
      ok: true,
      isBlocked,
    });
  } catch (error: any) {
    console.error("[getBlockStatus] Error:", error);
    res.status(500).json({ ok: false, error: String(error?.message || error) });
  }
}

export async function createUserBlock(req: Request, res: Response) {
  try {
    const actorId = (req as any).session?.userId;
    if (!actorId) {
      return res.status(401).json({ ok: false, error: "Not authenticated" });
    }

    const { targetId } = req.body;

    // Validate required fields
    if (!targetId || typeof targetId !== "number") {
      return res.status(400).json({
        ok: false,
        error: "Missing or invalid required field: targetId",
      });
    }

    // Prevent blocking yourself
    if (actorId === targetId) {
      return res.status(400).json({
        ok: false,
        error: "You cannot block yourself",
      });
    }

    // Check if block already exists
    const existingBlock = await pool.query(
      `select id from user_blocks where actor_id = $1 and target_id = $2`,
      [actorId, targetId],
    );

    if (existingBlock.rows.length > 0) {
      return res.status(400).json({
        ok: false,
        error: "User is already blocked",
      });
    }

    // Create the block
    const result = await pool.query(
      `insert into user_blocks (actor_id, target_id, created_at)
       values ($1, $2, now())
       returning id, actor_id, target_id, created_at`,
      [actorId, targetId],
    );

    const block = result.rows[0];

    res.json({
      ok: true,
      message: "User blocked successfully",
      block,
    });
  } catch (error: any) {
    console.error("[createUserBlock] Error:", error);
    res.status(500).json({ ok: false, error: String(error?.message || error) });
  }
}

export async function removeUserBlock(req: Request, res: Response) {
  try {
    const actorId = (req as any).session?.userId;
    if (!actorId) {
      return res.status(401).json({ ok: false, error: "Not authenticated" });
    }

    const { targetId } = req.body;

    // Validate required fields
    if (!targetId || typeof targetId !== "number") {
      return res.status(400).json({
        ok: false,
        error: "Missing or invalid required field: targetId",
      });
    }

    // Remove the block
    const result = await pool.query(
      `delete from user_blocks where actor_id = $1 and target_id = $2
       returning id`,
      [actorId, targetId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        ok: false,
        error: "Block not found",
      });
    }

    res.json({
      ok: true,
      message: "User unblocked successfully",
    });
  } catch (error: any) {
    console.error("[removeUserBlock] Error:", error);
    res.status(500).json({ ok: false, error: String(error?.message || error) });
  }
}
