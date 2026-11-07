/* Optional beta-tester e-mail for the launch discount, plus invite-a-friend (20% off for both).
   Write-only RPC; the page never reads the list. */
(() => {
  'use strict';
  const ENDPOINT = 'https://gnfxemlrgjwcqxqruzev.supabase.co/rest/v1/rpc/pasero_beta_signup';
  const KEY = 'sb_publishable_2MJ_yQEUabbfZr14Tv5gBg_BpJkZ5uU'; // public publishable key
  const INVITE_BASE = 'https://pasero.app/download.html?ref=';
  const CODE_RE = /^[0-9A-F]{8}$/;
  const copy = {
    en: {title:'Beta tester discount',body:'Downloading during the beta? Leave your email and we’ll send you a discount when paid plans open. This is optional; downloads work without it.',invited:'A friend invited you. Sign up below, then sign in to Pasero with the same email, and you’ll both get 20% off on top of the beta discount.',label:'Email address',submit:'Send me the discount',sending:'Sending…',note:'We use it only for the beta discount, invites and the launch notice. Ask us to delete it at any time.',policy:'Privacy policy',done:'Thanks. We’ll email you the beta discount when paid plans open.',invalid:'Enter a valid email address, like name@example.com.',failed:'That didn’t go through. Check your connection and try again.',busy:'Lots of sign-ups right now. Try again in a minute.',nudge:'Your download has started. Want the beta discount? Leave your email below.',shareTitle:'Invite a friend: you both get 20% off',shareBody:'When a friend signs up through your link and signs in to Pasero with that email, you each get 20% off, on top of the beta discount. One 20% per person.',linkLabel:'Your invite link',copy:'Copy link',copied:'Copied',share:'Share',shareText:'I’m using Pasero for my lab notes. Sign up through my link and we both get 20% off when paid plans open.'},
    zh: {title:'内测用户优惠',body:'在内测期间下载？留下邮箱，付费方案上线时我们会把内测优惠发给你。留不留都可以，不影响下载。',invited:'你的朋友邀请了你。在下面留下邮箱，并用同一邮箱登录雀角，你们两人都能在内测优惠之外再享 8折。',label:'邮箱地址',submit:'领取优惠通知',sending:'正在提交…',note:'邮箱只用于发送内测优惠、邀请奖励和上线通知，随时可以要求我们删除。',policy:'隐私政策',done:'已登记。付费方案上线时，我们会把内测优惠发到这个邮箱。',invalid:'请输入有效的邮箱地址，例如 name@example.com。',failed:'没有提交成功，请检查网络后再试一次。',busy:'现在登记的人比较多，请一分钟后再试。',nudge:'下载已开始。想要内测优惠？在下面留下邮箱即可。',shareTitle:'邀请朋友：你们都享 8折',shareBody:'朋友通过你的链接登记并用该邮箱登录雀角后，你们各自在内测优惠之外再享 8折。每人限享一次 8折。',linkLabel:'你的邀请链接',copy:'复制链接',copied:'已复制',share:'分享',shareText:'我在用雀角 Pasero 记实验笔记。通过我的链接登记，付费方案上线时我们都能享受 8折。'},
    ja: {title:'ベータ版ユーザー割引',body:'ベータ期間中にダウンロードした方へ。メールアドレスを登録いただくと、有料プランの開始時に割引をお送りします。登録は任意で、ダウンロードには不要です。',invited:'お友だちからの招待です。下で登録し、同じメールアドレスで雀角にログインすると、ベータ割引に加えてお二人とも 20% オフになります。',label:'メールアドレス',submit:'割引を受け取る',sending:'送信中…',note:'ベータ割引、招待特典、正式公開のお知らせにのみ使用します。いつでも削除を依頼できます。',policy:'プライバシーポリシー',done:'登録しました。有料プランの開始時に、このアドレスへベータ割引をお送りします。',invalid:'有効なメールアドレスを入力してください（例：name@example.com）。',failed:'送信できませんでした。接続を確認して、もう一度お試しください。',busy:'ただいま登録が集中しています。1 分ほどしてからお試しください。',nudge:'ダウンロードを開始しました。ベータ割引をご希望の方は、下にメールアドレスを登録してください。',shareTitle:'お友だちを招待：お二人とも 20% オフ',shareBody:'あなたのリンクから登録したお友だちが同じメールアドレスで雀角にログインすると、ベータ割引に加えてそれぞれ 20% オフになります。20% オフはお一人につき 1 回です。',linkLabel:'あなたの招待リンク',copy:'リンクをコピー',copied:'コピーしました',share:'共有',shareText:'研究ノートに雀角 Pasero を使っています。このリンクから登録すると、有料プランの開始時に二人とも 20% オフになります。'}
  };
  // After the beta the box becomes invite-only: 20% off the normal price, one per person.
  const BETA_END = Date.parse('2027-01-11T00:00:00+09:00');
  const afterBeta = {
    en: {title:'Get 20% off with a friend',body:'Leave your email to get your invite link. When a friend signs up through it and signs in to Pasero with that email, you each get 20% off the normal price. One 20% per person.',invited:'A friend invited you. Sign up below, then sign in to Pasero with the same email, and you’ll both get 20% off the normal price.',submit:'Get my invite link',note:'We use it only for invites, discounts and Pasero news. Ask us to delete it at any time.',done:'Thanks. Here’s your invite link.',nudge:'Your download has started. Invite a friend and you both get 20% off.',shareBody:'When a friend signs up through your link and signs in to Pasero with that email, you each get 20% off the normal price. One 20% per person.',shareText:'I’m using Pasero for my lab notes. Sign up through my link and we both get 20% off.'},
    zh: {title:'和朋友一起享 8折',body:'留下邮箱即可获得你的邀请链接。朋友通过链接登记并用该邮箱登录雀角后，你们各自享受正价 8折。每人限享一次。',invited:'你的朋友邀请了你。在下面留下邮箱，并用同一邮箱登录雀角，你们两人都能享受正价 8折。',submit:'获取邀请链接',note:'邮箱只用于邀请、优惠和雀角相关通知，随时可以要求我们删除。',done:'已登记。下面是你的邀请链接。',nudge:'下载已开始。邀请朋友，你们都能享 8折。',shareBody:'朋友通过你的链接登记并用该邮箱登录雀角后，你们各自享受正价 8折。每人限享一次。',shareText:'我在用雀角 Pasero 记实验笔记。通过我的链接登记，我们都能享 8折。'},
    ja: {title:'お友だちと 20% オフ',body:'メールアドレスを登録すると招待リンクが発行されます。そのリンクから登録したお友だちが同じメールアドレスで雀角にログインすると、それぞれ通常価格から 20% オフになります。20% オフはお一人につき 1 回です。',invited:'お友だちからの招待です。下で登録し、同じメールアドレスで雀角にログインすると、お二人とも通常価格から 20% オフになります。',submit:'招待リンクを受け取る',note:'招待、割引、雀角からのお知らせにのみ使用します。いつでも削除を依頼できます。',done:'登録しました。あなたの招待リンクはこちらです。',nudge:'ダウンロードを開始しました。お友だちを招待すると、お二人とも 20% オフになります。',shareBody:'あなたのリンクから登録したお友だちが同じメールアドレスで雀角にログインすると、それぞれ通常価格から 20% オフになります。20% オフはお一人につき 1 回です。',shareText:'研究ノートに雀角 Pasero を使っています。このリンクから登録すると、二人とも 20% オフになります。'}
  };
  if (Date.now() >= BETA_END) for (const l of Object.keys(copy)) Object.assign(copy[l], afterBeta[l]);
  const form = document.getElementById('beta-signup');
  if (!form) return;
  const input = form.querySelector('#beta-email');
  const button = form.querySelector('button[type="submit"]');
  const status = form.querySelector('.dl-beta-status');
  const invited = form.querySelector('#beta-invited');
  const share = form.querySelector('#beta-share');
  const linkField = form.querySelector('#beta-link');
  const copyButton = form.querySelector('#beta-copy');
  const nativeShare = form.querySelector('#beta-native-share');
  let lastPlatform = null, state = null, copiedTimer = 0;

  const store = {
    get(area, key) { try { return window[area].getItem(key); } catch (_) { return null; } },
    set(area, key, value) { try { window[area].setItem(key, value); } catch (_) {} }
  };
  const lang = () => { const v = document.documentElement.lang.toLowerCase(); return v.startsWith('zh') ? 'zh' : v.startsWith('ja') ? 'ja' : 'en'; };
  const t = () => copy[lang()];

  // Invite code from the link (?ref=...), kept for this visit; never our own code.
  let ownCode = store.get('localStorage', 'pasero-invite-code');
  if (ownCode && !CODE_RE.test(ownCode)) ownCode = null;
  let ref = (new URLSearchParams(location.search).get('ref') || '').trim().toUpperCase();
  if (CODE_RE.test(ref)) store.set('sessionStorage', 'pasero-invited-by', ref);
  else ref = (store.get('sessionStorage', 'pasero-invited-by') || '').toUpperCase();
  if (!CODE_RE.test(ref) || ref === ownCode) ref = null;

  function guessPlatform() {
    const ua = navigator.userAgent || '';
    if (/iPhone|iPad|iPod/.test(ua)) return 'ios';
    if (/Android/.test(ua)) return 'android';
    if (/Macintosh|Mac OS X/.test(ua)) return 'macos';
    if (/Windows/.test(ua)) return 'windows';
    return null;
  }
  function show(key, tone) {
    state = key;
    status.textContent = key ? t()[key] : '';
    if (tone) status.dataset.tone = tone; else delete status.dataset.tone;
  }
  function showShare(code) {
    if (!CODE_RE.test(code || '')) return;
    ownCode = code;
    linkField.value = INVITE_BASE + code;
    share.hidden = false;
    nativeShare.hidden = typeof navigator.share !== 'function';
  }
  function render() {
    const text = t();
    form.querySelectorAll('[data-beta-copy]').forEach(el => {
      const key = el.dataset.betaCopy;
      if (el === button && button.disabled) el.textContent = text.sending;
      else if (el === copyButton && copiedTimer) el.textContent = text.copied;
      else if (text[key]) el.textContent = text[key];
    });
    if (state) status.textContent = text[state];
  }
  const valid = value => value.length >= 6 && value.length <= 254 && /^[^@\s<>()",;:]+@[^@\s<>()",;:]+\.[A-Za-z]{2,}$/.test(value);

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const email = input.value.trim();
    if (!valid(email)) { input.setAttribute('aria-invalid', 'true'); show('invalid', 'error'); input.focus(); return; }
    input.removeAttribute('aria-invalid');
    button.disabled = true; button.textContent = t().sending; show(null);
    try {
      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: KEY },
        body: JSON.stringify({ p_email: email, p_platform: lastPlatform || guessPlatform(), p_language: lang(), p_ref: ref })
      });
      const body = await response.json().catch(() => ({}));
      if (response.ok) {
        show('done'); input.value = ''; form.classList.remove('is-nudged');
        if (body && CODE_RE.test(body.referral_code || '')) { store.set('localStorage', 'pasero-invite-code', body.referral_code); showShare(body.referral_code); }
      } else {
        const message = String(body.message || '');
        if (message.includes('INVALID_EMAIL')) { input.setAttribute('aria-invalid', 'true'); show('invalid', 'error'); }
        else if (message.includes('RATE_LIMIT')) show('busy', 'error');
        else show('failed', 'error');
      }
    } catch (_) { show('failed', 'error'); }
    finally { button.disabled = false; button.textContent = t().submit; }
  });
  input.addEventListener('input', () => { if (input.getAttribute('aria-invalid')) { input.removeAttribute('aria-invalid'); if (state === 'invalid') show(null); } });

  copyButton.addEventListener('click', async () => {
    let ok = false;
    try { await navigator.clipboard.writeText(linkField.value); ok = true; }
    catch (_) { linkField.focus(); linkField.select(); try { ok = document.execCommand('copy'); } catch (__) {} }
    if (!ok) return;
    clearTimeout(copiedTimer);
    copyButton.textContent = t().copied;
    copiedTimer = setTimeout(() => { copiedTimer = 0; copyButton.textContent = t().copy; }, 2000);
  });
  nativeShare.addEventListener('click', () => {
    navigator.share({ title: 'Pasero', text: t().shareText, url: linkField.value }).catch(() => {});
  });
  linkField.addEventListener('focus', () => linkField.select());

  // After a real download click, point gently at the form (no focus steal, no pop-up).
  document.querySelectorAll('.release-download').forEach(link => link.addEventListener('click', () => {
    if (link.getAttribute('aria-disabled') === 'true') return;
    lastPlatform = link.dataset.releasePlatform || null;
    if (state === 'done') return;
    form.classList.add('is-nudged'); show('nudge');
  }));

  if (ref) invited.hidden = false;
  if (ownCode) showShare(ownCode);
  new MutationObserver(render).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  render();
})();
