const API_PROVIDERS = {
  groq: {
    name: 'Groq AI',
    keyPrefix: 'gsk_',
    free: true,
    icon: '🤖'
  },
  openai: {
    name: 'OpenAI GPT',
    keyPrefix: 'sk-',
    free: false,
    icon: '🧠'
  },
  claude: {
    name: 'Claude AI',
    keyPrefix: 'sk-ant-',
    free: false,
    icon: '🎯'
  },
  gemini: {
    name: 'Google Gemini',
    keyPrefix: 'AIza',
    free: false,
    icon: '💎'
  }
};

let isSubscribed = false;

document.addEventListener('DOMContentLoaded', () => {
  initializeSubscriptionStatus();
  loadAllApiKeys();
  setupEventListeners();
});

function initializeSubscriptionStatus() {
  chrome.storage.local.get(['subscriptionStatus'], (data) => {
    isSubscribed = data.subscriptionStatus || false;
    updateSubscriptionUI();
  });
}

function updateSubscriptionUI() {
  const badge = document.getElementById('subscription-status');
  const subscriptionSection = document.getElementById('subscription-section');
  
  badge.textContent = isSubscribed ? 'Premium' : 'Free';
  badge.style.background = isSubscribed ? 
    'linear-gradient(45deg, #10b981, #059669)' : 
    'linear-gradient(45deg, #ffd700, #ffed4e)';
  badge.style.color = isSubscribed ? 'white' : '#333';

  // Show/hide subscription section
  subscriptionSection.style.display = isSubscribed ? 'none' : 'block';

  // Enable/disable premium API inputs
  Object.keys(API_PROVIDERS).forEach(provider => {
    const config = API_PROVIDERS[provider];
    if (!config.free) {
      const keyInput = document.getElementById(`${provider}-key`);
      const subscribeBtn = document.getElementById(`${provider}-subscribe-btn`);
      const statusDiv = document.getElementById(`${provider}-status`);

      if (isSubscribed) {
        keyInput.disabled = false;
        keyInput.classList.remove('disabled');
        
        // Replace subscribe button with save button
        if (subscribeBtn && subscribeBtn.textContent === 'Subscribe') {
          subscribeBtn.textContent = 'Save';
          subscribeBtn.className = 'btn btn-primary';
          subscribeBtn.onclick = () => saveApiKey(provider);
        }
        
        statusDiv.textContent = 'Premium API enabled - enter your API key';
        statusDiv.className = 'status-message status-success';
        statusDiv.style.display = 'block';
      } else {
        keyInput.disabled = true;
        keyInput.classList.add('disabled');
        subscribeBtn.textContent = 'Subscribe';
        subscribeBtn.className = 'btn btn-secondary';
        subscribeBtn.onclick = () => handleSubscription(provider);
        
        statusDiv.textContent = 'Requires Premium subscription';
        statusDiv.className = 'status-message';
        statusDiv.style.display = 'block';
      }
    }
  });
}

function loadAllApiKeys() {
  Object.keys(API_PROVIDERS).forEach(provider => {
    loadApiKey(provider, (key) => {
      const input = document.getElementById(`${provider}-key`);
      if (input) {
        input.value = key;
      }
    });
  });
}

function loadApiKey(provider, callback) {
  const storageKey = `${provider}ApiKey`;
  chrome.storage.local.get([storageKey], (data) => {
    callback(data[storageKey] || "");
  });
}

function setupEventListeners() {
  // Setup Groq save button (always available)
  document.getElementById('groq-save-btn').addEventListener('click', () => {
    saveApiKey('groq');
  });

  // Setup subscription buttons for premium APIs
  ['openai', 'claude', 'gemini'].forEach(provider => {
    const btn = document.getElementById(`${provider}-subscribe-btn`);
    if (btn) {
      btn.addEventListener('click', () => {
        if (isSubscribed) {
          saveApiKey(provider);
        } else {
          handleSubscription(provider);
        }
      });
    }
  });

  // Setup upgrade button
  const upgradeBtn = document.getElementById('upgrade-btn');
  if (upgradeBtn) {
    upgradeBtn.addEventListener('click', handleUpgrade);
  }

  // Setup tools buttons
  document.getElementById('clear-cache-btn').addEventListener('click', clearCache);
  document.getElementById('reset-settings-btn').addEventListener('click', resetSettings);
}

