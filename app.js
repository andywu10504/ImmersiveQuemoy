/* ========= 資料載入 ========= */
async function loadCatalog() {
  const res = await fetch('data/catalog.json', { cache: 'no-cache' });
  if (!res.ok) throw new Error('載入 catalog.json 失敗');
  return await res.json();
}

/* ========= 通用工具 ========= */
function escapeHtml(s){ return (s||"").replace(/[&<>"']/g, m=>({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;" }[m])); }
function toast(msg){
  const id = "liveToast";
  const tpl = `
  <div id="${id}" class="toast align-items-center text-bg-dark border-0 position-fixed bottom-0 end-0 m-3" role="status" aria-live="polite" aria-atomic="true">
    <div class="d-flex">
      <div class="toast-body"><i class="fa-regular fa-circle-check me-2"></i>${escapeHtml(msg)}</div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
    </div>
  </div>`;
  $("#"+id).remove();
  $("body").append(tpl);
  if (window.bootstrap) new bootstrap.Toast(document.getElementById(id), {delay:1500}).show();
}

/* ========= 將 catalog 正規化 ========= */
function buildDataFromCatalog(catalog){
  const seen = new Set();
  let seq = 1;
  const normalize = (r) => {
    const id = (r.id && !seen.has(r.id)) ? r.id : autoId(r.category, seq++);
    seen.add(id);
    return {
      id,
      name: r.name || "(未命名)",
      category: r.category || "未分類",
      tags: Array.isArray(r.tags) ? r.tags : [],
      lat: (typeof r.lat === "number") ? r.lat : undefined,
      lng: (typeof r.lng === "number") ? r.lng : undefined,
      address: r.address || "—",
      desc: r.desc || "",
      quests: Array.isArray(r.quests) ? r.quests : []
    };
  };
  const data = catalog.map(normalize);
  const byId = Object.fromEntries(data.map(d => [d.id, d]));
  return { DATA:data, ITEM_BY_ID:byId };

  function autoId(cat, i){
    const map = {
      "坑道":"K","戰史館":"W","據點":"G","海灘":"B","碉堡":"F","地標":"L","步道":"T","體驗":"Q",
      "在地文化":"C","在地美食":"M","在地飲品":"D","金門名產":"S","傳統點心":"Tn","特色風獅爺":"Ls"
    };
    const p = (map[cat] || "X");
    const n = String(i).padStart(3,"0");
    return p + n;
  }
}

/* ========= LocalStorage Keys ========= */
const LS_KEY    = "kinmen_collect_v1";
const LS_BADGE  = "kinmen_badges_v1";
const LS_ARR    = "kinmen_arrival_v1";
const LS_BADGE_CAT = "kinmen_badges_cat_v1";

/* ========= 徽章規則 ========= */
const BADGE_RULES = [
  {count:1 , name:"入門",      icon:"fa-solid fa-flag"},
  {count:3 , name:"在地達人",  icon:"fa-solid fa-compass"},
  {count:5 , name:"戰地通",    icon:"fa-solid fa-shield-halved"},
  {count:10, name:"金門之友",  icon:"fa-solid fa-wand-magic-sparkles"}
];

