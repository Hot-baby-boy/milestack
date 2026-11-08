-- ============================================================
-- Talent Space: categories, niches, and ranking.
-- Run AFTER 0013_talent_space.sql and 0014_talent_cv.sql.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Category list. Main categories have no parent; niches point at
-- their main category. Read-only for everyone: changed only by migration.
-- ------------------------------------------------------------
create table public.talent_categories (
  slug        text primary key,
  label       text not null,
  parent_slug text references public.talent_categories (slug) on delete cascade,
  sort_order  int  not null default 0
);

alter table public.talent_categories enable row level security;

-- Public list (the sign-up form needs it before anyone is signed in).
create policy "Anyone can read categories"
  on public.talent_categories for select
  to anon, authenticated
  using (true);
-- No insert/update/delete policies: only migrations change the list.

insert into public.talent_categories (slug, label, parent_slug, sort_order) values
  ('design', 'Design', null, 1),
  ('development', 'Development', null, 2),
  ('ai-data', 'AI & Data', null, 3),
  ('writing', 'Writing & Content', null, 4),
  ('video-audio', 'Video & Audio', null, 5),
  ('marketing', 'Marketing', null, 6),
  ('business-support', 'Business & Support', null, 7),
  ('coaching-consulting', 'Coaching & Consulting', null, 8);

insert into public.talent_categories (slug, label, parent_slug, sort_order) values
  ('web-design', 'Web design', 'design', 1),
  ('product-design', 'Product / UI-UX design', 'design', 2),
  ('graphic-design', 'Graphic design', 'design', 3),
  ('brand-logo-design', 'Brand & logo design', 'design', 4),
  ('motion-graphics', 'Motion graphics', 'design', 5),
  ('illustration', 'Illustration', 'design', 6),

  ('web-development', 'Web development', 'development', 1),
  ('mobile-apps', 'Mobile apps', 'development', 2),
  ('backend-apis', 'Backend & APIs', 'development', 3),
  ('wordpress-no-code', 'WordPress & no-code', 'development', 4),
  ('qa-testing', 'QA & testing', 'development', 5),
  ('cybersecurity', 'Cybersecurity', 'development', 6),

  ('ai-annotation', 'AI annotation & data labeling', 'ai-data', 1),
  ('prompt-engineering', 'Prompt engineering', 'ai-data', 2),
  ('machine-learning', 'Machine learning', 'ai-data', 3),
  ('data-analysis', 'Data analysis', 'ai-data', 4),
  ('data-entry', 'Data entry', 'ai-data', 5),

  ('copywriting', 'Copywriting', 'writing', 1),
  ('content-writing', 'Content writing', 'writing', 2),
  ('technical-writing', 'Technical writing', 'writing', 3),
  ('editing-proofreading', 'Editing & proofreading', 'writing', 4),
  ('translation', 'Translation', 'writing', 5),
  ('scriptwriting', 'Scriptwriting', 'writing', 6),

  ('video-editing', 'Video editing', 'video-audio', 1),
  ('animation', 'Animation', 'video-audio', 2),
  ('voice-over', 'Voice-over', 'video-audio', 3),
  ('music-sound', 'Music & sound design', 'video-audio', 4),
  ('photography', 'Photography', 'video-audio', 5),

  ('social-media', 'Social media management', 'marketing', 1),
  ('seo', 'SEO', 'marketing', 2),
  ('paid-ads', 'Paid ads', 'marketing', 3),
  ('email-marketing', 'Email marketing', 'marketing', 4),
  ('influencer-marketing', 'Influencer marketing', 'marketing', 5),

  ('virtual-assistance', 'Virtual assistance', 'business-support', 1),
  ('customer-support', 'Customer support', 'business-support', 2),
  ('bookkeeping', 'Bookkeeping & accounting', 'business-support', 3),
  ('project-management', 'Project management', 'business-support', 4),
  ('research', 'Research', 'business-support', 5),

  ('tutoring', 'Tutoring', 'coaching-consulting', 1),
  ('business-consulting', 'Business consulting', 'coaching-consulting', 2),
  ('career-coaching', 'Career coaching', 'coaching-consulting', 3);

-- ------------------------------------------------------------
-- 2. Category columns on profiles
-- ------------------------------------------------------------
alter table public.profiles
  add column if not exists category text references public.talent_categories (slug),
  add column if not exists niches text[] not null default '{}';

-- ------------------------------------------------------------
-- 3. One validation function used by the trigger and the save RPC.
-- Raises a plain-English error if the combination is not allowed.
-- ------------------------------------------------------------
create function public.validate_talent_category(p_category text, p_niches text[])
returns void
language plpgsql
stable
set search_path = public
as $$
declare
  v_niches text[] := coalesce(p_niches, '{}');
begin
  if p_category is not null and not exists (
    select 1 from public.talent_categories where slug = p_category and parent_slug is null
  ) then
    raise exception 'That is not a valid category';
  end if;

  if coalesce(array_length(v_niches, 1), 0) > 5 then
    raise exception 'Choose at most 5 niches';
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
-- 4. Extend the profile guard from 0013: a user can never write a
-- category/niche combination the list does not allow, even by editing
-- their own profile row directly.
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
       or new.niches is distinct from old.niches then
      perform public.validate_talent_category(new.category, new.niches);
    end if;
  end if;
  return new;
end;
$$;

-- ------------------------------------------------------------
-- 5. New sign-ups: copy the chosen category from the sign-up form.
-- The form value is user-controlled, so it is checked again here, and
-- only freelancers can have a category.
-- ------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_role text := coalesce(new.raw_user_meta_data ->> 'role', 'client');
  v_cat  text := nullif(trim(coalesce(new.raw_user_meta_data ->> 'category', '')), '');
