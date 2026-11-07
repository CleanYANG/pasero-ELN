-- Optional e-mail sign-up on the download page for the beta-tester discount (applied 2026-11-07).
-- Write-only for the public: anon may call the RPC, only service_role can read the table.
create table pasero_private.beta_signups (
  email text primary key,
  program text not null default 'beta_2026',
  platforms text[] not null default '{}',
  language text,
  consent_version text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint beta_signups_email_lower check (email = lower(email)),
  constraint beta_signups_email_length check (length(email) between 6 and 254)
);
alter table pasero_private.beta_signups enable row level security;
revoke all on table pasero_private.beta_signups from public, anon, authenticated;

create function public.pasero_beta_signup(p_email text, p_platform text default null, p_language text default null)
returns jsonb language plpgsql security definer set search_path = '' as $function$
declare
  v_email text := lower(btrim(coalesce(p_email, '')));
  v_platform text := nullif(btrim(coalesce(p_platform, '')), '');
  v_language text := nullif(btrim(coalesce(p_language, '')), '');
  v_recent integer;
begin
  if length(v_email) < 6 or length(v_email) > 254
     or v_email !~ '^[^@\s<>()",;:]+@[^@\s<>()",;:]+\.[a-z]{2,}$' then
    raise exception 'INVALID_EMAIL' using errcode = '22023';
  end if;
  if v_platform is not null and v_platform not in ('windows', 'macos', 'android', 'ios') then v_platform := null; end if;
  if v_language is not null and v_language not in ('en', 'zh', 'ja') then v_language := null; end if;
  select count(*) into v_recent from pasero_private.beta_signups where created_at > now() - interval '1 minute';
  if v_recent >= 60 then raise exception 'RATE_LIMIT' using errcode = '54000'; end if;
  insert into pasero_private.beta_signups as s (email, platforms, language, consent_version)
  values (v_email, case when v_platform is null then '{}'::text[] else array[v_platform] end, v_language, 'privacy-2026-11-07')
  on conflict (email) do update
    set platforms = (select coalesce(array_agg(distinct p order by p), '{}') from unnest(s.platforms || excluded.platforms) p),
        language = coalesce(excluded.language, s.language),
        updated_at = now();
  return jsonb_build_object('ok', true);
end;
$function$;
revoke all on function public.pasero_beta_signup(text, text, text) from public;
grant execute on function public.pasero_beta_signup(text, text, text) to anon, authenticated;

-- Export for the discount mail-out (run with service_role / SQL editor):
--   select email, platforms, language, created_at from pasero_private.beta_signups order by created_at;
-- Delete on request:
--   delete from pasero_private.beta_signups where email = lower('someone@example.com');

-- 2026-11-07 (later): invite-a-friend. Applied as migration "pasero_beta_referrals":
--   beta_signups gains referral_code (8 hex chars, unique) and referred_by_code;
--   pasero_beta_signup gains p_ref and returns {ok, referral_code};
--   view pasero_private.beta_referral_discounts lists who qualifies for the 20% referral discount.
-- Mail-out list:
--   select email, friends_invited, referral_discount from pasero_private.beta_referral_discounts order by created_at;
