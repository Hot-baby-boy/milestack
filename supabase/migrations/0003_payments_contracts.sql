-- ============================================================
-- transactions: append-only simulated money ledger
-- ============================================================
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  milestone_id uuid not null references public.milestones (id) on delete cascade,
  type text not null check (type in ('charge', 'fee', 'payout')),
  amount numeric(12, 2) not null check (amount > 0),
  currency text not null default 'USD',
  gateway text not null default 'simulated',
  created_at timestamptz not null default now()
);

alter table public.transactions enable row level security;

create policy "Members can view their project's transactions"
  on public.transactions for select
  using (
    auth.uid() in (
      select freelancer_id from public.projects where id = project_id
      union
      select client_id from public.projects where id = project_id
    )
  );
-- No insert policy for regular users: rows are only ever written by
-- transition_milestone() below (SECURITY DEFINER), same protected-ledger
-- pattern already used for milestone_events.

-- ============================================================
-- contracts: a generated scope agreement, one per project
-- ============================================================
create table public.contracts (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null unique references public.projects (id) on delete cascade,
  content text not null,
  status text not null default 'draft' check (status in ('draft', 'signed')),
  created_at timestamptz not null default now()
);

alter table public.contracts enable row level security;

create policy "Members can view their project's contract"
  on public.contracts for select
  using (
    auth.uid() in (
      select freelancer_id from public.projects where id = project_id
      union
      select client_id from public.projects where id = project_id
    )
  );
-- No insert/update policy for regular users: only generate_contract() and
-- sign_contract() below may write, so a frozen signed contract can never
-- be edited by either party directly.

-- ============================================================
-- contract_signatures: who signed, with what name, and when
-- ============================================================
create table public.contract_signatures (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.contracts (id) on delete cascade,
  user_id uuid not null references auth.users (id),
  signed_name text not null,
  signed_at timestamptz not null default now(),
  unique (contract_id, user_id)
);

alter table public.contract_signatures enable row level security;

create policy "Members can view their project's signatures"
  on public.contract_signatures for select
  using (
    auth.uid() in (
      select p.freelancer_id from public.contracts c join public.projects p on p.id = c.project_id where c.id = contract_id
      union
      select p.client_id from public.contracts c join public.projects p on p.id = c.project_id where c.id = contract_id
    )
  );

-- ============================================================
-- Extend transition_milestone(): write simulated ledger entries
-- for the two money-relevant transitions, in the same atomic
-- function/transaction as the status change.
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

  return v_milestone;
end;
$$;

-- ============================================================
-- generate_contract: freelancer builds (or rebuilds) the scope
-- agreement from the project's current milestones, while still draft.
-- ============================================================
create function public.generate_contract(p_project_id uuid)
returns public.contracts
language plpgsql
security definer set search_path = public
as $$
declare
  v_project public.projects;
  v_contract public.contracts;
  v_body text;
  v_line text;
  v_milestone record;
begin
  select * into v_project from public.projects where id = p_project_id;

  if v_project.id is null then
    raise exception 'Project not found';
  end if;
  if auth.uid() is distinct from v_project.freelancer_id then
    raise exception 'Only the freelancer can generate the agreement';
  end if;

  select * into v_contract from public.contracts where project_id = p_project_id;
  if v_contract.id is not null and v_contract.status = 'signed' then
    raise exception 'This agreement is already signed and cannot be regenerated';
  end if;

  v_body := 'Scope Agreement for ' || v_project.name || E'\n\n'
    || 'This agreement covers the following milestones:' || E'\n\n';

  for v_milestone in
    select title, amount, currency, due_date
    from public.milestones
    where project_id = p_project_id
    order by created_at
  loop
    v_line := '- ' || v_milestone.title || ': ' || v_milestone.currency || ' ' || v_milestone.amount;
    if v_milestone.due_date is not null then
      v_line := v_line || ' (due ' || v_milestone.due_date || ')';
    end if;
    v_body := v_body || v_line || E'\n';
  end loop;

  v_body := v_body || E'\nBoth parties agree that funds for each milestone are held until the client '
    || 'approves the delivered work, at which point they are released to the freelancer.';

  insert into public.contracts (project_id, content, status)
    values (p_project_id, v_body, 'draft')
    on conflict (project_id) do update
      set content = excluded.content
    returning * into v_contract;

  return v_contract;
end;
$$;

-- ============================================================
-- sign_contract: records one party's signature; once both the
-- freelancer and client have signed, the contract is frozen.
-- ============================================================
create function public.sign_contract(p_contract_id uuid, p_signed_name text)
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
  end if;

  return v_contract;
end;
$$;
