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
            WHEN sender_id = $1 THEN to_id
            ELSE sender_id
          END as other_user_id
        FROM messages
        WHERE sender_id = $1 OR to_id = $1
      ),
      last_messages AS (
        SELECT
          CASE
            WHEN m.sender_id = $1 THEN m.to_id
            ELSE m.sender_id
          END as other_user_id,
          m.body,
          m.created_at,
          m.sender_id,
          ROW_NUMBER() OVER (PARTITION BY CASE WHEN m.sender_id = $1 THEN m.to_id ELSE m.sender_id END ORDER BY m.created_at DESC) as rn
        FROM messages m
        WHERE m.sender_id = $1 OR m.to_id = $1
      )
      SELECT
        cu.other_user_id,
        u.name,
        u.avatar_url,
        u.username,
        lm.body as last_message,
        lm.created_at as last_message_time,
        lm.sender_id as last_message_sender_id
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
      lastMessageSenderId: r.last_message_sender_id,
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
        sender_id,
        to_id,
        body,
        created_at
      FROM messages
      WHERE (sender_id = $1 AND to_id = $2) OR (sender_id = $2 AND to_id = $1)
      ORDER BY created_at ASC
      `,
      [userId, otherUserId],
    );

    const messages = result.rows.map((r: any) => ({
      id: r.id,
      senderId: r.sender_id,
      toId: r.to_id,
      body: r.body,
      createdAt: r.created_at,
      isFromCurrentUser: r.sender_id === userId,
    }));

    res.json({ ok: true, messages });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: String(error?.message || error) });
  }
}

export async function sendMessage(req: Request, res: Response) {
  try {
    const { senderId, toId, body } = (req.body || {}) as any;

    if (!senderId || !toId || !body) {
      return res.status(400).json({
        ok: false,
        error: "senderId, toId, and body are required",
      });
    }

    const result = await pool.query(
      `
      INSERT INTO messages (sender_id, to_id, body)
      VALUES ($1, $2, $3)
      RETURNING id, sender_id, to_id, body, created_at
      `,
      [senderId, toId, body],
    );

    const message = result.rows[0];
    res.json({
      ok: true,
      message: {
        id: message.id,
        senderId: message.sender_id,
        toId: message.to_id,
        body: message.body,
        createdAt: message.created_at,
        isFromCurrentUser: message.sender_id === senderId,
      },
    });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: String(error?.message || error) });
  }
}
