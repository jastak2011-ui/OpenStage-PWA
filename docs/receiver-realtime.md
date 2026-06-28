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
  expires_at timestamptz not null default (now() + interval '12 hours')
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
  using (expires_at > now());

create policy "receiver_state_insert_mvp"
  on public.receiver_state
  for insert
  to anon, authenticated
  with check (
    pairing_code ~ '^[A-Z0-9]{8}$'
    and expires_at <= now() + interval '12 hours'
  );

create policy "receiver_state_update_mvp"
  on public.receiver_state
  for update
  to anon, authenticated
  using (pairing_code ~ '^[A-Z0-9]{8}$')
  with check (
    pairing_code ~ '^[A-Z0-9]{8}$'
    and expires_at <= now() + interval '12 hours'
  );

create policy "receiver_state_delete_mvp"
  on public.receiver_state
  for delete
  to anon, authenticated
  using (pairing_code ~ '^[A-Z0-9]{8}$');

create index if not exists receiver_state_expires_at_idx
  on public.receiver_state (expires_at);
```

For a stricter production version, replace the anonymous write policies with a
short-lived pairing token or authenticated owner check. The MVP policy keeps the
FireTV and tablet flow account-free.
