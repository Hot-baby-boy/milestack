-- fund_milestone_from_payment / release_milestone_from_transfer / fail_payment_intent
-- have no auth.uid() check by design (they're meant to be called only by our
-- trusted server code, never a browser). Without this revoke, PostgREST's
-- default grants would let ANY authenticated user call them directly via
-- supabase.rpc(...) and fake a "paid" milestone without ever paying.
-- Only the service-role key (which bypasses grants entirely) may call these.
revoke execute on function public.fund_milestone_from_payment(text) from public, anon, authenticated;
revoke execute on function public.release_milestone_from_transfer(text) from public, anon, authenticated;
revoke execute on function public.fail_payment_intent(text) from public, anon, authenticated;
