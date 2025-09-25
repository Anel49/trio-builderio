import type { Request, Response } from "express";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

export const pool = new Pool({
  connectionString,
  // Force SSL with no cert verification to avoid self-signed chain issues in dev/demo
  ssl: connectionString ? { rejectUnauthorized: false } : undefined,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 10000,
});

export async function dbHealth(_req: Request, res: Response) {
  try {
    const result = await pool.query(
      "select current_database() as db, current_user as user"
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
       limit 200`
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
    const countRes = await pool.query("select count(*)::int as count from listings");
    const count: number = countRes.rows[0]?.count ?? 0;
    if (count === 0) {
      const rows: [string, number, number, string, string, string, string][] = [
        ['Riding Lawn Mower', 4500, 4.9, 'https://images.pexels.com/photos/6728933/pexels-photo-6728933.jpeg?w=400&h=250&fit=crop&auto=format', 'Sarah', 'Landscaping', '2.3 miles'],
        ['Designer Dress', 3500, 4.8, 'https://images.pexels.com/photos/5418926/pexels-photo-5418926.jpeg?w=400&h=250&fit=crop&auto=format', 'Michael', 'Clothing', '1.8 miles'],
        ['Professional Tool Set', 2500, 4.7, 'https://images.pexels.com/photos/6790973/pexels-photo-6790973.jpeg?w=400&h=250&fit=crop&auto=format', 'Alex', 'Tools', '3.1 miles'],
        ['Pro Camera Kit', 7500, 4.9, 'https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=400&h=250&fit=crop&auto=format', 'Emma', 'Tech', '4.5 miles'],
        ['Party Sound System', 5500, 4.6, 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=250&fit=crop&auto=format', 'David', 'Party', '5.2 miles'],
        ['Mountain Bike', 3000, 4.7, 'https://images.unsplash.com/photo-1518655048521-f130df041f66?w=400&h=250&fit=crop&auto=format', 'Liam', 'Outdoors', '1.2 miles'],
        ['Acoustic Guitar', 2200, 4.5, 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&h=250&fit=crop&auto=format', 'Noah', 'Instruments', '2.9 miles'],
        ['Pressure Washer', 2800, 4.6, 'https://images.unsplash.com/photo-1581578017422-3eaf2b6f62b7?w=400&h=250&fit=crop&auto=format', 'Olivia', 'Tools', '3.6 miles'],
        ['Tuxedo Rental', 4000, 4.4, 'https://images.unsplash.com/photo-1542060748-10c28b62716a?w=400&h=250&fit=crop&auto=format', 'Mason', 'Clothing', '6.1 miles'],
        ['Camping Tent', 1800, 4.3, 'https://images.unsplash.com/photo-1504280390368-3971e38c98e8?w=400&h=250&fit=crop&auto=format', 'Ava', 'Outdoors', '7.4 miles'],
      ];
      for (const r of rows) {
        await pool.query(
          `insert into listings (name, price_cents, rating, image_url, host, category, distance)
           values ($1,$2,$3,$4,$5,$6,$7)`, r
        );
      }
    }
    res.json({ ok: true });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: String(error?.message || error) });
  }
}
