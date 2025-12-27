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
          created_by integer not null references users(id) on delete cascade,
          claim_type text not null check (claim_type in ('damage', 'late return', 'missing', 'theft', 'other')),
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

    res.json({ ok: true });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: String(error?.message || error) });
  }
}
