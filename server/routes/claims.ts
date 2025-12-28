import { Request, Response } from "express";
import { pool } from "./db";
import { format } from "date-fns";

// Priority mapping based on claim type
const priorityMap: Record<string, number> = {
  missing: 1,
  theft: 1,
  damage: 2,
  "late return": 3,
  other: 4,
};

// Display label mapping for claim types
const claimTypeDisplayMap: Record<string, string> = {
  missing: "Missing",
  theft: "Theft",
  damage: "Damage",
  "late return": "Late Return",
  other: "Other",
};

export async function getClaimThreadData(req: Request, res: Response) {
  try {
    const claimId = Number((req.params as any)?.claimId || "0");

    if (!claimId) {
      return res
        .status(400)
        .json({ ok: false, error: "claimId is required" });
    }

    const result = await pool.query(
      `select
        c.id,
        c.claim_number,
        c.status,
        c.claim_type,
        c.claim_details,
        c.incident_date,
        c.created_at,
        c.created_by,
        c.order_id,
        o.number as order_number,
        o.listing_title,
        mt.id as thread_id,
        mt.thread_title,
        u.id as submitter_id,
        u.name as submitter_name,
        u.avatar_url as submitter_avatar_url,
        u.created_at as submitter_created_at
       from claims c
       left join message_threads mt on c.id = mt.claim_id
       left join orders o on c.order_id = o.id
       left join users u on c.created_by = u.id
       where c.id = $1`,
      [claimId],
    );

    if (!result.rowCount || result.rowCount === 0) {
      return res.status(404).json({ ok: false, error: "Claim not found" });
    }

    const row = result.rows[0];

    res.json({
      ok: true,
      thread: {
        id: row.thread_id,
        title: row.thread_title,
      },
      claim: {
        id: row.id,
        claimNumber: row.claim_number,
        status: row.status,
        claimType: row.claim_type,
        claimDetails: row.claim_details,
        incidentDate: row.incident_date,
        createdAt: row.created_at,
      },
      claimSubmitter: {
        id: row.submitter_id,
        name: row.submitter_name,
        avatarUrl: row.submitter_avatar_url,
        createdAt: row.submitter_created_at,
      },
      order: {
        id: row.order_id,
        number: row.order_number,
        listingTitle: row.listing_title,
      },
    });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: String(error?.message || error) });
  }
}

export async function listClaimThreads(req: Request, res: Response) {
  try {
    const userId = Number((req.params as any)?.userId || "0");

    if (!userId) {
      return res
        .status(400)
        .json({ ok: false, error: "userId is required" });
    }

    const result = await pool.query(
      `
      SELECT
        mt.id as thread_id,
        mt.thread_title,
        mt.claim_id,
        m.body as last_message,
        m.created_at as last_message_time,
        m.sender_id as last_message_sender_id
      FROM message_threads mt
      LEFT JOIN claims c ON mt.claim_id = c.id
      LEFT JOIN LATERAL (
        SELECT body, created_at, sender_id
        FROM messages
        WHERE message_thread_id = mt.id
        ORDER BY created_at DESC
        LIMIT 1
      ) m ON true
      WHERE mt.claim_id IS NOT NULL
        AND c.assigned_to = $1
      ORDER BY m.created_at DESC NULLS LAST
      `,
      [userId],
    );

    const threads = result.rows.map((r: any) => ({
      threadId: r.thread_id,
      claimId: r.claim_id,
      threadTitle: r.thread_title,
      lastMessage: r.last_message,
      lastMessageTime: r.last_message_time,
      lastMessageSenderId: r.last_message_sender_id,
    }));

    res.json({ ok: true, conversations: threads });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: String(error?.message || error) });
  }
}

