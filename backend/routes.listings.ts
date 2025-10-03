import type { Request, Response } from "express";
import { pool } from "./db";

function formatPrice(price_cents: number) {
  if (price_cents % 100 === 0) return `$${(price_cents / 100).toFixed(0)}`;
  return `$${(price_cents / 100).toFixed(2)}`;
}

export async function listListings(_req: Request, res: Response) {
  try {
    const result = await pool.query(
      `select id, name, price_cents, rating, image_url, host, category
       from listings
       order by created_at desc
       limit 50`,
    );
    const listings = result.rows.map((r: any) => ({
      id: r.id,
      name: r.name,
      price: formatPrice(r.price_cents),
      rating: r.rating ? Number(r.rating) : null,
      image: r.image_url,
      host: r.host,
      type: r.category,
      distance: null,
    }));
    res.json({ ok: true, listings });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: String(error?.message || error) });
  }
}

export async function createListing(req: Request, res: Response) {
  try {
    const { name, price_cents, rating, image, host, type } = req.body || {};
    if (!name || typeof price_cents !== "number") {
      return res
        .status(400)
        .json({ ok: false, error: "name and price_cents are required" });
    }
    const result = await pool.query(
      `insert into listings (name, price_cents, rating, image_url, host, category)
       values ($1,$2,$3,$4,$5,$6)
       returning id`,
      [
        name,
        price_cents,
        rating ?? null,
        image ?? null,
        host ?? null,
        type ?? null,
      ],
    );
    res.json({ ok: true, id: result.rows[0].id });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: String(error?.message || error) });
  }
}
