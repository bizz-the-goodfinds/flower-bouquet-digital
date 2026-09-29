// Applies SQL files in supabase/migrations in order, tracking applied ones.
// Usage: node --env-file=.env.local scripts/migrate.mjs
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import pg from "pg";

const url = process.env.SUPABASE_DB_URL;
if (!url) throw new Error("SUPABASE_DB_URL is not set");

const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await client.connect();
await client.query(
  "create table if not exists public._migrations (name text primary key, applied_at timestamptz default now())",
);
await client.query("alter table public._migrations enable row level security");

const dir = join(process.cwd(), "supabase/migrations");
const files = (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort();
const { rows } = await client.query("select name from public._migrations");
const applied = new Set(rows.map((r) => r.name));

for (const file of files) {
  if (applied.has(file)) continue;
  const sql = await readFile(join(dir, file), "utf8");
  await client.query("begin");
  try {
    await client.query(sql);
    await client.query("insert into public._migrations (name) values ($1)", [file]);
    await client.query("commit");
    console.log(`applied ${file}`);
  } catch (err) {
    await client.query("rollback");
    console.error(`failed ${file}:`, err.message);
    process.exitCode = 1;
    break;
  }
}
await client.end();
