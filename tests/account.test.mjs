import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

// A deliberately small DOM and SDK boundary. These tests exercise account
// behavior without credentials, a live session, network requests, or emails.
const html = readFileSync(new URL('../account.html', import.meta.url), 'utf8');
const source = readFileSync(new URL('../pasero-account.js', import.meta.url), 'utf8');
const redirectSource = readFileSync(new URL('../pasero-auth-redirect.js', import.meta.url), 'utf8');
const sessionFixture = { access_token: 'dummy-test-token' };
const betaFixture = {
  program: 'public_beta_2026', active: true,
  starts_at: '2026-10-28T15:00:00Z', ends_at: '2026-12-28T15:00:00Z',
  access: ['desktop_beta', 'mobile_beta'], purchases_enabled: false,
};

class Element {
  constructor(id) {
    this.id = id; this.value = ''; this.type = id === 'account-password' ? 'password' : '';
    this.textContent = ''; this.dataset = {}; this.hidden = false;
    this.attrs = {}; this.handlers = {}; this.disabled = false;
  }
  addEventListener(event, handler) { this.handlers[event] = handler; }
  setAttribute(key, value) { this.attrs[key] = value; }
  focus() { this.focused = true; }
  checkValidity() { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.value); }
}

function account({ hash = '', initialSession = null, rpc, overrides = {}, config = true } = {}) {
  const elements = {};
  for (const match of html.matchAll(/id="([^"]+)"/g)) elements[match[1]] = new Element(match[1]);
  elements['tab-login'].dataset.mode = 'login';
  elements['tab-signup'].dataset.mode = 'signup';
  const calls = [], history = [];
  const auth = {
    getSession: async () => ({ data: { session: initialSession } }),
    getUser: async () => ({ data: { user: { id: 'test-user', email: 'person@example.com' } } }),
    onAuthStateChange(callback) { this.callback = callback; },
    async signInWithPassword(payload) { calls.push({ action: 'login', payload }); return { data: { session: sessionFixture } }; },
    async signUp(payload) { calls.push({ action: 'signup', payload }); return { data: { session: null } }; },
    async resetPasswordForEmail(email, options) { calls.push({ action: 'reset', email, options }); return {}; },
    async resend(payload) { calls.push({ action: 'resend', payload }); return {}; },
    async updateUser(payload) { calls.push({ action: 'update', payload }); return {}; },
    async signOut() { calls.push({ action: 'signout' }); this.callback('SIGNED_OUT', null); return {}; },
    ...overrides,
  };
  const context = {
    URL, URLSearchParams, Intl, Date, Error, TypeError, Number, Promise, setTimeout, clearTimeout,
    location: { hash, search: '', href: 'https://pasero.app/account.html' + hash },
    history: { replaceState(_state, _title, url) { history.push(url); } },
    localStorage: { getItem() { return 'en'; }, setItem() {} },
    document: {
      getElementById(id) { return elements[id]; }, documentElement: {},
      querySelectorAll(selector) { return selector === '[data-mode]' ? [elements['tab-login'], elements['tab-signup']] : []; },
      querySelector() { return new Element('tabs'); },
    },
    window: {
      PASERO_CONFIG: config ? { siteUrl: 'https://pasero.app', supabaseUrl: 'https://test.supabase.co', supabasePublishableKey: 'sb_publishable_dummy' } : null,
      PaseroSupabase: { createClient() { return { auth, rpc: rpc || (async () => ({ data: { ...betaFixture } })) }; } },
    },
  };
  vm.runInNewContext(source, context, { filename: 'pasero-account.js' });
  return {
    elements, calls, auth, history,
    click(id) { return elements[id].handlers.click.call(elements[id]); },
    submit() { return elements['auth-form'].handlers.submit({ preventDefault() {} }); },
    fill(email = 'person@example.com', password = 'a-unique-test-password') {
      elements['account-email'].value = email; elements['account-password'].value = password;
    },
  };
}

const settle = () => new Promise(resolve => setTimeout(resolve, 12));

test('signup and reset target the configured root Site URL', async () => {
  const page = account(); await settle();
  page.click('tab-signup'); page.fill(); await page.submit();
  assert.equal(page.calls[0].action, 'signup');
  assert.equal(page.calls[0].payload.options.emailRedirectTo, 'https://pasero.app');
  assert.equal(page.elements['account-password'].value, '');
  page.click('tab-login'); page.click('forgot-password'); page.fill(); await page.submit();
  assert.equal(page.calls[1].action, 'reset');
  assert.equal(page.calls[1].options.redirectTo, 'https://pasero.app');
  assert.match(page.elements['account-message'].textContent, /If this email has an account/);
});

