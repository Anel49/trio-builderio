import { Request, Response } from "express";
import { pool } from "./db";

export async function listConversations(req: Request, res: Response) {
  try {
    const userId = Number((req.params as any)?.userId || "0");
    if (!userId) {
      return res
        .status(400)
        .json({ ok: false, error: "userId is required" });
    }

    const result = await pool.query(
      `
      SELECT DISTINCT 
        CASE 
          WHEN from_id = $1 THEN to_id 
          ELSE from_id 
        END as other_user_id,
        u.name,
        u.avatar_url,
        u.username,
        (
          SELECT body FROM messages 
          WHERE (from_id = $1 AND to_id = CASE WHEN from_id = $1 THEN to_id ELSE from_id END) 
             OR (to_id = $1 AND from_id = CASE WHEN from_id = $1 THEN to_id ELSE from_id END)
          ORDER BY created_at DESC 
          LIMIT 1
        ) as last_message,
        (
          SELECT created_at FROM messages 
          WHERE (from_id = $1 AND to_id = CASE WHEN from_id = $1 THEN to_id ELSE from_id END) 
             OR (to_id = $1 AND from_id = CASE WHEN from_id = $1 THEN to_id ELSE from_id END)
          ORDER BY created_at DESC 
          LIMIT 1
        ) as last_message_time
      FROM messages m
      JOIN users u ON u.id = CASE WHEN from_id = $1 THEN to_id ELSE from_id END
      WHERE from_id = $1 OR to_id = $1
      ORDER BY last_message_time DESC
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
