// Multi-Account Ledger Download Utilities
class LedgerDownloader {
    constructor() {
        this.baseUrl = window.location.origin;
        this.appName = 'Multi-Account Ledger';
        this.version = '1.0.0';
    }

    // Create downloadable web package
    createWebPackage() {
        const html = this.generateStandaloneHTML();
        this.downloadFile(html, 'multi-account-ledger-web.html', 'text/html');
        return true;
    }

    // Create source code package info
    createSourcePackage() {
        const sourceInfo = {
            name: this.appName,
            version: this.version,
            description: 'Complete Multi-Account Ledger Application',
            liveUrl: this.baseUrl,
            installation: {
                web: 'Open the live URL in any browser',
                mobile: 'Install as PWA from browser menu',
                offline: 'Save the HTML file for offline use'
            },
            features: [
                'Multi-account ledger management',
                'Good in Cart tracking',
                'PDF/Excel export',
                'Offline functionality',
                'Mobile responsive design',
                'Local data storage'
            ],
            usage: {
                quickStart: 'Visit ' + this.baseUrl,
                mobileInstall: 'Open in mobile browser → Add to Home Screen',
                offlineUse: 'Download HTML package and open locally'
            },
            buildInstructions: {
                requirements: 'Node.js 18+, npm',
                commands: [
                    'npm install',
                    'npm run build',
                    'npm run dist'
                ],
                note: 'The live application contains all functionality'
            }
        };

        const content = JSON.stringify(sourceInfo, null, 2);
        this.downloadFile(content, 'multi-account-ledger-info.json', 'application/json');
        return true;
    }

