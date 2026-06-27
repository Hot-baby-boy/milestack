-- Add payout method fields to profiles
alter table profiles
  add column if not exists payout_method text check (payout_method in ('local_bank','paypal','payoneer','wise','raenest')),
  add column if not exists payout_details text;
