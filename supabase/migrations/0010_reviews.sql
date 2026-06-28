-- reviews: one review per milestone, written by the client after releasing
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  milestone_id uuid not null references public.milestones (id) on delete cascade,
  project_id   uuid not null references public.projects  (id) on delete cascade,
  reviewer_id  uuid not null references auth.users        (id) on delete cascade,
  freelancer_id uuid not null references auth.users       (id) on delete cascade,
  rating       smallint not null check (rating between 1 and 5),
  body         text,
  created_at   timestamptz not null default now(),
  unique (milestone_id) -- one review per milestone
);

alter table public.reviews enable row level security;

-- client can insert their own review
create policy "Client can create review"
  on public.reviews for insert
  with check (auth.uid() = reviewer_id);

-- anyone logged in can read reviews (needed for public profile)
create policy "Logged-in users can read reviews"
  on public.reviews for select
  using (auth.uid() is not null);
