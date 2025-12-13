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

    // Migrate order_id to order_number if the old column exists in the orders table
    try {
      const colCheckResult = await pool.query(
        `select column_name from information_schema.columns
         where table_name = 'orders' and column_name = 'order_id'`,
      );

      if (colCheckResult.rows.length > 0) {
        // Column exists, rename it
        await pool.query(
          `alter table if exists orders rename column order_id to order_number`,
        );
        console.log("[dbSetup] Renamed order_id column to order_number");

        // Rename index if it exists
        try {
          await pool.query(
            `alter index if exists idx_orders_order_id rename to idx_orders_order_number`,
          );
          console.log(
            "[dbSetup] Renamed idx_orders_order_id to idx_orders_order_number",
          );
        } catch (e: any) {
          console.log(
            "[dbSetup] Could not rename index:",
            e?.message?.slice(0, 80),
          );
        }

        // Rename sequence if it exists
        try {
          await pool.query(
            `alter sequence if exists order_id_seq rename to order_number_seq`,
          );
          console.log("[dbSetup] Renamed order_id_seq to order_number_seq");
        } catch (e: any) {
          console.log(
            "[dbSetup] Could not rename sequence:",
            e?.message?.slice(0, 80),
          );
        }
      }
    } catch (e: any) {
      console.log("[dbSetup] Migration check error:", e?.message?.slice(0, 80));
    }

    // Migrate order_number column type and add number column
    try {
      const orderNumberTypeResult = await pool.query(
        `select data_type from information_schema.columns
         where table_name = 'orders' and column_name = 'order_number'`,
      );

      if (orderNumberTypeResult.rows.length > 0) {
        const currentType = orderNumberTypeResult.rows[0].data_type;

        // If order_number is still integer, change it to varchar(20)
        if (currentType !== "character varying") {
          await pool.query(
            `alter table orders alter column order_number type varchar(20)`,
          );
          console.log(
            "[dbSetup] Changed order_number column type to varchar(20)",
          );
        }
      }

      // Ensure the sequence exists and reset it to start at 1
      try {
        await pool.query(
          `create sequence if not exists orders_number_seq start with 1`,
        );
        await pool.query(
          `alter sequence if exists orders_number_seq restart with 1`,
        );
        console.log("[dbSetup] Reset orders_number_seq to start at 1");
      } catch (e: any) {
        console.log(
          "[dbSetup] Could not reset sequence:",
          e?.message?.slice(0, 80),
        );
      }

      // Add number column if it doesn't exist
      const numberColResult = await pool.query(
        `select column_name from information_schema.columns
         where table_name = 'orders' and column_name = 'number'`,
      );

      if (numberColResult.rows.length === 0) {
        await pool.query(
          `alter table orders add column number bigint not null unique default nextval('orders_number_seq')`,
        );
        console.log("[dbSetup] Added number column to orders table");
      }
    } catch (e: any) {
      console.log(
        "[dbSetup] Orders table migration error:",
        e?.message?.slice(0, 100),
      );
    }

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

    // Drop restrictive foreign key constraint to allow perpetual data
    await pool.query(
      `alter table if exists reservations drop constraint if exists reservations_listing_id_fkey`,
    );
    console.log(
      "[dbSetup] Removed restrictive reservations foreign key constraint",
    );

    await pool.query(`
      create table if not exists reservations (
        id serial primary key,
        listing_id integer not null references listings(id),
        renter_id integer,
        host_id integer,
        start_date date not null,
        end_date date not null,
        status text not null default 'pending',
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
      )
    `);
    console.log("[dbSetup] Created reservations table");

    await pool.query(
      `create index if not exists idx_reservations_listing_id on reservations(listing_id)`,
    );
    console.log("[dbSetup] Created index on reservations.listing_id");

    // Add new columns to reservations table if they don't exist
    await pool.query(
      `alter table reservations add column if not exists renter_id integer`,
    );
    console.log("[dbSetup] Added renter_id column");

    await pool.query(
      `alter table reservations add column if not exists host_id integer`,
    );
    console.log("[dbSetup] Added host_id column");

    await pool.query(
      `alter table reservations add column if not exists host_name text`,
    );
    console.log("[dbSetup] Added host_name column");

    await pool.query(
      `alter table reservations add column if not exists renter_name text`,
    );
    console.log("[dbSetup] Added renter_name column");

    await pool.query(
      `alter table reservations add column if not exists listing_title text`,
    );
    console.log("[dbSetup] Added listing_title column");

    await pool.query(
      `alter table reservations add column if not exists listing_image text`,
    );
    console.log("[dbSetup] Added listing_image column");

    await pool.query(
      `alter table reservations add column if not exists listing_latitude double precision`,
    );
    console.log("[dbSetup] Added listing_latitude column");

    await pool.query(
      `alter table reservations add column if not exists listing_longitude double precision`,
    );
    console.log("[dbSetup] Added listing_longitude column");

    await pool.query(
      `alter table reservations add column if not exists daily_price_cents integer`,
    );
    console.log("[dbSetup] Added daily_price_cents column");

    await pool.query(
      `alter table reservations add column if not exists total_days integer`,
    );
    console.log("[dbSetup] Added total_days column");

    await pool.query(
      `alter table reservations add column if not exists rental_type text default 'item'`,
    );
    console.log("[dbSetup] Added rental_type column");

    await pool.query(
      `alter table reservations add column if not exists last_modified timestamptz default now()`,
    );
    console.log("[dbSetup] Added last_modified column");

    await pool.query(
      `alter table reservations add column if not exists modified_by_id integer`,
    );
    console.log("[dbSetup] Added modified_by_id column");

    // Migrate user_id to host_id
    try {
      // First check if user_id column exists
      try {
        const userIdCheckResult = await pool.query(
          `select exists(
            select 1 from information_schema.columns
            where table_name = 'listings' and column_name = 'user_id'
          ) as exists`,
        );

        const userIdExists = userIdCheckResult.rows[0]?.exists || false;
        console.log("[dbSetup] user_id column exists:", userIdExists);

        if (userIdExists) {
          // Add host_id column if it doesn't exist
          await pool.query(
            `alter table listings add column if not exists host_id integer`,
          );
          console.log("[dbSetup] Added host_id column if not exists");

          // Copy user_id to host_id (including updating existing rows)
          await pool.query(
            `update listings set host_id = user_id where user_id is not null`,
          );
          console.log("[dbSetup] Migrated user_id data to host_id");

          // Drop user_id column
          await pool.query(`alter table listings drop column user_id`);
          console.log("[dbSetup] Dropped user_id column");
        } else {
          // user_id doesn't exist, just ensure host_id exists
          await pool.query(
            `alter table listings add column if not exists host_id integer`,
          );
          console.log("[dbSetup] Added host_id column (user_id didn't exist)");
        }
      } catch (schemaError: any) {
        console.log(
          "[dbSetup] Skipping user_id check due to schema error:",
          schemaError?.message?.slice(0, 100),
        );
        // Just ensure host_id exists
        await pool.query(
          `alter table listings add column if not exists host_id integer`,
        );
        console.log("[dbSetup] Added host_id column (skipped user_id check)");
      }
    } catch (e: any) {
      console.log("[dbSetup] Migration error:", e?.message?.slice(0, 100));
    }

    // Add renter_email column to reservations if it doesn't exist
    await pool.query(
      `alter table reservations add column if not exists renter_email text`,
    );
    console.log("[dbSetup] Added renter_email column to reservations");

    // Add listing_id column to orders table if it doesn't exist
    try {
      await pool.query(
        `alter table orders add column if not exists listing_id integer references listings(id)`,
      );
      console.log("[dbSetup] Added listing_id column to orders");
    } catch (e: any) {
      console.log(
        "[dbSetup] listing_id column already exists or orders table doesn't exist",
      );
    }

    // Add addons column to orders table if it doesn't exist
    try {
      await pool.query(
        `alter table orders add column if not exists addons text`,
      );
      console.log("[dbSetup] Added addons column to orders");
    } catch (e: any) {
      console.log("[dbSetup] addons column already exists");
    }

    // Add host_email column to reservations if it doesn't exist
    try {
      await pool.query(
        `alter table reservations add column if not exists host_email text`,
      );
      console.log("[dbSetup] Added host_email column to reservations");
    } catch (e: any) {
      console.log("[dbSetup] host_email column already exists");
    }

    // Add new_dates_proposed column to reservations if it doesn't exist
    try {
      await pool.query(
        `alter table reservations add column if not exists new_dates_proposed text`,
      );
      console.log("[dbSetup] Added new_dates_proposed column to reservations");
    } catch (e: any) {
      console.log("[dbSetup] new_dates_proposed column already exists");
    }

    // Add start_date_proposed column to reservations if it doesn't exist
    try {
      await pool.query(
        `alter table reservations add column if not exists start_date_proposed timestamptz`,
      );
      console.log("[dbSetup] Added start_date_proposed column to reservations");
    } catch (e: any) {
      console.log("[dbSetup] start_date_proposed column already exists");
    }

    // Add end_date_proposed column to reservations if it doesn't exist
    try {
      await pool.query(
        `alter table reservations add column if not exists end_date_proposed timestamptz`,
      );
      console.log("[dbSetup] Added end_date_proposed column to reservations");
    } catch (e: any) {
      console.log("[dbSetup] end_date_proposed column already exists");
    }

    // Create btree_gist extension for EXCLUDE constraint
    try {
      await pool.query(`create extension if not exists btree_gist`);
      console.log("[dbSetup] Created btree_gist extension");
    } catch (e: any) {
      console.log("[dbSetup] btree_gist extension error:", e?.message?.slice(0, 100));
    }

    // Truncate reservations table to start fresh (dev phase, no data to migrate)
    try {
      await pool.query(`truncate table reservations cascade`);
      console.log("[dbSetup] Truncated reservations table");
    } catch (e: any) {
      console.log("[dbSetup] Truncate reservations error:", e?.message?.slice(0, 100));
    }

    // Remove existing EXCLUDE constraint if it exists
    try {
      await pool.query(
        `alter table reservations drop constraint if exists reservations_listing_dates_excl`,
      );
      console.log("[dbSetup] Dropped existing EXCLUDE constraint if present");
    } catch (e: any) {
      console.log("[dbSetup] Drop constraint error:", e?.message?.slice(0, 100));
    }

    // Add EXCLUDE constraint to prevent overlapping date ranges
    try {
      await pool.query(`
        alter table reservations add constraint reservations_listing_dates_excl
        exclude using gist (
          listing_id with =,
          daterange(start_date, end_date, '[)') with &&
        ) where (status in ('pending', 'accepted', 'confirmed'))
      `);
      console.log("[dbSetup] Added EXCLUDE constraint for date range overlap prevention");
    } catch (e: any) {
      console.log(
        "[dbSetup] EXCLUDE constraint error:",
        e?.message?.slice(0, 150),
      );
    }

    // Remove existing index if it exists
    try {
      await pool.query(`drop index if exists idx_reservations_listing_dates`);
      console.log("[dbSetup] Dropped existing listing dates index if present");
    } catch (e: any) {
      console.log("[dbSetup] Drop index error:", e?.message?.slice(0, 100));
    }

    // Add index for query performance on listing + date range queries
    try {
      await pool.query(`
        create index idx_reservations_listing_dates
        on reservations(listing_id, start_date, end_date)
      `);
      console.log("[dbSetup] Created index on reservations(listing_id, start_date, end_date)");
    } catch (e: any) {
      console.log("[dbSetup] Create index error:", e?.message?.slice(0, 100));
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
