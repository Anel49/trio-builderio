import type { Request, Response } from "express";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

export const pool = new Pool({
  connectionString,
  ssl:
    connectionString && connectionString.includes("sslmode=require")
      ? { rejectUnauthorized: false }
      : undefined,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 10000,
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
    await pool.query(`
      create table if not exists listings (
        id serial primary key,
        name text not null,
        price_cents integer not null,
        rating numeric(2,1),
        image_url text,
        host text,
        category text,
        distance text,
        created_at timestamptz default now()
      )
    `);
    const countRes = await pool.query(
      "select count(*)::int as count from listings",
    );
    const count: number = countRes.rows[0]?.count ?? 0;
    if (count === 0) {
      const rows: [
        string,
        number,
        number,
        string,
        string,
        string,
        string,
      ][] = [
        [
          "Riding Lawn Mower",
          4500,
          4.9,
          "https://images.pexels.com/photos/6728933/pexels-photo-6728933.jpeg?w=400&h=250&fit=crop&auto=format",
          "Sarah",
          "Landscaping",
          "2.3 miles",
        ],
        [
          "Designer Dress",
          3500,
          4.8,
          "https://images.pexels.com/photos/5418926/pexels-photo-5418926.jpeg?w=400&h=250&fit=crop&auto=format",
          "Michael",
          "Clothing",
          "1.8 miles",
        ],
      ];
      for (const r of rows) {
        await pool.query(
          `insert into listings (name, price_cents, rating, image_url, host, category, distance)
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