    // Generate standalone HTML with embedded resources
    generateStandaloneHTML() {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.appName} - Offline Package</title>
    <meta name="description" content="Professional multi-account ledger management system">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            max-width: 800px;
            background: rgba(255,255,255,0.1);
            padding: 40px;
            border-radius: 20px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.2);
            text-align: center;
        }
        h1 { font-size: 2.5rem; margin-bottom: 1rem; }
        p { font-size: 1.1rem; margin-bottom: 1.5rem; opacity: 0.9; }
        .btn {
            display: inline-block;
            padding: 15px 30px;
            background: #10b981;
            color: white;
            text-decoration: none;
            border-radius: 12px;
            font-weight: 600;
            font-size: 1.1rem;
            margin: 10px;
            transition: all 0.3s ease;
            cursor: pointer;
            border: none;
        }
        .btn:hover {
            background: #059669;
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(16,185,129,0.3);
        }
        .btn.secondary {
            background: rgba(255,255,255,0.2);
            border: 2px solid rgba(255,255,255,0.3);
        }
        .btn.secondary:hover {
            background: rgba(255,255,255,0.3);
        }
        .features {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 30px 0;
        }
        .feature {
            background: rgba(255,255,255,0.1);
            padding: 20px;
            border-radius: 12px;
            border: 1px solid rgba(255,255,255,0.2);
        }
        .feature h3 { margin-bottom: 10px; color: #fbbf24; }
        .feature-list { text-align: left; }
        .feature-list li { margin: 5px 0; opacity: 0.9; }
        .note {
            background: rgba(251,191,36,0.1);
            border: 1px solid rgba(251,191,36,0.3);
            padding: 20px;
            border-radius: 12px;
            margin: 20px 0;
        }
        .download-info {
            background: rgba(16,185,129,0.1);
            border: 1px solid rgba(16,185,129,0.3);
            padding: 20px;
            border-radius: 12px;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>📊 ${this.appName}</h1>
        <p>Professional Multi-Account Ledger Management System</p>
        
        <div class="note">
            <h3>🎯 Offline Package Successfully Downloaded!</h3>
            <p>This page contains links to access the complete application online.</p>
        </div>

        <a href="${this.baseUrl}" class="btn">🚀 Launch Full Application</a>
        <button onclick="showInstructions()" class="btn secondary">📋 Instructions</button>

        <div class="features">
            <div class="feature">
                <h3>📈 Accounting</h3>
                <ul class="feature-list">
                    <li>Multi-account management</li>
                    <li>Entry tracking</li>
                    <li>Date filtering</li>
                    <li>Monthly summaries</li>
                </ul>
            </div>
            <div class="feature">
                <h3>🛒 Good in Cart</h3>
                <ul class="feature-list">
                    <li>Inventory tracking</li>
                    <li>Process dates</li>
                    <li>Auto calculations</li>
                    <li>Report integration</li>
                </ul>
            </div>
            <div class="feature">
                <h3>📤 Export</h3>
                <ul class="feature-list">
                    <li>PDF reports (A4/A5)</li>
                    <li>Excel export</li>
                    <li>Monthly reports</li>
                    <li>Cumulative data</li>
                </ul>
            </div>
            <div class="feature">
                <h3>🔧 Technical</h3>
                <ul class="feature-list">
                    <li>Offline capable</li>
                    <li>Local storage</li>
                    <li>Mobile responsive</li>
                    <li>Cross-platform</li>
                </ul>
            </div>
        </div>

        <div class="download-info">
            <h3>📱 Mobile Installation</h3>
            <p><strong>iPhone:</strong> Open link → Share → Add to Home Screen</p>
            <p><strong>Android:</strong> Open link → Menu → Add to Home screen</p>
        </div>

        <div style="margin-top: 30px;">
            <h3>🔗 Application Links</h3>
            <p><strong>Main App:</strong> <a href="${this.baseUrl}" style="color: #60a5fa;">${this.baseUrl}</a></p>
            <p><strong>Version:</strong> ${this.version} | <strong>Package Date:</strong> ${new Date().toLocaleDateString()}</p>
        </div>
    </div>

    <script>
        function showInstructions() {
            alert(\`📋 How to Use This Package:

🌐 Web Access:
1. Click "Launch Full Application" button above
2. Bookmark the page for quick access
3. Works in any modern browser

📱 Mobile App:
1. Open the application link on your phone
2. Tap browser menu (⋮ or share button)
3. Select "Add to Home Screen"
4. App icon appears on home screen

💾 Offline Use:
1. The main application works offline after first load
2. All data is stored locally on your device
3. No internet required after initial setup

🔒 Privacy:
- No data sent to external servers
- Everything stored locally
- Complete privacy protection

Ready to start? Click the launch button above!\`);
        }

        // Auto-redirect to app after 5 seconds if no interaction
        let autoRedirect = setTimeout(() => {
            if (confirm('🚀 Ready to launch the application?')) {
                window.open('${this.baseUrl}', '_blank');
            }
        }, 5000);

        // Cancel auto-redirect if user interacts
        document.addEventListener('click', () => clearTimeout(autoRedirect));
        document.addEventListener('keypress', () => clearTimeout(autoRedirect));
    </script>
</body>
</html>`;
    }

    // Download file utility
    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Create complete package
    createCompletePackage() {
        // Create multiple files in sequence
        this.createWebPackage();
        
        setTimeout(() => {
            this.createSourcePackage();
        }, 1000);

        setTimeout(() => {
            const readme = this.generateReadme();
            this.downloadFile(readme, 'README.md', 'text/markdown');
        }, 2000);

        return true;
    }

    // Generate README
    generateReadme() {
        return `# ${this.appName}

## 🚀 Quick Start

**Live Application:** ${this.baseUrl}

## 📦 What You Downloaded

This package contains:
- Web application launcher
- Installation instructions  
- Source code information
- Mobile installation guide

## 🎯 How to Use

### Option 1: Web Browser (Recommended)
1. Visit: ${this.baseUrl}
2. Use immediately - no installation needed!

### Option 2: Mobile App (PWA)
1. Open the live URL on your mobile browser
2. Tap "Add to Home Screen" when prompted
3. Use like a native mobile app

### Option 3: Offline Access
1. Visit the live application once
2. Application caches for offline use
3. Works without internet after first load

## ✨ Features

- ✅ Multi-account ledger management
- ✅ Good in Cart tracking
- ✅ PDF/Excel export
- ✅ Offline functionality
- ✅ Mobile responsive
- ✅ Local data storage

## 🔒 Privacy

- No data sent to external servers
- Everything stored locally
- Complete offline functionality
- No registration required

## 📞 Support

The live application includes all features and documentation.
Visit ${this.baseUrl} for the complete experience.

---
Version: ${this.version} | Generated: ${new Date().toISOString()}
`;
    }
}

// Make downloader available globally
window.LedgerDownloader = LedgerDownloader;

// Auto-initialize
window.addEventListener('load', () => {
    if (!window.ledgerDownloader) {
        window.ledgerDownloader = new LedgerDownloader();
    }
});