const CAT_BADGE_RULES = {
  "在地文化":[{count:2,name:"在地文化入門",icon:"fa-solid fa-book-open"},{count:4,name:"在地文化巡禮",icon:"fa-solid fa-chess-rook"}],
  "戰地坑道":[{count:1,name:"坑道初探",icon:"fa-solid fa-tunnel"},{count:2,name:"坑道通",icon:"fa-solid fa-person-walking"}],
  "軌條柴":[{count:1,name:"軌條柴入門",icon:"fa-solid fa-shield-halved"},{count:2,name:"軌條柴行家",icon:"fa-solid fa-shield"}],
  "洋樓建築":[{count:1,name:"洋樓入門",icon:"fa-solid fa-building-columns"},{count:2,name:"洋樓達人",icon:"fa-solid fa-landmark"}],
  "碉堡":[{count:2,name:"碉堡入門",icon:"fa-solid fa-shield-halved"},{count:4,name:"碉堡巡禮",icon:"fa-solid fa-shield"}],
  "播音牆":[{count:1,name:"心戰印記",icon:"fa-solid fa-bullhorn"},{count:2,name:"播音牆通",icon:"fa-solid fa-tower-broadcast"}],
  "太武山":[{count:1,name:"太武初遇",icon:"fa-solid fa-mountain"},{count:2,name:"太武巡禮",icon:"fa-solid fa-person-hiking"}],
  "風獅爺":[{count:1,name:"風獅小行家",icon:"fa-solid fa-wind"},{count:3,name:"風獅守護者",icon:"fa-solid fa-dragon"}],
  "風雞、北風爺":[{count:1,name:"風神入門",icon:"fa-regular fa-compass"},{count:2,name:"風神巡禮",icon:"fa-solid fa-compass"}],
  "廈門一景":[{count:1,name:"遠眺彼岸",icon:"fa-regular fa-eye"},{count:2,name:"海峽視角",icon:"fa-solid fa-binoculars"}],
  "閩南建築(古厝)":[{count:1,name:"古厝入門",icon:"fa-solid fa-house-chimney"},{count:2,name:"古厝達人",icon:"fa-solid fa-chess-rook"}],
  "濕地":[{count:1,name:"濕地初探",icon:"fa-solid fa-water"},{count:2,name:"濕地守護者",icon:"fa-solid fa-recycle"}],
  "特約茶室":[{count:1,name:"特約入門",icon:"fa-solid fa-martini-glass"},{count:2,name:"特約知行",icon:"fa-solid fa-landmark-dome"}],
  "路上黃牛":[{count:1,name:"在地相遇",icon:"fa-solid fa-cow"},{count:2,name:"與牛有約",icon:"fa-solid fa-heart"}],
  "雞頭魚尾":[{count:1,name:"地形入門",icon:"fa-solid fa-earth-asia"},{count:2,name:"地景達人",icon:"fa-solid fa-globe"}],
  "高梁田":[{count:1,name:"高粱初識",icon:"fa-solid fa-wheat-awn"},{count:2,name:"高粱巡禮",icon:"fa-solid fa-seedling"}],
  "戰時文化":[{count:1,name:"戰時印記",icon:"fa-solid fa-helmet-safety"},{count:2,name:"戰時通識",icon:"fa-solid fa-shield-virus"}],
  "摩西分海":[{count:1,name:"潮汐行者",icon:"fa-solid fa-water"}],
  "金門腔":[{count:1,name:"金門腔入門",icon:"fa-solid fa-language"},{count:2,name:"金門腔達人",icon:"fa-solid fa-comments"}],
  "戰史館":[{count:1,name:"戰史入門",icon:"fa-solid fa-landmark-dome"},{count:2,name:"戰史達人",icon:"fa-solid fa-book"}],
  "反空降樁":[{count:1,name:"樁列初識",icon:"fa-solid fa-fence"},{count:2,name:"樁列達人",icon:"fa-solid fa-road-barrier"}],
  "反空降堡":[{count:1,name:"防空降入門",icon:"fa-solid fa-person-military-pointing"},{count:2,name:"防空降達人",icon:"fa-solid fa-bullseye"}],
  "書院":[{count:1,name:"書院初探",icon:"fa-solid fa-book-open-reader"},{count:2,name:"書院通",icon:"fa-solid fa-feather-pointed"}],
  "沙灘":[{count:1,name:"海風初見",icon:"fa-solid fa-umbrella-beach"},{count:2,name:"海灘守護者",icon:"fa-solid fa-recycle"}],
  "在地美食":[{count:2,name:"在地美食入門",icon:"fa-solid fa-bowl-food"},{count:4,name:"在地美食饕客",icon:"fa-solid fa-utensils"}],
  "在地飲品":[{count:1,name:"在地飲品入門",icon:"fa-solid fa-mug-hot"},{count:3,name:"在地飲品達人",icon:"fa-solid fa-martini-glass-citrus"}],
  "金門名產":[{count:2,name:"名產入門",icon:"fa-solid fa-store"},{count:4,name:"名產收藏家",icon:"fa-solid fa-bag-shopping"}],
  "傳統點心":[{count:2,name:"點心入門",icon:"fa-solid fa-cookie-bite"},{count:4,name:"點心達人",icon:"fa-solid fa-cake-candles"}],
  "特色風獅爺":[{count:1,name:"風獅小行家",icon:"fa-solid fa-wind"},{count:3,name:"風獅守護者",icon:"fa-solid fa-dragon"}]
};

