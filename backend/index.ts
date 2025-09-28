import express from "express";
import cors from "cors";
import { dbHealth, dbSchema, dbSetup } from "./db";
import { createListing, listListings } from "./routes.listings";

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

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
app.get("/listings", listListings);
app.post("/listings", createListing);

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});
