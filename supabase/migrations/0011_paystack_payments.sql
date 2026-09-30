-- ============================================================
-- Phase 2: real money via Paystack (Nigeria-only pilot).
--
-- Milestones priced in this pilot are NGN. Existing simulated rows keep
-- whatever currency they were created with (USD) — historical data only.
-- ============================================================
alter table public.milestones alter column currency set default 'NGN';

-- A refund is a new kind of ledger entry (admin-resolved disputes).
alter table public.transactions drop constraint if exists transactions_type_check;
alter table public.transactions add constraint transactions_type_check
  check (type in ('charge', 'fee', 'payout', 'refund'));

-- Real money needs a real reference on the ledger.
alter table public.transactions add column if not exists reference text;

-- One Paystack transfer recipient per freelancer, created once and reused
-- for every future release.
alter table public.profiles add column if not exists paystack_recipient_code text;

-- ============================================================
-- payment_intents: bookkeeping for in-flight Paystack operations.
-- Kept separate from `transactions` (the append-only completed ledger)
-- so pending/failed attempts never pollute it. A member creates a
-- 'pending' row when they kick off a charge or transfer; only the
-- webhook (via the service-role client, which bypasses RLS) ever moves
-- a row to 'success'/'failed' and acts on it.
-- ============================================================
create table public.payment_intents (
  id uuid primary key default gen_random_uuid(),
  milestone_id uuid not null references public.milestones (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  actor_id uuid not null references auth.users (id),
  kind text not null check (kind in ('charge', 'transfer')),
  reference text not null unique,
  amount_kobo bigint not null check (amount_kobo > 0),
  status text not null default 'pending' check (status in ('pending', 'success', 'failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.payment_intents enable row level security;

create policy "Members can view their project's payment intents"
  on public.payment_intents for select
  using (
    auth.uid() in (
      select freelancer_id from public.projects where id = project_id
      union
      select client_id from public.projects where id = project_id
    )
  );

create policy "Client can create a pending payment intent for their project"
  on public.payment_intents for insert
  with check (
    status = 'pending'
    and auth.uid() = (select client_id from public.projects where id = project_id)
  );
-- No update policy for regular users: only the webhook, using the
-- service-role key (which bypasses RLS entirely), moves a row out of
-- 'pending'. A browser can never mark its own payment successful.

-- ============================================================
-- fund_milestone_from_payment: called ONLY by the Paystack webhook
-- (via the service-role client) after verifying a charge.success event.
-- No auth.uid() check — the trust boundary is that only our own server
-- code holds the service-role key, never the browser.
-- ============================================================
create function public.fund_milestone_from_payment(p_reference text)
returns public.milestones
language plpgsql
security definer set search_path = public
as $$
declare
  v_intent public.payment_intents;
  v_milestone public.milestones;
begin
  select * into v_intent from public.payment_intents
    where reference = p_reference and kind = 'charge'
    for update;

  if v_intent.id is null then
    raise exception 'Unknown payment reference: %', p_reference;
  end if;

  -- Idempotent: Paystack may deliver the same webhook more than once.
  if v_intent.status <> 'pending' then
    select * into v_milestone from public.milestones where id = v_intent.milestone_id;
    return v_milestone;
  end if;

  select * into v_milestone from public.milestones where id = v_intent.milestone_id for update;

  if v_milestone.status <> 'draft' then
    raise exception 'Milestone % is not awaiting funding (status: %)', v_milestone.id, v_milestone.status;
  end if;

  update public.payment_intents set status = 'success', updated_at = now() where id = v_intent.id;

  update public.milestones set status = 'funded', updated_at = now()
    where id = v_milestone.id
    returning * into v_milestone;

  insert into public.milestone_events (milestone_id, from_status, to_status, actor_id)
    values (v_milestone.id, 'draft', 'funded', v_intent.actor_id);

  insert into public.transactions (project_id, milestone_id, type, amount, currency, gateway, reference)
    values (v_milestone.project_id, v_milestone.id, 'charge', v_milestone.amount, v_milestone.currency, 'paystack', p_reference);
  insert into public.transactions (project_id, milestone_id, type, amount, currency, gateway, reference)
    values (v_milestone.project_id, v_milestone.id, 'fee', round(v_milestone.amount * 0.10, 2), v_milestone.currency, 'paystack', p_reference);

  insert into public.messages (project_id, sender_id, type, body)
    values (v_milestone.project_id, v_intent.actor_id, 'milestone_event',
      'Milestone "' || v_milestone.title || '" moved to funded');

  perform public.notify_project_member(
    v_milestone.project_id, v_intent.actor_id, 'milestone_funded',
    jsonb_build_object('milestone_id', v_milestone.id, 'title', v_milestone.title, 'status', 'funded')
  );

  return v_milestone;
end;
$$;

-- ============================================================
-- release_milestone_from_transfer: called ONLY by the Paystack webhook
-- after verifying a transfer.success event. Same trust boundary as above.
-- ============================================================
create function public.release_milestone_from_transfer(p_reference text)
returns public.milestones
language plpgsql
security definer set search_path = public
as $$
declare
  v_intent public.payment_intents;
  v_milestone public.milestones;
begin
  select * into v_intent from public.payment_intents
    where reference = p_reference and kind = 'transfer'
    for update;

  if v_intent.id is null then
    raise exception 'Unknown transfer reference: %', p_reference;
  end if;

  if v_intent.status <> 'pending' then
    select * into v_milestone from public.milestones where id = v_intent.milestone_id;
    return v_milestone;
  end if;

  select * into v_milestone from public.milestones where id = v_intent.milestone_id for update;

  if v_milestone.status <> 'approved' then
    raise exception 'Milestone % is not awaiting release (status: %)', v_milestone.id, v_milestone.status;
  end if;

  update public.payment_intents set status = 'success', updated_at = now() where id = v_intent.id;

  update public.milestones set status = 'released', updated_at = now()
    where id = v_milestone.id
    returning * into v_milestone;

  insert into public.milestone_events (milestone_id, from_status, to_status, actor_id)
    values (v_milestone.id, 'approved', 'released', v_intent.actor_id);

  insert into public.transactions (project_id, milestone_id, type, amount, currency, gateway, reference)
    values (v_milestone.project_id, v_milestone.id, 'payout', v_milestone.amount, v_milestone.currency, 'paystack', p_reference);

  insert into public.messages (project_id, sender_id, type, body)
    values (v_milestone.project_id, v_intent.actor_id, 'milestone_event',
      'Milestone "' || v_milestone.title || '" moved to released');

  perform public.notify_project_member(
    v_milestone.project_id, v_intent.actor_id, 'milestone_released',
    jsonb_build_object('milestone_id', v_milestone.id, 'title', v_milestone.title, 'status', 'released')
  );

  return v_milestone;
end;
$$;

-- ============================================================
-- fail_payment_intent: called by the webhook on charge.failed /
-- transfer.failed so a failed attempt doesn't stay 'pending' forever.
-- ============================================================
create function public.fail_payment_intent(p_reference text)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  update public.payment_intents
    set status = 'failed', updated_at = now()
    where reference = p_reference and status = 'pending';
end;
$$;

-- ============================================================
-- Admin-only way out of a disputed milestone now that real money is
-- involved. The actual Paystack refund/transfer call happens in the
-- application layer (app/admin/actions.ts) BEFORE either of these is
-- called — each function only performs the state transition + ledger
-- entry once that call has already succeeded, and only for an admin.
-- ============================================================
create function public.admin_refund_disputed_milestone(p_milestone_id uuid, p_reference text)
returns public.milestones
language plpgsql
security definer set search_path = public
as $$
declare
  v_milestone public.milestones;
begin
  if not public.is_admin() then
    raise exception 'Forbidden';
  end if;

  select * into v_milestone from public.milestones where id = p_milestone_id for update;

  if v_milestone.id is null then
    raise exception 'Milestone not found';
  end if;
  if v_milestone.status <> 'disputed' then
    raise exception 'Milestone % is not disputed (status: %)', v_milestone.id, v_milestone.status;
  end if;

  update public.milestones set status = 'cancelled', updated_at = now()
    where id = p_milestone_id
    returning * into v_milestone;

  insert into public.milestone_events (milestone_id, from_status, to_status, actor_id)
    values (p_milestone_id, 'disputed', 'cancelled', auth.uid());

  insert into public.transactions (project_id, milestone_id, type, amount, currency, gateway, reference)
    values (v_milestone.project_id, v_milestone.id, 'refund', v_milestone.amount, v_milestone.currency, 'paystack', p_reference);

  perform public.log_admin_action('refund_disputed_milestone', 'milestone', p_milestone_id::text,
    jsonb_build_object('reference', p_reference));

  insert into public.messages (project_id, sender_id, type, body)
    values (v_milestone.project_id, auth.uid(), 'milestone_event',
      'Milestone "' || v_milestone.title || '" refunded to the client by an admin');

  return v_milestone;
end;
$$;

create function public.admin_release_disputed_milestone(p_milestone_id uuid, p_reference text)
returns public.milestones
language plpgsql
security definer set search_path = public
as $$
declare
  v_milestone public.milestones;
begin
  if not public.is_admin() then
    raise exception 'Forbidden';
  end if;

  select * into v_milestone from public.milestones where id = p_milestone_id for update;

  if v_milestone.id is null then
    raise exception 'Milestone not found';
  end if;
  if v_milestone.status <> 'disputed' then
    raise exception 'Milestone % is not disputed (status: %)', v_milestone.id, v_milestone.status;
  end if;

  update public.milestones set status = 'released', updated_at = now()
    where id = p_milestone_id
    returning * into v_milestone;

  insert into public.milestone_events (milestone_id, from_status, to_status, actor_id)
    values (p_milestone_id, 'disputed', 'released', auth.uid());

  insert into public.transactions (project_id, milestone_id, type, amount, currency, gateway, reference)
    values (v_milestone.project_id, v_milestone.id, 'payout', v_milestone.amount, v_milestone.currency, 'paystack', p_reference);

  perform public.log_admin_action('release_disputed_milestone', 'milestone', p_milestone_id::text,
    jsonb_build_object('reference', p_reference));

  insert into public.messages (project_id, sender_id, type, body)
    values (v_milestone.project_id, auth.uid(), 'milestone_event',
      'Milestone "' || v_milestone.title || '" released to the freelancer by an admin');

  return v_milestone;
end;
$$;

-- These three have no auth.uid() check by design — only our trusted server
-- code (holding the service-role key) may ever call them. See 0012 for why.
revoke execute on function public.fund_milestone_from_payment(text) from public, anon, authenticated;
revoke execute on function public.release_milestone_from_transfer(text) from public, anon, authenticated;
revoke execute on function public.fail_payment_intent(text) from public, anon, authenticated;
