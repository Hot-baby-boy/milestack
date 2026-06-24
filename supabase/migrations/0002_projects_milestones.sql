-- ============================================================
-- projects: a freelancer + (eventually) client workspace
-- ============================================================
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  freelancer_id uuid not null references auth.users (id) on delete cascade,
  client_id uuid references auth.users (id) on delete set null,
  status text not null default 'active' check (status in ('active', 'cancelled')),
  created_at timestamptz not null default now()
);

alter table public.projects enable row level security;

create policy "Members can view their project"
  on public.projects for select
  using (auth.uid() = freelancer_id or auth.uid() = client_id);

create policy "Freelancer can create their project"
  on public.projects for insert
  with check (auth.uid() = freelancer_id);

create policy "Members can update their project"
  on public.projects for update
  using (auth.uid() = freelancer_id or auth.uid() = client_id);

-- ============================================================
-- invitations: a shareable link a freelancer sends their client
-- ============================================================
create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  client_email text not null,
  client_name text,
  token text not null unique,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'expired')),
  expires_at timestamptz not null default (now() + interval '14 days'),
  created_at timestamptz not null default now()
);

alter table public.invitations enable row level security;

-- Only the project's freelancer can see/create invitations for their own project.
-- Accepting an invite goes through accept_invitation() below, not direct table access,
-- since the invitee isn't a project member yet and can't pass this policy.
create policy "Freelancer can view their project's invitations"
  on public.invitations for select
  using (auth.uid() = (select freelancer_id from public.projects where id = project_id));

create policy "Freelancer can create invitations for their project"
  on public.invitations for insert
  with check (auth.uid() = (select freelancer_id from public.projects where id = project_id));

