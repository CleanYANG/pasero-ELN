-- Reporter Generator usage counters (additive; does not touch licensing or beta tables).
-- Stores counts, timings and success flags only — never material, prompts or outputs.
create table if not exists public.reporter_usage (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  action text not null,               -- plan | revise | image | event:<name>
  ok boolean not null default true,
  ms integer,
  detail text,                        -- e.g. 'poster' / style id / feedback value; never content
  created_at timestamptz not null default now(),
  constraint reporter_usage_action_len check (length(action) <= 60),
  constraint reporter_usage_detail_len check (detail is null or length(detail) <= 80)
);

create index if not exists reporter_usage_user_action_time
  on public.reporter_usage (user_id, action, created_at desc);

-- Only the edge function (service role) reads or writes this table.
alter table public.reporter_usage enable row level security;
revoke all on table public.reporter_usage from public, anon, authenticated;

comment on table public.reporter_usage is
  'Reporter Generator per-user usage counts for the free beta allowance and test analytics. No research content is stored.';
