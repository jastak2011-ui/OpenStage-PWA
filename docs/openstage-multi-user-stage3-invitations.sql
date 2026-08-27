-- OpenStage multi-user Stage 3 invitations and admin support.
-- Apply manually in Supabase before using the Admin invitation screen.

begin;

create table if not exists public.openstage_invitations (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  role text not null default 'user',
  token_hash text not null,
  invited_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  accepted_at timestamptz,
  revoked_at timestamptz,
  last_sent_at timestamptz,
  constraint openstage_invitations_role_check check (role in ('admin', 'user')),
  constraint openstage_invitations_email_lower_check check (email = lower(trim(email)))
);

create unique index if not exists openstage_invitations_one_active_email_uidx
  on public.openstage_invitations (email)
  where accepted_at is null and revoked_at is null;

create index if not exists openstage_invitations_email_idx
  on public.openstage_invitations (email);

create index if not exists openstage_invitations_token_hash_idx
  on public.openstage_invitations (token_hash);

create index if not exists openstage_profiles_role_disabled_idx
  on public.openstage_profiles (role, disabled);

alter table public.openstage_invitations enable row level security;

-- Invitation access is intentionally brokered through OpenStage-API after
-- requireAuthenticatedAdmin or invite-token validation. No direct client access.
drop policy if exists "openstage_invitations no direct access" on public.openstage_invitations;
create policy "openstage_invitations no direct access"
  on public.openstage_invitations
  for all
  to authenticated
  using (false)
  with check (false);

commit;
