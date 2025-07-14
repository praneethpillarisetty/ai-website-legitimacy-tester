document.addEventListener('DOMContentLoaded', () => {
  const keyInput = document.getElementById('groq-key');
  const saveBtn = document.getElementById('save-btn');
  const status = document.getElementById('status');
  const clearBtn = document.getElementById('clear-cache-btn');
  const clearStatus = document.getElementById('clear-status');

  chrome.storage.local.get(['groqApiKey'], (data) => {
    if (data.groqApiKey) keyInput.value = data.groqApiKey;
  });

  saveBtn.onclick = () => {
    const key = keyInput.value.trim();
    if (!key.startsWith('sk-')) {
      status.textContent = "Invalid API key format!";
      status.style.color = "red";
      return;
    }
    chrome.storage.local.set({ groqApiKey: key }, () => {
      status.textContent = "API key saved!";
      status.style.color = "green";
    });
  };

  clearBtn.onclick = () => {
    chrome.storage.local.remove(['verdicts'], () => {
      clearStatus.textContent = "All stored verdicts cleared.";
      setTimeout(() => { clearStatus.textContent = ""; }, 2000);
    });
  };
});
