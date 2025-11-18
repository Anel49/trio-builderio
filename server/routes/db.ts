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
        description text,
        zip_code text,
        latitude double precision,
        longitude double precision,
        created_at timestamptz default now()
      );
      alter table listings drop column if exists distance;
      alter table listings add column if not exists zip_code text;
      alter table listings add column if not exists rental_period text;
      alter table listings add column if not exists description text;
      alter table listings add column if not exists latitude double precision;
      alter table listings add column if not exists longitude double precision;
      alter table listings add column if not exists delivery boolean default false;
      alter table listings add column if not exists free_delivery boolean default false;
      alter table listings add column if not exists location_city text;
      alter table listings add column if not exists user_id integer references users(id) on delete set null;
      alter table listings add column if not exists enabled boolean default true;
      alter table listings add column if not exists instant_bookings boolean default false;
      create table if not exists listing_images (
        id serial primary key,
        listing_id integer not null references listings(id),
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
        listing_id integer not null references listings(id),
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
      alter table users add column if not exists open_dms boolean default true;
      alter table users add column if not exists latitude double precision;
      alter table users add column if not exists longitude double precision;
      alter table users add column if not exists location_city text;
      alter table users add column if not exists first_name text;
      alter table users add column if not exists last_name text;
      alter table users add column if not exists username text unique;
      create table if not exists reservations (
        id serial primary key,
        listing_id integer not null references listings(id),
        renter_id integer references users(id) on delete set null,
        host_id integer,
        start_date date not null,
        end_date date not null,
        status text default 'pending',
        created_at timestamptz default now(),
        host_name text,
        renter_name text,
        listing_title text,
        listing_image text,
        listing_latitude double precision,
        listing_longitude double precision,
        daily_price_cents integer,
        total_days integer,
        rental_type text default 'item',
        last_modified timestamptz default now(),
        modified_by_id text
      );
      create table if not exists favorites (
        user_id text not null,
        listing_id integer not null references listings(id),
        listing_name text,
        listing_image text,
        listing_host text,
        created_at timestamptz default now(),
        primary key (user_id, listing_id)
      );
      create table if not exists messages (
        id serial primary key,
        thread_id text,
        from_id integer references users(id) on delete set null,
        to_id integer references users(id) on delete set null,
        body text,
        created_at timestamptz default now()
      );
      -- Migration: Rename from_name/to_name to from_id/to_id if they still exist
      do $$
      begin
        if exists (select 1 from information_schema.columns where table_name = 'messages' and column_name = 'from_name') then
          alter table messages drop column from_name;
        end if;
        if exists (select 1 from information_schema.columns where table_name = 'messages' and column_name = 'to_name') then
          alter table messages drop column to_name;
        end if;
        if not exists (select 1 from information_schema.columns where table_name = 'messages' and column_name = 'from_id') then
          alter table messages add column from_id integer references users(id) on delete set null;
        end if;
        if not exists (select 1 from information_schema.columns where table_name = 'messages' and column_name = 'to_id') then
          alter table messages add column to_id integer references users(id) on delete set null;
        end if;
      end $$;
      create table if not exists reviews (
        id serial primary key,
        listing_id integer not null references listings(id),
        reviewer text,
        rating numeric(2,1),
        comment text,
        created_at timestamptz default now()
      );
      create table if not exists listing_reviews (
        id serial primary key,
        listing_id integer not null references listings(id),
        reviewer_id integer not null references users(id),
        rating numeric(2,1) not null,
        comment text,
        helpful_count integer default 0,
        created_at timestamptz default now(),
        updated_at timestamptz default now()
      );
      create index if not exists idx_listing_reviews_listing_id on listing_reviews(listing_id);
      create index if not exists idx_listing_reviews_reviewer_id on listing_reviews(reviewer_id);
      create index if not exists idx_listing_reviews_created_at on listing_reviews(created_at);
      create table if not exists user_reviews (
        id serial primary key,
        reviewed_user_id integer not null references users(id),
        reviewer_id integer not null references users(id),
        rating numeric(2,1) not null,
        comment text,
        related_listing_id integer references listings(id),
        created_at timestamptz default now(),
        updated_at timestamptz default now()
      );
      create index if not exists idx_user_reviews_reviewed_user_id on user_reviews(reviewed_user_id);
      create index if not exists idx_user_reviews_reviewer_id on user_reviews(reviewer_id);
      create index if not exists idx_user_reviews_related_listing_id on user_reviews(related_listing_id);
      create index if not exists idx_user_reviews_created_at on user_reviews(created_at);

      -- Create sequence for order_id starting at 10000
      create sequence if not exists order_id_seq start with 10000;

      create table if not exists user_credentials (
        id serial primary key,
        user_id integer not null references users(id),
        first_name text not null,
        last_name text not null,
        email text not null unique,
        password text not null,
        photo_id text,
        created_at timestamptz default now()
      );

      create table if not exists orders (
        id serial primary key,
        order_id integer not null unique,
        host_id integer references users(id),
        host_name text,
        host_email text,
        renter_id integer references users(id),
        renter_name text,
        renter_email text,
        listing_title text,
        listing_image text,
        listing_latitude double precision,
        listing_longitude double precision,
        listing_zip_code text,
        daily_price_cents integer,
        platform_charge_cents integer,
        total_days integer,
        subtotal_cents integer,
        discount_percentage numeric(5, 3),
        discount_cents integer,
        tax_percentage numeric(5, 3),
        tax_cents integer,
        total_cents integer,
        currency text default 'USD',
        payment_status text default 'pending',
        start_date timestamptz,
        end_date timestamptz,
        rental_type text default 'item',
        status text default 'confirmed',
        review_id integer,
        review_message text,
        created_at timestamptz default now(),
        last_modified timestamptz,
        modified_by_id integer,
        constraint fk_orders_reservation_review foreign key (review_id) references listing_reviews(id)
      );

      -- Create indexes for orders table
      create index if not exists idx_orders_order_id on orders(order_id);
      create index if not exists idx_orders_host_id on orders(host_id);
      create index if not exists idx_orders_renter_id on orders(renter_id);
      create index if not exists idx_orders_payment_status on orders(payment_status);
      create index if not exists idx_orders_status on orders(status);
      create index if not exists idx_orders_created_at on orders(created_at);
    `);

    // Add new columns to reservations table if they don't exist
    try {
      await pool.query(
        `alter table reservations add column if not exists host_id integer`,
      );
      console.log("[dbSetup] Added host_id column to reservations");
    } catch (e: any) {
      console.log("[dbSetup] host_id column already exists");
    }

    try {
      await pool.query(
        `alter table reservations add column if not exists host_name text`,
      );
      console.log("[dbSetup] Added host_name column to reservations");
    } catch (e: any) {
      console.log("[dbSetup] host_name column already exists");
    }

    try {
      await pool.query(
        `alter table reservations add column if not exists renter_name text`,
      );
      console.log("[dbSetup] Added renter_name column to reservations");
    } catch (e: any) {
      console.log("[dbSetup] renter_name column already exists");
    }

    try {
      await pool.query(
        `alter table reservations add column if not exists listing_title text`,
      );
      console.log("[dbSetup] Added listing_title column to reservations");
    } catch (e: any) {
      console.log("[dbSetup] listing_title column already exists");
    }

    try {
      await pool.query(
        `alter table reservations add column if not exists listing_image text`,
      );
      console.log("[dbSetup] Added listing_image column to reservations");
    } catch (e: any) {
      console.log("[dbSetup] listing_image column already exists");
    }

    try {
      await pool.query(
        `alter table reservations add column if not exists listing_latitude double precision`,
      );
      console.log("[dbSetup] Added listing_latitude column to reservations");
    } catch (e: any) {
      console.log("[dbSetup] listing_latitude column already exists");
    }

    try {
      await pool.query(
        `alter table reservations add column if not exists listing_longitude double precision`,
      );
      console.log("[dbSetup] Added listing_longitude column to reservations");
    } catch (e: any) {
      console.log("[dbSetup] listing_longitude column already exists");
    }

    try {
      await pool.query(
        `alter table reservations add column if not exists daily_price_cents integer`,
      );
      console.log("[dbSetup] Added daily_price_cents column to reservations");
    } catch (e: any) {
      console.log("[dbSetup] daily_price_cents column already exists");
    }

    try {
      await pool.query(
        `alter table reservations add column if not exists total_days integer`,
      );
      console.log("[dbSetup] Added total_days column to reservations");
    } catch (e: any) {
      console.log("[dbSetup] total_days column already exists");
    }

    try {
      await pool.query(
        `alter table reservations add column if not exists rental_type text default 'item'`,
      );
      console.log("[dbSetup] Added rental_type column to reservations");
    } catch (e: any) {
      console.log("[dbSetup] rental_type column already exists");
    }

    try {
      await pool.query(
        `alter table reservations add column if not exists last_modified timestamptz default now()`,
      );
      console.log("[dbSetup] Added last_modified column to reservations");
    } catch (e: any) {
      console.log("[dbSetup] last_modified column already exists");
    }

    try {
      await pool.query(
        `alter table reservations add column if not exists modified_by_id text`,
      );
      console.log("[dbSetup] Added modified_by_id column to reservations");
    } catch (e: any) {
      console.log("[dbSetup] modified_by_id column already exists");
    }

    // Change modified_by_id type to text if it exists as integer
    try {
      await pool.query(
        `alter table reservations alter column modified_by_id type text`,
      );
      console.log("[dbSetup] Changed modified_by_id column type to text");
    } catch (e: any) {
      console.log(
        "[dbSetup] Could not change modified_by_id type:",
        e?.message?.slice(0, 100),
      );
    }

    // Add new columns to favorites table if they don't exist
    try {
      await pool.query(
        `alter table favorites add column if not exists listing_name text`,
      );
      console.log("[dbSetup] Added listing_name column to favorites");
    } catch (e: any) {
      console.log("[dbSetup] listing_name column already exists");
    }

    try {
      await pool.query(
        `alter table favorites add column if not exists listing_image text`,
      );
      console.log("[dbSetup] Added listing_image column to favorites");
    } catch (e: any) {
      console.log("[dbSetup] listing_image column already exists");
    }

    try {
      await pool.query(
        `alter table favorites add column if not exists listing_host text`,
      );
      console.log("[dbSetup] Added listing_host column to favorites");
    } catch (e: any) {
      console.log("[dbSetup] listing_host column already exists");
    }

    // Remove any restrictive foreign key constraints to allow perpetual data
    try {
      console.log("[dbSetup] Removing restrictive foreign key constraints...");

      // Drop RESTRICT constraints - keep references but allow deletion
      const constraintsToDrop = [
        { table: "listing_images", column: "listing_id" },
        { table: "listing_categories", column: "listing_id" },
        { table: "reservations", column: "listing_id" },
        { table: "favorites", column: "listing_id" },
        { table: "reviews", column: "listing_id" },
        { table: "listing_reviews", column: "listing_id" },
        { table: "listing_reviews", column: "reviewer_id" },
        { table: "user_reviews", column: "reviewed_user_id" },
        { table: "user_reviews", column: "reviewer_id" },
        { table: "user_credentials", column: "user_id" },
      ];

      for (const constraint of constraintsToDrop) {
        const constraintName = `${constraint.table}_${constraint.column}_fkey`;
        try {
          // Drop the constraint if it exists with RESTRICT
          await pool.query(
            `alter table ${constraint.table} drop constraint if exists ${constraintName}`,
          );
          console.log(`[dbSetup] Dropped constraint ${constraintName}`);
        } catch (e: any) {
          console.log(
            `[dbSetup] Could not drop ${constraintName}:`,
            e?.message?.slice(0, 100),
          );
        }
      }

      // Drop message constraints
      const messageConstraints = ["from_id", "to_id"];
      for (const column of messageConstraints) {
        const constraintName = `messages_${column}_fkey`;
        try {
          await pool.query(
            `alter table messages drop constraint if exists ${constraintName}`,
          );
          console.log(`[dbSetup] Dropped constraint ${constraintName}`);
        } catch (e: any) {
          console.log(
            `[dbSetup] Could not drop ${constraintName}:`,
            e?.message?.slice(0, 100),
          );
        }
      }
    } catch (e: any) {
      console.log("[dbSetup] Error removing constraints:", e?.message);
    }

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
        number,
        number,
      ][] = [
        [
          "Riding Lawn Mower",
          4500,
          4.9,
          "https://images.pexels.com/photos/6728933/pexels-photo-6728933.jpeg?w=400&h=250&fit=crop&auto=format",
          "Sarah",
          "Landscaping",
          "20176",
          39.0426,
          -77.6054,
        ],
        [
          "Designer Dress",
          3500,
          4.8,
          "https://images.pexels.com/photos/5418926/pexels-photo-5418926.jpeg?w=400&h=250&fit=crop&auto=format",
          "Michael",
          "Clothing",
          "20175",
          39.048,
          -77.598,
        ],
        [
          "Professional Tool Set",
          2500,
          4.7,
          "https://images.pexels.com/photos/6790973/pexels-photo-6790973.jpeg?w=400&h=250&fit=crop&auto=format",
          "Alex",
          "Tools",
          "20147",
          38.995,
          -77.485,
        ],
        [
          "Pro Camera Kit",
          7500,
          4.9,
          "https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=400&h=250&fit=crop&auto=format",
          "Emma",
          "Tech",
          "20148",
          38.992,
          -77.492,
        ],
        [
          "Party Sound System",
          5500,
          4.6,
          "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=250&fit=crop&auto=format",
          "David",
          "Party",
          "20164",
          39.075,
          -77.525,
        ],
        [
          "Mountain Bike",
          3000,
          4.7,
          "https://images.unsplash.com/photo-1518655048521-f130df041f66?w=400&h=250&fit=crop&auto=format",
          "Liam",
          "Outdoors",
          "22102",
          38.855,
          -77.465,
        ],
        [
          "Acoustic Guitar",
          2200,
          4.5,
          "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&h=250&fit=crop&auto=format",
          "Noah",
          "Instruments",
          "20001",
          38.9072,
          -77.0369,
        ],
        [
          "Pressure Washer",
          2800,
          4.6,
          "https://images.unsplash.com/photo-1581578017422-3eaf2b6f62b7?w=400&h=250&fit=crop&auto=format",
          "Olivia",
          "Tools",
          "20190",
          39.065,
          -77.545,
        ],
        [
          "Tuxedo Rental",
          4000,
          4.4,
          "https://images.unsplash.com/photo-1542060748-10c28b62716a?w=400&h=250&fit=crop&auto=format",
          "Mason",
          "Clothing",
          "22201",
          38.845,
          -77.055,
        ],
        [
          "Camping Tent",
          1800,
          4.3,
          "https://images.unsplash.com/photo-1504280390368-3971e38c98e8?w=400&h=250&fit=crop&auto=format",
          "Ava",
          "Outdoors",
          "22030",
          38.795,
          -77.225,
        ],
      ];
      const rentalPeriods = [
        "Daily",
        "Weekly",
        "Daily",
        "Monthly",
        "Weekly",
        "Daily",
        "Hourly",
        "Weekly",
        "Daily",
        "Monthly",
      ];
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        const rentalPeriod = rentalPeriods[i] || "Daily";
        const ins = await pool.query(
          `insert into listings (name, price_cents, rating, image_url, host, category, zip_code, latitude, longitude, rental_period)
           values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
           returning id`,
          [...r, rentalPeriod],
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

    // Update existing listings with latitude/longitude coordinates
    const coordinateMap: Record<string, [number, number]> = {
      "Riding Lawn Mower": [39.0426, -77.6054],
      "Designer Dress": [39.048, -77.598],
      "Professional Tool Set": [38.995, -77.485],
      "Pro Camera Kit": [38.992, -77.492],
      "Party Sound System": [39.075, -77.525],
      "Mountain Bike": [38.855, -77.465],
      "Acoustic Guitar": [38.9072, -77.0369],
      "Pressure Washer": [39.065, -77.545],
      "Tuxedo Rental": [38.845, -77.055],
      "Camping Tent": [38.795, -77.225],
    };

    for (const [name, [lat, lng]] of Object.entries(coordinateMap)) {
      await pool.query(
        `update listings set latitude = $1, longitude = $2 where name = $3 and (latitude is null or longitude is null)`,
        [lat, lng, name],
      );
    }

    // Update existing listings with different rental periods (cycle through all periods)
    const periods = ["Daily", "Weekly", "Monthly", "Hourly"];
    const listingsResult = await pool.query(
      "select id from listings order by id",
    );
    for (let i = 0; i < listingsResult.rows.length; i++) {
      const id = listingsResult.rows[i].id;
      const period = periods[i % periods.length];
      try {
        const result = await pool.query(
          `update listings set rental_period = $1 where id = $2`,
          [period, id],
        );
        console.log(
          `Updated listing ${id} to ${period}, affected rows:`,
          result.rowCount,
        );
      } catch (e) {
        console.error(`Failed to update listing ${id}:`, e);
      }
    }

    // Verify the updates
    const verifyResult = await pool.query(
      "select id, rental_period from listings order by id",
    );
    console.log(
      "[dbSetup] Verified rental periods:",
      verifyResult.rows
        .map((r: any) => `${r.id}:${r.rental_period}`)
        .join(", "),
    );

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
    // For now, reservations are created without a renter_id until renting functionality is implemented
    // await pool.query(`
    //   insert into reservations (listing_id, renter_id, start_date, end_date, status)
    //   select l.id, NULL, r.start_date::date, r.end_date::date, r.status
    //   from (
    //     values
    //       ('Riding Lawn Mower', '2025-10-15', '2025-10-17', 'confirmed'),
    //       ('Riding Lawn Mower', '2025-09-22', '2025-09-28', 'confirmed'),
    //       ('Designer Dress',   '2025-06-18', '2025-06-20', 'confirmed'),
    //       ('Designer Dress',   '2025-07-10', '2025-07-12', 'completed'),
    //       ('Professional Tool Set', '2025-08-05', '2025-08-07', 'confirmed'),
    //       ('Professional Tool Set', '2025-09-10', '2025-09-12', 'pending')
    //   ) as r(name, start_date, end_date, status)
    //   join listings l on l.name = r.name
    //   where not exists (
    //     select 1 from reservations x
    //     where x.listing_id = l.id and x.start_date = r.start_date::date and x.end_date = r.end_date::date
    //   );
    // `);

    // Seed favorites disabled - user will add them manually after backend setup
    // (favorites table now requires listing_name, listing_image, listing_host)

    // Seed messages between two users (will use first two users in the system)
    const usersResult = await pool.query(
      `SELECT id FROM users ORDER BY id LIMIT 2`,
    );

    if (usersResult.rows.length >= 2) {
      const user1Id = usersResult.rows[0].id;
      const user2Id = usersResult.rows[1].id;

      await pool.query(
        `
        insert into messages (from_id, to_id, body, created_at)
        values
          ($1, $2, 'Hi! I''m interested in renting your lawn mower this weekend.', now() - interval '5 hours'),
          ($2, $1, 'Sure! It''s available. When would you like to pick it up?', now() - interval '4 hours 50 minutes'),
          ($1, $2, 'Saturday morning would be perfect. Around 9 AM?', now() - interval '4 hours 30 minutes'),
          ($2, $1, 'That works perfectly! My address is 123 Oak Street. I''ll have it ready for you.', now() - interval '4 hours'),
          ($1, $2, 'Thanks! Should I bring anything?', now() - interval '3 hours 45 minutes'),
          ($2, $1, 'Just bring a valid ID for verification and payment method.', now() - interval '3 hours 30 minutes'),
          ($1, $2, 'Sounds good! See you Saturday.', now() - interval '3 hours'),
          ($2, $1, 'Great! Looking forward to it.', now() - interval '2 hours 50 minutes'),
          ($1, $2, 'The lawn mower worked great! Thanks so much.', now() - interval '30 minutes'),
          ($2, $1, 'Glad to hear it! Thanks for renting from me!', now() - interval '10 minutes')
        on conflict do nothing
      `,
        [user1Id, user2Id],
      );

      console.log(
        `[dbSetup] Created messages between users ${user1Id} and ${user2Id}`,
      );
    }

    // Seed 25 messages between users 61 and 70 (if those users exist)
    try {
      await pool.query(
        `
        insert into messages (from_id, to_id, body, created_at)
        values
          (61, 65, 'Hey! Are you still interested in the camera equipment?', now() - interval '6 days'),
          (65, 61, 'Yes! Is it still available?', now() - interval '6 days - 50 minutes'),
          (61, 65, 'Yes, absolutely. I can meet tomorrow afternoon if that works.', now() - interval '6 days - 40 minutes'),
          (65, 61, 'Tomorrow sounds great! What time?', now() - interval '6 days - 30 minutes'),
          (61, 65, 'How about 2 PM at the coffee shop downtown?', now() - interval '6 days - 20 minutes'),
          (65, 61, 'Perfect! See you then!', now() - interval '6 days - 10 minutes'),
          (62, 68, 'Hi, I''m looking at your camping gear listing. Do you have the tent in stock?', now() - interval '5 days'),
          (68, 62, 'Yes, I do! It''s in great condition, barely used.', now() - interval '5 days - 1 hour'),
          (62, 68, 'That''s great! What''s the best time to come see it?', now() - interval '5 days - 2 hours'),
          (68, 62, 'Weekends work best for me. How about Saturday?', now() - interval '5 days - 3 hours'),
          (63, 70, 'Thanks for the quick response about the tools!', now() - interval '4 days'),
          (70, 63, 'Happy to help! When can you pick them up?', now() - interval '4 days - 30 minutes'),
          (63, 70, 'This Friday evening if possible?', now() - interval '4 days - 1 hour'),
          (70, 63, 'Friday evening works perfectly!', now() - interval '4 days - 1 hour 30 minutes'),
          (64, 66, 'Hi! Is the bicycle still available for rent?', now() - interval '3 days'),
          (66, 64, 'Yes it is! Very reliable and well maintained.', now() - interval '3 days - 45 minutes'),
          (64, 66, 'Excellent! What are your rental rates?', now() - interval '3 days - 1 hour 30 minutes'),
          (66, 64, 'It''s $20 per day or $100 per week. Interested?', now() - interval '3 days - 2 hours'),
          (64, 66, 'That sounds reasonable. I''d like to rent it for two weeks!', now() - interval '3 days - 2 hours 30 minutes'),
          (66, 64, 'Fantastic! Let''s arrange a time to get you set up!', now() - interval '3 days - 3 hours'),
          (61, 70, 'Hi! Quick question about your listing.', now() - interval '2 days'),
          (70, 61, 'Sure, what would you like to know?', now() - interval '2 days - 20 minutes'),
          (61, 70, 'Can you provide more details about the condition?', now() - interval '2 days - 40 minutes'),
          (70, 61, 'Of course! It''s in excellent condition, no issues at all.', now() - interval '2 days - 1 hour'),
          (67, 69, 'This is exactly what I''ve been looking for! When can we connect?', now() - interval '1 day')
        on conflict do nothing
        `,
      );

      console.log(`[dbSetup] Created 25 messages between users 61-70`);
    } catch (e: any) {
      console.log(
        `[dbSetup] Skipped messages for users 61-70 (they don't exist):`,
        e?.message?.slice(0, 100),
      );
    }

    res.json({ ok: true });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: String(error?.message || error) });
  }
}
