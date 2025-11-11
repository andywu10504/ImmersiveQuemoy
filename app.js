async function loadCatalog() {
  const res = await fetch('data/catalog.json');
  return await res.json();
}

document.addEventListener('DOMContentLoaded', async () => {
  const catalog = await loadCatalog();
  const { DATA, ITEM_BY_ID } = buildDataFromCatalog(catalog);
  window.DATA = DATA;
  window.ITEM_BY_ID = ITEM_BY_ID;

  // ✅ 保留原本啟動流程
  renderCategoryFilters();
  ensureArrivalBadge();
  calibrateConsistency();
  initMap();
  renderList();
  renderProgress();
  renderBadgesCompact();
  wireEvents();
  tryAutoStampFromURL();
});
