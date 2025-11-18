import type { Request, Response } from "express";
import { pool } from "./db";
import type { Coordinates } from "../lib/geo";
import {
  calculateDistanceMiles,
  getZipCoordinates,
  normalizeZipCode,
} from "../lib/geo";


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
    const userIdParam = query.user_id;
    const filterUserId =
      typeof userIdParam === "string"
        ? Number.parseInt(userIdParam, 10)
        : typeof userIdParam === "number"
          ? userIdParam
          : null;

    let result: any;
    try {
      let sql = `select l.id, l.name, l.price_cents, l.rating, l.image_url, l.host, l.category, l.description, l.zip_code, l.created_at, l.latitude, l.longitude, l.user_id,
                coalesce(l.delivery, false) as delivery, coalesce(l.free_delivery, false) as free_delivery, coalesce(l.enabled, true) as enabled, coalesce(l.instant_bookings, false) as instant_bookings,
                round(coalesce(avg(lr.rating)::numeric, 0), 1) as avg_review_rating,
                count(lr.id)::int as review_count,
                coalesce(u.open_dms, true) as host_open_dms,
                u.created_at as host_created_at,
                u.username as host_username
         from listings l
         left join listing_reviews lr on l.id = lr.listing_id
         left join users u on l.user_id = u.id`;

      const params: any[] = [];
      let paramIndex = 1;
      const conditions: string[] = [];

      if (filterEnabled !== null) {
        console.log("[listListings] Filtering enabled =", filterEnabled);
        conditions.push(`coalesce(l.enabled, true) = $${paramIndex}`);
        params.push(filterEnabled);
        paramIndex++;
      }

      if (Number.isFinite(filterUserId) && filterUserId !== null) {
        console.log("[listListings] Filtering user_id =", filterUserId);
        conditions.push(`l.user_id = $${paramIndex}`);
        params.push(filterUserId);
        paramIndex++;
      }

      if (conditions.length > 0) {
        sql += ` where ${conditions.join(" and ")}`;
      }

      sql += ` group by l.id, l.name, l.price_cents, l.rating, l.image_url, l.host, l.category, l.description, l.zip_code, l.created_at, l.latitude, l.longitude, l.user_id, l.delivery, l.free_delivery, l.enabled, l.instant_bookings, u.open_dms, u.created_at, u.username
               order by l.created_at desc limit 50`;

      console.log("[listListings] Executing SQL:", sql, "Params:", params);

      // Use timeout on the query itself
      const queryPromise = pool.query(sql, params);
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error("Query timeout after 10 seconds")),
          10000,
        ),
      );
      result = await Promise.race([queryPromise, timeoutPromise]);

      console.log("[listListings] Query succeeded, rows:", result.rows?.length);
      if (result.rows && result.rows.length > 0) {
        console.log(
          "[listListings] First row:",
          JSON.stringify(result.rows[0]),
        );
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
      const primaryCategory =
        cats.length > 0 ? cats[0] : r.category || "General";
      const formattedPrice = formatPrice(r.price_cents);
      const avgRating =
        r.avg_review_rating && Number(r.avg_review_rating) > 0
          ? Number(r.avg_review_rating)
          : null;
      const reviewCount = Number(r.review_count) || 0;

      const listing = {
        id: r.id,
        name: r.name,
        price: formattedPrice,
        rating: avgRating,
        reviews: reviewCount > 0 ? reviewCount : undefined,
        images: [],
        image: r.image_url,
        host: r.host,
        hostUserId: typeof r.user_id === "number" ? r.user_id : undefined,
        hostUsername:
          typeof r.host_username === "string" ? r.host_username : undefined,
        hostOpenDms: Boolean(r.host_open_dms),
        hostCreatedAt: r.host_created_at || null,
        type: primaryCategory,
        categories: cats.length > 0 ? cats : r.category ? [r.category] : [],
        distance: distanceLabel,
        distanceMiles,
        latitude: listingLatitude,
        longitude: listingLongitude,
        description: r.description ?? null,
        zipCode: normalizedZip,
        createdAt: r.created_at,
        delivery: Boolean(r.delivery),
        freeDelivery: Boolean(r.free_delivery),
        enabled: typeof r.enabled === "boolean" ? r.enabled : true,
        instantBookings: Boolean(r.instant_bookings),
      };
      if (r.id === 20) {
        console.log("[listListings] Listing 20:", JSON.stringify(listing));
      }
      return listing;
    });
    console.log("[listListings] Returning", listings.length, "listings");
    console.log(
      "[listListings] Response size (stringified):",
      JSON.stringify({ ok: true, listings }).length,
    );
    res.json({ ok: true, listings });
  } catch (error: any) {
    console.error("[listListings] Error:", error);
    res.status(500).json({ ok: false, error: String(error?.message || error) });
  }
}

