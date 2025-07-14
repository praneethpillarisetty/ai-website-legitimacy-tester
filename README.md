# 🛡️ AI Website Legitimacy Checker

A powerful Chrome extension that uses multiple AI providers to analyze websites for legitimacy, phishing attempts, and security threats in real-time.

## ✨ Features

### 🤖 Multiple AI Providers
- **Groq AI** (Free) - Fast and reliable analysis
- **OpenAI GPT-4** (Premium) - Advanced threat detection  
- **Claude AI** (Premium) - Sophisticated pattern recognition
- **Google Gemini** (Premium) - Comprehensive security analysis

### 🎨 Modern Interactive UI
- Beautiful gradient design with smooth animations
- Tabbed interface for easy navigation
- Real-time status updates and loading indicators
- Mobile-responsive design

### 💎 Subscription Model
- **Free Tier**: Full access to Groq AI
- **Premium Tier**: Access to all AI providers for $9.99/month
- Enhanced analysis with multi-model consensus scoring
- Priority support and faster response times

### 🔒 Security & Privacy
- All API keys stored locally in browser
- No data transmitted to third-party servers
- Secure encrypted storage
- User controls all AI interactions

### 📊 Advanced Analysis
- **Smart Verdict System**: SAFE, SUSPICIOUS, DANGEROUS, UNKNOWN
- **Confidence Scoring**: 0-100% accuracy ratings
- **Detailed Explanations**: Clear reasoning for each verdict
- **Historical Data**: 24-hour verdict caching
- **Form Protection**: Automatic recheck on form submissions

## 🚀 Installation

1. **Download the Extension**
   ```bash
   git clone [repository-url]
   cd ai-website-legitimacy-checker
   ```

2. **Load in Chrome**
   - Open `chrome://extensions/`
   - Enable "Developer Mode" (top right toggle)
   - Click "Load Unpacked"
   - Select the extension folder

3. **Configure APIs**
   - Click the extension icon
   - Go to "🔑 API Keys" tab
   - Enter your Groq API key (free to start)
   - Optionally upgrade to Premium for additional providers

## 📖 How to Use

### Basic Usage
1. Navigate to any website
2. Click the extension icon
3. Switch to "📊 Results" tab
4. Click "🔄 Test Site" to analyze

### API Key Setup

#### Free Tier (Groq AI)
1. Visit [Groq Console](https://console.groq.com/)
2. Create account and generate API key
3. Enter key in extension (starts with `gsk_`)

#### Premium Tier
1. Upgrade to Premium in the extension
2. Get API keys from respective providers:
   - **OpenAI**: [OpenAI Platform](https://platform.openai.com/)
   - **Claude**: [Anthropic Console](https://console.anthropic.com/)
   - **Gemini**: [Google AI Studio](https://aistudio.google.com/)

### Advanced Features
- **Settings Page**: Right-click extension → Options
- **Cache Management**: Clear stored verdicts
- **Subscription Management**: Upgrade/downgrade plans
- **Multi-Provider Analysis**: Compare results across AIs

## 🎯 Use Cases

### Individual Users
- **Safe Browsing**: Identify phishing and scam sites
- **Online Shopping**: Verify e-commerce legitimacy
- **Link Checking**: Analyze suspicious URLs
- **Form Protection**: Detect fake login pages

### Business Users
- **Employee Training**: Demonstrate security threats
- **IT Security**: Monitor browsing safety
- **Research**: Analyze competitor sites
- **Compliance**: Document security practices

## 🔧 Technical Details

### Architecture
- **Manifest V3**: Latest Chrome extension standards
- **Service Worker**: Efficient background processing
- **Content Scripts**: Real-time page analysis
- **Local Storage**: Secure data management

### AI Integration
```javascript
// Supported AI Providers
const AI_PROVIDERS = {
  groq: { model: "llama3-70b-8192", free: true },
  openai: { model: "gpt-4", free: false },
  claude: { model: "claude-3-sonnet-20240229", free: false },
  gemini: { model: "gemini-pro", free: false }
};
```

### Verdict Logic
- **SAFE**: 75-100% confidence, legitimate business content
- **SUSPICIOUS**: 40-74% confidence, questionable elements detected
- **DANGEROUS**: 0-39% confidence, clear scam/phishing indicators
- **UNKNOWN**: Insufficient data or analysis errors

## 📱 Screenshots

### Main Interface
- Tabbed design with API Keys, Results, and Premium sections
- Real-time status indicators
- Smooth animations and transitions

### Analysis Results
- Clear verdict display with emojis
- Confidence percentage
- Detailed explanation
- Action buttons for retesting

### Settings Page
- Comprehensive API management
- Subscription controls
- Cache and reset tools

## 🛠️ Development

### File Structure
```
├── manifest.json          # Extension configuration
├── popup.html/js          # Main interface
├── options.html/js        # Settings page
├── background.js          # Service worker
├── contentScript.js       # Page interaction
└── icon/                  # Extension icons
```

### API Response Format
```json
{
  "verdict": "SAFE|SUSPICIOUS|DANGEROUS|UNKNOWN",
  "score": 85,
  "reason": "Legitimate business website with proper security measures",
  "provider": "groq",
  "timestamp": 1234567890
}
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Issues**: GitHub Issues tab
- **Documentation**: In-extension help tooltips
- **Community**: [Discord/Forum link]
- **Premium Support**: Priority email support for subscribers

## 🔄 Changelog

### v2.0.0 (Current)
- ✨ Added multiple AI provider support
- 🎨 Complete UI redesign with modern interface
- 💎 Implemented subscription model
- 🔒 Enhanced security and privacy features
- 📊 Advanced analysis capabilities

### v1.0.0
- 🚀 Initial release with Groq AI integration
- 🛡️ Basic website legitimacy checking
- 📱 Simple popup interface

## ⚠️ Disclaimer

This extension provides AI-powered analysis to assist with website evaluation. Users should:
- Use their own judgment when assessing website safety
- Not rely solely on AI verdicts for critical security decisions
- Keep API keys secure and never share them
- Report false positives/negatives to improve accuracy

---

**🌟 Star this repo if you find it helpful!**
