# Multi-Account Ledger - Deployment Guide 📦

Your Multi-Account Ledger application has been successfully built and packaged! Here are all the ways to run it:

## 🌐 Web Application (Local Hosting)

### Option 1: Simple HTTP Server

```bash
# Start the local server
node serve-local.js
```

Then open: http://localhost:3000

### Option 2: Using Python (if available)

```bash
cd dist/web
python3 -m http.server 8000
```

Then open: http://localhost:8000

### Option 3: Using Node.js serve

```bash
npx serve dist/web -s -l 3000
```

## 🖥️ Desktop Application (Electron)

### Current Available Packages:

#### Linux (Unpacked)

- **Location**: `dist/packages/linux-unpacked/`
- **Executable**: `Multi-Account Ledger`
- **Run Command**:
  ```bash
  cd "dist/packages/linux-unpacked"
  ./Multi-Account\ Ledger
  ```

#### Windows (Unpacked)

- **Location**: `dist/packages/win-unpacked/`
- **Executable**: `Multi-Account Ledger.exe`
- **Run Command**:
  ```bash
  cd "dist/packages/win-unpacked"
  ./Multi-Account\ Ledger.exe
  ```

### Quick Launch Scripts:

#### For Linux/Mac:

```bash
# Make executable (run once)
chmod +x launch-electron.sh

# Launch the app
./launch-electron.sh
```

#### For Windows:

```cmd
cd "dist/packages/win-unpacked"
"Multi-Account Ledger.exe"
```

## 📋 Features Available in All Versions:

✅ **Complete Accounting System**

- Multi-account ledger management
- Bill and Cash tracking with comma formatting
- Date validation (dd/mm/yyyy format)
- Profit/Loss calculations
- Monthly summaries with previous totals

✅ **Keyboard Shortcuts**

- **1-4**: Switch between tabs
- **Ctrl + ← →**: Navigate form fields
- **Enter**: Submit entries
- Date field accepts only numbers and "/"

✅ **Data Export**

- Excel export with formatting
- PDF export (A4/A5)
- Print functionality

✅ **Data Management**

- Import from Excel
- Automatic backups
- Data validation
- Good in Cart tracking

## 🔧 Building Additional Packages

### Create Installable Packages:

#### Windows Installer (requires Wine on Linux):

```bash
npm run dist:win
```

#### Linux AppImage/DEB/RPM:

```bash
npm run dist:linux
```

#### macOS DMG (requires macOS):

```bash
npm run dist:mac
```

## 📁 File Structure:

```
dist/
├── web/                     # Web application files
│   ├── index.html
│   ├── assets/
│   └── ...
├── packages/
│   ├── linux-unpacked/     # Linux Electron app
│   │   └── Multi-Account Ledger
│   ├── win-unpacked/       # Windows Electron app
│   │   └── Multi-Account Ledger.exe
│   └── ...
└── electron/               # Electron main files
    ├── electron.cjs
    └── preload.js
```

## 🚀 Quick Start:

### For Web Version:

1. Run: `node serve-local.js`
2. Open: http://localhost:3000
3. Start using the ledger!

### For Desktop Version:

1. Navigate to appropriate platform folder
2. Run the executable
3. Desktop app with full features!

## 💡 Tips:

- **Data Storage**: All data is stored locally (web: localStorage, desktop: local files)
- **No Internet Required**: Works completely offline
- **Cross-Platform**: Same features across all platforms
- **Responsive Design**: Works on mobile browsers too

## 🔒 Security:

- All data stays on your device
- No external connections required
- Complete privacy and control

Your Multi-Account Ledger is ready to use! 🎉
