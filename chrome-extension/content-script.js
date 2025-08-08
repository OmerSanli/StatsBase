function parseCount(text) {
  if (!text) return 0;
  const normalized = text.replace(/,/g, '').toLowerCase();
  const match = normalized.match(/([0-9.]+)([km]?)/);
  if (!match) return 0;
  let value = parseFloat(match[1]);
  const suffix = match[2];
  if (suffix === 'k') value *= 1000;
  if (suffix === 'm') value *= 1000000;
  return value;
}

function showEngagement() {
  if (!/^\/[^\/]+\/$/.test(window.location.pathname)) return;
  const counts = document.querySelectorAll('header li span span');
  if (counts.length < 2) return;
  const posts = parseCount(counts[0].textContent);
  const followers = parseCount(counts[1].textContent);
  if (!posts || !followers) return;
  const engagement = ((posts / followers) * 100).toFixed(2);

  const badge = document.createElement('div');
  badge.textContent = `Interaction Rate: ${engagement}%`;
  badge.style.position = 'fixed';
  badge.style.bottom = '10px';
  badge.style.right = '10px';
  badge.style.padding = '6px 10px';
  badge.style.background = 'rgba(0,0,0,0.7)';
  badge.style.color = '#fff';
  badge.style.fontSize = '14px';
  badge.style.zIndex = '9999';
  document.body.appendChild(badge);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', showEngagement);
} else {
  showEngagement();
}
