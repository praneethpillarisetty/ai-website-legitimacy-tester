const emotes = {
    SAFE: "🟢",         // Green circle (safe)
    SUSPICIOUS: "🟡",   // Yellow circle (caution)
    DANGEROUS: "🔴",    // Red circle (danger)
    UNKNOWN: "⚪"       // White circle (unknown)
};

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
let currentTab = 'apis';

// Initialize the popup
window.addEventListener('DOMContentLoaded', () => {
    initializeTabs();
    initializeApiSections();
    loadSubscriptionStatus();
    loadAllApiKeys();
    setupEventListeners();
    
    // Load and display current verdict if available
    loadApiKey('groq', (key) => {
        if (key) {
            getCurrentTab(tab => {
                const hostname = new URL(tab.url).hostname;
                chrome.runtime.sendMessage({ action: 'getVerdict', hostname }, (resp) => {
                    if (resp && resp.verdict) {
                        setVerdict(resp.verdict);
                        switchToTab('results');
                    } else {
                        setVerdict({ verdict: "UNKNOWN", score: 0, reason: "Click 'Test Site' to analyze this website." });
                    }
                });
            });
        } else {
            setVerdict({ verdict: "UNKNOWN", score: 0, reason: "Add your Groq API key in the API Keys tab to get started." });
        }
    });
});

function initializeTabs() {
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            const tabName = e.target.getAttribute('data-tab');
            switchToTab(tabName);
        });
    });
}

function switchToTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.getAttribute('data-tab') === tabName) {
            tab.classList.add('active');
        }
    });

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    const targetContent = document.getElementById(`${tabName}-tab`);
    if (targetContent) {
        targetContent.classList.add('active');
        targetContent.classList.add('fade-in');
    }

    currentTab = tabName;
}

function initializeApiSections() {
    Object.keys(API_PROVIDERS).forEach(provider => {
        const config = API_PROVIDERS[provider];
        
        // Setup eye toggle
        const eyeToggle = document.getElementById(`${provider}-eye-toggle`);
        const keyInput = document.getElementById(`${provider}-key`);
        
        if (eyeToggle && keyInput) {
            let showing = false;
            eyeToggle.addEventListener('click', () => {
                if (config.free || isSubscribed) {
                    showing = !showing;
                    keyInput.type = showing ? 'text' : 'password';
                    eyeToggle.textContent = showing ? '🙈' : '👁️';
                }
            });
        }

        // Setup save button for free providers or subscribed users
        if (config.free) {
            const saveBtn = document.getElementById(`${provider}-save-btn`);
            if (saveBtn) {
                saveBtn.addEventListener('click', () => saveApiKey(provider));
            }
        } else {
            // Setup subscribe button for premium providers
            const subscribeBtn = document.getElementById(`${provider}-subscribe-btn`);
            if (subscribeBtn) {
                subscribeBtn.addEventListener('click', () => handleSubscription(provider));
            }
        }
    });
}

function setupEventListeners() {
    // Retest button
    document.getElementById('retest-btn').addEventListener('click', () => {
        refreshVerdict(true);
    });

    // Clear button
    document.getElementById('clear-btn').addEventListener('click', () => {
        getCurrentTab(tab => {
            const hostname = new URL(tab.url).hostname;
            chrome.runtime.sendMessage({ action: 'clearDomain', hostname }, () => {
                setVerdict({ verdict: "UNKNOWN", score: 0, reason: "Verdict cleared. Click 'Test Site' to reanalyze." });
            });
        });
    });

    // Upgrade button
    document.getElementById('upgrade-btn').addEventListener('click', () => {
        handleUpgrade();
    });

    // Handle messages from content scripts
    window.addEventListener('message', (event) => {
        if (event.data.type === 'verdictUpdate') {
            setVerdict(event.data.verdict);
            switchToTab('results');

            showStatus('groq', 'Analysis complete', 'success');
        }
        if (event.data.type === 'verdictError') {
            showStatus('groq', event.data.error || "API error", 'error');
        }
    });
}

function loadSubscriptionStatus() {
    chrome.storage.local.get(['subscriptionStatus'], (data) => {
        isSubscribed = data.subscriptionStatus || false;
        updateSubscriptionUI();
    });
}

