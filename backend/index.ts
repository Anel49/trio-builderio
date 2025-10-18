import express from "express";
import cors from "cors";
import session from "express-session";
import { dbHealth, dbSchema, dbSetup } from "./db";
import { createListing, listListings } from "./routes.listings";

const ADMIN_USERNAME = "Charki1014";
const ADMIN_PASSWORD = "q=foJ7Ba7#+4";

const app = express();

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

app.get("/api/ping", (_req, res) =>
  res.json({ message: "Hello from Backend!" }),
);
app.get("/ping", (_req, res) => res.json({ message: "Hello from Backend!" }));

// DB
app.get("/api/db/health", requireAuth, dbHealth);
app.get("/api/db/schema", requireAuth, dbSchema);
app.post("/api/db/setup", requireAuth, dbSetup);
app.get("/db/health", requireAuth, dbHealth);
app.get("/db/schema", requireAuth, dbSchema);
app.post("/db/setup", requireAuth, dbSetup);

// Listings
app.get("/api/listings", requireAuth, listListings);
app.post("/api/listings", requireAuth, createListing);
app.get("/listings", requireAuth, listListings);
app.post("/listings", requireAuth, createListing);

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});
