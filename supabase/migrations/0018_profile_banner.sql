-- ============================================================
-- Profile banner: a wide cover image freelancers upload so clients see
-- them properly (profile pages and Talent Space cards).
-- Run AFTER 0017_rename_development_category.sql.
-- ============================================================

alter table public.profiles
  add column if not exists banner_url text;

-- ------------------------------------------------------------
-- Profile guard (0016 version) plus a check on image URLs
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
    -- Images must come from our own public "avatars" bucket. The app only
    -- loads images from *.supabase.co, so an outside URL here would break the
    -- Talent Space page for every client.
    if new.avatar_url is distinct from old.avatar_url and new.avatar_url is not null
       and new.avatar_url !~ '^https://[a-z0-9-]+\.supabase\.co/storage/v1/object/public/avatars/' then
      raise exception 'Profile photos must be uploaded through Milestack';
    end if;
    if new.banner_url is distinct from old.banner_url and new.banner_url is not null
       and new.banner_url !~ ('^https://[a-z0-9-]+\.supabase\.co/storage/v1/object/public/avatars/' || new.id::text || '/') then
      raise exception 'Banners must be uploaded through Milestack';
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
-- Client directory and talent profile now also return banner_url
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
  category text, niches text[], category_other text,
  banner_url text
)
language plpgsql
security definer set search_path = public
as $$
begin
  perform public.assert_caller_is_client();

  return query
  select t.id, t.handle, t.display_name, t.headline, t.bio, t.skills,
         t.hourly_rate, t.avatar_url, t.linkedin_name,
         t.avg_rating, t.review_count, t.category, t.niches, t.category_other, t.banner_url
  from (
    select p.id, p.handle, p.display_name, p.headline, p.bio, p.skills,
           p.hourly_rate, p.avatar_url, p.linkedin_name,
           (select round(avg(r.rating), 1) from public.reviews r where r.freelancer_id = p.id) as avg_rating,
           (select count(*) from public.reviews r where r.freelancer_id = p.id) as review_count,
           p.category, p.niches, p.category_other, p.banner_url, p.linkedin_verified_at,
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

drop function if exists public.get_talent_profile(text);

create function public.get_talent_profile(p_handle text)
returns table (
  id uuid, handle text, display_name text, headline text, bio text,
  skills text[], hourly_rate numeric, avatar_url text, linkedin_name text,
  linkedin_url text, linkedin_verified_at timestamptz,
  avg_rating numeric, review_count bigint,
  has_cv boolean, cv_name text,
  category text, niches text[], category_other text,
  banner_url text
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
         p.category, p.niches, p.category_other, p.banner_url
  from public.profiles p
  where p.handle = p_handle
    and p.role = 'freelancer'
    and p.talent_listed
    and p.linkedin_verified_at is not null;
end;
$$;
