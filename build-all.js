#!/usr/bin/env node

const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("🚀 Multi-Account Ledger Build Script");
console.log("=====================================\n");

const platforms = {
  web: "Local Web (Standalone)",
  electron: "Desktop Apps (Windows, macOS, Linux)",
  android: "PWA for Android",
  ios: "PWA for iOS",
};

function runCommand(command, description) {
  return new Promise((resolve, reject) => {
    console.log(`📦 ${description}...`);
    const process = exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`❌ Error: ${error.message}`);
        reject(error);
        return;
      }
      if (stderr) {
        console.warn(`⚠️  Warning: ${stderr}`);
      }
      console.log(`✅ ${description} completed`);
      resolve(stdout);
    });

    process.stdout.on("data", (data) => {
      // Show real-time output for long-running commands
      if (data.toString().trim()) {
        console.log(`   ${data.toString().trim()}`);
      }
    });
  });
}

async function createBuildDirectories() {
  const dirs = ["dist/packages", "dist/web", "dist/electron"];
  dirs.forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`📁 Created directory: ${dir}`);
    }
  });
}

async function buildWeb() {
  console.log("\n🌐 Building Local Web Version");
  console.log("------------------------------");

  await runCommand("npm run build:web", "Building web assets");

  // Create a simple launcher HTML
  const launcherHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Multi-Account Ledger - Launcher</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 40px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container {
            text-align: center;
            max-width: 600px;
        }
        h1 { font-size: 2.5rem; margin-bottom: 1rem; }
        p { font-size: 1.2rem; margin-bottom: 2rem; opacity: 0.9; }
        .button {
            display: inline-block;
            padding: 15px 30px;
            background: white;
            color: #333;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 1.1rem;
            transition: transform 0.2s;
        }
        .button:hover { transform: translateY(-2px); }
        .info {
            margin-top: 3rem;
            padding: 20px;
            background: rgba(255,255,255,0.1);
            border-radius: 8px;
            text-align: left;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Multi-Account Ledger</h1>
        <p>Professional ledger management system with multi-account support</p>
        <a href="index.html" class="button">Launch Application</a>
        
        <div class="info">
            <h3>🚀 Features:</h3>
            <ul>
                <li>Multi-account ledger management</li>
                <li>Good in Cart tracking</li>
                <li>PDF & Excel export</li>
                <li>Offline functionality</li>
                <li>Responsive design</li>
            </ul>
            
            <h3>📱 Installation:</h3>
            <p>For mobile devices, tap the browser menu and select "Add to Home Screen" to install as an app.</p>
        </div>
    </div>
</body>
</html>
  `;

  fs.writeFileSync("dist/web/launcher.html", launcherHTML);
  console.log("✅ Created launcher page");
}

async function buildElectron() {
  console.log("\n🖥️  Building Desktop Applications");
  console.log("----------------------------------");

  await runCommand("npm run build:electron", "Building Electron app");

  console.log("\n📦 Creating distribution packages...");

  // Build for current platform first
  await runCommand("npm run pack", "Creating development package");

  // Build distributables for all platforms
  console.log("\n🏗️  Building platform-specific packages...");

  try {
    await runCommand("npm run dist:win", "Building Windows executable");
  } catch (error) {
    console.log("⚠️  Windows build skipped (requires Windows or Wine)");
  }

  try {
    await runCommand("npm run dist:mac", "Building macOS application");
  } catch (error) {
    console.log("⚠️  macOS build skipped (requires macOS)");
  }

  try {
    await runCommand("npm run dist:linux", "Building Linux packages");
  } catch (error) {
    console.log("⚠️  Linux build skipped");
  }
}

async function createDocumentation() {
  console.log("\n📚 Creating Documentation");
  console.log("-------------------------");

  const readmeContent = `# Multi-Account Ledger - Distribution Package

## Available Builds

### 🌐 Web Version (Standalone)
- **Location**: \`dist/web/\`
- **Usage**: Open \`launcher.html\` in any modern web browser
- **Features**: 
  - Fully offline capable
  - PWA installable on mobile devices
  - Local data storage
  - No server required

### 🖥️ Desktop Applications
- **Location**: \`dist/packages/\`
- **Platforms**: Windows (.exe), macOS (.dmg), Linux (.AppImage, .deb, .rpm)
- **Features**:
  - Native desktop integration
  - System file dialogs
  - Auto-updater support
  - Offline operation

### 📱 Mobile Installation (PWA)
1. Open the web version on your mobile device
2. Tap browser menu (⋮ or share button)
3. Select "Add to Home Screen" or "Install App"
4. App will appear on your home screen like a native app

## Installation Instructions

### Web Version
1. Extract the package to any folder
2. Open \`dist/web/launcher.html\` in your browser
3. Click "Launch Application"

### Desktop Version
1. Go to \`dist/packages/\`
2. Choose your platform:
   - **Windows**: Run the \`.exe\` installer
   - **macOS**: Open the \`.dmg\` file and drag to Applications
   - **Linux**: Install \`.deb\`, \`.rpm\`, or run \`.AppImage\`

### Mobile (PWA)
1. Open the web version on your mobile browser
2. Follow the browser prompts to install
3. Access from home screen

## System Requirements

### Minimum Requirements
- **Web**: Modern browser (Chrome 80+, Firefox 75+, Safari 13+, Edge 80+)
- **Desktop**: Windows 10/macOS 10.14/Ubuntu 18.04 or newer
- **Mobile**: iOS 13+ or Android 8+

### Recommended
- 4GB RAM
- 100MB free disk space
- Internet connection for initial setup (offline afterward)

## Features

- ✅ Multi-account ledger management
- ✅ Good in Cart tracking and reporting
- ✅ PDF export (A4/A5 formats)
- ✅ Excel export with formulas
- ✅ Monthly net total calculations
- ✅ Cumulative reporting
- ✅ Data import/export
- ✅ Offline functionality
- ✅ Responsive design
- ✅ Multi-platform support

## Data Storage

- **Web/PWA**: Browser local storage (persistent)
- **Desktop**: Application data folder
- **Backup**: JSON export/import available

## Support

For technical support or feature requests, please contact the development team.

---
Built with ❤️ using React, Electron, and modern web technologies.
`;

  fs.writeFileSync("README-DISTRIBUTION.md", readmeContent);
  console.log("✅ Created distribution documentation");
}

async function main() {
  try {
    await createBuildDirectories();
    await buildWeb();
    await buildElectron();
    await createDocumentation();

    console.log("\n🎉 Build Complete!");
    console.log("==================");
    console.log("\n📦 Distribution packages created:");
    console.log("  🌐 Web: dist/web/");
    console.log("  🖥️  Desktop: dist/packages/");
    console.log("  📚 Documentation: README-DISTRIBUTION.md");
    console.log("\n✨ Ready for distribution!");
  } catch (error) {
    console.error("\n❌ Build failed:", error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { buildWeb, buildElectron, createDocumentation };
