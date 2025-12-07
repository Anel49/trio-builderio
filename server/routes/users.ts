import type { Request, Response } from "express";
import { pool } from "./db";
import * as argon2 from "argon2";
import { OAuth2Client } from "google-auth-library";
import crypto from "crypto";

function rowToUser(r: any) {
  return {
    id: r.id,
    name: r.name || null,
    email: r.email || null,
    username: r.username || null,
    avatarUrl: r.avatar_url || null,
    zipCode: null,
    locationLatitude: typeof r.latitude === "number" ? r.latitude : null,
    locationLongitude: typeof r.longitude === "number" ? r.longitude : null,
    locationCity: typeof r.location_city === "string" ? r.location_city : null,
    createdAt: r.created_at,
    foundingSupporter: Boolean(r.founding_supporter),
    topReferrer: Boolean(r.top_referrer),
    ambassador: Boolean(r.ambassador),
    openDms: Boolean(r.open_dms),
    active: Boolean(r.active ?? true),
  };
}

async function ensureBadgeColumns() {
  try {
    await pool.query(
      `alter table users add column if not exists founding_supporter boolean default false`,
    );
    await pool.query(
      `alter table users add column if not exists top_referrer boolean default false`,
    );
    await pool.query(
      `alter table users add column if not exists ambassador boolean default false`,
    );
    await pool.query(
      `alter table users add column if not exists open_dms boolean default true`,
    );
  } catch (e) {
    console.error("Error ensuring badge columns:", e);
  }
}

export async function getUserById(req: Request, res: Response) {
  try {
    const userId = String((req.params as any)?.id || "").trim();
    if (!userId || !Number.isFinite(Number.parseInt(userId, 10))) {
      return res
        .status(400)
        .json({ ok: false, error: "valid user id is required" });
    }
    const result = await pool.query(
      `select id, name, email, username, avatar_url, created_at,
            latitude, longitude, location_city,
            coalesce(founding_supporter,false) as founding_supporter,
            coalesce(top_referrer,false) as top_referrer,
            coalesce(ambassador,false) as ambassador,
            coalesce(open_dms,true) as open_dms,
            coalesce(active,true) as active
       from users where id = $1 limit 1`,
      [Number.parseInt(userId, 10)],
    );

    if (!result.rowCount || result.rowCount === 0) {
      return res.status(404).json({ ok: false, error: "User not found" });
    }

    const user = rowToUser(result.rows[0]);
    res.json({ ok: true, user });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: String(error?.message || error) });
  }
}

export async function getUserByUsername(req: Request, res: Response) {
  try {
    const username = String((req.params as any)?.username || "")
      .trim()
      .toLowerCase();
    if (!username) {
      return res
        .status(400)
        .json({ ok: false, error: "valid username is required" });
    }
    const result = await pool.query(
      `select id, name, email, username, avatar_url, created_at,
            latitude, longitude, location_city,
            coalesce(founding_supporter,false) as founding_supporter,
            coalesce(top_referrer,false) as top_referrer,
            coalesce(ambassador,false) as ambassador,
            coalesce(open_dms,true) as open_dms,
            coalesce(active,true) as active
       from users where lower(username) = $1 limit 1`,
      [username],
    );

    if (!result.rowCount || result.rowCount === 0) {
      return res.status(404).json({ ok: false, error: "User not found" });
    }

    const user = rowToUser(result.rows[0]);
    res.json({ ok: true, user });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: String(error?.message || error) });
  }
}

export async function getUserByEmail(req: Request, res: Response) {
  try {
    const email = String((req.query as any)?.email || "").trim();
    if (!email) {
      return res.status(400).json({ ok: false, error: "email is required" });
    }
    const result = await pool.query(
      `select id, name, email, username, avatar_url, created_at,
            latitude, longitude, location_city,
            coalesce(founding_supporter,false) as founding_supporter,
            coalesce(top_referrer,false) as top_referrer,
            coalesce(ambassador,false) as ambassador,
            coalesce(open_dms,true) as open_dms,
            coalesce(active,true) as active
       from users where email = $1 limit 1`,
      [email],
    );
    if (result.rowCount === 0) {
      return res.json({ ok: true, user: null });
    }
    const user = rowToUser(result.rows[0]);
    return res.json({ ok: true, user });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: String(error?.message || error) });
  }
}