/* ========= 狀態 ========= */
let DATA = [];
let ITEM_BY_ID = {};
let state = {
  kw:"", cat:"all",
  collected: loadCollected(),
  unlockedBadges: loadBadgeState(),
  arrivalGranted: loadArrival(),
  unlockedCatBadges: loadCatBadgeState()
};

/* ========= 徽章顯示佇列 ========= */
const badgeQueue = []; let isBadgeShowing = false;
function enqueueBadge(icon, title, desc){ badgeQueue.push({icon, title, desc}); processBadgeQueue(); }
function processBadgeQueue(){
  if (!window.bootstrap || isBadgeShowing || badgeQueue.length===0) return;
  const {icon, title, desc} = badgeQueue.shift(); isBadgeShowing = true;
  $("#badgeIcon").html(`<i class="${icon}"></i>`); $("#badgeTitle").text(title); $("#badgeDesc").text(desc);
  const el=document.getElementById('badgeModal'); const modal=bootstrap.Modal.getOrCreateInstance(el);
  const once=()=>{ el.removeEventListener('hidden.bs.modal', once); isBadgeShowing=false; setTimeout(processBadgeQueue,50); };
  el.addEventListener('hidden.bs.modal', once); modal.show();
}

/* ========= 啟動 ========= */
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const catalog = await loadCatalog();
    const built = buildDataFromCatalog(catalog);
    DATA = built.DATA; ITEM_BY_ID = built.ITEM_BY_ID;

    renderCategoryFilters();
    ensureArrivalBadge();
    calibrateConsistency();
    initMap();

    renderList();
    renderProgress();
    renderBadgesCompact();
    wireEvents();
    tryAutoStampFromURL();
  } catch (err) {
    console.error('初始化失敗：', err);
    toast('初始化失敗，請重新整理');
  }
});

/* ========= 地圖 ========= */
let map, markers = {};
function initMap(){
  map = L.map('map', {scrollWheelZoom:true}).setView([24.45,118.36], 11);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19, attribution:'© OpenStreetMap'}).addTo(map);
  markers = {};
  DATA.forEach(item=>{
    if(typeof item.lat==="number" && typeof item.lng==="number"){
      const marker = L.marker([item.lat,item.lng]).addTo(map)
        .bindPopup(`<strong>${escapeHtml(item.name)}</strong><br><span class="text-muted">${escapeHtml(item.category)}</span>`);
      marker.on('click', ()=> openItem(item.id));
      markers[item.id] = marker;
    }
  });
}
function flyToItem(item){
  if(typeof item.lat==="number" && typeof item.lng==="number"){
    map.flyTo([item.lat,item.lng], 14, {duration:.6});
    markers[item.id]?.openPopup();
  }
}

