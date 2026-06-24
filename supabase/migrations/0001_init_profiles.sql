-- profiles: one row per auth user, holding the data the app actually queries
-- (role, display info). Auth itself lives in Supabase's built-in auth.users table.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  role text not null check (role in ('freelancer', 'client')),
  display_name text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- RLS pattern for every future table: a user may only read/write rows
-- that belong to them, checked via auth.uid() inside the database itself.
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Runs server-side whenever a new auth user is created, so a matching
-- profiles row always exists — the app never has to create it manually.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'role', 'client')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
