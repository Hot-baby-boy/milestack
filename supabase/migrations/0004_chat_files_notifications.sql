-- ============================================================
-- files: deliverable metadata. Bytes live in the private
-- "deliverables" Storage bucket (created manually in the dashboard).
-- ============================================================
create table public.files (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  milestone_id uuid references public.milestones (id) on delete set null,
  uploader_id uuid not null references auth.users (id),
  name text not null,
  size bigint not null,
  mime text not null,
  storage_path text not null,
  created_at timestamptz not null default now()
);

alter table public.files enable row level security;

create policy "Members can view their project's files"
  on public.files for select
  using (
    auth.uid() in (
      select freelancer_id from public.projects where id = project_id
      union
      select client_id from public.projects where id = project_id
    )
  );

create policy "Members can upload files to their project"
  on public.files for insert
  with check (
    uploader_id = auth.uid()
    and auth.uid() in (
      select freelancer_id from public.projects where id = project_id
      union
      select client_id from public.projects where id = project_id
    )
  );

-- ============================================================
-- messages: one chat thread per project (no separate
-- conversations table needed — it's always exactly 1:1).
-- ============================================================
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  sender_id uuid not null references auth.users (id),
  type text not null default 'text' check (type in ('text', 'milestone_request', 'milestone_event')),
  body text not null,
  attachment_id uuid references public.files (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.messages enable row level security;

create policy "Members can view their project's messages"
  on public.messages for select
  using (
    auth.uid() in (
      select freelancer_id from public.projects where id = project_id
      union
      select client_id from public.projects where id = project_id
    )
  );

create policy "Members can send messages in their project"
  on public.messages for insert
  with check (
    sender_id = auth.uid()
    and auth.uid() in (
      select freelancer_id from public.projects where id = project_id
      union
      select client_id from public.projects where id = project_id
    )
  );
-- 'milestone_event' rows are written by transition_milestone()/sign_contract()
-- (SECURITY DEFINER, bypasses RLS) — same protected-audit-log pattern as
-- milestone_events itself.

-- Enable Supabase Realtime so chat updates push live to subscribers.
-- Realtime still respects the RLS select policy above per-subscriber.
alter publication supabase_realtime add table public.messages;

-- ============================================================
-- notifications: one row per project member per event, written
-- only by notify_project_member() below.
-- ============================================================
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id),
  project_id uuid references public.projects (id) on delete cascade,
  type text not null,
  payload jsonb not null default '{}',
  read_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.notifications enable row level security;

create policy "Users can view their own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "Users can mark their own notifications read"
  on public.notifications for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
-- No insert policy: only notify_project_member() (SECURITY DEFINER) writes rows.

-- ============================================================
-- notify_project_member: notifies whichever project member is
-- NOT the actor. Used by every money/status/message event below.
-- ============================================================
create function public.notify_project_member(
  p_project_id uuid,
  p_exclude_user uuid,
  p_type text,
  p_payload jsonb
)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_freelancer_id uuid;
  v_client_id uuid;
  v_recipient uuid;
begin
  select freelancer_id, client_id into v_freelancer_id, v_client_id
  from public.projects where id = p_project_id;

  v_recipient := case
    when p_exclude_user = v_freelancer_id then v_client_id
    when p_exclude_user = v_client_id then v_freelancer_id
    else null
  end;

  if v_recipient is not null then
    insert into public.notifications (user_id, project_id, type, payload)
      values (v_recipient, p_project_id, p_type, p_payload);
  end if;
end;
$$;

-- ============================================================
-- post_message: the single gatekeeper for sending a chat message
-- (plain text or a structured milestone request).
-- ============================================================
create function public.post_message(
  p_project_id uuid,
  p_type text,
  p_body text,
  p_attachment_id uuid default null
)
returns public.messages
language plpgsql
security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_freelancer_id uuid;
  v_client_id uuid;
  v_message public.messages;
begin
  select freelancer_id, client_id into v_freelancer_id, v_client_id
  from public.projects where id = p_project_id;

  if v_uid is distinct from v_freelancer_id and v_uid is distinct from v_client_id then
    raise exception 'Not a member of this project';
  end if;

  if p_type not in ('text', 'milestone_request') then
    raise exception 'Invalid message type';
  end if;

  insert into public.messages (project_id, sender_id, type, body, attachment_id)
    values (p_project_id, v_uid, p_type, p_body, p_attachment_id)
    returning * into v_message;

  perform public.notify_project_member(
    p_project_id, v_uid,
    case when p_type = 'milestone_request' then 'milestone_requested' else 'new_message' end,
    jsonb_build_object('message_id', v_message.id, 'body', p_body)
  );

  return v_message;
end;
$$;

-- ============================================================
-- Extend transition_milestone(): post a chat activity event and
-- notify the other party for every milestone status change.
-- ============================================================
create or replace function public.transition_milestone(p_milestone_id uuid, p_new_status text)
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

  if p_new_status = 'funded' then
    insert into public.transactions (project_id, milestone_id, type, amount, currency)
      values (v_milestone.project_id, v_milestone.id, 'charge', v_milestone.amount, v_milestone.currency);
    insert into public.transactions (project_id, milestone_id, type, amount, currency)
      values (v_milestone.project_id, v_milestone.id, 'fee', round(v_milestone.amount * 0.10, 2), v_milestone.currency);
  elsif p_new_status = 'released' then
    insert into public.transactions (project_id, milestone_id, type, amount, currency)
      values (v_milestone.project_id, v_milestone.id, 'payout', v_milestone.amount, v_milestone.currency);
  end if;

  insert into public.messages (project_id, sender_id, type, body)
    values (
      v_milestone.project_id, v_uid, 'milestone_event',
      'Milestone "' || v_milestone.title || '" moved to ' || p_new_status
    );

  perform public.notify_project_member(
    v_milestone.project_id, v_uid, 'milestone_' || p_new_status,
    jsonb_build_object('milestone_id', v_milestone.id, 'title', v_milestone.title, 'status', p_new_status)
  );

  return v_milestone;
end;
$$;

-- ============================================================
-- Extend sign_contract(): post a chat event + notify when the
-- agreement becomes fully signed.
-- ============================================================
create or replace function public.sign_contract(p_contract_id uuid, p_signed_name text)
returns public.contracts
language plpgsql
security definer set search_path = public
as $$
declare
  v_contract public.contracts;
  v_freelancer_id uuid;
  v_client_id uuid;
  v_uid uuid := auth.uid();
  v_signed_count int;
begin
  select * into v_contract from public.contracts where id = p_contract_id for update;

  if v_contract.id is null then
    raise exception 'Contract not found';
  end if;
  if v_contract.status = 'signed' then
    raise exception 'This agreement is already fully signed';
  end if;

  select freelancer_id, client_id into v_freelancer_id, v_client_id
  from public.projects where id = v_contract.project_id;

  if v_uid is distinct from v_freelancer_id and v_uid is distinct from v_client_id then
    raise exception 'Not a member of this project';
  end if;

  if exists (
    select 1 from public.contract_signatures
    where contract_id = p_contract_id and user_id = v_uid
  ) then
    raise exception 'You have already signed this agreement';
  end if;

  insert into public.contract_signatures (contract_id, user_id, signed_name)
    values (p_contract_id, v_uid, p_signed_name);

  select count(*) into v_signed_count
  from public.contract_signatures
  where contract_id = p_contract_id
    and user_id in (v_freelancer_id, v_client_id);

  if v_client_id is not null and v_signed_count >= 2 then
    update public.contracts set status = 'signed' where id = p_contract_id
      returning * into v_contract;

    insert into public.messages (project_id, sender_id, type, body)
      values (v_contract.project_id, v_uid, 'milestone_event', 'The scope agreement has been fully signed.');

    perform public.notify_project_member(
      v_contract.project_id, v_uid, 'contract_signed',
      jsonb_build_object('contract_id', v_contract.id)
    );
  end if;

  return v_contract;
end;
$$;

-- ============================================================
-- Storage RLS: files are uploaded under a path like
-- "<project_id>/<filename>" in the private "deliverables" bucket
-- (create that bucket once via the Supabase dashboard — bucket
-- creation itself isn't part of SQL migrations). These policies
-- restrict every object to that project's two members only.
-- ============================================================
create policy "Members can view their project's storage files"
  on storage.objects for select
  using (
    bucket_id = 'deliverables'
    and (storage.foldername(name))[1]::uuid in (
      select id from public.projects where freelancer_id = auth.uid() or client_id = auth.uid()
    )
  );

create policy "Members can upload to their project's storage folder"
  on storage.objects for insert
  with check (
    bucket_id = 'deliverables'
    and (storage.foldername(name))[1]::uuid in (
      select id from public.projects where freelancer_id = auth.uid() or client_id = auth.uid()
    )
  );
