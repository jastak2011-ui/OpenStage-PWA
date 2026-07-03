-- OpenStage FireTV receiver persistence migration
--
-- Run this in the Supabase SQL editor.
-- Receiver rows now persist until manual removal/reset. Online/offline state is
-- determined by last_seen_at in the app, not by expires_at in RLS policies.

alter table public.receiver_state
  add column if not exists receiver_name text not null default 'FireTV Receiver',
  add column if not exists latest_message jsonb,
  add column if not exists durable_payload jsonb,
  add column if not exists last_seen_at timestamptz,
  add column if not exists online_status boolean not null default false,
  add column if not exists updated_at timestamptz not null default now();

-- Keep expires_at for backward compatibility with existing tables, but stop
-- using it as a visibility/authorization gate.
alter table public.receiver_state
  add column if not exists expires_at timestamptz not null default '9999-12-31 23:59:59+00';

update public.receiver_state
set expires_at = '9999-12-31 23:59:59+00'
where expires_at < now();

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
  with check (pairing_code ~ '^[A-Z0-9]{8}$');

create policy "receiver_state_update_mvp"
  on public.receiver_state
  for update
  to anon, authenticated
  using (pairing_code ~ '^[A-Z0-9]{8}$')
  with check (pairing_code ~ '^[A-Z0-9]{8}$');

create policy "receiver_state_delete_mvp"
  on public.receiver_state
  for delete
  to anon, authenticated
  using (pairing_code ~ '^[A-Z0-9]{8}$');

drop index if exists receiver_state_expires_at_idx;

create index if not exists receiver_state_last_seen_at_idx
  on public.receiver_state (last_seen_at desc);
