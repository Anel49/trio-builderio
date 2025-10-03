import type { Request, Response } from "express";
import { pool } from "./db";
import type { Coordinates } from "../lib/geo";
import {
  calculateDistanceMiles,
  getZipCoordinates,
  normalizeZipCode,
} from "../lib/geo";

const VALID_RENTAL_PERIODS = ["Hourly", "Daily", "Weekly", "Monthly"];
const DEFAULT_RENTAL_PERIOD = "Daily";

function normalizeRentalPeriod(value: any): string {
  if (typeof value !== "string") return DEFAULT_RENTAL_PERIOD;
  const lower = value.trim().toLowerCase();
  const match = VALID_RENTAL_PERIODS.find(
    (period) => period.toLowerCase() === lower,
  );
  return match ?? DEFAULT_RENTAL_PERIOD;
}

function extractUserZip(req: Request): string | null {
  const query = (req.query ?? {}) as Record<string, unknown>;
  const raw =
    typeof query.user_zip === "string"
      ? (query.user_zip as string)
      : typeof query.userZip === "string"
        ? (query.userZip as string)
        : null;
  return normalizeZipCode(raw);
}

function formatPrice(price_cents: number) {
  if (price_cents % 100 === 0) return `$${(price_cents / 100).toFixed(0)}`;
  return `$${(price_cents / 100).toFixed(2)}`;
}

