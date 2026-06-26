-- ============================================================
-- Extend profiles with professional fields + unique handle
-- ============================================================
alter table public.profiles
  add column if not exists display_name text,
  add column if not exists bio text,
  add column if not exists skills text[] not null default '{}',
  add column if not exists hourly_rate numeric(10,2),
  add column if not exists avatar_url text,
  add column if not exists handle text unique;

-- Auto-generate a handle for existing rows that don't have one yet.
-- New users get a handle set by update_profile() below.
update public.profiles
  set handle = 'user-' || substring(id::text, 1, 8)
  where handle is null;

-- ============================================================
-- portfolio_items: showcase pieces owned by a freelancer
-- ============================================================
create table public.portfolio_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  description text,
  external_url text,
  position int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.portfolio_items enable row level security;

create policy "Anyone logged in can view portfolio items"
  on public.portfolio_items for select
  using (auth.uid() is not null);

create policy "Owners can insert their own portfolio items"
  on public.portfolio_items for insert
  with check (auth.uid() = user_id);

create policy "Owners can update their own portfolio items"
  on public.portfolio_items for update
  using (auth.uid() = user_id);

create policy "Owners can delete their own portfolio items"
  on public.portfolio_items for delete
  using (auth.uid() = user_id);

-- ============================================================
-- portfolio_attachments: files or links attached to a portfolio item
-- ============================================================
create table public.portfolio_attachments (
  id uuid primary key default gen_random_uuid(),
  portfolio_item_id uuid not null references public.portfolio_items (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  attachment_type text not null check (attachment_type in ('image', 'doc', 'link')),
  name text not null,
  url text,           -- for link type, or signed URL hint; actual path in storage_path
  storage_path text,  -- null for link type
  mime text,
  size bigint,
  created_at timestamptz not null default now()
);

alter table public.portfolio_attachments enable row level security;

create policy "Anyone logged in can view portfolio attachments"
  on public.portfolio_attachments for select
  using (auth.uid() is not null);

create policy "Owners can insert their own portfolio attachments"
  on public.portfolio_attachments for insert
  with check (auth.uid() = user_id);

create policy "Owners can delete their own portfolio attachments"
  on public.portfolio_attachments for delete
  using (auth.uid() = user_id);

-- ============================================================
-- admin_users: whitelist of staff accounts
-- ============================================================
create table public.admin_users (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

-- Only admins can see the admin_users table (checked by is_admin() below).
create policy "Admins can view admin_users"
  on public.admin_users for select
  using (
    exists (select 1 from public.admin_users au where au.user_id = auth.uid())
  );

-- ============================================================
-- is_admin(): helper used by admin RLS policies
-- ============================================================
create function public.is_admin()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid())
$$;

-- ============================================================
-- admin_audit_log: immutable record of every staff action
-- ============================================================
create table public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references auth.users (id),
  action text not null,
  target_type text not null,   -- 'project' | 'user' | 'milestone' | etc.
  target_id text,
  payload jsonb not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.admin_audit_log enable row level security;

create policy "Admins can view the audit log"
  on public.admin_audit_log for select
  using (public.is_admin());

-- No insert policy for users — only log_admin_action() (SECURITY DEFINER) writes rows.

-- ============================================================
-- log_admin_action(): called by admin server actions to write
-- an immutable audit entry
-- ============================================================
create function public.log_admin_action(
  p_action text,
  p_target_type text,
  p_target_id text,
  p_payload jsonb default '{}'
)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Forbidden';
  end if;

  insert into public.admin_audit_log (admin_id, action, target_type, target_id, payload)
    values (auth.uid(), p_action, p_target_type, p_target_id, p_payload);
end;
$$;

-- ============================================================
-- update_profile(): lets a user update their own profile fields
-- including setting/changing their handle (slug). Validates
-- handle uniqueness and character set server-side.
-- ============================================================
create function public.update_profile(
  p_display_name text default null,
  p_bio text default null,
  p_skills text[] default null,
  p_hourly_rate numeric default null,
  p_avatar_url text default null,
  p_handle text default null
)
returns public.profiles
language plpgsql
security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_result public.profiles;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  if p_handle is not null then
    if p_handle !~ '^[a-z0-9][a-z0-9\-]{2,29}$' then
      raise exception 'Handle must be 3–30 lowercase letters, numbers, or hyphens and start with a letter/number';
    end if;

    if exists (select 1 from public.profiles where handle = p_handle and id <> v_uid) then
      raise exception 'That handle is already taken';
    end if;
  end if;

  update public.profiles set
    display_name  = coalesce(p_display_name, display_name),
    bio           = coalesce(p_bio, bio),
    skills        = coalesce(p_skills, skills),
    hourly_rate   = coalesce(p_hourly_rate, hourly_rate),
    avatar_url    = coalesce(p_avatar_url, avatar_url),
    handle        = coalesce(p_handle, handle)
  where id = v_uid
  returning * into v_result;

  return v_result;
end;
$$;

-- ============================================================
-- Storage bucket policies for portfolio files.
-- Files are stored under "portfolio/<user_id>/<filename>"
-- in a bucket called "portfolio" (create it in the dashboard
-- as a private bucket, same as "deliverables").
-- ============================================================
create policy "Logged-in users can view portfolio storage files"
  on storage.objects for select
  using (
    bucket_id = 'portfolio'
    and auth.uid() is not null
  );

create policy "Owners can upload to their portfolio folder"
  on storage.objects for insert
  with check (
    bucket_id = 'portfolio'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Owners can delete their portfolio files"
  on storage.objects for delete
  using (
    bucket_id = 'portfolio'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================
-- Storage bucket policies for avatars.
-- Files stored under "avatars/<user_id>.<ext>"
-- in a bucket called "avatars" (create as public bucket so
-- avatars load without signed URLs).
-- ============================================================
create policy "Anyone can view avatars"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Owners can upload their own avatar"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Owners can update their own avatar"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================
-- Admin read policies on existing tables so the console can
-- query them without bypassing RLS on the browser-safe client.
-- ============================================================
create policy "Admins can read all profiles"
  on public.profiles for select
  using (public.is_admin());

create policy "Admins can read all projects"
  on public.projects for select
  using (public.is_admin());

create policy "Admins can read all milestones"
  on public.milestones for select
  using (public.is_admin());

create policy "Admins can read all milestone_events"
  on public.milestone_events for select
  using (public.is_admin());

create policy "Admins can read all transactions"
  on public.transactions for select
  using (public.is_admin());
