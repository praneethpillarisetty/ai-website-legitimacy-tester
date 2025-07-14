// API Configuration
const API_CONFIGS = {
    groq: {
        url: "https://api.groq.com/openai/v1/chat/completions",
        model: "llama3-70b-8192",
        free: true
    },
    openai: {
        url: "https://api.openai.com/v1/chat/completions",
        model: "gpt-4",
        free: false
    },
    claude: {
        url: "https://api.anthropic.com/v1/messages",
        model: "claude-3-sonnet-20240229",
        free: false
    },
    gemini: {
        url: "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent",
        model: "gemini-pro",
        free: false
    }
};

const VERDICT_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function createPrompt(pageText, hostname) {
    if (!pageText || pageText.trim().length < 20) {
        return `Is the website domain ${hostname} legitimate and safe? Reply in JSON: {"verdict":"SAFE|SUSPICIOUS|DANGEROUS|UNKNOWN","score":0-100,"reason":"short explanation"}.`;
    }
    return `Analyze this website and judge if domain ${hostname} is SAFE, SUSPICIOUS, DANGEROUS, or UNKNOWN. Consider phishing, scams, and legitimacy. Reply in JSON: {"verdict":"SAFE|SUSPICIOUS|DANGEROUS|UNKNOWN","score":0-100,"reason":"short explanation"}.

Website text: """${pageText.substring(0, 3000)}"""`;
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.action === 'checkLegitimacy') {
        checkDomainLegitimacy(msg, sendResponse);
        return true;
    }
    if (msg.action === 'getVerdict') {
        getStoredVerdict(msg.hostname, sendResponse);
        return true;
    }
    if (msg.action === 'clearDomain') {
        clearDomainVerdict(msg.hostname, sendResponse);
        return true;
    }
    if (msg.action === 'checkSubscription') {
        checkSubscriptionStatus(sendResponse);
        return true;
    }
});

async function checkDomainLegitimacy({ hostname, pageText, force, provider = 'groq' }, sendResponse) {
    try {
        // Get storage data
        const data = await getStorageData(['subscriptionStatus', 'verdicts', `${provider}ApiKey`]);
        const isSubscribed = data.subscriptionStatus || false;
        const apiKey = data[`${provider}ApiKey`];
        
        // Check if API is available
        const config = API_CONFIGS[provider];
        if (!config) {
            return sendResponse({ error: "Invalid API provider!" });
        }
        
        // Check subscription for premium APIs
        if (!config.free && !isSubscribed) {
            return sendResponse({ error: "Premium subscription required for this API!" });
        }
        
        if (!apiKey) {
            return sendResponse({ error: `No ${provider} API key set!` });
        }

        let verdicts = data.verdicts || {};
        let lastVerdict = verdicts[hostname];

        // Check if we have a recent verdict and not forcing refresh
        if (lastVerdict && !force) {
            if (Date.now() - lastVerdict.ts < VERDICT_TTL_MS) {
                return sendResponse({ verdict: lastVerdict });
            }
        }

        // Query the AI API
        const prompt = createPrompt(pageText, hostname);
        const result = await queryAI(provider, apiKey, prompt);

        const verdictObj = {
            verdict: result.verdict,
            score: result.score,
            reason: result.reason,
            provider: provider,
            ts: Date.now()
        };

        // Store the verdict
        verdicts[hostname] = verdictObj;
        chrome.storage.local.set({ verdicts });

        sendResponse({ verdict: verdictObj });
    } catch (err) {
        console.error('Error checking legitimacy:', err);
        sendResponse({ error: err.message || 'Unknown error occurred' });
    }
}

function getStorageData(keys) {
    return new Promise((resolve) => {
        chrome.storage.local.get(keys, resolve);
    });
}

function getStoredVerdict(hostname, sendResponse) {
    chrome.storage.local.get(['verdicts'], (data) => {
        const verdicts = data.verdicts || {};
        sendResponse({ verdict: verdicts[hostname] });
    });
}

function clearDomainVerdict(hostname, sendResponse) {
    chrome.storage.local.get(['verdicts'], (data) => {
        const verdicts = data.verdicts || {};
        delete verdicts[hostname];
        chrome.storage.local.set({ verdicts }, () => sendResponse({ ok: true }));
    });
}

function checkSubscriptionStatus(sendResponse) {
    chrome.storage.local.get(['subscriptionStatus'], (data) => {
        sendResponse({ isSubscribed: data.subscriptionStatus || false });
    });
}

async function queryAI(provider, apiKey, prompt) {
    const config = API_CONFIGS[provider];
    
    switch (provider) {
        case 'groq':
            return await queryGroq(apiKey, prompt);
        case 'openai':
            return await queryOpenAI(apiKey, prompt);
        case 'claude':
            return await queryClaude(apiKey, prompt);
        case 'gemini':
            return await queryGemini(apiKey, prompt);
        default:
            throw new Error(`Unsupported provider: ${provider}`);
    }
}

