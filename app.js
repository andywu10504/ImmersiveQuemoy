/* ========= 資料載入 ========= */
async function loadCatalog() {
  const res = await fetch('./catalog.json', { cache: 'no-cache' });
  if (!res.ok) throw new Error('載入 catalog.json 失敗');
  return await res.json();
}

/* ========= 通用工具 ========= */
function escapeHtml(s){ return (s||"").replace(/[&<>"']/g, function(m){ return ({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;" })[m]; }); }
function toast(msg){
  const id = "liveToast";
  const tpl =
    '<div id="'+id+'" class="toast align-items-center text-bg-dark border-0 position-fixed bottom-0 end-0 m-3" role="status" aria-live="polite" aria-atomic="true">' +
      '<div class="d-flex">' +
        '<div class="toast-body"><i class="fa-regular fa-circle-check me-2"></i>' + escapeHtml(msg) + '</div>' +
        '<button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>' +
      '</div>' +
    '</div>';
  $("#"+id).remove();
  $("body").append(tpl);
  if (window.bootstrap) new bootstrap.Toast(document.getElementById(id), {delay:1500}).show();
}

/* ========= 將 catalog 正規化 ========= */
function buildDataFromCatalog(catalog){
  const seen = new Set();
  let seq = 1;
  function autoId(cat, i){
    const map = {
      "坑道":"K","戰史館":"W","據點":"G","海灘":"B","碉堡":"F","地標":"L","步道":"T","體驗":"Q",
      "在地文化":"C","在地美食":"M","在地飲品":"D","金門名產":"S","傳統點心":"Tn","特色風獅爺":"Ls"
    };
    const p = (map[cat] || "X");
    const n = String(i).padStart(3,"0");
    return p + n;
  }
  const normalize = function(r){
    const id = (r.id && !seen.has(r.id)) ? r.id : autoId(r.category, seq++);
    seen.add(id);
    return {
      id: id,
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
  const byId = {};
  data.forEach(function(d){ byId[d.id] = d; });
  return { DATA:data, ITEM_BY_ID:byId };
}

/* ========= LocalStorage Keys ========= */
var LS_KEY    = "kinmen_collect_v1";
var LS_BADGE  = "kinmen_badges_v1";
var LS_ARR    = "kinmen_arrival_v1";
var LS_BADGE_CAT = "kinmen_badges_cat_v1";

/* ========= 徽章規則 ========= */
var BADGE_RULES = [
  {count:1 , name:"入門",      icon:"fa-solid fa-flag"},
  {count:3 , name:"在地達人",  icon:"fa-solid fa-compass"},
  {count:5 , name:"戰地通",    icon:"fa-solid fa-shield-halved"},
  {count:10, name:"金門之友",  icon:"fa-solid fa-wand-magic-sparkles"}
];

var CAT_BADGE_RULES = {
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
var DATA = [];
var ITEM_BY_ID = {};
var state = {
  kw:"", cat:"all",
  collected: loadCollected(),
  unlockedBadges: loadBadgeState(),
  arrivalGranted: loadArrival(),
  unlockedCatBadges: loadCatBadgeState()
};

/* ========= 徽章顯示佇列 ========= */
var badgeQueue = []; var isBadgeShowing = false;
function enqueueBadge(icon, title, desc){ badgeQueue.push({icon:icon, title:title, desc:desc}); processBadgeQueue(); }
function processBadgeQueue(){
  if (!window.bootstrap || isBadgeShowing || badgeQueue.length===0) return;
  var nxt = badgeQueue.shift(); isBadgeShowing = true;
  $("#badgeIcon").html('<i class="'+nxt.icon+'"></i>'); $("#badgeTitle").text(nxt.title); $("#badgeDesc").text(nxt.desc);
  var el=document.getElementById('badgeModal'); var modal=bootstrap.Modal.getOrCreateInstance(el);
  var once=function(){ el.removeEventListener('hidden.bs.modal', once); isBadgeShowing=false; setTimeout(processBadgeQueue,50); };
  el.addEventListener('hidden.bs.modal', once); modal.show();
}

/* ========= 啟動 ========= */
document.addEventListener('DOMContentLoaded', (function () {
  return function(){
    loadCatalog().then(function(catalog){
      var built = buildDataFromCatalog(catalog);
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
    }).catch(function(err){
      console.error('初始化失敗：', err);
      toast('初始化失敗，請重新整理');
    });
  };
})());

/* ========= 地圖 ========= */
var map, markers = {};
function initMap(){
  map = L.map('map', {scrollWheelZoom:true}).setView([24.45,118.36], 11);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19, attribution:'© OpenStreetMap'}).addTo(map);
  markers = {};
  DATA.forEach(function(item){
    if(typeof item.lat==="number" && typeof item.lng==="number"){
      var html = '<strong>'+escapeHtml(item.name)+'</strong><br><span class="text-muted">'+escapeHtml(item.category)+'</span>';
      var marker = L.marker([item.lat,item.lng]).addTo(map).bindPopup(html);
      marker.on('click', function(){ openItem(item.id); });
      markers[item.id] = marker;
    }
  });
}
function flyToItem(item){
  if(typeof item.lat==="number" && typeof item.lng==="number"){
    map.flyTo([item.lat,item.lng], 14, {duration:.6});
    if (markers[item.id]) markers[item.id].openPopup();
  }
}

/* ========= 類別篩選 ========= */
function renderCategoryFilters(){
  var $wrap = $("#catFilters").empty();
  var set = new Set(); DATA.forEach(function(d){ set.add(d.category); });
  var cats = Array.from(set).sort();

  $wrap.append('<span class="tag filter-pill active" data-cat="all"><i class="fa-solid fa-sliders"></i> 全部</span>');
  cats.forEach(function(c){
    $wrap.append('<span class="tag filter-pill" data-cat="'+escapeHtml(c)+'">'+escapeHtml(c)+'</span>');
  });
}

/* ========= 清單 ========= */
function renderList(){
  var $list = $("#list").empty();
  var items = filtered().slice().sort(function(a,b){
    var pa = (a.category === "體驗") ? 0 : 1;
    var pb = (b.category === "體驗") ? 0 : 1;
    if (pa !== pb) return pa - pb;
    return (a.name||"").localeCompare(b.name||"", 'zh-Hant');
  });
  if(items.length===0){ $("#empty").removeClass("d-none"); return; }
  $("#empty").addClass("d-none");

  items.forEach(function(it){
    var isCollected = state.collected.has(it.id);
    var tags = (it.tags||[]).map(function(t){ return '<span class="tag">'+escapeHtml(t)+'</span>'; }).join('');
    var col =
      '<div class="col-12 col-md-6 col-lg-4">'+
        '<div class="card h-100 '+(isCollected?'collected':'')+'" id="card-'+it.id+'">'+
          '<div class="card-body position-relative">'+
            '<div class="d-flex justify-content-between align-items-start">'+
              '<h5 class="card-title mb-1">'+escapeHtml(it.name)+'</h5>'+
              '<span class="badge '+(isCollected?'text-bg-success':'text-bg-secondary')+'">'+(isCollected?'已蒐集':'未蒐集')+'</span>'+
            '</div>'+
            '<div class="text-muted small mb-2"><i class="fa-solid fa-location-dot"></i> '+escapeHtml(it.category)+'</div>'+
            '<p class="card-text">'+escapeHtml(it.desc||"").slice(0,88)+(((it.desc||"").length>88)?'…':'')+'</p>'+
            '<div class="mb-2">'+tags+'</div>'+
            '<div class="d-flex gap-2 flex-wrap">'+
              '<button class="btn btn-sm btn-outline-primary btn-detail" data-id="'+it.id+'"><i class="fa-regular fa-circle-question"></i> 詳情</button>'+
              '<button class="btn btn-sm '+(isCollected?'btn-success':'btn-outline-success')+' btn-collect" data-id="'+it.id+'">'+
                '<i class="fa-solid fa-stamp"></i> '+(isCollected?'已蒐集':'蒐集')+
              '</button>'+
              '<button class="btn btn-sm btn-outline-secondary btn-locate" data-id="'+it.id+'"><i class="fa-solid fa-map-location-dot"></i> 地圖</button>'+
            '</div>'+
            '<div class="stamp" id="stamp-'+it.id+'">已集章</div>'+
          '</div>'+
        '</div>'+
      '</div>';
    $list.append(col);
  });
  $("#progressText").text(state.collected.size + ' / ' + DATA.length);
  updateProgressBar();
}

/* ========= 篩選 ========= */
function filtered(){
  var kw = (state.kw||"").trim().toLowerCase();
  var cat = state.cat;
  return DATA.filter(function(it){
    var hitCat = (cat==='all') || (it.category===cat);
    var text = (it.name + ' ' + (it.desc||'') + ' ' + (it.tags||[]).join(' ')).toLowerCase();
    var hitKw = kw==='' || text.indexOf(kw) >= 0;
    return hitCat && hitKw;
  });
}

/* ========= 詳情 ========= */
function openItem(id){
  var it = ITEM_BY_ID[id]; if(!it) return;
  $("#mdTitle").text(it.name);
  var tagHtml = '<span class="tag">'+escapeHtml(it.category)+'</span>' + (it.tags||[]).map(function(t){ return '<span class="tag">'+escapeHtml(t)+'</span>'; }).join('');
  $("#mdTags").html(tagHtml);
  $("#mdDesc").text(it.desc||"");
  $("#mdAddr").text(it.address || "—");
  if(typeof it.lat==="number" && typeof it.lng==="number"){
    $("#mdCoord").text(it.lat.toFixed(5)+', '+it.lng.toFixed(5));
    $("#mdNav").attr("href", "https://www.google.com/maps?q="+it.lat+","+it.lng).removeClass("disabled");
  }else{
    $("#mdCoord").text("—");
    $("#mdNav").attr("href","#").addClass("disabled");
  }
  $("#mdQuests").empty().append((it.quests||[]).map(function(q){ return '<li>'+escapeHtml(q)+'</li>'; }).join(''));

  var collected = state.collected.has(it.id);
  $("#mdCollectBtn")
    .toggleClass("btn-success", !collected)
    .toggleClass("btn-outline-success", collected)
    .html(collected ? '<i class="fa-regular fa-circle-xmark"></i> 取消蒐集' : '<i class="fa-solid fa-stamp"></i> 蒐集')
    .off("click").on("click", function(){
      var el = document.getElementById('itemModal');
      var modal = bootstrap.Modal.getOrCreateInstance(el);
      var once = function () {
        el.removeEventListener('hidden.bs.modal', once);
        toggleCollect(it.id);
        renderList();
        renderBadgesCompact();
      };
      el.addEventListener('hidden.bs.modal', once);
      modal.hide();
    });

  var modalEl = document.getElementById('itemModal');
  bootstrap.Modal.getOrCreateInstance(modalEl).show();
  flyToItem(it);
}

/* ========= 蒐集 + 徽章 ========= */
function toggleCollect(id){
  var item = ITEM_BY_ID[id]; if(!item) return;
  var cat = item.category;
  var beforeCat = countCollectedByCategory(cat);
  var beforeTotal = state.collected.size;

  var justAdded = false;
  if(state.collected.has(id)) state.collected.delete(id);
  else { state.collected.add(id); justAdded = true; }
  saveCollected();

  var afterTotal = state.collected.size;
  var afterCat = countCollectedByCategory(cat);

  checkBadgeUnlock(beforeTotal, afterTotal);
  checkCatBadgeUnlock(cat, beforeCat, afterCat);

  if (justAdded) {
    var el = document.getElementById('stamp-'+id);
    if (el){ el.classList.remove('punch'); void el.offsetWidth; el.classList.add('punch'); }
  }
}

/* ========= 儲存/載入 ========= */
function saveCollected(){ localStorage.setItem(LS_KEY, JSON.stringify(Array.from(state.collected))); renderProgress(); }
function loadCollected(){ try{ var raw = localStorage.getItem(LS_KEY); return new Set(raw? JSON.parse(raw): []);}catch(e){ return new Set(); } }
function loadBadgeState(){ try{ var raw = localStorage.getItem(LS_BADGE); return new Set(raw? JSON.parse(raw): []);}catch(e){ return new Set(); } }
function saveBadgeState(){ localStorage.setItem(LS_BADGE, JSON.stringify(Array.from(state.unlockedBadges))); }
function loadArrival(){ try{ return localStorage.getItem(LS_ARR)==="1"; }catch(e){ return false; } }
function saveArrival(v){ localStorage.setItem(LS_ARR, v? "1":"0"); }
function loadCatBadgeState(){
  try{
    var raw = localStorage.getItem(LS_BADGE_CAT);
    if(!raw) return {};
    var obj = JSON.parse(raw);
    Object.keys(obj).forEach(function(k){ obj[k] = new Set(obj[k]); });
    return obj;
  }catch(e){ return {}; }
}
function saveCatBadgeState(){
  var plain = {}; Object.keys(state.unlockedCatBadges).forEach(function(k){ plain[k] = Array.from(state.unlockedCatBadges[k]); });
  localStorage.setItem(LS_BADGE_CAT, JSON.stringify(plain));
}

/* ========= 旅人報到 / 一致性校正 ========= */
function ensureArrivalBadge(){
  if(!state.arrivalGranted){
    state.arrivalGranted = true; saveArrival(true);
    setTimeout(function(){ enqueueBadge("fa-solid fa-plane-arrival","解鎖徽章：旅人報到","歡迎來到金門！祝旅程愉快～"); }, 120);
  }
}
function calibrateConsistency(){
  if(state.collected.size === 0 && state.unlockedBadges.size > 0){
    state.unlockedBadges = new Set(); saveBadgeState();
  }
}

/* ========= 徽章檢查 ========= */
function checkBadgeUnlock(beforeTotal, afterTotal){
  BADGE_RULES.forEach(function(b){
    var crossed = (beforeTotal < b.count && afterTotal >= b.count);
    if(crossed && !state.unlockedBadges.has(b.count)){
      state.unlockedBadges.add(b.count); saveBadgeState();
      enqueueBadge(b.icon, '解鎖徽章：'+b.name, '恭喜！已蒐集 '+afterTotal+' / '+DATA.length+' 個點。');
    }
  });
}
function checkCatBadgeUnlock(cat, before, after){
  var rules = CAT_BADGE_RULES[cat]; if(!rules || rules.length===0) return;
  if(!state.unlockedCatBadges[cat]) state.unlockedCatBadges[cat] = new Set();
  rules.forEach(function(r){
    var crossed = (before < r.count && after >= r.count);
    if(crossed && !state.unlockedCatBadges[cat].has(r.count)){
      state.unlockedCatBadges[cat].add(r.count); saveCatBadgeState();
      enqueueBadge(r.icon, '分類徽章：'+r.name, cat+' 類別已蒐集 '+after+' 個！');
    }
  });
}

/* ========= 進度/徽章（精簡列） ========= */
function renderProgress(){
  $("#progressText").text(state.collected.size + ' / ' + DATA.length);
  updateProgressBar();
}
function updateProgressBar(){
  var pct = DATA.length? Math.round(state.collected.size*100/DATA.length): 0;
  $("#progressBar").css("width", pct+"%").text(pct+"%");
}
function renderBadgesCompact(){
  var $row = $("#badgesRow").empty();
  var total = state.collected.size;

  if(state.arrivalGranted){
    $row.append('<span class="badge-chip badge-strong"><i class="fa-solid fa-plane-arrival"></i> 旅人報到</span>');
  }

  var best = null;
  BADGE_RULES.slice().sort(function(a,b){return b.count-a.count;}).some(function(rule){
    if(total >= rule.count){ best = rule; return true; }
    return false;
  });
  if(best){
    $row.append('<span class="badge-chip badge-strong"><i class="'+best.icon+'"></i> '+best.name+'</span>');
  }else{
    var next = BADGE_RULES[0];
    $row.append('<span class="badge-chip badge-muted"><i class="'+next.icon+'"></i> 再蒐集 '+(next.count - total)+' 個解鎖「'+next.name+'」</span>');
  }

  var set = new Set(); DATA.forEach(function(d){ set.add(d.category); });
  Array.from(set).sort().forEach(function(cat){
    var got = countCollectedByCategory(cat);
    var sum = DATA.filter(function(d){return d.category===cat;}).length;
    $row.append('<span class="badge-chip" title="'+cat+' '+got+'/'+sum+'"><i class="fa-regular fa-bookmark"></i> '+cat+' '+got+'/'+sum+'</span>');
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

  $("#btnReset").on("click", function(){
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
  $("#list").on("click",".btn-collect", function(){ var id=$(this).data("id"); toggleCollect(id); renderList(); renderBadgesCompact(); });
  $("#list").on("click",".btn-locate", function(){ var it=ITEM_BY_ID[$(this).data("id")]; if(it){ flyToItem(it); openItem(it.id); } });

  $("#btnAllBadges").on("click", function(){ renderAllBadges(); var el=document.getElementById('allBadgesModal'); bootstrap.Modal.getOrCreateInstance(el).show(); });
}

/* ========= 全部徽章 Modal ========= */
function renderAllBadges(){
  var $g = $("#allBadgeGlobal").empty();
  BADGE_RULES.forEach(function(r){
    var unlocked = state.collected.size >= r.count;
    $g.append('<span class="badge-chip '+(unlocked?'badge-strong':'')+'"><i class="'+r.icon+'"></i> '+r.name+'（≥'+r.count+'）</span>');
  });

  var $cWrap = $("#allBadgeCats").empty();
  var cats = Object.keys(CAT_BADGE_RULES);
  cats.forEach(function(cat){
    var rules = CAT_BADGE_RULES[cat];
    var got = countCollectedByCategory(cat);
    var sum = DATA.filter(function(d){return d.category===cat;}).length;
    var $sec = $('<div class="mb-3"></div>');
    $sec.append('<div class="mb-1 small text-muted"><strong>'+cat+'</strong> 目前 '+got+'/'+sum+'</div>');
    var $line = $('<div class="d-flex flex-wrap gap-2"></div>');
    rules.forEach(function(r){
      var unlocked = got >= r.count;
      $line.append('<span class="badge-chip '+(unlocked?'badge-strong':'')+'"><i class="'+r.icon+'"></i> '+r.name+'（≥'+r.count+'）</span>');
    });
    $sec.append($line);
    $cWrap.append($sec);
  });
}

/* ========= URL 掃碼集章 ========= */
function tryAutoStampFromURL(){
  var params = new URLSearchParams(location.search);
  var id = params.get("stamp"); if(!id) return;
  var it = ITEM_BY_ID[id]; if(!it){ toast("找不到此項目 ID"); return; }
  if(!state.collected.has(id)){
    var beforeTotal = state.collected.size;
    var beforeCat = countCollectedByCategory(it.category);
    state.collected.add(id);
    saveCollected(); renderList(); renderBadgesCompact();
    checkBadgeUnlock(beforeTotal, state.collected.size);
    checkCatBadgeUnlock(it.category, beforeCat, countCollectedByCategory(it.category));
    toast('已將【'+it.name+'】加入蒐集');
    var el = document.getElementById('stamp-'+id);
    if (el){ el.classList.remove('punch'); void el.offsetWidth; el.classList.add('punch'); }
  }
}

/* ========= 輔助 ========= */
function countCollectedByCategory(cat){
  var n = 0; state.collected.forEach(function(id){ var it = ITEM_BY_ID[id]; if(it && it.category===cat) n++; });
  return n;
}

/* ========= Sticky 高度校正 ========= */
(function () {
  function setStickyVars() {
    var nav  = document.getElementById('topNav');
    var bar1 = document.querySelector('.subbar-1');
    var bar2 = document.querySelector('.subbar-2');
    var bar3 = document.querySelector('.subbar-3');

    var navH  = nav  ? nav.getBoundingClientRect().height  : 56;
    var bar1H = bar1 ? bar1.getBoundingClientRect().height : 48;
    var bar2H = bar2 ? bar2.getBoundingClientRect().height : 40;
    var bar3H = bar3 ? bar3.getBoundingClientRect().height : 48;

    document.documentElement.style.setProperty('--navH',  navH  + 'px');
    document.documentElement.style.setProperty('--bar1H', bar1H + 'px');
    document.documentElement.style.setProperty('--bar2H', bar2H + 'px');
    document.documentElement.style.setProperty('--bar3H', bar3H + 'px');
  }

  window.addEventListener('load', setStickyVars);
  window.addEventListener('resize', function(){ clearTimeout(window.__stickyT); window.__stickyT = setTimeout(setStickyVars, 100); });

  document.addEventListener('show.bs.collapse', function(){ startSmoothCollapseWatch(); });
  document.addEventListener('shown.bs.collapse', function(){ stopSmoothCollapseWatch(); });
  document.addEventListener('hide.bs.collapse', function(){ startSmoothCollapseWatch(); });
  document.addEventListener('hidden.bs.collapse', function(){ stopSmoothCollapseWatch(); setStickyVars(); });

  var smoothTimer = null;
  function startSmoothCollapseWatch() { stopSmoothCollapseWatch(); smoothTimer = setInterval(setStickyVars, 16); }
  function stopSmoothCollapseWatch() { if (smoothTimer) { clearInterval(smoothTimer); smoothTimer = null; } }
})();
