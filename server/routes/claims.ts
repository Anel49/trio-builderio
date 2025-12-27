import { Request, Response } from "express";
import { pool } from "./db";

// Priority mapping based on claim type
const priorityMap: Record<string, number> = {
  missing: 1,
  theft: 1,
  damage: 2,
  "late return": 3,
  other: 4,
};

export async function createClaim(req: Request, res: Response) {
  try {
    const { orderId, claimType, incidentDate, claimDetails } = (req.body || {}) as any;
    const userId = (req.session as any)?.userId;

    // Validate required fields
    if (!userId) {
      return res.status(401).json({ ok: false, error: "Not authenticated" });
    }

    if (!orderId || !claimType || !incidentDate || !claimDetails) {
      return res.status(400).json({
        ok: false,
        error: "orderId, claimType, incidentDate, and claimDetails are required",
      });
    }

    // Validate claim type
    if (!Object.keys(priorityMap).includes(claimType)) {
      return res.status(400).json({
        ok: false,
        error: "Invalid claim type",
      });
    }

    // Verify the order exists and belongs to the user
    const orderResult = await pool.query(
      `select id, renter_id, host_id from orders where id = $1`,
      [orderId],
    );

    if (!orderResult.rowCount) {
      return res.status(404).json({ ok: false, error: "Order not found" });
    }

    const order = orderResult.rows[0];

    // Verify the user is either the renter or host of the order
    if (order.renter_id !== userId && order.host_id !== userId) {
      return res.status(403).json({
        ok: false,
        error: "You are not authorized to create a claim for this order",
      });
    }

    // Check if message thread already exists between current user and support user (ID 2)
    let messageThreadId: number;

    const existingThreadResult = await pool.query(
      `select id from message_threads
       where (user_a_id = $1 and user_b_id = $2) or (user_a_id = $2 and user_b_id = $1)`,
      [userId, 2],
    );

    if (existingThreadResult.rowCount && existingThreadResult.rowCount > 0) {
      // Thread already exists, reuse it
      messageThreadId = existingThreadResult.rows[0].id;
    } else {
      // Create new message thread with user_a_id = 2 (support user)
      const threadResult = await pool.query(
        `insert into message_threads (user_a_id, user_b_id, last_updated_by_id)
         values ($1, $2, $1)
         returning id`,
        [2, userId],
      );
      messageThreadId = threadResult.rows[0].id;
    }

    // Calculate priority from claim type
    const priority = priorityMap[claimType] || 5;

    // Parse incident date (format: YYYY-MM-DD)
    const incidentDateTime = new Date(incidentDate + "T00:00:00Z");

    // Create the claim
    const claimResult = await pool.query(
      `insert into claims (
        order_id,
        created_by,
        claim_type,
        claim_details,
        priority,
        incident_date,
        message_thread,
        status
       ) values ($1, $2, $3, $4, $5, $6, $7, $8)
       returning id, status, created_at, priority, message_thread`,
      [
        orderId,
        userId,
        claimType,
        claimDetails,
        priority,
        incidentDateTime,
        messageThreadId,
        "submitted",
      ],
    );

    const claim = claimResult.rows[0];

    // Send initial system message to the thread from support user (ID 2)
    try {
      await pool.query(
        `insert into messages (sender_id, to_id, body, message_thread_id)
         values ($1, $2, $3, $4)`,
        [
          2,
          userId,
          `A new claim has been submitted for order #${orderId}. Claim type: ${claimType}. Priority: ${priority}. Please review the claim details and provide any additional information if needed.`,
          messageThreadId,
        ],
      );
    } catch (e: any) {
      console.error("[createClaim] Error sending system message:", e.message);
      // Don't fail the entire operation if system message fails
    }

    res.json({
      ok: true,
      claim: {
        id: claim.id,
        status: claim.status,
        priority: claim.priority,
        messageThreadId: claim.message_thread,
        createdAt: claim.created_at,
      },
    });
  } catch (error: any) {
    console.error("[createClaim] Error:", error);
    res.status(500).json({ ok: false, error: "Internal server error" });
  }
}
