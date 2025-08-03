# Ledger Management System - Deployment Guide

## 📦 Monthly Net Totals Storage System

The app now includes an optimized monthly totals caching system that:

- **Stores monthly net totals** for each account automatically
- **Improves performance** by caching calculations instead of recalculating every time
- **Updates automatically** when entries are added/modified
- **Cleans up old data** (older than 2 years) automatically
- **Provides fast cumulative totals** for monthly views

### How it works:

1. When entries are saved, monthly totals are calculated and cached
2. Monthly view uses cached totals for instant display
3. Previous totals show cumulative amounts from January to selected month
4. System automatically maintains data integrity

---

## 🚀 Platform Deployment Options

### 1. 💻 Windows Executable (.exe)

**Setup:**

```bash
# Install Electron dependencies
npm install electron electron-builder electron-is-dev

# Copy electron configuration
cp package-config.json package.json

# Build for Windows
npm run build:windows
```

**Output:**

- `dist-electron/LedgerApp-Setup-1.0.0.exe` - Windows installer
- Creates desktop shortcut and start menu entry
- Offline capable with native file system access

### 2. 🌐 Web Application (PWA)

**Setup:**

```bash
# Build web version
npm run build:web

# Deploy to any web server
# Files will be in 'dist/' folder
```

**Features:**

- Progressive Web App (PWA) compatible
- Install on mobile devices via browser
- Offline functionality with service worker
- Responsive design for all screen sizes

**Deployment options:**

- **Netlify:** Drag & drop the `dist` folder
- **Vercel:** Connect GitHub repo for auto-deployment
- **GitHub Pages:** Upload to gh-pages branch
- **Custom server:** Upload dist folder to web root

### 3. 📱 Mobile Application

**Option A: PWA (Recommended)**

```bash
# Already included in web build
# Users can "Add to Home Screen" from browser
```

**Option B: React Native (Advanced)**

```bash
# Create React Native version
npx react-native init LedgerAppMobile
# Port React components to React Native
# Add native features like camera, file system
```

**Option C: Capacitor (Hybrid)**

```bash
npm install @capacitor/core @capacitor/cli
npx cap init
npx cap add android
npx cap add ios
npm run build:web
npx cap copy
npx cap open android
```

### 4. 🐧 Cross-Platform Desktop

**Linux:**

```bash
npm run build:linux
# Output: LedgerApp-1.0.0.AppImage
```

**macOS:**

```bash
npm run build:mac
# Output: LedgerApp-1.0.0.dmg
```

**All platforms:**

```bash
npm run build:all
# Builds Windows, Linux, and macOS versions
```

---

## 📋 Pre-deployment Checklist

### Required Assets:

- [ ] `assets/icon.ico` (Windows icon, 256x256)
- [ ] `assets/icon.png` (Linux icon, 512x512)
- [ ] `assets/icon.icns` (macOS icon, 1024x1024)
- [ ] `public/icon-192.png` (PWA icon, 192x192)
- [ ] `public/icon-512.png` (PWA icon, 512x512)

### Configuration:

- [ ] Update app name, version, and description in package.json
- [ ] Configure build settings in electron-builder
- [ ] Set up signing certificates for production (optional)
- [ ] Test on target platforms before distribution

### Performance Optimizations:

- [ ] Monthly totals caching is enabled ✅
- [ ] Build artifacts are minified ✅
- [ ] Service worker for offline support ✅
- [ ] Responsive design for mobile ✅

---

## 🎯 Recommended Deployment Strategy

1. **Web First:** Deploy as PWA for instant access across all devices
2. **Windows Exe:** For users who prefer desktop applications
3. **Mobile PWA:** Users install via "Add to Home Screen"
4. **Cross-platform:** Use Electron for consistent experience

### Quick Start:

```bash
# 1. Install dependencies
npm install

# 2. Build web version
npm run build:web

# 3. Build Windows executable
npm install electron electron-builder electron-is-dev
npm run build:windows

# 4. Deploy web version to hosting service
# Upload 'dist' folder to your web host
```

Your ledger app will now be available as:

- 🌐 **Web app** at your domain
- 💻 **Windows app** via the .exe installer
- 📱 **Mobile app** via PWA installation
- 🖥️ **Desktop app** on all major platforms

---

## 🔧 Maintenance

- **Monthly totals** are automatically maintained
- **Data backup** system is built-in
- **Updates** can be deployed by replacing web files
- **Desktop apps** can include auto-update functionality
