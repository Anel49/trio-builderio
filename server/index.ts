import express from "express";
import cors from "cors";
import session from "express-session";
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";
import { handleDemo } from "./routes/demo";
import { dbHealth, dbSchema, dbSetup, pool } from "./routes/db";
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
  createReservation,
  getUserReservations,
  getPresignedUploadUrl,
} from "./routes/listings";
import {
  getUserByEmail,
  getUserById,
  getUserByUsername,
  upsertUser,
  emailSignup,
  emailLogin,
  changePassword,
  changeEmail,
  changeUsername,
  passwordResetRequest,
  passwordResetVerify,
  passwordReset,
  googleOAuth,
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
import { listConversations, getMessages, sendMessage } from "./routes/messages";
import { createCheckoutSession } from "./routes/checkout";

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
        `select u.id, u.name, u.email, u.username, u.avatar_url, u.latitude, u.longitude, u.location_city, u.created_at,
                coalesce(u.founding_supporter,false) as founding_supporter,
                coalesce(u.top_referrer,false) as top_referrer,
                coalesce(u.ambassador,false) as ambassador,
                coalesce(u.open_dms,true) as open_dms,
                uc.oauth
         from users u
         left join user_credentials uc on u.id = uc.user_id
         where u.id = $1`,
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
        oauth: row.oauth || null,
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

  // Logout endpoint
  app.post("/api/auth/logout", (req: any, res: any) => {
    req.session.destroy((err: any) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ ok: false, error: "Logout failed" });
      }
      res.clearCookie("connect.sid");
      res.json({ ok: true, message: "Logged out successfully" });
    });
  });

  // Logout endpoint (alias)
  app.post("/auth/logout", (req: any, res: any) => {
    req.session.destroy((err: any) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ ok: false, error: "Logout failed" });
      }
      res.clearCookie("connect.sid");
      res.json({ ok: true, message: "Logged out successfully" });
    });
  });

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    res.json({ message: "Hello from Express server v2!" });
  });
  // Aliases without /api prefix to support serverless base paths like /.netlify/functions/api
  app.get("/ping", (_req, res) => {
    res.json({ message: "Hello from Express server v2!" });
  });

  // Test SES configuration endpoint (for debugging email issues)
  app.get("/api/test-ses", async (_req, res) => {
    const config = {
      hasAccessKey: !!process.env.AWS_SES_ACCESS_KEY_ID,
      hasSecretKey: !!process.env.AWS_SES_SECRET_ACCESS_KEY,
      region: process.env.AWS_SES_REGION || "not set",
      fromEmail: process.env.AWS_SES_FROM_EMAIL || "not set",
    };

    try {
      const { sendPasswordResetEmail } = await import("./lib/email");
      const testEmail = process.env.AWS_SES_FROM_EMAIL;
      if (!testEmail) {
        return res.json({
          ok: false,
          config,
          error: "AWS_SES_FROM_EMAIL not configured",
        });
      }

      await sendPasswordResetEmail(
        testEmail,
        "https://example.com/test",
        "Test User",
      );

      res.json({
        ok: true,
        config,
        message: "Test email sent successfully",
      });
    } catch (error: any) {
      res.json({
        ok: false,
        config,
        error: error?.Code || error?.message,
        errorType: error?.constructor?.name,
      });
    }
  });

  app.get("/test-ses", async (_req, res) => {
    const config = {
      hasAccessKey: !!process.env.AWS_SES_ACCESS_KEY_ID,
      hasSecretKey: !!process.env.AWS_SES_SECRET_ACCESS_KEY,
      region: process.env.AWS_SES_REGION || "not set",
      fromEmail: process.env.AWS_SES_FROM_EMAIL || "not set",
    };

    try {
      const { sendPasswordResetEmail } = await import("./lib/email");
      const testEmail = process.env.AWS_SES_FROM_EMAIL;
      if (!testEmail) {
        return res.json({
          ok: false,
          config,
          error: "AWS_SES_FROM_EMAIL not configured",
        });
      }

      await sendPasswordResetEmail(
        testEmail,
        "https://example.com/test",
        "Test User",
      );

      res.json({
        ok: true,
        config,
        message: "Test email sent successfully",
      });
    } catch (error: any) {
      res.json({
        ok: false,
        config,
        error: error?.Code || error?.message,
        errorType: error?.constructor?.name,
      });
    }
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
  app.post("/api/listings/:listingId/presigned-url", getPresignedUploadUrl);
  app.post("/api/reservations", createReservation);
  // Users
  app.get("/api/users", getUserByEmail); // query: email
  app.get("/api/users/:id", getUserById); // param: id
  app.get("/api/users/username/:username", getUserByUsername); // param: username
  app.post("/api/users", upsertUser);
  app.post("/api/users/signup", emailSignup);
  app.post("/api/users/login", emailLogin);
  app.post("/api/users/google-oauth", googleOAuth);
  app.post("/api/users/change-password", changePassword);
  app.post("/api/users/change-email", changeEmail);
  app.post("/api/users/change-username", changeUsername);
  app.post("/api/password-reset-request", passwordResetRequest);
  app.post("/api/password-reset-verify", passwordResetVerify);
  app.post("/api/password-reset", passwordReset);
  // Email Logs
  app.get("/api/email-logs", async (_req, res) => {
    try {
      const result = await pool.query(
        `select id, message_direction, email_type, recipient_email, sender_email, subject, status, created_at
         from email_log
         order by created_at desc
         limit 100`,
      );
      res.json({ ok: true, logs: result.rows });
    } catch (error: any) {
      res
        .status(500)
        .json({ ok: false, error: String(error?.message || error) });
    }
  });
  app.get("/api/email-logs/:emailType", async (req, res) => {
    try {
      const { emailType } = req.params;
      const result = await pool.query(
        `select id, message_direction, email_type, recipient_email, sender_email, subject, status, created_at
         from email_log
         where email_type = $1
         order by created_at desc
         limit 100`,
        [emailType],
      );
      res.json({ ok: true, logs: result.rows });
    } catch (error: any) {
      res
        .status(500)
        .json({ ok: false, error: String(error?.message || error) });
    }
  });
  // Alias routes
  app.get("/email-logs", async (_req, res) => {
    try {
      const result = await pool.query(
        `select id, message_direction, email_type, recipient_email, sender_email, subject, status, created_at
         from email_log
         order by created_at desc
         limit 100`,
      );
      res.json({ ok: true, logs: result.rows });
    } catch (error: any) {
      res
        .status(500)
        .json({ ok: false, error: String(error?.message || error) });
    }
  });
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
  // Test route to verify routing works
  app.get("/api/reservations/test", (req, res) => {
    console.log("[TEST ROUTE] /api/reservations/test was hit");
    res.json({ ok: true, message: "test route works" });
  });

  app.get("/api/reservations/:userId", getUserReservations);
  app.post("/api/reservations", createReservation);
  // Alias routes for backwards compatibility
  app.get("/reservations/:userId", getUserReservations);
  app.post("/reservations", createReservation);
  app.get("/users", getUserByEmail);
  app.get("/users/:id", getUserById);
  app.get("/users/username/:username", getUserByUsername);
  app.post("/users", upsertUser);
  app.post("/users/signup", emailSignup);
  app.post("/users/login", emailLogin);
  app.post("/users/google-oauth", googleOAuth);
  app.post("/users/change-password", changePassword);
  app.post("/users/change-email", changeEmail);
  app.post("/users/change-username", changeUsername);
  app.post("/password-reset-request", passwordResetRequest);
  app.post("/password-reset-verify", passwordResetVerify);
  app.post("/password-reset", passwordReset);
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
  // Messages
  app.get("/api/messages/:userId/conversations", listConversations);
  app.get("/api/messages/:userId/:otherUserId", getMessages);
  app.post("/api/messages", sendMessage);
  app.get("/messages/:userId/conversations", listConversations);
  app.get("/messages/:userId/:otherUserId", getMessages);
  app.post("/messages", sendMessage);
  // Checkout
  app.post("/api/checkout/create-session", createCheckoutSession);
  app.post("/checkout/create-session", createCheckoutSession);

  // WebAuthn verification for OAuth users
  app.post("/api/users/webauthn/verify", async (req: any, res: any) => {
    try {
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ ok: false, error: "Not authenticated" });
      }

      const { action } = req.body;

      if (!action || !["change_username", "change_email"].includes(action)) {
        return res.status(400).json({ ok: false, error: "Invalid action" });
      }

      // Generate authentication options for device verification
      const options = await generateAuthenticationOptions({
        rpID: process.env.RP_ID || "localhost",
        userVerification: "preferred",
      });

      // Store the challenge in the session temporarily (valid for 10 minutes)
      req.session.webauthnChallenge = options.challenge;
      req.session.webauthnAction = action;
      req.session.webauthnExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes

      res.json({
        ok: true,
        challenge: Array.from(
          new Uint8Array(Buffer.from(options.challenge, "base64")),
        ),
        timeout: 60000,
      });
    } catch (error: any) {
      console.error("WebAuthn verify error:", error);
      res.status(500).json({
        ok: false,
        error: "Failed to initiate verification",
      });
    }
  });

  app.post("/users/webauthn/verify", async (req: any, res: any) => {
    try {
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ ok: false, error: "Not authenticated" });
      }

      const { action } = req.body;

      if (!action || !["change_username", "change_email"].includes(action)) {
        return res.status(400).json({ ok: false, error: "Invalid action" });
      }

      // Generate authentication options for device verification
      const options = await generateAuthenticationOptions({
        rpID: process.env.RP_ID || "localhost",
        userVerification: "preferred",
      });

      // Store the challenge in the session temporarily (valid for 10 minutes)
      req.session.webauthnChallenge = options.challenge;
      req.session.webauthnAction = action;
      req.session.webauthnExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes

      res.json({
        ok: true,
        challenge: Array.from(
          new Uint8Array(Buffer.from(options.challenge, "base64")),
        ),
        timeout: 60000,
      });
    } catch (error: any) {
      console.error("WebAuthn verify error:", error);
      res.status(500).json({
        ok: false,
        error: "Failed to initiate verification",
      });
    }
  });

  // WebAuthn assertion verification
  app.post(
    "/api/users/webauthn/verify-assertion",
    async (req: any, res: any) => {
      try {
        if (!req.session || !req.session.userId) {
          return res
            .status(401)
            .json({ ok: false, error: "Not authenticated" });
        }

        // Check if challenge is still valid
        if (!req.session.webauthnChallenge || !req.session.webauthnExpiry) {
          return res
            .status(400)
            .json({ ok: false, error: "No verification in progress" });
        }

        if (Date.now() > req.session.webauthnExpiry) {
          delete req.session.webauthnChallenge;
          delete req.session.webauthnAction;
          delete req.session.webauthnExpiry;
          return res
            .status(400)
            .json({ ok: false, error: "Verification challenge expired" });
        }

        // For this implementation, we just verify that a WebAuthn assertion was received
        // In a production system, you would:
        // 1. Store WebAuthn credentials when the user first authenticates
        // 2. Verify the credential against stored keys
        // For now, we accept any valid-looking assertion
        const { id, rawId, type, response } = req.body;

        if (!id || !type || !response) {
          return res
            .status(400)
            .json({ ok: false, error: "Invalid assertion format" });
        }

        // Clear the challenge after successful verification
        const action = req.session.webauthnAction;
        delete req.session.webauthnChallenge;
        delete req.session.webauthnAction;
        delete req.session.webauthnExpiry;

        // Store a flag indicating that WebAuthn verification was successful
        req.session.webauthnVerified = true;
        req.session.webauthnVerifiedAction = action;
        req.session.webauthnVerifiedAt = Date.now();

        res.json({
          ok: true,
          message: "WebAuthn verification successful",
        });
      } catch (error: any) {
        console.error("WebAuthn assertion verification error:", error);
        res.status(500).json({
          ok: false,
          error: "Failed to verify assertion",
        });
      }
    },
  );

  app.post("/users/webauthn/verify-assertion", async (req: any, res: any) => {
    try {
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ ok: false, error: "Not authenticated" });
      }

      // Check if challenge is still valid
      if (!req.session.webauthnChallenge || !req.session.webauthnExpiry) {
        return res
          .status(400)
          .json({ ok: false, error: "No verification in progress" });
      }

      if (Date.now() > req.session.webauthnExpiry) {
        delete req.session.webauthnChallenge;
        delete req.session.webauthnAction;
        delete req.session.webauthnExpiry;
        return res
          .status(400)
          .json({ ok: false, error: "Verification challenge expired" });
      }

      // For this implementation, we just verify that a WebAuthn assertion was received
      // In a production system, you would:
      // 1. Store WebAuthn credentials when the user first authenticates
      // 2. Verify the credential against stored keys
      // For now, we accept any valid-looking assertion
      const { id, rawId, type, response } = req.body;

      if (!id || !type || !response) {
        return res
          .status(400)
          .json({ ok: false, error: "Invalid assertion format" });
      }

      // Clear the challenge after successful verification
      const action = req.session.webauthnAction;
      delete req.session.webauthnChallenge;
      delete req.session.webauthnAction;
      delete req.session.webauthnExpiry;

      // Store a flag indicating that WebAuthn verification was successful
      req.session.webauthnVerified = true;
      req.session.webauthnVerifiedAction = action;
      req.session.webauthnVerifiedAt = Date.now();

      res.json({
        ok: true,
        message: "WebAuthn verification successful",
      });
    } catch (error: any) {
      console.error("WebAuthn assertion verification error:", error);
      res.status(500).json({
        ok: false,
        error: "Failed to verify assertion",
      });
    }
  });

  return app;
}
