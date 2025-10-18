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

const ADMIN_USERNAME = "Charki1014";
const ADMIN_PASSWORD = "q=foJ7Ba7#+4";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors({
    origin: true,
    credentials: true,
  }));
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // Session middleware
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "default-secret-key-change-in-production",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      },
    })
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

  app.get("/api/demo", requireAuth, handleDemo);
  app.get("/demo", requireAuth, handleDemo);

  app.get("/api/db/health", requireAuth, dbHealth);
  app.get("/api/db/schema", requireAuth, dbSchema);
  app.post("/api/db/setup", requireAuth, dbSetup);
  app.get("/api/db/setup/run", requireAuth, dbSetup);
  app.post("/api/geocode/reverse", requireAuth, reverseGeocode);
  // Alias routes
  app.get("/db/health", requireAuth, dbHealth);
  app.get("/db/schema", requireAuth, dbSchema);
  app.post("/db/setup", requireAuth, dbSetup);
  app.get("/db/setup/run", requireAuth, dbSetup);
  app.post("/geocode/reverse", requireAuth, reverseGeocode);

  // Listings
  app.get("/api/listings", requireAuth, listListings);
  app.get("/api/listings/:id", requireAuth, getListingById);
  app.post("/api/listings", requireAuth, createListing);
  app.delete("/api/listings/:id", requireAuth, deleteListing);
  app.get("/api/listings/:id/reviews", requireAuth, listListingReviews);
  app.get("/api/listings/:id/reservations", requireAuth, listListingReservations);
  // Users
  app.get("/api/users", requireAuth, getUserByEmail); // query: email
  app.post("/api/users", requireAuth, upsertUser);
  // Alias routes
  app.get("/listings", requireAuth, listListings);
  app.get("/listings/:id", requireAuth, getListingById);
  app.post("/listings", requireAuth, createListing);
  app.delete("/listings/:id", requireAuth, deleteListing);
  app.get("/listings/:id/reviews", requireAuth, listListingReviews);
  app.get("/listings/:id/reservations", requireAuth, listListingReservations);
  app.get("/users", requireAuth, getUserByEmail);
  app.post("/users", requireAuth, upsertUser);

  return app;
}
