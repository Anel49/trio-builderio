import type { Request, Response } from "express";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

export const pool = new Pool({
  connectionString,
  // Force SSL with no cert verification to avoid self-signed chain issues in dev/demo
  ssl: connectionString ? { rejectUnauthorized: false } : undefined,
  connectionTimeoutMillis: 3000,
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
        description text,
        created_at timestamptz default now()
      );
      alter table listings add column if not exists description text;
      create table if not exists listing_images (
        id serial primary key,
        listing_id integer not null references listings(id) on delete cascade,
        url text not null,
        position integer,
        created_at timestamptz default now()
      );
      insert into listing_images (listing_id, url, position)
      select l.id, l.image_url, 1
      from listings l
      where l.image_url is not null
        and not exists (
          select 1 from listing_images li where li.listing_id = l.id
        );
      create table if not exists listing_categories (
        id serial primary key,
        listing_id integer not null references listings(id) on delete cascade,
        category text not null,
        position integer,
        created_at timestamptz default now()
      );
      -- Backfill categories from listings.category for existing rows
      insert into listing_categories (listing_id, category, position)
      select id, category, 1
      from listings l
      where l.category is not null
        and not exists (
          select 1 from listing_categories lc where lc.listing_id = l.id
        );

      create table if not exists users (
        id serial primary key,
        name text,
        email text unique,
        avatar_url text,
        created_at timestamptz default now()
      );
      alter table users add column if not exists founding_supporter boolean default false;
      alter table users add column if not exists top_referrer boolean default false;
      alter table users add column if not exists ambassador boolean default false;
      create table if not exists reservations (
        id serial primary key,
        listing_id integer not null references listings(id) on delete cascade,
        renter text,
        start_date date not null,
        end_date date not null,
        status text default 'pending',
        created_at timestamptz default now()
      );
      create table if not exists favorites (
        user_id text not null,
        listing_id integer not null references listings(id) on delete cascade,
        created_at timestamptz default now(),
        primary key (user_id, listing_id)
      );
      create table if not exists messages (
        id serial primary key,
        thread_id text,
        from_name text,
        to_name text,
        body text,
        created_at timestamptz default now()
      );
      create table if not exists reviews (
        id serial primary key,
        listing_id integer not null references listings(id) on delete cascade,
        reviewer text,
        rating numeric(2,1),
        comment text,
        created_at timestamptz default now()
      );
    `);
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
        [
          "Professional Tool Set",
          2500,
          4.7,
          "https://images.pexels.com/photos/6790973/pexels-photo-6790973.jpeg?w=400&h=250&fit=crop&auto=format",
          "Alex",
          "Tools",
          "3.1 miles",
        ],
        [
          "Pro Camera Kit",
          7500,
          4.9,
          "https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=400&h=250&fit=crop&auto=format",
          "Emma",
          "Tech",
          "4.5 miles",
        ],
        [
          "Party Sound System",
          5500,
          4.6,
          "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=250&fit=crop&auto=format",
          "David",
          "Party",
          "5.2 miles",
        ],
        [
          "Mountain Bike",
          3000,
          4.7,
          "https://images.unsplash.com/photo-1518655048521-f130df041f66?w=400&h=250&fit=crop&auto=format",
          "Liam",
          "Outdoors",
          "1.2 miles",
        ],
        [
          "Acoustic Guitar",
          2200,
          4.5,
          "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&h=250&fit=crop&auto=format",
          "Noah",
          "Instruments",
          "2.9 miles",
        ],
        [
          "Pressure Washer",
          2800,
          4.6,
          "https://images.unsplash.com/photo-1581578017422-3eaf2b6f62b7?w=400&h=250&fit=crop&auto=format",
          "Olivia",
          "Tools",
          "3.6 miles",
        ],
        [
          "Tuxedo Rental",
          4000,
          4.4,
          "https://images.unsplash.com/photo-1542060748-10c28b62716a?w=400&h=250&fit=crop&auto=format",
          "Mason",
          "Clothing",
          "6.1 miles",
        ],
        [
          "Camping Tent",
          1800,
          4.3,
          "https://images.unsplash.com/photo-1504280390368-3971e38c98e8?w=400&h=250&fit=crop&auto=format",
          "Ava",
          "Outdoors",
          "7.4 miles",
        ],
      ];
      for (const r of rows) {
        const ins = await pool.query(
          `insert into listings (name, price_cents, rating, image_url, host, category, distance)
           values ($1,$2,$3,$4,$5,$6,$7)
           returning id`,
          r,
        );
        const listingId = ins.rows[0].id;
        await pool.query(
          `insert into listing_images (listing_id, url, position) values ($1, $2, $3)
           on conflict do nothing`,
          [listingId, r[3], 1],
        );
        await pool.query(
          `insert into listing_categories (listing_id, category, position) values ($1, $2, 1)
           on conflict do nothing`,
          [listingId, r[5]],
        );
      }
    }

    // Ensure a handful of listings have multiple images for testing the gallery UI
    await pool.query(`
      insert into listing_images (listing_id, url, position)
      select l.id, v.url, v.position
      from (
        values
          ('Riding Lawn Mower', 'https://images.unsplash.com/photo-1508898578281-774ac4893bd0?w=600&h=400&fit=crop&auto=format', 2),
          ('Riding Lawn Mower', 'https://images.unsplash.com/photo-1529429612778-cf6435cdae84?w=600&h=400&fit=crop&auto=format', 3),
          ('Pro Camera Kit', 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&h=400&fit=crop&auto=format', 2),
          ('Pro Camera Kit', 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&h=400&fit=crop&auto=format', 3),
          ('Mountain Bike', 'https://images.unsplash.com/photo-1509395062183-67c5ad6faff9?w=600&h=400&fit=crop&auto=format', 2),
          ('Mountain Bike', 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600&h=400&fit=crop&auto=format', 3),
          ('Acoustic Guitar', 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=600&h=400&fit=crop&auto=format', 2),
          ('Acoustic Guitar', 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=600&h=400&fit=crop&auto=format', 3),
          ('Pressure Washer', 'https://images.unsplash.com/photo-1518773553398-650c184e0bb3?w=600&h=400&fit=crop&auto=format', 2),
          ('Pressure Washer', 'https://images.unsplash.com/photo-1551646332-90688fae07f1?w=600&h=400&fit=crop&auto=format', 3)
      ) as v(name, url, position)
      join listings l on l.name = v.name
      where not exists (
        select 1 from listing_images li where li.listing_id = l.id and li.url = v.url
      );
    `);

    // Seed reservations for the first 3 listings (by name) to replace demo data
    await pool.query(`
      insert into reservations (listing_id, renter, start_date, end_date, status)
      select l.id, r.renter, r.start_date::date, r.end_date::date, r.status
      from (
        values
          ('Riding Lawn Mower', 'Alice', '2025-10-15', '2025-10-17', 'confirmed'),
          ('Riding Lawn Mower', 'Bob',   '2025-09-22', '2025-09-28', 'confirmed'),
          ('Designer Dress',   'Cara',  '2025-06-18', '2025-06-20', 'confirmed'),
          ('Designer Dress',   'Dan',   '2025-07-10', '2025-07-12', 'completed'),
          ('Professional Tool Set', 'Eve', '2025-08-05', '2025-08-07', 'confirmed'),
          ('Professional Tool Set', 'Frank','2025-09-10', '2025-09-12', 'pending')
      ) as r(name, renter, start_date, end_date, status)
      join listings l on l.name = r.name
      where not exists (
        select 1 from reservations x
        where x.listing_id = l.id and x.start_date = r.start_date::date and x.end_date = r.end_date::date
      );
    `);

    res.json({ ok: true });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: String(error?.message || error) });
  }
}
