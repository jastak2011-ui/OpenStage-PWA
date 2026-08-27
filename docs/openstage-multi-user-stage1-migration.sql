-- OpenStage multi-user Stage 1 foundation.
-- Apply manually in Supabase after reviewing the preflight queries below.
-- This migration is intentionally additive and does not assign orphan cloud rows to any user.

begin;

create table if not exists public.openstage_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  role text not null default 'user',
  disabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint openstage_profiles_role_check check (role in ('admin', 'user'))
);

alter table if exists public.user_songs
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

alter table if exists public.user_setlists
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

-- If either query returns rows, stop and decide who owns those legacy records before
-- enforcing NOT NULL. Do not assign them arbitrarily.
-- select count(*) as orphan_user_songs from public.user_songs where user_id is null;
-- select count(*) as orphan_user_setlists from public.user_setlists where user_id is null;

create unique index if not exists user_songs_user_song_uuid_uidx
  on public.user_songs (user_id, song_uuid);

create unique index if not exists user_setlists_user_setlist_uuid_uidx
  on public.user_setlists (user_id, setlist_uuid);

create index if not exists user_songs_user_updated_idx
  on public.user_songs (user_id, updated_at);

create index if not exists user_setlists_user_updated_idx
  on public.user_setlists (user_id, updated_at);

alter table public.openstage_profiles enable row level security;
alter table if exists public.user_songs enable row level security;
alter table if exists public.user_setlists enable row level security;

revoke all on public.openstage_profiles from anon, authenticated;
grant select on public.openstage_profiles to authenticated;
grant insert (user_id, email, display_name) on public.openstage_profiles to authenticated;
grant update (email, display_name, updated_at) on public.openstage_profiles to authenticated;

drop policy if exists "profiles read own profile" on public.openstage_profiles;
create policy "profiles read own profile"
  on public.openstage_profiles for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "profiles insert own profile" on public.openstage_profiles;
create policy "profiles insert own profile"
  on public.openstage_profiles for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "profiles update own safe profile" on public.openstage_profiles;
create policy "profiles update own safe profile"
  on public.openstage_profiles for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Role and disabled changes are intentionally not granted to normal users.
-- Future Admin operations should use a server-verified admin path or a SECURITY DEFINER RPC.

drop policy if exists "user_songs owner select" on public.user_songs;
create policy "user_songs owner select"
  on public.user_songs for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "user_songs owner insert" on public.user_songs;
create policy "user_songs owner insert"
  on public.user_songs for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "user_songs owner update" on public.user_songs;
create policy "user_songs owner update"
  on public.user_songs for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "user_songs owner delete" on public.user_songs;
create policy "user_songs owner delete"
  on public.user_songs for delete
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "user_setlists owner select" on public.user_setlists;
create policy "user_setlists owner select"
  on public.user_setlists for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "user_setlists owner insert" on public.user_setlists;
create policy "user_setlists owner insert"
  on public.user_setlists for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "user_setlists owner update" on public.user_setlists;
create policy "user_setlists owner update"
  on public.user_setlists for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "user_setlists owner delete" on public.user_setlists;
create policy "user_setlists owner delete"
  on public.user_setlists for delete
  to authenticated
  using (user_id = auth.uid());

commit;

-- One-time admin setup, run later with the actual owner account ID or email:
-- update public.openstage_profiles
-- set role = 'admin', updated_at = now()
-- where user_id = '<existing-owner-auth-user-id>';
--
-- or:
-- update public.openstage_profiles p
-- set role = 'admin', updated_at = now()
-- from auth.users u
-- where p.user_id = u.id and u.email = '<owner-email@example.com>';
