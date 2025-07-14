function showBadge(verdictObj) {
  let existing = document.getElementById('ai-site-legit-badge');
  if (existing) existing.remove();

  const badge = document.createElement('div');
  badge.id = 'ai-site-legit-badge';

  const v = verdictObj?.verdict || "UNKNOWN";
  const s = verdictObj?.score || 0;
  const r = verdictObj?.reason || "";
  const emotes = {
    SAFE: "🟢✅",
    SUSPICIOUS: "🟡⚠️",
    DANGEROUS: "🔴❌",
    UNKNOWN: "⚪❓"
  };
  const colors = {
    SAFE: "#21b321",
    SUSPICIOUS: "#ffd900",
    DANGEROUS: "#ff4848",
    UNKNOWN: "#bbb"
  };

  badge.innerHTML = `
    <div style="display: flex; align-items: center; gap: 10px;">
      <span style="font-size: 2em;">${emotes[v]}</span>
      <span style="font-weight:bold; font-size: 1.1em; color:${colors[v]};">${v}</span>
      <span style="font-size:0.9em; color:#333;">${s}%</span>
    </div>
    <div style="font-size:0.95em; margin-top:2px; color:#444">${r}</div>
    <button id="ai-retest-btn" style="margin-top:6px; font-size:0.8em;">Retest</button>
  `;
  badge.style = `
    position:fixed; top:20px; right:20px; z-index:10000; background:white; box-shadow:0 2px 10px #0002; 
    border-radius:12px; padding:16px 18px 10px 18px; min-width:190px;
    border:2px solid ${colors[v]}; font-family:sans-serif;
  `;
  document.body.appendChild(badge);

  document.getElementById('ai-retest-btn').onclick = () => {
    badge.innerHTML = "Retesting...";
    checkAndShow(true);
  };
}

function checkAndShow(force=false) {
  const hostname = window.location.hostname;
  const pageText = document.body.innerText || '';
  chrome.runtime.sendMessage(
    { action: 'checkLegitimacy', hostname, pageText, force }, 
    (resp) => {
      if (resp && resp.verdict) showBadge(resp.verdict);
      else showBadge({ verdict: "UNKNOWN", score: 0, reason: resp?.error || "No verdict available." });
    }
  );
}

(function initialCheck() {
  const hostname = window.location.hostname;
  chrome.runtime.sendMessage({ action: 'getVerdict', hostname }, (resp) => {
    const v = resp.verdict;
    if (!v) return checkAndShow(false);
    const isExpired = (Date.now() - v.ts) > (24 * 60 * 60 * 1000);
    if (isExpired) return checkAndShow(false);
    showBadge(v);
  });
})();

window.addEventListener('submit', function(e) {
  setTimeout(() => checkAndShow(true), 500);
}, true);
