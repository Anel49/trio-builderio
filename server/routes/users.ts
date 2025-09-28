import type { Request, Response } from "express";
import { pool } from "./db";

function rowToUser(r: any) {
  return {
    id: r.id,
    name: r.name || null,
    email: r.email || null,
    avatarUrl: r.avatar_url || null,
    createdAt: r.created_at,
    foundingSupporter: Boolean(r.founding_supporter),
    topReferrer: Boolean(r.top_referrer),
    ambassador: Boolean(r.ambassador),
  };
}

async function ensureBadgeColumns() {
  try {
    await pool.query(
      `alter table users add column if not exists founding_supporter boolean default false;
       alter table users add column if not exists top_referrer boolean default false;
       alter table users add column if not exists ambassador boolean default false;`,
    );
  } catch {}
}

export async function getUserByEmail(req: Request, res: Response) {
  try {
    const email = String((req.query as any)?.email || "").trim();
    if (!email) {
      return res.status(400).json({ ok: false, error: "email is required" });
    }
    try {
      const result = await pool.query(
        `select id, name, email, avatar_url, created_at,
                coalesce(founding_supporter,false) as founding_supporter,
                coalesce(top_referrer,false) as top_referrer,
                coalesce(ambassador,false) as ambassador
         from users where email = $1 limit 1`,
        [email],
      );
      if (result.rowCount === 0) {
        return res.json({ ok: true, user: null });
      }
      const user = rowToUser(result.rows[0]);
      return res.json({ ok: true, user });
    } catch {
      // Columns might not exist yet
      const result = await pool.query(
        `select id, name, email, avatar_url, created_at from users where email = $1 limit 1`,
        [email],
      );
      if (result.rowCount === 0) return res.json({ ok: true, user: null });
      const base = result.rows[0];
      const user = {
        id: base.id,
        name: base.name || null,
        email: base.email || null,
        avatarUrl: base.avatar_url || null,
        createdAt: base.created_at,
        foundingSupporter: false,
        topReferrer: false,
        ambassador: false,
      };
      return res.json({ ok: true, user });
    }
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
      founding_supporter,
      top_referrer,
      ambassador,
    } = (req.body || {}) as any;

    const emailStr = typeof email === "string" ? email.trim() : "";
    if (!emailStr) {
      return res.status(400).json({ ok: false, error: "email is required" });
    }

    await ensureBadgeColumns();

    const result = await pool.query(
      `insert into users (name, email, avatar_url, founding_supporter, top_referrer, ambassador)
       values ($1,$2,$3,$4,$5,$6)
       on conflict (email) do update set
         name = coalesce(excluded.name, users.name),
         avatar_url = coalesce(excluded.avatar_url, users.avatar_url),
         founding_supporter = coalesce(excluded.founding_supporter, users.founding_supporter),
         top_referrer = coalesce(excluded.top_referrer, users.top_referrer),
         ambassador = coalesce(excluded.ambassador, users.ambassador)
       returning id, name, email, avatar_url, created_at,
                 coalesce(founding_supporter,false) as founding_supporter,
                 coalesce(top_referrer,false) as top_referrer,
                 coalesce(ambassador,false) as ambassador`,
      [
        typeof name === "string" ? name : null,
        emailStr,
        typeof avatar_url === "string" ? avatar_url : null,
        Boolean(founding_supporter),
        Boolean(top_referrer),
        Boolean(ambassador),
      ],
    );

    const user = rowToUser(result.rows[0]);
    res.json({ ok: true, user });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: String(error?.message || error) });
  }
}