-- ============================================================
-- milestones: priced units of work, moving through the state machine
-- ============================================================
create table public.milestones (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  title text not null,
  description text,
  amount numeric(12, 2) not null check (amount > 0),
  currency text not null default 'USD',
  due_date date,
  status text not null default 'draft' check (
    status in ('draft', 'funded', 'in_progress', 'submitted', 'approved', 'released', 'disputed', 'cancelled')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.milestones enable row level security;

create policy "Members can view project milestones"
  on public.milestones for select
  using (
    auth.uid() in (
      select freelancer_id from public.projects where id = project_id
      union
      select client_id from public.projects where id = project_id
    )
  );

create policy "Freelancer can create draft milestones"
  on public.milestones for insert
  with check (
    status = 'draft'
    and auth.uid() = (select freelancer_id from public.projects where id = project_id)
  );

-- Plain UPDATE only covers editing draft fields while still a draft.
-- Every status transition must go through transition_milestone() below.
create policy "Freelancer can edit their own draft milestones"
  on public.milestones for update
  using (
    status = 'draft'
    and auth.uid() = (select freelancer_id from public.projects where id = project_id)
  )
  with check (
    status = 'draft'
    and auth.uid() = (select freelancer_id from public.projects where id = project_id)
  );

-- ============================================================
-- milestone_events: append-only audit trail of every status change
-- ============================================================
create table public.milestone_events (
  id uuid primary key default gen_random_uuid(),
  milestone_id uuid not null references public.milestones (id) on delete cascade,
  from_status text,
  to_status text not null,
  actor_id uuid not null references auth.users (id),
  created_at timestamptz not null default now()
);

alter table public.milestone_events enable row level security;

create policy "Members can view their milestone events"
  on public.milestone_events for select
  using (
    auth.uid() in (
      select p.freelancer_id from public.milestones m join public.projects p on p.id = m.project_id where m.id = milestone_id
      union
      select p.client_id from public.milestones m join public.projects p on p.id = m.project_id where m.id = milestone_id
    )
  );
-- No insert policy for regular users: rows are only ever written by
-- transition_milestone() below, which (as a SECURITY DEFINER function
-- owned by postgres) bypasses RLS — Supabase's standard pattern for
-- server-enforced business logic that the browser can never bypass.

-- ============================================================
-- transition_milestone: the single gatekeeper for every status change
-- ============================================================
create function public.transition_milestone(p_milestone_id uuid, p_new_status text)
returns public.milestones
language plpgsql
security definer set search_path = public
as $$
declare
  v_milestone public.milestones;
  v_freelancer_id uuid;
  v_client_id uuid;
  v_uid uuid := auth.uid();
  v_allowed boolean := false;
begin
  select m.* into v_milestone
  from public.milestones m
  where m.id = p_milestone_id
  for update of m;

  if v_milestone.id is null then
    raise exception 'Milestone not found';
  end if;

  select p.freelancer_id, p.client_id into v_freelancer_id, v_client_id
  from public.projects p
  where p.id = v_milestone.project_id;

  if v_uid is distinct from v_freelancer_id and v_uid is distinct from v_client_id then
    raise exception 'Not a member of this project';
  end if;

  -- Allowed transitions, mirroring CLAUDE.md's milestone state machine.
  if v_milestone.status = 'draft' and p_new_status = 'funded' and v_uid = v_client_id then
    v_allowed := true;
  elsif v_milestone.status = 'draft' and p_new_status = 'cancelled' and v_uid = v_freelancer_id then
    v_allowed := true;
  elsif v_milestone.status = 'funded' and p_new_status = 'in_progress' and v_uid = v_freelancer_id then
    v_allowed := true;
  elsif v_milestone.status = 'in_progress' and p_new_status = 'submitted' and v_uid = v_freelancer_id then
    v_allowed := true;
  elsif v_milestone.status = 'submitted' and p_new_status = 'in_progress' and v_uid = v_client_id then
    v_allowed := true;
  elsif v_milestone.status = 'submitted' and p_new_status = 'approved' and v_uid = v_client_id then
    v_allowed := true;
  elsif v_milestone.status = 'submitted' and p_new_status = 'disputed' then
    v_allowed := true;
  elsif v_milestone.status = 'approved' and p_new_status = 'disputed' then
    v_allowed := true;
  elsif v_milestone.status = 'approved' and p_new_status = 'released' and v_uid = v_client_id then
    v_allowed := true;
  end if;

  if not v_allowed then
    raise exception 'Cannot move milestone from % to % for this user', v_milestone.status, p_new_status;
  end if;

  update public.milestones
    set status = p_new_status, updated_at = now()
    where id = p_milestone_id
    returning * into v_milestone;

  insert into public.milestone_events (milestone_id, from_status, to_status, actor_id)
    values (p_milestone_id, v_milestone.status, p_new_status, v_uid);

  return v_milestone;
end;
$$;

-- ============================================================
-- Invitation preview + acceptance (run as the invited client, who
-- isn't a project member yet, so normal RLS can't apply here)
-- ============================================================
create function public.get_invitation_preview(p_token text)
returns table (project_id uuid, project_name text, freelancer_name text)
language plpgsql
security definer set search_path = public
as $$
begin
  return query
  select p.id, p.name, coalesce(pr.display_name, pr.email)
  from public.invitations i
  join public.projects p on p.id = i.project_id
  join public.profiles pr on pr.id = p.freelancer_id
  where i.token = p_token
    and i.status = 'pending'
    and i.expires_at > now();
end;
$$;

create function public.accept_invitation(p_token text)
returns public.projects
language plpgsql
security definer set search_path = public
as $$
declare
  v_invitation public.invitations;
  v_project public.projects;
begin
  select * into v_invitation
  from public.invitations
  where token = p_token and status = 'pending' and expires_at > now()
  for update;

  if v_invitation.id is null then
    raise exception 'Invitation not found or expired';
  end if;

  update public.projects
    set client_id = auth.uid()
    where id = v_invitation.project_id and client_id is null
    returning * into v_project;

  if v_project.id is null then
    raise exception 'This project already has a client';
  end if;

  update public.invitations set status = 'accepted' where id = v_invitation.id;

  return v_project;
end;
$$;
