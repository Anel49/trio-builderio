import { Request, Response } from "express";
import { pool } from "./db";
import { requireAdmin, requireModeratorOrAdmin } from "./auth";
import { deleteS3Prefix } from "../lib/s3";

function rowToUserDetail(r: any) {
  return {
    id: r.id,
    name: r.name || null,
    email: r.email || null,
    username: r.username || null,
    avatarUrl: r.avatar_url || null,
    createdAt: r.created_at,
    foundingSupporter: Boolean(r.founding_supporter),
    topReferrer: Boolean(r.top_referrer),
    ambassador: Boolean(r.ambassador),
    openDms: Boolean(r.open_dms),
    active: Boolean(r.active),
    admin: Boolean(r.admin),
    moderator: Boolean(r.moderator),
    pendingIdentityVer: r.pending_identity_ver,
  };
}

export async function listAllUsers(req: Request, res: Response) {
  try {
    const limit = Math.min(
      Number.parseInt((req.query.limit as string) || "100", 10),
      1000,
    );
    const offset = Math.max(
      Number.parseInt((req.query.offset as string) || "0", 10),
      0,
    );
    const search = ((req.query.search as string) || "").toLowerCase().trim();
    const showInactive =
      (req.query.show_inactive as string) === "true" ? true : false;
    const includeSupport =
      (req.query.include_support as string) === "true" ? true : false;

    const params: any[] = [];
    const whereClauses: string[] = [];

    if (!includeSupport) {
      whereClauses.push("u.id != 2");
    }

    if (search) {
      params.push(`%${search}%`);
      whereClauses.push(
        `(lower(u.name) like $${params.length} or lower(u.email) like $${params.length} or lower(u.username) like $${params.length})`,
      );
    }

    if (!showInactive) {
      whereClauses.push("u.active = true");
    }

    const whereClause =
      whereClauses.length > 0 ? whereClauses.join(" and ") : "1=1";

    const result = await pool.query(
      `select u.id, u.name, u.email, u.username, u.avatar_url, u.created_at,
              coalesce(u.founding_supporter,false) as founding_supporter,
              coalesce(u.top_referrer,false) as top_referrer,
              coalesce(u.ambassador,false) as ambassador,
              coalesce(u.open_dms,true) as open_dms,
              coalesce(u.active,true) as active,
              coalesce(u.admin,false) as admin,
              coalesce(u.moderator,false) as moderator,
              u.pending_identity_ver
       from users u
       where ${whereClause}
       order by u.created_at desc
       limit $${params.length + 1} offset $${params.length + 2}`,
      [...params, limit, offset],
    );

    const countResult = await pool.query(
      `select count(*) as total from users u where ${whereClause}`,
      params,
    );

    res.json({
      ok: true,
      users: result.rows.map(rowToUserDetail),
      total: Number.parseInt(countResult.rows[0].total, 10),
      limit,
      offset,
    });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: String(error?.message || error) });
  }
}

export async function updateUserAdminStatus(req: Request, res: Response) {
  try {
    const userId = Number.parseInt((req.params.userId as string) || "", 10);
    if (!Number.isFinite(userId)) {
      return res.status(400).json({ ok: false, error: "Invalid user ID" });
    }

    const { admin, moderator, active } = req.body || {};
    const currentUser = (req.session as any)?.user;

    // Only admins can change admin or moderator status
    if (
      (typeof admin === "boolean" || typeof moderator === "boolean") &&
      !currentUser?.admin
    ) {
      return res.status(403).json({
        ok: false,
        error: "Only admins can change admin or moderator status",
      });
    }

    const updates: string[] = [];
    const params: any[] = [];
    let paramCount = 1;

    if (typeof admin === "boolean") {
      params.push(admin);
      updates.push(`admin = $${paramCount++}`);
    }

    if (typeof moderator === "boolean") {
      params.push(moderator);
      updates.push(`moderator = $${paramCount++}`);
    }

    if (typeof active === "boolean") {
      params.push(active);
      updates.push(`active = $${paramCount++}`);
    }

    if (updates.length === 0) {
      return res.status(400).json({ ok: false, error: "No fields to update" });
    }

    params.push(userId);

    const result = await pool.query(
      `update users set ${updates.join(", ")} where id = $${paramCount}
       returning id, name, email, username, avatar_url, created_at,
                 coalesce(founding_supporter,false) as founding_supporter,
                 coalesce(top_referrer,false) as top_referrer,
                 coalesce(ambassador,false) as ambassador,
                 coalesce(open_dms,true) as open_dms,
                 coalesce(active,true) as active,
                 coalesce(admin,false) as admin,
                 coalesce(moderator,false) as moderator,
                 pending_identity_ver`,
      params,
    );

    if (!result.rowCount || result.rowCount === 0) {
      return res.status(404).json({ ok: false, error: "User not found" });
    }

    res.json({ ok: true, user: rowToUserDetail(result.rows[0]) });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: String(error?.message || error) });
  }
}

export async function listAllListings(req: Request, res: Response) {
  try {
    const limit = Math.min(
      Number.parseInt((req.query.limit as string) || "50", 10),
      500,
    );
    const offset = Math.max(
      Number.parseInt((req.query.offset as string) || "0", 10),
      0,
    );
    const id = (req.query.id as string) || null;
    const name = (req.query.name as string) || null;

    console.log("[listAllListings] id:", id, "name:", name);

    let whereClause = "1=1";
    const params: any[] = [];

    if (id) {
      const listingId = Number.parseInt(id, 10);
      console.log("[listAllListings] Parsed ID:", listingId);
      if (Number.isFinite(listingId)) {
        params.push(listingId);
        whereClause = `l.id = $${params.length}`;
        console.log(
          "[listAllListings] Using ID query, whereClause:",
          whereClause,
        );
      }
    } else if (name) {
      params.push(`%${name.toLowerCase()}%`);
      whereClause = `lower(l.name) like $${params.length}`;
      console.log(
        "[listAllListings] Using name query, whereClause:",
        whereClause,
      );
    }

    console.log(
      "[listAllListings] Final whereClause:",
      whereClause,
      "params:",
      params,
    );

    const result = await pool.query(
      `select l.id, l.name, l.description, l.host_id, l.category, l.price_cents,
              l.enabled, l.created_at,
              u.name as host_name, u.email as host_email
       from listings l
       left join users u on l.host_id = u.id
       where ${whereClause}
       order by l.created_at desc
       limit $${params.length + 1} offset $${params.length + 2}`,
      [...params, limit, offset],
    );

    const countResult = await pool.query(
      `select count(*) as total from listings l where ${whereClause}`,
      params,
    );

    res.json({
      ok: true,
      listings: result.rows,
      total: Number.parseInt(countResult.rows[0].total, 10),
      limit,
      offset,
    });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: String(error?.message || error) });
  }
}