export async function upsertUser(req: Request, res: Response) {
  try {
    const {
      name,
      email,
      avatar_url,
      latitude,
      longitude,
      location_city,
      founding_supporter,
      top_referrer,
      ambassador,
      username,
      first_name,
      last_name,
    } = (req.body || {}) as any;

    const emailStr = typeof email === "string" ? email.trim() : "";
    if (!emailStr) {
      return res.status(400).json({ ok: false, error: "email is required" });
    }

    // Check if this is an OAuth user trying to change their email
    const session = (req as any).session;
    if (session && session.userId) {
      const credResult = await pool.query(
        `select email, oauth from user_credentials where user_id = $1`,
        [session.userId],
      );

      if (credResult.rowCount && credResult.rowCount > 0) {
        const currentEmail = credResult.rows[0].email;
        const isOAuthUser = credResult.rows[0].oauth !== null;

        if (isOAuthUser && emailStr !== currentEmail) {
          return res.status(403).json({
            ok: false,
            error:
              "Cannot change email for OAuth accounts. Your email is linked to your OAuth provider account.",
          });
        }
      }
    }

    await ensureBadgeColumns();

    const latParam = latitude;
    const lonParam = longitude;

    const latValue =
      typeof latParam === "number"
        ? latParam
        : typeof latParam === "string" && latParam.trim()
          ? Number.parseFloat(latParam)
          : NaN;
    const lonValue =
      typeof lonParam === "number"
        ? lonParam
        : typeof lonParam === "string" && lonParam.trim()
          ? Number.parseFloat(lonParam)
          : NaN;

    const usernameValue = typeof username === "string" ? username.trim() : null;

    const firstNameValue =
      typeof first_name === "string" ? first_name.trim() || null : null;
    const lastNameValue =
      typeof last_name === "string" ? last_name.trim() || null : null;

    const result = await pool.query(
      `insert into users (name, email, avatar_url, latitude, longitude, location_city, founding_supporter, top_referrer, ambassador, open_dms, username, first_name, last_name)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       on conflict (email) do update set
         name = coalesce(excluded.name, users.name),
         avatar_url = coalesce(excluded.avatar_url, users.avatar_url),
         latitude = excluded.latitude,
         longitude = excluded.longitude,
         location_city = excluded.location_city,
         founding_supporter = coalesce(excluded.founding_supporter, users.founding_supporter),
         top_referrer = coalesce(excluded.top_referrer, users.top_referrer),
         ambassador = coalesce(excluded.ambassador, users.ambassador),
         open_dms = coalesce(excluded.open_dms, users.open_dms),
         username = coalesce(excluded.username, users.username),
         first_name = excluded.first_name,
         last_name = excluded.last_name
       returning id, name, email, username, avatar_url, latitude, longitude, location_city, created_at,
                 coalesce(founding_supporter,false) as founding_supporter,
                 coalesce(top_referrer,false) as top_referrer,
                 coalesce(ambassador,false) as ambassador,
                 coalesce(open_dms,true) as open_dms`,
      [
        typeof name === "string" ? name : null,
        emailStr,
        typeof avatar_url === "string" ? avatar_url : null,
        Number.isFinite(latValue) ? latValue : null,
        Number.isFinite(lonValue) ? lonValue : null,
        typeof location_city === "string" ? location_city.trim() : null,
        Boolean(founding_supporter),
        Boolean(top_referrer),
        Boolean(ambassador),
        true, // open_dms defaults to true
        usernameValue,
        firstNameValue,
        lastNameValue,
      ],
    );

    const user = rowToUser(result.rows[0]);
    const userId = result.rows[0].id;

    // Also update user_credentials table with first_name and last_name
    if (firstNameValue !== null || lastNameValue !== null) {
      await pool.query(
        `update user_credentials set first_name = coalesce($1, first_name), last_name = coalesce($2, last_name) where user_id = $3`,
        [firstNameValue, lastNameValue, userId],
      );
    }

    res.json({ ok: true, user });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: String(error?.message || error) });
  }
}

export async function emailSignup(req: Request, res: Response) {
  try {
    const {
      first_name,
      last_name,
      username,
      email,
      password,
      confirm_password,
      photo_id,
    } = (req.body || {}) as any;

    const firstNameStr =
      typeof first_name === "string" ? first_name.trim() : "";
    const lastNameStr = typeof last_name === "string" ? last_name.trim() : "";
    const usernameStr =
      typeof username === "string" ? username.trim().toLowerCase() : "";
    const emailStr = typeof email === "string" ? email.trim() : "";
    const passwordStr = typeof password === "string" ? password : "";
    const confirmPasswordStr =
      typeof confirm_password === "string" ? confirm_password : "";
    const photoIdStr = typeof photo_id === "string" ? photo_id.trim() : null;

    if (!firstNameStr) {
      return res
        .status(400)
        .json({ ok: false, error: "first_name is required" });
    }

    if (!usernameStr) {
      return res.status(400).json({ ok: false, error: "username is required" });
    }

    if (!emailStr || !emailStr.includes("@")) {
      return res
        .status(400)
        .json({ ok: false, error: "valid email is required" });
    }

    if (!passwordStr || passwordStr.length < 6) {
      return res.status(400).json({
        ok: false,
        error: "password must be at least 6 characters",
      });
    }

    if (passwordStr !== confirmPasswordStr) {
      return res
        .status(400)
        .json({ ok: false, error: "passwords do not match" });
    }

    const existingUserResult = await pool.query(
      `select id from users where email = $1`,
      [emailStr],
    );

    if (existingUserResult.rowCount && existingUserResult.rowCount > 0) {
      return res
        .status(400)
        .json({ ok: false, error: "email already registered" });
    }

    const existingCredResult = await pool.query(
      `select id from user_credentials where email = $1`,
      [emailStr],
    );

    if (existingCredResult.rowCount && existingCredResult.rowCount > 0) {
      return res
        .status(400)
        .json({ ok: false, error: "email already registered" });
    }

    // Check if username is already taken (case-insensitive)
    const existingUsernameResult = await pool.query(
      `select id from users where lower(username) = $1`,
      [usernameStr],
    );

    if (
      existingUsernameResult.rowCount &&
      existingUsernameResult.rowCount > 0
    ) {
      return res
        .status(400)
        .json({ ok: false, error: "username already taken" });
    }

    const userResult = await pool.query(
      `insert into users (name, email, avatar_url, first_name, last_name, username)
       values ($1, $2, $3, $4, $5, $6)
       returning id, name, email, username, avatar_url, created_at,
                 coalesce(founding_supporter,false) as founding_supporter,
                 coalesce(top_referrer,false) as top_referrer,
                 coalesce(ambassador,false) as ambassador,
                 coalesce(open_dms,true) as open_dms,
                 coalesce(active,true) as active`,
      [
        `${firstNameStr} ${lastNameStr}`,
        emailStr,
        photoIdStr,
        firstNameStr,
        lastNameStr,
        usernameStr,
      ],
    );

    const userId = userResult.rows[0].id;

    // Set founding_supporter to true if id <= 1001
    if (userId <= 1001) {
      await pool.query(
        `update users set founding_supporter = true where id = $1`,
        [userId],
      );
      userResult.rows[0].founding_supporter = true;
    }

    const hashedPassword = await argon2.hash(passwordStr);

    // Move the photo from temp location to user's folder if provided
    let finalPhotoId = photoIdStr;
    if (photoIdStr) {
      try {
        const { extractS3KeyFromUrl } = await import("../lib/s3");
        const { moveVerificationPhotoToUserFolder } = await import("../lib/s3");

        // Extract the S3 key from the presigned URL
        const tempS3Key = extractS3KeyFromUrl(photoIdStr);

        if (tempS3Key) {
          console.log(
            "[emailSignup] Moving photo from temp location to user folder:",
            tempS3Key,
          );
          const newS3Key = await moveVerificationPhotoToUserFolder(
            tempS3Key,
            userId,
          );

          // Update finalPhotoId to the new S3 key
          finalPhotoId = newS3Key;

          console.log("[emailSignup] Photo moved successfully to:", newS3Key);
        }
      } catch (photoError: any) {
        console.error(
          "[emailSignup] Error moving photo to user folder:",
          photoError,
        );
        // Continue with signup even if photo move fails
        console.log("[emailSignup] Continuing signup without moving photo");
      }
    }

    const credResult = await pool.query(
      `insert into user_credentials (user_id, first_name, last_name, email, password, photo_id)
       values ($1, $2, $3, $4, $5, $6)
       returning id`,
      [
        userId,
        firstNameStr,
        lastNameStr,
        emailStr,
        hashedPassword,
        finalPhotoId,
      ],
    );

    const user = rowToUser(userResult.rows[0]);

    (req as any).session.userId = user.id;
    (req as any).session.user = user;

    res.json({
      ok: true,
      user,
      credentialId: credResult.rows[0].id,
      message: "Account created successfully",
    });
  } catch (error: any) {
    console.error("Email signup error:", error);
    res.status(500).json({ ok: false, error: String(error?.message || error) });
  }
}

