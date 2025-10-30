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

    const result = await pool.query(
      `insert into users (name, email, avatar_url, latitude, longitude, location_city, founding_supporter, top_referrer, ambassador, open_dms, username)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
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
         username = coalesce(excluded.username, users.username)
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
