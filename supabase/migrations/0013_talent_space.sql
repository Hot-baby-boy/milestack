-- ============================================================
-- Talent Space: LinkedIn-verified freelancer listings (visible to
-- clients only), contact tracking, and client-created proposals.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Talent columns on profiles
-- ------------------------------------------------------------
alter table public.profiles
  add column if not exists headline text,
  add column if not exists linkedin_url text,
  add column if not exists linkedin_name text,
  add column if not exists linkedin_sub text unique,
  add column if not exists linkedin_verified_at timestamptz,
  add column if not exists talent_listed boolean not null default false;

-- ------------------------------------------------------------
-- 2. Lock down columns a user must never write about themselves.
-- The profiles update policy is "own row, any column", so without
-- this a freelancer could mark themselves LinkedIn-verified, or flip
-- their role to 'client' to browse the client-only Talent Space.
-- Trusted writes (service-role key, SQL editor) are unaffected.
-- ------------------------------------------------------------
create function public.protect_profile_columns()
returns trigger
language plpgsql
as $$
declare
  v_role text := coalesce(
    nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role', ''
  );
begin
  if v_role in ('authenticated', 'anon') then
    if new.role is distinct from old.role then
      raise exception 'Account role cannot be changed';
    end if;
    if new.linkedin_name is distinct from old.linkedin_name
       or new.linkedin_sub is distinct from old.linkedin_sub
       or new.linkedin_verified_at is distinct from old.linkedin_verified_at then
      raise exception 'LinkedIn verification can only be set by verifying with LinkedIn';
    end if;
    if new.talent_listed and new.linkedin_verified_at is null then
      raise exception 'Verify with LinkedIn before listing yourself';
    end if;
  end if;
  return new;
end;
$$;

create trigger protect_profile_columns
  before update on public.profiles
  for each row execute function public.protect_profile_columns();

-- ------------------------------------------------------------
-- 3. Freelancer edits their own listing
-- ------------------------------------------------------------
create function public.update_talent_listing(
  p_headline text,
  p_linkedin_url text,
  p_listed boolean
)
returns public.profiles
language plpgsql
security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_profile public.profiles;
  v_url text := nullif(trim(p_linkedin_url), '');
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;

  select * into v_profile from public.profiles where id = v_uid;
  if v_profile.role <> 'freelancer' then
    raise exception 'Only freelancers can have a Talent Space listing';
  end if;

  if v_url is not null and v_url !~* '^https://([a-z]{2,3}\.)?linkedin\.com/in/[A-Za-z0-9_%\-]+/?$' then
    raise exception 'Enter your LinkedIn profile link, like https://www.linkedin.com/in/your-name';
  end if;

  if coalesce(p_listed, false) then
    if v_profile.linkedin_verified_at is null then
      raise exception 'Verify with LinkedIn first';
    end if;
    if v_url is null then raise exception 'Add your LinkedIn profile link first'; end if;
    if v_profile.handle is null then raise exception 'Set a profile handle first'; end if;
    if coalesce(trim(v_profile.bio), '') = '' then raise exception 'Add a bio first'; end if;
    if coalesce(array_length(v_profile.skills, 1), 0) = 0 then raise exception 'Add at least one skill first'; end if;
    if coalesce(trim(p_headline), '') = '' then raise exception 'Add a headline first'; end if;
  end if;

  update public.profiles set
    headline = nullif(trim(p_headline), ''),
    linkedin_url = v_url,
    talent_listed = coalesce(p_listed, false)
  where id = v_uid
  returning * into v_profile;

  return v_profile;
end;
$$;

-- ------------------------------------------------------------
-- 4. Client-only directory. Returns safe fields only, never email.
-- ------------------------------------------------------------
create function public.assert_caller_is_client()
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and role = 'client') then
    raise exception 'The Talent Space is only available to clients';
  end if;
end;
$$;

create function public.list_talent(p_search text default null, p_skill text default null)
returns table (
  id uuid, handle text, display_name text, headline text, bio text,
  skills text[], hourly_rate numeric, avatar_url text, linkedin_name text,
  avg_rating numeric, review_count bigint
)
language plpgsql
security definer set search_path = public
as $$
begin
  perform public.assert_caller_is_client();

  return query
  select p.id, p.handle, p.display_name, p.headline, p.bio, p.skills,
         p.hourly_rate, p.avatar_url, p.linkedin_name,
         (select round(avg(r.rating), 1) from public.reviews r where r.freelancer_id = p.id),
         (select count(*) from public.reviews r where r.freelancer_id = p.id)
  from public.profiles p
  where p.role = 'freelancer'
    and p.talent_listed
    and p.linkedin_verified_at is not null
    and (nullif(trim(p_search), '') is null
         or p.display_name ilike '%' || trim(p_search) || '%'
         or p.headline ilike '%' || trim(p_search) || '%'
         or p.bio ilike '%' || trim(p_search) || '%')
    and (nullif(trim(p_skill), '') is null
         or exists (select 1 from unnest(p.skills) s where s ilike trim(p_skill)))
  order by p.linkedin_verified_at desc;
end;
$$;

create function public.get_talent_profile(p_handle text)
returns table (
  id uuid, handle text, display_name text, headline text, bio text,
  skills text[], hourly_rate numeric, avatar_url text, linkedin_name text,
  linkedin_url text, linkedin_verified_at timestamptz,
  avg_rating numeric, review_count bigint
)
language plpgsql
security definer set search_path = public
as $$
begin
  perform public.assert_caller_is_client();

  return query
  select p.id, p.handle, p.display_name, p.headline, p.bio, p.skills,
         p.hourly_rate, p.avatar_url, p.linkedin_name, p.linkedin_url,
         p.linkedin_verified_at,
         (select round(avg(r.rating), 1) from public.reviews r where r.freelancer_id = p.id),
         (select count(*) from public.reviews r where r.freelancer_id = p.id)
  from public.profiles p
  where p.handle = p_handle
    and p.role = 'freelancer'
    and p.talent_listed
    and p.linkedin_verified_at is not null;
