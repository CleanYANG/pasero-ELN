# reporter — Pasero AI (Supabase Edge Function)

Source of the live `reporter` function (project `gnfxemlrgjwcqxqruzev`, deployed with `verify_jwt = false`; the function checks the user's session itself).
Used by the desktop and mobile apps and by pasero.app tools for chat, schematics, journal-club / talk / poster generation, figure layout and the protocol organiser.

- Provider keys and settings live only in the function's secrets (`OPENAI_API_KEY`, `REPORTER_*`). No key is stored in this folder.
- Request content is never stored; `public.reporter_usage` keeps only action, success, duration and a short detail tag.

## Beta allowance (points)
`REPORTER_BETA_POINTS` (default 100) points per account between `REPORTER_TRIAL_START` and `REPORTER_TRIAL_END`, charged with the table in `quota-policy.ts` (same as the pricing page). `0` switches back to the old per-action counts (`REPORTER_LIMIT_*`).
Accounts listed in `REPORTER_UNLIMITED_TEST_USERS` have unlimited chat and image.

## Regions
Requests from `REPORTER_BLOCKED_COUNTRIES` (default `CN`) get `451 REGION_UNAVAILABLE`. The country is read from the `cf-ipcountry` / `x-country` header; when no header is present the request is allowed and `geo: no country header` is logged.

## Test and deploy
Run from this folder (its `deno.json` keeps Deno away from the website's `package.json`):
```
deno test quota-policy.test.ts
deno check index.ts
supabase functions deploy reporter --no-verify-jwt
```
