import express from "express";
import cors from "cors";
import session from "express-session";
import { dbHealth, dbSchema, dbSetup } from "./db";
import {
  createListing,
  listListings,
  updateListing,
  deleteListing,
  getListingReservations,
} from "./routes.listings";

const app = express();

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

app.get("/api/ping", (_req, res) =>
  res.json({ message: "Hello from Backend!" }),
);
app.get("/ping", (_req, res) => res.json({ message: "Hello from Backend!" }));

// DB
app.get("/api/db/health", dbHealth);
app.get("/api/db/schema", dbSchema);
app.post("/api/db/setup", dbSetup);
app.get("/db/health", dbHealth);
app.get("/db/schema", dbSchema);
app.post("/db/setup", dbSetup);

// Listings
app.get("/api/listings", listListings);
app.post("/api/listings", createListing);
app.put("/api/listings/:id", updateListing);
app.delete("/api/listings/:id", deleteListing);
app.get("/api/listings/:id/reservations", getListingReservations);
app.get("/listings", listListings);
app.post("/listings", createListing);
app.put("/listings/:id", updateListing);
app.delete("/listings/:id", deleteListing);
app.get("/listings/:id/reservations", getListingReservations);

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});
