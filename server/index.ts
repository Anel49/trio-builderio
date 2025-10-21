import express from "express";
import cors from "cors";
import session from "express-session";
import { handleDemo } from "./routes/demo";
import { dbHealth, dbSchema, dbSetup } from "./routes/db";
import {
  listListings,
  createListing,
  deleteListing,
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
    const { username, password } = req.body;

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      req.session.authenticated = true;
      res.json({ success: true, message: "Logged in successfully" });
    } else {
      res.status(401).json({ success: false, message: "Invalid credentials" });
    }
  });

  // Logout endpoint
  app.post("/api/auth/logout", (req: any, res: any) => {
    req.session.authenticated = false;
    res.json({ success: true, message: "Logged out successfully" });
  });

  // Check auth status
  app.get("/api/auth/status", (req: any, res: any) => {
    res.json({ authenticated: req.session && req.session.authenticated });
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
  app.delete("/api/listings/:id", deleteListing);
  app.get("/api/listings/:id/reviews", listListingReviews);
  app.get("/api/listings/:id/reservations", listListingReservations);
  // Users
  app.get("/api/users", getUserByEmail); // query: email
  app.post("/api/users", upsertUser);
  // Alias routes
  app.get("/listings", listListings);
  app.get("/listings/:id", getListingById);
  app.post("/listings", createListing);
  app.delete("/listings/:id", deleteListing);
  app.get("/listings/:id/reviews", listListingReviews);
  app.get("/listings/:id/reservations", listListingReservations);
  app.get("/users", getUserByEmail);
  app.post("/users", upsertUser);

  return app;
}