test('invalid email and short signup password are rejected before any API request', async () => {
  const page = account(); await settle(); page.click('tab-signup');
  page.fill('invalid-email'); await page.submit();
  assert.equal(page.calls.length, 0);
  assert.equal(page.elements['account-email'].focused, true);
  page.fill('person@example.com', 'short'); await page.submit();
  assert.equal(page.calls.length, 0);
  assert.equal(page.elements['account-password'].focused, true);
});

test('login permits an older password below the new-account minimum', async () => {
  const page = account(); await settle(); page.fill('person@example.com', 'oldshort'); await page.submit();
  assert.equal(page.calls[0].action, 'login');
  assert.equal(page.elements['signed-in-view'].hidden, false);
  assert.match(page.elements['access-title'].textContent, /active/);
});

test('recovery hash opens password form and removes callback credentials from URL', async () => {
  const page = account({ hash: '#access_token=dummy&refresh_token=dummy&type=recovery', initialSession: sessionFixture });
  await settle();
  assert.equal(page.elements['email-field'].hidden, true);
  assert.equal(page.elements['signed-in-view'].hidden, true);
  assert.match(page.elements['panel-title'].textContent, /new password/);
  assert.equal(page.history.at(-1), '/account.html');
  page.fill(); await page.submit();
  assert.equal(page.calls[0].action, 'update');
  assert.equal(page.elements['signed-in-view'].hidden, false);
  assert.equal(page.elements['account-password'].value, '');
});

test('invalid links and server errors display safe messages without raw error details', async () => {
  const page = account({ hash: '#error=access_denied&error_description=private-diagnostic-value' }); await settle();
  assert.match(page.elements['account-message'].textContent, /expired or is invalid/);
  assert.doesNotMatch(page.elements['account-message'].textContent, /private-diagnostic/);
  const failed = account({ overrides: { signInWithPassword: async () => ({ error: { code: 'invalid_credentials', message: 'raw-db-error-private-value' } }) } });
  await settle(); failed.fill(); await failed.submit();
  assert.match(failed.elements['account-message'].textContent, /Check your email and password/);
  assert.doesNotMatch(failed.elements['account-message'].textContent, /raw-db-error/);
});

test('email delivery restrictions are handled without exposing provider details', async () => {
  const page = account({ overrides: { signUp: async () => ({ error: { code: 'email_address_not_authorized', message: 'organization-only-secret-detail' } }) } });
  await settle(); page.click('tab-signup'); page.fill(); await page.submit();
  assert.match(page.elements['account-message'].textContent, /Email delivery is temporarily unavailable/);
  assert.doesNotMatch(page.elements['account-message'].textContent, /organization-only/);
});

test('RPC failure cannot become an active access state', async () => {
  const page = account({ initialSession: sessionFixture, rpc: async () => ({ data: null, error: { message: 'private-sql-detail' } }) });
  await settle();
  assert.equal(page.elements['access-card'].dataset.state, 'error');
  assert.doesNotMatch(page.elements['access-title'].textContent, /is active/);
  assert.doesNotMatch(page.elements['access-description'].textContent, /private-sql/);
});

test('signout clears access even when a previous RPC completes afterward', async () => {
  let complete;
  const page = account({ initialSession: sessionFixture, rpc: () => new Promise(resolve => { complete = resolve; }) });
  await settle(); assert.equal(typeof complete, 'function');
  await page.click('sign-out');
  complete({ data: { ...betaFixture } }); await settle();
  assert.equal(page.elements['signed-in-view'].hidden, true);
  assert.equal(page.elements['auth-view'].hidden, false);
  assert.equal(page.elements['signed-in-email'].textContent, '');
  assert.doesNotMatch(page.elements['access-title'].textContent, /is active/);
});

test('missing configuration leaves account actions disabled and downloads available', async () => {
  const page = account({ config: false }); await settle();
  assert.equal(page.elements['auth-submit'].disabled, true);
  assert.match(page.elements['account-message'].textContent, /still visit downloads/);
});

test('root callback forwarding uses only the fixed local account destination', () => {
  let destination = '';
  const location = { hash: '#access_token=dummy&next=https://untrusted.example', search: '?next=https://untrusted.example', replace(url) { destination = url; } };
  vm.runInNewContext(redirectSource, { URLSearchParams, window: { location } });
  assert.equal(destination, '/account.html?next=https://untrusted.example#access_token=dummy&next=https://untrusted.example');
  destination = ''; location.hash = '#pricing'; location.search = '';
  vm.runInNewContext(redirectSource, { URLSearchParams, window: { location } });
  assert.equal(destination, '');
});