/* ========= 類別篩選 ========= */
function renderCategoryFilters(){
  const $wrap = $("#catFilters").empty();
  const cats = Array.from(new Set(DATA.map(d=>d.category))).sort();
  $wrap.append(`<span class="tag filter-pill active" data-cat="all"><i class="fa-solid fa-sliders"></i> 全部</span>");
  cats.forEach(c=> $wrap.append(`<span class="tag filter-pill" data-cat="${escapeHtml(c)}">${escapeHtml(c)}</span>`));
}

/* ========= 清單 ========= */
function renderList(){
  const $list = $("#list").empty();
  const items = filtered().slice().sort((a,b)=>{
    const pa = (a.category === "體驗") ? 0 : 1;
    const pb = (b.category === "體驗") ? 0 : 1;
    if (pa !== pb) return pa - pb;
    return (a.name||"").localeCompare(b.name||"", 'zh-Hant');
  });
  if(items.length===0){ $("#empty").removeClass("d-none"); return; }
  $("#empty").addClass("d-none");

  items.forEach(it=>{
    const isCollected = state.collected.has(it.id);
    const col = $(`
      <div class="col-12 col-md-6 col-lg-4">
        <div class="card h-100 ${isCollected?'collected':''}" id="card-${it.id}">
          <div class="card-body position-relative">
            <div class="d-flex justify-content-between align-items-start">
              <h5 class="card-title mb-1">${escapeHtml(it.name)}</h5>
              <span class="badge ${isCollected?'text-bg-success':'text-bg-secondary'}">${isCollected?'已蒐集':'未蒐集'}</span>
            </div>
            <div class="text-muted small mb-2"><i class="fa-solid fa-location-dot"></i> ${escapeHtml(it.category)}</div>
            <p class="card-text">${escapeHtml(it.desc||"").slice(0,88)}${(it.desc||"").length>88?'…':''}</p>
            <div class="mb-2">${(it.tags||[]).map(t=>`<span class="tag">${escapeHtml(t)}</span>`).join('')}</div>
            <div class="d-flex gap-2 flex-wrap">
              <button class="btn btn-sm btn-outline-primary btn-detail" data-id="${it.id}"><i class="fa-regular fa-circle-question"></i> 詳情</button>
              <button class="btn btn-sm ${isCollected?'btn-success':'btn-outline-success'} btn-collect" data-id="${it.id}">
                <i class="fa-solid fa-stamp"></i> ${isCollected?'已蒐集':'蒐集'}
              </button>
              <button class="btn btn-sm btn-outline-secondary btn-locate" data-id="${it.id}"><i class="fa-solid fa-map-location-dot"></i> 地圖</button>
            </div>
            <div class="stamp" id="stamp-${it.id}">已集章</div>
          </div>
        </div>
      </div>
    `);
    $list.append(col);
  });
  $("#progressText").text(`${state.collected.size} / ${DATA.length}`);
  updateProgressBar();
}

/* ========= 篩選 ========= */
function filtered(){
  const kw = state.kw.trim().toLowerCase();
  const cat = state.cat;
  return DATA.filter(it=>{
    const hitCat = (cat==='all') || (it.category===cat);
    const text = (it.name + ' ' + (it.desc||'') + ' ' + (it.tags||[]).join(' ')).toLowerCase();
    const hitKw = kw==='' || text.includes(kw);
    return hitCat && hitKw;
  });
}

/* ========= 詳情 ========= */
function openItem(id){
  const it = ITEM_BY_ID[id]; if(!it) return;
  $("#mdTitle").text(it.name);
  $("#mdTags").html(`<span class="tag">${escapeHtml(it.category)}</span>${(it.tags||[]).map(t=>`<span class="tag">${escapeHtml(t)}</span>`).join('')}`);
  $("#mdDesc").text(it.desc||"");
  $("#mdAddr").text(it.address || "—");
  if(typeof it.lat==="number" && typeof it.lng==="number"){
    $("#mdCoord").text(`${it.lat.toFixed(5)}, ${it.lng.toFixed(5)}`);
    $("#mdNav").attr("href", `https://www.google.com/maps?q=${it.lat},${it.lng}`).removeClass("disabled");
  }else{
    $("#mdCoord").text("—");
    $("#mdNav").attr("href","#").addClass("disabled");
  }
  $("#mdQuests").empty().append((it.quests||[]).map(q=>`<li>${escapeHtml(q)}</li>`).join(''));

  const collected = state.collected.has(it.id);
  $("#mdCollectBtn")
    .toggleClass("btn-success", !collected)
    .toggleClass("btn-outline-success", collected)
    .html(collected ? `<i class="fa-regular fa-circle-xmark"></i> 取消蒐集` : `<i class="fa-solid fa-stamp"></i> 蒐集`)
    .off("click").on("click", ()=>{
      const el = document.getElementById('itemModal');
      const modal = bootstrap.Modal.getOrCreateInstance(el);
      const once = () => {
        el.removeEventListener('hidden.bs.modal', once);
        toggleCollect(it.id);
        renderList();
        renderBadgesCompact();
      };
      el.addEventListener('hidden.bs.modal', once);
      modal.hide();
    });

  const modalEl = document.getElementById('itemModal');
  bootstrap.Modal.getOrCreateInstance(modalEl).show();
  flyToItem(it);
}

