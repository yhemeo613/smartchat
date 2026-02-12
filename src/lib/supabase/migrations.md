# SmartChat Database Migrations

## Prerequisites

- A Supabase project (create one at [supabase.com](https://supabase.com))
- Access to the Supabase SQL Editor (Dashboard > SQL Editor)

## Step 1: Enable the pgvector Extension

Before running the schema, enable the `vector` extension. Go to **Dashboard > Database > Extensions**, search for `vector`, and enable it. Alternatively, run this in the SQL Editor:

```sql
create extension if not exists "vector" with schema "extensions";
```

## Step 2: Run the Schema

1. Open the Supabase SQL Editor
2. Copy the entire contents of `schema.sql`
3. Paste into the editor and click **Run**

This creates all tables, enums, indexes, RLS policies, triggers, and the `match_documents` function in a single pass.

## Step 3: Verify

Run the following to confirm all tables were created:

```sql
select table_name from information_schema.tables
where table_schema = 'public'
order by table_name;
```

Expected tables: `bots`, `conversations`, `document_chunks`, `documents`, `messages`, `profiles`.

## Notes

- The `on_auth_user_created` trigger automatically creates a `profiles` row when a user signs up via Supabase Auth.
- The IVFFlat index on `document_chunks.embedding` requires at least ~100 rows before it becomes effective. For small datasets, Supabase will fall back to exact search automatically.
- RLS is enabled on all tables. API calls using the `anon` key will be subject to the policies defined in the schema. The `service_role` key bypasses RLS entirely.
- The `match_documents` function uses `security definer` so it can be called from Edge Functions or client-side RPCs without exposing the underlying table directly.

## Resetting the Schema (Development Only)

To drop everything and start fresh:

```sql
drop schema public cascade;
create schema public;
grant usage on schema public to postgres, anon, authenticated, service_role;
grant all privileges on all tables in schema public to postgres, anon, authenticated, service_role;
grant all privileges on all functions in schema public to postgres, anon, authenticated, service_role;
grant all privileges on all sequences in schema public to postgres, anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to postgres, anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to postgres, anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to postgres, anon, authenticated, service_role;
```

Then re-run from Step 1.
