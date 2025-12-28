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

export async function createClaim(req: Request, res: Response) {
  try {
    const { orderId, claimType, incidentDate, claimDetails } = (req.body ||
      {}) as any;
    const userId = (req.session as any)?.userId;

    console.log("[createClaim] Request received", { orderId, claimType, incidentDate, userId });

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

    console.log("[createClaim] Claim insert successful, rows returned:", claimResult.rowCount);

    const claim = claimResult.rows[0];
    console.log("[createClaim] Claim object:", claim);

    // Set the claim_number using the number from the sequence
    let claimNumber = "";
    if (claim.number) {
      claimNumber = `CLM-${claim.number}`;
      try {
        await pool.query(
          `update claims set claim_number = $1 where id = $2`,
          [claimNumber, claim.id],
        );
      } catch (e: any) {
        console.error(
          "[createClaim] Error setting claim_number:",
          e.message,
        );
        // Don't fail if this fails
      }
    }

    // Update the message thread with claim_id and thread_title
    try {
      await pool.query(
        `update message_threads set claim_id = $1, thread_title = $2 where id = $3`,
        [claim.id, claimNumber, messageThreadId],
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
        number: claim.number,
        claimNumber: `CLM-${claim.number}`,
      },
    });
  } catch (error: any) {
    console.error("[createClaim] Error:", error?.message);
    console.error("[createClaim] Full error:", error);
    res.status(500).json({ ok: false, error: error?.message || "Internal server error" });
  }
}