export async function listListings(req: Request, res: Response) {
  try {
    const userZip = extractUserZip(req);
    const userCoords = userZip ? await getZipCoordinates(userZip) : null;
    let result: any;
    try {
      result = await pool.query(
        `select l.id, l.name, l.price_cents, l.rating, l.image_url, l.host, l.category, l.distance, l.description, l.zip_code, l.created_at, l.rental_period,
                coalesce(img.images, '{}') as images,
                coalesce(cats.categories, '{}') as categories
         from listings l
         left join lateral (
           select array_agg(url order by position nulls last, id) as images
           from listing_images
           where listing_id = l.id
         ) img on true
         left join lateral (
           select array_agg(category order by position nulls last, id) as categories
           from listing_categories
           where listing_id = l.id
         ) cats on true
         order by l.created_at desc
         limit 50`,
      );
    } catch {
      result = await pool.query(
        `select id, name, price_cents, rating, image_url, host, category, distance, description, zip_code, created_at
         from listings
         order by created_at desc
         limit 50`,
      );
    }
    const rows: any[] = Array.isArray(result.rows) ? result.rows : [];
    const listingCoordinateMap = new Map<string, Coordinates>();

    if (userCoords) {
      const uniqueZips = Array.from(
        new Set(
          rows
            .map((row) => normalizeZipCode(row?.zip_code))
            .filter((zip): zip is string => Boolean(zip)),
        ),
      );

      if (uniqueZips.length > 0) {
        await Promise.all(
          uniqueZips.map(async (zip) => {
            const coords = await getZipCoordinates(zip).catch(() => null);
            if (coords) {
              listingCoordinateMap.set(zip, coords);
            }
          }),
        );
      }
    }

    const listings = rows.map((r: any) => {
      const images = Array.isArray(r.images) ? r.images : [];
      const categories = Array.isArray(r.categories) ? r.categories : [];
      const normalizedZip = normalizeZipCode(r.zip_code);

      let distanceMiles: number | null = null;
      if (userCoords && normalizedZip) {
        const coords = listingCoordinateMap.get(normalizedZip);
        if (coords) {
          distanceMiles = calculateDistanceMiles(userCoords, coords);
        }
      }

      const distanceLabel =
        distanceMiles != null
          ? `${distanceMiles.toFixed(1)} miles`
          : typeof r.distance === "string" && r.distance.trim()
            ? r.distance
            : null;

      return {
        id: r.id,
        name: r.name,
        price: formatPrice(r.price_cents),
        rating: r.rating ? Number(r.rating) : null,
        images,
        image: r.image_url || (images.length > 0 ? images[0] : null),
        host: r.host,
        type: r.category || (categories.length ? categories[0] : null),
        categories,
        distance: distanceLabel,
        distanceMiles,
        description: r.description ?? null,
        zipCode: normalizedZip,
        createdAt: r.created_at,
        rentalPeriod:
          r.rental_period && typeof r.rental_period === "string"
            ? normalizeRentalPeriod(r.rental_period)
            : DEFAULT_RENTAL_PERIOD,
      };
    });
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
      images,
      host,
      type,
      distance,
      description,
      categories,
      rental_period,
      zip_code,
    } = req.body || {};
    if (!name || typeof price_cents !== "number") {
      return res
        .status(400)
        .json({ ok: false, error: "name and price_cents are required" });
    }
    const zip =
      typeof zip_code === "string" && zip_code.trim() ? zip_code.trim() : null;
    if (!zip) {
      return res.status(400).json({ ok: false, error: "zip_code is required" });
    }
    const imgs: string[] = Array.isArray(images)
      ? (images as any[]).filter((u) => typeof u === "string" && u.trim())
      : image
        ? [image]
        : [];
    const primaryImage = imgs[0] ?? null;
    const cats: string[] = Array.isArray(categories)
      ? (categories as any[]).filter((c) => typeof c === "string" && c.trim())
      : typeof type === "string" && type.trim()
        ? [type]
        : [];
    const primaryCategory = cats[0] ?? null;
    const rentalPeriodValue = normalizeRentalPeriod(rental_period);

    let result;
    try {
      result = await pool.query(
        `insert into listings (name, price_cents, rating, image_url, host, category, rental_period, distance, description, zip_code)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
         returning id`,
        [
          name,
          price_cents,
          rating ?? null,
          primaryImage,
          host ?? null,
          primaryCategory,
          rentalPeriodValue,
          distance ?? null,
          description ?? null,
          zip,
        ],
      );
    } catch {
      result = await pool.query(
        `insert into listings (name, price_cents, rating, image_url, host, category, distance, description, zip_code)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         returning id`,
        [
          name,
          price_cents,
          rating ?? null,
          primaryImage,
          host ?? null,
          primaryCategory,
          distance ?? null,
          description ?? null,
          zip,
        ],
      );
    }
    const newId = result.rows[0].id;
    if (imgs.length > 0) {
      try {
        for (let i = 0; i < imgs.length; i++) {
          const url = imgs[i];
          await pool.query(
            `insert into listing_images (listing_id, url, position) values ($1,$2,$3)
             on conflict do nothing`,
            [newId, url, i + 1],
          );
        }
      } catch {}
    }
    if (cats.length > 0) {
      try {
        for (let i = 0; i < cats.length; i++) {
          const c = cats[i];
          await pool.query(
            `insert into listing_categories (listing_id, category, position) values ($1,$2,$3)
             on conflict do nothing`,
            [newId, c, i + 1],
          );
        }
      } catch {}
    }
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
    const userZip = extractUserZip(req);
    const userCoords = userZip ? await getZipCoordinates(userZip) : null;
    let result: any;
    try {
      result = await pool.query(
        `select l.id, l.name, l.price_cents, l.rating, l.image_url, l.host, l.category, l.distance, l.description, l.zip_code, l.created_at, l.rental_period,
                coalesce(img.images, '{}') as images,
                coalesce(cats.categories, '{}') as categories
         from listings l
         left join lateral (
           select array_agg(url order by position nulls last, id) as images
           from listing_images
           where listing_id = l.id
         ) img on true
         left join lateral (
           select array_agg(category order by position nulls last, id) as categories
           from listing_categories
           where listing_id = l.id
         ) cats on true
         where l.id = $1`,
        [id],
      );
    } catch {
      result = await pool.query(
        `select id, name, price_cents, rating, image_url, host, category, distance, description, zip_code, created_at
         from listings where id = $1`,
        [id],
      );
    }
    if (result.rowCount === 0)
      return res.status(404).json({ ok: false, error: "not found" });
    const r: any = result.rows[0];
    const images = Array.isArray(r.images) ? r.images : [];
    const categories = Array.isArray(r.categories) ? r.categories : [];
    const listing = {
      id: r.id,
      name: r.name,
      price: formatPrice(r.price_cents),
      rating: r.rating ? Number(r.rating) : null,
      images,
      image: r.image_url || (images.length > 0 ? images[0] : null),
      host: r.host,
      type: r.category || (categories.length ? categories[0] : null),
      categories,
      distance: r.distance,
      description: r.description ?? null,
      zipCode: r.zip_code || null,
      createdAt: r.created_at,
      rentalPeriod:
        r.rental_period && typeof r.rental_period === "string"
          ? normalizeRentalPeriod(r.rental_period)
          : DEFAULT_RENTAL_PERIOD,
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
    let result = await pool.query(
      `select id, reviewer as user, rating, comment as text, created_at
       from reviews where listing_id = $1 order by created_at desc limit 200`,
      [id],
    );

    // Seed varying review counts for first 9 listings if none exist yet
    const existingCount = result.rowCount;
    if (id >= 1 && id <= 9) {
      const desiredCounts = [0, 17, 2, 0, 1, 4, 2, 5, 0, 3];
      // index by listing id; desiredCounts[1] => listing 1 count, etc.
      const count = desiredCounts[id] ?? 0;
      if (count > existingCount) {
        const samples = [
          {
            reviewer: "Mike",
            rating: 5,
            comment: "Excellent quality and easy pickup.",
          },
          {
            reviewer: "Jennifer",
            rating: 4,
            comment: "Great value. Would rent again.",
          },
          {
            reviewer: "David",
            rating: 5,
            comment: "As described. Smooth communication.",
          },
          {
            reviewer: "Lisa",
            rating: 3,
            comment: "Worked fine with minor wear.",
          },
          {
            reviewer: "Robert",
            rating: 5,
            comment: "Perfect for my needs. Highly recommend.",
          },
          { reviewer: "Emma", rating: 4, comment: "Good overall experience." },
        ];
        const now = Date.now();
        for (let i = existingCount; i < count; i++) {
          const s = samples[i % samples.length];
          const daysAgo = (i + id) * 2; // vary by listing and index
          const createdAt = new Date(now - daysAgo * 24 * 60 * 60 * 1000);
          await pool.query(
            `insert into reviews (listing_id, reviewer, rating, comment, created_at)
             values ($1,$2,$3,$4,$5)`,
            [id, s.reviewer, s.rating, s.comment, createdAt],
          );
        }
        result = await pool.query(
          `select id, reviewer as user, rating, comment as text, created_at
           from reviews where listing_id = $1 order by created_at desc limit 200`,
          [id],
        );
      }
    }

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

export async function listListingReservations(req: Request, res: Response) {
  try {
    const id = Number((req.params as any)?.id);
    if (!id || Number.isNaN(id)) {
      return res.status(400).json({ ok: false, error: "invalid id" });
    }
    const result = await pool.query(
      `select id, start_date, end_date, renter, status from reservations where listing_id = $1 order by start_date asc limit 500`,
      [id],
    );
    const reservations = result.rows.map((r: any) => ({
      id: String(r.id),
      startDate: new Date(r.start_date).toISOString(),
      endDate: new Date(r.end_date).toISOString(),
      renterName: r.renter || undefined,
      status: String(r.status || "confirmed") as any,
    }));
    res.json({ ok: true, reservations });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: String(error?.message || error) });
  }
}
