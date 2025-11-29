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
  const dollars = price_cents / 100;
  const formatted = dollars.toLocaleString("en-US", {
    minimumFractionDigits: dollars % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
  return `$${formatted}`;
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
    const userIdParam = query.host_id;
    const filterUserId =
      typeof userIdParam === "string"
        ? Number.parseInt(userIdParam, 10)
        : typeof userIdParam === "number"
          ? userIdParam
          : null;

    let result: any;
    try {
      let sql = `select l.id, l.name, l.price_cents, l.rating, l.image_url, l.host, l.category, l.description, l.zip_code, l.created_at, l.latitude, l.longitude, l.host_id,
                coalesce(l.delivery, false) as delivery, coalesce(l.free_delivery, false) as free_delivery, coalesce(l.enabled, true) as enabled, coalesce(l.instant_bookings, false) as instant_bookings,
                round(coalesce(avg(lr.rating)::numeric, 0), 1) as avg_review_rating,
                count(lr.id)::int as review_count,
                coalesce(u.open_dms, true) as host_open_dms,
                u.created_at as host_created_at,
                u.username as host_username
         from listings l
         left join listing_reviews lr on l.id = lr.listing_id
         left join users u on l.host_id = u.id`;

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
        console.log("[listListings] Filtering host_id =", filterUserId);
        conditions.push(`l.host_id = $${paramIndex}`);
        params.push(filterUserId);
        paramIndex++;
      }

      if (conditions.length > 0) {
        sql += ` where ${conditions.join(" and ")}`;
      }

      sql += ` group by l.id, l.name, l.price_cents, l.rating, l.image_url, l.host, l.category, l.description, l.zip_code, l.created_at, l.latitude, l.longitude, l.host_id, l.delivery, l.free_delivery, l.enabled, l.instant_bookings, u.open_dms, u.created_at, u.username
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
        hostUserId: typeof r.host_id === "number" ? r.host_id : undefined,
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

    // Check authorization: user can only create listings for themselves
    const userId = (req as any).session?.userId;

    const {
      name,
      price_cents,
      rating,
      image,
      images,
      host,
      host_id,
      type,
      description,
      categories,
      zip_code,
      location_city,
      latitude,
      longitude,
      delivery,
      free_delivery,
      instant_bookings,
      addons,
    } = req.body || {};

    // Verify that if host_id is provided, it matches the authenticated user
    if (
      host_id &&
      typeof host_id === "number" &&
      userId &&
      host_id !== userId
    ) {
      return res.status(403).json({
        ok: false,
        error: "You can only create listings for yourself",
      });
    }

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
    const instantBookingsValue = Boolean(instant_bookings);
    const lat = parseCoordinate(latitude);
    const lon = parseCoordinate(longitude);

    // Fetch user's first_name if host_id is provided
    let hostValue = host ?? null;
    if (typeof host_id === "number" && host_id > 0) {
      try {
        const userResult = await pool.query(
          `select first_name from users where id = $1`,
          [host_id],
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
        `insert into listings (name, price_cents, rating, image_url, host, host_id, category, description, zip_code, location_city, latitude, longitude, delivery, free_delivery, instant_bookings)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
         returning id`,
        [
          name,
          price_cents,
          rating ?? null,
          primaryImage,
          host ?? null,
          typeof host_id === "number" ? host_id : null,
          primaryCategory,
          description ?? null,
          zip,
          location_city ?? null,
          lat,
          lon,
          deliveryValue,
          freeDeliveryValue,
          instantBookingsValue,
        ],
      );
    } catch (e) {
      console.log("[createListing] Primary insert failed:", e);
      result = await pool.query(
        `insert into listings (name, price_cents, rating, image_url, host, host_id, category, description, zip_code, location_city, latitude, longitude, delivery, free_delivery, instant_bookings)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
         returning id`,
        [
          name,
          price_cents,
          rating ?? null,
          primaryImage,
          host ?? null,
          typeof host_id === "number" ? host_id : null,
          primaryCategory,
          description ?? null,
          zip,
          location_city ?? null,
          lat,
          lon,
          deliveryValue,
          freeDeliveryValue,
          instantBookingsValue,
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
    if (Array.isArray(addons) && addons.length > 0) {
      try {
        for (const addon of addons) {
          const item = typeof addon.item === "string" ? addon.item.trim() : "";
          if (item === "") {
            continue;
          }
          const style =
            typeof addon.style === "string" && addon.style.trim()
              ? addon.style.trim()
              : null;
          const priceInCents =
            typeof addon.price === "number" && addon.price >= 0
              ? Math.round(addon.price * 100)
              : null;
          const consumable = addon.consumable === true;
          await pool.query(
            `insert into listing_addons (listing_id, item, style, price, consumable) values ($1,$2,$3,$4,$5)`,
            [newId, item, style, priceInCents, consumable],
          );
        }
      } catch (e) {
        console.log("[createListing] Error inserting addons:", e);
      }
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
        `select l.id, l.name, l.price_cents, l.rating, l.image_url, l.host, l.category, l.description, l.zip_code, l.created_at, l.latitude, l.longitude, l.host_id,
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
         left join users u on l.host_id = u.id
         left join listings all_listings on u.id = all_listings.host_id
         left join listing_reviews all_lr on all_listings.id = all_lr.listing_id
         where l.id = $1
         group by l.id, l.name, l.price_cents, l.rating, l.image_url, l.host, l.category, l.description, l.zip_code, l.created_at, l.latitude, l.longitude, l.delivery, l.free_delivery, l.enabled, l.instant_bookings, u.open_dms, u.created_at, u.username, u.avatar_url, l.host_id`,
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

    let addons: Array<{
      id: number;
      item: string;
      style: string | null;
      price: number | null;
      consumable: boolean;
    }> = [];
    try {
      const addonsResult = await pool.query(
        `select id, item, style, price, consumable from listing_addons where listing_id = $1 order by created_at asc`,
        [id],
      );
      if (addonsResult.rows && Array.isArray(addonsResult.rows)) {
        addons = addonsResult.rows.map((row: any) => {
          const addonPrice =
            row.price !== null && row.price !== undefined
              ? row.price / 100
              : null;
          return {
            id: row.id,
            item: row.item,
            style: row.style || null,
            price: isNaN(addonPrice) ? null : addonPrice,
            consumable: Boolean(row.consumable),
          };
        });
      }
    } catch {
      // If listing_addons table doesn't exist or query fails, continue with empty addons
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
      hostUserId: typeof r.host_id === "number" ? r.host_id : null,
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
      delivery: Boolean(r.delivery),
      freeDelivery: Boolean(r.free_delivery),
      enabled: typeof r.enabled === "boolean" ? r.enabled : true,
      instantBookings: Boolean(r.instant_bookings),
      addons: addons.length > 0 ? addons : [],
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

    // Check authorization: user can only update their own listings
    const userId = (req as any).session?.userId;
    if (!userId) {
      return res.status(401).json({ ok: false, error: "Not authenticated" });
    }

    // Fetch the listing to verify ownership
    const listingCheckResult = await pool.query(
      `select host_id from listings where id = $1`,
      [id],
    );

    if (listingCheckResult.rows.length === 0) {
      return res.status(404).json({ ok: false, error: "Listing not found" });
    }

    const listingHostId = listingCheckResult.rows[0].host_id;
    if (listingHostId !== userId) {
      return res
        .status(403)
        .json({ ok: false, error: "You can only edit your own listings" });
    }

    const {
      name,
      price_cents,
      description,
      category,
      categories,
      image,
      images,
      zip_code,
      location_city,
      latitude,
      longitude,
      delivery,
      free_delivery,
      instant_bookings,
      addons,
    } = req.body || {};

    if (!name || typeof price_cents !== "number") {
      return res
        .status(400)
        .json({ ok: false, error: "name and price_cents are required" });
    }

    const normalizedZip = normalizeZipCode(zip_code);
    const imgs: string[] = Array.isArray(images)
      ? (images as any[]).filter((u) => typeof u === "string" && u.trim())
      : image
        ? [image]
        : [];
    const primaryImage = imgs[0] ?? null;
    const lat = parseCoordinate(latitude);
    const lon = parseCoordinate(longitude);
    const instantBookingsValue = Boolean(instant_bookings);

    const result = await pool.query(
      `update listings
       set name = $1, price_cents = $2, description = $3, category = $4,
           image_url = $5, zip_code = $6,
           location_city = $7, latitude = $8, longitude = $9,
           delivery = $10, free_delivery = $11, instant_bookings = $12
       where id = $13
       returning id`,
      [
        name,
        price_cents,
        description || null,
        category || "Miscellaneous",
        primaryImage || null,
        normalizedZip || null,
        location_city || null,
        lat,
        lon,
        delivery || false,
        free_delivery || false,
        instantBookingsValue,
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
        // When updating a listing with new categories, delete the "General" default category
        await pool.query(
          `delete from listing_categories where listing_id = $1 and category = 'General'`,
          [listingId],
        );
      } catch {}
    }

    // Update addons in listing_addons table
    if (Array.isArray(addons)) {
      try {
        // Get existing addon IDs from the database
        const existingAddonsResult = await pool.query(
          `select id from listing_addons where listing_id = $1`,
          [listingId],
        );
        const existingAddonIds = new Set(
          existingAddonsResult.rows.map((row: any) => row.id),
        );

        // Find addon IDs that are being kept (those in the new addons array)
        const newAddonIds = new Set<number>();
        const addonsToInsert: Array<{
          item: string;
          style: string | null;
          price: number | null;
          consumable: boolean;
        }> = [];

        for (const addon of addons) {
          const item = typeof addon.item === "string" ? addon.item.trim() : "";
          if (item === "") {
            continue;
          }
          const style =
            typeof addon.style === "string" && addon.style.trim()
              ? addon.style.trim()
              : null;
          const priceInCents =
            typeof addon.price === "number" && addon.price >= 0
              ? Math.round(addon.price * 100)
              : null;
          const consumable = addon.consumable === true;

          // If addon has an ID, it's an existing addon to be updated
          if (typeof addon.id === "number" && addon.id > 0) {
            newAddonIds.add(addon.id);
            await pool.query(
              `update listing_addons set item = $1, style = $2, price = $3, consumable = $4 where id = $5 and listing_id = $6`,
              [item, style, priceInCents, consumable, addon.id, listingId],
            );
          } else {
            // New addon to be inserted
            addonsToInsert.push({
              item,
              style,
              price: priceInCents,
              consumable,
            });
          }
        }

        // Delete addons that are no longer in the list
        for (const addonId of existingAddonIds) {
          if (!newAddonIds.has(addonId as number)) {
            await pool.query(
              `delete from listing_addons where id = $1 and listing_id = $2`,
              [addonId, listingId],
            );
          }
        }

        // Insert new addons
        for (const addon of addonsToInsert) {
          await pool.query(
            `insert into listing_addons (listing_id, item, style, price, consumable) values ($1,$2,$3,$4,$5)`,
            [listingId, addon.item, addon.style, addon.price, addon.consumable],
          );
        }
      } catch (e) {
        console.error("[updateListing] Error updating addons:", e);
      }
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

    // Check authorization: user can only delete their own listings
    const userId = (req as any).session?.userId;
    if (!userId) {
      return res.status(401).json({ ok: false, error: "Not authenticated" });
    }

    // Fetch the listing to verify ownership
    const listingCheckResult = await pool.query(
      `select host_id from listings where id = $1`,
      [id],
    );

    if (listingCheckResult.rows.length === 0) {
      return res.status(404).json({ ok: false, error: "Listing not found" });
    }

    const listingHostId = listingCheckResult.rows[0].host_id;
    if (listingHostId !== userId) {
      return res
        .status(403)
        .json({ ok: false, error: "You can only delete your own listings" });
    }

    // Delete S3 folder/prefix for this listing
    try {
      const { deleteS3Prefix } = await import("../lib/s3");
      const s3Prefix = `listings/${id}/`;
      console.log("[deleteListing] Deleting S3 prefix:", s3Prefix);
      await deleteS3Prefix(s3Prefix);
    } catch (error) {
      console.warn(
        "[deleteListing] Warning: Failed to delete S3 objects:",
        error,
      );
      // Continue with database deletion even if S3 deletion fails
    }

    // Delete listing images from database
    try {
      await pool.query("delete from listing_images where listing_id = $1", [
        id,
      ]);
    } catch {}

    // Delete listing addons from database
    try {
      await pool.query("delete from listing_addons where listing_id = $1", [
        id,
      ]);
    } catch {}

    // Delete listing categories from database
    try {
      await pool.query("delete from listing_categories where listing_id = $1", [
        id,
      ]);
    } catch {}

    // Delete the listing from database
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

    // Check authorization: user can only toggle their own listings
    const userId = (req as any).session?.userId;
    if (!userId) {
      return res.status(401).json({ ok: false, error: "Not authenticated" });
    }

    // Fetch the listing to verify ownership
    const listingCheckResult = await pool.query(
      `select host_id from listings where id = $1`,
      [id],
    );

    if (listingCheckResult.rows.length === 0) {
      return res.status(404).json({ ok: false, error: "Listing not found" });
    }

    const listingHostId = listingCheckResult.rows[0].host_id;
    if (listingHostId !== userId) {
      return res
        .status(403)
        .json({ ok: false, error: "You can only toggle your own listings" });
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
    const { host_id, enabled } = req.body || {};

    if (typeof host_id !== "number" || Number.isNaN(host_id)) {
      return res.status(400).json({ ok: false, error: "invalid host_id" });
    }

    if (typeof enabled !== "boolean") {
      return res
        .status(400)
        .json({ ok: false, error: "enabled must be a boolean" });
    }

    console.log(
      "[bulkUpdateListingsEnabled] Updating listings for user",
      host_id,
      "to enabled =",
      enabled,
    );

    const result = await pool.query(
      `update listings set enabled = $1 where host_id = $2 returning id`,
      [enabled, host_id],
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

export async function getUserReservations(req: Request, res: Response) {
  try {
    console.log("[getUserReservations] Called with url:", req.url);
    console.log("[getUserReservations] Called with params:", req.params);
    const userId = Number((req.params as any)?.userId);
    console.log(
      "[getUserReservations] Parsed userId:",
      userId,
      "type:",
      typeof userId,
    );

    if (!userId || Number.isNaN(userId)) {
      console.log("[getUserReservations] Invalid userId, returning 400");
      return res.status(400).json({ ok: false, error: "invalid userId" });
    }

    console.log(
      "[getUserReservations] Querying reservations for user:",
      userId,
    );
    const result = await pool.query(
      `select id, listing_id, renter_id, host_id, host_name, renter_name,
              start_date, end_date, listing_title, listing_image,
              listing_latitude, listing_longitude, daily_price_cents, total_days,
              rental_type, status, consumable_addon_total, nonconsumable_addon_total, addons, created_at
       from reservations
       where renter_id = $1 or host_id = $1
       order by created_at desc
       limit 500`,
      [userId],
    );

    console.log(
      "[getUserReservations] Query returned",
      result.rows.length,
      "rows",
    );

    const reservations = result.rows.map((r: any) => ({
      id: String(r.id),
      listing_id: r.listing_id,
      renter_id: r.renter_id,
      host_id: r.host_id,
      host_name: r.host_name,
      renter_name: r.renter_name,
      start_date: new Date(r.start_date).toISOString(),
      end_date: new Date(r.end_date).toISOString(),
      listing_title: r.listing_title,
      listing_image: r.listing_image,
      listing_latitude: r.listing_latitude,
      listing_longitude: r.listing_longitude,
      daily_price_cents: r.daily_price_cents,
      total_days: r.total_days,
      rental_type: r.rental_type,
      status: r.status,
      consumable_addon_total: r.consumable_addon_total,
      nonconsumable_addon_total: r.nonconsumable_addon_total,
      addons: r.addons,
      created_at: r.created_at,
    }));

    console.log(
      "[getUserReservations] Returning",
      reservations.length,
      "reservations",
    );
    res.setHeader("Content-Type", "application/json");
    return res.json({ ok: true, reservations });
  } catch (error: any) {
    console.error(
      "[getUserReservations] Error caught:",
      error?.message || error,
      error?.stack,
    );
    res.setHeader("Content-Type", "application/json");
    return res
      .status(500)
      .json({ ok: false, error: String(error?.message || error) });
  }
}

export async function createReservation(req: Request, res: Response) {
  try {
    const {
      listing_id,
      renter_id,
      host_id,
      host_name,
      renter_name,
      start_date,
      end_date,
      listing_title,
      listing_image,
      listing_latitude,
      listing_longitude,
      daily_price_cents,
      total_days,
      rental_type,
      status,
      consumable_addon_total,
      nonconsumable_addon_total,
      addons,
    } = req.body || {};

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

    if (startDate > endDate) {
      return res.status(400).json({
        ok: false,
        error: "start_date must be before or equal to end_date",
      });
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
      `insert into reservations (
        listing_id, renter_id, host_id, host_name, renter_name,
        start_date, end_date, listing_title, listing_image,
        listing_latitude, listing_longitude, daily_price_cents, total_days,
        rental_type, status, consumable_addon_total, nonconsumable_addon_total, addons, created_at
       )
       values ($1, $2, $3, $4, $5, $6::date, $7::date, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, now())
       returning id, listing_id, renter_id, host_id, host_name, renter_name,
                 start_date, end_date, listing_title, listing_image,
                 listing_latitude, listing_longitude, daily_price_cents, total_days,
                 rental_type, status, consumable_addon_total, nonconsumable_addon_total, addons, created_at`,
      [
        listing_id,
        renter_id,
        host_id || null,
        host_name || null,
        renter_name || null,
        start_date,
        end_date,
        listing_title || null,
        listing_image || null,
        listing_latitude || null,
        listing_longitude || null,
        daily_price_cents || null,
        total_days || null,
        rental_type || "item",
        status || "pending",
        consumable_addon_total || 0,
        nonconsumable_addon_total || 0,
        addons || null,
      ],
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
        host_id: reservation.host_id,
        host_name: reservation.host_name,
        renter_name: reservation.renter_name,
        start_date: new Date(reservation.start_date).toISOString(),
        end_date: new Date(reservation.end_date).toISOString(),
        listing_title: reservation.listing_title,
        listing_image: reservation.listing_image,
        listing_latitude: reservation.listing_latitude,
        listing_longitude: reservation.listing_longitude,
        daily_price_cents: reservation.daily_price_cents,
        total_days: reservation.total_days,
        rental_type: reservation.rental_type,
        status: reservation.status,
        consumable_addon_total: reservation.consumable_addon_total,
        nonconsumable_addon_total: reservation.nonconsumable_addon_total,
        addons: reservation.addons,
        created_at: reservation.created_at,
      },
    });
  } catch (error: any) {
    console.error("[createReservation] Error:", error);
    res.status(500).json({ ok: false, error: String(error?.message || error) });
  }
}

export async function getPresignedUploadUrl(req: Request, res: Response) {
  try {
    const listingId = Number((req.params as any)?.listingId);
    if (!listingId || Number.isNaN(listingId)) {
      return res.status(400).json({ ok: false, error: "invalid listingId" });
    }

    const { filename, contentType, imageNumber } = req.body || {};

    if (!filename || typeof filename !== "string" || filename.trim() === "") {
      return res.status(400).json({ ok: false, error: "filename is required" });
    }

    if (!contentType || typeof contentType !== "string") {
      return res
        .status(400)
        .json({ ok: false, error: "contentType is required" });
    }

    if (typeof imageNumber !== "number" || imageNumber < 1) {
      return res.status(400).json({
        ok: false,
        error: "imageNumber is required and must be >= 1",
      });
    }

    // Validate that it's an image file
    if (!contentType.startsWith("image/")) {
      return res
        .status(400)
        .json({ ok: false, error: "Only image files are allowed" });
    }

    // Import S3 utilities
    const {
      generatePresignedUploadUrl,
      generateListingImageS3Key,
      generateListingImageWebpS3Key,
    } = await import("../lib/s3");

    // Extract file extension
    const fileExtension = filename.split(".").pop() || "jpg";

    // Generate S3 key with sequential numbering
    const s3Key = generateListingImageS3Key(
      listingId,
      imageNumber,
      fileExtension,
    );

    // Generate S3 key for WEBP version
    const s3WebpKey = generateListingImageWebpS3Key(listingId, imageNumber);

    // Generate presigned URLs for both original and WEBP versions
    const presignedUrl = await generatePresignedUploadUrl(s3Key, contentType);
    const presignedWebpUrl = await generatePresignedUploadUrl(
      s3WebpKey,
      "image/webp",
    );

    console.log("[getPresignedUploadUrl] Generated URLs successfully");
    console.log("[getPresignedUploadUrl] Original S3 key:", s3Key);
    console.log("[getPresignedUploadUrl] WEBP S3 key:", s3WebpKey);
    console.log(
      "[getPresignedUploadUrl] URL preview:",
      presignedUrl.substring(0, 200) + "...",
    );

    // Return both the presigned URLs and the S3 keys that will be used to store in the database
    const { getS3Url } = await import("../lib/s3");
    res.json({
      ok: true,
      presignedUrl,
      presignedWebpUrl,
      s3Key,
      s3WebpKey,
      s3Url: getS3Url(s3Key),
      s3WebpUrl: getS3Url(s3WebpKey),
    });
  } catch (error: any) {
    console.error("[getPresignedUploadUrl] Error:", error);
    res.status(500).json({ ok: false, error: String(error?.message || error) });
  }
}

export async function deleteImage(req: Request, res: Response) {
  try {
    const { imageUrl } = req.body || {};

    if (!imageUrl || typeof imageUrl !== "string") {
      return res.status(400).json({ ok: false, error: "imageUrl is required" });
    }

    // Import S3 utilities
    const { deleteS3Object, extractS3KeyFromUrl, isValidS3Url } = await import(
      "../lib/s3"
    );

    // Validate that it's an S3 URL
    if (!isValidS3Url(imageUrl)) {
      return res.status(400).json({ ok: false, error: "Invalid S3 URL" });
    }

    // Extract S3 key from the URL
    const s3Key = extractS3KeyFromUrl(imageUrl);
    if (!s3Key) {
      return res
        .status(400)
        .json({ ok: false, error: "Could not extract S3 key from URL" });
    }

    // Delete the object from S3
    await deleteS3Object(s3Key);

    res.json({ ok: true, message: "Image deleted successfully" });
  } catch (error: any) {
    console.error("[deleteImage] Error:", error);
    res.status(500).json({ ok: false, error: String(error?.message || error) });
  }
}
