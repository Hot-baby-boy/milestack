-- ============================================================
-- Talent categories: an "Other" option for work that isn't listed.
-- A freelancer who picks Other describes what they do in a few words
-- (e.g. "Podcast production"); clients see that description.
-- Run AFTER 0015_talent_categories.sql.
-- ============================================================

insert into public.talent_categories (slug, label, parent_slug, sort_order)
values ('other', 'Other', null, 99);

alter table public.profiles
  add column if not exists category_other text;

-- ------------------------------------------------------------
-- Validation: replaces the 0015 version (now also takes the description).
--  * Other: no niches, and a description of 2 to 60 characters.
--  * Any other category: no description.
-- ------------------------------------------------------------
drop function if exists public.validate_talent_category(text, text[]);

create function public.validate_talent_category(
  p_category text, p_niches text[], p_other text default null
)
returns void
language plpgsql
stable
set search_path = public
as $$
declare
  v_niches text[] := coalesce(p_niches, '{}');
  v_other  text := nullif(trim(coalesce(p_other, '')), '');
begin
  if p_category is not null and not exists (
    select 1 from public.talent_categories where slug = p_category and parent_slug is null
  ) then
    raise exception 'That is not a valid category';
  end if;

  if coalesce(array_length(v_niches, 1), 0) > 5 then
    raise exception 'Choose at most 5 niches';
  end if;

  if p_category = 'other' then
    if coalesce(array_length(v_niches, 1), 0) > 0 then
      raise exception 'Describe what you do instead of choosing niches';
    end if;
    if v_other is null or char_length(v_other) < 2 or char_length(v_other) > 60 then
      raise exception 'Describe what you do in 2 to 60 characters';
    end if;
    return;
  end if;

  if v_other is not null then
    raise exception 'A description is only used for the Other category';
  end if;

  if coalesce(array_length(v_niches, 1), 0) > 0 then
    if p_category is null then
      raise exception 'Choose a category before choosing niches';
    end if;
    if (select count(distinct n) from unnest(v_niches) n) <> array_length(v_niches, 1) then
      raise exception 'Each niche can only be chosen once';
    end if;
    if exists (
      select 1 from unnest(v_niches) n
      where not exists (
        select 1 from public.talent_categories c where c.slug = n and c.parent_slug = p_category
      )
    ) then
      raise exception 'Those niches do not belong to the chosen category';
    end if;
  end if;
end;
$$;

-- ------------------------------------------------------------
-- Profile guard (0015 version) now also checks the description
-- ------------------------------------------------------------
create or replace function public.protect_profile_columns()
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
    if new.category is distinct from old.category
       or new.niches is distinct from old.niches
       or new.category_other is distinct from old.category_other then
      perform public.validate_talent_category(new.category, new.niches, new.category_other);
    end if;
  end if;
  return new;
end;
$$;

-- ------------------------------------------------------------
-- Save category (replaces the 0015 two-argument version)
-- ------------------------------------------------------------
drop function if exists public.set_talent_category(text, text[]);

create function public.set_talent_category(
  p_category text, p_niches text[], p_other text default null
)
returns public.profiles
language plpgsql
security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_profile public.profiles;
  v_niches text[] := coalesce(p_niches, '{}');
  v_other text := nullif(trim(coalesce(p_other, '')), '');
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;

  select * into v_profile from public.profiles where id = v_uid;
  if v_profile.role <> 'freelancer' then
    raise exception 'Only freelancers can choose a category';
  end if;
  if p_category is null then
    raise exception 'Choose your main category';
  end if;

  perform public.validate_talent_category(p_category, v_niches, v_other);

  update public.profiles
     set category = p_category,
         niches = case when p_category = 'other' then '{}' else v_niches end,
         category_other = case when p_category = 'other' then v_other else null end
   where id = v_uid
   returning * into v_profile;

  return v_profile;
end;
$$;

-- ------------------------------------------------------------
-- New sign-ups: also copy the description when the category is Other.
-- If Other was chosen without a usable description, no category is saved
-- (the freelancer is asked to choose again in their profile).
-- ------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_role  text := coalesce(new.raw_user_meta_data ->> 'role', 'client');
  v_cat   text := nullif(trim(coalesce(new.raw_user_meta_data ->> 'category', '')), '');
  v_other text := nullif(trim(coalesce(new.raw_user_meta_data ->> 'category_other', '')), '');
begin
  if v_role <> 'freelancer'
     or not exists (select 1 from public.talent_categories where slug = v_cat and parent_slug is null) then
    v_cat := null;
  end if;

  if v_cat = 'other' then
    v_other := left(v_other, 60);
    if v_other is null or char_length(v_other) < 2 then
      v_cat := null;
      v_other := null;
    end if;
  else
    v_other := null;
  end if;

  insert into public.profiles (id, email, role, display_name, category, category_other)
  values (
    new.id,
    new.email,
    v_role,
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), ''),
    v_cat,
    v_other
  );
  return new;
end;
$$;