export async function createListing(req: Request, res: Response) {
  try {
    console.log("[createListing] Request received");
    console.log(
      "[createListing] Request body:",
      JSON.stringify(req.body, null, 2),
    );

    const {
      name,
      price_cents,
      rating,
      image,
      images,
      host,
      user_id,
      type,
      description,
      categories,
      zip_code,
      location_city,
      latitude,
      longitude,
      delivery,
      free_delivery,
    } = req.body || {};

    console.log("[createListing] Extracted fields:", {
      name,
      price_cents,
      rating,
      image: image ? `<image ${image.length} chars>` : undefined,
      images: images ? `<${images.length} images>` : undefined,
      host,
      type,
      description: description ? `<${description.length} chars>` : undefined,
      categories,
      zip_code,
      location_city,
      latitude,
      longitude,
      delivery,
      free_delivery,
    });
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
    if (imgs.length === 0) {
      return res
        .status(400)
        .json({ ok: false, error: "at least one image is required" });
    }
    const primaryImage = imgs[0] ?? null;
    const cats: string[] = Array.isArray(categories)
      ? (categories as any[]).filter((c) => typeof c === "string" && c.trim())
      : typeof type === "string" && type.trim()
        ? [type]
        : [];
    const primaryCategory = cats[0] ?? null;
    const deliveryValue = Boolean(delivery);
    const freeDeliveryValue = Boolean(free_delivery) && deliveryValue;
    const lat = parseCoordinate(latitude);
    const lon = parseCoordinate(longitude);

    // Fetch user's first_name if user_id is provided
    let hostValue = host ?? null;
    if (typeof user_id === "number" && user_id > 0) {
      try {
        const userResult = await pool.query(
          `select first_name from users where id = $1`,
          [user_id],
        );
        if (userResult.rows && userResult.rows.length > 0) {
          const firstName = userResult.rows[0].first_name;
          if (firstName) {
            hostValue = firstName;
          }
        }
      } catch (e) {
        console.log("[createListing] Failed to fetch user first_name:", e);
      }
    }

    let result;
    try {
      result = await pool.query(
        `insert into listings (name, price_cents, rating, image_url, host, user_id, category, description, zip_code, location_city, latitude, longitude, delivery, free_delivery)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
         returning id`,
        [
          name,
          price_cents,
          rating ?? null,
          primaryImage,
          host ?? null,
          typeof user_id === "number" ? user_id : null,
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
    } catch (e) {
      console.log(
        "[createListing] Primary insert failed, trying without rental_period:",
        e,
      );
      result = await pool.query(
        `insert into listings (name, price_cents, rating, image_url, host, user_id, category, description, zip_code, location_city, latitude, longitude, delivery, free_delivery)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
         returning id`,
        [
          name,
          price_cents,
          rating ?? null,
          primaryImage,
          host ?? null,
          typeof user_id === "number" ? user_id : null,
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
    console.log(
      "[createListing] Successfully created listing with ID:",
      result.rows[0].id,
    );
    res.json({ ok: true, id: result.rows[0].id });
  } catch (error: any) {
    console.error("[createListing] Error occurred:", error);
    console.error("[createListing] Error stack:", error?.stack);
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
        `select l.id, l.name, l.price_cents, l.rating, l.image_url, l.host, l.category, l.description, l.zip_code, l.created_at, l.latitude, l.longitude, l.user_id,
                coalesce(l.delivery, false) as delivery, coalesce(l.free_delivery, false) as free_delivery, coalesce(l.enabled, true) as enabled, coalesce(l.instant_bookings, false) as instant_bookings,
                round(coalesce(avg(lr.rating)::numeric, 0), 1) as avg_review_rating,
                count(lr.id)::int as review_count,
                coalesce(u.open_dms, true) as host_open_dms,
                u.created_at as host_created_at,
                u.username as host_username,
                u.avatar_url as host_avatar_url,
                round(coalesce(avg(all_lr.rating)::numeric, 0), 1) as host_avg_rating,
                count(distinct all_lr.id)::int as host_total_reviews
         from listings l
         left join listing_reviews lr on l.id = lr.listing_id
         left join users u on l.user_id = u.id
         left join listings all_listings on u.id = all_listings.user_id
         left join listing_reviews all_lr on all_listings.id = all_lr.listing_id
         where l.id = $1
         group by l.id, l.name, l.price_cents, l.rating, l.image_url, l.host, l.category, l.description, l.zip_code, l.created_at, l.rental_period, l.latitude, l.longitude, l.delivery, l.free_delivery, l.enabled, l.instant_bookings, u.open_dms, u.created_at, u.username, u.avatar_url, l.user_id`,
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

    const avgRating =
      r.avg_review_rating && Number(r.avg_review_rating) > 0
        ? Number(r.avg_review_rating)
        : null;
    const reviewCount = Number(r.review_count) || 0;

    const hostAvgRating =
      r.host_avg_rating && Number(r.host_avg_rating) > 0
        ? Number(r.host_avg_rating)
        : null;
    const hostTotalReviews = Number(r.host_total_reviews) || 0;

    const listing = {
      id: r.id,
      name: r.name,
      price: formatPrice(r.price_cents),
      rating: avgRating,
      reviews: reviewCount > 0 ? reviewCount : undefined,
      images,
      image: r.image_url,
      host: r.host,
      hostUserId: typeof r.user_id === "number" ? r.user_id : null,
      hostUsername:
        typeof r.host_username === "string" ? r.host_username : undefined,
      hostAvatarUrl:
        typeof r.host_avatar_url === "string" ? r.host_avatar_url : null,
      hostRating: hostAvgRating,
      hostTotalReviews: hostTotalReviews,
      hostOpenDms: Boolean(r.host_open_dms),
      hostCreatedAt: r.host_created_at || null,
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
      instantBookings: Boolean(r.instant_bookings),
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
      `select r.id, r.start_date, r.end_date, r.renter_id, r.status, u.first_name, u.last_name from reservations r left join users u on r.renter_id = u.id where r.listing_id = $1 order by r.start_date asc limit 500`,
      [id],
    );
    const reservations = result.rows.map((r: any) => {
      const renterName =
        r.first_name && r.last_name
          ? `${r.first_name} ${r.last_name}`
          : undefined;
      return {
        id: String(r.id),
        startDate: new Date(r.start_date).toISOString(),
        endDate: new Date(r.end_date).toISOString(),
        renterName: renterName,
        status: String(r.status || "confirmed") as any,
      };
    });
    res.json({ ok: true, reservations });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: String(error?.message || error) });
  }
}

export async function bulkUpdateListingsEnabled(req: Request, res: Response) {
  try {
    const { user_id, enabled } = req.body || {};

    if (typeof user_id !== "number" || Number.isNaN(user_id)) {
      return res.status(400).json({ ok: false, error: "invalid user_id" });
    }

    if (typeof enabled !== "boolean") {
      return res
        .status(400)
        .json({ ok: false, error: "enabled must be a boolean" });
    }

    console.log(
      "[bulkUpdateListingsEnabled] Updating listings for user",
      user_id,
      "to enabled =",
      enabled,
    );

    const result = await pool.query(
      `update listings set enabled = $1 where user_id = $2 returning id`,
      [enabled, user_id],
    );

    console.log(
      "[bulkUpdateListingsEnabled] Updated",
      result.rowCount,
      "listings",
    );

    res.json({
      ok: true,
      updated: result.rowCount || 0,
      ids: result.rows.map((r: any) => r.id),
    });
  } catch (error: any) {
    console.error("[bulkUpdateListingsEnabled] Error:", error);
    res.status(500).json({ ok: false, error: String(error?.message || error) });
  }
}

export async function createReservation(req: Request, res: Response) {
  try {
    const { listing_id, renter_id, start_date, end_date } = req.body || {};

    if (!listing_id || Number.isNaN(Number(listing_id))) {
      return res.status(400).json({ ok: false, error: "invalid listing_id" });
    }

    if (!renter_id || Number.isNaN(Number(renter_id))) {
      return res.status(400).json({ ok: false, error: "invalid renter_id" });
    }

    if (!start_date || !end_date) {
      return res
        .status(400)
        .json({ ok: false, error: "start_date and end_date are required" });
    }

    const startDate = new Date(start_date);
    const endDate = new Date(end_date);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({ ok: false, error: "invalid date format" });
    }

    if (startDate >= endDate) {
      return res
        .status(400)
        .json({ ok: false, error: "start_date must be before end_date" });
    }

    console.log(
      "[createReservation] Creating reservation for listing",
      listing_id,
      "renter",
      renter_id,
      "dates",
      start_date,
      "to",
      end_date,
    );

    // Check for conflicting reservations (pending or accepted status)
    const conflictCheck = await pool.query(
      `select id from reservations
       where listing_id = $1
       and status in ('pending', 'accepted')
       and (
         (start_date::date <= $3::date and end_date::date >= $2::date)
       )
       limit 1`,
      [listing_id, start_date, end_date],
    );

    if (conflictCheck.rows.length > 0) {
      console.log(
        "[createReservation] Conflict detected with existing reservation",
      );
      return res.status(409).json({
        ok: false,
        error: "Date range conflicts with existing reservation",
      });
    }

    // Create the reservation
    const result = await pool.query(
      `insert into reservations (listing_id, renter_id, start_date, end_date, status, created_at)
       values ($1, $2, $3::date, $4::date, 'pending', now())
       returning id, listing_id, renter_id, start_date, end_date, status, created_at`,
      [listing_id, renter_id, start_date, end_date],
    );

    const reservation = result.rows[0];

    console.log(
      "[createReservation] Reservation created with id",
      reservation.id,
    );

    res.json({
      ok: true,
      reservation: {
        id: String(reservation.id),
        listing_id: reservation.listing_id,
        renter_id: reservation.renter_id,
        start_date: new Date(reservation.start_date).toISOString(),
        end_date: new Date(reservation.end_date).toISOString(),
        status: reservation.status,
        created_at: reservation.created_at,
      },
    });
  } catch (error: any) {
    console.error("[createReservation] Error:", error);
    res.status(500).json({ ok: false, error: String(error?.message || error) });
  }
}
