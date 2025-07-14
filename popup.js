const emotes = {
    SAFE: "🟩🛡️",         // Green square + shield (safe, protected)
    SUSPICIOUS: "🟨❓",   // Yellow square + question (caution, unknown)
    DANGEROUS: "🟥⛔",    // Red square + no entry (danger, blocked)
    UNKNOWN: "⬜🤔"        // White square + thinking face (unknown, ambiguous)
};

function setVerdict(v) {
    document.getElementById('emote').innerText = emotes[v.verdict] || emotes.UNKNOWN;
    document.getElementById('verdict').innerText = v.verdict || "UNKNOWN";
    document.getElementById('score').innerText = (v.score !== undefined ? v.score + "%" : "");
    document.getElementById('details').innerText = v.reason || "";
}

function saveApiKey(key) {
    chrome.storage.local.set({ groqApiKey: key }, () => {
        document.getElementById('api-status').innerText = "API key saved!";
        document.getElementById('api-status').style.color = "#03620b";
        setTimeout(() => { document.getElementById('api-status').innerText = ""; }, 1400);
    });
}

function loadApiKey(cb) {
    chrome.storage.local.get(['groqApiKey'], (data) => {
        cb(data.groqApiKey || "");
    });
}

function getCurrentTab(cb) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => cb(tabs[0]));
}

function refreshVerdict(force = false) {
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
        });
    });
}

window.addEventListener('DOMContentLoaded', () => {
    // Load API key for the input
    loadApiKey((key) => {
        document.getElementById('groq-key').value = key;
        if (!key) document.getElementById('api-status').innerText = "Enter your Groq API key above to get started.";
        else document.getElementById('api-status').innerText = "";
    });

    document.getElementById('save-key-btn').onclick = () => {
        const key = document.getElementById('groq-key').value.trim();
        if (!key.startsWith('gsk_')) {
            document.getElementById('api-status').innerText = "Invalid API key format!";
            document.getElementById('api-status').style.color = "red";
            return;
        }
        document.getElementById('api-status').style.color = "#03620b";
        saveApiKey(key);
        setTimeout(() => refreshVerdict(true), 500);
    };

    // Eye toggle logic
    const keyInput = document.getElementById('groq-key');
    const eyeToggle = document.getElementById('eye-toggle');
    const eyeIcon = document.getElementById('eye-icon');
    let showing = false;
    eyeToggle.onclick = () => {
        showing = !showing;
        keyInput.type = showing ? 'text' : 'password';
        eyeIcon.innerHTML = showing
            ? '&#128584;' // 🙈 (for hide)
            : '&#128065;'; // 👁️ (for show)
    };
    eyeToggle.onkeydown = (e) => {
        if (e.key === "Enter" || e.key === " ") eyeToggle.onclick();
    };

    // Show verdict if API key exists
    loadApiKey((key) => {
        if (key) {
            getCurrentTab(tab => {
                const hostname = new URL(tab.url).hostname;
                chrome.runtime.sendMessage({ action: 'getVerdict', hostname }, (resp) => {
                    if (resp && resp.verdict) setVerdict(resp.verdict);
                    else setVerdict({ verdict: "UNKNOWN", score: 0, reason: "Not checked yet." });
                });
            });
        }
    });

    document.getElementById('retest-btn').onclick = () => refreshVerdict(true);
    document.getElementById('clear-btn').onclick = () => {
        getCurrentTab(tab => {
            const hostname = new URL(tab.url).hostname;
            chrome.runtime.sendMessage({ action: 'clearDomain', hostname }, () => {
                setVerdict({ verdict: "UNKNOWN", score: 0, reason: "Verdict cleared. Please retest." });
            });
        });
    };

    window.addEventListener('message', (event) => {
        if (event.data.type === 'verdictUpdate') {
            setVerdict(event.data.verdict);
            document.getElementById('api-status').innerText = "";
        }
        if (event.data.type === 'verdictError') {
            document.getElementById('api-status').innerText = event.data.error || "API/network error.";
            document.getElementById('api-status').style.color = "red";
        }
    });
});