/* ========= 蒐集 + 徽章 ========= */
function toggleCollect(id){
  const item = ITEM_BY_ID[id]; if(!item) return;
  const cat = item.category;
  const beforeCat = countCollectedByCategory(cat);
  const beforeTotal = state.collected.size;

  let justAdded = false;
  if(state.collected.has(id)) state.collected.delete(id);
  else { state.collected.add(id); justAdded = true; }
  saveCollected();

  const afterTotal = state.collected.size;
  const afterCat = countCollectedByCategory(cat);

  checkBadgeUnlock(beforeTotal, afterTotal);
  checkCatBadgeUnlock(cat, beforeCat, afterCat);

  if (justAdded) {
    const el = document.getElementById(`stamp-${id}`);
    if (el){ el.classList.remove('punch'); void el.offsetWidth; el.classList.add('punch'); }
  }
}

/* ========= 儲存/載入 ========= */
function saveCollected(){ localStorage.setItem(LS_KEY, JSON.stringify([...state.collected])); renderProgress(); }
function loadCollected(){ try{ const raw = localStorage.getItem(LS_KEY); return new Set(raw? JSON.parse(raw): []);}catch(e){ return new Set(); } }
function loadBadgeState(){ try{ const raw = localStorage.getItem(LS_BADGE); return new Set(raw? JSON.parse(raw): []);}catch(e){ return new Set(); } }
function saveBadgeState(){ localStorage.setItem(LS_BADGE, JSON.stringify([...state.unlockedBadges])); }
function loadArrival(){ try{ return localStorage.getItem(LS_ARR)==="1"; }catch(e){ return false; } }
function saveArrival(v){ localStorage.setItem(LS_ARR, v? "1":"0"); }
function loadCatBadgeState(){
  try{
    const raw = localStorage.getItem(LS_BADGE_CAT);
    if(!raw) return {};
    const obj = JSON.parse(raw);
    Object.keys(obj).forEach(k=> obj[k] = new Set(obj[k]));
    return obj;
  }catch(e){ return {}; }
}
function saveCatBadgeState(){
  const plain = {}; Object.keys(state.unlockedCatBadges).forEach(k=> plain[k] = [...state.unlockedCatBadges[k]]);
  localStorage.setItem(LS_BADGE_CAT, JSON.stringify(plain));
}

/* ========= 旅人報到 / 一致性校正 ========= */
function ensureArrivalBadge(){
  if(!state.arrivalGranted){
    state.arrivalGranted = true; saveArrival(true);
    setTimeout(()=> enqueueBadge("fa-solid fa-plane-arrival","解鎖徽章：旅人報到","歡迎來到金門！祝旅程愉快～"), 120);
  }
}
function calibrateConsistency(){
  if(state.collected.size === 0 && state.unlockedBadges.size > 0){
    state.unlockedBadges = new Set(); saveBadgeState();
  }
}

/* ========= 徽章檢查 ========= */
function checkBadgeUnlock(beforeTotal, afterTotal){
  BADGE_RULES.forEach(b=>{
    const crossed = (beforeTotal < b.count && afterTotal >= b.count);
    if(crossed && !state.unlockedBadges.has(b.count)){
      state.unlockedBadges.add(b.count); saveBadgeState();
      enqueueBadge(b.icon, `解鎖徽章：${b.name}`, `恭喜！已蒐集 ${afterTotal} / ${DATA.length} 個點。`);
    }
  });
}
function checkCatBadgeUnlock(cat, before, after){
  const rules = CAT_BADGE_RULES[cat]; if(!rules || rules.length===0) return;
  if(!state.unlockedCatBadges[cat]) state.unlockedCatBadges[cat] = new Set();
  rules.forEach(r=>{
    const crossed = (before < r.count && after >= r.count);
    if(crossed && !state.unlockedCatBadges[cat].has(r.count)){
      state.unlockedCatBadges[cat].add(r.count); saveCatBadgeState();
      enqueueBadge(r.icon, `分類徽章：${r.name}`, `${cat} 類別已蒐集 ${after} 個！`);
    }
  });
}

