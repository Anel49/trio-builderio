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
    // Drop listings_host_id column if it exists (use host_id instead)
    try {
      await pool.query(
        `alter table listings drop column if exists listings_host_id`,
      );
      console.log("[dbSetup] Dropped listings_host_id column");
    } catch (e: any) {
      console.log(
        "[dbSetup] listings_host_id drop error:",
        e?.message?.slice(0, 80),
      );
    }

    // Drop legacy reviews table (replaced by listing_reviews and user_reviews)
    try {
      await pool.query(`drop table if exists reviews cascade`);
      console.log("[dbSetup] Dropped legacy reviews table");
    } catch (e: any) {
      console.log(
        "[dbSetup] Reviews table drop error:",
        e?.message?.slice(0, 80),
      );
    }

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
        // Get the maximum existing number in orders table and set sequence to that + 1
        const maxNumberResult = await pool.query(
          `select max(number) as max_number from orders`,
        );
        const maxNumber = maxNumberResult.rows[0]?.max_number;

        if (maxNumber !== null && maxNumber !== undefined) {
          // If there are existing orders, set sequence to max + 1
          await pool.query(
            `select setval('orders_number_seq', ${maxNumber} + 1)`,
          );
          console.log(`[dbSetup] Set orders_number_seq to ${maxNumber + 1}`);
        } else {
          // If no orders exist, reset to 1000
          await pool.query(`select setval('orders_number_seq', 1000)`);
          console.log("[dbSetup] Set orders_number_seq to 1000");
        }
      } catch (e: any) {
        console.log(
          "[dbSetup] Could not set sequence:",
          e?.message?.slice(0, 80),
        );
      }

      // Drop old order_id_key constraint if it exists
      try {
        await pool.query(
          `alter table if exists orders drop constraint if exists orders_order_id_key`,
        );
        console.log("[dbSetup] Dropped old orders_order_id_key constraint");
      } catch (e: any) {
        console.log(
          "[dbSetup] Could not drop orders_order_id_key constraint:",
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

      // Ensure order_number has a unique constraint
      try {
        await pool.query(
          `alter table if exists orders add constraint orders_order_number_key unique (order_number)`,
        );
        console.log("[dbSetup] Added unique constraint to order_number");
      } catch (e: any) {
        console.log(
          "[dbSetup] Could not add order_number unique constraint (may already exist):",
          e?.message?.slice(0, 80),
        );
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
        latitude double precision,
        longitude double precision,
        created_at timestamptz default now()
      );
      alter table listings drop column if exists distance;
      alter table listings add column if not exists zip_code text;
      alter table listings add column if not exists description text;
      alter table listings drop column if exists rental_period;
      alter table listings add column if not exists latitude double precision;
      alter table listings add column if not exists longitude double precision;
      alter table listings add column if not exists delivery boolean default false;
      alter table listings add column if not exists free_delivery boolean default false;
      alter table listings add column if not exists location_city text;
      alter table listings add column if not exists host_id integer references users(id) on delete set null;
      alter table listings add column if not exists enabled boolean default true;
      alter table listings add column if not exists instant_bookings boolean default false;
      alter table listings add column if not exists currency text default 'USD';
      alter table listings add column if not exists country text;
      alter table listings add column if not exists country_code text;
      alter table listings add column if not exists state text;
      alter table listings add column if not exists state_code text;
      alter table listings add column if not exists county text;
      alter table listings add column if not exists address text;
      alter table listings add column if not exists timezone text;
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

      create table if not exists listing_addons (
        id serial primary key,
        listing_id integer not null references listings(id) on delete cascade,
        item text not null,
        style text,
        price numeric(10, 2),
        created_at timestamptz default now()
      );
      create index if not exists idx_listing_addons_listing_id on listing_addons(listing_id);
      alter table listing_addons add column if not exists consumable boolean default false;

      -- Ensure foreign key has ON DELETE CASCADE (fix if it was created without it)
      -- Note: Simplified to avoid information_schema issues
      alter table if exists listing_addons drop constraint if exists listing_addons_listing_id_fkey;
      alter table if exists listing_addons add constraint listing_addons_listing_id_fkey
        foreign key (listing_id) references listings(id) on delete cascade;

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
      alter table users add column if not exists active boolean default true;
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
      -- Note: using IF EXISTS on DROP and IF NOT EXISTS on ADD for compatibility
      alter table if exists messages drop column if exists from_name;
      alter table if exists messages drop column if exists to_name;
      alter table if exists messages add column if not exists from_id integer references users(id) on delete set null;
      alter table if exists messages add column if not exists to_id integer references users(id) on delete set null;
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

      -- Create sequence for number column starting at 1000
      create sequence if not exists orders_number_seq start with 1000 increment by 1;

      create table if not exists user_credentials (
        id serial primary key,
        user_id integer not null references users(id) on delete cascade,
        first_name text not null,
        last_name text not null,
        email text not null unique,
        password text,
        photo_id text,
        oauth text,
        created_at timestamptz default now()
      );
      alter table user_credentials add column if not exists oauth text;
      alter table user_credentials alter column password drop not null;

      create table if not exists user_email_preferences (
        id serial primary key,
        user_id integer not null references users(id),
        newsletter boolean default false,
        platform_updates boolean default true,
        marketing boolean default false,
        security_alerts boolean default true,
        created_at timestamptz default now(),
        updated_at timestamptz default now()
      );
      create index if not exists idx_user_email_preferences_user_id on user_email_preferences(user_id);

      create table if not exists password_reset_tokens (
        id serial primary key,
        user_id integer not null references users(id),
        email text not null,
        token text not null unique,
        expires_at timestamptz not null,
        used boolean default false,
        created_at timestamptz default now()
      );
      create index if not exists idx_password_reset_tokens_token on password_reset_tokens(token);
      create index if not exists idx_password_reset_tokens_email on password_reset_tokens(email);
      create index if not exists idx_password_reset_tokens_expires_at on password_reset_tokens(expires_at);

      create table if not exists email_log (
        id serial primary key,
        message_direction text not null,
        email_type text not null,
        recipient_email text not null,
        sender_email text,
        subject text,
        message_id text,
        status text default 'sent',
        error_message text,
        metadata jsonb,
        created_at timestamptz default now()
      );
      create index if not exists idx_email_log_recipient on email_log(recipient_email);
      create index if not exists idx_email_log_email_type on email_log(email_type);
      create index if not exists idx_email_log_direction on email_log(message_direction);
      create index if not exists idx_email_log_created_at on email_log(created_at);

      create table if not exists orders (
        id serial primary key,
        order_number varchar(20) not null unique,
        number bigint not null unique default nextval('orders_number_seq'),
        listing_id integer references listings(id),
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
        addons text,
        review_id integer,
        review_message text,
        created_at timestamptz default now(),
        last_modified timestamptz,
        modified_by_id integer,
        constraint fk_orders_reservation_review foreign key (review_id) references listing_reviews(id)
      );

      -- Create indexes for orders table
      create index if not exists idx_orders_order_number on orders(order_number);
      create index if not exists idx_orders_host_id on orders(host_id);
      create index if not exists idx_orders_renter_id on orders(renter_id);
      create index if not exists idx_orders_payment_status on orders(payment_status);
      create index if not exists idx_orders_status on orders(status);
      create index if not exists idx_orders_created_at on orders(created_at);
    `);

    // Ensure postcode and city columns exist, and drop old zip_code/location_city columns
    try {
      // Copy data from zip_code to postcode if zip_code exists and postcode is empty
      await pool
        .query(
          `
        update listings set postcode = zip_code
        where zip_code is not null and (postcode is null or postcode = '00000')
      `,
        )
        .catch(() => null);

      // Copy data from location_city to city if location_city exists and city is empty
      await pool
        .query(
          `
        update listings set city = location_city
        where location_city is not null and city is null
      `,
        )
        .catch(() => null);

      // Now drop the old columns
      await pool.query(
        `alter table listings drop column if exists zip_code cascade`,
      );
      await pool.query(
        `alter table listings drop column if exists location_city cascade`,
      );

      console.log(
        "[dbSetup] Migrated zip_code→postcode and location_city→city",
      );
    } catch (e: any) {
      console.log(
        "[dbSetup] Column migration error:",
        e?.message?.slice(0, 100),
      );
    }

    // Add new columns to orders table if they don't exist
    try {
      await pool.query(
        `alter table orders add column if not exists nonconsumable_addon_total integer`,
      );
      console.log("[dbSetup] Added nonconsumable_addon_total column to orders");
    } catch (e: any) {
      console.log("[dbSetup] nonconsumable_addon_total column already exists");
    }

    try {
      await pool.query(
        `alter table orders add column if not exists consumable_addon_total integer`,
      );
      console.log("[dbSetup] Added consumable_addon_total column to orders");
    } catch (e: any) {
      console.log("[dbSetup] consumable_addon_total column already exists");
    }

    try {
      await pool.query(
        `alter table orders add column if not exists daily_total integer`,
      );
      console.log("[dbSetup] Added daily_total column to orders");
    } catch (e: any) {
      console.log("[dbSetup] daily_total column already exists");
    }

    try {
      await pool.query(
        `alter table orders add column if not exists host_earns integer`,
      );
      console.log("[dbSetup] Added host_earns column to orders");
    } catch (e: any) {
      console.log("[dbSetup] host_earns column already exists");
    }

    try {
      await pool.query(
        `alter table orders add column if not exists renter_pays integer`,
      );
      console.log("[dbSetup] Added renter_pays column to orders");
    } catch (e: any) {
      console.log("[dbSetup] renter_pays column already exists");
    }

    try {
      await pool.query(
        `alter table orders add column if not exists platform_commissions_host integer`,
      );
      console.log("[dbSetup] Added platform_commissions_host column to orders");
    } catch (e: any) {
      console.log("[dbSetup] platform_commissions_host column already exists");
    }

    try {
      await pool.query(
        `alter table orders add column if not exists platform_commission_renter integer`,
      );
      console.log(
        "[dbSetup] Added platform_commission_renter column to orders",
      );
    } catch (e: any) {
      console.log("[dbSetup] platform_commission_renter column already exists");
    }

    try {
      await pool.query(
        `alter table orders add column if not exists platform_commission_total integer`,
      );
      console.log("[dbSetup] Added platform_commission_total column to orders");
    } catch (e: any) {
      console.log("[dbSetup] platform_commission_total column already exists");
    }

    try {
      await pool.query(
        `alter table orders drop column if exists platform_charge_cents`,
      );
      console.log("[dbSetup] Dropped platform_charge_cents column from orders");
    } catch (e: any) {
      console.log(
        "[dbSetup] Could not drop platform_charge_cents column:",
        e?.message?.slice(0, 80),
      );
    }

    try {
      await pool.query(
        `alter table orders add column if not exists reservation_id integer references reservations(id)`,
      );
      console.log("[dbSetup] Added reservation_id column to orders");
    } catch (e: any) {
      console.log("[dbSetup] reservation_id column already exists");
    }

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

    try {
      await pool.query(
        `alter table reservations add column if not exists consumable_addon_total integer default 0`,
      );
      console.log(
        "[dbSetup] Added consumable_addon_total column to reservations",
      );
    } catch (e: any) {
      console.log("[dbSetup] consumable_addon_total column already exists");
    }

    try {
      await pool.query(
        `alter table reservations add column if not exists nonconsumable_addon_total integer default 0`,
      );
      console.log(
        "[dbSetup] Added nonconsumable_addon_total column to reservations",
      );
    } catch (e: any) {
      console.log("[dbSetup] nonconsumable_addon_total column already exists");
    }

    try {
      await pool.query(
        `alter table reservations add column if not exists addons text`,
      );
      console.log("[dbSetup] Added addons column to reservations");
    } catch (e: any) {
      console.log("[dbSetup] addons column already exists");
    }

    // Add renter_email column to reservations if it doesn't exist
    try {
      await pool.query(
        `alter table reservations add column if not exists renter_email text`,
      );
      console.log("[dbSetup] Added renter_email column to reservations");
    } catch (e: any) {
      console.log("[dbSetup] renter_email column already exists");
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

    // Add new_dates_proposed column to reservations table if it doesn't exist
    try {
      await pool.query(
        `alter table reservations add column if not exists new_dates_proposed text`,
      );
      console.log("[dbSetup] Added new_dates_proposed column to reservations");
    } catch (e: any) {
      console.log("[dbSetup] new_dates_proposed column already exists");
    }

    // Add start_date_proposed column to reservations table if it doesn't exist
    try {
      await pool.query(
        `alter table reservations add column if not exists start_date_proposed timestamptz`,
      );
      console.log("[dbSetup] Added start_date_proposed column to reservations");
    } catch (e: any) {
      console.log("[dbSetup] start_date_proposed column already exists");
    }

    // Add end_date_proposed column to reservations table if it doesn't exist
    try {
      await pool.query(
        `alter table reservations add column if not exists end_date_proposed timestamptz`,
      );
      console.log("[dbSetup] Added end_date_proposed column to reservations");
    } catch (e: any) {
      console.log("[dbSetup] end_date_proposed column already exists");
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

    // Add listing_id column to orders table if it doesn't exist
    try {
      await pool.query(
        `alter table orders add column if not exists listing_id integer references listings(id)`,
      );
      console.log("[dbSetup] Added listing_id column to orders");
    } catch (e: any) {
      console.log("[dbSetup] listing_id column already exists");
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

    // Update user_credentials foreign key to have ON DELETE CASCADE
    try {
      console.log(
        "[dbSetup] Updating user_credentials foreign key constraint...",
      );

      // Always drop the existing constraint if it exists (no error if it doesn't)
      try {
        await pool.query(
          `alter table user_credentials drop constraint if exists user_credentials_user_id_fkey`,
        );
        console.log(
          "[dbSetup] Dropped existing user_credentials_user_id_fkey constraint",
        );
      } catch (dropErr: any) {
        console.log(
          "[dbSetup] No constraint to drop or error dropping:",
          dropErr?.message?.slice(0, 50),
        );
      }

      // Clean up any orphaned user_credentials records (references to non-existent users)
      const deleteResult = await pool.query(
        `delete from user_credentials where user_id not in (select id from users)`,
      );
      if (deleteResult.rowCount && deleteResult.rowCount > 0) {
        console.log(
          `[dbSetup] Deleted ${deleteResult.rowCount} orphaned user_credentials records`,
        );
      }

      // Now add the constraint with ON DELETE CASCADE
      await pool.query(
        `alter table user_credentials add constraint user_credentials_user_id_fkey
         foreign key (user_id) references users(id) on delete cascade`,
      );
      console.log(
        "[dbSetup] Successfully added user_credentials_user_id_fkey with ON DELETE CASCADE",
      );
    } catch (e: any) {
      console.error(
        "[dbSetup] Error updating user_credentials constraint:",
        e?.message?.slice(0, 150),
      );
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

      // Drop orders constraints for user references to allow user deletion
      const orderConstraints = ["renter_id", "host_id"];
      for (const column of orderConstraints) {
        const constraintName = `orders_${column}_fkey`;
        try {
          await pool.query(
            `alter table orders drop constraint if exists ${constraintName}`,
          );
          console.log(`[dbSetup] Dropped constraint ${constraintName}`);
        } catch (e: any) {
          console.log(
            `[dbSetup] Could not drop ${constraintName}:`,
            e?.message?.slice(0, 100),
          );
        }
      }

      // Drop all remaining user-related foreign key constraints
      // This allows users to be deleted without cascade effects
      // Note: user_credentials is NOT included here because we use ON DELETE CASCADE for it
      const allUserConstraints = [
        { table: "password_reset_tokens", column: "user_id" },
        { table: "user_email_preferences", column: "user_id" },
        { table: "reservations", column: "renter_id" },
        { table: "reservations", column: "host_id" },
        { table: "listing_reviews", column: "reviewer_id" },
        { table: "user_reviews", column: "reviewed_user_id" },
        { table: "user_reviews", column: "reviewer_id" },
        { table: "listings", column: "host_id" },
      ];

      for (const constraint of allUserConstraints) {
        const constraintName = `${constraint.table}_${constraint.column}_fkey`;
        try {
          await pool.query(
            `alter table ${constraint.table} drop constraint if exists ${constraintName}`,
          );
          console.log(`[dbSetup] Dropped user constraint ${constraintName}`);
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
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        const ins = await pool.query(
          `insert into listings (name, price_cents, rating, image_url, host, category, zip_code, latitude, longitude)
           values ($1,$2,$3,$4,$5,$6,$7,$8,$9)
           returning id`,
          [...r],
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

    res.json({ ok: true });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: String(error?.message || error) });
  }
}