function updateSubscriptionUI() {
    const badge = document.getElementById('subscription-status');
    badge.textContent = isSubscribed ? 'Premium' : 'Free';
    badge.style.background = isSubscribed ? 
        'linear-gradient(45deg, #10b981, #059669)' : 
        'linear-gradient(45deg, #ffd700, #ffed4e)';
    badge.style.color = isSubscribed ? 'white' : '#333';

    // Enable/disable premium API inputs
    Object.keys(API_PROVIDERS).forEach(provider => {
        const config = API_PROVIDERS[provider];
        if (!config.free) {
            const keyInput = document.getElementById(`${provider}-key`);
            const eyeToggle = document.getElementById(`${provider}-eye-toggle`);
            const subscribeBtn = document.getElementById(`${provider}-subscribe-btn`);
            const statusDiv = document.getElementById(`${provider}-status`);

            if (isSubscribed) {
                keyInput.disabled = false;
                keyInput.classList.remove('disabled');
                eyeToggle.disabled = false;
                subscribeBtn.style.display = 'none';
                
                // Add save button for subscribed users
                if (!document.getElementById(`${provider}-save-btn`)) {
                    const saveBtn = document.createElement('button');
                    saveBtn.className = 'save-btn';
                    saveBtn.id = `${provider}-save-btn`;
                    saveBtn.textContent = 'Save';
                    saveBtn.addEventListener('click', () => saveApiKey(provider));
                    subscribeBtn.parentNode.replaceChild(saveBtn, subscribeBtn);
                }
                
                statusDiv.textContent = 'Premium API enabled';
                statusDiv.className = 'key-status status-success';
            } else {
                keyInput.disabled = true;
                keyInput.classList.add('disabled');
                eyeToggle.disabled = true;
                statusDiv.textContent = 'Requires Premium subscription';
                statusDiv.className = 'key-status';
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
            
            if (provider === 'groq' && !key) {
                showStatus('groq', 'Enter your API key above', 'default');
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

function saveApiKey(provider) {
    const config = API_PROVIDERS[provider];
    const keyInput = document.getElementById(`${provider}-key`);
    const key = keyInput.value.trim();
    
    if (!key.startsWith(config.keyPrefix)) {
        showStatus(provider, `Invalid API key format! Should start with "${config.keyPrefix}"`, 'error');
        return;
    }

    const storageKey = `${provider}ApiKey`;
    chrome.storage.local.set({ [storageKey]: key }, () => {

        showStatus(provider, 'API key saved!', 'success');
        
        // Update API status badge
        const statusBadge = document.querySelector(`#${provider}-key`).closest('.api-section').querySelector('.api-status');
        if (!config.free && isSubscribed) {
            statusBadge.textContent = 'Connected';
            statusBadge.className = 'api-status status-connected';
        }
        
        // If this is Groq, automatically test the current site
        if (provider === 'groq') {
            setTimeout(() => {
                refreshVerdict(true);
            }, 1000);
        }
    });
}

function showStatus(provider, message, type = 'default') {
    const statusDiv = document.getElementById(`${provider}-status`);
    if (statusDiv) {
        statusDiv.textContent = message;
        statusDiv.className = `key-status ${type === 'success' ? 'status-success' : type === 'error' ? 'status-error' : ''}`;
        
        if (type !== 'default') {
            setTimeout(() => {
                statusDiv.textContent = '';
                statusDiv.className = 'key-status';
            }, 3000);
        }
    }
}

function setVerdict(verdict) {
    document.getElementById('emote').textContent = emotes[verdict.verdict] || emotes.UNKNOWN;
    document.getElementById('verdict').textContent = verdict.verdict || "UNKNOWN";
    document.getElementById('score').textContent = (verdict.score !== undefined ? verdict.score + "%" : "");
    document.getElementById('details').textContent = verdict.reason || "";
    
    // Add animation
    const verdictSection = document.querySelector('.verdict-section');
    verdictSection.classList.remove('fade-in');
    setTimeout(() => verdictSection.classList.add('fade-in'), 10);
}

function getCurrentTab(callback) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => callback(tabs[0]));
}

function refreshVerdict(force = false) {
    // Show loading state
    const retestBtn = document.getElementById('retest-btn');
    const originalText = retestBtn.textContent;
    retestBtn.innerHTML = '<span class="loading"></span> Testing...';
    retestBtn.disabled = true;

    getCurrentTab(tab => {
        const url = new URL(tab.url);
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: (hostname, force) => {
                const pageText = document.body.innerText || '';
                chrome.runtime.sendMessage(
                    { action: 'checkLegitimacy', hostname, pageText, force },
                    (resp) => {
                        if (resp && resp.verdict) {
                            window.postMessage({ type: 'verdictUpdate', verdict: resp.verdict }, "*");
                        } else if (resp && resp.error) {
                            window.postMessage({ type: 'verdictError', error: resp.error }, "*");
                        }
                    }
                );
            },
            args: [url.hostname, force]
        }).finally(() => {
            // Reset button state
            setTimeout(() => {
                retestBtn.textContent = originalText;
                retestBtn.disabled = false;
            }, 2000);
        });
    });
}

function handleSubscription(provider) {
    // Simulate subscription process
    const subscribeBtn = document.getElementById(`${provider}-subscribe-btn`);
    subscribeBtn.textContent = 'Processing...';
    subscribeBtn.disabled = true;

    // In a real implementation, this would open a payment flow
    setTimeout(() => {
        // For demo purposes, we'll simulate a successful subscription
        isSubscribed = true;
        chrome.storage.local.set({ subscriptionStatus: true }, () => {
            updateSubscriptionUI();
            switchToTab('apis');

            showStatus(provider, 'Premium activated!', 'success');
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
            switchToTab('apis');
            
            // Reset button
            upgradeBtn.textContent = '✅ Premium Activated!';
            upgradeBtn.style.background = 'linear-gradient(45deg, #10b981, #059669)';
            
            setTimeout(() => {
                upgradeBtn.textContent = '⭐ Upgrade Now - $9.99/month';
                upgradeBtn.style.background = 'linear-gradient(45deg, #f59e0b, #d97706)';
                upgradeBtn.disabled = false;
            }, 3000);
        });
    }, 2000);
}
