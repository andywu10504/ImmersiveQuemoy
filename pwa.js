// pwa.js
let deferredPrompt = null;
const btnA2HS = document.getElementById('btnA2HS');

/* 註冊 service worker（若有 sw.js） */
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(()=>{});
}

/* 判斷是否已安裝（避免已安裝仍顯示按鈕） */
function isStandalone() {
  const mq = window.matchMedia('(display-mode: standalone)').matches;
  return mq || window.navigator.standalone === true;
}

/* 平台檢測 */
function isIOS() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}
function isAndroid() {
  return /android/i.test(window.navigator.userAgent);
}

/* Android：攔截 beforeinstallprompt */
window.addEventListener('beforeinstallprompt', (e) => {
  // 阻止自動彈出
  e.preventDefault();
  deferredPrompt = e;

  if (!isStandalone()) {
    btnA2HS.classList.remove('d-none');
  }
});

/* iOS：沒有 beforeinstallprompt，用教學 Modal */
window.addEventListener('load', () => {
  if (isStandalone()) {
    btnA2HS.classList.add('d-none');
    return;
  }
  // 若非 Android（沒有 beforeinstallprompt），且是 iOS 並用 Safari，顯示按鈕
  if (isIOS()) {
    btnA2HS.classList.remove('d-none');
  }
});

/* 按鈕點擊：Android 用原生 prompt；iOS 彈教學 Modal */
btnA2HS?.addEventListener('click', async () => {
  // Android：有 deferredPrompt 就走原生
  if (deferredPrompt) {
    deferredPrompt.prompt();
    try {
      await deferredPrompt.userChoice;
    } catch (_) {}
    deferredPrompt = null;
    btnA2HS.classList.add('d-none');
    return;
  }

  // iOS：打開說明
  const m = document.getElementById('iosA2HSModal');
  if (m) bootstrap.Modal.getOrCreateInstance(m).show();
});
