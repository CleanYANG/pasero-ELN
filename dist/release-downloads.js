(() => {
  'use strict';
  const copy = {
    en: {title:'Your research. On your devices.',intro:'Download Pasero for Windows and Android.',trialTitle:'Full-feature free trial',period:'10 Nov 2026–10 Jan 2027 (Japan time)',choose:'Choose your platform.',account:'Free features work without an account. Sign in inside the app to activate the desktop and mobile Pro trial.',desktop:'Desktop',mobile:'Mobile',windowsDescription:'Notes, scientific analysis, plasmids, literature and presentations.',androidDescription:'Notes, Cell Track, Seek, paper reading and laboratory utilities.',pending:'Download opening soon',download:'Download',coming:'Not yet available',windowsRequirements:'Windows 10/11 · 64-bit · Standalone installer',androidRequirements:'Android 7.0+ · APK · No Expo Go needed',scan:'Scan to open this page on your phone.',installTitle:'Install and activate',startTitle:'Ready for your next experiment.',installWindows:'Windows: download and run the installer. This beta installer does not yet have a Windows publisher certificate.',installAndroid:'Android: download the APK and follow Android’s prompts to allow installation from your browser. The public-release signature differs from earlier test packages; back up your data before replacing a test installation.',activation:'In the app, open Plans & upgrade → Sign in / Get trial. During the trial period, one account unlocks Pro on both Windows and Android.',dataTitle:'Your data stays yours.',terms:'No payment required and no automatic charge. All trials end at 00:00 JST on 11 January 2027. Joining later does not extend this deadline.',after:'After the trial, Pro operations lock. Free features, existing notes, results and ongoing Cell Track records remain available.',offline:'Connect once to activate. Offline access lasts up to seven days and never beyond the trial deadline. AI provider fees are separate; bring your own API key.',privacy:'Research records stay on your devices. Account access does not automatically upload your notes. Keep independent backups before reinstalling.',upcoming:'Starts 10 November. The trial includes all desktop and mobile Pro features.',active:'The free trial is open. Sign in in the app to activate Pro.',ended:'This trial has ended. You can continue using Pasero Free.'},
    zh: {title:'你的科研，随设备同行。',intro:'下载适用于 Windows 与 Android 的雀角。',trialTitle:'全功能免费试用',period:'2026 年 11 月 10 日—2027 年 1 月 10 日（日本时间）',choose:'选择你的设备。',account:'Free 功能无需登录。在应用内登录后，可领取桌面与移动端 Pro 试用。',desktop:'桌面端',mobile:'移动端',windowsDescription:'实验笔记、科学分析、质粒、文献与科研演示。',androidDescription:'实验笔记、Cell Track、Seek、论文阅读与实验工具。',pending:'下载即将开放',download:'下载',coming:'暂未发布',windowsRequirements:'Windows 10/11 · 64 位 · 独立安装程序',androidRequirements:'Android 7.0 及以上 · APK · 无需 Expo Go',scan:'用手机扫码打开下载页面。',installTitle:'安装与激活',startTitle:'为下一次实验做好准备。',installWindows:'Windows：下载并运行安装程序。当前测试版安装程序尚未附有 Windows 发行者证书。',installAndroid:'Android：下载 APK，按系统提示允许浏览器安装应用。正式发布签名与早期测试包不同，替换测试安装前请先备份数据。',activation:'在应用中打开“方案与升级 → 登录 / 领取试用”。试用期间，同一账号可解锁 Windows 和 Android 的 Pro 功能。',dataTitle:'科研数据始终属于你。',terms:'无需付款，不会自动扣费。所有试用统一于 2027 年 1 月 11 日 00:00（日本时间）结束，晚注册不会延长截止时间。',after:'到期后锁定 Pro 操作。Free 功能、已有笔记、结果与 Cell Track 任务的续记继续保留。',offline:'首次激活需要联网。离线授权最长 7 天，且不会超过活动截止时间。AI 使用自备 API Key，服务商费用另计。',privacy:'科研记录保存在设备上。账号授权不会自动上传笔记。重新安装前，请单独备份重要数据。',upcoming:'11 月 10 日开始，开放桌面与移动端全部 Pro 功能。',active:'免费试用已开放，请在应用内登录激活 Pro。',ended:'本次试用已结束，你仍可继续使用雀角 Free。'},
    ja: {title:'研究を、どのデバイスでも。',intro:'Windows と Android 向けの雀角をダウンロード。',trialTitle:'全機能の無料トライアル',period:'2026 年 11 月 10 日–2027 年 1 月 10 日（日本時間）',choose:'デバイスを選択。',account:'Free 機能はログイン不要です。アプリ内でログインすると両端末の Pro を試用できます。',desktop:'デスクトップ',mobile:'モバイル',windowsDescription:'実験ノート、科学解析、プラスミド、文献、プレゼンテーション。',androidDescription:'ノート、Cell Track、Seek、論文閲覧、実験ツール。',pending:'ダウンロード準備中',download:'ダウンロード',coming:'未公開',windowsRequirements:'Windows 10/11 · 64 ビット · 単体インストーラー',androidRequirements:'Android 7.0 以上 · APK · Expo Go 不要',scan:'スマートフォンで読み取ってダウンロードページを開く。',installTitle:'インストールと有効化',startTitle:'次の実験へ。',installWindows:'Windows：ダウンロードしてインストーラーを実行してください。このベータ版には Windows 発行元証明書がまだ付いていません。',installAndroid:'Android：APK をダウンロードし、ブラウザーからのインストールを許可してください。公開版の署名は旧テスト版と異なります。置き換える前にデータをバックアップしてください。',activation:'アプリの「プランとアップグレード → ログイン / 試用開始」を開きます。試用期間中は同じアカウントで両端末の Pro が使えます。',dataTitle:'研究データはあなたのもの。',terms:'支払い不要・自動課金なし。全ユーザー共通で 2027 年 1 月 11 日 00:00（日本時間）に終了します。後日の登録でも延長されません。',after:'終了後は Pro 操作が制限されます。Free 機能、既存ノート、結果、Cell Track の継続記録は利用できます。',offline:'初回有効化には接続が必要です。オフライン利用は最長 7 日間で、試用期限を超えません。AI は自身の API キーを使用し、提供元の料金は別途必要です。',privacy:'研究記録は端末に保存されます。ログインでノートが自動送信されることはありません。再インストール前に重要なデータをバックアップしてください。',upcoming:'11 月 10 日開始。デスクトップとモバイルの全 Pro 機能を試用できます。',active:'無料トライアル公開中。アプリ内でログインして Pro を有効にしてください。',ended:'無料トライアルは終了しました。雀角 Free は引き続き利用できます。'}
  };
  let release;
  function language() { const value=document.documentElement.lang.toLowerCase(); return value.startsWith('zh')?'zh':value.startsWith('ja')?'ja':'en'; }
  function render() {
    const text=copy[language()];
    document.querySelectorAll('[data-release-copy]').forEach(el=>{ const value=text[el.dataset.releaseCopy];if(value)el.textContent=value; });
    if(!release)return;
    const phase=Date.now()<Date.parse(release.trial.startsAt)?'upcoming':Date.now()>=Date.parse(release.trial.endsAt)?'ended':'active';
    document.getElementById('trial-state').textContent=text[phase];
    for(const platform of ['windows','android']) {
      const file=release.files[platform],button=document.querySelector('[data-release-platform="'+platform+'"]');
      document.querySelector('[data-release-meta="'+platform+'"]').textContent='v'+release.version+' · '+(file.bytes/1000000).toFixed(1)+' MB';
      document.querySelector('[data-release-hash="'+platform+'"]').textContent=file.sha256;
      if(file.verified && file.url && new URL(file.url).protocol==='https:') {
        button.href=file.url;button.removeAttribute('aria-disabled');button.removeAttribute('tabindex');button.textContent=text.download+' '+(platform==='windows'?'Windows':'Android');
      }
    }
  }
  document.querySelectorAll('.release-download').forEach(button=>button.addEventListener('click',event=>{if(button.getAttribute('aria-disabled')==='true')event.preventDefault();}));
  new MutationObserver(render).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  window.addEventListener('hashchange',()=>{
    if(location.hash==='#mobile')document.getElementById('tab-mobile').click();
    else if(location.hash==='#desktop')document.getElementById('tab-desktop').click();
  });
  window.addEventListener('hashchange',()=>{
    if(location.hash==='#mobile')document.getElementById('tab-mobile').click();
    else if(location.hash==='#desktop')document.getElementById('tab-desktop').click();
  });
  document.querySelectorAll('[role="tab"]').forEach((tab,index,tabs)=>tab.addEventListener('keydown',event=>{
    if(!['ArrowLeft','ArrowRight'].includes(event.key))return;
    event.preventDefault();const next=tabs[(index+1)%tabs.length];next.focus();next.click();
  }));
  fetch('release-manifest.json',{cache:'no-cache'}).then(response=>{if(!response.ok)throw new Error('manifest');return response.json();}).then(value=>{release=value;render();}).catch(()=>{render();});
  render();
})();