async function queryGroq(apiKey, prompt) {
    const config = API_CONFIGS.groq;
    const res = await fetch(config.url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: config.model,
            messages: [
                { role: "system", content: "You are a security and scam detection AI assistant. Always respond with valid JSON." },
                { role: "user", content: prompt }
            ],
            temperature: 0.3
        })
    });

    if (!res.ok) {
        let msg = await res.text();
        throw new Error(`Groq API error: ${res.status}${msg ? " - " + msg : ""}`);
    }

    const data = await res.json();
    return parseAIResponse(data.choices[0].message.content);
}

async function queryOpenAI(apiKey, prompt) {
    const config = API_CONFIGS.openai;
    const res = await fetch(config.url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: config.model,
            messages: [
                { role: "system", content: "You are a security and scam detection AI assistant. Always respond with valid JSON." },
                { role: "user", content: prompt }
            ],
            temperature: 0.3
        })
    });

    if (!res.ok) {
        let msg = await res.text();
        throw new Error(`OpenAI API error: ${res.status}${msg ? " - " + msg : ""}`);
    }

    const data = await res.json();
    return parseAIResponse(data.choices[0].message.content);
}

async function queryClaude(apiKey, prompt) {
    const config = API_CONFIGS.claude;
    const res = await fetch(config.url, {
        method: 'POST',
        headers: {
            'x-api-key': apiKey,
            'Content-Type': 'application/json',
            'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
            model: config.model,
            max_tokens: 1000,
            messages: [
                { 
                    role: "user", 
                    content: `You are a security and scam detection AI assistant. Always respond with valid JSON.\n\n${prompt}` 
                }
            ]
        })
    });

    if (!res.ok) {
        let msg = await res.text();
        throw new Error(`Claude API error: ${res.status}${msg ? " - " + msg : ""}`);
    }

    const data = await res.json();
    return parseAIResponse(data.content[0].text);
}

async function queryGemini(apiKey, prompt) {
    const config = API_CONFIGS.gemini;
    const res = await fetch(`${config.url}?key=${apiKey}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            contents: [{
                parts: [{
                    text: `You are a security and scam detection AI assistant. Always respond with valid JSON.\n\n${prompt}`
                }]
            }],
            generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 1000
            }
        })
    });

    if (!res.ok) {
        let msg = await res.text();
        throw new Error(`Gemini API error: ${res.status}${msg ? " - " + msg : ""}`);
    }

    const data = await res.json();
    return parseAIResponse(data.candidates[0].content.parts[0].text);
}

function parseAIResponse(responseText) {
    try {
        // Try to extract JSON from the response
        let jsonStr = responseText.trim();
        
        // Look for JSON object in the response
        const jsonMatch = jsonStr.match(/\{[^}]*"verdict"[^}]*\}/);
        if (jsonMatch) {
            jsonStr = jsonMatch[0];
        }
        
        const parsed = JSON.parse(jsonStr);
        
        // Validate the response
        if (!["SAFE", "SUSPICIOUS", "DANGEROUS", "UNKNOWN"].includes(parsed.verdict)) {
            throw new Error("Invalid verdict: " + parsed.verdict);
        }
        
        // Ensure score is a number between 0-100
        if (typeof parsed.score !== "number" || parsed.score < 0 || parsed.score > 100) {
            parsed.score = 0;
        }
        
        // Ensure reason exists
        if (!parsed.reason || typeof parsed.reason !== "string") {
            parsed.reason = "Analysis completed";
        }
        
        return parsed;
    } catch (e) {
        console.error('Failed to parse AI response:', responseText, e);
        
        // Fallback: try to extract verdict from text
        const text = responseText.toLowerCase();
        let verdict = "UNKNOWN";
        let score = 0;
        
        if (text.includes("safe") || text.includes("legitimate")) {
            verdict = "SAFE";
            score = 75;
        } else if (text.includes("dangerous") || text.includes("scam") || text.includes("phishing")) {
            verdict = "DANGEROUS";
            score = 20;
        } else if (text.includes("suspicious") || text.includes("caution")) {
            verdict = "SUSPICIOUS";
            score = 40;
        }
        
        return {
            verdict: verdict,
            score: score,
            reason: "AI response format error - analysis may be incomplete"
        };
    }
}

// Background script installation
chrome.runtime.onInstalled.addListener(() => {
    console.log('AI Website Legitimacy Tester installed');
    
    // Initialize default settings
    chrome.storage.local.get(['subscriptionStatus'], (data) => {
        if (data.subscriptionStatus === undefined) {
            chrome.storage.local.set({ subscriptionStatus: false });
        }
    });
});

// Handle subscription updates (for future integration with payment systems)
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.action === 'updateSubscription') {
        chrome.storage.local.set({ subscriptionStatus: msg.isSubscribed }, () => {
            sendResponse({ success: true });
        });
        return true;
    }
});
