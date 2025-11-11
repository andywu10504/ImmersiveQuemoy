// Service Worker（若你有 sw.js 就會註冊）
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(()=>{});
  });
}

// A2HS（Add to Home Screen）
let deferredPrompt = null;
const a2hsBtn = document.getElementById('btnA2HS');

window.addEventListener('beforeinstallprompt', (e) => {
  // 阻止自動彈窗，改用自訂按鈕
  e.preventDefault();
  deferredPrompt = e;
  if (a2hsBtn) a2hsBtn.classList.remove('d-none');
});

if (a2hsBtn) {
  a2hsBtn.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    // 安裝後或取消都隱藏按鈕
    a2hsBtn.classList.add('d-none');
    deferredPrompt = null;
  });
}

// iOS Safari 無 beforeinstallprompt：可選擇持續顯示提示（這裡一律由 beforeinstallprompt 控制顯示）
