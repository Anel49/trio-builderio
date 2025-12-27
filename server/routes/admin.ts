import { Request, Response } from "express";
import { pool } from "./db";
import { requireAdmin, requireModeratorOrAdmin } from "./auth";

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

    let whereClause = "u.id != 2";
    const params: any[] = [];

    if (search) {
      params.push(`%${search}%`);
      whereClause = `u.id != 2 and (lower(u.name) like $${params.length} or lower(u.email) like $${params.length} or lower(u.username) like $${params.length})`;
    }

    const result = await pool.query(
      `select u.id, u.name, u.email, u.username, u.avatar_url, u.created_at,
              coalesce(u.founding_supporter,false) as founding_supporter,
              coalesce(u.top_referrer,false) as top_referrer,
              coalesce(u.ambassador,false) as ambassador,
              coalesce(u.open_dms,true) as open_dms,
              coalesce(u.active,true) as active,
              coalesce(u.admin,false) as admin,
              coalesce(u.moderator,false) as moderator
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
                 coalesce(moderator,false) as moderator`,
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
    const status = (req.query.status as string) || "";

    let whereClause = "1=1";
    const params: any[] = [];

    if (status) {
      params.push(status);
      whereClause = `o.status = $${params.length}`;
    }

    const result = await pool.query(
      `select o.id, o.listing_id, o.listing_title, o.renter_id, o.renter_name, o.renter_email,
              o.host_id, o.host_name, o.host_email, o.start_date, o.end_date, o.status, o.created_at
       from orders o
       where ${whereClause}
       order by o.created_at desc
       limit $${params.length + 1} offset $${params.length + 2}`,
      [...params, limit, offset],
    );

    const countResult = await pool.query(
      `select count(*) as total from orders where ${whereClause}`,
      params,
    );

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
    const limit = Math.min(
      Number.parseInt((req.query.limit as string) || "50", 10),
      500,
    );
    const offset = Math.max(
      Number.parseInt((req.query.offset as string) || "0", 10),
      0,
    );

    const result = await pool.query(
      `select r.id, r.listing_id, r.renter_id, r.host_id, r.rating, r.comment, r.created_at,
              l.name as listing_title
       from listing_reviews r
       left join listings l on r.listing_id = l.id
       order by r.created_at desc
       limit $1 offset $2`,
      [limit, offset],
    );

    const countResult = await pool.query(
      "select count(*) as total from listing_reviews",
    );

    res.json({
      ok: true,
      reviews: result.rows,
      total: Number.parseInt(countResult.rows[0].total, 10),
      limit,
      offset,
    });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: String(error?.message || error) });
  }
}

export async function deleteReview(req: Request, res: Response) {
  try {
    const reviewId = Number.parseInt((req.params.reviewId as string) || "", 10);
    if (!Number.isFinite(reviewId)) {
      return res.status(400).json({ ok: false, error: "Invalid review ID" });
    }

    const result = await pool.query(
      `delete from listing_reviews where id = $1 returning id`,
      [reviewId],
    );

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

    console.log("[listAllClaims] Parsed params - limit:", limit, "offset:", offset, "search:", search);

    let whereClause = "1=1";
    const params: any[] = [];

    if (search) {
      params.push(`%${search}%`);
      whereClause = `(
        lower(c.claim_number) like $1
        or lower(u.name) like $1
        or lower(c.status) like $1
        or cast(c.priority as text) like $1
        or cast(c.order_id as text) like $1
      )`;
    }

    console.log("[listAllClaims] whereClause:", whereClause);
    console.log("[listAllClaims] params array:", params);
    console.log("[listAllClaims] limit param index:", params.length + 1);
    console.log("[listAllClaims] offset param index:", params.length + 2);

    const queryParams = [...params, limit, offset];
    const query = `select c.id, c.claim_number, c.status, u.name as assigned_to_name, c.priority,
              c.created_at, c.updated_at, c.order_id
       from claims c
       left join users u on c.assigned_to = u.id
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
