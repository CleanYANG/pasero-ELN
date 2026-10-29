(function () {
  'use strict';

  var copy = {
    en: {
      title: 'Your account — Pasero', skip: 'Skip to account', home: 'Home', downloads: 'Downloads', language: 'Language',
      introTitle: 'A small space.\nFor your next steps.', introCopy: 'Your account keeps your test access in one place. Your research stays in your local workspace.',
      betaTitle: 'Public beta · free to explore', betaCopy: 'The shared test period ends on 29 December 2026, 00:00 Japan time. No payment details are needed.',
      optional: 'An account is optional for downloads and local work.', continueDownloads: 'Continue to downloads',
      accountKicker: 'YOUR PASERO ACCOUNT', login: 'Sign in', signup: 'Create account', loginTitle: 'Welcome back.', loginDescription: 'Sign in to check your public beta access.',
      signupTitle: 'Make room for what’s next.', signupDescription: 'Create an account, then confirm your email to check your test access.',
      resetTitle: 'A fresh start.', resetDescription: 'We’ll email you a link to choose a new password.', resetSubmit: 'Send reset link',
      recoveryTitle: 'Choose a new password.', recoveryDescription: 'Use a unique password with at least 12 characters.', recoverySubmit: 'Save new password',
      email: 'Email', password: 'Password', show: 'Show', hide: 'Hide', passwordHint: 'Use at least 12 characters.',
      forgot: 'Forgot password?', resend: 'Resend confirmation', backToLogin: 'Back to sign in', signedInTitle: 'All in one place.',
      accessLabel: 'TEST ACCESS', checking: 'Checking access…', activeTitle: 'Your beta access is active.',
      activeDescription: 'Desktop and mobile public beta access is available during the shared test period. Payment is not enabled.',
      inactiveTitle: 'The test period is not active.', inactiveDescription: 'There is no active public beta access at the moment. Local features remain available according to the app release.',
      accessFootnote: 'This page shows your server-confirmed test access. Software availability and features are provided by each app release.',
      refresh: 'Refresh access', signout: 'Sign out', footer: 'Small details. Connected research.', working: 'Please wait…',
      emailInvalid: 'Enter a valid email address.', passwordRequired: 'Enter your password.', passwordShort: 'Use a password between 12 and 128 characters.',
      passwordLong: 'Your password must be no more than 128 characters.', loginFailed: 'We couldn’t sign you in. Check your email and password, or reset your password.',
      confirmFirst: 'Please confirm your email before signing in. You can resend the confirmation email below.',
      signupSent: 'If this address can be registered, we’ll send a confirmation email. Check your inbox and spam folder, then follow the link.',
      resetSent: 'If this email has an account, we’ll send a password reset link. Check your inbox and spam folder.',
      resendSent: 'If confirmation is still needed for this address, we’ll send a new email. Check your inbox and spam folder.',
      passwordSaved: 'Your password has been updated.', signedOut: 'You have signed out.',
      rateLimit: 'Too many requests. Please wait a few minutes before trying again.', network: 'The service could not be reached. Check your connection and try again.',
      unavailable: 'Account access is temporarily unavailable. You can still visit downloads.', emailUnavailable: 'Email delivery is temporarily unavailable. Please contact Pasero support or try again later.',
      linkExpired: 'This sign-in link has expired or is invalid. Request a new confirmation or password reset email.',
      serviceError: 'We couldn’t complete that request. Please try again later.', accessErrorTitle: 'Access could not be checked.',
      accessErrorDescription: 'We couldn’t confirm your access with the server. Try refreshing in a moment.', dateLabel: 'Ends ', noRecovery: 'Open a valid password reset email to choose a new password.',
      sessionExpired: 'Your session has expired. Please sign in again.',
    },
    zh: {
      title: '账户 — Pasero 雀角', skip: '跳至账户', home: '首页', downloads: '下载', language: '语言',
      introTitle: '微而具体。\n下一步，在这里。', introCopy: '在这里查看你的测试权限，科研记录继续保存在本地工作空间。',
      betaTitle: '公开测试 · 免费体验', betaCopy: '本轮统一测试期截至 2026 年 12 月 29 日 00:00（日本时间），无需填写支付信息。',
      optional: '下载和本地使用无需注册账户。', continueDownloads: '前往下载', accountKicker: '你的 PASERO 账户',
      login: '登录', signup: '注册账户', loginTitle: '欢迎回来。', loginDescription: '登录后查看你的公开测试权限。',
      signupTitle: '为下一步做好准备。', signupDescription: '注册后请先验证邮箱，再登录查看测试权限。',
      resetTitle: '重新开始。', resetDescription: '我们会发送邮件，帮你设置新密码。', resetSubmit: '发送重置邮件',
      recoveryTitle: '设置新密码。', recoveryDescription: '请使用至少 12 位、与其他网站不同的密码。', recoverySubmit: '保存新密码',
      email: '邮箱', password: '密码', show: '显示', hide: '隐藏', passwordHint: '请使用至少 12 位密码。',
      forgot: '忘记密码？', resend: '重发验证邮件', backToLogin: '返回登录', signedInTitle: '你的账户，一目了然。',
      accessLabel: '测试权限', checking: '正在核对权限…', activeTitle: '测试权限已生效。',
      activeDescription: '统一测试期内可体验桌面端和移动端公开测试功能，支付尚未开启。',
      inactiveTitle: '当前不在测试期。', inactiveDescription: '目前没有生效中的公开测试权限。本地功能以所安装的软件版本为准。',
      accessFootnote: '此处展示服务器确认的测试权限，实际可用功能和软件发布状态以各端版本为准。',
      refresh: '刷新权限', signout: '退出登录', footer: '连接科研中的每个小细节。', working: '请稍候…',
      emailInvalid: '请填写有效的邮箱地址。', passwordRequired: '请填写密码。', passwordShort: '请使用 12 至 128 位密码。', passwordLong: '密码不能超过 128 位。',
      loginFailed: '登录未成功，请检查邮箱和密码，或尝试重置密码。', confirmFirst: '请先验证邮箱后再登录，也可以在下方重发验证邮件。',
      signupSent: '如果该邮箱可以注册，我们会发送验证邮件。请检查收件箱和垃圾邮件，并打开邮件中的链接。',
      resetSent: '如果该邮箱已注册，我们会发送密码重置邮件，请检查收件箱和垃圾邮件。',
      resendSent: '如果该邮箱仍需验证，我们会重新发送邮件，请检查收件箱和垃圾邮件。',
      passwordSaved: '新密码已保存。', signedOut: '已退出登录。', rateLimit: '请求过于频繁，请等几分钟后重试。',
      network: '暂时无法连接服务，请检查网络后重试。', unavailable: '账户服务暂时不可用，你仍可前往下载页面。', emailUnavailable: '邮件暂时无法发送，请联系 Pasero 或稍后重试。',
      linkExpired: '登录链接已失效或无效，请重新发送验证邮件或密码重置邮件。', serviceError: '暂时无法完成操作，请稍后重试。',
      accessErrorTitle: '暂时无法核对权限。', accessErrorDescription: '无法从服务器确认测试权限，请稍后刷新。', dateLabel: '截至 ',
      noRecovery: '请打开有效的密码重置邮件来设置新密码。', sessionExpired: '登录已过期，请重新登录。',
    },
    ja: {
      title: 'アカウント — Pasero 雀角', skip: 'アカウントへ移動', home: 'ホーム', downloads: 'ダウンロード', language: '言語',
      introTitle: '小さな場所から、\n次の一歩へ。', introCopy: 'テスト利用状況をここで確認できます。研究の記録は、引き続きローカルのワークスペースに。',
      betaTitle: '公開ベータ · 無料で体験', betaCopy: '共通のテスト期間は2026年12月29日 0:00（日本時間）までです。支払い情報は不要です。',
      optional: 'ダウンロードとローカルでの利用にアカウントは不要です。', continueDownloads: 'ダウンロードへ', accountKicker: 'PASERO アカウント',
      login: 'ログイン', signup: 'アカウント作成', loginTitle: 'おかえりなさい。', loginDescription: 'ログインして公開ベータの利用状況を確認しましょう。',
      signupTitle: '次の一歩を、ここから。', signupDescription: '登録後にメールアドレスを確認すると、テスト利用状況を確認できます。',
      resetTitle: '新しく始めましょう。', resetDescription: '新しいパスワードを設定するリンクをメールで送信します。', resetSubmit: '再設定メールを送信',
      recoveryTitle: '新しいパスワードを設定。', recoveryDescription: '他のサイトと異なる、12文字以上のパスワードを使用してください。', recoverySubmit: '新しいパスワードを保存',
      email: 'メールアドレス', password: 'パスワード', show: '表示', hide: '隠す', passwordHint: '12文字以上で設定してください。',
      forgot: 'パスワードを忘れた場合', resend: '確認メールを再送信', backToLogin: 'ログインに戻る', signedInTitle: 'ここで、ひと目に。',
      accessLabel: 'テスト利用状況', checking: '利用状況を確認中…', activeTitle: 'ベータ版を利用できます。',
      activeDescription: '共通のテスト期間中、デスクトップ版とモバイル版の公開ベータを利用できます。決済は無効です。',
      inactiveTitle: '現在はテスト期間外です。', inactiveDescription: '現在有効な公開ベータの利用権限はありません。ローカル機能は各アプリの提供状況に準じます。',
      accessFootnote: 'サーバーで確認したテスト利用状況を表示しています。利用できる機能と配布状況は各アプリのリリースに準じます。',
      refresh: '利用状況を更新', signout: 'ログアウト', footer: '研究の小さなひとつひとつを、つなぐ。', working: 'お待ちください…',
      emailInvalid: '有効なメールアドレスを入力してください。', passwordRequired: 'パスワードを入力してください。', passwordShort: '12〜128文字のパスワードを使用してください。', passwordLong: 'パスワードは128文字以下にしてください。',
      loginFailed: 'ログインできませんでした。メールアドレスとパスワードを確認するか、パスワードを再設定してください。', confirmFirst: 'メールアドレスを確認してからログインしてください。下のボタンから確認メールを再送できます。',
      signupSent: 'このアドレスを登録できる場合、確認メールを送信します。受信箱と迷惑メールフォルダーを確認し、メールのリンクを開いてください。',
      resetSent: 'このメールアドレスが登録されている場合、パスワード再設定メールを送信します。受信箱と迷惑メールフォルダーを確認してください。',
      resendSent: 'このアドレスに確認が必要な場合、メールを再送します。受信箱と迷惑メールフォルダーを確認してください。',
      passwordSaved: 'パスワードを更新しました。', signedOut: 'ログアウトしました。', rateLimit: 'リクエストが多すぎます。数分後に再試行してください。',
      network: 'サービスに接続できませんでした。ネットワークを確認して再試行してください。', unavailable: 'アカウント機能は一時的に利用できません。ダウンロードページは引き続き利用できます。', emailUnavailable: '現在メールを送信できません。Paseroにお問い合わせいただくか、しばらくしてから再試行してください。',
      linkExpired: 'このリンクは期限切れ、または無効です。確認メールまたはパスワード再設定メールを再送してください。', serviceError: '処理を完了できませんでした。しばらくしてから再試行してください。',
      accessErrorTitle: '利用状況を確認できません。', accessErrorDescription: 'サーバーで確認できませんでした。しばらくしてから更新してください。', dateLabel: '終了日時：',
      noRecovery: '有効なパスワード再設定メールを開いてください。', sessionExpired: 'セッションの期限が切れました。もう一度ログインしてください。',
    },
  };
  var $ = function (id) { return document.getElementById(id); };
  var lang = 'en';
  try { var saved = localStorage.getItem('coolab-language'); if (saved === 'zh' || saved === 'ja') lang = saved; } catch (_) {}
  var mode = 'login', busy = false, currentUser = null, access = null, accessState = 'loading';
  var messageKey = '', messageKind = 'info', client = null, version = 0;
  var initialHash = new URLSearchParams(location.hash.slice(1));
  var recovery = initialHash.get('type') === 'recovery';
  var linkError = initialHash.has('error') || initialHash.has('error_code');
  var callbackInProgress = initialHash.has('access_token') || new URLSearchParams(location.search).has('code');
  var t = function (key) { return copy[lang][key] || copy.en[key] || ''; };

  function showMessage(key, kind) {
    messageKey = key || ''; messageKind = kind || 'info';
    $('account-message').textContent = t(messageKey);
    $('account-message').hidden = !messageKey;
    $('account-message').dataset.kind = messageKind;
  }
  function setBusy(value) {
    busy = value;
    ['auth-submit', 'forgot-password', 'resend-confirmation', 'sign-out', 'refresh-access'].forEach(function (id) { $(id).disabled = value || !client; });
    $('auth-form').setAttribute('aria-busy', String(value));
    $('auth-submit').textContent = t(value ? 'working' : mode === 'signup' ? 'signup' : mode === 'reset' ? 'resetSubmit' : mode === 'recovery' ? 'recoverySubmit' : 'login');
  }
  function renderAccess() {
    var active = accessState === 'ready' && access && access.active === true;
    $('access-card').dataset.state = accessState;
    $('access-title').textContent = t(accessState === 'loading' ? 'checking' : accessState === 'error' ? 'accessErrorTitle' : active ? 'activeTitle' : 'inactiveTitle');
    $('access-description').textContent = accessState === 'loading' ? '' : t(accessState === 'error' ? 'accessErrorDescription' : active ? 'activeDescription' : 'inactiveDescription');
    $('access-date').textContent = '';
    if (access && access.ends_at && accessState === 'ready') {
      var date = new Date(access.ends_at);
      if (Number.isFinite(date.getTime())) $('access-date').textContent = t('dateLabel') + new Intl.DateTimeFormat(lang === 'zh' ? 'zh-CN' : lang === 'ja' ? 'ja-JP' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Tokyo' }).format(date) + ' (JST)';
    }
    $('access-date').hidden = !$('access-date').textContent;
    $('refresh-access').disabled = busy || accessState === 'loading' || !client;
  }
  function render() {
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : lang;
    document.title = t('title');
    document.querySelectorAll('[data-i18n]').forEach(function (el) { el.textContent = t(el.dataset.i18n); });
    $('account-language').value = lang;
    $('account-language').setAttribute('aria-label', t('language'));
    var signedIn = !!currentUser && !recovery;
    $('auth-view').hidden = signedIn;
    $('signed-in-view').hidden = !signedIn;
    $('signed-in-email').textContent = currentUser ? currentUser.email || '' : '';
    var prefix = mode === 'signup' ? 'signup' : mode === 'reset' ? 'reset' : mode === 'recovery' ? 'recovery' : 'login';
    $('panel-title').textContent = t(prefix + 'Title');
    $('panel-description').textContent = t(prefix + 'Description');
    $('tab-login').setAttribute('aria-selected', String(mode === 'login'));
    $('tab-signup').setAttribute('aria-selected', String(mode === 'signup'));
    $('tab-login').setAttribute('tabindex', mode === 'signup' ? '-1' : '0');
    $('tab-signup').setAttribute('tabindex', mode === 'signup' ? '0' : '-1');
    document.querySelector('.auth-tabs').hidden = mode === 'reset' || mode === 'recovery';
    $('email-field').hidden = mode === 'recovery';
    $('account-email').required = mode !== 'recovery';
    $('password-field').hidden = mode === 'reset';
    $('account-password').required = mode !== 'reset';
    $('account-password').autocomplete = mode === 'login' ? 'current-password' : 'new-password';
    $('password-hint').hidden = mode === 'login' || mode === 'reset';
    $('forgot-password').hidden = mode !== 'login';
    $('resend-confirmation').hidden = mode !== 'login' && mode !== 'signup';
    $('back-to-login').hidden = mode !== 'reset' && mode !== 'recovery';
    $('show-password').textContent = t($('account-password').type === 'password' ? 'show' : 'hide');
    showMessage(messageKey, messageKind);
    setBusy(busy);
    renderAccess();
  }
  function switchMode(next) {
    if (busy) return;
    mode = next; recovery = next === 'recovery';
    $('account-password').value = '';
    $('account-password').type = 'password';
    $('show-password').setAttribute('aria-pressed', 'false');
    showMessage(''); render();
  }
  function clearAuthUrl() {
    var url = new URL(location.href);
    var hash = new URLSearchParams(url.hash.slice(1));
    if (hash.has('access_token') || hash.has('refresh_token') || hash.has('error') || hash.has('error_code') || hash.get('type') === 'recovery') url.hash = '';
    url.searchParams.delete('code');
    url.searchParams.delete('error');
    url.searchParams.delete('error_description');
    history.replaceState(null, '', url.pathname + url.search + url.hash);
  }
  function errorMessage(error, action) {
    if (!error) return 'serviceError';
    if (error.status === 429 || error.code === 'over_email_send_rate_limit' || error.code === 'over_request_rate_limit') return 'rateLimit';
    if (error.code === 'email_not_confirmed') return 'confirmFirst';
    if (error.code === 'email_address_not_authorized' || error.code === 'email_send_failed' || error.code === 'unexpected_failure' && action !== 'login') return 'emailUnavailable';
    if (error.code === 'weak_password') return 'passwordShort';
    if (error.code === 'email_address_invalid') return 'emailInvalid';
    if (error.name === 'AuthRetryableFetchError' || error instanceof TypeError || error.status === 0) return 'network';
    return action === 'login' ? 'loginFailed' : 'serviceError';
  }
  async function checkAccess() {
    if (!client || !currentUser) return;
    var requestVersion = ++version;
    accessState = 'loading'; access = null; renderAccess();
    try {
      var result = await client.rpc('pasero_get_my_beta_access');
      if (requestVersion !== version || !currentUser) return;
      var data = result.data;
      if (result.error || !data || typeof data !== 'object' || Array.isArray(data) || typeof data.active !== 'boolean' || !Array.isArray(data.access) || data.purchases_enabled !== false || (data.active && (!data.access.includes('desktop_beta') || !data.access.includes('mobile_beta')))) throw new Error('Unavailable');
      access = data; accessState = 'ready';
    } catch (_) { if (requestVersion !== version) return; accessState = 'error'; }
    renderAccess();
  }
  async function verifySession(session) {
    var requestVersion = ++version;
    if (!session) {
      currentUser = null; access = null; accessState = 'loading';
      if (!callbackInProgress) { recovery = false; if (mode === 'recovery') mode = 'login'; }
      render(); return;
    }
    try {
      var result = await client.auth.getUser();
      if (requestVersion !== version) return;
      if (result.error || !result.data.user) {
        if (result.error && (result.error.status >= 500 || result.error.name === 'AuthRetryableFetchError')) throw result.error;
        currentUser = null; recovery = false; mode = 'login'; render(); showMessage('sessionExpired', 'error'); return;
      }
      currentUser = result.data.user;
      if (recovery) mode = 'recovery';
      render();
      if (!recovery) await checkAccess();
    } catch (_) { if (requestVersion === version) showMessage('network', 'error'); }
  }
  function validEmail() {
    var field = $('account-email');
    field.value = field.value.trim();
    if (!field.value || !field.checkValidity()) { showMessage('emailInvalid', 'error'); field.focus(); return false; }
    return true;
  }
  $('account-language').addEventListener('change', function () { lang = this.value === 'zh' || this.value === 'ja' ? this.value : 'en'; try { localStorage.setItem('coolab-language', lang); } catch (_) {} render(); });
  document.querySelectorAll('[data-mode]').forEach(function (button) { button.addEventListener('click', function () { switchMode(button.dataset.mode); }); });
  document.querySelector('.auth-tabs').addEventListener('keydown', function (event) {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    var next = event.key === 'Home' ? 'login' : event.key === 'End' ? 'signup' : mode === 'login' ? 'signup' : 'login';
    switchMode(next); $('tab-' + next).focus();
  });
  $('show-password').addEventListener('click', function () { var showing = $('account-password').type === 'password'; $('account-password').type = showing ? 'text' : 'password'; this.setAttribute('aria-pressed', String(showing)); this.textContent = t(showing ? 'hide' : 'show'); });
  $('forgot-password').addEventListener('click', function () { switchMode('reset'); $('account-email').focus(); });
  $('back-to-login').addEventListener('click', function () { switchMode('login'); });
  $('refresh-access').addEventListener('click', function () { if (!busy) checkAccess(); });
  $('sign-out').addEventListener('click', async function () {
    if (!client || busy) return;
    setBusy(true); showMessage('');
    try {
      var result = await client.auth.signOut({ scope: 'local' });
      if (result.error) throw result.error;
      ++version; currentUser = null; access = null; recovery = false; mode = 'login'; render(); showMessage('signedOut');
    } catch (error) { showMessage(errorMessage(error), 'error'); } finally { setBusy(false); }
  });
  $('resend-confirmation').addEventListener('click', async function () {
    if (!client || busy || !validEmail()) return;
    setBusy(true); showMessage('');
    try {
      var result = await client.auth.resend({ type: 'signup', email: $('account-email').value, options: { emailRedirectTo: window.PASERO_CONFIG.siteUrl } });
      if (result.error && result.error.code !== 'user_already_exists') throw result.error;
      showMessage('resendSent');
    } catch (error) { showMessage(errorMessage(error), 'error'); } finally { setBusy(false); }
  });
  $('auth-form').addEventListener('submit', async function (event) {
    event.preventDefault();
    if (!client || busy) return;
    if (mode !== 'recovery' && !validEmail()) return;
    var password = $('account-password').value;
    if (mode !== 'reset' && !password) { showMessage('passwordRequired', 'error'); $('account-password').focus(); return; }
    if (mode !== 'reset' && password.length > 128) { showMessage('passwordLong', 'error'); return; }
    if ((mode === 'signup' || mode === 'recovery') && password.length < 12) { showMessage('passwordShort', 'error'); $('account-password').focus(); return; }
    var action = mode;
    setBusy(true); showMessage('');
    try {
      var result;
      if (action === 'signup') {
        result = await client.auth.signUp({ email: $('account-email').value, password: password, options: { emailRedirectTo: window.PASERO_CONFIG.siteUrl } });
        if (result.error && result.error.code !== 'user_already_exists') throw result.error;
        $('account-password').value = '';
        if (result.data && result.data.session) await verifySession(result.data.session);
        else showMessage('signupSent');
      } else if (action === 'reset') {
        result = await client.auth.resetPasswordForEmail($('account-email').value, { redirectTo: window.PASERO_CONFIG.siteUrl });
        if (result.error) throw result.error;
        showMessage('resetSent');
      } else if (action === 'recovery') {
        if (!recovery || !currentUser) { showMessage('noRecovery', 'error'); return; }
        result = await client.auth.updateUser({ password: password });
        if (result.error) throw result.error;
        $('account-password').value = ''; recovery = false; mode = 'login'; render(); await checkAccess(); showMessage('passwordSaved');
      } else {
        result = await client.auth.signInWithPassword({ email: $('account-email').value, password: password });
        if (result.error) throw result.error;
        $('account-password').value = '';
        await verifySession(result.data.session);
      }
    } catch (error) { showMessage(errorMessage(error, action), 'error'); } finally { setBusy(false); }
  });

  render();
  if (linkError) { clearAuthUrl(); showMessage('linkExpired', 'error'); }
  try {
    var config = window.PASERO_CONFIG;
    if (!config || typeof config.supabaseUrl !== 'string' || typeof config.supabasePublishableKey !== 'string' || !config.supabasePublishableKey.startsWith('sb_publishable_') || !window.PaseroSupabase || typeof window.PaseroSupabase.createClient !== 'function') throw new Error('Configuration');
    var apiUrl = new URL(config.supabaseUrl), siteUrl = new URL(config.siteUrl);
    if (apiUrl.protocol !== 'https:' || siteUrl.protocol !== 'https:' || apiUrl.username || apiUrl.password || siteUrl.origin !== config.siteUrl.replace(/\/$/, '')) throw new Error('Configuration');
    client = window.PaseroSupabase.createClient(config.supabaseUrl, config.supabasePublishableKey, { auth: { flowType: 'implicit', detectSessionInUrl: true, persistSession: true, autoRefreshToken: true } });
    if (recovery) mode = 'recovery';
    render();
    // Never await another Supabase call from inside onAuthStateChange's lock.
    client.auth.onAuthStateChange(function (event, session) {
      if (event === 'PASSWORD_RECOVERY') { recovery = true; mode = 'recovery'; }
      if (event === 'SIGNED_OUT') { ++version; currentUser = null; access = null; recovery = false; mode = 'login'; render(); return; }
      if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'PASSWORD_RECOVERY' || event === 'TOKEN_REFRESHED') setTimeout(function () { verifySession(session); }, 0);
    });
    client.auth.getSession().then(function (result) {
      callbackInProgress = false; clearAuthUrl();
      if (result.error) { recovery = false; mode = 'login'; render(); showMessage('linkExpired', 'error'); return; }
      if (recovery && !result.data.session) { recovery = false; mode = 'login'; render(); showMessage('linkExpired', 'error'); return; }
      verifySession(result.data.session);
    }).catch(function () { callbackInProgress = false; clearAuthUrl(); showMessage('network', 'error'); });
  } catch (_) { client = null; setBusy(false); clearAuthUrl(); showMessage('unavailable', 'error'); }
}());
