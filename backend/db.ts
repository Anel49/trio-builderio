import type { Request, Response } from "express";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

export const pool = new Pool({
  connectionString,
  // Force SSL with no cert verification to avoid self-signed chain issues in dev/demo
  ssl: connectionString ? { rejectUnauthorized: false } : undefined,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 15000,
  max: 10,
});

export async function dbHealth(_req: Request, res: Response) {
  try {
    const result = await pool.query(
      "select current_database() as db, current_user as user",
    );
    res.json({ ok: true, info: result.rows[0] });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: String(error?.message || error) });
  }
}

export async function dbSchema(_req: Request, res: Response) {
  try {
    const result = await pool.query(
      `select table_schema, table_name
       from information_schema.tables
       where table_type = 'BASE TABLE'
         and table_schema not in ('pg_catalog','information_schema')
       order by 1,2
       limit 200`,
    );
    res.json({ ok: true, tables: result.rows });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: String(error?.message || error) });
  }
}

export async function dbSetup(_req: Request, res: Response) {
  try {
    console.log("[dbSetup] Starting database setup");
    await pool.query(`
      create table if not exists listings (
        id serial primary key,
        name text not null,
        price_cents integer not null,
        rating numeric(2,1),
        image_url text,
        host text,
        category text,
        description text,
        zip_code text,
        rental_period text,
        created_at timestamptz default now()
      )
    `);
    console.log("[dbSetup] Created listings table");

    await pool.query(`alter table listings drop column if exists distance`);
    console.log("[dbSetup] Dropped distance column");

    await pool.query(
      `alter table listings add column if not exists zip_code text`,
    );
    console.log("[dbSetup] Added zip_code column");

    await pool.query(
      `alter table listings add column if not exists rental_period text`,
    );
    console.log("[dbSetup] Added rental_period column");

    await pool.query(
      `alter table listings add column if not exists description text`,
    );
    console.log("[dbSetup] Added description column");

    await pool.query(
      `alter table listings add column if not exists latitude double precision`,
    );
    console.log("[dbSetup] Added latitude column");

    await pool.query(
      `alter table listings add column if not exists longitude double precision`,
    );
    console.log("[dbSetup] Added longitude column");

    await pool.query(
      `alter table listings add column if not exists delivery boolean default false`,
    );
    console.log("[dbSetup] Added delivery column");

    await pool.query(
      `alter table listings add column if not exists free_delivery boolean default false`,
    );
    console.log("[dbSetup] Added free_delivery column");

    await pool.query(
      `alter table listings add column if not exists enabled boolean default true`,
    );
    console.log("[dbSetup] Added enabled column");

    // Handle user_id column - always try to fix constraints
    try {
      // First, try to make it nullable and set default
      await pool.query(
        `alter table listings alter column user_id drop not null`,
      );
      console.log("[dbSetup] Dropped NOT NULL constraint on user_id");
    } catch (e: any) {
      console.log(
        "[dbSetup] Drop NOT NULL error (may not exist):",
        e?.message?.slice(0, 100),
      );
    }

    try {
      await pool.query(
        `alter table listings alter column user_id set default 0`,
      );
      console.log("[dbSetup] Set user_id default to 0");
    } catch (e: any) {
      console.log("[dbSetup] Set default error:", e?.message?.slice(0, 100));
    }

    try {
      await pool.query(
        `alter table listings add column if not exists user_id integer`,
      );
      console.log("[dbSetup] Added user_id column if not exists");
    } catch (e: any) {
      console.log("[dbSetup] Add column error:", e?.message?.slice(0, 100));
    }

    try {
      // Update any existing NULL values to 0
      await pool.query(`update listings set user_id = 0 where user_id is null`);
      console.log("[dbSetup] Updated NULL user_id values to 0");
    } catch (e: any) {
      console.log(
        "[dbSetup] Update NULL values error:",
        e?.message?.slice(0, 100),
      );
    }

    console.log("[dbSetup] Database setup completed successfully");
    const countRes = await pool.query(
      "select count(*)::int as count from listings",
    );
    const count: number = countRes.rows[0]?.count ?? 0;
    if (count === 0) {
      const rows: [string, number, number, string, string, string, string][] = [
        [
          "Riding Lawn Mower",
          4500,
          4.9,
          "https://images.pexels.com/photos/6728933/pexels-photo-6728933.jpeg?w=400&h=250&fit=crop&auto=format",
          "Sarah",
          "Landscaping",
          "20176",
        ],
        [
          "Designer Dress",
          3500,
          4.8,
          "https://images.pexels.com/photos/5418926/pexels-photo-5418926.jpeg?w=400&h=250&fit=crop&auto=format",
          "Michael",
          "Clothing",
          "20175",
        ],
      ];
      for (const r of rows) {
        await pool.query(
          `insert into listings (name, price_cents, rating, image_url, host, category, zip_code)
           values ($1,$2,$3,$4,$5,$6,$7)`,
          r,
        );
      }
    }
    res.json({ ok: true });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: String(error?.message || error) });
  }
}