/* ========= 進度/徽章（精簡列） ========= */
function renderProgress(){
  $("#progressText").text(`${state.collected.size} / ${DATA.length}`);
  updateProgressBar();
}
function updateProgressBar(){
  const pct = DATA.length? Math.round(state.collected.size*100/DATA.length): 0;
  $("#progressBar").css("width", pct+"%").text(pct+"%");
}
function renderBadgesCompact(){
  const $row = $("#badgesRow").empty();
  const total = state.collected.size;

  if(state.arrivalGranted){
    $row.append(`<span class="badge-chip badge-strong"><i class="fa-solid fa-plane-arrival"></i> 旅人報到</span>`);
  }

  let best = null;
  for(const rule of BADGE_RULES.slice().sort((a,b)=>b.count-a.count)){
    if(total >= rule.count){ best = rule; break; }
  }
  if(best){
    $row.append(`<span class="badge-chip badge-strong"><i class="${best.icon}"></i> ${best.name}</span>`);
  }else{
    const next = BADGE_RULES[0];
    $row.append(`<span class="badge-chip badge-muted"><i class="${next.icon}"></i> 再蒐集 ${next.count - total} 個解鎖「${next.name}」</span>`);
  }

  const cats = Array.from(new Set(DATA.map(d=>d.category))).sort();
  cats.forEach(cat=>{
    const got = countCollectedByCategory(cat);
    const sum = DATA.filter(d=>d.category===cat).length;
    $row.append(`<span class="badge-chip" title="${cat} ${got}/${sum}"><i class="fa-regular fa-bookmark"></i> ${cat} ${got}/${sum}</span>`);
  });
}

/* ========= 事件 ========= */
function wireEvents(){
  $("#kw").on("input", function(){ state.kw = $(this).val(); renderList(); });

  $("#catFilters").on("click",".filter-pill", function(){
    $("#catFilters .filter-pill").removeClass("active");
    $(this).addClass("active");
    state.cat = $(this).data("cat");
    renderList();
  });

  $("#btnReset").on("click", ()=>{
    state.kw=""; state.cat="all"; $("#kw").val("");
    $("#catFilters .filter-pill").removeClass("active");
    $("#catFilters .filter-pill[data-cat='all']").addClass("active");

    state.collected = new Set();
    state.unlockedBadges = new Set();
    state.unlockedCatBadges = {};
    saveCollected(); saveBadgeState(); saveCatBadgeState();

    state.arrivalGranted = false; 
    saveArrival(false);
    ensureArrivalBadge();

    renderList(); renderProgress(); renderBadgesCompact();
    toast("已重設，重新發放「旅人報到」徽章");
  });

  $("#list").on("click",".btn-detail", function(){ openItem($(this).data("id")); });
  $("#list").on("click",".btn-collect", function(){ const id=$(this).data("id"); toggleCollect(id); renderList(); renderBadgesCompact(); });
  $("#list").on("click",".btn-locate", function(){ const it=ITEM_BY_ID[$(this).data("id")]; if(it){ flyToItem(it); openItem(it.id); } });

  $("#btnAllBadges").on("click", ()=>{ renderAllBadges(); const el=document.getElementById('allBadgesModal'); bootstrap.Modal.getOrCreateInstance(el).show(); });
}

