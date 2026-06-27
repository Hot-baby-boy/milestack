-- Run this if 0006 partially ran already (portfolio tables exist but admin tables don't).

-- ============================================================
-- Extend profiles (safe — uses IF NOT EXISTS)
-- ============================================================
alter table public.profiles
  add column if not exists bio text,
  add column if not exists skills text[] not null default '{}',
  add column if not exists hourly_rate numeric(10,2),
  add column if not exists avatar_url text,
  add column if not exists handle text;

-- Add unique constraint on handle if it doesn't exist yet
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_handle_key'
  ) then
    alter table public.profiles add constraint profiles_handle_key unique (handle);
  end if;
end $$;

-- Auto-generate handles for existing rows
update public.profiles
  set handle = 'user-' || substring(id::text, 1, 8)
  where handle is null;

-- ============================================================
-- portfolio_items (skip if already exists)
-- ============================================================
create table if not exists public.portfolio_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  description text,
  external_url text,
  position int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.portfolio_items enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='portfolio_items' and policyname='Anyone logged in can view portfolio items') then
    create policy "Anyone logged in can view portfolio items" on public.portfolio_items for select using (auth.uid() is not null);
  end if;
  if not exists (select 1 from pg_policies where tablename='portfolio_items' and policyname='Owners can insert their own portfolio items') then
    create policy "Owners can insert their own portfolio items" on public.portfolio_items for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename='portfolio_items' and policyname='Owners can update their own portfolio items') then
    create policy "Owners can update their own portfolio items" on public.portfolio_items for update using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename='portfolio_items' and policyname='Owners can delete their own portfolio items') then
    create policy "Owners can delete their own portfolio items" on public.portfolio_items for delete using (auth.uid() = user_id);
  end if;
end $$;

-- ============================================================
-- portfolio_attachments (skip if already exists)
-- ============================================================
create table if not exists public.portfolio_attachments (
  id uuid primary key default gen_random_uuid(),
  portfolio_item_id uuid not null references public.portfolio_items (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  attachment_type text not null check (attachment_type in ('image', 'doc', 'link')),
  name text not null,
  url text,
  storage_path text,
  mime text,
  size bigint,
  created_at timestamptz not null default now()
);

alter table public.portfolio_attachments enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='portfolio_attachments' and policyname='Anyone logged in can view portfolio attachments') then
    create policy "Anyone logged in can view portfolio attachments" on public.portfolio_attachments for select using (auth.uid() is not null);
  end if;
  if not exists (select 1 from pg_policies where tablename='portfolio_attachments' and policyname='Owners can insert their own portfolio attachments') then
    create policy "Owners can insert their own portfolio attachments" on public.portfolio_attachments for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename='portfolio_attachments' and policyname='Owners can delete their own portfolio attachments') then
    create policy "Owners can delete their own portfolio attachments" on public.portfolio_attachments for delete using (auth.uid() = user_id);
  end if;
end $$;

-- ============================================================
-- admin_users
-- ============================================================
create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='admin_users' and policyname='Admins can view admin_users') then
    create policy "Admins can view admin_users" on public.admin_users for select
      using (exists (select 1 from public.admin_users au where au.user_id = auth.uid()));
  end if;
end $$;

-- ============================================================
-- is_admin()
-- ============================================================
create or replace function public.is_admin()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid())
$$;

-- ============================================================
-- admin_audit_log
-- ============================================================
create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references auth.users (id),
  action text not null,
  target_type text not null,
  target_id text,
  payload jsonb not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.admin_audit_log enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='admin_audit_log' and policyname='Admins can view the audit log') then
    create policy "Admins can view the audit log" on public.admin_audit_log for select using (public.is_admin());
  end if;
end $$;