export async function createClaim(req: Request, res: Response) {
  try {
    const { orderId, claimType, incidentDate, claimDetails } = (req.body ||
      {}) as any;
    const userId = (req.session as any)?.userId;

    console.log("[createClaim] Request received", {
      orderId,
      claimType,
      incidentDate,
      userId,
    });

    // Validate required fields
    if (!userId) {
      return res.status(401).json({ ok: false, error: "Not authenticated" });
    }

    if (!orderId || !claimType || !incidentDate || !claimDetails) {
      return res.status(400).json({
        ok: false,
        error:
          "orderId, claimType, incidentDate, and claimDetails are required",
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
      `select id, order_number, listing_title, renter_id, host_id from orders where id = $1`,
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

    // Always create a new message thread for claims
    // This ensures each claim/support ticket has its own separate thread
    console.log("[createClaim] Creating message thread for user", userId);
    const threadResult = await pool.query(
      `insert into message_threads (user_a_id, user_b_id, last_updated_by_id)
       values ($1, $2, $1)
       returning id`,
      [2, userId],
    );
    messageThreadId = threadResult.rows[0].id;
    console.log("[createClaim] Thread created with ID", messageThreadId);

    // Calculate priority from claim type
    const priority = priorityMap[claimType] || 5;

    // Get display format for claim type
    const displayClaimType = claimTypeDisplayMap[claimType] || claimType;

    // Parse incident date (format: YYYY-MM-DD)
    const incidentDateTime = new Date(incidentDate + "T00:00:00Z");

    console.log("[createClaim] About to insert claim with:", {
      orderId,
      userId,
      displayClaimType,
      priority,
      incidentDateTime,
      messageThreadId,
    });

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
       returning id, status, created_at, priority, message_thread, number`,
      [
        orderId,
        userId,
        displayClaimType,
        claimDetails,
        priority,
        incidentDateTime,
        messageThreadId,
        "submitted",
      ],
    );

    console.log(
      "[createClaim] Claim insert successful, rows returned:",
      claimResult.rowCount,
    );

    const claim = claimResult.rows[0];
    console.log("[createClaim] Claim object:", claim);

    // Set the claim_number using the number from the sequence
    let claimNumber = "";
    if (claim.number) {
      claimNumber = `CLM-${claim.number}`;
      try {
        await pool.query(`update claims set claim_number = $1 where id = $2`, [
          claimNumber,
          claim.id,
        ]);
        console.log("[createClaim] Claim number updated to", claimNumber);
      } catch (e: any) {
        console.error("[createClaim] Error setting claim_number:", e.message);
        // Don't fail if this fails
      }
    }

    // Update the message thread with claim_id and thread_title
    try {
      await pool.query(
        `update message_threads set claim_id = $1, thread_title = $2 where id = $3`,
        [claim.id, claimNumber, messageThreadId],
      );
      console.log(
        "[createClaim] Thread updated with claim_id and thread_title",
      );
    } catch (e: any) {
      console.error(
        "[createClaim] Error updating message thread with claim details:",
        e.message,
      );
      // Don't fail if this fails
    }

    // Send initial system message to the thread from support user (ID 2)
    try {
      // Format incident date as "Month day, year" (e.g., May 5, 2024)
      const formattedDate = format(incidentDateTime, "MMMM d, yyyy");

      const messageBody = `A new claim was submitted for order #${order.order_number}. Please review the claim details below and provide any additional information that may assist in resolving the claim. A team member will get back to you as soon as possible.

Listing: ${order.listing_title}
Claim type: ${displayClaimType}
Incident date: ${formattedDate}
Claim details:
${claimDetails}`;

      await pool.query(
        `insert into messages (sender_id, to_id, body, message_thread_id)
         values ($1, $2, $3, $4)`,
        [2, userId, messageBody, messageThreadId],
      );
      console.log("[createClaim] System message sent to thread");
    } catch (e: any) {
      console.error("[createClaim] Error sending system message:", e.message);
      // Don't fail the entire operation if system message fails
    }

    console.log("[createClaim] Returning success response");
    res.json({
      ok: true,
      claim: {
        id: claim.id,
        status: claim.status,
        priority: claim.priority,
        messageThreadId: claim.message_thread,
        createdAt: claim.created_at,
        number: claim.number,
        claimNumber: `CLM-${claim.number}`,
      },
    });
  } catch (error: any) {
    console.error("[createClaim] Error:", error?.message);
    console.error("[createClaim] Full error:", error);
    res
      .status(500)
      .json({ ok: false, error: error?.message || "Internal server error" });
  }
}
