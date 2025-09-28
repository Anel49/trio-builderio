import type { Request, Response } from "express";
import { pool } from "./db";

function formatPrice(price_cents: number) {
  if (price_cents % 100 === 0) return `$${(price_cents / 100).toFixed(0)}`;
  return `$${(price_cents / 100).toFixed(2)}`;
}

export async function listListings(_req: Request, res: Response) {
  try {
    const result = await pool.query(
      `select id, name, price_cents, rating, image_url, host, category, distance, created_at
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
      distance: r.distance,
      createdAt: r.created_at,
    }));
    res.json({ ok: true, listings });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: String(error?.message || error) });
  }
}

export async function createListing(req: Request, res: Response) {
  try {
    const {
      name,
      price_cents,
      rating,
      image,
      host,
      type,
      distance,
      description,
    } = req.body || {};
    if (!name || typeof price_cents !== "number") {
      return res
        .status(400)
        .json({ ok: false, error: "name and price_cents are required" });
    }
    const result = await pool.query(
      `insert into listings (name, price_cents, rating, image_url, host, category, distance, description)
       values ($1,$2,$3,$4,$5,$6,$7,$8)
       returning id`,
      [
        name,
        price_cents,
        rating ?? null,
        image ?? null,
        host ?? null,
        type ?? null,
        distance ?? null,
        description ?? null,
      ],
    );
    res.json({ ok: true, id: result.rows[0].id });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: String(error?.message || error) });
  }
}

export async function getListingById(req: Request, res: Response) {
  try {
    const id = Number((req.params as any)?.id);
    if (!id || Number.isNaN(id)) {
      return res.status(400).json({ ok: false, error: "invalid id" });
    }
    const result = await pool.query(
      `select id, name, price_cents, rating, image_url, host, category, distance, description, created_at
       from listings where id = $1`,
      [id],
    );
    if (result.rowCount === 0)
      return res.status(404).json({ ok: false, error: "not found" });
    const r: any = result.rows[0];
    const listing = {
      id: r.id,
      name: r.name,
      price: formatPrice(r.price_cents),
      rating: r.rating ? Number(r.rating) : null,
      image: r.image_url,
      host: r.host,
      type: r.category,
      distance: r.distance,
      description: r.description ?? null,
      createdAt: r.created_at,
    };
    res.json({ ok: true, listing });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: String(error?.message || error) });
  }
}

export async function listListingReviews(req: Request, res: Response) {
  try {
    const id = Number((req.params as any)?.id);
    if (!id || Number.isNaN(id)) {
      return res.status(400).json({ ok: false, error: "invalid id" });
    }
    const result = await pool.query(
      `select id, reviewer as user, rating, comment as text, created_at
       from reviews where listing_id = $1 order by created_at desc limit 200`,
      [id],
    );
    const reviews = result.rows.map((r: any) => ({
      id: r.id,
      user: r.user || "",
      avatar: undefined,
      rating: r.rating ? Number(r.rating) : 0,
      date: new Date(r.created_at).toLocaleDateString(),
      dateValue: new Date(r.created_at),
      text: r.text || "",
    }));
    res.json({ ok: true, reviews });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: String(error?.message || error) });
  }
}

export async function deleteListing(req: Request, res: Response) {
  try {
    const id = Number((req.params as any)?.id);
    if (!id || Number.isNaN(id)) {
      return res.status(400).json({ ok: false, error: "invalid id" });
    }
    const result = await pool.query("delete from listings where id = $1", [id]);
    res.json({ ok: true, deleted: result.rowCount || 0 });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: String(error?.message || error) });
  }
}
