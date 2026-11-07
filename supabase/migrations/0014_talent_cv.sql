-- ============================================================
-- Talent CV: a private PDF per freelancer, downloadable only by
-- clients, and only while the freelancer is listed and verified.
-- Requires 0013_talent_space.sql to be applied first.
-- ============================================================

alter table public.profiles
  add column if not exists cv_path text,
  add column if not exists cv_name text,
  add column if not exists cv_uploaded_at timestamptz;

-- ------------------------------------------------------------
-- Private bucket. Only the owner can touch their own folder.
-- Clients get NO direct storage access: they download through a
-- short-lived link signed by our server (see getCvDownloadUrl),
-- after get_cv_path() below has approved the request.
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('cvs', 'cvs', false, 5242880, array['application/pdf'])
on conflict (id) do nothing;

create policy "Owners can read their own CV"
  on storage.objects for select
  using (bucket_id = 'cvs' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Owners can upload their own CV"
  on storage.objects for insert
  with check (bucket_id = 'cvs' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Owners can replace their own CV"
  on storage.objects for update
  using (bucket_id = 'cvs' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Owners can delete their own CV"
  on storage.objects for delete
  using (bucket_id = 'cvs' and (storage.foldername(name))[1] = auth.uid()::text);

-- ------------------------------------------------------------
-- Approves (or refuses) a CV download. Returns the storage path
-- only when the caller is a client, the freelancer is listed and
-- LinkedIn-verified, and the stored path sits inside the
-- freelancer's OWN folder. That last check matters: users can write
-- their own profiles row, so without it someone could point cv_path
-- at another person's file.
-- ------------------------------------------------------------
create function public.get_cv_path(p_freelancer_id uuid)
returns text
language plpgsql
security definer set search_path = public
as $$
declare
  v_path text;
begin
  perform public.assert_caller_is_client();

  select cv_path into v_path
  from public.profiles
  where id = p_freelancer_id
    and role = 'freelancer'
    and talent_listed
    and linkedin_verified_at is not null
    and cv_path is not null
    and cv_path like p_freelancer_id::text || '/%';

  return v_path;
end;
$$;

-- Return columns change, so the function has to be dropped and recreated.
drop function if exists public.get_talent_profile(text);

create function public.get_talent_profile(p_handle text)
returns table (
  id uuid, handle text, display_name text, headline text, bio text,
  skills text[], hourly_rate numeric, avatar_url text, linkedin_name text,
  linkedin_url text, linkedin_verified_at timestamptz,
  avg_rating numeric, review_count bigint,
  has_cv boolean, cv_name text
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
         p.cv_name
  from public.profiles p
  where p.handle = p_handle
    and p.role = 'freelancer'
    and p.talent_listed
    and p.linkedin_verified_at is not null;
end;
$$;
