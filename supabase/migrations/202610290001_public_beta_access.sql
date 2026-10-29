-- Optional-account public beta. This does not create a paid subscription or
-- change any existing licensing sandbox table, function, or product catalogue.
create table pasero_private.beta_programs (
  program text primary key,
  enabled boolean not null default false,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  constraint beta_programs_nonempty_program check (length(program) > 0),
  constraint beta_programs_valid_window check (ends_at > starts_at)
);

alter table pasero_private.beta_programs enable row level security;
revoke all on table pasero_private.beta_programs from public, anon, authenticated;

-- A fixed two-calendar-month window in Japan, not a rolling trial per account.
-- Existing administrator edits are retained if the seed is reapplied.
insert into pasero_private.beta_programs (program, enabled, starts_at, ends_at)
values (
  'public_beta_2026',
  true,
  '2026-10-29 00:00:00+09'::timestamptz,
  '2026-12-29 00:00:00+09'::timestamptz
)
on conflict (program) do nothing;

create function public.pasero_get_my_beta_access()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  beta pasero_private.beta_programs%rowtype;
  beta_active boolean;
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED' using errcode = '42501';
  end if;

  select * into strict beta
  from pasero_private.beta_programs
  where program = 'public_beta_2026';

  beta_active := beta.enabled
    and now() >= beta.starts_at
    and now() < beta.ends_at;

  return jsonb_build_object(
    'program', beta.program,
    'active', beta_active,
    'starts_at', beta.starts_at,
    'ends_at', beta.ends_at,
    'access', case when beta_active
      then jsonb_build_array('desktop_beta', 'mobile_beta')
      else '[]'::jsonb end,
    'purchases_enabled', false
  );
end;
$function$;

-- Supabase functions otherwise receive a PUBLIC EXECUTE grant by default.
-- The internal auth.uid() guard also rejects calls without a user JWT subject.
revoke all on function public.pasero_get_my_beta_access()
  from public, anon, authenticated, service_role;
grant execute on function public.pasero_get_my_beta_access() to authenticated;

comment on table pasero_private.beta_programs is
  'Server-controlled public-beta window. No client table access or RLS policies; read through the authenticated beta RPC.';
comment on function public.pasero_get_my_beta_access() is
  'Read-only public-beta access for the current authenticated user. Does not grant paid Pro entitlements.';
