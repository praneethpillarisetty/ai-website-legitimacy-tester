const API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama3-70b-8192"; // <- Use a current Groq model!
const VERDICT_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function createPrompt(pageText, hostname) {
    // Fallback prompt if page is empty
    if (!pageText || pageText.trim().length < 20) {
        return `Is the website domain ${hostname} legitimate and safe for users? Reply in JSON: {"verdict":"SAFE|SUSPICIOUS|DANGEROUS|UNKNOWN","score":0-100,"reason":"short explanation"}.`;
    }
    return `
Analyze the following website text and judge if this domain (${hostname}) is SAFE, SUSPICIOUS, DANGEROUS, or UNKNOWN for users. 
Give a short reason. Output in JSON format: 
{"verdict":"SAFE|SUSPICIOUS|DANGEROUS|UNKNOWN","score":0-100,"reason":"short explanation"}.

Website text: """${pageText.substring(0, 5000)}"""
`;
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
});

async function checkDomainLegitimacy({ hostname, pageText, force }, sendResponse) {
    chrome.storage.local.get(['groqApiKey', 'verdicts'], async (data) => {
        const key = data.groqApiKey;
        if (!key) return sendResponse({ error: "No API key set!" });

        let verdicts = data.verdicts || {};
        let lastVerdict = verdicts[hostname];

        if (lastVerdict && !force) {
            if (Date.now() - lastVerdict.ts < VERDICT_TTL_MS) {
                return sendResponse({ verdict: lastVerdict });
            }
        }

        try {
            const prompt = createPrompt(pageText, hostname);
            const result = await queryGroq(key, prompt);

            const verdictObj = {
                verdict: result.verdict,
                score: result.score,
                reason: result.reason,
                ts: Date.now()
            };

            verdicts[hostname] = verdictObj;
            chrome.storage.local.set({ verdicts });

            sendResponse({ verdict: verdictObj });
        } catch (err) {
            sendResponse({ error: err.message || err });
        }
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

async function queryGroq(apiKey, prompt) {
    const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: MODEL,
            messages: [
                { role: "system", content: "You are a security and scam detection AI assistant." },
                { role: "user", content: prompt }
            ]
            // temperature is optional
        })
    });

    if (!res.ok) {
        let msg = await res.text();
        throw new Error("Groq API error: " + res.status + (msg ? " - " + msg : ""));
    }

    const data = await res.json();

    let out;
    try {
        const txt = data.choices[0].message.content;
        out = JSON.parse(txt);
        if (!["SAFE", "SUSPICIOUS", "DANGEROUS", "UNKNOWN"].includes(out.verdict)) {
            throw new Error("Invalid verdict: " + out.verdict);
        }
        if (typeof out.score !== "number") out.score = 0;
        if (!out.reason) out.reason = "";
        return out;
    } catch (e) {
        throw new Error("AI did not return valid JSON: " + (data.choices && data.choices[0].message.content));
    }
}