export async function emailLogin(req: Request, res: Response) {
  try {
    const { email, password, staySignedIn } = (req.body || {}) as any;

    const emailStr = typeof email === "string" ? email.trim() : "";
    const passwordStr = typeof password === "string" ? password : "";
    const staySignedInFlag = Boolean(staySignedIn);

    if (!emailStr || !emailStr.includes("@")) {
      return res
        .status(400)
        .json({ ok: false, error: "valid email is required" });
    }

    if (!passwordStr) {
      return res.status(400).json({ ok: false, error: "password is required" });
    }

    const credResult = await pool.query(
      `select user_id, password from user_credentials where email = $1`,
      [emailStr],
    );

    if (!credResult.rowCount || credResult.rowCount === 0) {
      return res
        .status(400)
        .json({ ok: false, error: "email or password is incorrect" });
    }

    const cred = credResult.rows[0];
    const isPasswordValid = await argon2.verify(cred.password, passwordStr);

    if (!isPasswordValid) {
      return res
        .status(400)
        .json({ ok: false, error: "email or password is incorrect" });
    }

    const userResult = await pool.query(
      `select id, name, email, username, avatar_url, latitude, longitude, location_city, created_at,
              coalesce(founding_supporter,false) as founding_supporter,
              coalesce(top_referrer,false) as top_referrer,
              coalesce(ambassador,false) as ambassador,
              coalesce(open_dms,true) as open_dms,
              coalesce(active,true) as active
       from users where id = $1`,
      [cred.user_id],
    );

    if (!userResult.rowCount || userResult.rowCount === 0) {
      return res.status(400).json({ ok: false, error: "user not found" });
    }

    const user = rowToUser(userResult.rows[0]);

    (req as any).session.userId = user.id;
    (req as any).session.user = user;

    if (staySignedInFlag) {
      (req as any).session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000;
    }

    res.json({
      ok: true,
      user,
      message: "Login successful",
    });
  } catch (error: any) {
    console.error("Email login error:", error);
    res.status(500).json({ ok: false, error: String(error?.message || error) });
  }
}

export async function changePassword(req: Request, res: Response) {
  try {
    const session = (req as any).session;
    if (!session || !session.userId) {
      return res.status(401).json({ ok: false, error: "Not authenticated" });
    }

    const {
      current_password: currentPasswordStr,
      new_password: newPasswordStr,
      confirm_password: confirmPasswordStr,
    } = (req.body || {}) as any;

    if (!currentPasswordStr) {
      return res.status(400).json({
        ok: false,
        error: "current password is required",
      });
    }

    if (!newPasswordStr || newPasswordStr.length < 6) {
      return res.status(400).json({
        ok: false,
        error: "password must be at least 6 characters",
      });
    }

    if (newPasswordStr !== confirmPasswordStr) {
      return res.status(400).json({
        ok: false,
        error: "passwords do not match",
      });
    }

    // Get current password from database
    const credResult = await pool.query(
      `select password from user_credentials where user_id = $1`,
      [session.userId],
    );

    if (!credResult.rowCount || credResult.rowCount === 0) {
      return res.status(400).json({
        ok: false,
        error: "User credentials not found",
      });
    }

    // Verify current password
    const isPasswordValid = await argon2.verify(
      credResult.rows[0].password,
      currentPasswordStr,
    );

    if (!isPasswordValid) {
      return res.status(400).json({
        ok: false,
        error: "current password is incorrect",
      });
    }

    // Hash and update new password
    const hashedNewPassword = await argon2.hash(newPasswordStr);

    await pool.query(
      `update user_credentials set password = $1 where user_id = $2`,
      [hashedNewPassword, session.userId],
    );

    res.json({
      ok: true,
      message: "Password changed successfully",
    });
  } catch (error: any) {
    console.error("Change password error:", error);
    res.status(500).json({ ok: false, error: String(error?.message || error) });
  }
}

