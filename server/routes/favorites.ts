import type { Request, Response } from "express";
import { pool } from "./db";

export async function listFavorites(req: Request, res: Response) {
  try {
    const userId = String((req.params as any)?.userId || "").trim();
    if (!userId) {
      return res.status(400).json({ ok: false, error: "userId is required" });
    }

    const result = await pool.query(
      `select f.listing_id, f.listing_name, f.listing_image, f.listing_host,
              f.created_at as favorited_at, l.id as listing_exists
       from favorites f
       left join listings l on f.listing_id = l.id
       where f.user_id = $1
       order by f.created_at desc`,
      [userId],
    );

    const favorites = result.rows.map((r: any) => ({
      id: r.listing_id,
      name: r.listing_name,
      image: r.listing_image,
      host: r.listing_host,
      listingExists: r.listing_exists !== null,
      favoritedAt: r.favorited_at,
    }));

    res.json({ ok: true, favorites });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: String(error?.message || error) });
  }
}

export async function addFavorite(req: Request, res: Response) {
  try {
    const { userId, listingId } = (req.body || {}) as any;

    if (!userId || typeof userId !== "string") {
      return res.status(400).json({ ok: false, error: "userId is required" });
    }
    if (!listingId || typeof listingId !== "number") {
      return res
        .status(400)
        .json({ ok: false, error: "listingId is required" });
    }

    // First, get the listing details
    const listingResult = await pool.query(
      `select name, image_url, host from listings where id = $1`,
      [listingId],
    );

    if (listingResult.rowCount === 0) {
      return res.status(404).json({ ok: false, error: "Listing not found" });
    }

    const listing = listingResult.rows[0];

    const result = await pool.query(
      `insert into favorites (user_id, listing_id, listing_name, listing_image, listing_host)
       values ($1, $2, $3, $4, $5)
       on conflict (user_id, listing_id) do nothing
       returning user_id, listing_id, created_at`,
      [userId, listingId, listing.name, listing.image_url, listing.host],
    );

    if (result.rowCount === 0) {
      return res.json({ ok: true, alreadyFavorited: true });
    }

    res.json({ ok: true, favorite: result.rows[0] });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: String(error?.message || error) });
  }
}

export async function removeFavorite(req: Request, res: Response) {
  try {
    const { userId, listingId } = req.params as any;

    if (!userId || typeof userId !== "string") {
      return res.status(400).json({ ok: false, error: "userId is required" });
    }
    if (!listingId || isNaN(Number(listingId))) {
      return res
        .status(400)
        .json({ ok: false, error: "listingId is required" });
    }

    const result = await pool.query(
      `delete from favorites
       where user_id = $1 and listing_id = $2`,
      [userId, Number(listingId)],
    );

    res.json({ ok: true, deleted: result.rowCount > 0 });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: String(error?.message || error) });
  }
}

export async function checkFavorite(req: Request, res: Response) {
  try {
    const { userId, listingId } = req.params as any;

    if (!userId || typeof userId !== "string") {
      return res.status(400).json({ ok: false, error: "userId is required" });
    }
    if (!listingId || isNaN(Number(listingId))) {
      return res
        .status(400)
        .json({ ok: false, error: "listingId is required" });
    }

    const result = await pool.query(
      `select 1 from favorites
       where user_id = $1 and listing_id = $2
       limit 1`,
      [userId, Number(listingId)],
    );

    res.json({ ok: true, isFavorited: result.rowCount > 0 });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: String(error?.message || error) });
  }
}
