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
      WITH last_messages AS (
        SELECT
          mt.id as thread_id,
          CASE
            WHEN m.sender_id = $1 THEN m.to_id
            ELSE m.sender_id
          END as other_user_id,
          m.body,
          m.created_at,
          m.sender_id,
          mt.thread_title,
          ROW_NUMBER() OVER (PARTITION BY mt.id ORDER BY m.created_at DESC) as rn
        FROM message_threads mt
        LEFT JOIN messages m ON mt.id = m.message_thread_id
        WHERE (mt.user_a_id = $1 OR mt.user_b_id = $1)
      )
      SELECT
        lm.thread_id,
        lm.other_user_id,
        u.name,
        u.avatar_url,
        u.username,
        lm.body as last_message,
        lm.created_at as last_message_time,
        lm.sender_id as last_message_sender_id,
        lm.thread_title
      FROM last_messages lm
      JOIN users u ON u.id = lm.other_user_id
      LEFT JOIN user_thread_state uts ON uts.thread_id = lm.thread_id AND uts.user_id = $1
      WHERE lm.rn = 1
        AND (uts.is_hidden IS NULL OR uts.is_hidden = false)
      ORDER BY lm.created_at DESC NULLS LAST
      `,
      [userId],
    );

    const conversations = result.rows.map((r: any) => ({
      threadId: r.thread_id,
      otherUserId: r.other_user_id,
      name: r.name,
      avatarUrl: r.avatar_url,
      username: r.username,
      lastMessage: r.last_message,
      lastMessageTime: r.last_message_time,
      lastMessageSenderId: r.last_message_sender_id,
      threadTitle: r.thread_title,
    }));

    res.json({ ok: true, conversations });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: String(error?.message || error) });
  }
}

export async function getMessages(req: Request, res: Response) {
  try {
    const userId = Number((req.params as any)?.userId || "0");
    const threadId = Number((req.params as any)?.threadId || "0");
    const view = (req.query as any)?.view || "standard"; // "standard" or "claims"
    const user = (req.session as any)?.user;

    if (!userId || !threadId) {
      return res.status(400).json({
        ok: false,
        error: "userId and threadId are required",
      });
    }

    // Verify the user is part of this thread OR is a moderator/admin
    const isModeratorOrAdmin = user?.moderator || user?.admin;
    const threadCheckResult = await pool.query(
      `
      SELECT mt.id
      FROM message_threads mt
      LEFT JOIN claims c ON mt.claim_id = c.id
      WHERE mt.id = $1
        AND (
          (mt.user_a_id = $2 OR mt.user_b_id = $2)
          OR (c.assigned_to = $2)
          OR $3
        )
      `,
      [threadId, userId, isModeratorOrAdmin],
    );

    if (threadCheckResult.rowCount === 0) {
      return res.status(403).json({
        ok: false,
        error: "Unauthorized",
      });
    }

    // Check if this is a claims thread
    const threadCheckForClaim = await pool.query(
      `
      SELECT mt.claim_id
      FROM message_threads mt
      WHERE mt.id = $1
      `,
      [threadId],
    );

    const isClaimsThread =
      threadCheckForClaim.rows.length > 0 &&
      threadCheckForClaim.rows[0].claim_id;

    // Only apply special "User 2 (Support)" alignment if viewing from claims chat page
    const shouldUseClaimsAlignment = view === "claims" && isClaimsThread;

    const result = await pool.query(
      `
      SELECT
        id,
        sender_id,
        to_id,
        body,
        created_at,
        message_thread_id
      FROM messages
      WHERE message_thread_id = $1
      ORDER BY created_at ASC
      `,
      [threadId],
    );

    const messages = result.rows.map((r: any) => ({
      id: r.id,
      senderId: r.sender_id,
      toId: r.to_id,
      body: r.body,
      createdAt: r.created_at,
      messageThreadId: r.message_thread_id,
      isFromCurrentUser: shouldUseClaimsAlignment
        ? r.sender_id === 2
        : r.sender_id === userId,
    }));

    res.json({ ok: true, messages });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: String(error?.message || error) });
  }
}

export async function sendMessage(req: Request, res: Response) {
  try {
    const { senderId, toId, body, messageThreadId } = (req.body || {}) as any;
    const user = (req.session as any)?.user;

    if (!senderId || !toId || !body) {
      return res.status(400).json({
        ok: false,
        error: "senderId, toId, and body are required",
      });
    }

    // Check if sender and recipient are blocked from each other (unless one is support user)
    if (senderId !== 2 && toId !== 2) {
      const { isUsersBlocked } = await import("./blocks");
      const isBlocked = await isUsersBlocked(senderId, toId);
      if (isBlocked) {
        return res.status(403).json({
          ok: false,
          error: "Cannot message a blocked user",
        });
      }
    }

    let threadId: number;

    if (messageThreadId) {
      // Thread already exists, verify the user is authorized to send in this thread
      const threadCheckResult = await pool.query(
        `
        SELECT mt.id
        FROM message_threads mt
        LEFT JOIN claims c ON mt.claim_id = c.id
        WHERE mt.id = $1
          AND (
            (mt.user_a_id = $2 OR mt.user_b_id = $2)
            OR (c.assigned_to = $2 AND ($3 OR $4))
          )
        `,
        [
          messageThreadId,
          senderId,
          user?.moderator || false,
          user?.admin || false,
        ],
      );

      if (threadCheckResult.rowCount === 0) {
        return res.status(403).json({
          ok: false,
          error: "Unauthorized",
        });
      }

      threadId = messageThreadId;
    } else {
      // If either user is the support user (ID 2), always create a new thread
      // This ensures each support ticket/claim has its own separate thread
      const isInvolvingSupportUser = senderId === 2 || toId === 2;

      if (isInvolvingSupportUser) {
        // Always create a new thread for support interactions
        // Support user (ID 2) is always user_a_id
        const userAId = 2;
        const userBId = senderId === 2 ? toId : senderId;
        const threadCreateResult = await pool.query(
          `
          INSERT INTO message_threads (user_a_id, user_b_id, last_updated_by_id)
          VALUES ($1, $2, $3)
          RETURNING id
          `,
          [userAId, userBId, senderId],
        );
        threadId = threadCreateResult.rows[0].id;
      } else {
        // For non-support conversations, check if thread already exists
        const existingThreadResult = await pool.query(
          `
          SELECT id FROM message_threads
          WHERE (user_a_id = $1 AND user_b_id = $2) OR (user_a_id = $2 AND user_b_id = $1)
          LIMIT 1
          `,
          [senderId, toId],
        );

        if (existingThreadResult.rows.length > 0) {
          // Thread exists, use it
          threadId = existingThreadResult.rows[0].id;
        } else {
          // Create new thread with senderId as user_a_id and toId as user_b_id
          const threadCreateResult = await pool.query(
            `
            INSERT INTO message_threads (user_a_id, user_b_id, last_updated_by_id)
            VALUES ($1, $2, $1)
            RETURNING id
            `,
            [senderId, toId],
          );
          threadId = threadCreateResult.rows[0].id;
        }
      }
    }

    // Insert the message with the thread_id
    const result = await pool.query(
      `
      INSERT INTO messages (sender_id, to_id, body, message_thread_id)
      VALUES ($1, $2, $3, $4)
      RETURNING id, sender_id, to_id, body, created_at, message_thread_id
      `,
      [senderId, toId, body, threadId],
    );

    const message = result.rows[0];

    // Update the thread's last_updated and last_updated_by_id
    await pool.query(
      `
      UPDATE message_threads
      SET last_updated = now(), last_updated_by_id = $1
      WHERE id = $2
      `,
      [senderId, threadId],
    );

    // Get the thread's user_a_id and user_b_id to unhide for both users
    const threadResult = await pool.query(
      `
      SELECT user_a_id, user_b_id FROM message_threads WHERE id = $1
      `,
      [threadId],
    );

    if (threadResult.rows.length > 0) {
      const { user_a_id, user_b_id } = threadResult.rows[0];
      const threadUsers = [user_a_id, user_b_id];

      // Ensure user_thread_state entries exist for both users and unhide the thread
      for (const userId of threadUsers) {
        await pool.query(
          `
          INSERT INTO user_thread_state (user_id, thread_id, is_hidden, created_at, updated_at)
          VALUES ($1, $2, false, now(), now())
          ON CONFLICT (user_id, thread_id)
          DO UPDATE SET is_hidden = false, updated_at = now()
          `,
          [userId, threadId],
        );
      }
    }

    res.json({
      ok: true,
      message: {
        id: message.id,
        senderId: message.sender_id,
        toId: message.to_id,
        body: message.body,
        createdAt: message.created_at,
        messageThreadId: message.message_thread_id,
        isFromCurrentUser: message.sender_id === senderId,
      },
    });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: String(error?.message || error) });
  }
}

export async function hideThread(req: Request, res: Response) {
  try {
    const { userId, threadId, isHidden } = (req.body || {}) as any;
    const user = (req.session as any)?.user;

    if (userId === undefined || threadId === undefined || isHidden === undefined) {
      return res.status(400).json({
        ok: false,
        error: "userId, threadId, and isHidden are required",
      });
    }

    // Verify the user is part of this thread
    const threadCheckResult = await pool.query(
      `
      SELECT mt.id
      FROM message_threads mt
      WHERE mt.id = $1
        AND (mt.user_a_id = $2 OR mt.user_b_id = $2)
      `,
      [threadId, userId],
    );

    if (threadCheckResult.rowCount === 0) {
      return res.status(403).json({
        ok: false,
        error: "Unauthorized",
      });
    }

    // Create or update the user_thread_state row
    await pool.query(
      `
      INSERT INTO user_thread_state (user_id, thread_id, is_hidden, created_at, updated_at)
      VALUES ($1, $2, $3, now(), now())
      ON CONFLICT (user_id, thread_id)
      DO UPDATE SET is_hidden = $3, updated_at = now()
      `,
      [userId, threadId, isHidden],
    );

    res.json({ ok: true });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: String(error?.message || error) });
  }
}