export async function changeEmail(req: Request, res: Response) {
  try {
    const session = (req as any).session;
    if (!session || !session.userId) {
      return res.status(401).json({ ok: false, error: "Not authenticated" });
    }

    const {
      new_email: newEmailStr,
      confirm_email: confirmEmailStr,
      password: passwordStr,
    } = (req.body || {}) as any;

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!newEmailStr || !emailRegex.test(newEmailStr)) {
      return res.status(400).json({
        ok: false,
        error: "valid email is required",
      });
    }

    if (newEmailStr !== confirmEmailStr) {
      return res.status(400).json({
        ok: false,
        error: "emails do not match",
      });
    }

    // Get user credentials to check oauth status and password
    const credResult = await pool.query(
      `select password, oauth from user_credentials where user_id = $1`,
      [session.userId],
    );

    if (!credResult.rowCount || credResult.rowCount === 0) {
      return res.status(400).json({
        ok: false,
        error: "User credentials not found",
      });
    }

    const isOAuthUser = credResult.rows[0].oauth !== null;

    // OAuth users cannot change their email in user_credentials
    // Their email is tied to their OAuth provider and must remain constant for login
    if (isOAuthUser) {
      return res.status(403).json({
        ok: false,
        error:
          "Cannot change email for OAuth accounts. Your email is linked to your OAuth provider account.",
      });
    } else {
      // For password users, verify password
      if (!passwordStr) {
        return res.status(400).json({
          ok: false,
          error: "password is required for security",
        });
      }

      const isPasswordValid = await argon2.verify(
        credResult.rows[0].password,
        passwordStr,
      );

      if (!isPasswordValid) {
        return res.status(400).json({
          ok: false,
          error: "password is incorrect",
        });
      }
    }

    // Check if new email is already in use
    const existingEmailResult = await pool.query(
      `select id from user_credentials where email = $1 and user_id != $2`,
      [newEmailStr.trim(), session.userId],
    );

    if (existingEmailResult.rowCount && existingEmailResult.rowCount > 0) {
      return res.status(400).json({
        ok: false,
        error: "email already in use",
      });
    }

    // Update email in both users and user_credentials tables
    await pool.query(`update users set email = $1 where id = $2`, [
      newEmailStr.trim(),
      session.userId,
    ]);

    await pool.query(
      `update user_credentials set email = $1 where user_id = $2`,
      [newEmailStr.trim(), session.userId],
    );

    res.json({
      ok: true,
      message: "Email changed successfully",
    });
  } catch (error: any) {
    console.error("Change email error:", error);
    res.status(500).json({ ok: false, error: String(error?.message || error) });
  }
}

