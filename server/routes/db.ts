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
    // Create message_threads table with new columns for claim support
    // Don't drop it to preserve sequences and data
    try {
      await pool.query(
        `create table if not exists message_threads (
          id serial primary key,
          user_a_id integer not null references users(id) on delete cascade,
          user_b_id integer not null references users(id) on delete cascade,
          thread_title text,
          claim_id integer references claims(id) on delete set null,
          created_at timestamptz not null default now(),
          last_updated_by_id integer references users(id) on delete set null,
          last_updated timestamptz not null default now()
        )`,
      );
      console.log("[dbSetup] Created/verified message_threads table");
    } catch (e: any) {
      if (!e.message?.includes("already exists")) {
        console.warn(
          "[dbSetup] Warning with message_threads table:",
          e.message,
        );
      }
    }

    // Add thread_title column if it doesn't exist
    try {
      const threadTitleColResult = await pool.query(
        `select column_name from information_schema.columns
         where table_name = 'message_threads' and column_name = 'thread_title'`,
      );

      if (threadTitleColResult.rows.length === 0) {
        await pool.query(
          `alter table message_threads add column thread_title text`,
        );
        console.log("[dbSetup] Added thread_title column to message_threads");
      }
    } catch (e: any) {
      console.log(
        "[dbSetup] Could not add thread_title column:",
        e?.message?.slice(0, 80),
      );
    }

    // Add claim_id column if it doesn't exist
    try {
      const claimIdColResult = await pool.query(
        `select column_name from information_schema.columns
         where table_name = 'message_threads' and column_name = 'claim_id'`,
      );

      if (claimIdColResult.rows.length === 0) {
        await pool.query(
          `alter table message_threads add column claim_id integer references claims(id) on delete set null`,
        );
        console.log("[dbSetup] Added claim_id column to message_threads");
      }
    } catch (e: any) {
      console.log(
        "[dbSetup] Could not add claim_id column:",
        e?.message?.slice(0, 80),
      );
    }

    // Add UNIQUE constraint on username if it doesn't exist
    try {
      await pool.query(
        `alter table users add constraint users_username_unique unique (username)`,
      );
      console.log("[dbSetup] Added UNIQUE constraint on username column");
    } catch (e: any) {
      // Constraint might already exist, which is fine
      if (!e.message?.includes("already exists")) {
        console.warn(
          "[dbSetup] Warning adding username constraint:",
          e.message,
        );
      }
    }

    // Configure orders.number column - ensure sequence starts at 1000000
    try {
      await pool.query(
        `create sequence if not exists orders_number_seq start with 1000000`,
      );
      console.log("[dbSetup] Created/verified orders_number_seq sequence");
    } catch (e: any) {
      console.log(
        "[dbSetup] Could not create/verify sequence:",
        e?.message?.slice(0, 80),
      );
    }

    // Add number column to orders if it doesn't exist
    try {
      const numberColResult = await pool.query(
        `select column_name from information_schema.columns
         where table_name = 'orders' and column_name = 'number'`,
      );

      if (numberColResult.rows.length === 0) {
        await pool.query(
          `alter table orders add column number integer not null unique default nextval('orders_number_seq')`,
        );
        console.log("[dbSetup] Added number column to orders table");
      } else {
        // If number column exists, ensure it's type integer and has the correct default
        try {
          const numberTypeResult = await pool.query(
            `select data_type from information_schema.columns
             where table_name = 'orders' and column_name = 'number'`,
          );

          const currentType = numberTypeResult.rows[0]?.data_type;
          if (currentType !== "integer") {
            await pool.query(
              `alter table orders alter column number type integer`,
            );
            console.log("[dbSetup] Changed number column type to integer");
          }

          // Ensure default is set to the sequence
          await pool.query(
            `alter table orders alter column number set default nextval('orders_number_seq')`,
          );
          console.log(
            "[dbSetup] Set number column default to nextval('orders_number_seq')",
          );
        } catch (e: any) {
          console.log(
            "[dbSetup] Could not update number column type:",
            e?.message?.slice(0, 100),
          );
        }
      }
    } catch (e: any) {
      console.log(
        "[dbSetup] Orders table migration error:",
        e?.message?.slice(0, 100),
      );
    }

    // Configure reservations.number column - ensure sequence starts at 1000000
    try {
      await pool.query(
        `create sequence if not exists reservations_number_seq start with 1000000`,
      );
      console.log(
        "[dbSetup] Created/verified reservations_number_seq sequence",
      );
    } catch (e: any) {
      console.log(
        "[dbSetup] Could not create/verify reservations sequence:",
        e?.message?.slice(0, 80),
      );
    }

    // Add number column to reservations if it doesn't exist
    try {
      const numberColResult = await pool.query(
        `select column_name from information_schema.columns
         where table_name = 'reservations' and column_name = 'number'`,
      );

      if (numberColResult.rows.length === 0) {
        await pool.query(
          `alter table reservations add column number integer unique default nextval('reservations_number_seq')`,
        );
        console.log("[dbSetup] Added number column to reservations table");
      } else {
        // If number column exists, ensure it's type integer and has the correct default
        try {
          const numberTypeResult = await pool.query(
            `select data_type from information_schema.columns
             where table_name = 'reservations' and column_name = 'number'`,
          );

          const currentType = numberTypeResult.rows[0]?.data_type;
          if (currentType !== "integer") {
            await pool.query(
              `alter table reservations alter column number type integer`,
            );
            console.log(
              "[dbSetup] Changed reservations number column type to integer",
            );
          }

          // Ensure default is set to the sequence
          await pool.query(
            `alter table reservations alter column number set default nextval('reservations_number_seq')`,
          );
          console.log(
            "[dbSetup] Set reservations number column default to nextval('reservations_number_seq')",
          );
        } catch (e: any) {
          console.log(
            "[dbSetup] Could not update reservations number column type:",
            e?.message?.slice(0, 100),
          );
        }
      }
    } catch (e: any) {
      console.log(
        "[dbSetup] Reservations table migration error:",
        e?.message?.slice(0, 100),
      );
    }

    // Add reservation_number column to reservations if it doesn't exist
    try {
      const reservationNumberColResult = await pool.query(
        `select column_name from information_schema.columns
         where table_name = 'reservations' and column_name = 'reservation_number'`,
      );

      if (reservationNumberColResult.rows.length === 0) {
        await pool.query(
          `alter table reservations add column reservation_number text unique`,
        );
        console.log(
          "[dbSetup] Added reservation_number column to reservations table",
        );
      }
    } catch (e: any) {
      console.log(
        "[dbSetup] Could not add reservation_number column:",
        e?.message?.slice(0, 100),
      );
    }

    // Drop claims table constraint if it exists and recreate with correct values
    try {
      await pool.query(
        `alter table claims drop constraint if exists claims_claim_type_check`,
      );
      console.log("[dbSetup] Dropped old claim_type constraint");
    } catch (e: any) {
      // Constraint might not exist, which is fine
      if (!e.message?.includes("does not exist")) {
        console.warn("[dbSetup] Warning dropping constraint:", e.message);
      }
    }

    // Add new claim_type constraint with capitalized values
    try {
      await pool.query(
        `alter table claims add constraint claims_claim_type_check check (claim_type in ('Damage', 'Late Return', 'Missing', 'Theft', 'Other'))`,
      );
      console.log(
        "[dbSetup] Added new claim_type constraint with capitalized values",
      );
    } catch (e: any) {
      // Constraint might already exist, which is fine
      if (!e.message?.includes("already exists")) {
        console.warn("[dbSetup] Warning adding constraint:", e.message);
      }
    }

    // Create claims table if it doesn't exist
    try {
      await pool.query(
        `create table if not exists claims (
          id serial primary key,
          status text not null default 'submitted' check (status in ('submitted', 'under review', 'awaiting customer response', 'reimbursement pending', 'legal action', 'canceled', 'rejected', 'resolved')),
          created_at timestamp not null default now(),
          updated_at timestamp not null default now(),
          assigned_to integer references users(id) on delete set null,
          order_id integer not null references orders(id) on delete cascade,
          created_by_id integer not null references users(id) on delete cascade,
          claim_type text not null check (claim_type in ('Damage', 'Late Return', 'Missing', 'Theft', 'Other')),
          claim_details text not null,
          priority integer default 5,
          incident_date timestamp not null,
          evidence_urls jsonb default '[]'::jsonb,
          currency text not null default 'USD',
          estimated_cost_cents integer,
          final_cost_cents integer,
          reimbursement_amount_cents integer,
          legal_details text,
          message_thread integer references message_threads(id) on delete set null,
          closed_at timestamp,
          resolution_notes text
        )`,
      );
      console.log("[dbSetup] Created claims table");
    } catch (e: any) {
      // Table might already exist, which is fine
      if (!e.message?.includes("already exists")) {
        console.warn("[dbSetup] Warning creating claims table:", e.message);
      }
    }

    // Configure claims.number column - ensure sequence starts at 1000000
    try {
      await pool.query(
        `create sequence if not exists claims_number_seq start with 1000000`,
      );
      await pool.query(
        `alter sequence if exists claims_number_seq restart with 1000000`,
      );
      console.log("[dbSetup] Reset claims_number_seq to start at 1000000");
    } catch (e: any) {
      console.log(
        "[dbSetup] Could not reset claims sequence:",
        e?.message?.slice(0, 80),
      );
    }

    // Add number column to claims table if it doesn't exist
    try {
      const numberColResult = await pool.query(
        `select column_name from information_schema.columns
         where table_name = 'claims' and column_name = 'number'`,
      );

      if (numberColResult.rows.length === 0) {
        await pool.query(
          `alter table claims add column number integer unique default nextval('claims_number_seq')`,
        );
        console.log("[dbSetup] Added number column to claims table");
      } else {
        // If number column exists, ensure it's type integer and has the correct default
        try {
          const numberTypeResult = await pool.query(
            `select data_type from information_schema.columns
             where table_name = 'claims' and column_name = 'number'`,
          );

          const currentType = numberTypeResult.rows[0]?.data_type;
          if (currentType !== "integer") {
            await pool.query(
              `alter table claims alter column number type integer`,
            );
            console.log(
              "[dbSetup] Changed claims number column type to integer",
            );
          }

          // Ensure default is set to the sequence
          await pool.query(
            `alter table claims alter column number set default nextval('claims_number_seq')`,
          );
          console.log(
            "[dbSetup] Set claims number column default to nextval('claims_number_seq')",
          );
        } catch (e: any) {
          console.log(
            "[dbSetup] Could not update claims number column type:",
            e?.message?.slice(0, 100),
          );
        }
      }
    } catch (e: any) {
      console.log(
        "[dbSetup] Claims number column error:",
        e?.message?.slice(0, 100),
      );
    }

    // Add claim_number column to claims table if it doesn't exist
    try {
      const claimNumberColResult = await pool.query(
        `select column_name from information_schema.columns
         where table_name = 'claims' and column_name = 'claim_number'`,
      );

      if (claimNumberColResult.rows.length === 0) {
        await pool.query(
          `alter table claims add column claim_number varchar(20) unique`,
        );
        console.log("[dbSetup] Added claim_number column to claims table");
      }
    } catch (e: any) {
      console.log(
        "[dbSetup] Could not add claim_number column:",
        e?.message?.slice(0, 100),
      );
    }

    // Drop old claims index if it exists
    try {
      await pool.query(`drop index if exists idx_claims_admin_query`);
      console.log("[dbSetup] Dropped old claims index");
    } catch (e: any) {
      // Index might not exist, which is fine
      if (!e.message?.includes("does not exist")) {
        console.warn("[dbSetup] Warning dropping claims index:", e.message);
      }
    }

    // Add index for claims admin dashboard query with order number
    try {
      await pool.query(
        `create index if not exists idx_claims_admin_query on claims (created_at desc, claim_number, status, priority, assigned_to)`,
      );
      console.log("[dbSetup] Created index for claims admin dashboard query");
    } catch (e: any) {
      // Index might already exist, which is fine
      if (!e.message?.includes("already exists")) {
        console.warn("[dbSetup] Warning creating claims index:", e.message);
      }
    }

    // Create reports table if it doesn't exist
    try {
      await pool.query(
        `create table if not exists reports (
          id serial primary key,
          reported_by_id integer not null references users(id) on delete cascade,
          report_for text not null check (report_for in ('listing', 'user')),
          reported_id integer not null,
          reported_content_snapshot jsonb,
          report_reasons jsonb,
          report_details text,
          status text not null default 'submitted' check (status in ('submitted', 'rejected', 'resolved')),
          created_at timestamptz not null default now(),
          assigned_to integer references users(id) on delete set null,
          updated_at timestamptz not null default now(),
          updated_by_id integer references users(id) on delete set null,
          resolution_action text default 'none' check (resolution_action in ('none', 'removed', 'warned', 'suspended', 'banned')),
          resolution_notes text
        )`,
      );
      console.log("[dbSetup] Created reports table");
    } catch (e: any) {
      // Table might already exist, which is fine
      if (!e.message?.includes("already exists")) {
        console.warn("[dbSetup] Warning creating reports table:", e.message);
      }
    }

    // Add index for reports query performance
    try {
      await pool.query(
        `create index if not exists idx_reports_admin_query on reports (created_at desc, status, report_for, assigned_to)`,
      );
      console.log("[dbSetup] Created index for reports admin dashboard query");
    } catch (e: any) {
      // Index might already exist, which is fine
      if (!e.message?.includes("already exists")) {
        console.warn("[dbSetup] Warning creating reports index:", e.message);
      }
    }

    // Create feedback table
    try {
      await pool.query(`
        create table if not exists feedback (
          id serial primary key,
          status text not null default 'submitted',
          categories jsonb,
          details text not null,
          created_at timestamptz default now(),
          created_by_id integer references users(id),
          updated_at timestamptz default now(),
          updated_by_id integer references users(id)
        )
      `);
      console.log("[dbSetup] Created feedback table");
    } catch (e: any) {
      // Table might already exist, which is fine
      if (!e.message?.includes("already exists")) {
        console.warn("[dbSetup] Warning creating feedback table:", e.message);
      }
    }

    res.json({ ok: true });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: String(error?.message || error) });
  }
}
