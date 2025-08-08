/* StatBase v0.1 – Instagram MVP
 * Özellikler:
 * - Profil sayfası algılama
 * - Takipçi/Takip/Gönderi sayıları
 * - Grid’den son 12 gerçek gönderi URL’si (pinli olanları atla)
 * - Her post sayfasını fetch edip like/comment çekme (JSON-LD üzerinden)
 * - Ortalama ER = (avg(like+comment) / followers) * 100
 * Not: Instagram DOM sık değişir; bu MVP pratik ve sade bir yaklaşım kullanır.
 */

(function () {
  const STATE = {
    running: false
  };

  // Sayfa Instagram profil sayfası mı?
  function isProfilePage() {
    const path = location.pathname.split("?")[0].split("#")[0];
    // /username/ veya /username
    const parts = path.split("/").filter(Boolean);
    // Örn: ["username"] veya ["username", ""]
    if (parts.length === 1) {
      // Özel path’leri ele
      const blocked = new Set(["explore","reels","direct","accounts","p","tv","stories","about","developer","web","ads","directory"]);
      return !blocked.has(parts[0]);
    }
    return false;
  }

  // Panel
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
        <div class="sb-row"><div>Analiz Edilen Post</div><div class="sb-badge" id="sb-analyzed">0</div></div>
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

  // Metin -> sayı (1.234, 1,234, 1.2k vb.)
  function parseCount(txt) {
    if (!txt) return 0;
    txt = ("" + txt).trim().toLowerCase();

    // 1.2k / 3,4k gibi
    const kMatch = txt.match(/^([\d\.,]+)\s*k$/i);
    const mMatch = txt.match(/^([\d\.,]+)\s*m$/i);
    if (kMatch) return Math.round(parseFloat(kMatch[1].replace(",", ".").replace(/\./g, ".")) * 1000);
    if (mMatch) return Math.round(parseFloat(mMatch[1].replace(",", ".").replace(/\./g, ".")) * 1000000);

    // 1.234 / 1,234 / 12 345
    const normalized = txt.replace(/\s/g, "").replace(/\.(?=\d{3}\b)/g, "").replace(/,(?=\d{3}\b)/g, "");
    const n = parseInt(normalized.replace(/\D/g, ""), 10);
    if (!isNaN(n)) return n;

    // Fallback
    const f = parseFloat(txt.replace(",", "."));
    return isNaN(f) ? 0 : Math.round(f);
  }

  // Header’dan kullanıcı adı
  function getUsername() {
    // URL’den al
    const path = location.pathname.split("?")[0].split("#")[0];
    const parts = path.split("/").filter(Boolean);
    return parts[0] || "";
  }

  // Header’dan takipçi/takip/gönderi (erişilebilir selector’lar)
  function readProfileHeader() {
    const followersEl = document.querySelector('a[href$="/followers/"] span[title], a[href$="/followers/"] span');
    const followingLink = document.querySelector('a[href$="/following/"]');
    const postsEl = document.querySelector('li span._ac2a, header section ul li span');

    let followers = 0, following = 0, posts = 0;

    if (followersEl) {
      followers = parseCount(followersEl.getAttribute("title") || followersEl.textContent);
    }

    // Following sayısı bazen <a> içinde düz metin olarak gelir
    if (followingLink) {
      const txt = followingLink.textContent || "";
      following = parseCount(txt);
    }

    // Post sayısı farklı span’larda olabilir; bulduğu ilk anlamlı sayıyı al
    if (postsEl) {
      const txt = postsEl.textContent || "";
      const n = parseCount(txt);
      if (n > 0) posts = n;
    }

    return { followers, following, posts };
  }

  // Grid’den son 12 gönderi linki (pinlileri atla)
  function readLastPostLinks(limit = 12) {
    const links = Array.from(document.querySelectorAll('a[href^="/p/"]'))
      .filter(a => {
        // Aynı link tekrarını önle
        return a.getAttribute("href").startsWith("/p/");
      });

    // Pinli olanları ele (tile içinde pin ikonlu svg olabilir)
    const filtered = [];
    const seen = new Set();

    for (const a of links) {
      const href = new URL(a.href);
      const key = href.pathname;
      if (seen.has(key)) continue;

      // Pin kontrol: a içinde aria-label="Pinned" svg ya da "Sabitlenmiş" olabiliyor
      const hasPinnedIcon = a.querySelector('svg[aria-label="Pinned"], svg[aria-label="Sabitlenmiş"]');
      if (hasPinnedIcon) continue;

      seen.add(key);
      filtered.push(href.toString());
      if (filtered.length >= limit) break;
    }
    return filtered;
  }

  // Post sayfasından like/comment çek (JSON-LD varsa)
  async function fetchPostStats(postUrl) {
    try {
      const res = await fetch(postUrl, { credentials: "include" });
      const html = await res.text();
      // JSON-LD ara
      const m = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
      if (m) {
        try {
          const json = JSON.parse(m[1]);
          // Instagram bazen array döndürebiliyor
          const data = Array.isArray(json) ? json[0] : json;

          let like = 0, comment = 0;

          // interactionStatistic -> userInteractionCount (like)
          if (data.interactionStatistic) {
            const arr = Array.isArray(data.interactionStatistic) ? data.interactionStatistic : [data.interactionStatistic];
            const likeItem = arr.find(x => (x.interactionType && (x.interactionType.endsWith("LikeAction") || x.interactionType === "http://schema.org/LikeAction")) || x.name === "Likes");
            if (likeItem && likeItem.userInteractionCount != null) like = parseCount(String(likeItem.userInteractionCount));
          }

          // commentCount
          if (data.commentCount != null) {
            comment = parseCount(String(data.commentCount));
          }

          // Fallback: meta etiketlerinden
          if (like === 0) {
            const metaLike = html.match(/"edge_media_preview_like":\{"count":(\d+)\}/) || html.match(/"edge_liked_by":\{"count":(\d+)\}/);
            if (metaLike) like = parseInt(metaLike[1], 10);
          }
          if (comment === 0) {
            const metaCom = html.match(/"edge_media_to_parent_comment":\{"count":(\d+)\}/);
            if (metaCom) comment = parseInt(metaCom[1], 10);
          }

          return { like, comment, ok: true };
        } catch (e) {
          // JSON parse hatası -> fallback dene
        }
      }

      // Her iki yöntem de başarısızsa
      return { like: 0, comment: 0, ok: false };
    } catch (e) {
      return { like: 0, comment: 0, ok: false };
    }
  }

  function formatNumber(n) {
    if (!isFinite(n)) return "-";
    return n.toLocaleString("tr-TR");
  }

  function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  function showError(msg) {
    setText("sb-error", msg || "");
  }

  // Ana akış
  async function run() {
    if (STATE.running) return;
    STATE.running = true;

    const panel = ensurePanel();
    setText("sb-error", "");
    setText("sb-loading", "Yükleniyor…");

    try {
      // username
      const username = getUsername();
      setText("sb-username", username);

      // profile counts
      const { followers, following, posts } = readProfileHeader();
      setText("sb-followers", formatNumber(followers));
      setText("sb-following", formatNumber(following));
      setText("sb-posts", formatNumber(posts));

      // last 12 post links (skip pinned)
      const postLinks = readLastPostLinks(12);

      let totalLike = 0, totalComment = 0, okCount = 0;
      for (let i = 0; i < postLinks.length; i++) {
        const { like, comment, ok } = await fetchPostStats(postLinks[i]);
        if (ok) {
          okCount++;
          totalLike += like;
          totalComment += comment;
        }
        setText("sb-analyzed", `${okCount}/${postLinks.length}`);
        setText("sb-like-avg", okCount ? formatNumber(Math.round(totalLike / okCount)) : "-");
        setText("sb-comment-avg", okCount ? formatNumber(Math.round(totalComment / okCount)) : "-");

        if (followers > 0 && okCount > 0) {
          const er = ((totalLike + totalComment) / okCount) / followers * 100;
          setText("sb-er", `${er.toFixed(2)}%`);
        }
      }

      if (okCount === 0) {
        showError("Gönderi verileri alınamadı. Biraz aşağı kaydırıp tekrar deneyin.");
      }
      setText("sb-loading", "");
    } catch (e) {
      showError("Beklenmeyen bir hata oluştu.");
      setText("sb-loading", "");
    } finally {
      STATE.running = false;
    }
  }

  // Profil sayfasını bekle (SPA yapısı için)
  function bootWhenReady() {
    if (!isProfilePage()) return;
    ensurePanel();
    // DOM yüklendikten kısa süre sonra çalış
    setTimeout(run, 1200);
  }

  // İlk yük
  bootWhenReady();

  // URL değişimlerini izle (Instagram SPA)
  let lastPath = location.pathname;
  const ob = new MutationObserver(() => {
    if (location.pathname !== lastPath) {
      lastPath = location.pathname;
      // Paneli temizle ve yeniden kur
      const old = document.getElementById("statbase-panel");
      if (old) old.remove();
      bootWhenReady();
    }
  });
  ob.observe(document.documentElement, { childList: true, subtree: true });
})();