export async function changeUsername(req: Request, res: Response) {
  try {
    const session = (req as any).session;

    if (!session || !session.userId) {
      return res.status(401).json({ ok: false, error: "Not authenticated" });
    }

    const { new_username, password } = (req.body || {}) as any;

    const newUsernameStr =
      typeof new_username === "string" ? new_username.trim() : "";
    const passwordStr = typeof password === "string" ? password : "";

    // Validate username
    if (!newUsernameStr) {
      return res.status(400).json({
        ok: false,
        error: "new username is required",
      });
    }

    // Username should be alphanumeric and contain no spaces
    if (!/^[a-zA-Z0-9_-]+$/.test(newUsernameStr)) {
      return res.status(400).json({
        ok: false,
        error:
          "username can only contain letters, numbers, underscores, and hyphens",
      });
    }

    // Username should be between 3 and 30 characters
    if (newUsernameStr.length < 3 || newUsernameStr.length > 30) {
      return res.status(400).json({
        ok: false,
        error: "username must be between 3 and 30 characters",
      });
    }

    // Get user credentials to check oauth status and password
    const credResult = await pool.query(
      `select password, oauth from user_credentials where user_id = $1`,
      [session.userId],
    );

    if (!credResult.rowCount || credResult.rowCount === 0) {
      return res.status(400).json({
        ok: false,
        error: "User credentials not found",
      });
    }

    const isOAuthUser = credResult.rows[0].oauth !== null;

    // For OAuth users, check WebAuthn verification
    if (isOAuthUser) {
      const webauthnVerified = (req as any).session.webauthnVerified;
      const webauthnAction = (req as any).session.webauthnVerifiedAction;

      if (!webauthnVerified || webauthnAction !== "change_username") {
        return res.status(403).json({
          ok: false,
          error:
            "WebAuthn verification required to change username for OAuth accounts",
        });
      }

      // Clear the WebAuthn verification flag after use
      delete (req as any).session.webauthnVerified;
      delete (req as any).session.webauthnVerifiedAction;
      delete (req as any).session.webauthnVerifiedAt;
    } else {
      // For password users, verify password
      if (!passwordStr) {
        return res.status(400).json({
          ok: false,
          error: "password is required",
        });
      }

      const isPasswordValid = await argon2.verify(
        credResult.rows[0].password,
        passwordStr,
      );

      if (!isPasswordValid) {
        return res.status(400).json({
          ok: false,
          error: "password is incorrect",
        });
      }
    }

    // Check if username is already taken by another user (case-insensitive)
    const existingUsernameResult = await pool.query(
      `select id from users where lower(username) = $1 and id != $2`,
      [newUsernameStr.toLowerCase(), session.userId],
    );

    if (
      existingUsernameResult.rowCount &&
      existingUsernameResult.rowCount > 0
    ) {
      return res.status(400).json({
        ok: false,
        error: "username already taken",
      });
    }

    // Update username in users table
    const updateResult = await pool.query(
      `update users set username = $1 where id = $2
       returning id, name, email, username, avatar_url, latitude, longitude, location_city, created_at,
                 coalesce(founding_supporter,false) as founding_supporter,
                 coalesce(top_referrer,false) as top_referrer,
                 coalesce(ambassador,false) as ambassador,
                 coalesce(open_dms,true) as open_dms`,
      [newUsernameStr, session.userId],
    );

    if (!updateResult.rowCount || updateResult.rowCount === 0) {
      return res.status(500).json({
        ok: false,
        error: "Failed to update username",
      });
    }

    const row = updateResult.rows[0];
    const user = {
      id: row.id,
      name: row.name || null,
      email: row.email || null,
      username: row.username || null,
      avatarUrl: row.avatar_url || null,
      zipCode: null,
      locationLatitude: typeof row.latitude === "number" ? row.latitude : null,
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

    // Update session with new user data
    session.user = user;

    res.json({
      ok: true,
      message: "Username changed successfully",
      user,
    });
  } catch (error: any) {
    console.error("Change username error:", error);
    res.status(500).json({ ok: false, error: String(error?.message || error) });
  }
}

export async function passwordResetRequest(req: Request, res: Response) {
  try {
    const { email } = (req.body || {}) as any;

    const emailStr = typeof email === "string" ? email.trim() : "";

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailStr || !emailRegex.test(emailStr)) {
      return res.status(400).json({
        ok: false,
        error: "valid email is required",
      });
    }

    // Check if user exists
    const credResult = await pool.query(
      `select user_id from user_credentials where email = $1`,
      [emailStr],
    );

    if (!credResult.rowCount || credResult.rowCount === 0) {
      // For security, return success even if email doesn't exist
      return res.json({
        ok: true,
        message:
          "If an account exists with this email, a password reset link has been sent",
      });
    }

    const userId = credResult.rows[0].user_id;

    // Get user name
    const userResult = await pool.query(
      `select name from users where id = $1`,
      [userId],
    );

    const userName = userResult.rows?.[0]?.name || emailStr;

    // Generate a secure random token (32 bytes = 256 bits)
    const token = crypto.randomBytes(32).toString("hex");

    // Store token in database with 24 hour expiration
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    await pool.query(
      `insert into password_reset_tokens (user_id, email, token, expires_at)
       values ($1, $2, $3, $4)`,
      [userId, emailStr, token, expiresAt],
    );

    // Build reset link
    const baseUrl =
      process.env.FRONTEND_URL ||
      `${(req as any).protocol}://${(req as any).get("host")}`;
    const resetLink = `${baseUrl}/reset-password?token=${encodeURIComponent(token)}&email=${encodeURIComponent(emailStr)}`;

    // Send email
    let emailSent = false;
    let emailError: any = null;
    try {
      console.log(
        `[passwordResetRequest] Attempting to send reset email to ${emailStr}`,
      );
      const { sendPasswordResetEmail } = await import("../lib/email");
      const emailResult = await sendPasswordResetEmail(
        emailStr,
        resetLink,
        userName,
      );
      console.log(
        `[passwordResetRequest] Email sent successfully:`,
        emailResult,
      );
      emailSent = true;
    } catch (err: any) {
      emailError = err;
      console.error(
        `[passwordResetRequest] Failed to send password reset email to ${emailStr}:`,
        err,
      );
      console.error(`[passwordResetRequest] Error code:`, err?.Code);
      console.error(`[passwordResetRequest] Error message:`, err?.message);
      // Still return success to not leak email existence
    }

    // Return debug info in development
    const isProduction = process.env.NODE_ENV === "production";
    const response: any = {
      ok: true,
      message:
        "If an account exists with this email, a password reset link has been sent",
    };

    // Add debug info if email failed (helps diagnose issues)
    if (!emailSent && emailError) {
      response.debug = {
        emailError: emailError?.Code || emailError?.message || "Unknown error",
        errorType: emailError?.constructor?.name,
      };
    }

    res.json(response);
  } catch (error: any) {
    console.error("Password reset request error:", error);
    res.status(500).json({ ok: false, error: String(error?.message || error) });
  }
}

export async function passwordResetVerify(req: Request, res: Response) {
  try {
    const { token, email } = (req.body || {}) as any;

    const tokenStr = typeof token === "string" ? token.trim() : "";
    const emailStr = typeof email === "string" ? email.trim() : "";

    if (!tokenStr || !emailStr) {
      return res.status(400).json({
        ok: false,
        error: "token and email are required",
      });
    }

    // Check if token exists and is valid
    const tokenResult = await pool.query(
      `select id, user_id, expires_at, used from password_reset_tokens
       where token = $1 and email = $2`,
      [tokenStr, emailStr],
    );

    if (!tokenResult.rowCount || tokenResult.rowCount === 0) {
      return res.status(400).json({
        ok: false,
        error: "Invalid or expired reset link",
      });
    }

    const tokenRecord = tokenResult.rows[0];

    // Check if token is expired
    if (new Date(tokenRecord.expires_at) < new Date()) {
      return res.status(400).json({
        ok: false,
        error: "Reset link has expired. Please request a new one.",
      });
    }

    // Check if token has already been used
    if (tokenRecord.used) {
      return res.status(400).json({
        ok: false,
        error: "This reset link has already been used",
      });
    }

    res.json({
      ok: true,
      message: "Token is valid",
    });
  } catch (error: any) {
    console.error("Password reset verify error:", error);
    res.status(500).json({ ok: false, error: String(error?.message || error) });
  }
}