begin
  if v_role <> 'freelancer'
     or not exists (select 1 from public.talent_categories where slug = v_cat and parent_slug is null) then
    v_cat := null;
  end if;

  insert into public.profiles (id, email, role, display_name, category)
  values (
    new.id,
    new.email,
    v_role,
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), ''),
    v_cat
  );
  return new;
end;
$$;

-- ------------------------------------------------------------
-- 6. Freelancer saves their category and niches
-- ------------------------------------------------------------
create function public.set_talent_category(p_category text, p_niches text[])
returns public.profiles
language plpgsql
security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_profile public.profiles;
  v_niches text[] := coalesce(p_niches, '{}');
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;

  select * into v_profile from public.profiles where id = v_uid;
  if v_profile.role <> 'freelancer' then
    raise exception 'Only freelancers can choose a category';
  end if;
  if p_category is null then
    raise exception 'Choose your main category';
  end if;

  perform public.validate_talent_category(p_category, v_niches);

  update public.profiles
     set category = p_category, niches = v_niches
   where id = v_uid
   returning * into v_profile;

  return v_profile;
end;
$$;

-- ------------------------------------------------------------
-- 7. Listing now also requires a category (replaces the 0013 version)
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
-- 8. Profile completeness and ranking.
-- Points are defined here and nowhere else, so the freelancer's
-- "profile strength" meter and the directory order can never disagree.
--   completeness: up to 60
--   reviews:      up to 40
-- ------------------------------------------------------------
create function public.profile_completeness(p_id uuid)
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

  if coalesce(array_length(p.niches, 1), 0) >= 1 then v_points := v_points + 6;
  else v_missing := array_append(v_missing, 'a niche'); end if;

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

create function public.talent_rank_score(p_id uuid)
returns numeric
language plpgsql
stable
security definer set search_path = public
as $$
declare
  v_complete int;
  v_n bigint;
  v_avg numeric;
  v_reviews numeric := 0;
begin
  select c.points into v_complete from public.profile_completeness(p_id) c;

  select count(*), avg(rating) into v_n, v_avg from public.reviews where freelancer_id = p_id;

  if v_n > 0 then
    -- Bayesian average (prior: 3 reviews at 3.5 stars) so one 5-star review
    -- does not outrank a long record of 4.8s; full weight from 5 reviews.
    v_reviews := 40 * (((v_n * v_avg) + (3 * 3.5)) / (v_n + 3)) / 5 * least(v_n, 5) / 5.0;
  end if;

  return coalesce(v_complete, 0) + v_reviews;
end;
$$;

-- The score is internal: only database code may call these two.
revoke execute on function public.profile_completeness(uuid) from public, anon, authenticated;
revoke execute on function public.talent_rank_score(uuid) from public, anon, authenticated;

-- A freelancer sees their own strength and what would raise it.
create function public.my_profile_strength()
returns table (points int, max_points int, missing text[])
language plpgsql
stable
security definer set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  return query
    select c.points, 60, c.missing from public.profile_completeness(auth.uid()) c;
end;
$$;

-- ------------------------------------------------------------
-- 9. Client directory: filter by category/niche, best match first
-- ------------------------------------------------------------
drop function if exists public.list_talent(text, text);

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
  category text, niches text[]
)
language plpgsql
security definer set search_path = public
as $$
begin
  perform public.assert_caller_is_client();

  return query
  select t.id, t.handle, t.display_name, t.headline, t.bio, t.skills,
         t.hourly_rate, t.avatar_url, t.linkedin_name,
         t.avg_rating, t.review_count, t.category, t.niches
  from (
    select p.id, p.handle, p.display_name, p.headline, p.bio, p.skills,
           p.hourly_rate, p.avatar_url, p.linkedin_name,
           (select round(avg(r.rating), 1) from public.reviews r where r.freelancer_id = p.id) as avg_rating,
           (select count(*) from public.reviews r where r.freelancer_id = p.id) as review_count,
           p.category, p.niches, p.linkedin_verified_at,
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
           or p.bio ilike '%' || trim(p_search) || '%')
      and (nullif(trim(p_skill), '') is null
           or exists (select 1 from unnest(p.skills) s where s ilike trim(p_skill)))
  ) t
  order by t.score desc, t.linkedin_verified_at desc;
end;
$$;

-- How many listed freelancers are in each main category (for the category cards)
create function public.talent_category_counts()
returns table (slug text, listed_count bigint)
language plpgsql
stable
security definer set search_path = public
as $$
begin
  perform public.assert_caller_is_client();

  return query
  select c.slug,
         (select count(*) from public.profiles p
           where p.role = 'freelancer' and p.talent_listed
             and p.linkedin_verified_at is not null
             and p.category = c.slug)
  from public.talent_categories c
  where c.parent_slug is null
  order by c.sort_order;
end;
$$;

-- ------------------------------------------------------------
-- 10. Profile page for a client: now includes category and niches
-- ------------------------------------------------------------
drop function if exists public.get_talent_profile(text);

create function public.get_talent_profile(p_handle text)
returns table (
  id uuid, handle text, display_name text, headline text, bio text,
  skills text[], hourly_rate numeric, avatar_url text, linkedin_name text,
  linkedin_url text, linkedin_verified_at timestamptz,
  avg_rating numeric, review_count bigint,
  has_cv boolean, cv_name text,
  category text, niches text[]
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
         p.category, p.niches
  from public.profiles p
  where p.handle = p_handle
    and p.role = 'freelancer'
    and p.talent_listed
    and p.linkedin_verified_at is not null;
end;
$$;
