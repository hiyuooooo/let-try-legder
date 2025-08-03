# 🚀 Multi-Account Ledger Deployment Guide

This guide covers deploying the Multi-Account Ledger application across all platforms: PC executable, local web, and mobile PWA.

## 📋 Quick Start

### Option 1: Automated Build (Recommended)

```bash
node build-all.js
```

### Option 2: Manual Build Steps

```bash
# 1. Web version (standalone)
npm run build:web

# 2. Desktop applications
npm run build:electron
npm run dist

# 3. Platform-specific builds
npm run dist:win    # Windows
npm run dist:mac    # macOS
npm run dist:linux  # Linux
```

## 🌐 Web Deployment (Standalone)

### Local Deployment

1. Run: `npm run build:web`
2. Copy `dist/web/` contents to any web server
3. Open `index.html` in any modern browser
4. For local use, simply double-click `launcher.html`

### Web Server Deployment

```bash
# Copy to web server
cp -r dist/web/* /var/www/html/ledger/

# Or serve locally
cd dist/web && python -m http.server 8000
```

### Features

- ✅ Fully offline capable after first load
- ✅ PWA installable on mobile
- ✅ Local data storage
- ✅ No server dependencies

## 🖥️ Desktop Deployment (Electron)

### Prerequisites

```bash
# Install dependencies
npm install

# Install Electron builder globally (optional)
npm install -g electron-builder
```

### Build Commands

```bash
# Development
npm run electron:dev

# Production builds
npm run dist:win    # Windows (.exe, .msi)
npm run dist:mac    # macOS (.dmg, .app)
npm run dist:linux  # Linux (.AppImage, .deb, .rpm)
```

### Distribution Files

After building, find packages in `dist/packages/`:

- **Windows**: `Multi-Account Ledger Setup.exe`
- **macOS**: `Multi-Account Ledger.dmg`
- **Linux**: `Multi-Account Ledger.AppImage`, `.deb`, `.rpm`

### Installation

1. **Windows**: Run `.exe` installer
2. **macOS**: Open `.dmg` and drag to Applications
3. **Linux**: Install package or run `.AppImage`

## 📱 Mobile Deployment (PWA)

### PWA Installation

1. Open web version on mobile browser
2. Browser will show "Add to Home Screen" prompt
3. Tap "Install" or "Add to Home Screen"
4. App appears on home screen like native app

### Manual Installation

1. **iOS Safari**:
   - Tap Share button → "Add to Home Screen"
2. **Android Chrome**:
   - Tap Menu (⋮) → "Add to Home Screen"
3. **Samsung Internet**:
   - Tap Menu → "Add page to" → "Home screen"

### PWA Features

- ✅ Offline functionality
- ✅ Home screen icon
- ✅ Full-screen experience
- ✅ App-like navigation
- ✅ Background sync (when available)

## 🔧 Configuration Options

### Environment Variables

```bash
# Development
NODE_ENV=development

# Production
NODE_ENV=production
```

### Build Customization

Edit `package.json` → `build` section:

```json
{
  "build": {
    "appId": "com.yourcompany.ledger",
    "productName": "Your Ledger App",
    "directories": {
      "output": "dist/packages"
    }
  }
}
```

### Icon Generation

1. Open `generate-icons.html` in browser
2. Download all required icon sizes
3. Place in `public/` folder
4. For Electron, convert to platform formats:
   - Windows: `.ico` (use online converter)
   - macOS: `.icns` (use online converter)
   - Linux: `.png` (already compatible)

## 📊 Platform Support Matrix

| Platform    | Format                | Auto-update | Offline | Install Size |
| ----------- | --------------------- | ----------- | ------- | ------------ |
| Windows     | .exe, .msi            | ✅          | ✅      | ~150MB       |
| macOS       | .dmg, .app            | ✅          | ✅      | ~150MB       |
| Linux       | .AppImage, .deb, .rpm | ✅          | ✅      | ~150MB       |
| Web         | HTML/JS               | ❌          | ✅      | ~5MB         |
| iOS PWA     | PWA                   | ❌          | ✅      | ~5MB         |
| Android PWA | PWA                   | ❌          | ✅      | ~5MB         |

## 🛠️ Troubleshooting

### Common Issues

#### Build Fails on Windows

```bash
# Install Windows Build Tools
npm install --global windows-build-tools
```

#### macOS Code Signing

```bash
# Skip code signing for development
export CSC_IDENTITY_AUTO_DISCOVERY=false
npm run dist:mac
```

#### Linux Dependencies

```bash
# Ubuntu/Debian
sudo apt-get install libnss3-dev libatk-bridge2.0-dev libdrm2-dev libxcomposite-dev libxdamage-dev libxrandr-dev libgbm-dev libxss-dev libasound2-dev

# CentOS/RHEL
sudo yum install nss atk at-spi2-atk libdrm libXcomposite libXdamage libXrandr mesa-libgbm libXScrnSaver alsa-lib
```

#### PWA Installation Issues

1. Ensure HTTPS (or localhost for testing)
2. Check manifest.json validity
3. Verify service worker registration
4. Clear browser cache and try again

### Performance Optimization

#### Web Version

- Assets are automatically minified
- Lazy loading implemented
- Service worker caches resources
- Local storage for data persistence

#### Desktop Version

- Native performance
- OS integration
- System notifications
- File system access

#### Mobile PWA

- Touch-optimized interface
- Responsive design
- Gesture support
- Offline sync

## 📦 Distribution Checklist

### Before Release

- [ ] Update version in `package.json`
- [ ] Test all platforms
- [ ] Generate all required icons
- [ ] Update changelog
- [ ] Create release notes

### Build Process

- [ ] Clean previous builds: `rm -rf dist/`
- [ ] Run full build: `node build-all.js`
- [ ] Test generated packages
- [ ] Verify file sizes
- [ ] Check all features work offline

### Distribution

- [ ] Upload web version to hosting
- [ ] Distribute desktop installers
- [ ] Test PWA installation
- [ ] Update download links
- [ ] Notify users of new version

## 🚀 CI/CD Integration

### GitHub Actions Example

```yaml
name: Build and Release
on:
  push:
    tags: ["v*"]
jobs:
  build:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: "18"
      - run: npm install
      - run: npm run dist
      - uses: actions/upload-artifact@v2
        with:
          name: packages-${{ matrix.os }}
          path: dist/packages/
```

## 📞 Support

For deployment issues:

1. Check this guide
2. Review error logs
3. Test on clean environment
4. Contact development team

---

**Built with ❤️ for cross-platform deployment**