export async function updateListingStatus(req: Request, res: Response) {
  try {
    const listingId = Number.parseInt(
      (req.params.listingId as string) || "",
      10,
    );
    if (!Number.isFinite(listingId)) {
      return res.status(400).json({ ok: false, error: "Invalid listing ID" });
    }

    const { enabled } = req.body || {};

    if (typeof enabled !== "boolean") {
      return res
        .status(400)
        .json({ ok: false, error: "enabled must be a boolean" });
    }

    const result = await pool.query(
      `update listings set enabled = $1 where id = $2 returning id, title, host_id, enabled`,
      [enabled, listingId],
    );

    if (!result.rowCount || result.rowCount === 0) {
      return res.status(404).json({ ok: false, error: "Listing not found" });
    }

    res.json({ ok: true, listing: result.rows[0] });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: String(error?.message || error) });
  }
}

export async function deleteListing(req: Request, res: Response) {
  try {
    const listingId = Number.parseInt(
      (req.params.listingId as string) || "",
      10,
    );
    if (!Number.isFinite(listingId)) {
      return res.status(400).json({ ok: false, error: "Invalid listing ID" });
    }

    const result = await pool.query(
      `delete from listings where id = $1 returning id`,
      [listingId],
    );

    if (!result.rowCount || result.rowCount === 0) {
      return res.status(404).json({ ok: false, error: "Listing not found" });
    }

    res.json({ ok: true, message: "Listing deleted" });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: String(error?.message || error) });
  }
}