end;
$$;

-- ------------------------------------------------------------
-- 5. Contact tracking: a client clicked "Contact on LinkedIn"
-- ------------------------------------------------------------
create table public.talent_contacts (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references auth.users (id) on delete cascade,
  freelancer_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (client_id, freelancer_id)
);

alter table public.talent_contacts enable row level security;

create policy "Parties can view their own contacts"
  on public.talent_contacts for select
  using (auth.uid() = client_id or auth.uid() = freelancer_id);
-- No insert policy: rows are written only by record_talent_contact().

create function public.record_talent_contact(p_freelancer_id uuid)
returns text
language plpgsql
security definer set search_path = public
as $$
declare
  v_url text;
begin
  perform public.assert_caller_is_client();

  select linkedin_url into v_url
  from public.profiles
  where id = p_freelancer_id and role = 'freelancer'
    and talent_listed and linkedin_verified_at is not null;

  if v_url is null then
    raise exception 'This freelancer is not available in the Talent Space';
  end if;

  insert into public.talent_contacts (client_id, freelancer_id)
  values (auth.uid(), p_freelancer_id)
  on conflict (client_id, freelancer_id) do nothing;

  return v_url;
end;
$$;

-- ------------------------------------------------------------
-- 6. Proposals: the client creates one and shares the link; the
-- freelancer accepts it and a real project is created. This keeps
-- projects.freelancer_id NOT NULL everywhere else in the app.
-- ------------------------------------------------------------
create table public.project_proposals (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references auth.users (id) on delete cascade,
  freelancer_id uuid references auth.users (id) on delete set null,
  name text not null,
  description text,
  milestones jsonb not null default '[]',
  token text not null unique,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'cancelled')),
  expires_at timestamptz not null default now() + interval '14 days',
  project_id uuid references public.projects (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.project_proposals enable row level security;

create policy "Client can view their own proposals"
  on public.project_proposals for select
  using (auth.uid() = client_id);

create policy "Clients can create proposals"
  on public.project_proposals for insert
  with check (
    auth.uid() = client_id
    and status = 'pending'
    and exists (select 1 from public.profiles where id = auth.uid() and role = 'client')
  );

create policy "Client can cancel their own pending proposal"
  on public.project_proposals for update
  using (auth.uid() = client_id and status = 'pending')
  with check (auth.uid() = client_id and status = 'cancelled');

-- Public preview (the freelancer may be logged out). Never exposes emails.
create function public.get_proposal_preview(p_token text)
returns table (name text, description text, client_name text, milestones jsonb)
language plpgsql
security definer set search_path = public
as $$
begin
  return query
  select pp.name, pp.description,
         coalesce(pr.display_name, 'A client'),
         pp.milestones
  from public.project_proposals pp
  join public.profiles pr on pr.id = pp.client_id
  where pp.token = p_token
    and pp.status = 'pending'
    and pp.expires_at > now();
end;
$$;

create function public.accept_proposal(p_token text)
returns public.projects
language plpgsql
security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_proposal public.project_proposals;
  v_project public.projects;
  v_chars constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_code text;
  v_attempt int := 0;
  v_item jsonb;
  v_title text;
  v_amount numeric;
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;

  if not exists (select 1 from public.profiles where id = v_uid and role = 'freelancer') then
    raise exception 'Only freelancer accounts can accept a project proposal';
  end if;

  select * into v_proposal
  from public.project_proposals
  where token = p_token and status = 'pending' and expires_at > now()
  for update;

  if v_proposal.id is null then
    raise exception 'This proposal link is invalid, expired or already used';
  end if;

  if v_proposal.freelancer_id is not null and v_proposal.freelancer_id <> v_uid then
    raise exception 'This proposal was sent to a different freelancer';
  end if;

  loop
    v_attempt := v_attempt + 1;
    v_code := 'MSK-' || substr(v_chars, 1 + floor(random() * 32)::int, 1)
                     || substr(v_chars, 1 + floor(random() * 32)::int, 1)
                     || substr(v_chars, 1 + floor(random() * 32)::int, 1)
                     || substr(v_chars, 1 + floor(random() * 32)::int, 1);
    begin
      insert into public.projects (name, code, freelancer_id, client_id)
      values (v_proposal.name, v_code, v_uid, v_proposal.client_id)
      returning * into v_project;
      exit;
    exception when unique_violation then
      if v_attempt >= 5 then
        raise exception 'Could not generate a unique project code, please try again';
      end if;
    end;
  end loop;

  for v_item in select * from jsonb_array_elements(v_proposal.milestones) loop
    v_title := trim(v_item ->> 'title');
    begin
      v_amount := (v_item ->> 'amount')::numeric;
    exception when others then
      v_amount := null;
    end;
    if v_title <> '' and v_amount is not null and v_amount > 0 then
      insert into public.milestones (project_id, title, amount)
      values (v_project.id, v_title, v_amount);
    end if;
  end loop;

  if coalesce(trim(v_proposal.description), '') <> '' then
    insert into public.messages (project_id, sender_id, type, body)
    values (v_project.id, v_proposal.client_id, 'text', v_proposal.description);
  end if;

  update public.project_proposals
    set status = 'accepted', project_id = v_project.id, freelancer_id = v_uid
    where id = v_proposal.id;

  perform public.notify_project_member(
    v_project.id, v_uid, 'proposal_accepted',
    jsonb_build_object('project_name', v_project.name, 'project_code', v_project.code)
  );

  return v_project;
end;
$$;
