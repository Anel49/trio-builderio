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
} from "./routes/listings";
import { getUserByEmail, upsertUser } from "./routes/users";
import { reverseGeocode } from "./routes/geocode";
import {
  listFavorites,
  addFavorite,
  removeFavorite,
  checkFavorite,
} from "./routes/favorites";

const ADMIN_USERNAME = "Charki1014";
const ADMIN_PASSWORD = "q=foJ7Ba7#+4";

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
        // No maxAge - cookie is session-only and cleared when browser closes
      },
    }),
  );

  // Authentication middleware
  const requireAuth = (req: any, res: any, next: any) => {
    if (req.session && req.session.authenticated) {
      next();
    } else {
      res.status(401).json({ error: "Unauthorized" });
    }
  };

  // Login endpoint
  app.post("/api/auth/login", (req: any, res: any) => {
    try {
      const { username, password } = req.body || {};

      if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        req.session.authenticated = true;
        return res.json({ success: true, message: "Logged in successfully" });
      } else {
        return res
          .status(401)
          .json({ success: false, message: "Invalid credentials" });
      }
    } catch (error: any) {
      console.error("Login error:", error);
      return res
        .status(500)
        .json({ success: false, error: "Internal server error" });
    }
  });

  // Logout endpoint
  app.post("/api/auth/logout", (req: any, res: any) => {
    try {
      req.session.authenticated = false;
      return res.json({ success: true, message: "Logged out successfully" });
    } catch (error: any) {
      console.error("Logout error:", error);
      return res
        .status(500)
        .json({ success: false, error: "Internal server error" });
    }
  });

  // Check auth status
  app.get("/api/auth/status", (req: any, res: any) => {
    try {
      const authenticated = !!(req.session && req.session.authenticated);
      return res.json({ authenticated, ok: true });
    } catch (error: any) {
      console.error("Auth status error:", error);
      return res.status(500).json({
        authenticated: false,
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
  app.get("/api/listings/:id/reviews", listListingReviews);
  app.get("/api/listings/:id/reservations", listListingReservations);
  // Users
  app.get("/api/users", getUserByEmail); // query: email
  app.post("/api/users", upsertUser);
  // Favorites
  app.get("/api/favorites/:userId", listFavorites);
  app.post("/api/favorites", addFavorite);
  app.delete("/api/favorites/:userId/:listingId", removeFavorite);
  app.get("/api/favorites/:userId/:listingId/check", checkFavorite);
  // Alias routes
  app.get("/listings", listListings);
  app.get("/listings/:id", getListingById);
  app.post("/listings", createListing);
  app.put("/listings/:id", updateListing);
  app.delete("/listings/:id", deleteListing);
  app.get("/listings/:id/reviews", listListingReviews);
  app.get("/listings/:id/reservations", listListingReservations);
  app.get("/users", getUserByEmail);
  app.post("/users", upsertUser);
  app.get("/favorites/:userId", listFavorites);
  app.post("/favorites", addFavorite);
  app.delete("/favorites/:userId/:listingId", removeFavorite);
  app.get("/favorites/:userId/:listingId/check", checkFavorite);

  return app;
}
