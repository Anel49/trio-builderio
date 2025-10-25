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

function parseCoordinate(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = Number.parseFloat(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function extractUserCoordinates(req: Request): Coordinates | null {
  const query = (req.query ?? {}) as Record<string, unknown>;
  const latCandidate =
    query.user_lat ?? query.userLat ?? query.latitude ?? query.lat ?? null;
  const lonCandidate =
    query.user_lng ?? query.userLng ?? query.longitude ?? query.lon ?? null;
  const lat = parseCoordinate(latCandidate);
  const lon = parseCoordinate(lonCandidate);
  if (lat == null || lon == null) return null;
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return null;
  return { latitude: lat, longitude: lon };
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
    console.log("[listListings] Request received");
    const userCoords = extractUserCoordinates(req);
    console.log("[listListings] User coords:", userCoords);

    const query = (req.query ?? {}) as Record<string, unknown>;
    const enabledParam = query.enabled;
    const filterEnabled =
      enabledParam === "true" ? true : enabledParam === "false" ? false : null;

    let result: any;
    try {
      let sql = `select id, name, price_cents, rating, image_url, host, category, description, zip_code, created_at, latitude, longitude, rental_period,
                coalesce(delivery, false) as delivery, coalesce(free_delivery, false) as free_delivery, coalesce(enabled, true) as enabled
         from listings`;

      if (filterEnabled !== null) {
        console.log("[listListings] Filtering enabled =", filterEnabled);
        sql += ` where coalesce(enabled, true) = $1`;
      }

      sql += ` order by created_at desc limit 50`;

      const params = filterEnabled !== null ? [filterEnabled] : [];
      console.log("[listListings] Executing SQL:", sql, "Params:", params);
      result = await pool.query(sql, params);
      console.log("[listListings] Query succeeded, rows:", result.rows?.length);
      if (result.rows && result.rows.length > 0) {
        console.log("[listListings] First row:", result.rows[0]);
      }
    } catch (e) {
      console.error("[listListings] Query failed:", e);
      result = { rows: [] };
    }
    const rows: any[] = Array.isArray(result.rows) ? result.rows : [];
    console.log("[listListings] Processing", rows.length, "rows");

    // Fetch all categories for these listings in bulk
    const listingIds = rows.map((r: any) => r.id);
    const categoriesMap: Record<number, string[]> = {};
    if (listingIds.length > 0) {
      try {
        const categoriesResult = await pool.query(
          `select listing_id, category from listing_categories where listing_id = any($1)`,
          [listingIds],
        );
        for (const row of categoriesResult.rows) {
          if (!categoriesMap[row.listing_id]) {
            categoriesMap[row.listing_id] = [];
          }
          categoriesMap[row.listing_id].push(row.category);
        }
      } catch (e) {
        console.log("[listListings] Failed to fetch categories:", e);
      }
    }

    const listings = rows.map((r: any) => {
      const normalizedZip = normalizeZipCode(r.zip_code);

      let distanceMiles: number | null = null;
      const listingLatitude =
        typeof r.latitude === "number" ? r.latitude : null;
      const listingLongitude =
        typeof r.longitude === "number" ? r.longitude : null;

      if (userCoords && listingLatitude != null && listingLongitude != null) {
        const listingCoords: Coordinates = {
          latitude: listingLatitude,
          longitude: listingLongitude,
        };
        distanceMiles = calculateDistanceMiles(userCoords, listingCoords);
      }

      const distanceLabel =
        distanceMiles != null
          ? `${distanceMiles.toFixed(1)} miles`
          : "Distance unavailable";

      const cats = categoriesMap[r.id] || [];
      const primaryCategory = cats.length > 0 ? cats[0] : (r.category || "General");
      return {
        id: r.id,
        name: r.name,
        price: formatPrice(r.price_cents),
        rating: r.rating ? Number(r.rating) : null,
        images: [],
        image: r.image_url,
        host: r.host,
        type: primaryCategory,
        categories: cats.length > 0 ? cats : (r.category ? [r.category] : []),
        distance: distanceLabel,
        distanceMiles,
        latitude: listingLatitude,
        longitude: listingLongitude,
        description: r.description ?? null,
        zipCode: normalizedZip,
        createdAt: r.created_at,
        rentalPeriod:
          r.rental_period && typeof r.rental_period === "string"
            ? normalizeRentalPeriod(r.rental_period)
            : DEFAULT_RENTAL_PERIOD,
        delivery: Boolean(r.delivery),
        freeDelivery: Boolean(r.free_delivery),
        enabled: typeof r.enabled === "boolean" ? r.enabled : true,
      };
    });
    console.log("[listListings] Returning", listings.length, "listings");
    console.log(
      "[listListings] Rental periods:",
      listings.map((l: any) => `${l.id}:${l.rentalPeriod}`).join(", "),
    );
    res.json({ ok: true, listings });
  } catch (error: any) {
    console.error("[listListings] Error:", error);
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
      description,
      categories,
      rental_period,
      zip_code,
      location_city,
      latitude,
      longitude,
      delivery,
      free_delivery,
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
    const deliveryValue = Boolean(delivery);
    const freeDeliveryValue = Boolean(free_delivery) && deliveryValue;
    const lat = parseCoordinate(latitude);
    const lon = parseCoordinate(longitude);

    let result;
    try {
      result = await pool.query(
        `insert into listings (name, price_cents, rating, image_url, host, category, rental_period, description, zip_code, location_city, latitude, longitude, delivery, free_delivery)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
         returning id`,
        [
          name,
          price_cents,
          rating ?? null,
          primaryImage,
          host ?? null,
          primaryCategory,
          rentalPeriodValue,
          description ?? null,
          zip,
          location_city ?? null,
          lat,
          lon,
          deliveryValue,
          freeDeliveryValue,
        ],
      );
    } catch {
      result = await pool.query(
        `insert into listings (name, price_cents, rating, image_url, host, category, description, zip_code, location_city, latitude, longitude, delivery, free_delivery)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
         returning id`,
        [
          name,
          price_cents,
          rating ?? null,
          primaryImage,
          host ?? null,
          primaryCategory,
          description ?? null,
          zip,
          location_city ?? null,
          lat,
          lon,
          deliveryValue,
          freeDeliveryValue,
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
    const userCoords = extractUserCoordinates(req);
    let result: any;
    try {
      result = await pool.query(
        `select id, name, price_cents, rating, image_url, host, category, description, zip_code, created_at, rental_period, latitude, longitude,
                coalesce(delivery, false) as delivery, coalesce(free_delivery, false) as free_delivery, coalesce(enabled, true) as enabled
         from listings where id = $1`,
        [id],
      );
    } catch (e) {
      return res
        .status(500)
        .json({ ok: false, error: String(e?.message || e) });
    }
    if (result.rowCount === 0)
      return res.status(404).json({ ok: false, error: "not found" });
    const r: any = result.rows[0];
    const normalizedZip = normalizeZipCode(r.zip_code);

    let distanceMiles: number | null = null;
    const listingLatitude = typeof r.latitude === "number" ? r.latitude : null;
    const listingLongitude =
      typeof r.longitude === "number" ? r.longitude : null;

    if (userCoords && listingLatitude != null && listingLongitude != null) {
      const listingCoords: Coordinates = {
        latitude: listingLatitude,
        longitude: listingLongitude,
      };
      distanceMiles = calculateDistanceMiles(userCoords, listingCoords);
    }

    const distanceLabel =
      distanceMiles != null
        ? `${distanceMiles.toFixed(1)} miles`
        : "Distance unavailable";

    let images: string[] = [];
    try {
      const imagesResult = await pool.query(
        `select url from listing_images where listing_id = $1 order by position asc`,
        [id],
      );
      if (imagesResult.rows && Array.isArray(imagesResult.rows)) {
        images = imagesResult.rows
          .map((row: any) => row.url)
          .filter((url: any) => typeof url === "string" && url.trim());
      }
    } catch {
      // If listing_images table doesn't exist or query fails, continue with empty images
    }

    let categories: string[] = [];
    try {
      const categoriesResult = await pool.query(
        `select category from listing_categories where listing_id = $1 order by position asc`,
        [id],
      );
      if (categoriesResult.rows && Array.isArray(categoriesResult.rows)) {
        categories = categoriesResult.rows
          .map((row: any) => row.category)
          .filter((cat: any) => typeof cat === "string" && cat.trim());
      }
    } catch {
      // If listing_categories table doesn't exist or query fails, use primary category
      if (r.category) {
        categories = [r.category];
      }
    }

    const listing = {
      id: r.id,
      name: r.name,
      price: formatPrice(r.price_cents),
      rating: r.rating ? Number(r.rating) : null,
      images,
      image: r.image_url,
      host: r.host,
      type: categories[0] || "General",
      categories: categories && categories.length > 0 ? categories : [],
      distance: distanceLabel,
      distanceMiles,
      latitude: listingLatitude,
      longitude: listingLongitude,
      location_city: r.location_city || null,
      description: r.description ?? null,
      zipCode: normalizedZip,
      createdAt: r.created_at,
      rentalPeriod:
        r.rental_period && typeof r.rental_period === "string"
          ? normalizeRentalPeriod(r.rental_period)
          : DEFAULT_RENTAL_PERIOD,
      delivery: Boolean(r.delivery),
      freeDelivery: Boolean(r.free_delivery),
      enabled: typeof r.enabled === "boolean" ? r.enabled : true,
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

export async function updateListing(req: Request, res: Response) {
  try {
    const id = Number((req.params as any)?.id);
    if (!id || Number.isNaN(id)) {
      return res.status(400).json({ ok: false, error: "invalid id" });
    }

    const {
      name,
      price_cents,
      description,
      category,
      categories,
      image,
      images,
      rental_period,
      zip_code,
      location_city,
      latitude,
      longitude,
      delivery,
      free_delivery,
    } = req.body || {};

    if (!name || typeof price_cents !== "number") {
      return res
        .status(400)
        .json({ ok: false, error: "name and price_cents are required" });
    }

    const normalizedRentalPeriod = normalizeRentalPeriod(rental_period);
    const normalizedZip = normalizeZipCode(zip_code);
    const imgs: string[] = Array.isArray(images)
      ? (images as any[]).filter((u) => typeof u === "string" && u.trim())
      : image
        ? [image]
        : [];
    const primaryImage = imgs[0] ?? null;
    const lat = parseCoordinate(latitude);
    const lon = parseCoordinate(longitude);

    const result = await pool.query(
      `update listings
       set name = $1, price_cents = $2, description = $3, category = $4,
           image_url = $5, rental_period = $6, zip_code = $7,
           location_city = $8, latitude = $9, longitude = $10,
           delivery = $11, free_delivery = $12
       where id = $13
       returning id`,
      [
        name,
        price_cents,
        description || null,
        category || "Miscellaneous",
        primaryImage || null,
        normalizedRentalPeriod,
        normalizedZip || null,
        location_city || null,
        lat,
        lon,
        delivery || false,
        free_delivery || false,
        id,
      ],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ ok: false, error: "Listing not found" });
    }

    const listingId = result.rows[0].id;

    // Update images in listing_images table
    if (imgs.length > 0) {
      try {
        // Delete existing images
        await pool.query(`delete from listing_images where listing_id = $1`, [
          listingId,
        ]);
        // Insert new images
        for (let i = 0; i < imgs.length; i++) {
          const url = imgs[i];
          await pool.query(
            `insert into listing_images (listing_id, url, position) values ($1,$2,$3)
             on conflict do nothing`,
            [listingId, url, i + 1],
          );
        }
      } catch {}
    }

    // Update categories in listing_categories table
    const cats: string[] = Array.isArray(categories)
      ? (categories as any[]).filter((c) => typeof c === "string" && c.trim())
      : category
        ? [category]
        : [];

    if (cats.length > 0) {
      try {
        // Delete existing categories
        await pool.query(
          `delete from listing_categories where listing_id = $1`,
          [listingId],
        );
        // Insert new categories
        for (let i = 0; i < cats.length; i++) {
          const cat = cats[i];
          await pool.query(
            `insert into listing_categories (listing_id, category, position) values ($1,$2,$3)
             on conflict do nothing`,
            [listingId, cat, i + 1],
          );
        }
      } catch {}
    }

    res.json({ ok: true, id: listingId });
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
    try {
      await pool.query("delete from listing_images where listing_id = $1", [
        id,
      ]);
    } catch {}
    const result = await pool.query("delete from listings where id = $1", [id]);
    res.json({ ok: true, deleted: result.rowCount || 0 });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: String(error?.message || error) });
  }
}

export async function toggleListingEnabled(req: Request, res: Response) {
  try {
    const id = Number((req.params as any)?.id);
    console.log("[toggleListingEnabled] ID:", id, "Body:", req.body);
    if (!id || Number.isNaN(id)) {
      return res.status(400).json({ ok: false, error: "invalid id" });
    }
    const { enabled } = req.body || {};
    console.log(
      "[toggleListingEnabled] Extracted enabled:",
      enabled,
      "type:",
      typeof enabled,
    );
    if (typeof enabled !== "boolean") {
      return res
        .status(400)
        .json({ ok: false, error: "enabled must be a boolean" });
    }
    console.log(
      "[toggleListingEnabled] Updating listing",
      id,
      "to enabled =",
      enabled,
    );
    const result = await pool.query(
      `update listings set enabled = $1 where id = $2 returning id, enabled`,
      [enabled, id],
    );
    console.log(
      "[toggleListingEnabled] Update result:",
      result.rowCount,
      result.rows,
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ ok: false, error: "Listing not found" });
    }
    res.json({
      ok: true,
      id: result.rows[0].id,
      enabled: result.rows[0].enabled,
    });
  } catch (error: any) {
    console.error("[toggleListingEnabled] Error:", error);
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
