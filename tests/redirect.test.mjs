import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

const script = readFileSync(new URL('../pasero-auth-redirect.js', import.meta.url), 'utf8');
function destination(hash, search = '') {
  let redirected;
  vm.runInNewContext(script, { URLSearchParams,
    window: { location: { hash, search, replace: value => { redirected = value; } } },
  });
  return redirected;
}

test('ordinary marketing anchors stay on the homepage', () => {
  assert.equal(destination('#pricing'), undefined);
  assert.equal(destination('#desktop-explorer', '?utm_source=demo'), undefined);
});
test('confirmation and recovery callbacks preserve payload on the fixed account page', () => {
  const hash = '#access_token=dummy&refresh_token=dummy&type=recovery';
  assert.equal(destination(hash), '/account.html' + hash);
});
test('expired email links reach the account error UI', () => {
  assert.equal(destination('#error=access_denied&error_code=otp_expired'),
    '/account.html#error=access_denied&error_code=otp_expired');
});
test('callback parameters cannot select an external redirect destination', () => {
  const result = destination('#access_token=dummy', '?next=https://example.invalid');
  assert.equal(new URL(result, 'https://pasero.app').origin, 'https://pasero.app');
  assert.equal(new URL(result, 'https://pasero.app').pathname, '/account.html');
});
