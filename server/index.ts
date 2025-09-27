import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { dbHealth, dbSchema, dbSetup } from "./routes/db";
import { listListings, createListing, deleteListing } from "./routes/listings";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    res.json({ message: "Hello from Express server v2!" });
  });
  // Aliases without /api prefix to support serverless base paths like /.netlify/functions/api
  app.get("/ping", (_req, res) => {
    res.json({ message: "Hello from Express server v2!" });
  });

  app.get("/api/demo", handleDemo);
  app.get("/demo", handleDemo);

  app.get("/api/db/health", dbHealth);
  app.get("/api/db/schema", dbSchema);
  app.post("/api/db/setup", dbSetup);
  // Alias routes
  app.get("/db/health", dbHealth);
  app.get("/db/schema", dbSchema);
  app.post("/db/setup", dbSetup);

  // Listings
  app.get("/api/listings", listListings);
  app.post("/api/listings", createListing);
  // Alias routes
  app.get("/listings", listListings);
  app.post("/listings", createListing);

  return app;
}