-- ============================================================
-- log_admin_action()
-- ============================================================
create or replace function public.log_admin_action(
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
  if not public.is_admin() then raise exception 'Forbidden'; end if;
  insert into public.admin_audit_log (admin_id, action, target_type, target_id, payload)
    values (auth.uid(), p_action, p_target_type, p_target_id, p_payload);
end;
$$;

-- ============================================================
-- update_profile()
-- ============================================================
create or replace function public.update_profile(
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
  if v_uid is null then raise exception 'Not authenticated'; end if;
  if p_handle is not null then
    if p_handle !~ '^[a-z0-9][a-z0-9\-]{2,29}$' then
      raise exception 'Handle must be 3–30 lowercase letters, numbers, or hyphens';
    end if;
    if exists (select 1 from public.profiles where handle = p_handle and id <> v_uid) then
      raise exception 'That handle is already taken';
    end if;
  end if;
  update public.profiles set
    display_name = coalesce(p_display_name, display_name),
    bio          = coalesce(p_bio, bio),
    skills       = coalesce(p_skills, skills),
    hourly_rate  = coalesce(p_hourly_rate, hourly_rate),
    avatar_url   = coalesce(p_avatar_url, avatar_url),
    handle       = coalesce(p_handle, handle)
  where id = v_uid
  returning * into v_result;
  return v_result;
end;
$$;

-- ============================================================
-- Storage policies (skip if already exist)
-- ============================================================
do $$ begin
  if not exists (select 1 from pg_policies where tablename='objects' and policyname='Logged-in users can view portfolio storage files') then
    create policy "Logged-in users can view portfolio storage files" on storage.objects for select using (bucket_id = 'portfolio' and auth.uid() is not null);
  end if;
  if not exists (select 1 from pg_policies where tablename='objects' and policyname='Owners can upload to their portfolio folder') then
    create policy "Owners can upload to their portfolio folder" on storage.objects for insert with check (bucket_id = 'portfolio' and (storage.foldername(name))[1] = auth.uid()::text);
  end if;
  if not exists (select 1 from pg_policies where tablename='objects' and policyname='Owners can delete their portfolio files') then
    create policy "Owners can delete their portfolio files" on storage.objects for delete using (bucket_id = 'portfolio' and (storage.foldername(name))[1] = auth.uid()::text);
  end if;
  if not exists (select 1 from pg_policies where tablename='objects' and policyname='Anyone can view avatars') then
    create policy "Anyone can view avatars" on storage.objects for select using (bucket_id = 'avatars');
  end if;
  if not exists (select 1 from pg_policies where tablename='objects' and policyname='Owners can upload their own avatar') then
    create policy "Owners can upload their own avatar" on storage.objects for insert with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
  end if;
  if not exists (select 1 from pg_policies where tablename='objects' and policyname='Owners can update their own avatar') then
    create policy "Owners can update their own avatar" on storage.objects for update using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
  end if;
end $$;

-- ============================================================
-- Admin read policies on existing tables
-- ============================================================
do $$ begin
  if not exists (select 1 from pg_policies where tablename='profiles' and policyname='Admins can read all profiles') then
    create policy "Admins can read all profiles" on public.profiles for select using (public.is_admin());
  end if;
  if not exists (select 1 from pg_policies where tablename='projects' and policyname='Admins can read all projects') then
    create policy "Admins can read all projects" on public.projects for select using (public.is_admin());
  end if;
  if not exists (select 1 from pg_policies where tablename='milestones' and policyname='Admins can read all milestones') then
    create policy "Admins can read all milestones" on public.milestones for select using (public.is_admin());
  end if;
  if not exists (select 1 from pg_policies where tablename='milestone_events' and policyname='Admins can read all milestone_events') then
    create policy "Admins can read all milestone_events" on public.milestone_events for select using (public.is_admin());
  end if;
  if not exists (select 1 from pg_policies where tablename='transactions' and policyname='Admins can read all transactions') then
    create policy "Admins can read all transactions" on public.transactions for select using (public.is_admin());
  end if;
end $$;