export async function passwordReset(req: Request, res: Response) {
  try {
    const { token, email, new_password } = (req.body || {}) as any;

    const tokenStr = typeof token === "string" ? token.trim() : "";
    const emailStr = typeof email === "string" ? email.trim() : "";
    const passwordStr = typeof new_password === "string" ? new_password : "";

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailStr || !emailRegex.test(emailStr)) {
      return res.status(400).json({
        ok: false,
        error: "valid email is required",
      });
    }

    if (!passwordStr || passwordStr.length < 6) {
      return res.status(400).json({
        ok: false,
        error: "Password must be at least 6 characters",
      });
    }

    if (!tokenStr) {
      return res.status(400).json({
        ok: false,
        error: "reset token is required",
      });
    }

    // Check if token exists and is valid
    const tokenResult = await pool.query(
      `select id, user_id, expires_at, used from password_reset_tokens
       where token = $1 and email = $2`,
      [tokenStr, emailStr],
    );

    if (!tokenResult.rowCount || tokenResult.rowCount === 0) {
      return res.status(400).json({
        ok: false,
        error: "Invalid or expired reset link",
      });
    }

    const tokenRecord = tokenResult.rows[0];

    // Check if token is expired
    if (new Date(tokenRecord.expires_at) < new Date()) {
      return res.status(400).json({
        ok: false,
        error: "Reset link has expired. Please request a new one.",
      });
    }

    // Check if token has already been used
    if (tokenRecord.used) {
      return res.status(400).json({
        ok: false,
        error: "This reset link has already been used",
      });
    }

    const userId = tokenRecord.user_id;

    // Check if user exists and get user_id
    const credResult = await pool.query(
      `select user_id from user_credentials where email = $1`,
      [emailStr],
    );

    if (!credResult.rowCount || credResult.rowCount === 0) {
      return res.status(404).json({
        ok: false,
        error: "Account with this email not found",
      });
    }

    // Hash the new password
    const hashedPassword = await argon2.hash(passwordStr);

    // Update the password in user_credentials
    await pool.query(
      `update user_credentials set password = $1 where user_id = $2`,
      [hashedPassword, userId],
    );

    // Mark token as used
    await pool.query(
      `update password_reset_tokens set used = true where id = $1`,
      [tokenRecord.id],
    );

    res.json({
      ok: true,
      message: "Password has been successfully reset",
    });
  } catch (error: any) {
    console.error("Password reset error:", error);
    res.status(500).json({ ok: false, error: String(error?.message || error) });
  }
}

export async function googleOAuth(req: Request, res: Response) {
  try {
    const { token, staySignedIn } = (req.body || {}) as any;

    if (!token || typeof token !== "string") {
      return res.status(400).json({ ok: false, error: "token is required" });
    }

    const googleClientId =
      "351186828908-eftb2iad6u9k6kiesn15hd1i0ph7dio0.apps.googleusercontent.com";
    const client = new OAuth2Client(googleClientId);

    let payload: any;

    // Try to verify as ID token first
    try {
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: googleClientId,
      });
      payload = ticket.getPayload();
    } catch (verifyError: any) {
      console.log(
        "ID token verification failed, trying access token:",
        verifyError.message,
      );

      // If ID token verification fails, treat it as an access token
      // and fetch user info from Google's userinfo endpoint
      try {
        const userInfoResponse = await fetch(
          "https://www.googleapis.com/oauth2/v2/userinfo",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (!userInfoResponse.ok) {
          throw new Error(
            `Failed to fetch user info: ${userInfoResponse.statusText}`,
          );
        }

        payload = await userInfoResponse.json();
      } catch (accessTokenError: any) {
        console.error(
          "Token verification and user info fetch failed:",
          accessTokenError.message,
        );
        return res.status(401).json({ ok: false, error: "Invalid token" });
      }
    }

    if (!payload) {
      return res
        .status(401)
        .json({ ok: false, error: "Invalid token payload" });
    }

    const email = payload.email
      ? String(payload.email).toLowerCase().trim()
      : "";
    const firstName = payload.given_name
      ? String(payload.given_name).trim()
      : "";
    const lastName = payload.family_name
      ? String(payload.family_name).trim()
      : "";
    const picture = payload.picture ? String(payload.picture).trim() : null;
    const name = `${firstName}${lastName ? " " + lastName : ""}`.trim();

    if (!email) {
      return res.status(400).json({ ok: false, error: "Email is required" });
    }

    // Check if email already exists in user_credentials
    const credResult = await pool.query(
      `select user_id, oauth from user_credentials where email = $1`,
      [email],
    );

    let userId: number;

    // If email already exists
    if (credResult.rowCount && credResult.rowCount > 0) {
      // If it's already a Google OAuth account, just log them in
      const existingCred = credResult.rows[0];
      if (existingCred.oauth === "google_oauth") {
        userId = existingCred.user_id;
      } else {
        // Email exists but not as Google OAuth (either password or different OAuth)
        return res.status(409).json({
          ok: false,
          error: "email_in_use",
          email: email,
          message: `An account associated with the email address ${email} already exists. Please log in with your email and password instead.`,
        });
      }
    } else {
      // Create new user
      const userInsertResult = await pool.query(
        `insert into users (name, email, avatar_url, first_name, last_name, created_at)
         values ($1, $2, $3, $4, $5, now())
         returning id`,
        [name || null, email, picture, firstName || null, lastName || null],
      );

      userId = userInsertResult.rows[0].id;

      // Set founding_supporter to true if id <= 1001
      if (userId <= 1001) {
        await pool.query(
          `update users set founding_supporter = true where id = $1`,
          [userId],
        );
      }

      // Create user credentials for OAuth user (password is NULL)
      await pool.query(
        `insert into user_credentials (user_id, email, password, first_name, last_name, photo_id, oauth)
         values ($1, $2, $3, $4, $5, $6, $7)`,
        [
          userId,
          email,
          null,
          firstName || null,
          lastName || null,
          null,
          "google_oauth",
        ],
      );
    }

    // Fetch user data
    const userResult = await pool.query(
      `select id, name, email, username, avatar_url, latitude, longitude, location_city, created_at,
              coalesce(founding_supporter,false) as founding_supporter,
              coalesce(top_referrer,false) as top_referrer,
              coalesce(ambassador,false) as ambassador,
              coalesce(open_dms,true) as open_dms,
              coalesce(active,true) as active
       from users where id = $1`,
      [userId],
    );

    if (!userResult.rowCount || userResult.rowCount === 0) {
      return res.status(500).json({ ok: false, error: "Failed to fetch user" });
    }

    const user = rowToUser(userResult.rows[0]);

    // Set session
    (req as any).session.userId = user.id;
    (req as any).session.user = user;

    if (staySignedIn === true) {
      (req as any).session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000;
    }

    res.json({
      ok: true,
      user,
      message: "Google OAuth login successful",
    });
  } catch (error: any) {
    console.error("Google OAuth error:", error);
    res.status(500).json({ ok: false, error: String(error?.message || error) });
  }
}

