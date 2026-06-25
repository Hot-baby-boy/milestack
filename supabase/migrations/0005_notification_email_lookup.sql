-- get_latest_notification_recipient: lets the calling server action find
-- who should be emailed for the event it just triggered. The caller (the
-- actor) isn't allowed to read the recipient's notification row directly
-- under normal RLS (correctly — that's their own private data), so this
-- narrow SECURITY DEFINER function returns only the minimum needed to send
-- a best-effort email: the recipient's address, the event type, and payload.
create function public.get_latest_notification_recipient(p_project_id uuid, p_exclude_user uuid)
returns table (email text, type text, payload jsonb)
language plpgsql
security definer set search_path = public
as $$
begin
  return query
  select pr.email, n.type, n.payload
  from public.notifications n
  join public.profiles pr on pr.id = n.user_id
  where n.project_id = p_project_id
    and n.user_id <> p_exclude_user
  order by n.created_at desc
  limit 1;
end;
$$;
