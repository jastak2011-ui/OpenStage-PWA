# FireTV Receiver Supabase Realtime

The default `/receiver` transport uses Supabase Realtime Broadcast on channel
`receiver:<pairing_code>`. The controller broadcasts live receiver snapshots and
scroll progress through Realtime. Postgres stores only the latest durable state
needed for late join and reconnect recovery.

Use `/receiver?transport=ws` to force the local WebSocket relay for developer
debugging.

## SQL

Run this in the Supabase SQL editor for the MVP receiver transport:

```sql
create table if not exists public.receiver_state (
  pairing_code text primary key,
  receiver_name text not null default 'FireTV Receiver',
  latest_message jsonb,
  durable_payload jsonb,
  last_seen_at timestamptz,
  online_status boolean not null default false,
  updated_at timestamptz not null default now(),
  -- Deprecated: retained only for older deployments. Receiver discovery and
  -- RLS policies must not use this value.
  expires_at timestamptz not null default '9999-12-31 23:59:59+00'
);

alter table public.receiver_state
  add column if not exists receiver_name text not null default 'FireTV Receiver',
  add column if not exists last_seen_at timestamptz,
  add column if not exists online_status boolean not null default false;

alter table public.receiver_state enable row level security;

drop policy if exists "receiver_state_select_mvp" on public.receiver_state;
drop policy if exists "receiver_state_insert_mvp" on public.receiver_state;
drop policy if exists "receiver_state_update_mvp" on public.receiver_state;
drop policy if exists "receiver_state_delete_mvp" on public.receiver_state;

create policy "receiver_state_select_mvp"
  on public.receiver_state
  for select
  to anon, authenticated
  using (pairing_code ~ '^[A-Z0-9]{8}$');

create policy "receiver_state_insert_mvp"
  on public.receiver_state
  for insert
  to anon, authenticated
  with check (
    pairing_code ~ '^[A-Z0-9]{8}$'
  );

create policy "receiver_state_update_mvp"
  on public.receiver_state
  for update
  to anon, authenticated
  using (pairing_code ~ '^[A-Z0-9]{8}$')
  with check (
    pairing_code ~ '^[A-Z0-9]{8}$'
  );

create policy "receiver_state_delete_mvp"
  on public.receiver_state
  for delete
  to anon, authenticated
  using (pairing_code ~ '^[A-Z0-9]{8}$');

create index if not exists receiver_state_last_seen_at_idx
  on public.receiver_state (last_seen_at desc);
```

For a stricter production version, replace the anonymous write policies with a
short-lived pairing token or authenticated owner check. The MVP policy keeps the
FireTV and tablet flow account-free.

OpenStage treats a receiver as online when `last_seen_at` is within the last 60
seconds. Receiver rows persist until the user manually removes/resets them.