-- ------------------------------------------------------------
-- Listing requires a description when the category is Other
-- (replaces the 0015 version)
-- ------------------------------------------------------------
create or replace function public.update_talent_listing(
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
    if v_profile.category is null then raise exception 'Choose your category first'; end if;
    if v_profile.category = 'other' and coalesce(trim(v_profile.category_other), '') = '' then
      raise exception 'Describe what you do first';
    end if;
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
-- Profile completeness (replaces the 0015 version): the 6 "niche" points
-- are earned by a niche, or for Other by the description.
-- ------------------------------------------------------------
create or replace function public.profile_completeness(p_id uuid)
returns table (points int, missing text[])
language plpgsql
stable
security definer set search_path = public
as $$
declare
  p public.profiles;
  v_points int := 0;
  v_missing text[] := '{}';
  v_portfolio int;
begin
  select * into p from public.profiles where id = p_id;
  if not found then
    return query select 0, '{}'::text[];
    return;
  end if;

  select count(*) into v_portfolio from public.portfolio_items where user_id = p_id;

  if coalesce(trim(p.avatar_url), '') <> '' then v_points := v_points + 9;
  else v_missing := array_append(v_missing, 'a profile photo'); end if;

  if coalesce(trim(p.headline), '') <> '' then v_points := v_points + 6;
  else v_missing := array_append(v_missing, 'a headline'); end if;

  if coalesce(trim(p.bio), '') <> '' then v_points := v_points + 9;
  else v_missing := array_append(v_missing, 'a bio'); end if;

  if coalesce(array_length(p.skills, 1), 0) >= 3 then v_points := v_points + 6;
  else v_missing := array_append(v_missing, 'at least 3 skills'); end if;

  if p.category = 'other' then
    if coalesce(trim(p.category_other), '') <> '' then v_points := v_points + 6;
    else v_missing := array_append(v_missing, 'a description of what you do'); end if;
  else
    if coalesce(array_length(p.niches, 1), 0) >= 1 then v_points := v_points + 6;
    else v_missing := array_append(v_missing, 'a niche'); end if;
  end if;

  if coalesce(p.hourly_rate, 0) > 0 then v_points := v_points + 3;
  else v_missing := array_append(v_missing, 'an hourly rate'); end if;

  if v_portfolio >= 3 then v_points := v_points + 12;
  elsif v_portfolio >= 1 then
    v_points := v_points + 9;
    v_missing := array_append(v_missing, 'more portfolio items (3 or more)');
  else v_missing := array_append(v_missing, 'a portfolio item'); end if;

  if p.cv_path is not null then v_points := v_points + 3;
  else v_missing := array_append(v_missing, 'a CV'); end if;

  if p.linkedin_verified_at is not null then v_points := v_points + 6;
  else v_missing := array_append(v_missing, 'LinkedIn verification'); end if;

  return query select v_points, v_missing;
end;
$$;

-- Same lock-down as in 0015 (create or replace keeps it, restated for safety)
revoke execute on function public.profile_completeness(uuid) from public, anon, authenticated;

-- ------------------------------------------------------------
-- Client directory: returns the description, and search matches it
-- ------------------------------------------------------------
drop function if exists public.list_talent(text, text, text, text);

create function public.list_talent(
  p_search text default null,
  p_skill text default null,
  p_category text default null,
  p_niche text default null
)
returns table (
  id uuid, handle text, display_name text, headline text, bio text,
  skills text[], hourly_rate numeric, avatar_url text, linkedin_name text,
  avg_rating numeric, review_count bigint,
  category text, niches text[], category_other text
)
language plpgsql
security definer set search_path = public
as $$
begin
  perform public.assert_caller_is_client();

  return query
  select t.id, t.handle, t.display_name, t.headline, t.bio, t.skills,
         t.hourly_rate, t.avatar_url, t.linkedin_name,
         t.avg_rating, t.review_count, t.category, t.niches, t.category_other
  from (
    select p.id, p.handle, p.display_name, p.headline, p.bio, p.skills,
           p.hourly_rate, p.avatar_url, p.linkedin_name,
           (select round(avg(r.rating), 1) from public.reviews r where r.freelancer_id = p.id) as avg_rating,
           (select count(*) from public.reviews r where r.freelancer_id = p.id) as review_count,
           p.category, p.niches, p.category_other, p.linkedin_verified_at,
           public.talent_rank_score(p.id) as score
    from public.profiles p
    where p.role = 'freelancer'
      and p.talent_listed
      and p.linkedin_verified_at is not null
      and (nullif(trim(p_category), '') is null or p.category = trim(p_category))
      and (nullif(trim(p_niche), '') is null or trim(p_niche) = any (p.niches))
      and (nullif(trim(p_search), '') is null
           or p.display_name ilike '%' || trim(p_search) || '%'
           or p.headline ilike '%' || trim(p_search) || '%'
           or p.bio ilike '%' || trim(p_search) || '%'
           or p.category_other ilike '%' || trim(p_search) || '%')
      and (nullif(trim(p_skill), '') is null
           or exists (select 1 from unnest(p.skills) s where s ilike trim(p_skill)))
  ) t
  order by t.score desc, t.linkedin_verified_at desc;
end;
$$;

-- ------------------------------------------------------------
-- Talent profile: also returns the description
-- ------------------------------------------------------------
drop function if exists public.get_talent_profile(text);

create function public.get_talent_profile(p_handle text)
returns table (
  id uuid, handle text, display_name text, headline text, bio text,
  skills text[], hourly_rate numeric, avatar_url text, linkedin_name text,
  linkedin_url text, linkedin_verified_at timestamptz,
  avg_rating numeric, review_count bigint,
  has_cv boolean, cv_name text,
  category text, niches text[], category_other text
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
         (select count(*) from public.reviews r where r.freelancer_id = p.id),
         (p.cv_path is not null and p.cv_path like p.id::text || '/%'),
         p.cv_name,
         p.category, p.niches, p.category_other
  from public.profiles p
  where p.handle = p_handle
    and p.role = 'freelancer'
    and p.talent_listed
    and p.linkedin_verified_at is not null;
end;
$$;
