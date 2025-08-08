// Robust IG grid scraper (hover + focus + retry)
// Çalışma mantığı: her post <a> için scrollIntoView → mouseover/mouseenter/mousemove → focus
// 150ms bekle → overlay ul>li>span okumaya çalış → 3 kez retry.

(function () {
  const SLEEP = (ms) => new Promise(r => setTimeout(r, ms));

  // "292 B", "1,2 Mn", "429" → Number
  function parseCount(str) {
    if (!str) return null;
    let s = String(str).trim().toLowerCase();
    s = s.replace(/\u00A0/g, ' ');          // &nbsp;
    s = s.replace(/\./g, '');               // 1.234 → 1234 (TR)
    s = s.replace(',', '.');                // 1,2 → 1.2
    // Instagram TR kısaltmaları:
    // "B" ~ bin, "Mn" ~ milyon
    if (/\bmn\b/.test(s)) return Math.round(parseFloat(s) * 1_000_000);
    if (/\bb\b/.test(s)) return Math.round(parseFloat(s) * 1_000);
    // 241 b gibi boşluklu yazımlar:
    if (/\bmn/.test(s)) return Math.round(parseFloat(s) * 1_000_000);
    if (/\bb/.test(s)) return Math.round(parseFloat(s) * 1_000);
    // çıplak sayı
    const n = parseFloat(s.replace(/[^\d.]/g, ''));
    return Number.isFinite(n) ? Math.round(n) : null;
  }

  function isInViewport(el) {
    const r = el.getBoundingClientRect();
    if (!r || r.width === 0 || r.height === 0) return false;
    const vh = window.innerHeight || document.documentElement.clientHeight;
    const vw = window.innerWidth || document.documentElement.clientWidth;
    return r.top < vh && r.bottom > 0 && r.left < vw && r.right > 0;
  }

  function fireHover(el) {
    const opts = { bubbles: true, cancelable: true, view: window };
    el.dispatchEvent(new MouseEvent('mouseover', opts));
    el.dispatchEvent(new MouseEvent('mouseenter', opts));
    el.dispatchEvent(new MouseEvent('mousemove', opts));
    if (el.focus) el.focus({ preventScroll: true });
  }

  // Overlay içindeki ul>li>span sayıları
  function readOverlayCounts(anchor) {
    // IG markup sık değişiyor; ama grid kart içinde overlay <ul> var.
    // En güvenlisi: anchor içindeki görünür UL bul, içindeki tüm span sayılarını topla.
    const overlayUl = anchor.querySelector('ul');
    if (!overlayUl) return null;

    // görünür mü?
    const style = window.getComputedStyle(overlayUl);
    if (style && (style.visibility === 'hidden' || style.display === 'none' || parseFloat(style.opacity) < 0.05)) {
      // bazen UL var ama kapalı
      return null;
    }

    const spans = overlayUl.querySelectorAll('li span');
    if (!spans || spans.length === 0) return null;

    const texts = [...spans].map(s => s.textContent?.trim()).filter(Boolean);
    if (!texts.length) return null;

    // tipik sırayla (izlenme/beğeni, yorum) olabiliyor; ikisini de döndürelim
    const counts = texts.map(parseCount).filter(v => v !== null);
    if (!counts.length) return null;

    // En fazla 2 sayı bekleriz ama değişirse bozulmasın
    return {
      rawTexts: texts,
      counts,
      likeOrViews: counts[0] ?? null,
      comments: counts[1] ?? null
    };
  }

  async function hoverAndRead(anchor, retries = 3, delayMs = 160) {
    // görünür değilse merkeze getir
    if (!isInViewport(anchor)) {
      anchor.scrollIntoView({ block: 'center', inline: 'center', behavior: 'instant' });
      await SLEEP(120);
    }
    for (let i = 0; i < retries; i++) {
      fireHover(anchor);
      await SLEEP(delayMs);
      const res = readOverlayCounts(anchor);
      if (res) return res;
      // bazen IG overlay'i geç yüklüyor; bir daha deneriz
    }
    return null;
  }

  function findPostAnchors(limit = Infinity) {
    // Profil gridindeki gönderi linkleri: hem /p/ hem /reel/
    // IG dom'u sık değiştiği için geniş seçim yapıp filtrele.
    const anchors = [...document.querySelectorAll('a[href]')].filter(a => {
      const h = a.getAttribute('href') || '';
      // /p/xyz/ veya /reel/xyz/
      return /^\/(p|reel)\//.test(h);
    });
    // Aynı href birden fazla olabilir; unique’leyelim
    const seen = new Set();
    const uniq = [];
    for (const a of anchors) {
      const h = a.getAttribute('href');
      if (!seen.has(h)) {
        seen.add(h);
        uniq.push(a);
        if (uniq.length >= limit) break;
      }
    }
    return uniq;
  }

  async function scrapeGrid({ limit = 60, perPostRetries = 3 } = {}) {
    const anchors = findPostAnchors(limit);
    const results = [];
    let idx = 0;

    for (const a of anchors) {
      idx++;
      const href = a.getAttribute('href');
      try {
        const data = await hoverAndRead(a, perPostRetries);
        results.push({
          index: idx,
          url: location.origin + href,
          success: Boolean(data),
          likeOrViews: data?.likeOrViews ?? null,
          comments: data?.comments ?? null,
          rawTexts: data?.rawTexts ?? null
        });
      } catch (e) {
        results.push({
          index: idx,
          url: location.origin + href,
          success: false,
          error: String(e)
        });
      }
      // Hover state’i sıfırlamak için body’e mousemove
      document.body.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, cancelable: true, view: window, clientX: 0, clientY: 0 }));
      await SLEEP(60);
    }
    return results;
  }

  // Konsoldan çağırmak için:
  window.igScrapeGrid = async (opts) => {
    const out = await scrapeGrid(opts || {});
    console.table(out.map(({ index, url, likeOrViews, comments, success }) => ({ index, url, likeOrViews, comments, success })));
    return out;
  };

  // Extension’dan tetiklemek için:
  if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
    chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
      if (msg?.cmd === 'scrape') {
        (async () => {
          try {
            const data = await scrapeGrid(msg?.options || {});
            sendResponse({ ok: true, data });
          } catch (err) {
            sendResponse({ ok: false, error: String(err) });
          }
        })();
        return true; // async response
      }
    });
  }
})();
