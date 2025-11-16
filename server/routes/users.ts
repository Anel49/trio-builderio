import type { Request, Response } from "express";
import { pool } from "./db";
import * as argon2 from "argon2";

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
            coalesce(open_dms,true) as open_dms
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
            coalesce(open_dms,true) as open_dms
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
            coalesce(open_dms,true) as open_dms
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
       returning id, name, email, username, avatar_url, created_at`,
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
    const hashedPassword = await argon2.hash(passwordStr);

    const credResult = await pool.query(
      `insert into user_credentials (user_id, first_name, last_name, email, password, photo_id)
       values ($1, $2, $3, $4, $5, $6)
       returning id`,
      [userId, firstNameStr, lastNameStr, emailStr, hashedPassword, photoIdStr],
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
    const { email, password } = (req.body || {}) as any;

    const emailStr = typeof email === "string" ? email.trim() : "";
    const passwordStr = typeof password === "string" ? password : "";

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
              coalesce(open_dms,true) as open_dms
       from users where id = $1`,
      [cred.user_id],
    );

    if (!userResult.rowCount || userResult.rowCount === 0) {
      return res.status(400).json({ ok: false, error: "user not found" });
    }

    const user = rowToUser(userResult.rows[0]);

    (req as any).session.userId = user.id;
    (req as any).session.user = user;

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

    if (!passwordStr) {
      return res.status(400).json({
        ok: false,
        error: "password is required for security",
      });
    }

    // Verify password
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

    // TODO: Generate a password reset token and send it via email
    // This would typically involve:
    // 1. Creating a reset token (JWT or random string)
    // 2. Storing the token with an expiration time in the database
    // 3. Sending an email with a reset link containing the token
    // For now, just log the request
    console.log(`Password reset requested for email: ${emailStr}`);

    res.json({
      ok: true,
      message:
        "If an account exists with this email, a password reset link has been sent",
    });
  } catch (error: any) {
    console.error("Password reset request error:", error);
    res.status(500).json({ ok: false, error: String(error?.message || error) });
  }
}