export async function listAllOrders(req: Request, res: Response) {
  try {
    const limit = Math.min(
      Number.parseInt((req.query.limit as string) || "50", 10),
      500,
    );
    const offset = Math.max(
      Number.parseInt((req.query.offset as string) || "0", 10),
      0,
    );
    const listingName = ((req.query.listing_name as string) || "").trim();
    const overdueOnly = (req.query.overdue_only as string) === "true";
    const showCompleted = (req.query.show_completed as string) === "true";

    let query =
      "select o.id, o.listing_id, o.listing_title, o.renter_id, o.renter_name, o.renter_email, o.host_id, o.host_name, o.host_email, o.start_date, o.end_date, o.status, o.created_at, coalesce(l.timezone, 'UTC') as timezone_name from orders o left join listings l on o.listing_id = l.id";

    const params: (string | number)[] = [];
    const whereClauses: string[] = [];

    if (listingName) {
      whereClauses.push(`o.listing_title ilike $${params.length + 1}`);
      params.push(`%${listingName}%`);
    }

    if (!showCompleted) {
      whereClauses.push(`o.status != 'completed'`);
    }

    if (overdueOnly) {
      whereClauses.push(`o.status = 'active'`);
      whereClauses.push(
        `(now() at time zone coalesce(l.timezone, 'UTC'))::date >= (o.end_date::date + interval '3 days')`,
      );
    }

    if (whereClauses.length > 0) {
      query += " where " + whereClauses.join(" and ");
    }

    query += ` order by o.created_at desc limit $${params.length + 1} offset $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    let countQuery =
      "select count(*) as total from orders o left join listings l on o.listing_id = l.id";

    const countParams: (string | number)[] = [];
    const countWhereClauses: string[] = [];

    if (listingName) {
      countWhereClauses.push(
        `o.listing_title ilike $${countParams.length + 1}`,
      );
      countParams.push(`%${listingName}%`);
    }

    if (!showCompleted) {
      countWhereClauses.push(`o.status != 'completed'`);
    }

    if (overdueOnly) {
      countWhereClauses.push(`o.status = 'active'`);
      countWhereClauses.push(
        `(now() at time zone coalesce(l.timezone, 'UTC'))::date >= (o.end_date::date + interval '3 days')`,
      );
    }

    if (countWhereClauses.length > 0) {
      countQuery += " where " + countWhereClauses.join(" and ");
    }

    const countResult = await pool.query(countQuery, countParams);

    res.json({
      ok: true,
      orders: result.rows,
      total: Number.parseInt(countResult.rows[0].total, 10),
      limit,
      offset,
    });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: String(error?.message || error) });
  }
}

export async function updateOrderStatus(req: Request, res: Response) {
  try {
    const orderId = Number.parseInt((req.params.orderId as string) || "", 10);
    if (!Number.isFinite(orderId)) {
      return res.status(400).json({ ok: false, error: "Invalid order ID" });
    }

    const { status } = req.body || {};
    if (!status || typeof status !== "string") {
      return res.status(400).json({ ok: false, error: "status is required" });
    }

    const result = await pool.query(
      `update orders set status = $1 where id = $2 returning id, status`,
      [status, orderId],
    );

    if (!result.rowCount || result.rowCount === 0) {
      return res.status(404).json({ ok: false, error: "Order not found" });
    }

    res.json({ ok: true, order: result.rows[0] });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: String(error?.message || error) });
  }
}

export async function listAllReviews(req: Request, res: Response) {
  try {
    console.log("[listAllReviews] Starting request");

    const limit = Math.min(
      Number.parseInt((req.query.limit as string) || "20", 10),
      500,
    );
    const offset = Math.max(
      Number.parseInt((req.query.offset as string) || "0", 10),
      0,
    );
    const search = ((req.query.search as string) || "").toLowerCase().trim();
    const reviewType = (req.query.review_type as string) || "listing";

    console.log(
      "[listAllReviews] Parsed params - limit:",
      limit,
      "offset:",
      offset,
      "search:",
      search,
      "review_type:",
      reviewType,
    );

    if (reviewType === "user") {
      let whereClause = "1=1";
      const params: any[] = [];

      if (search) {
        params.push(`%${search}%`);
        whereClause = `(
          lower(u.name) like $${params.length}
          or lower(u.username) like $${params.length}
        )`;
      }

      console.log("[listAllReviews] User reviews whereClause:", whereClause);

      const queryParams = [...params, limit, offset];
      const query = `select ur.id, ur.reviewed_user_id, ur.reviewer_id, ur.comment, ur.created_at, ur.updated_at,
                u.name as reviewed_user_name, u2.name as reviewer_name
         from user_reviews ur
         left join users u on ur.reviewed_user_id = u.id
         left join users u2 on ur.reviewer_id = u2.id
         where ${whereClause}
         order by ur.created_at desc
         limit $${params.length + 1} offset $${params.length + 2}`;

      console.log("[listAllReviews] Query:", query);
      console.log("[listAllReviews] Query params:", queryParams);

      const result = await pool.query(query, queryParams);

      console.log("[listAllReviews] Query succeeded, rows:", result.rowCount);

      const countResult = await pool.query(
        `select count(*) as total from user_reviews ur
         left join users u on ur.reviewed_user_id = u.id
         left join users u2 on ur.reviewer_id = u2.id
         where ${whereClause}`,
        params,
      );

      console.log("[listAllReviews] Count result:", countResult.rows[0]);

      res.json({
        ok: true,
        reviews: result.rows,
        total: Number.parseInt(countResult.rows[0].total, 10),
        limit,
        offset,
      });
    } else {
      let whereClause = "1=1";
      const params: any[] = [];

      if (search) {
        params.push(`%${search}%`);
        whereClause = `lower(l.name) like $${params.length}`;
      }

      console.log("[listAllReviews] Listing reviews whereClause:", whereClause);

      const queryParams = [...params, limit, offset];
      const query = `select r.id, r.listing_id, r.reviewer_id, r.comment, r.created_at, r.updated_at,
              l.name as listing_title, u.name as reviewer_name
       from listing_reviews r
       left join listings l on r.listing_id = l.id
       left join users u on r.reviewer_id = u.id
       where ${whereClause}
       order by r.created_at desc
       limit $${params.length + 1} offset $${params.length + 2}`;

      console.log("[listAllReviews] Query:", query);
      console.log("[listAllReviews] Query params:", queryParams);

      const result = await pool.query(query, queryParams);

      console.log("[listAllReviews] Query succeeded, rows:", result.rowCount);

      const countResult = await pool.query(
        `select count(*) as total from listing_reviews r
         left join listings l on r.listing_id = l.id
         where ${whereClause}`,
        params,
      );

      console.log("[listAllReviews] Count result:", countResult.rows[0]);

      res.json({
        ok: true,
        reviews: result.rows,
        total: Number.parseInt(countResult.rows[0].total, 10),
        limit,
        offset,
      });
    }
  } catch (error: any) {
    console.error("[listAllReviews] Error:", error);
    console.error("[listAllReviews] Error message:", error?.message);
    res.status(500).json({ ok: false, error: String(error?.message || error) });
  }
}

export async function deleteReview(req: Request, res: Response) {
  try {
    const reviewId = Number.parseInt((req.params.reviewId as string) || "", 10);
    if (!Number.isFinite(reviewId)) {
      return res.status(400).json({ ok: false, error: "Invalid review ID" });
    }

    let result = await pool.query(
      `delete from listing_reviews where id = $1 returning id`,
      [reviewId],
    );

    if (!result.rowCount || result.rowCount === 0) {
      result = await pool.query(
        `delete from user_reviews where id = $1 returning id`,
        [reviewId],
      );
    }

    if (!result.rowCount || result.rowCount === 0) {
      return res.status(404).json({ ok: false, error: "Review not found" });
    }

    res.json({ ok: true, message: "Review deleted" });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: String(error?.message || error) });
  }
}

export async function listAllClaims(req: Request, res: Response) {
  try {
    console.log("[listAllClaims] Starting request");

    const limit = Math.min(
      Number.parseInt((req.query.limit as string) || "20", 10),
      500,
    );
    const offset = Math.max(
      Number.parseInt((req.query.offset as string) || "0", 10),
      0,
    );
    const search = ((req.query.search as string) || "").toLowerCase().trim();
    const showCompleted =
      (req.query.show_completed as string) === "true" ? true : false;
    const statusFilter = (req.query.status as string) || "";

    console.log(
      "[listAllClaims] Parsed params - limit:",
      limit,
      "offset:",
      offset,
      "search:",
      search,
      "show_completed:",
      showCompleted,
      "status:",
      statusFilter,
    );

    let whereClause = "1=1";
    const params: any[] = [];

    if (search) {
      params.push(`%${search}%`);
      whereClause = `(
        lower(c.claim_number) like $1
        or lower(u.name) like $1
        or lower(c.status) like $1
        or cast(c.priority as text) like $1
        or cast(o.number as text) like $1
      )`;
    }

    if (statusFilter) {
      const paramIndex = params.length + 1;
      params.push(statusFilter);
      whereClause += ` and c.status = $${paramIndex}`;
    }

    if (!showCompleted) {
      whereClause += ` and c.status not in ('canceled', 'rejected', 'resolved')`;
    }

    console.log("[listAllClaims] whereClause:", whereClause);
    console.log("[listAllClaims] params array:", params);
    console.log("[listAllClaims] limit param index:", params.length + 1);
    console.log("[listAllClaims] offset param index:", params.length + 2);

    const queryParams = [...params, limit, offset];
    const query = `select c.id, c.claim_number, c.status, c.assigned_to, u.name as assigned_to_name, c.priority,
              c.created_at, c.updated_at, c.order_id, o.number as order_number, c.created_by_id, uc.name as created_by_name
       from claims c
       left join users u on c.assigned_to = u.id
       left join orders o on c.order_id = o.id
       left join users uc on c.created_by_id = uc.id
       where ${whereClause}
       order by c.created_at desc
       limit $${params.length + 1} offset $${params.length + 2}`;

    console.log("[listAllClaims] Query:", query);
    console.log("[listAllClaims] Query params:", queryParams);

    const result = await pool.query(query, queryParams);

    console.log("[listAllClaims] Query succeeded, rows:", result.rowCount);

    const countResult = await pool.query(
      `select count(*) as total from claims c
       left join users u on c.assigned_to = u.id
       left join orders o on c.order_id = o.id
       left join users uc on c.created_by_id = uc.id
       where ${whereClause}`,
      params,
    );

    console.log("[listAllClaims] Count result:", countResult.rows[0]);

    res.json({
      ok: true,
      claims: result.rows,
      total: Number.parseInt(countResult.rows[0].total, 10),
      limit,
      offset,
    });
  } catch (error: any) {
    console.error("[listAllClaims] Error:", error);
    console.error("[listAllClaims] Error message:", error?.message);
    console.error("[listAllClaims] Full error:", error);
    res.status(500).json({ ok: false, error: String(error?.message || error) });
  }
}

export async function assignClaimToUser(req: Request, res: Response) {
  try {
    const claimId = Number.parseInt((req.params.claimId as string) || "", 10);
    const assignToId = req.body?.assignToId;

    if (!Number.isFinite(claimId)) {
      return res.status(400).json({ ok: false, error: "Invalid claim ID" });
    }

    // assignToId can be null (for unassigning) or a valid user ID
    let assignToIdNumber: number | null = null;
    if (assignToId !== null && assignToId !== undefined) {
      assignToIdNumber = Number.parseInt(assignToId as string, 10);
      if (!Number.isFinite(assignToIdNumber)) {
        return res.status(400).json({ ok: false, error: "Invalid user ID" });
      }
    }

    // Verify claim exists and get its created_by_id field
    const claimResult = await pool.query(
      `select id, created_by_id from claims where id = $1`,
      [claimId],
    );

    if (!claimResult.rowCount) {
      return res.status(404).json({ ok: false, error: "Claim not found" });
    }

    const claim = claimResult.rows[0];

    // If assigning to a user, verify the user exists and prevent self-assignment if user created it
    let assignedToName: string | null = null;
    if (assignToIdNumber !== null) {
      // Check if the user is trying to assign to themselves and they created this claim
      if (assignToIdNumber === claim.created_by_id) {
        return res.status(403).json({
          ok: false,
          error: "You cannot assign yourself to a claim you created",
        });
      }

      const userResult = await pool.query(
        `select id, name from users where id = $1`,
        [assignToIdNumber],
      );

      if (!userResult.rowCount) {
        return res.status(404).json({ ok: false, error: "User not found" });
      }

      assignedToName = userResult.rows[0].name;
    }

    // Update claim assignment
    const updateResult = await pool.query(
      `update claims set assigned_to = $1 where id = $2 returning id, assigned_to`,
      [assignToIdNumber, claimId],
    );

    if (!updateResult.rowCount) {
      return res
        .status(500)
        .json({ ok: false, error: "Failed to update claim assignment" });
    }

    res.json({
      ok: true,
      claim: {
        id: updateResult.rows[0].id,
        assigned_to: updateResult.rows[0].assigned_to,
        assigned_to_name: assignedToName,
      },
    });
  } catch (error: any) {
    console.error("[assignClaimToUser] Error:", error);
    res.status(500).json({ ok: false, error: String(error?.message || error) });
  }
}

export async function listAllReports(req: Request, res: Response) {
  try {
    console.log("[listAllReports] Starting request");

    const limit = Math.min(
      Number.parseInt((req.query.limit as string) || "20", 10),
      500,
    );
    const offset = Math.max(
      Number.parseInt((req.query.offset as string) || "0", 10),
      0,
    );
    const search = ((req.query.search as string) || "").toLowerCase().trim();
    const reportFor = (req.query.report_for as string) || "listing";
    const showCompleted =
      (req.query.show_completed as string) === "true" ? true : false;
    const reportNumberFilter = (
      (req.query.report_number_filter as string) || ""
    ).trim();
    const reportedListingFilter = (
      (req.query.reported_listing_filter as string) || ""
    ).trim();
    const reportedByFilter = (
      (req.query.reported_by_filter as string) || ""
    ).trim();
    const assignedToFilter = (
      (req.query.assigned_to_filter as string) || ""
    ).trim();
    const statusFilter = ((req.query.status_filter as string) || "").trim();
    const reasonsFilter = ((req.query.reasons_filter as string) || "").trim();
    const sortBy = (req.query.sort_by as string) || null;
    const sortDirection = (
      (req.query.sort_direction as string) || "desc"
    ).toLowerCase();

    console.log(
      "[listAllReports] Parsed params - limit:",
      limit,
      "offset:",
      offset,
      "search:",
      search,
      "report_for:",
      reportFor,
      "show_completed:",
      showCompleted,
      "reportNumberFilter:",
      reportNumberFilter,
      "statusFilter:",
      statusFilter,
      "sortBy:",
      sortBy,
      "sortDirection:",
      sortDirection,
    );

    let whereClause = "r.report_for = $1";
    const params: any[] = [reportFor];

    if (search) {
      params.push(`%${search}%`);
      if (reportFor === "user") {
        whereClause = `r.report_for = $1 and (
          lower(r.report_number) like $${params.length}
          or lower(r.status) like $${params.length}
          or lower(u.name) like $${params.length}
          or lower(ru.username) like $${params.length}
        )`;
      } else {
        whereClause = `r.report_for = $1 and (
          lower(r.report_number) like $${params.length}
          or lower(r.status) like $${params.length}
          or lower(u.name) like $${params.length}
          or cast(r.reported_id as text) like $${params.length}
        )`;
      }
    }

    // Add report number filter
    if (reportNumberFilter) {
      params.push(`%${reportNumberFilter}%`);
      whereClause += ` and lower(r.report_number) like lower($${params.length})`;
    }

    // Add status filter
    if (statusFilter) {
      params.push(statusFilter);
      whereClause += ` and r.status = $${params.length}`;
    }

    // Add reasons filter
    if (reasonsFilter) {
      params.push(reasonsFilter);
      whereClause += ` and r.report_reasons::text like $${params.length}`;
    }

    // Add reported listing filter (for listing reports only)
    if (reportedListingFilter && reportFor === "listing") {
      params.push(`%${reportedListingFilter}%`);
      whereClause += ` and lower(l.name) like lower($${params.length})`;
    }

    // Add reported by filter
    if (reportedByFilter) {
      params.push(`%${reportedByFilter}%`);
      params.push(`%${reportedByFilter}%`);
      whereClause += ` and (lower(rb.name) like lower($${params.length - 1}) or lower(rb.username) like lower($${params.length}))`;
    }

    // Add assigned to filter
    if (assignedToFilter) {
      params.push(`%${assignedToFilter}%`);
      whereClause += ` and lower(u.name) like lower($${params.length})`;
    }

    if (!showCompleted) {
      whereClause += ` and r.status not in ('rejected', 'resolved')`;
    }

    // Build order clause
    let orderClause = "r.created_at desc";
    if (sortBy === "created") {
      orderClause = `r.created_at ${sortDirection === "asc" ? "asc" : "desc"}`;
    } else if (sortBy === "updated") {
      orderClause = `r.updated_at ${sortDirection === "asc" ? "asc" : "desc"}`;
    }

    console.log("[listAllReports] whereClause:", whereClause);
    console.log("[listAllReports] params array:", params);
    console.log("[listAllReports] orderClause:", orderClause);

    const queryParams = [...params, limit, offset];
    const query = `select r.id, r.report_number, r.status, r.report_reasons, r.assigned_to,
              u.name as assigned_to_name, r.created_at, r.updated_at, r.report_for, r.reported_id,
              ru.name as reported_user_name, ru.username as reported_user_username,
              rb.name as reported_by_name, rb.username as reported_by_username,
              l.name as reported_listing_name, l.id as reported_listing_id, r.reported_by_id
       from reports r
       left join users u on r.assigned_to = u.id
       left join users ru on r.report_for = 'user' and r.reported_id = ru.id
       left join users rb on r.reported_by_id = rb.id
       left join listings l on r.report_for = 'listing' and r.reported_id = l.id
       where ${whereClause}
       order by ${orderClause}
       limit $${params.length + 1} offset $${params.length + 2}`;

    console.log("[listAllReports] Query:", query);
    console.log("[listAllReports] Query params:", queryParams);

    const result = await pool.query(query, queryParams);

    console.log("[listAllReports] Query succeeded, rows:", result.rowCount);

    const countResult = await pool.query(
      `select count(*) as total from reports r
       left join users u on r.assigned_to = u.id
       left join users ru on r.report_for = 'user' and r.reported_id = ru.id
       left join users rb on r.reported_by_id = rb.id
       left join listings l on r.report_for = 'listing' and r.reported_id = l.id
       where ${whereClause}`,
      params,
    );

    console.log("[listAllReports] Count result:", countResult.rows[0]);

    res.json({
      ok: true,
      reports: result.rows,
      total: Number.parseInt(countResult.rows[0].total, 10),
      limit,
      offset,
    });
  } catch (error: any) {
    console.error("[listAllReports] Error:", error);
    console.error("[listAllReports] Error message:", error?.message);
    console.error("[listAllReports] Full error:", error);
    res.status(500).json({ ok: false, error: String(error?.message || error) });
  }
}

export async function getReportDetails(req: Request, res: Response) {
  try {
    const reportId = Number.parseInt((req.params.reportId as string) || "", 10);

    if (!Number.isFinite(reportId)) {
      return res.status(400).json({ ok: false, error: "Invalid report ID" });
    }

    const result = await pool.query(
      `select r.id, r.report_number, r.status, r.report_reasons, r.report_details, r.assigned_to,
              u.name as assigned_to_name, r.created_at, r.updated_at, r.report_for, r.reported_id,
              ru.name as reported_user_name, ru.username as reported_user_username,
              rb.name as reported_by_name, rb.username as reported_by_username,
              l.name as reported_listing_name, l.id as reported_listing_id, r.reported_by_id,
              r.reported_content_snapshot
       from reports r
       left join users u on r.assigned_to = u.id
       left join users ru on r.report_for = 'user' and r.reported_id = ru.id
       left join users rb on r.reported_by_id = rb.id
       left join listings l on r.report_for = 'listing' and r.reported_id = l.id
       where r.id = $1`,
      [reportId],
    );

    if (!result.rowCount || result.rowCount === 0) {
      return res.status(404).json({ ok: false, error: "Report not found" });
    }

    res.json({ ok: true, report: result.rows[0] });
  } catch (error: any) {
    console.error("[getReportDetails] Error:", error);
    res.status(500).json({ ok: false, error: String(error?.message || error) });
  }
}

export async function assignReportToUser(req: Request, res: Response) {
  try {
    const reportId = Number.parseInt((req.params.reportId as string) || "", 10);
    const assignToId = req.body?.assignToId;

    if (!Number.isFinite(reportId)) {
      return res.status(400).json({ ok: false, error: "Invalid report ID" });
    }

    let assignToIdNumber: number | null = null;
    if (assignToId !== null && assignToId !== undefined) {
      assignToIdNumber = Number.parseInt(assignToId as string, 10);
      if (!Number.isFinite(assignToIdNumber)) {
        return res.status(400).json({ ok: false, error: "Invalid user ID" });
      }
    }

    const reportResult = await pool.query(
      `select id, reported_by_id from reports where id = $1`,
      [reportId],
    );

    if (!reportResult.rowCount) {
      return res.status(404).json({ ok: false, error: "Report not found" });
    }

    const report = reportResult.rows[0];

    let assignedToName: string | null = null;
    if (assignToIdNumber !== null) {
      // Check if the user is trying to assign to themselves and they created this report
      if (assignToIdNumber === report.reported_by_id) {
        return res.status(403).json({
          ok: false,
          error: "You cannot assign yourself to a report you created",
        });
      }

      const userResult = await pool.query(
        `select id, name from users where id = $1`,
        [assignToIdNumber],
      );

      if (!userResult.rowCount) {
        return res.status(404).json({ ok: false, error: "User not found" });
      }

      assignedToName = userResult.rows[0].name;
    }

    const updateResult = await pool.query(
      `update reports set assigned_to = $1 where id = $2 returning id, assigned_to`,
      [assignToIdNumber, reportId],
    );

    if (!updateResult.rowCount) {
      return res
        .status(500)
        .json({ ok: false, error: "Failed to update report assignment" });
    }

    res.json({
      ok: true,
      report: {
        id: updateResult.rows[0].id,
        assigned_to: updateResult.rows[0].assigned_to,
        assigned_to_name: assignedToName,
      },
    });
  } catch (error: any) {
    console.error("[assignReportToUser] Error:", error);
    res.status(500).json({ ok: false, error: String(error?.message || error) });
  }
}

export async function updateClaimStatus(req: Request, res: Response) {
  try {
    const claimId = Number.parseInt((req.params.claimId as string) || "", 10);
    const newStatus = (req.body?.status as string) || "";
    const currentUser = (req.session as any)?.user;

    if (!Number.isFinite(claimId)) {
      return res.status(400).json({ ok: false, error: "Invalid claim ID" });
    }

    const validStatuses = [
      "submitted",
      "under review",
      "awaiting customer response",
      "reimbursement pending",
      "legal action",
      "canceled",
      "rejected",
      "resolved",
    ];

    if (!newStatus || !validStatuses.includes(newStatus)) {
      return res.status(400).json({
        ok: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    const claimResult = await pool.query(
      `select id, assigned_to from claims where id = $1`,
      [claimId],
    );

    if (!claimResult.rowCount) {
      return res.status(404).json({ ok: false, error: "Claim not found" });
    }

    const claim = claimResult.rows[0];
    if (claim.assigned_to !== currentUser?.id) {
      return res.status(403).json({
        ok: false,
        error: "You can only update claims assigned to you",
      });
    }

    const updateResult = await pool.query(
      `update claims set status = $1, updated_at = now(), updated_by_id = $3 where id = $2 returning id, status, updated_at`,
      [newStatus, claimId, currentUser?.id],
    );

    if (!updateResult.rowCount) {
      return res
        .status(500)
        .json({ ok: false, error: "Failed to update claim status" });
    }

    res.json({
      ok: true,
      claim: {
        id: updateResult.rows[0].id,
        status: updateResult.rows[0].status,
        updated_at: updateResult.rows[0].updated_at,
      },
    });
  } catch (error: any) {
    console.error("[updateClaimStatus] Error:", error);
    res.status(500).json({ ok: false, error: String(error?.message || error) });
  }
}

export async function updateReportStatus(req: Request, res: Response) {
  try {
    const reportId = Number.parseInt((req.params.reportId as string) || "", 10);
    const newStatus = (req.body?.status as string) || "";
    const currentUser = (req.session as any)?.user;

    if (!Number.isFinite(reportId)) {
      return res.status(400).json({ ok: false, error: "Invalid report ID" });
    }

    const validStatuses = ["submitted", "rejected", "resolved"];

    if (!newStatus || !validStatuses.includes(newStatus)) {
      return res.status(400).json({
        ok: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    const reportResult = await pool.query(
      `select id, assigned_to from reports where id = $1`,
      [reportId],
    );

    if (!reportResult.rowCount) {
      return res.status(404).json({ ok: false, error: "Report not found" });
    }

    const report = reportResult.rows[0];
    if (report.assigned_to !== currentUser?.id) {
      return res.status(403).json({
        ok: false,
        error: "You can only update reports assigned to you",
      });
    }

    const updateResult = await pool.query(
      `update reports set status = $1, updated_at = now(), updated_by_id = $3 where id = $2 returning id, status, updated_at`,
      [newStatus, reportId, currentUser?.id],
    );

    if (!updateResult.rowCount) {
      return res
        .status(500)
        .json({ ok: false, error: "Failed to update report status" });
    }

    res.json({
      ok: true,
      report: {
        id: updateResult.rows[0].id,
        status: updateResult.rows[0].status,
        updated_at: updateResult.rows[0].updated_at,
      },
    });
  } catch (error: any) {
    console.error("[updateReportStatus] Error:", error);
    res.status(500).json({ ok: false, error: String(error?.message || error) });
  }
}

export async function listAllFeedback(req: Request, res: Response) {
  try {
    console.log("[listAllFeedback] Starting request");

    const limit = Math.min(
      Number.parseInt((req.query.limit as string) || "20", 10),
      500,
    );
    const offset = Math.max(
      Number.parseInt((req.query.offset as string) || "0", 10),
      0,
    );
    const search = ((req.query.search as string) || "").toLowerCase().trim();
    const showCompleted =
      (req.query.show_completed as string) === "true" ? true : false;

    console.log(
      "[listAllFeedback] Parsed params - limit:",
      limit,
      "offset:",
      offset,
      "search:",
      search,
      "show_completed:",
      showCompleted,
    );

    let whereClause = "1=1";
    const params: any[] = [];

    if (search) {
      params.push(`%${search}%`);
      whereClause = `(
        lower(cast(f.id as text)) like $${params.length}
        or lower(f.status) like $${params.length}
        or lower(cast(f.created_by_id as text)) like $${params.length}
        or lower(u.name) like $${params.length}
        or lower(u2.name) like $${params.length}
      )`;
    }

    if (!showCompleted) {
      whereClause += ` and f.status not in ('implemented', 'declined', 'duplicate', 'out of scope')`;
    }

    console.log("[listAllFeedback] whereClause:", whereClause);
    console.log("[listAllFeedback] params array:", params);

    const queryParams = [...params, limit, offset];
    const query = `select f.id, f.status, f.categories, f.details, f.created_by_id,
              u.name as created_by_name, f.created_at, f.updated_at, f.assigned_to_id,
              u2.name as assigned_to_name
       from feedback f
       left join users u on f.created_by_id = u.id
       left join users u2 on f.assigned_to_id = u2.id
       where ${whereClause}
       order by f.created_at desc
       limit $${params.length + 1} offset $${params.length + 2}`;

    console.log("[listAllFeedback] Query:", query);
    console.log("[listAllFeedback] Query params:", queryParams);

    const result = await pool.query(query, queryParams);

    console.log("[listAllFeedback] Query succeeded, rows:", result.rowCount);

    const countResult = await pool.query(
      `select count(*) as total from feedback f
       left join users u on f.created_by_id = u.id
       left join users u2 on f.assigned_to_id = u2.id
       where ${whereClause}`,
      params,
    );

    console.log("[listAllFeedback] Count result:", countResult.rows[0]);

    res.json({
      ok: true,
      feedback: result.rows,
      total: Number.parseInt(countResult.rows[0].total, 10),
      limit,
      offset,
    });
  } catch (error: any) {
    console.error("[listAllFeedback] Error:", error);
    console.error("[listAllFeedback] Error message:", error?.message);
    console.error("[listAllFeedback] Full error:", error);
    res.status(500).json({ ok: false, error: String(error?.message || error) });
  }
}

export async function assignFeedbackToUser(req: Request, res: Response) {
  try {
    const feedbackId = Number.parseInt(
      (req.params.feedbackId as string) || "",
      10,
    );
    const assignToId = req.body?.assignToId;

    if (!Number.isFinite(feedbackId)) {
      return res.status(400).json({ ok: false, error: "Invalid feedback ID" });
    }

    let assignToIdNumber: number | null = null;
    if (assignToId !== null && assignToId !== undefined) {
      assignToIdNumber = Number.parseInt(assignToId as string, 10);
      if (!Number.isFinite(assignToIdNumber)) {
        return res.status(400).json({ ok: false, error: "Invalid user ID" });
      }
    }

    const feedbackResult = await pool.query(
      `select id from feedback where id = $1`,
      [feedbackId],
    );

    if (!feedbackResult.rowCount) {
      return res.status(404).json({ ok: false, error: "Feedback not found" });
    }

    let assignedToName: string | null = null;
    if (assignToIdNumber !== null) {
      const userResult = await pool.query(
        `select id, name from users where id = $1`,
        [assignToIdNumber],
      );

      if (!userResult.rowCount) {
        return res.status(404).json({ ok: false, error: "User not found" });
      }

      assignedToName = userResult.rows[0].name;
    }

    const updateResult = await pool.query(
      `update feedback set assigned_to_id = $1 where id = $2 returning id, assigned_to_id`,
      [assignToIdNumber, feedbackId],
    );

    if (!updateResult.rowCount) {
      return res
        .status(500)
        .json({ ok: false, error: "Failed to update feedback assignment" });
    }

    res.json({
      ok: true,
      feedback: {
        id: updateResult.rows[0].id,
        assigned_to_id: updateResult.rows[0].assigned_to_id,
        assigned_to_name: assignedToName,
      },
    });
  } catch (error: any) {
    console.error("[assignFeedbackToUser] Error:", error);
    res.status(500).json({ ok: false, error: String(error?.message || error) });
  }
}

export async function updateFeedbackStatus(req: Request, res: Response) {
  try {
    const feedbackId = Number.parseInt(
      (req.params.feedbackId as string) || "",
      10,
    );
    const newStatus = (req.body?.status as string) || "";
    const currentUser = (req.session as any)?.user;

    if (!Number.isFinite(feedbackId)) {
      return res.status(400).json({ ok: false, error: "Invalid feedback ID" });
    }

    const validStatuses = [
      "submitted",
      "triaged",
      "under review",
      "planned",
      "in progress",
      "implemented",
      "declined",
      "duplicate",
      "out of scope",
    ];

    if (!newStatus || !validStatuses.includes(newStatus)) {
      return res.status(400).json({
        ok: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    const feedbackResult = await pool.query(
      `select id, assigned_to_id from feedback where id = $1`,
      [feedbackId],
    );

    if (!feedbackResult.rowCount) {
      return res.status(404).json({ ok: false, error: "Feedback not found" });
    }

    const feedback = feedbackResult.rows[0];
    if (feedback.assigned_to_id !== currentUser?.id) {
      return res.status(403).json({
        ok: false,
        error: "You can only update feedback assigned to you",
      });
    }

    const updateResult = await pool.query(
      `update feedback set status = $1, updated_at = now(), updated_by_id = $3 where id = $2 returning id, status, updated_at`,
      [newStatus, feedbackId, currentUser?.id],
    );

    if (!updateResult.rowCount) {
      return res
        .status(500)
        .json({ ok: false, error: "Failed to update feedback status" });
    }

    res.json({
      ok: true,
      feedback: {
        id: updateResult.rows[0].id,
        status: updateResult.rows[0].status,
        updated_at: updateResult.rows[0].updated_at,
      },
    });
  } catch (error: any) {
    console.error("[updateFeedbackStatus] Error:", error);
    res.status(500).json({ ok: false, error: String(error?.message || error) });
  }
}

export async function getReportConversation(req: Request, res: Response) {
  try {
    const reportId = Number.parseInt((req.params.reportId as string) || "", 10);
    const currentUser = (req.session as any)?.user;

    if (!Number.isFinite(reportId)) {
      return res.status(400).json({ ok: false, error: "Invalid report ID" });
    }

    if (!currentUser?.moderator && !currentUser?.admin) {
      return res.status(403).json({
        ok: false,
        error: "Only moderators and admins can view reports",
      });
    }

    // Get the report
    const reportResult = await pool.query(
      `select id, reported_by_id, reported_id, assigned_to from reports where id = $1`,
      [reportId],
    );

    if (!reportResult.rowCount) {
      return res.status(404).json({ ok: false, error: "Report not found" });
    }

    const report = reportResult.rows[0];

    // Check if the report is assigned to the current user
    if (report.assigned_to !== currentUser.id) {
      return res.status(403).json({
        ok: false,
        error: "This report is not assigned to you",
      });
    }

    const userId1 = report.reported_by_id;
    const userId2 = report.reported_id;

    if (!userId1 || !userId2) {
      return res.status(400).json({
        ok: false,
        error: "Report missing user IDs",
      });
    }

    // Find the message thread between these two users
    const threadResult = await pool.query(
      `
      select id from message_threads
      where (user_a_id = $1 and user_b_id = $2)
         or (user_a_id = $2 and user_b_id = $1)
      limit 1
      `,
      [userId1, userId2],
    );

    if (!threadResult.rowCount) {
      // No thread exists yet
      return res.json({ ok: true, messages: [] });
    }

    const threadId = threadResult.rows[0].id;

    // Get all messages from this thread with sender names
    const messagesResult = await pool.query(
      `
      select
        m.id,
        m.sender_id,
        m.to_id,
        m.body,
        m.created_at,
        m.message_thread_id,
        u.name as sender_name
      from messages m
      left join users u on m.sender_id = u.id
      where m.message_thread_id = $1
      order by m.created_at asc
      `,
      [threadId],
    );

    const messages = messagesResult.rows.map((r: any) => ({
      id: r.id,
      senderId: r.sender_id,
      toId: r.to_id,
      body: r.body,
      createdAt: r.created_at,
      messageThreadId: r.message_thread_id,
      senderName: r.sender_name || "Unknown",
      isFromCurrentUser: r.sender_id === userId1, // From the reporting user's perspective
    }));

    res.json({ ok: true, messages });
  } catch (error: any) {
    console.error("[getReportConversation] Error:", error);
    res.status(500).json({ ok: false, error: String(error?.message || error) });
  }
}

export async function takeActionOnReport(req: Request, res: Response) {
  try {
    const reportId = Number.parseInt((req.params.reportId as string) || "", 10);
    const { fieldsToRemove, moderatorMessage } = req.body || {};

    if (!Number.isFinite(reportId)) {
      return res.status(400).json({ ok: false, error: "Invalid report ID" });
    }

    if (!Array.isArray(fieldsToRemove) || fieldsToRemove.length === 0) {
      return res
        .status(400)
        .json({ ok: false, error: "fieldsToRemove must be a non-empty array" });
    }

    if (typeof moderatorMessage !== "string" || !moderatorMessage.trim()) {
      return res
        .status(400)
        .json({ ok: false, error: "moderatorMessage is required" });
    }

    // Fetch report details
    const reportResult = await pool.query(
      `select r.id, r.report_number, r.reported_id, r.report_for,
              l.name as listing_name, l.host_id, l.enabled
       from reports r
       left join listings l on r.report_for = 'listing' and r.reported_id = l.id
       where r.id = $1`,
      [reportId],
    );

    if (!reportResult.rowCount || reportResult.rowCount === 0) {
      return res.status(404).json({ ok: false, error: "Report not found" });
    }

    const report = reportResult.rows[0];

    // Only listing reports can have actions taken
    if (report.report_for !== "listing") {
      return res.status(400).json({
        ok: false,
        error: "Actions can only be taken on listing reports",
      });
    }

    const listingId = report.reported_id;
    const listingHostId = report.host_id;
    const listingName = report.listing_name;

    if (!listingId || !listingHostId) {
      return res
        .status(404)
        .json({ ok: false, error: "Listing or host not found" });
    }

    // Build dynamic UPDATE query for listing
    const updates: string[] = ["enabled = false"];
    const params: any[] = [];
    let paramIndex = 1;

    if (fieldsToRemove.includes("title")) {
      updates.push(`name = NULL`);
    }
    if (fieldsToRemove.includes("location")) {
      updates.push(`latitude = NULL`);
      updates.push(`longitude = NULL`);
    }
    if (fieldsToRemove.includes("description")) {
      updates.push(`description = NULL`);
    }
    if (fieldsToRemove.includes("addons")) {
      updates.push(`addons = NULL`);
    }
    if (fieldsToRemove.includes("images")) {
      updates.push(`image_url = NULL`);
    }

    params.push(listingId);

    // Update the listing
    const updateQuery = `UPDATE listings SET ${updates.join(", ")} WHERE id = $${paramIndex} RETURNING id`;
    const updateResult = await pool.query(updateQuery, params);

    if (!updateResult.rowCount) {
      return res
        .status(404)
        .json({ ok: false, error: "Failed to update listing" });
    }

    // If images are being removed, delete the S3 folder and listing_images records
    if (fieldsToRemove.includes("images")) {
      try {
        const s3Prefix = `listings/${listingId}/`;
        console.log("[takeActionOnReport] Deleting S3 prefix:", s3Prefix);
        await deleteS3Prefix(s3Prefix);
      } catch (s3Error: any) {
        console.error(
          "[takeActionOnReport] Error deleting S3 prefix:",
          s3Error,
        );
        // Continue anyway - DB update succeeded, S3 deletion is best-effort
      }

      try {
        console.log(
          "[takeActionOnReport] Deleting listing_images records for listing:",
          listingId,
        );
        await pool.query(`DELETE FROM listing_images WHERE listing_id = $1`, [
          listingId,
        ]);
      } catch (dbError: any) {
        console.error(
          "[takeActionOnReport] Error deleting listing_images records:",
          dbError,
        );
        // Continue anyway - S3 deletion succeeded, DB cleanup is important but not blocking
      }
    }

    // Create message thread
    const threadResult = await pool.query(
      `INSERT INTO message_threads (user_a_id, user_b_id, thread_title, last_updated_by_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [2, listingHostId, report.report_number, 2],
    );

    const threadId = threadResult.rows[0].id;

    // Build action list for message
    const actionList: string[] = [];
    if (fieldsToRemove.includes("title")) actionList.push("Title removed");
    if (fieldsToRemove.includes("location"))
      actionList.push("Location removed");
    if (fieldsToRemove.includes("description"))
      actionList.push("Description removed");
    if (fieldsToRemove.includes("addons")) actionList.push("Addons removed");
    if (fieldsToRemove.includes("images")) actionList.push("Image(s) removed");

    const actionBullets = actionList.map((action) => `• ${action}`).join("\n");

    const messageBody = `Your listing "${listingName}" was found to be in violation of LendIt's policies. The listing was disabled and the following actions were taken:\n${actionBullets}\n\nModerator notes: ${moderatorMessage.trim()}`;

    // Create the message
    const messageResult = await pool.query(
      `INSERT INTO messages (sender_id, to_id, body, message_thread_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [2, listingHostId, messageBody, threadId],
    );

    res.json({
      ok: true,
      messageThreadId: threadId,
      messageId: messageResult.rows[0].id,
    });
  } catch (error: any) {
    console.error("[takeActionOnReport] Error:", error);
    res.status(500).json({ ok: false, error: String(error?.message || error) });
  }
}

export async function listMessageThreadsByUserPair(
  req: Request,
  res: Response,
) {
  try {
    const userId1 = Number.parseInt((req.query.user_a_id as string) || "", 10);
    const userId2 = Number.parseInt((req.query.user_b_id as string) || "", 10);

    if (!Number.isFinite(userId1) || !Number.isFinite(userId2)) {
      return res.status(400).json({
        ok: false,
        error:
          "user_a_id and user_b_id are required and must be valid integers",
      });
    }

    const result = await pool.query(
      `select id, user_a_id, user_b_id, thread_title, created_at, last_updated
       from message_threads
       where (user_a_id = $1 and user_b_id = $2)
          or (user_a_id = $2 and user_b_id = $1)
       order by last_updated desc`,
      [userId1, userId2],
    );

    res.json({
      ok: true,
      threads: result.rows.map((r: any) => ({
        id: r.id,
        userAId: r.user_a_id,
        userBId: r.user_b_id,
        threadTitle: r.thread_title || `Thread #${r.id}`,
        createdAt: r.created_at,
        lastUpdated: r.last_updated,
      })),
    });
  } catch (error: any) {
    console.error("[listMessageThreadsByUserPair] Error:", error);
    res.status(500).json({ ok: false, error: String(error?.message || error) });
  }
}
