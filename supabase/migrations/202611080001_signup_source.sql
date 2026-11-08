-- 2026-11-08: migration "pasero_signup_source" (applied).
-- Channel tag from launch links (pasero.app/?src=reddit) recorded only when someone signs up.
-- The site keeps the tag in sessionStorage (source-tag.js) and beta-signup.js sends it as p_source.
-- First channel wins on repeat sign-ups. Invalid tags are dropped. consent_version is
-- 'privacy-2026-11-08-source' for rows that carry a tag.
alter table pasero_private.beta_signups add column source text;
alter table pasero_private.beta_signups add constraint beta_signups_source_format
  check (source is null or source ~ '^[a-z0-9][a-z0-9_-]{0,31}$');
-- pasero_beta_signup(p_email, p_platform, p_language, p_ref, p_source) replaces the 4-argument version;
-- body as in the live database (see pg_get_functiondef), with:
--   v_source := lower(btrim(p_source)), validated against the same pattern,
--   insert ... source = v_source, on conflict: source = coalesce(s.source, excluded.source).

-- Sign-ups per channel (service_role / SQL editor):
--   select * from pasero_private.beta_signups_by_source order by signups desc;