function saveApiKey(provider) {
  const config = API_PROVIDERS[provider];
  const keyInput = document.getElementById(`${provider}-key`);
  const statusDiv = document.getElementById(`${provider}-status`);
  const saveBtn = document.getElementById(`${provider}-save-btn`) || 
                  document.getElementById(`${provider}-subscribe-btn`);
  
  const key = keyInput.value.trim();
  
  if (!key) {
    showStatus(provider, 'Please enter an API key', 'error');
    return;
  }
  
  if (!key.startsWith(config.keyPrefix)) {
    showStatus(provider, `Invalid API key format! Should start with "${config.keyPrefix}"`, 'error');
    return;
  }

  // Show loading state
  const originalText = saveBtn.textContent;
  saveBtn.innerHTML = '<span class="loading"></span> Saving...';
  saveBtn.disabled = true;

  const storageKey = `${provider}ApiKey`;
  chrome.storage.local.set({ [storageKey]: key }, () => {
    // Reset button
    saveBtn.textContent = originalText;
    saveBtn.disabled = false;
    
    showStatus(provider, `${config.name} API key saved successfully!`, 'success');
    
    // Update API status badge
    const apiStatus = keyInput.closest('.api-provider').querySelector('.api-status');
    if (apiStatus) {
      apiStatus.textContent = 'Connected';
      apiStatus.className = 'api-status status-connected';
    }
  });
}

function showStatus(provider, message, type = 'default') {
  const statusDiv = document.getElementById(`${provider}-status`);
  if (statusDiv) {
    statusDiv.textContent = message;
    statusDiv.className = `status-message ${type === 'success' ? 'status-success' : type === 'error' ? 'status-error' : ''}`;
    statusDiv.style.display = 'block';
    
    if (type !== 'default') {
      setTimeout(() => {
        statusDiv.style.display = 'none';
      }, 4000);
    }
  }
}

function handleSubscription(provider) {
  const subscribeBtn = document.getElementById(`${provider}-subscribe-btn`);
  subscribeBtn.innerHTML = '<span class="loading"></span> Processing...';
  subscribeBtn.disabled = true;

  // In a real implementation, this would open a payment flow
  setTimeout(() => {
    isSubscribed = true;
    chrome.storage.local.set({ subscriptionStatus: true }, () => {
      updateSubscriptionUI();
      showStatus(provider, 'Premium activated! You can now enter your API key.', 'success');
    });
  }, 2000);
}

function handleUpgrade() {
  const upgradeBtn = document.getElementById('upgrade-btn');
  upgradeBtn.innerHTML = '<span class="loading"></span> Processing...';
  upgradeBtn.disabled = true;

  // In a real implementation, this would open a payment flow
  setTimeout(() => {
    isSubscribed = true;
    chrome.storage.local.set({ subscriptionStatus: true }, () => {
      updateSubscriptionUI();
      
      // Reset button
      upgradeBtn.textContent = '✅ Premium Activated!';
      upgradeBtn.style.background = 'linear-gradient(45deg, #10b981, #059669)';
      
      setTimeout(() => {
        upgradeBtn.textContent = '⭐ Upgrade to Premium - $9.99/month';
        upgradeBtn.style.background = 'linear-gradient(45deg, #f59e0b, #d97706)';
        upgradeBtn.disabled = false;
      }, 3000);
    });
  }, 2000);
}

function clearCache() {
  const clearBtn = document.getElementById('clear-cache-btn');
  const toolsStatus = document.getElementById('tools-status');
  
  clearBtn.innerHTML = '<span class="loading"></span> Clearing...';
  clearBtn.disabled = true;

  chrome.storage.local.remove(['verdicts'], () => {
    clearBtn.textContent = 'Clear Cache';
    clearBtn.disabled = false;
    
    toolsStatus.textContent = 'All stored website analysis results have been cleared.';
    toolsStatus.className = 'status-message status-success';
    toolsStatus.style.display = 'block';
    
    setTimeout(() => {
      toolsStatus.style.display = 'none';
    }, 4000);
  });
}

function resetSettings() {
  if (!confirm('Are you sure you want to reset all settings? This will remove all API keys and reset subscription status.')) {
    return;
  }

  const resetBtn = document.getElementById('reset-settings-btn');
  const toolsStatus = document.getElementById('tools-status');
  
  resetBtn.innerHTML = '<span class="loading"></span> Resetting...';
  resetBtn.disabled = true;

  // Clear all data
  const keysToRemove = [
    'verdicts',
    'subscriptionStatus',
    ...Object.keys(API_PROVIDERS).map(p => `${p}ApiKey`)
  ];

  chrome.storage.local.remove(keysToRemove, () => {
    resetBtn.textContent = 'Reset All';
    resetBtn.disabled = false;
    
    // Reset UI state
    isSubscribed = false;
    updateSubscriptionUI();
    
    // Clear all input fields
    Object.keys(API_PROVIDERS).forEach(provider => {
      const input = document.getElementById(`${provider}-key`);
      if (input) {
        input.value = '';
      }
      
      // Reset API status badges
      const apiStatus = input?.closest('.api-provider')?.querySelector('.api-status');
      if (apiStatus && !API_PROVIDERS[provider].free) {
        apiStatus.textContent = 'Premium';
        apiStatus.className = 'api-status status-premium';
      }
    });
    
    toolsStatus.textContent = 'All settings have been reset to defaults.';
    toolsStatus.className = 'status-message status-success';
    toolsStatus.style.display = 'block';
    
    setTimeout(() => {
      toolsStatus.style.display = 'none';
    }, 4000);
  });
}
