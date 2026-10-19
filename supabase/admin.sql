-- Week 6 admin area. Run this whole file in Supabase → SQL Editor (safe to run more than once).
-- Requires the rating app's schema.sql to have been run first.

-- ─── Admin flag + email on profiles ──────────────────────────────────────────

alter table public.profiles add column if not exists is_superadmin boolean not null default false;
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists created_at timestamptz not null default now();

update public.profiles p
set email = u.email
from auth.users u
where u.id = p.id and p.email is null;

-- New sign-ups get their email copied too.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, first_name, last_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'given_name',
    new.raw_user_meta_data ->> 'family_name',
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Users may edit only their own name and photo — never is_superadmin or email.
revoke update on public.profiles from authenticated, anon;
grant update (first_name, last_name, avatar_url) on public.profiles to authenticated;

-- ─── is_superadmin() helper for RLS ─────────────────────────────────────────
-- security definer so it can read profiles without recursing through profiles' own RLS.

create or replace function public.is_superadmin()
returns boolean
language sql
stable
security definer set search_path = ''
as $$
  select coalesce((select is_superadmin from public.profiles where id = auth.uid()), false);
$$;

revoke execute on function public.is_superadmin() from public, anon;
grant execute on function public.is_superadmin() to authenticated;

-- ─── Admin policies (added alongside the rating app's own policies) ─────────

drop policy if exists "admins read all profiles" on public.profiles;
create policy "admins read all profiles" on public.profiles
  for select to authenticated using (public.is_superadmin());

drop policy if exists "admins create captions" on public.captions;
create policy "admins create captions" on public.captions
  for insert to authenticated with check (public.is_superadmin());

drop policy if exists "admins update captions" on public.captions;
create policy "admins update captions" on public.captions
  for update to authenticated
  using (public.is_superadmin())
  with check (public.is_superadmin());

drop policy if exists "admins delete captions" on public.captions;
create policy "admins delete captions" on public.captions
  for delete to authenticated using (public.is_superadmin());

-- ─── Bootstrap: who is the first admin? ─────────────────────────────────────
-- The app can't grant admin to anyone (users can't write is_superadmin), so the very first
-- admin is set here, in the SQL Editor, which runs as the database owner and bypasses RLS.
-- That's the answer to the assignment's "won't you be locked out?" question.

update public.profiles
set is_superadmin = true
where id in (
  select id from auth.users
  where email in ('rm4350@columbia.edu', 'vivianmao914@gmail.com')
);
