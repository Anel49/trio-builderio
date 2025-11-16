import { Request, Response } from "express";
import { pool } from "./db";

export async function listConversations(req: Request, res: Response) {
  try {
    const userId = Number((req.params as any)?.userId || "0");
    if (!userId) {
      return res.status(400).json({ ok: false, error: "userId is required" });
    }

    const result = await pool.query(
      `
      WITH conversation_users AS (
        SELECT DISTINCT
          CASE
            WHEN from_id = $1 THEN to_id
            ELSE from_id
          END as other_user_id
        FROM messages
        WHERE from_id = $1 OR to_id = $1
      ),
      last_messages AS (
        SELECT
          CASE
            WHEN m.from_id = $1 THEN m.to_id
            ELSE m.from_id
          END as other_user_id,
          m.body,
          m.created_at,
          m.from_id,
          ROW_NUMBER() OVER (PARTITION BY CASE WHEN m.from_id = $1 THEN m.to_id ELSE m.from_id END ORDER BY m.created_at DESC) as rn
        FROM messages m
        WHERE m.from_id = $1 OR m.to_id = $1
      )
      SELECT
        cu.other_user_id,
        u.name,
        u.avatar_url,
        u.username,
        lm.body as last_message,
        lm.created_at as last_message_time,
        lm.from_id as last_message_from_id
      FROM conversation_users cu
      JOIN users u ON u.id = cu.other_user_id
      LEFT JOIN last_messages lm ON lm.other_user_id = cu.other_user_id AND lm.rn = 1
      ORDER BY lm.created_at DESC NULLS LAST
      `,
      [userId],
    );

    const conversations = result.rows.map((r: any) => ({
      otherUserId: r.other_user_id,
      name: r.name,
      avatarUrl: r.avatar_url,
      username: r.username,
      lastMessage: r.last_message,
      lastMessageTime: r.last_message_time,
      lastMessageFromId: r.last_message_from_id,
    }));

    res.json({ ok: true, conversations });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: String(error?.message || error) });
  }
}

export async function getMessages(req: Request, res: Response) {
  try {
    const userId = Number((req.params as any)?.userId || "0");
    const otherUserId = Number((req.params as any)?.otherUserId || "0");

    if (!userId || !otherUserId) {
      return res.status(400).json({
        ok: false,
        error: "userId and otherUserId are required",
      });
    }

    const result = await pool.query(
      `
      SELECT 
        id,
        from_id,
        to_id,
        body,
        created_at
      FROM messages
      WHERE (from_id = $1 AND to_id = $2) OR (from_id = $2 AND to_id = $1)
      ORDER BY created_at ASC
      `,
      [userId, otherUserId],
    );

    const messages = result.rows.map((r: any) => ({
      id: r.id,
      fromId: r.from_id,
      toId: r.to_id,
      body: r.body,
      createdAt: r.created_at,
      isFromCurrentUser: r.from_id === userId,
    }));

    res.json({ ok: true, messages });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: String(error?.message || error) });
  }
}

export async function sendMessage(req: Request, res: Response) {
  try {
    const { fromId, toId, body } = (req.body || {}) as any;

    if (!fromId || !toId || !body) {
      return res.status(400).json({
        ok: false,
        error: "fromId, toId, and body are required",
      });
    }

    const result = await pool.query(
      `
      INSERT INTO messages (from_id, to_id, body)
      VALUES ($1, $2, $3)
      RETURNING id, from_id, to_id, body, created_at
      `,
      [fromId, toId, body],
    );

    const message = result.rows[0];
    res.json({
      ok: true,
      message: {
        id: message.id,
        fromId: message.from_id,
        toId: message.to_id,
        body: message.body,
        createdAt: message.created_at,
        isFromCurrentUser: message.from_id === fromId,
      },
    });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: String(error?.message || error) });
  }
}
