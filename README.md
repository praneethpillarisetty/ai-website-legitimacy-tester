# AI Website Legitimacy Tester

Chrome extension that uses Groq AI to check if a website is genuine or a scam/phishing site.  
- Minimal API calls (per-domain, per-day, or on form submit)
- Verdict badge with emote and clarity score
- Secure: user enters own Groq API key
- Popup for details, retest, and clear verdict

## Installation
1. Clone/download this repo and open `chrome://extensions/`
2. Enable "Developer Mode", click "Load Unpacked", and select this folder.
3. Set your Groq API key in the Options page.
4. Browse and see live verdicts!

## How it works
- On first visit (or after 24h), extension calls Groq with page text for verdict.
- Any form submit always triggers a recheck.
- Verdicts shown in badge, details in popup.

## API used
- [Groq OpenAI-compatible endpoint](https://console.groq.com/)
- Model: `mixtral-8x7b-32768` (can be changed in `background.js`)
