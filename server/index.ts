import express from "express";
import cors from "cors";
import session from "express-session";
import { handleDemo } from "./routes/demo";
import { dbHealth, dbSchema, dbSetup } from "./routes/db";
import {
  listListings,
  createListing,
  updateListing,
  deleteListing,
  toggleListingEnabled,
  getListingById,
  listListingReviews,
  listListingReservations,
  bulkUpdateListingsEnabled,
} from "./routes/listings";
import {
  getUserByEmail,
  getUserById,
  getUserByUsername,
  upsertUser,
  emailSignup,
  emailLogin,
} from "./routes/users";
import { reverseGeocode } from "./routes/geocode";
import {
  listFavorites,
  addFavorite,
  removeFavorite,
  checkFavorite,
} from "./routes/favorites";
import {
  createListingReview,
  getListingReviews,
  updateListingReview,
  updateListingReviewHelpful,
  deleteListingReview,
} from "./routes/listing-reviews";

export function createServer() {
  const app = express();

  // Run database setup on startup (non-blocking)
  (async () => {
    try {
      const req = {} as any;
      const res = {
        json: (data: any) => {
          console.log("Database setup completed:", data);
        },
        status: (code: number) => ({
          json: (data: any) => {
            console.log(`Database setup error (${code}):`, data);
          },
        }),
      } as any;
      await dbSetup(req, res);
    } catch (error) {
      console.error("Database setup error:", error);
    }
  })();

  // Middleware
  app.use(
    cors({
      origin: true,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // Session middleware
  app.use(
    session({
      secret:
        process.env.SESSION_SECRET || "default-secret-key-change-in-production",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        sameSite: "lax",
        // No maxAge - cookie is session-only and cleared when browser closes
      },
    }),
  );

  // Update user open_dms setting
  app.patch("/api/auth/me/open-dms", async (req: any, res: any) => {
    try {
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ ok: false, error: "Not authenticated" });
      }

      const { openDms } = req.body || {};
      const openDmsValue = Boolean(openDms);

      const { pool } = await import("./routes/db");

      const userResult = await pool.query(
        `update users set open_dms = $1 where id = $2
         returning id, name, email, username, avatar_url, latitude, longitude, location_city, created_at,
                   coalesce(founding_supporter,false) as founding_supporter,
                   coalesce(top_referrer,false) as top_referrer,
                   coalesce(ambassador,false) as ambassador,
                   coalesce(open_dms,true) as open_dms`,
        [openDmsValue, req.session.userId],
      );

      if (!userResult.rowCount || userResult.rowCount === 0) {
        return res.status(401).json({ ok: false, error: "User not found" });
      }

      const row = userResult.rows[0];
      const user = {
        id: row.id,
        name: row.name || null,
        email: row.email || null,
        username: row.username || null,
        avatarUrl: row.avatar_url || null,
        zipCode: null,
        locationLatitude:
          typeof row.latitude === "number" ? row.latitude : null,
        locationLongitude:
          typeof row.longitude === "number" ? row.longitude : null,
        locationCity:
          typeof row.location_city === "string" ? row.location_city : null,
        createdAt: row.created_at,
        foundingSupporter: Boolean(row.founding_supporter),
        topReferrer: Boolean(row.top_referrer),
        ambassador: Boolean(row.ambassador),
        openDms: Boolean(row.open_dms),
      };

      req.session.user = user;

      return res.json({ ok: true, user });
    } catch (error: any) {
      console.error("Update open_dms error:", error);
      return res.status(500).json({
        ok: false,
        error: "Internal server error",
      });
    }
  });

  // Add alias route for open-dms update
  app.patch("/auth/me/open-dms", async (req: any, res: any) => {
    try {
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ ok: false, error: "Not authenticated" });
      }

      const { openDms } = req.body || {};
      const openDmsValue = Boolean(openDms);

      const { pool } = await import("./routes/db");

      const userResult = await pool.query(
        `update users set open_dms = $1 where id = $2
         returning id, name, email, username, avatar_url, latitude, longitude, location_city, created_at,
                   coalesce(founding_supporter,false) as founding_supporter,
                   coalesce(top_referrer,false) as top_referrer,
                   coalesce(ambassador,false) as ambassador,
                   coalesce(open_dms,true) as open_dms`,
        [openDmsValue, req.session.userId],
      );

      if (!userResult.rowCount || userResult.rowCount === 0) {
        return res.status(401).json({ ok: false, error: "User not found" });
      }

      const row = userResult.rows[0];
      const user = {
        id: row.id,
        name: row.name || null,
        email: row.email || null,
        username: row.username || null,
        avatarUrl: row.avatar_url || null,
        zipCode: null,
        locationLatitude:
          typeof row.latitude === "number" ? row.latitude : null,
        locationLongitude:
          typeof row.longitude === "number" ? row.longitude : null,
        locationCity:
          typeof row.location_city === "string" ? row.location_city : null,
        createdAt: row.created_at,
        foundingSupporter: Boolean(row.founding_supporter),
        topReferrer: Boolean(row.top_referrer),
        ambassador: Boolean(row.ambassador),
        openDms: Boolean(row.open_dms),
      };

      req.session.user = user;

      return res.json({ ok: true, user });
    } catch (error: any) {
      console.error("Update open_dms error:", error);
      return res.status(500).json({
        ok: false,
        error: "Internal server error",
      });
    }
  });

  // Get current authenticated user
  app.get("/api/auth/me", async (req: any, res: any) => {
    try {
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ ok: false, error: "Not authenticated" });
      }

      // Import pool to fetch latest user data
      const { pool } = await import("./routes/db");

      const userResult = await pool.query(
        `select id, name, email, username, avatar_url, latitude, longitude, location_city, created_at,
                coalesce(founding_supporter,false) as founding_supporter,
                coalesce(top_referrer,false) as top_referrer,
                coalesce(ambassador,false) as ambassador,
                coalesce(open_dms,true) as open_dms
         from users where id = $1`,
        [req.session.userId],
      );

      if (!userResult.rowCount || userResult.rowCount === 0) {
        return res.status(401).json({ ok: false, error: "User not found" });
      }

      const row = userResult.rows[0];
      const user = {
        id: row.id,
        name: row.name || null,
        email: row.email || null,
        username: row.username || null,
        avatarUrl: row.avatar_url || null,
        zipCode: null,
        locationLatitude:
          typeof row.latitude === "number" ? row.latitude : null,
        locationLongitude:
          typeof row.longitude === "number" ? row.longitude : null,
        locationCity:
          typeof row.location_city === "string" ? row.location_city : null,
        createdAt: row.created_at,
        foundingSupporter: Boolean(row.founding_supporter),
        topReferrer: Boolean(row.top_referrer),
        ambassador: Boolean(row.ambassador),
        openDms: Boolean(row.open_dms),
      };

      // Update the session with the latest user data
      req.session.user = user;

      return res.json({ ok: true, user });
    } catch (error: any) {
      console.error("Auth me error:", error);
      return res.status(500).json({
        ok: false,
        error: "Internal server error",
      });
    }
  });

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    res.json({ message: "Hello from Express server v2!" });
  });
  // Aliases without /api prefix to support serverless base paths like /.netlify/functions/api
  app.get("/ping", (_req, res) => {
    res.json({ message: "Hello from Express server v2!" });
  });

  // TEMPORARILY DISABLED - requireAuth removed while login wall is disabled
  // Re-add requireAuth middleware when login wall is re-enabled
  app.get("/api/demo", handleDemo);
  app.get("/demo", handleDemo);

  app.get("/api/db/health", dbHealth);
  app.get("/api/db/schema", dbSchema);
  app.post("/api/db/setup", dbSetup);
  app.get("/api/db/setup/run", dbSetup);
  app.post("/api/geocode/reverse", reverseGeocode);
  // Alias routes
  app.get("/db/health", dbHealth);
  app.get("/db/schema", dbSchema);
  app.post("/db/setup", dbSetup);
  app.get("/db/setup/run", dbSetup);
  app.post("/geocode/reverse", reverseGeocode);

  // Listings
  app.get("/api/listings", listListings);
  app.get("/api/listings/:id", getListingById);
  app.post("/api/listings", createListing);
  app.put("/api/listings/:id", updateListing);
  app.delete("/api/listings/:id", deleteListing);
  app.patch("/api/listings/:id/toggle-enabled", toggleListingEnabled);
  app.patch("/api/listings/bulk/update-enabled", bulkUpdateListingsEnabled);
  app.get("/api/listings/:id/reviews", listListingReviews);
  app.get("/api/listings/:id/reservations", listListingReservations);
  // Users
  app.get("/api/users", getUserByEmail); // query: email
  app.get("/api/users/:id", getUserById); // param: id
  app.get("/api/users/username/:username", getUserByUsername); // param: username
  app.post("/api/users", upsertUser);
  app.post("/api/users/signup", emailSignup);
  app.post("/api/users/login", emailLogin);
  // Favorites
  app.get("/api/favorites/:userId", listFavorites);
  app.post("/api/favorites", addFavorite);
  app.delete("/api/favorites/:userId/:listingId", removeFavorite);
  app.get("/api/favorites/:userId/:listingId/check", checkFavorite);
  // Listing Reviews
  app.post("/api/listing-reviews", createListingReview);
  app.get("/api/listing-reviews/:id", getListingReviews);
  app.patch("/api/listing-reviews/:id/helpful", updateListingReviewHelpful);
  app.patch("/api/listing-reviews/:id", updateListingReview);
  app.delete("/api/listing-reviews/:id", deleteListingReview);
  // Alias routes
  app.get("/listings", listListings);
  app.get("/listings/:id", getListingById);
  app.post("/listings", createListing);
  app.put("/listings/:id", updateListing);
  app.delete("/listings/:id", deleteListing);
  app.patch("/listings/:id/toggle-enabled", toggleListingEnabled);
  app.patch("/listings/bulk/update-enabled", bulkUpdateListingsEnabled);
  app.get("/listings/:id/reviews", listListingReviews);
  app.get("/listings/:id/reservations", listListingReservations);
  app.get("/users", getUserByEmail);
  app.get("/users/:id", getUserById);
  app.get("/users/username/:username", getUserByUsername);
  app.post("/users", upsertUser);
  app.post("/users/signup", emailSignup);
  app.post("/users/login", emailLogin);
  app.get("/favorites/:userId", listFavorites);
  app.post("/favorites", addFavorite);
  app.delete("/favorites/:userId/:listingId", removeFavorite);
  app.get("/favorites/:userId/:listingId/check", checkFavorite);
  // Listing Reviews aliases
  app.post("/listing-reviews", createListingReview);
  app.get("/listing-reviews/:id", getListingReviews);
  app.patch("/listing-reviews/:id/helpful", updateListingReviewHelpful);
  app.patch("/listing-reviews/:id", updateListingReview);
  app.delete("/listing-reviews/:id", deleteListingReview);

  return app;
}
