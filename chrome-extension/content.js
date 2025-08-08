/* StatBase v0.2.0 – IG web API ile veri çekme (stabil)
 * - Profil sayfasını algılar
 * - web_profile_info endpoint'inden son 12 gönderi + sayıları alır
 * - Pinli içerikleri eler, ortalamaları hesaplar, ER üretir
 * - Paneli günceller
 */

(function () {
  const STATE = { running: false };

  // ---------- Yardımcılar ----------
  function isProfilePage() {
    const path = location.pathname.split("?")[0].split("#")[0];
    const parts = path.split("/").filter(Boolean);
    if (parts.length === 1) {
      const blocked = new Set([
        "explore","reels","direct","accounts","p","tv","stories",
        "about","developer","web","ads","directory"
      ]);
      return !blocked.has(parts[0]);
    }
    return false;
  }

  function ensurePanel() {
    let panel = document.getElementById("statbase-panel");
    if (!panel) {
      panel = document.createElement("div");
      panel.id = "statbase-panel";
      panel.innerHTML = `
        <div class="sb-title">StatBase · Instagram</div>
        <div class="sb-meta">@<span id="sb-username">?</span></div>
        <hr class="sb-hr"/>
        <div class="sb-row"><div>Takipçi</div><div class="sb-badge" id="sb-followers">-</div></div>
        <div class="sb-row"><div>Takip</div><div class="sb-badge" id="sb-following">-</div></div>
        <div class="sb-row"><div>Gönderi</div><div class="sb-badge" id="sb-posts">-</div></div>
        <hr class="sb-hr"/>
        <div class="sb-row"><div>Analiz Edilen Post</div><div class="sb-badge" id="sb-analyzed">0/12</div></div>
        <div class="sb-row"><div>Ortalama Beğeni</div><div class="sb-badge" id="sb-like-avg">-</div></div>
        <div class="sb-row"><div>Ortalama Yorum</div><div class="sb-badge" id="sb-comment-avg">-</div></div>
        <div class="sb-row"><div><b>Ortalama ER</b></div><div class="sb-badge" id="sb-er">-</div></div>
        <div class="sb-loading" id="sb-loading">Yükleniyor…</div>
        <div class="sb-err" id="sb-error"></div>
        <hr class="sb-hr"/>
        <div class="sb-footer"><span>son 12 gönderi (pinli hariç)</span></div>
      `;
      document.documentElement.appendChild(panel);
    }
    return panel;
  }

  function setText(id, val) { const el = document.getElementById(id); if (el) el.textContent = val; }
  function fmt(n) { return isFinite(n) ? n.toLocaleString("tr-TR") : "-"; }
  function usernameFromUrl() {
    const p = location.pathname.split("?")[0].split("#")[0].split("/").filter(Boolean);
    return p[0] || "";
  }
  function showError(msg) { setText("sb-error", msg || ""); }

  // ---------- IG Web API ----------
  async function fetchIgProfile(username) {
    // IG web app id – web_profile_info için gerekli
    const APP_ID = "936619743392459";
    const url = `https://www.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(username)}`;

    const res = await fetch(url, {
      credentials: "include",
      headers: { "X-IG-App-ID": APP_ID }
    });

    if (!res.ok) {
      throw new Error(`web_profile_info failed: ${res.status}`);
    }
    const j = await res.json();
    const user = j?.data?.user;
    if (!user) throw new Error("user not found");

    // Profil sayıları
    const followers = user.edge_followed_by?.count ?? 0;
    const following = user.edge_follow?.count ?? 0;
    const postsCount = user.edge_owner_to_timeline_media?.count ?? 0;

    // Son 12 gönderi – pinlileri ele
    const edges = (user.edge_owner_to_timeline_media?.edges ?? [])
      .filter(e => !e?.node?.is_pinned)
      .slice(0, 12);

    let ok = 0, likeSum = 0, comSum = 0;
    for (const e of edges) {
      const n = e.node || {};
      const likes = n.edge_media_preview_like?.count ?? 0;
      const comments = n.edge_media_to_comment?.count ?? 0;
      if (likes + comments > 0) {
        ok++; likeSum += likes; comSum += comments;
      }
    }

    const likeAvg = ok ? Math.round(likeSum / ok) : 0;
    const comAvg  = ok ? Math.round(comSum / ok)  : 0;
    const erPct   = (ok && followers) ? (((likeSum + comSum) / ok) / followers * 100) : 0;

    return {
      followers, following, postsCount,
      analyzed: ok, likeAvg, comAvg, erPct: Number(erPct.toFixed(2))
    };
  }

  // ---------- Akış ----------
  async function run() {
    if (STATE.running) return;
    STATE.running = true;

    ensurePanel();
    setText("sb-error", "");
    setText("sb-loading", "Yükleniyor…");

    try {
      const uname = usernameFromUrl();
      setText("sb-username", uname);

      // IG Web API'den çek
      const stats = await fetchIgProfile(uname);

      // Paneli doldur
      setText("sb-followers", fmt(stats.followers));
      setText("sb-following", fmt(stats.following));
      setText("sb-posts", fmt(stats.postsCount));
      setText("sb-analyzed", `${stats.analyzed}/12`);
      setText("sb-like-avg", stats.analyzed ? fmt(stats.likeAvg) : "-");
      setText("sb-comment-avg", stats.analyzed ? fmt(stats.comAvg) : "-");
      setText("sb-er", stats.analyzed ? `${stats.erPct}%` : "-");
      setText("sb-loading", "");

      if (!stats.analyzed) {
        showError("Gönderi verisi bulunamadı (pinli/yorum kapalı olabilir).");
      }
    } catch (e) {
      console.warn("StatBase error:", e);
      showError("Veri alınamadı. Instagram oturum açık mı? (Sayfayı yenileyip tekrar deneyin.)");
      setText("sb-loading", "");
    } finally {
      STATE.running = false;
    }
  }

  function bootWhenReady() {
    if (!isProfilePage()) return;
    ensurePanel();
    setTimeout(run, 800);
  }

  // İlk yük
  bootWhenReady();

  // SPA geçişleri
  let lastPath = location.pathname;
  const ob = new MutationObserver(() => {
    if (location.pathname !== lastPath) {
      lastPath = location.pathname;
      document.getElementById("statbase-panel")?.remove();
      bootWhenReady();
    }
  });
  ob.observe(document.documentElement, { childList: true, subtree: true });
})();
