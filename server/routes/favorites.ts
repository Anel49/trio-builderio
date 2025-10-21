import type { Request, Response } from "express";
import { pool } from "./db";

export async function listFavorites(req: Request, res: Response) {
  try {
    const userId = String((req.params as any)?.userId || "").trim();
    if (!userId) {
      return res.status(400).json({ ok: false, error: "userId is required" });
    }

    const result = await pool.query(
      `select l.id, l.name, l.price_cents, l.rating, l.image_url, l.host, l.category,
              l.latitude, l.longitude, l.zip_code, l.rental_period, l.description,
              f.created_at as favorited_at
       from favorites f
       join listings l on f.listing_id = l.id
       where f.user_id = $1
       order by f.created_at desc`,
      [userId],
    );

    const favorites = result.rows.map((r: any) => ({
      id: r.id,
      name: r.name,
      price: `$${(r.price_cents / 100).toFixed(r.price_cents % 100 === 0 ? 0 : 2)}`,
      rating: r.rating ? Number(r.rating) : null,
      image: r.image_url,
      host: r.host,
      type: r.category,
      latitude: r.latitude,
      longitude: r.longitude,
      zipCode: r.zip_code,
      rentalPeriod: r.rental_period,
      description: r.description,
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

    const result = await pool.query(
      `insert into favorites (user_id, listing_id)
       values ($1, $2)
       on conflict (user_id, listing_id) do nothing
       returning user_id, listing_id, created_at`,
      [userId, listingId],
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
