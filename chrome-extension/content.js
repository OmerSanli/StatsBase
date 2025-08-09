// content.js — Sadece beğeni odaklı scraper (API yok, modal + DOM)
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const PANEL_ID = "__ig_panel_statsbase__";
const FAB_ID   = "__ig_panel_statsbase_fab__";

let isRunning = false;
let stopRequested = false;

// mouse pozisyonu (toast için)
let __mouse = { x: null, y: null };
document.addEventListener('mousemove', (e)=>{ __mouse.x = e.clientX; __mouse.y = e.clientY; }, {passive:true});

// Kısaltılmış insan okunabilir format
const human = n =>
  n == null ? '-' :
    n >= 1e6 ? (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M' :
      n >= 1e3 ? (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'K' : String(n);

// “ne kadar önce” göstergesi
function timeAgo(ts){
  if (!ts) return '';
  const s = Math.max(0, Math.floor((Date.now() - ts)/1000));
  const y = Math.floor(s/31536000); if (y) return `${y}y önce`;
  const mth = Math.floor(s/2592000); if (mth) return `${mth}a önce`;
  const d = Math.floor(s/86400); if (d) return `${d}g önce`;
  const h = Math.floor(s/3600); if (h) return `${h}s önce`;
  const mi = Math.floor(s/60); if (mi) return `${mi}dk önce`;
  return `${s}sn önce`;
}

// Daha kapsayıcı sayı ayrıştırıcı
function numberFromText(input) {
  if (!input) return null;
  const raw = String(input).replace(/\u00A0/g, ' ').trim();
  const norm = raw
    .replace(/(\d)\.(?=\d{3}(\D|$))/g, '$1')
    .replace(/,(\d)/g, '.$1');

  let m = norm.match(/(\d+(?:\.\d+)?)[\s-]*(milyon|million|mn)\b/i);
  if (m) return Math.round(parseFloat(m[1]) * 1e6);

  m = norm.match(/(\d+(?:\.\d+)?)[\s-]*(bin|thousand)\b/i);
  if (m) return Math.round(parseFloat(m[1]) * 1e3);

  m = norm.match(/(\d+(?:\.\d+)?)[\s]*([kmb])\b/i);
  if (m) {
    const n = parseFloat(m[1]);
    const u = m[2].toUpperCase();
    return Math.round(n * (u === 'M' ? 1e6 : 1e3)); // K/B -> 1e3
  }

  m = norm.match(/(\d+(?:\.\d+)?)/);
  if (!m) return null;
  const n = parseFloat(m[1]);
  return isFinite(n) ? Math.round(n) : null;
}

// Mouse yanında toast
function toast(msg){
  const t=document.createElement('div');
  t.textContent=msg;
  t.style.cssText=`
    position:fixed; z-index:2147483647; pointer-events:none;
    background:#222; color:#fff; padding:8px 10px; border-radius:10px;
    font:500 13px system-ui,Arial; box-shadow:0 6px 20px rgba(0,0,0,.5); opacity:.98;
    transform:translate(8px, -24px); transition:opacity .15s ease-out;`;
  if (__mouse.x!=null && __mouse.y!=null) {
    t.style.left = (__mouse.x + 12) + 'px';
    t.style.top  = (__mouse.y + 12) + 'px';
  } else {
    t.style.right = '20px';
    t.style.bottom = '20px';
  }
  document.documentElement.appendChild(t);
  setTimeout(()=>{ t.style.opacity='0'; }, 1200);
  setTimeout(()=>t.remove(), 1500);
}

// SVG ikonları
const Icons = {
  Close:`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" class="igp-icon">
    <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  </svg>`,
  Refresh:`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" class="igp-icon">
    <g transform="translate(1,1.8) scale(0.9)">
      <path d="M20 12a8 8 0 1 1-1.2-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M20 4v4h-4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
  </svg>`,
  Spinner:`<svg width="16" height="16" viewBox="0 0 24 24" class="igp-spin" fill="none">
    <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="3" opacity="0.25"/>
    <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
  </svg>`,
  Logo:`<svg width="18" height="18" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="20" cy="20" r="19" fill="#1f1f1f" stroke="#2c2c2c" stroke-width="2"/>
      <g transform="translate(-28.5,0) scale(0.05)">
        <path transform="translate(0,40)" fill="#cfd3d7" d="M1117.99,372.37c32.2,19.07,47.18,49.93,41.4,85.27-7.2,44.05-49.44,74.56-93.49,67.51-39.73-6.35-69.19-40.76-69.24-80.97-.05-43.5.07-86.99-.07-130.49-.04-13.48.57-26.95-.82-40.44-3.95-38.47-21.8-69.35-50.6-94.42-1.07-.93-2.17-2.2-4.11-1.39-1.39,2.55-.76,5.44-.76,8.18-.05,86.99-.02,173.99-.09,260.98,0,8.87.67,17.66,2.44,26.3,15.31,74.69,84.62,120.76,158.7,108.35,81.5-13.65,130.58-88.58,112.7-168.53-14.96-66.89-74.05-105.65-134.44-107.36-20.72-.59-41.13,2.36-61.48,5.8-7.41,1.25-8.75,2.7-8.76,10.03-.02,23.83-.01,47.66.04,71.5,0,1.57-.62,3.35.9,4.73,2.27-.01,2.93-2.02,4-3.34,26.55-32.66,65.4-41.01,103.68-21.72"/>
        <path transform="translate(0,40)" fill="#ffffff" d="M734.51,221.96c-14.72,28.47-19.64,58.64-13.87,90.07,13.42,73.02,77.03,117.91,149.6,114.38,15.29-.74,30.47-2.61,45.62-4.79,7.73-1.11,9.89-3.22,9.74-10.99-.43-21.3-.62-42.6-.05-63.91.08-2.91,1.76-7.22-2-8.46-3.19-1.06-4.71,3.08-6.68,5.13-18.89,19.7-42.06,29.01-69.02,25.62-60.13-7.58-91.22-72.35-59.96-124.18,15.57-25.82,39.36-38.6,69.01-38.84,24.83-.2,45.74,10.39,62.82,28.42,1.2,1.27,2.23,3.45,4.39,2.5,2.03-.89,1.52-3.15,1.49-4.92-.18-10.15-.83-20.31-.54-30.44.27-9.32.48-18.63.61-27.95.08-5.7-2.35-9.45-7.47-11.78-27.5-12.54-56.33-16.17-85.83-10.76-43.37,7.94-75.83,31.81-97.86,70.91Z"/>
      </g>
  </svg>`,
  // FAB için çerçevesiz glif
  FabLogo:`<svg width="24" height="24" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <g transform="translate(-28,0) scale(0.05)">
        <path transform="translate(0,40)" fill="#cfd3d7" d="M1117.99,372.37c32.2,19.07,47.18,49.93,41.4,85.27-7.2,44.05-49.44,74.56-93.49,67.51-39.73-6.35-69.19-40.76-69.24-80.97-.05-43.5.07-86.99-.07-130.49-.04-13.48.57-26.95-.82-40.44-3.95-38.47-21.8-69.35-50.6-94.42-1.07-.93-2.17-2.2-4.11-1.39-1.39,2.55-.76,5.44-.76,8.18-.05,86.99-.02,173.99-.09,260.98,0,8.87.67,17.66,2.44,26.3,15.31,74.69,84.62,120.76,158.7,108.35,81.5-13.65,130.58-88.58,112.7-168.53-14.96-66.89-74.05-105.65-134.44-107.36-20.72-.59-41.13,2.36-61.48,5.8-7.41,1.25-8.75,2.7-8.76,10.03-.02,23.83-.01,47.66.04,71.5,0,1.57-.62,3.35.9,4.73,2.27-.01,2.93-2.02,4-3.34,26.55-32.66,65.4-41.01,103.68-21.72"/>
        <path transform="translate(0,40)" fill="#ffffff" d="M734.51,221.96c-14.72,28.47-19.64,58.64-13.87,90.07,13.42,73.02,77.03,117.91,149.6,114.38,15.29-.74,30.47-2.61,45.62-4.79,7.73-1.11,9.89-3.22,9.74-10.99-.43-21.3-.62-42.6-.05-63.91.08-2.91,1.76-7.22-2-8.46-3.19-1.06-4.71,3.08-6.68,5.13-18.89,19.7-42.06,29.01-69.02,25.62-60.13-7.58-91.22-72.35-59.96-124.18,15.57-25.82,39.36-38.6,69.01-38.84,24.83-.2,45.74,10.39,62.82,28.42,1.2,1.27,2.23,3.45,4.39,2.5,2.03-.89,1.52-3.15,1.49-4.92-.18-10.15-.83-20.31-.54-30.44.27-9.32.48-18.63.61-27.95.08-5.7-2.35-9.45-7.47-11.78-27.5-12.54-56.33-16.17-85.83-10.76-43.37,7.94-75.83,31.81-97.86,70.91Z"/>
      </g>
  </svg>`
};

// Kullanıcı adını yakala (profil sayfası kontrolü için)
function getUsername(){
  const path = (location.pathname || '/').split('?')[0].replace(/\/+/g,'/').split('/');
  let u = path[1] || '';
  if (!u && path[2]) u = path[2];
  u = (u || '').replace(/^@/,'').trim();
  if (u && !/^(p|reel|explore|direct|accounts|stories|notifications|settings)$/.test(u)) return u;

  const ogt = document.querySelector('meta[property="og:title"]')?.content || '';
  const m = ogt.match(/^([^|—-]+)/);
  if (m) return m[1].trim().replace(/\s+/g,'_');

  const anchor = document.querySelector('header a[role="link"][href^="/"][href$="/"] span');
  if (anchor?.textContent) return anchor.textContent.trim();

  return '';
}

// KAYIT: profil verisini kaydet + tarihçeye ekle
function saveProfileData(username, payload){
  try{
    localStorage.setItem(`igp-data:${username}`, JSON.stringify(payload));
    const key = `igp-history:${username}`;
    const hist = JSON.parse(localStorage.getItem(key) || '[]');
    hist.push({
      ts: payload.ts,
      followers: payload.followers ?? null,
      avgLikes: payload.avgLikes ?? null,
      er: payload.er ?? null
    });
    localStorage.setItem(key, JSON.stringify(hist.slice(-200)));
  }catch(e){/* sessiz geç */}
}

// ÖNBELLEKTEN YÜKLE: panel alanlarını doldur
function preloadFromCache(){
  const u = getUsername();
  if (!u) return;
  const raw = localStorage.getItem(`igp-data:${u}`);
  if (!raw) return;

  try{
    const data = JSON.parse(raw);
    setText('igp-followers', data.followers ? human(data.followers) : '-');
    setText('igp-sample-out', data.processed ?? '-');
    setText('igp-avg-like', human(data.avgLikes ?? null));

    const erText = data.er != null
      ? new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(data.er) + '%'
      : (data.erText || '-');
    setText('igp-eng', erText);

    const last = document.getElementById('igp-last');
    if (last){
      last.style.display = 'block';
      last.textContent = `Son güncelleme: ${timeAgo(data.ts)}`;
    }

    // Cache’teki collab rozetlerini uygula
    applyCachedCollabBadges();
  }catch(e){ /* yoksay */ }
}

// Panel alanlarını sıfırla
function resetPanelFields(){
  setText('igp-followers', '-');
  setText('igp-sample-out', '-');
  setText('igp-avg-like', '-');
  setText('igp-eng', '-');
  const last = document.getElementById('igp-last');
  if (last){ last.style.display='none'; last.textContent=''; }
}

// Paneli manuel yenile
function refreshPanel(){
  const panel = document.getElementById(PANEL_ID);
  if (!panel) return;
  resetPanelFields();
  try{
    const links = collectLinks();
    setText('igp-link-count', links.length);
  }catch(_){}
  const followers = getFollowerCount();
  setText('igp-followers', followers ? human(followers) : '-');
  preloadFromCache();
  applyCachedCollabBadges();
}

// Minimize (FAB) ikonunu hazırla
function ensureFab(){
  let fab = document.getElementById(FAB_ID);
  if (fab) return fab;

  fab = document.createElement('button');
  fab.id = FAB_ID;
  fab.title = 'StatsBase';
  fab.style.cssText = `
    position:fixed; top:16px; right:16px; z-index:2147483647;
    width:36px; height:36px; border-radius:50%;
    border:1px solid #2c2c2c; background:#161616; color:#c7c7c7;
    display:flex; align-items:center; justify-content:center;
    cursor:pointer; box-shadow:0 6px 20px rgba(0,0,0,.35);
    transition: transform .15s ease, opacity .15s ease, background .15s ease;
  `;
  fab.onmouseenter = ()=>{ fab.style.background = '#1f1f1f'; };
  fab.onmouseleave = ()=>{ fab.style.background = '#161616'; };

  fab.innerHTML = Icons.FabLogo;
  fab.onclick = () => openPanelFromFab();

  document.documentElement.appendChild(fab);
  return fab;
}

function showFab(show=true){
  const fab = ensureFab();
  fab.style.opacity = show ? '1' : '0';
  fab.style.pointerEvents = show ? 'auto' : 'none';
}

// Paneli oluştur
function ensurePanel() {
  let el = document.getElementById(PANEL_ID);
  if (el) return el;

  el = document.createElement('div');
  el.id = PANEL_ID;
  el.style.cssText = 'position:fixed;top:16px;right:16px;z-index:2147483647;font-family:system-ui,Arial;';
  el.innerHTML = `
  <div class="igp-wrap" style="background:#111;color:#eee;border:1px solid #2a2a2a;border-radius:14px;min-width:280px;padding:14px 16px;box-shadow:0 8px 28px rgba(0,0,0,.45); position:relative; transform-origin: top right; transition: transform .18s ease, opacity .18s ease;">
    <style>
      #${PANEL_ID} .igp-btn {
        padding:8px 12px; border:1px solid #2c2c2c; border-radius:10px; background:#1c1c1c;
        color:#e5e5e5; cursor:pointer; display:inline-flex; align-items:center; gap:8px;
        transition: background .15s ease, color .15s ease;
      }
      #${PANEL_ID} .igp-btn:hover { background:#262626; color:#f0f0f0; }
      #${PANEL_ID} .igp-iconbtn {
        position:absolute; top:10px; background:transparent; border:none; color:#9aa0a6;
        cursor:pointer; padding:4px; border-radius:8px; transition:background .15s ease, color .15s ease;
      }
      #${PANEL_ID} #igp-refresh { right:40px; }
      #${PANEL_ID} #igp-close { right:10px; }
      #${PANEL_ID} .igp-iconbtn:hover { background:#1f1f1f; color:#c7c7c7; }

      #${PANEL_ID} .igp-card { border:1px solid #2a2a2a; border-radius:10px; padding:10px; background:#131313; }
      #${PANEL_ID} .igp-card.hoverable { cursor:pointer; transition: background .15s ease, color .15s ease; }
      #${PANEL_ID} .igp-card.hoverable:hover { background:#1a1a1a; color:#f0f0f0; }
      #${PANEL_ID} .igp-subtle { color:#bdbdbd; font-size:12px; }

      .igp-last { color:#9aa0a6; font-size:11px; margin: -6px 0 8px; display:none; }

      /* Segmented control */
      #${PANEL_ID} .igp-segwrap{ display:flex; align-items:center; gap:8px; margin-left:auto; }
      #${PANEL_ID} .igp-seggrp { display: inline-flex; background: #171717; border: 1px solid #2a2a2a; border-radius: 10px; overflow: hidden; width: 133px; }
      #${PANEL_ID} .igp-seg{ padding:6px 10.2px; font-size:12px; color:#cfcfcf; cursor:pointer; border-right:1px solid #2a2a2a; user-select:none; transition: background .15s ease, color .15s ease; }
      #${PANEL_ID} .igp-seg:last-child{ border-right:none; }
      #${PANEL_ID} .igp-seg:hover{ background:#242424; color:#fff; }
      #${PANEL_ID} .igp-seg.active{ background:#2a2a2a; color:#fff; }

      /* Spinner animasyonu */
      #${PANEL_ID} .igp-spin { color:#9aa0a6; }
      #${PANEL_ID} .igp-spin { animation: igp-rot 1s linear infinite; }
      @keyframes igp-rot { from {transform:rotate(0)} to {transform:rotate(360deg)} }

      /* Kapatırken minimize animasyonu */
      #${PANEL_ID} .minimizing { transform: translate(10px,-10px) scale(.90); opacity:.0; }
      #${PANEL_ID} .popping   { transform: translate(10px,-10px) scale(.90); opacity:0; }
      #${PANEL_ID} .popping.show { transform:none; opacity:1; }
    </style>

    <!-- Üst sağ: Refresh + Close -->
    <button id="igp-refresh" class="igp-iconbtn" aria-label="Yenile" title="Yenile">${Icons.Refresh}</button>
    <button id="igp-close"   class="igp-iconbtn" aria-label="Kapat"  title="Kapat">${Icons.Close}</button>

    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:13px">
      <div style="display:flex; align-items:center; gap:8px; font-weight:800; font-size:14px">
        ${Icons.Logo}
        <span>StatsBase</span>
      </div>
    </div>

    <div id="igp-last" class="igp-last"></div>

    <div style="display:flex;gap:10px;align-items:center;margin-bottom:10px">
      <button id="igp-run" class="igp-btn"><span>Analiz et</span></button>

      <div class="igp-segwrap" title="Analizde kaç içerik taransın">
        <div class="igp-seggrp" id="igp-seggrp" role="group" aria-label="İçerik sayısı">
          <div class="igp-seg" data-val="6"  role="button" tabindex="0" aria-pressed="false">6</div>
          <div class="igp-seg" data-val="12" role="button" tabindex="0" aria-pressed="false">12</div>
          <div class="igp-seg" data-val="18" role="button" tabindex="0" aria-pressed="false">18</div>
          <div class="igp-seg" data-val="24" role="button" tabindex="0" aria-pressed="false">24</div>
        </div>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
      <div class="igp-card">
        <div class="igp-subtle">Takipçi</div><b id="igp-followers">-</b>
      </div>
      <div class="igp-card">
        <div class="igp-subtle">Sayı</div><b id="igp-sample-out">-</b>
      </div>

      <div class="igp-card">
        <div class="igp-subtle">Ort. Beğeni</div><b id="igp-avg-like">-</b>
      </div>
      <div class="igp-card hoverable" id="igp-eng-card" title="Tıklayınca panoya kopyalanır">
        <div class="igp-subtle">Etkileşim Oranı</div><b id="igp-eng">-</b>
      </div>
    </div>

    <div id="igp-status" style="display:none;"></div>
  </div>`;

  document.documentElement.appendChild(el);

  // Eventler
  el.querySelector('#igp-close').onclick   = () => minimizeToFab();
  el.querySelector('#igp-refresh').onclick = () => refreshPanel();

  const runBtn = el.querySelector('#igp-run');
  runBtn.onclick = () => {
    if (isRunning) {
      stopRequested = true;
    } else {
      run();
    }
  };

  el.querySelector('#igp-eng-card').onclick = () => {
    const v = document.getElementById('igp-eng')?.textContent || '';
    navigator.clipboard?.writeText(v).then(() => toast('Veri kopyalandı'));
  };

  // Segmented control + seçimi hatırla
  const segGrp = el.querySelector('#igp-seggrp');
  const segBtns = [...segGrp.querySelectorAll('.igp-seg')];

  const setActive = (val) => {
    segBtns.forEach(b=>{
      const isActive = String(b.dataset.val) === String(val);
      b.classList.toggle('active', isActive);
      b.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
    localStorage.setItem('igp-sample', String(val));
  };

  const savedPresetValue = parseInt(localStorage.getItem('igp-sample') || '12', 10);
  setActive(Number.isFinite(savedPresetValue) ? savedPresetValue : 12);

  segBtns.forEach(b=>{
    b.addEventListener('click', ()=>{
      const v = parseInt(b.dataset.val, 10);
      if (isFinite(v)) setActive(v);
    });
    b.addEventListener('keydown', (e)=>{
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); b.click(); }
    });
  });

  // Panel görünürken FAB gizle
  showFab(false);

  // Panel açılır açılmaz mevcut profil için önbellek varsa yükle
  preloadFromCache();

  // Link sayısını bilgi amaçlı güncelle
  try{
    const links = collectLinks();
    setText('igp-link-count', links.length);
  }catch(_){}

  return el;
}

function openPanelFromFab(){
  const el = ensurePanel();
  const wrap = el.querySelector('.igp-wrap');
  wrap.classList.add('popping');
  el.style.display = 'block';
  requestAnimationFrame(()=>{
    wrap.classList.add('show');
    setTimeout(()=>{ wrap.classList.remove('popping','show'); }, 200);
  });
  showFab(false);
}

function minimizeToFab(){
  const el = document.getElementById(PANEL_ID);
  if (!el) { showFab(true); return; }
  const wrap = el.querySelector('.igp-wrap');
  wrap.classList.add('minimizing');
  setTimeout(()=>{
    el.style.display = 'none';
    wrap.classList.remove('minimizing');
    showFab(true);
  }, 180);
}

function setStatus(t) { const s = document.getElementById('igp-status'); if (s) s.textContent = t; }
function setText(id, val) { const e = document.getElementById(id); if (e) e.textContent = val; }

function getFollowerCount() {
  const meta = document.querySelector('meta[property="og:description"]')
    || document.querySelector('meta[name="description"]');
  if (meta?.content) {
    const m = meta.content.match(/([\d\.\,KMkm]+)\s*(followers|takipçi)/);
    if (m) {
      const n = numberFromText(m[1]);
      if (n) return n;
    }
  }
  const link = document.querySelector('a[href$="/followers/"]');
  if (link) {
    const candidates = [
      link.getAttribute('title'),
      link.textContent,
      ...[...link.querySelectorAll('span,div,strong')].map(n =>
        (n.getAttribute?.('title') || n.textContent))
    ].filter(Boolean);
    for (const t of candidates) {
      const n = numberFromText(t);
      if (n) return n;
    }
  }
  const label = [...document.querySelectorAll('li, a, span, div')]
    .find(n => /takipçi|followers/i.test(n.textContent || ''));
  if (label) {
    const host = label.closest('li') || label.parentElement;
    const pieces = host ? [...host.querySelectorAll('span,div,strong')] : [];
    const joined = pieces.map(n => n.textContent.trim()).join(' ');
    let n = numberFromText(joined);
    if (n) return n;
    for (const p of pieces) {
      n = numberFromText(p.getAttribute?.('title') || p.textContent);
      if (n) return n;
    }
  }
  return null;
}

function trNormalize(s){
  if (!s) return '';
  s = s.toLocaleLowerCase('tr');
  s = s.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
  s = s
    .replace(/ı/g,'i').replace(/ş/g,'s').replace(/ğ/g,'g')
    .replace(/ç/g,'c').replace(/ö/g,'o').replace(/ü/g,'u')
    .replace(/İ/g,'i');
  return s.replace(/\s+/g,' ').trim();
}

// --- İşbirliği tespiti (pozitif/negatif kalıplar) ---
const COLLAB_NEG_PATTERNS = [
  /reklam (degil|degildir)/,
  /reklam yoktur/,
  /sponsorl(u|u) degil/,
  /is ?birligi degil/,
  /\bno ?ad\b|\bnotsponsored\b/,
  /marka gorundugu icin reklam/,
];

const COLLAB_POS_PATTERNS = [
  /\bis ?birligi\b|#isbirligi/,
  /\bsponsor(luk)?\b|#sponsor/,
  /\breklam\b|#reklam/,
  /\bad\b|\badvert(orial)?\b|\bsponsored\b/,
  /paid partnership( with)?/,
  /\bpr ?gonderisi\b|\bprgonderisi\b/,
  /\bdavet\b|\bhediye urun\b|\bgifted\b/,
  /\bpress trip\b/
];

// Modal içinden caption metnini topla
function extractCaptionText(root){
  if (!root) return '';
  const containers = root.querySelectorAll('h1, h2, h3, p, span, div');
  let text = '';
  let count = 0;
  for (const n of containers){
    if (++count > 200) break;
    const t = (n.innerText || n.textContent || '').trim();
    if (t && t.length >= 3) text += ' ' + t;
  }
  return text.trim().slice(0, 4000);
}

function isCollabText(text){
  const norm = trNormalize(text);
  if (!norm) return false;
  if (COLLAB_NEG_PATTERNS.some(rx => rx.test(norm))) return false;
  return COLLAB_POS_PATTERNS.some(rx => rx.test(norm));
}

// --- işbirliği rozet CSS'ini bir kere enjekte et ---
function injectCollabStyles(){
  if (document.getElementById('__igp_collab_css__')) return;
  const st = document.createElement('style');
  st.id = '__igp_collab_css__';
  st.textContent = `
    .igp-collab-badge{
      position:absolute; top:6px; left:6px;
      width:24px; height:24px; display:flex; align-items:center; justify-content:center;
      background:rgba(0,0,0,.55); border:1px solid rgba(255,255,255,.18);
      backdrop-filter: blur(2px); -webkit-backdrop-filter: blur(2px);
      border-radius:8px; z-index:2; pointer-events:none;
    }
    .igp-collab-badge svg{ width:18px; height:18px; color:#fff; display:block; }
  `;
  document.head.appendChild(st);
}
injectCollabStyles();

// --- işbirliği SVG simgesi (el sıkışma - verilen dosyaya uygun) ---
const COLLAB_BADGE_SVG = `
<svg width="20" height="20" viewBox="0 -8 72 72" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <path fill="#ffffff" d="M64,12.78v17s-3.63.71-4.38.81-3.08.85-4.78-.78C52.22,27.25,42.93,18,42.93,18a3.54,3.54,0,0,0-4.18-.21c-2.36,1.24-5.87,3.07-7.33,3.78a3.37,3.37,0,0,1-5.06-2.64,3.44,3.44,0,0,1,2.1-3c3.33-2,10.36-6,13.29-7.52,1.78-1,3.06-1,5.51,1C50.27,12,53,14.27,53,14.27a2.75,2.75,0,0,0,2.26.43C58.63,14,64,12.78,64,12.78ZM27,41.5a3,3,0,0,0-3.55-4.09,3.07,3.07,0,0,0-.64-3,3.13,3.13,0,0,0-3-.75,3.07,3.07,0,0,0-.65-3,3.38,3.38,0,0,0-4.72.13c-1.38,1.32-2.27,3.72-1,5.14s2.64.55,3.72.3c-.3,1.07-1.2,2.07-.09,3.47s2.64.55,3.72.3c-.3,1.07-1.16,2.16-.1,3.46s2.84.61,4,.25c-.45,1.15-1.41,2.39-.18,3.79s4.08.75,5.47-.58a3.32,3.32,0,0,0,.3-4.68A3.18,3.18,0,0,0,27,41.5Zm25.35-8.82L41.62,22a3.53,3.53,0,0,0-3.77-.68c-1.5.66-3.43,1.56-4.89,2.24a8.15,8.15,0,0,1-3.29,1.1,5.59,5.59,0,0,1-3-10.34C29,12.73,34.09,10,34.09,10a6.46,6.46,0,0,0-5-2C25.67,8,18.51,12.7,18.51,12.7a5.61,5.61,0,0,1-4.93.13L8,10.89v19.4s1.59.46,3,1a6.33,6.33,0,0,1,1.56-2.47,6.17,6.17,0,0,1,8.48-.06,5.4,5.4,0,0,1,1.34,2.37,5.49,5.49,0,0,1,2.29,1.4A5.4,5.4,0,0,1,26,34.94a5.47,5.47,0,0,1,3.71,4,5.38,5.38,0,0,1,2.39,1.43,5.65,5.65,0,0,1,1.48,4.89,0,0,0,0,1,0,0s.8.9,1.29,1.39a2.46,2.46,0,0,0,3.48-3.48s2,2.48,4.28,1c2-1.4,1.69-3.06.74-4a3.19,3.19,0,0,0,4.77.13,2.45,2.45,0,0,0,.13-3.3s1.33,1.81,4,.12c1.89-1.6,1-3.43,0-4.39Z"/>
</svg>`;

// anchor üstüne rozet ekle/sil
function attachCollabBadge(anchor){
  if (!anchor) return;
  if (getComputedStyle(anchor).position === 'static' || !anchor.style.position) {
    anchor.style.position = 'relative';
  }
  let b = anchor.querySelector('.igp-collab-badge');
  if (!b){
    b = document.createElement('div');
    b.className = 'igp-collab-badge';
    b.innerHTML = COLLAB_BADGE_SVG;
    anchor.appendChild(b);
  }
}
function removeCollabBadge(anchor){
  const b = anchor?.querySelector?.('.igp-collab-badge');
  if (b) b.remove();
}

// Cache’teki collab rozetlerini uygula
function applyCachedCollabBadges(){
  const u = getUsername();
  if (!u) return;
  const raw = localStorage.getItem(`igp-data:${u}`);
  if (!raw) return;

  try{
    const { collabMap } = JSON.parse(raw) || {};
    if (!collabMap || typeof collabMap !== 'object') return;

    const tryApply = (attempt=0) => {
      const anchors = [...document.querySelectorAll('a[href*="/p/"], a[href*="/reel/"]')];
      let applied = 0;

      for (const a of anchors){
        const url = (a.href || a.getAttribute('href') || '').split('?')[0];
        if (!url) continue;
        if (collabMap[url] === true) {
          attachCollabBadge(a);
          applied++;
        } else if (collabMap[url] === false) {
          removeCollabBadge(a);
        }
      }

      if (attempt < 5 && applied < Object.values(collabMap).filter(Boolean).length){
        setTimeout(()=>tryApply(attempt+1), 500);
      }
    };
    tryApply(0);
  }catch(_){}
}

// Sadece profil gridindeki linkleri al, panel ve modal hariç
function collectLinks() {
  const scope = document.querySelector('main') || document;
  const as = [...scope.querySelectorAll(
    `a[href*="/p/"]:not(#${PANEL_ID} *):not(div[role="dialog"] *),
     a[href*="/reel/"]:not(#${PANEL_ID} *):not(div[role="dialog"] *)`
  )];
  const hrefs = as.map(a => (a.href || a.getAttribute('href') || '').split('?')[0])
    .filter(u => /\/(p|reel)\/[^/]+\/?$/.test(u));
  return [...new Set(hrefs)];
}

async function hardCloseAllModals() {
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  await sleep(100);
  [...document.querySelectorAll('div[role="dialog"] button, article[role="presentation"] button')]
    .filter(b => /kapat|close/i.test(b.getAttribute('aria-label') || b.textContent || ''))
    .forEach(b => b.click());
  [...document.querySelectorAll('div[role="dialog"], article[role="presentation"]')].forEach(n => n.remove());
  await sleep(150);
}

function readLikesAndCollabFromModal() {
  const root = document.querySelector('div[role="dialog"]') || document.querySelector('article[role="presentation"]');
  if (!root) return { like:null, collab:false };

  // 1) Like
  let like = null;
  const likeLink = root.querySelector('a[href*="/liked_by/"]');
  if (likeLink) {
    const span = likeLink.querySelector('span');
    like = numberFromText(span?.textContent || likeLink.textContent) ?? null;
  }
  if (like == null){
    const bad = /(sn|s|dk|m|saat|h|gün|g|day|d|hafta|w|yorum|comment|kaydet|save)/i;
    const candidates = [...root.querySelectorAll('section span, div span')]
      .filter(s => s.textContent && !bad.test(s.textContent))
      .map(s => numberFromText(s.textContent))
      .filter(n => n && n > 0);
    like = candidates.length ? Math.max(...candidates) : null;
  }

  // 2) Caption -> işbirliği
  const caption = extractCaptionText(root);
  const collab  = isCollabText(caption) === true;

  return { like, collab };
}

async function openPostAndRead(url) {
  const a = [...document.querySelectorAll('a[href*="/p/"], a[href*="/reel/"]')]
    .find(x => (x.href || x.getAttribute('href') || '').startsWith(url));
  if (a) { a.click(); } else { window.open(url, "_blank"); }

  for (let i = 0; i < 40; i++) {
    if (document.querySelector('div[role="dialog"], article[role="presentation"]')) break;
    await sleep(150);
  }
  await sleep(800);

  let like = null, collab = false;
  for (let t = 0; t < 8; t++) {
    const res = readLikesAndCollabFromModal();
    like = res.like;
    collab = res.collab;
    if (like != null || collab) break;
    await sleep(250);
  }

  await hardCloseAllModals();
  await sleep(200);

  // Thumbnail’e rozet uygula (anlık)
  if (a) {
    if (collab) attachCollabBadge(a);
    else removeCollabBadge(a);
  }

  return { like, collab };
}

// --- RUN ---
async function run() {
  ensurePanel();

  // butonu "Durdur" + spinner yap
  const runBtn = document.getElementById('igp-run');
  const runBtnLabel = () => {
    runBtn.innerHTML = '';
    const wrap = document.createElement('span');
    if (isRunning) {
      wrap.style.display='inline-flex';
      wrap.style.alignItems='center';
      wrap.style.gap='8px';
      wrap.innerHTML = Icons.Spinner + '<span>Durdur</span>';
    } else {
      wrap.textContent = 'Analiz et';
    }
    runBtn.appendChild(wrap);
  };

  isRunning = true;
  stopRequested = false;
  runBtnLabel();

  await hardCloseAllModals();

  const links = collectLinks();
  setText('igp-link-count', links.length);

  const followers = getFollowerCount();
  setText('igp-followers', followers ? human(followers) : '-');

  const activeSeg = document.querySelector(`#${PANEL_ID} .igp-seg.active`);
  let sample = parseInt(activeSeg?.dataset.val || localStorage.getItem('igp-sample') || '12', 10);
  if (!isFinite(sample) || sample < 1) sample = 1;

  const pick = links.slice(0, sample);

  let processed = 0;
  setText('igp-sample-out', processed);

  const likes = [];
  const collabMap = {}; // url -> true/false
  let errors = 0;

  for (let i = 0; i < pick.length; i++) {
    if (stopRequested) break;
    try {
      const { like, collab } = await openPostAndRead(pick[i]);
      if (like != null) likes.push(like);
      collabMap[pick[i]] = !!collab;
    } catch (e) {
      errors++;
    }
    processed++;
    setText('igp-sample-out', processed);
  }

  const avg = arr => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : null;
  const avgLikes = avg(likes);
  setText('igp-avg-like', human(avgLikes));

  let er = null;
  if (followers && avgLikes != null) er = (avgLikes / followers) * 100;
  const erText = er == null
    ? '-'
    : new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(er) + '%';
  setText('igp-eng', erText);

  setStatus(stopRequested ? `Durduruldu • ${processed}/${pick.length}` : `Hazır${errors ? ` • ${errors} hata` : ''}`);

  // PROFİL VERİSİNİ SAKLA + TARİHÇEYE EKLE
  try {
    const username = getUsername();
    const payload = {
      username,
      url: location.href,
      ts: Date.now(),
      followers,
      sampleRequested: sample,
      processed,
      likes,
      avgLikes,
      er: er ?? null,
      erText,
      collabMap
    };
    if (username) saveProfileData(username, payload);

    const last = document.getElementById('igp-last');
    if (last){
      last.style.display = 'block';
      last.textContent = `Son güncelleme: az önce`;
    }
  } catch(e){ /* sessiz geç */ }

  isRunning = false;
  runBtnLabel();
}

// URL/profil değişimlerini izle (SPA) — analiz veya modal açıkken refresh tetikleme!
let __lastProfile = null;
function isModalOpen(){
  return !!document.querySelector('div[role="dialog"], article[role="presentation"]');
}
function watchProfileChange(){
  __lastProfile = getUsername() || null;
  setInterval(()=>{
    // Analiz sırasında veya modal açıkken değişiklikleri yok say
    if (isRunning || isModalOpen()) return;

    const u = getUsername() || null;
    if (u !== __lastProfile){
      __lastProfile = u;
      if (u){
        const el = ensurePanel();
        el.style.display = 'block';
        showFab(false);
        refreshPanel();           // otomatik tazele
        applyCachedCollabBadges();// rozetleri uygula
      } else {
        const el = document.getElementById(PANEL_ID);
        if (el) el.style.display = 'none';
        showFab(true);
      }
    }
  }, 800);
}

function openPanelFromFab(){
  const el = ensurePanel();
  const wrap = el.querySelector('.igp-wrap');
  wrap.classList.add('popping');
  el.style.display = 'block';
  requestAnimationFrame(()=>{
    wrap.classList.add('show');
    setTimeout(()=>{ wrap.classList.remove('popping','show'); }, 200);
  });
  showFab(false);
}

function minimizeToFab(){
  const el = document.getElementById(PANEL_ID);
  if (!el) { showFab(true); return; }
  const wrap = el.querySelector('.igp-wrap');
  wrap.classList.add('minimizing');
  setTimeout(()=>{
    el.style.display = 'none';
    wrap.classList.remove('minimizing');
    showFab(true);
  }, 180);
}

// Otomatik başlatma — profil sayfasında panel, diğer sayfalarda FAB
(function () {
  ensureFab();

  if (getUsername()) {
    const el = ensurePanel();
    el.style.display = 'block';
    showFab(false);
    refreshPanel();            // ilk yükte tazele
    applyCachedCollabBadges(); // cache rozetlerini uygula
  } else {
    const el = document.getElementById(PANEL_ID);
    if (el) el.style.display = 'none';
    showFab(true);
  }

  watchProfileChange();
})();