/* ========= 全部徽章 Modal ========= */
function renderAllBadges(){
  const $g = $("#allBadgeGlobal").empty();
  BADGE_RULES.forEach(r=>{
    const unlocked = state.collected.size >= r.count;
    $g.append(`<span class="badge-chip ${unlocked?'badge-strong':''}"><i class="${r.icon}"></i> ${r.name}（≥${r.count}）</span>`);
  });

  const $cWrap = $("#allBadgeCats").empty();
  const cats = Object.keys(CAT_BADGE_RULES);
  cats.forEach(cat=>{
    const rules = CAT_BADGE_RULES[cat];
    const got = countCollectedByCategory(cat);
    const sum = DATA.filter(d=>d.category===cat).length;
    const $sec = $(`<div class="mb-3"></div>`);
    $sec.append(`<div class="mb-1 small text-muted"><strong>${cat}</strong> 目前 ${got}/${sum}</div>`);
    const $line = $(`<div class="d-flex flex-wrap gap-2"></div>`);
    rules.forEach(r=>{
      const unlocked = got >= r.count;
      $line.append(`<span class="badge-chip ${unlocked?'badge-strong':''}"><i class="${r.icon}"></i> ${r.name}（≥${r.count}）</span>`);
    });
    $sec.append($line);
    $cWrap.append($sec);
  });
}

/* ========= URL 掃碼集章 ========= */
function tryAutoStampFromURL(){
  const params = new URLSearchParams(location.search);
  const id = params.get("stamp"); if(!id) return;
  const it = ITEM_BY_ID[id]; if(!it){ toast("找不到此項目 ID"); return; }
  if(!state.collected.has(id)){
    const beforeTotal = state.collected.size;
    const beforeCat = countCollectedByCategory(it.category);
    state.collected.add(id);
    saveCollected(); renderList(); renderBadgesCompact();
    checkBadgeUnlock(beforeTotal, state.collected.size);
    checkCatBadgeUnlock(it.category, beforeCat, countCollectedByCategory(it.category));
    toast(`已將【${it.name}】加入蒐集`);
    const el = document.getElementById(`stamp-${id}`);
    if (el){ el.classList.remove('punch'); void el.offsetWidth; el.classList.add('punch'); }
  }
}

/* ========= 輔助 ========= */
function countCollectedByCategory(cat){
  let n = 0; state.collected.forEach(id=>{ const it = ITEM_BY_ID[id]; if(it && it.category===cat) n++; });
  return n;
}

/* ========= Sticky 高度校正（含收合動畫追蹤） ========= */
(function () {
  function setStickyVars() {
    const nav  = document.getElementById('topNav');
    const bar1 = document.querySelector('.subbar-1');
    const bar2 = document.querySelector('.subbar-2');
    const bar3 = document.querySelector('.subbar-3');

    const navH  = nav  ? nav.getBoundingClientRect().height  : 56;
    const bar1H = bar1 ? bar1.getBoundingClientRect().height : 48;
    const bar2H = bar2 ? bar2.getBoundingClientRect().height : 40;
    const bar3H = bar3 ? bar3.getBoundingClientRect().height : 48;

    document.documentElement.style.setProperty('--navH',  navH  + 'px');
    document.documentElement.style.setProperty('--bar1H', bar1H + 'px');
    document.documentElement.style.setProperty('--bar2H', bar2H + 'px');
    document.documentElement.style.setProperty('--bar3H', bar3H + 'px');
  }

  window.addEventListener('load', setStickyVars);
  window.addEventListener('resize', () => { clearTimeout(window.__stickyT); window.__stickyT = setTimeout(setStickyVars, 100); });

  document.addEventListener('show.bs.collapse', () => startSmoothCollapseWatch());
  document.addEventListener('shown.bs.collapse', () => stopSmoothCollapseWatch());
  document.addEventListener('hide.bs.collapse', () => startSmoothCollapseWatch());
  document.addEventListener('hidden.bs.collapse', () => { stopSmoothCollapseWatch(); setStickyVars(); });

  let smoothTimer = null;
  function startSmoothCollapseWatch() {
    stopSmoothCollapseWatch();
    smoothTimer = setInterval(setStickyVars, 16);
  }
  function stopSmoothCollapseWatch() {
    if (smoothTimer) { clearInterval(smoothTimer); smoothTimer = null; }
  }
})();