export async function getPresignedProfileImageUrl(req: Request, res: Response) {
  try {
    const userId = Number((req.params as any)?.userId);
    if (!userId || Number.isNaN(userId)) {
      return res.status(400).json({ ok: false, error: "invalid userId" });
    }

    const { filename, contentType } = req.body || {};

    if (!filename || typeof filename !== "string" || filename.trim() === "") {
      return res.status(400).json({ ok: false, error: "filename is required" });
    }

    if (!contentType || typeof contentType !== "string") {
      return res
        .status(400)
        .json({ ok: false, error: "contentType is required" });
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
      generateUserProfilePictureS3Key,
      generateUserProfilePictureWebpS3Key,
    } = await import("../lib/s3");

    // Generate S3 key for user profile picture
    const s3Key = generateUserProfilePictureS3Key(userId, filename);

    // Generate S3 key for WEBP version
    const s3WebpKey = generateUserProfilePictureWebpS3Key(userId);

    // Generate presigned URLs for both original and WEBP versions
    const presignedUrl = await generatePresignedUploadUrl(s3Key, contentType);
    const presignedWebpUrl = await generatePresignedUploadUrl(
      s3WebpKey,
      "image/webp",
    );

    console.log("[getPresignedProfileImageUrl] Generated URLs successfully");
    console.log("[getPresignedProfileImageUrl] Original S3 key:", s3Key);
    console.log("[getPresignedProfileImageUrl] WEBP S3 key:", s3WebpKey);
    console.log(
      "[getPresignedProfileImageUrl] URL preview:",
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
    console.error("[getPresignedProfileImageUrl] Error:", error);
    res.status(500).json({ ok: false, error: String(error?.message || error) });
  }
}

export async function getPresignedPhotoIdUploadUrl(
  req: Request,
  res: Response,
) {
  try {
    const { filename, contentType } = req.body || {};

    if (!filename || typeof filename !== "string" || filename.trim() === "") {
      return res.status(400).json({ ok: false, error: "filename is required" });
    }

    if (!contentType || typeof contentType !== "string") {
      return res
        .status(400)
        .json({ ok: false, error: "contentType is required" });
    }

    // Validate that it's an image or document file
    const allowedTypes = ["image/", "application/pdf"];
    const isAllowed = allowedTypes.some((type) => contentType.startsWith(type));

    if (!isAllowed) {
      return res.status(400).json({
        ok: false,
        error: "Only image and PDF files are allowed",
      });
    }

    // Generate a unique temporary ID using crypto.randomUUID to avoid collisions
    // This temp ID will be replaced with the actual user ID after signup
    const { randomUUID } = await import("crypto");
    const tempUserId = randomUUID();

    // Import S3 utilities
    const { generatePresignedVerificationUploadUrl } = await import(
      "../lib/s3"
    );

    // Generate presigned URL for photo ID upload to verification bucket
    // The file will be stored with the temp UUID, then moved to the user ID folder after signup
    const presignedUrl = await generatePresignedVerificationUploadUrl(
      tempUserId,
      "photo_id",
      filename.split(".").pop() || "jpg",
    );

    console.log("[getPresignedPhotoIdUploadUrl] Generated URL successfully");
    console.log(
      "[getPresignedPhotoIdUploadUrl] URL preview:",
      presignedUrl.substring(0, 200) + "...",
    );

    res.json({
      ok: true,
      presignedUrl,
      filename,
    });
  } catch (error: any) {
    console.error("[getPresignedPhotoIdUploadUrl] Error:", error);
    res.status(500).json({ ok: false, error: String(error?.message || error) });
  }
}

export async function createUserReview(req: Request, res: Response) {
  try {
    const reviewedUserId = Number((req.params as any)?.id);
    const reviewerId = (req as any).session?.userId;
    const { rating, comment } = req.body || {};

    if (!reviewedUserId || Number.isNaN(reviewedUserId)) {
      return res.status(400).json({ ok: false, error: "invalid user id" });
    }

    if (!reviewerId) {
      return res.status(401).json({ ok: false, error: "not authenticated" });
    }

    if (reviewerId === reviewedUserId) {
      return res
        .status(400)
        .json({ ok: false, error: "cannot review yourself" });
    }

    const parsedRating = typeof rating === "string" ? Number(rating) : rating;
    if (
      parsedRating === null ||
      parsedRating === undefined ||
      Number.isNaN(parsedRating) ||
      parsedRating < 1 ||
      parsedRating > 5
    ) {
      return res.status(400).json({ ok: false, error: "invalid rating" });
    }

    if (!comment || typeof comment !== "string" || comment.trim() === "") {
      return res.status(400).json({ ok: false, error: "comment is required" });
    }

    const result = await pool.query(
      `insert into user_reviews (reviewed_user_id, reviewer_id, rating, comment, created_at, updated_at)
       values ($1, $2, $3, $4, now(), now())
       returning id, reviewed_user_id, reviewer_id, rating, comment, created_at, updated_at`,
      [reviewedUserId, reviewerId, parsedRating, comment.trim()],
    );

    if (!result.rows || result.rows.length === 0) {
      return res
        .status(500)
        .json({ ok: false, error: "failed to create review" });
    }

    const review = result.rows[0];
    res.json({
      ok: true,
      review: {
        id: review.id,
        reviewed_user_id: review.reviewed_user_id,
        reviewer_id: review.reviewer_id,
        rating: Number(review.rating),
        comment: review.comment,
        created_at: review.created_at,
        updated_at: review.updated_at,
      },
    });
  } catch (error: any) {
    console.error("Error creating user review:", error);
    res.status(500).json({ ok: false, error: String(error?.message || error) });
  }
}

export async function getUserReviews(req: Request, res: Response) {
  try {
    const reviewedUserId = Number((req.params as any)?.id);

    if (!reviewedUserId || Number.isNaN(reviewedUserId)) {
      return res.status(400).json({ ok: false, error: "invalid user id" });
    }

    const result = await pool.query(
      `select ur.id, ur.reviewed_user_id, ur.reviewer_id, ur.rating, ur.comment, ur.created_at,
              u.username, u.avatar_url, u.name
       from user_reviews ur
       join users u on u.id = ur.reviewer_id
       where ur.reviewed_user_id = $1
       order by ur.created_at desc`,
      [reviewedUserId],
    );

    const reviews = result.rows.map((row: any) => ({
      id: row.id,
      reviewedUserId: row.reviewed_user_id,
      reviewerId: row.reviewer_id,
      rating: Number(row.rating),
      comment: row.comment,
      date: new Date(row.created_at).toLocaleDateString(),
      dateValue: new Date(row.created_at),
      reviewer: row.name || row.username || "Unknown",
      reviewerUsername: row.username,
      avatar: row.avatar_url || undefined,
    }));

    res.json({ ok: true, reviews });
  } catch (error: any) {
    console.error("Error fetching user reviews:", error);
    res.status(500).json({ ok: false, error: String(error?.message || error) });
  }
}

export async function updateUserReview(req: Request, res: Response) {
  try {
    const reviewId = Number((req.params as any)?.reviewId);
    const reviewerId = (req as any).session?.userId;
    const { rating, comment } = req.body || {};

    if (!reviewId || Number.isNaN(reviewId)) {
      return res.status(400).json({ ok: false, error: "invalid review id" });
    }

    if (!reviewerId) {
      return res.status(401).json({ ok: false, error: "not authenticated" });
    }

    const parsedRating = typeof rating === "string" ? Number(rating) : rating;
    if (
      parsedRating === null ||
      parsedRating === undefined ||
      Number.isNaN(parsedRating) ||
      parsedRating < 1 ||
      parsedRating > 5
    ) {
      return res.status(400).json({ ok: false, error: "invalid rating" });
    }

    if (!comment || typeof comment !== "string" || comment.trim() === "") {
      return res.status(400).json({ ok: false, error: "comment is required" });
    }

    const existingReview = await pool.query(
      `select reviewer_id from user_reviews where id = $1`,
      [reviewId],
    );

    if (!existingReview.rows || existingReview.rows.length === 0) {
      return res.status(404).json({ ok: false, error: "review not found" });
    }

    if (existingReview.rows[0].reviewer_id !== reviewerId) {
      return res
        .status(403)
        .json({ ok: false, error: "cannot update another user's review" });
    }

    const result = await pool.query(
      `update user_reviews set rating = $1, comment = $2, updated_at = now()
       where id = $3
       returning id, reviewed_user_id, reviewer_id, rating, comment, created_at, updated_at`,
      [parsedRating, comment.trim(), reviewId],
    );

    if (!result.rows || result.rows.length === 0) {
      return res
        .status(500)
        .json({ ok: false, error: "failed to update review" });
    }

    const review = result.rows[0];
    res.json({
      ok: true,
      review: {
        id: review.id,
        reviewed_user_id: review.reviewed_user_id,
        reviewer_id: review.reviewer_id,
        rating: Number(review.rating),
        comment: review.comment,
        created_at: review.created_at,
        updated_at: review.updated_at,
      },
    });
  } catch (error: any) {
    console.error("Error updating user review:", error);
    res.status(500).json({ ok: false, error: String(error?.message || error) });
  }
}
