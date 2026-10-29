# Pasero public beta backend

The additive migration in `migrations/202610290001_public_beta_access.sql`
preserves the existing licensing sandbox and its subscription, device, and
licence tables and RPCs. It adds only the server-controlled beta window and a
read-only function for a signed-in account. Browsing the website and using
free software remain available without an account.

The global public beta runs from **2026-10-29 00:00 JST** through
**2026-12-29 00:00 JST**, with the end instant excluded. It lasts two calendar
months for the programme; signing up later does not restart the window.
Payments stay disabled. Beta access is separate from paid Pro entitlements.

## API

After signing in with Supabase Auth, call:

```js
const { data, error } = await supabase.rpc('pasero_get_my_beta_access');
if (error) throw error;
// Check data.active before enabling data.access in a client.
```

The equivalent request is:

```http
POST https://gnfxemlrgjwcqxqruzev.supabase.co/rest/v1/rpc/pasero_get_my_beta_access
apikey: <Supabase publishable key>
Authorization: Bearer <signed-in user's access token>
Content-Type: application/json

{}
```

During the enabled window the response has this shape:

```json
{
  "program": "public_beta_2026",
  "active": true,
  "starts_at": "2026-10-28T15:00:00+00:00",
  "ends_at": "2026-12-28T15:00:00+00:00",
  "access": ["desktop_beta", "mobile_beta"],
  "purchases_enabled": false
}
```

Before the start, at or after the end, or when the administrator disables the
programme, `active` is `false` and `access` is empty. Dates are derived from
the database configuration and the server clock. The function takes no user
ID or other parameters and writes no account records. Unauthenticated calls
are denied; signed-in users cannot read or edit the private table directly.
The private table intentionally has RLS enabled without client policies.

Use only the project URL and a publishable key in browser code. Never expose
a secret or service-role key. The migration does not change Auth Site URL,
redirect URLs, SMTP settings, or payment-provider configuration.

## Scope

This repository contains the marketing website. Native desktop and mobile
client source code is not present here; each client must integrate this beta
status separately before this endpoint affects its functionality. This RPC
does not itself unlock an installed application, modify local trial logic,
or issue a signed licence.
