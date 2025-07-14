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
    <div style="display: flex; align-items: center; gap: 6px;">
      <span style="font-size: 1.4em;">${emotes[v]}</span>
      <span style="font-weight:bold; font-size: 0.9em; color:${colors[v]};">${v}</span>
      <span style="font-size:0.8em; color:#333;">${s}%</span>
    </div>
    <div style="font-size:0.8em; margin-top:2px; color:#444; max-width: 140px; word-wrap: break-word;">${r}</div>
    <button id="ai-retest-btn" style="margin-top:4px; font-size:0.7em; padding: 2px 6px;">Retest</button>
  `;
  badge.style = `
    position:fixed; top:20px; right:20px; z-index:10000; background:white; box-shadow:0 2px 8px rgba(0,0,0,0.15); 
    border-radius:8px; padding:10px 12px 8px 12px; max-width:160px; min-width:120px;
    border:1px solid ${colors[v]}; font-family:sans-serif; font-size: 12px;
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
