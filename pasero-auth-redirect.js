(function () {
  'use strict';
  var hash = new URLSearchParams(window.location.hash.slice(1));
  var query = new URLSearchParams(window.location.search);
  var hasTokens = hash.has('access_token') || hash.has('refresh_token');
  var hasError = hash.has('error') || hash.has('error_code');
  if (!hasTokens && !hasError && !query.has('code')) return;
  // Authentication may return only to the configured Site URL. Forward it to
  // our fixed local account page; never accept a redirect destination from a URL.
  window.location.replace('/account.html' + window.location.search + window.location.hash);
}());
