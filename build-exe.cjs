#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

console.log('🔨 Multi-Account Ledger EXE Builder');
console.log('====================================\n');

function runCommand(command, description) {
  return new Promise((resolve, reject) => {
    console.log(`📦 ${description}...`);
    const process = exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`❌ Error: ${error.message}`);
        reject(error);
        return;
      }
      if (stderr && !stderr.includes('deprecated') && !stderr.includes('warn')) {
        console.warn(`⚠️  Warning: ${stderr}`);
      }
      console.log(`✅ ${description} completed`);
      if (stdout.trim()) {
        console.log(`   ${stdout.trim().split('\n').join('\n   ')}`);
      }
      resolve(stdout);
    });
  });
}

async function createEXEPackage() {
  try {
    console.log('🏗️  Building application for EXE packaging...\n');

    // Create dist directories
    const dirs = ['dist/exe-package', 'dist/exe-package/source', 'dist/exe-package/build'];
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`📁 Created directory: ${dir}`);
      }
    });

    // Step 1: Build web application
    console.log('\n🌐 Building web application...');
    await runCommand('npm run build:web', 'Building optimized web application');

    // Step 2: Build Electron components
    console.log('\n🖥️  Preparing Electron components...');
    await runCommand('npm run build:electron', 'Building Electron main process');

    // Step 3: Copy source files
    console.log('\n📁 Copying source files...');
    
    const sourceFiles = [
      'package.json',
      'electron.js',
      'preload.js',
      'client',
      'shared',
      'public',
      'dist/web',
      'dist/electron'
    ];

    for (const file of sourceFiles) {
      if (fs.existsSync(file)) {
        const destPath = `dist/exe-package/source/${path.basename(file)}`;
        if (fs.statSync(file).isDirectory()) {
          await runCommand(`cp -r "${file}" "${destPath}"`, `Copying ${file}`);
        } else {
          await runCommand(`cp "${file}" "${destPath}"`, `Copying ${file}`);
        }
      }
    }

    // Step 4: Create production package.json
    console.log('\n📦 Creating production package.json...');
    
    const originalPackage = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const exePackage = {
      name: 'multi-account-ledger-exe',
      version: originalPackage.version || '1.0.0',
      description: 'Multi-Account Ledger Desktop Application',
      main: 'dist/electron/electron.js',
      homepage: './',
      author: 'Multi-Account Ledger Team',
      license: 'MIT',
      scripts: {
        start: 'electron .',
        build: 'npm run build:web && npm run build:electron',
        'build:web': 'vite build --config vite.config.web.ts',
        'build:electron': 'node -e "const fs=require(\'fs\');fs.mkdirSync(\'dist/electron\',{recursive:true});fs.copyFileSync(\'electron.js\',\'dist/electron/electron.js\');fs.copyFileSync(\'preload.js\',\'dist/electron/preload.js\');"',
        pack: 'electron-builder --dir',
        dist: 'electron-builder',
        'dist:win': 'electron-builder --win',
        'dist:mac': 'electron-builder --mac',
        'dist:linux': 'electron-builder --linux'
      },
      dependencies: {
        'electron': '^latest'
      },
      devDependencies: {
        'electron-builder': '^latest',
        'vite': '^latest',
        '@vitejs/plugin-react-swc': '^latest'
      },
      build: {
        appId: 'com.ledger.multiaccountapp',
        productName: 'Multi-Account Ledger',
        copyright: 'Copyright © 2024 Multi-Account Ledger',
        directories: {
          output: 'dist/packages'
        },
        files: [
          'dist/web/**/*',
          'dist/electron/**/*',
          'preload.js',
          'package.json'
        ],
        extraResources: [
          {
            from: 'dist/web',
            to: 'web',
            filter: ['**/*']
          }
        ],
        win: {
          target: [
            {
              target: 'nsis',
              arch: ['x64', 'ia32']
            },
            {
              target: 'portable',
              arch: ['x64', 'ia32']
            }
          ],
          icon: 'public/icon.ico'
        },
        mac: {
          target: [
            {
              target: 'dmg',
              arch: ['x64', 'arm64']
            }
          ],
          icon: 'public/icon.icns',
          category: 'public.app-category.finance'
        },
        linux: {
          target: [
            {
              target: 'AppImage',
              arch: ['x64']
            },
            {
              target: 'deb',
              arch: ['x64']
            }
          ],
          icon: 'public/icon.png',
          category: 'Office'
        },
        nsis: {
          oneClick: false,
          allowToChangeInstallationDirectory: true,
          createDesktopShortcut: true,
          createStartMenuShortcut: true
        }
      }
    };

    fs.writeFileSync('dist/exe-package/package.json', JSON.stringify(exePackage, null, 2));
    console.log('✅ Created production package.json');

    // Step 5: Create build instructions
    console.log('\n📋 Creating build instructions...');
    
    const buildInstructions = `# Multi-Account Ledger EXE Build Instructions

## 🎯 Quick Start (Windows)

### Prerequisites
1. **Node.js 18+** - Download from https://nodejs.org
2. **Git** (optional) - For cloning repositories

### Build Steps

#### Option 1: Automatic Build (Recommended)
\`\`\`bash
# 1. Navigate to this directory
cd multi-account-ledger-exe

# 2. Install dependencies
npm install

# 3. Build the application
npm run build

# 4. Create EXE installer
npm run dist:win
\`\`\`

#### Option 2: Manual Build
\`\`\`bash
# 1. Install dependencies
npm install

# 2. Install electron-builder globally
npm install -g electron-builder

# 3. Build web application
npm run build:web

# 4. Build electron components  
npm run build:electron

# 5. Create Windows EXE
electron-builder --win
\`\`\`

## 📦 Output Files

After building, you'll find:
- **EXE Installer**: \`dist/packages/Multi-Account Ledger Setup.exe\`
- **Portable EXE**: \`dist/packages/Multi-Account Ledger.exe\`
- **Development Build**: \`dist/packages/win-unpacked/Multi-Account Ledger.exe\`

## 🔧 Customization

### Change App Name
Edit \`package.json\`:
\`\`\`json
{
  "build": {
    "productName": "Your App Name"
  }
}
\`\`\`

### Change Icons
Replace these files:
- \`public/icon.ico\` (Windows)
- \`public/icon.icns\` (macOS) 
- \`public/icon.png\` (Linux)

### Build Settings
Edit the \`build\` section in \`package.json\` to customize:
- Target platforms
- File associations
- Installer options
- Code signing

## 🚀 Distribution

### Windows
- **NSIS Installer**: Full installer with start menu shortcuts
- **Portable**: Single EXE file, no installation required

### macOS
- **DMG**: Disk image for macOS distribution
- **ZIP**: Archive with app bundle

### Linux
- **AppImage**: Universal Linux executable
- **DEB**: Debian/Ubuntu package
- **RPM**: Red Hat/Fedora package

## 🛠️ Troubleshooting

### Build Fails
1. Update Node.js to latest LTS version
2. Clear npm cache: \`npm cache clean --force\`
3. Delete node_modules and reinstall: \`rm -rf node_modules && npm install\`

### EXE Not Starting
1. Check Windows Defender/antivirus
2. Run as administrator
3. Check console output: Run from Command Prompt

### Code Signing (Optional)
For production releases, add code signing:
\`\`\`json
{
  "build": {
    "win": {
      "certificateFile": "path/to/certificate.p12",
      "certificatePassword": "password"
    }
  }
}
\`\`\`

## 📞 Support

If you encounter issues:
1. Check this README
2. Verify system requirements
3. Test with development build first: \`npm run pack\`

---
Built with ❤️ using Electron and React
`;

    fs.writeFileSync('dist/exe-package/BUILD-INSTRUCTIONS.md', buildInstructions);
    console.log('✅ Created build instructions');

    // Step 6: Create vite config for EXE build
    console.log('\n⚙️  Creating Vite configuration...');
    
    const viteConfig = `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  base: "./",
  build: {
    outDir: "dist/web",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "index.html"),
      },
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          ui: ["@radix-ui/react-tabs", "@radix-ui/react-select"],
          utils: ["jspdf", "xlsx", "date-fns"],
        },
      },
    },
    target: "esnext",
    minify: "terser",
    sourcemap: false,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
  define: {
    __STANDALONE_MODE__: true,
  },
});
`;

    fs.writeFileSync('dist/exe-package/vite.config.web.ts', viteConfig);
    console.log('✅ Created Vite configuration');

    // Step 7: Create index.html for EXE
    console.log('\n📄 Creating HTML template...');
    
    const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Multi-Account Ledger</title>
    <meta name="description" content="Professional multi-account ledger management system">
    <style>
        body { margin: 0; padding: 0; font-family: system-ui, sans-serif; }
        #root { min-height: 100vh; }
        .loading {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
    </style>
</head>
<body>
    <div id="root">
        <div class="loading">
            <div style="text-align: center;">
                <h1>📊 Multi-Account Ledger</h1>
                <p>Loading application...</p>
            </div>
        </div>
    </div>
    <script type="module" src="/client/App.tsx"></script>
</body>
</html>`;

    fs.writeFileSync('dist/exe-package/index.html', indexHtml);
    console.log('✅ Created HTML template');

    // Step 8: Create Windows batch file for easy building
    console.log('\n🪟 Creating Windows build script...');
    
    const windowsBuild = `@echo off
echo Multi-Account Ledger EXE Builder
echo ================================

echo.
echo Installing dependencies...
call npm install

echo.
echo Building application...
call npm run build

echo.
echo Creating Windows EXE...
call npm run dist:win

echo.
echo Build complete! Check dist/packages/ for output files.
echo.
pause
`;

    fs.writeFileSync('dist/exe-package/build-windows.bat', windowsBuild);
    console.log('✅ Created Windows build script');

    // Step 9: Create final package info
    console.log('\n📋 Creating package information...');
    
    const packageInfo = {
      name: 'Multi-Account Ledger EXE Package',
      version: '1.0.0',
      description: 'Complete package for building Windows EXE',
      buildDate: new Date().toISOString(),
      contents: {
        'package.json': 'Production-ready package configuration',
        'BUILD-INSTRUCTIONS.md': 'Complete build instructions',
        'build-windows.bat': 'Windows batch file for easy building',
        'vite.config.web.ts': 'Vite configuration for building',
        'index.html': 'HTML template for the application',
        'source/': 'Complete source code and assets'
      },
      requirements: {
        nodejs: '18.0.0 or higher',
        npm: '8.0.0 or higher',
        os: 'Windows 10/11, macOS 10.14+, Ubuntu 18.04+'
      },
      buildOutputs: {
        windows: 'Multi-Account Ledger Setup.exe (installer)',
        portable: 'Multi-Account Ledger.exe (portable)',
        development: 'win-unpacked/ (development build)'
      },
      features: [
        'Complete multi-account ledger system',
        'Good in Cart tracking',
        'PDF/Excel export functionality',
        'Offline capability',
        'Professional desktop integration'
      ]
    };

    fs.writeFileSync('dist/exe-package/PACKAGE-INFO.json', JSON.stringify(packageInfo, null, 2));
    console.log('✅ Created package information');

    // Step 10: Create download script
    console.log('\n📥 Creating download helper...');
    
    const downloadHelper = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Download Multi-Account Ledger EXE Package</title>
    <style>
        body {
            font-family: system-ui, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            min-height: 100vh;
        }
        .container {
            background: rgba(255,255,255,0.1);
            padding: 30px;
            border-radius: 12px;
            backdrop-filter: blur(10px);
        }
        h1 { text-align: center; }
        .download-btn {
            display: block;
            width: 100%;
            padding: 15px;
            background: #10b981;
            color: white;
            text-decoration: none;
            border-radius: 8px;
            text-align: center;
            font-weight: bold;
            margin: 10px 0;
            border: none;
            cursor: pointer;
            font-size: 16px;
        }
        .download-btn:hover { background: #059669; }
        .instructions {
            background: rgba(255,255,255,0.1);
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>📦 Multi-Account Ledger EXE Package</h1>
        
        <div class="instructions">
            <h3>📋 What You'll Get:</h3>
            <ul>
                <li>Complete source code</li>
                <li>Build scripts and configuration</li>
                <li>Step-by-step instructions</li>
                <li>Windows EXE builder tools</li>
            </ul>
        </div>

        <button onclick="downloadPackage()" class="download-btn">
            📥 Download Complete EXE Package
        </button>

        <div class="instructions">
            <h3>🚀 Quick Start:</h3>
            <ol>
                <li>Download and extract the package</li>
                <li>Install Node.js from nodejs.org</li>
                <li>Run build-windows.bat (Windows) or follow BUILD-INSTRUCTIONS.md</li>
                <li>Find your EXE in dist/packages/</li>
            </ol>
        </div>
    </div>

    <script>
        function downloadPackage() {
            // This would trigger the download of the complete package
            alert('Complete EXE package ready for download!\\n\\nIncludes:\\n- Source code\\n- Build tools\\n- Instructions\\n- Configuration files');
        }
    </script>
</body>
</html>`;

    fs.writeFileSync('dist/exe-package/download.html', downloadHelper);
    console.log('✅ Created download helper');

    console.log('\n🎉 EXE Package Creation Complete!');
    console.log('==================================');
    console.log('\n📁 Package Location: dist/exe-package/');
    console.log('\n📦 Package Contents:');
    console.log('  📄 package.json - Production build configuration');
    console.log('  📋 BUILD-INSTRUCTIONS.md - Complete build guide');
    console.log('  🪟 build-windows.bat - Windows build script');
    console.log('  ⚙️  vite.config.web.ts - Build configuration');
    console.log('  📄 index.html - Application template');
    console.log('  📁 source/ - Complete source code');
    console.log('  📋 PACKAGE-INFO.json - Package information');
    console.log('  📥 download.html - Download helper page');
    console.log('\n🎯 Next Steps:');
    console.log('  1. Copy the dist/exe-package/ folder');
    console.log('  2. Install Node.js on target machine');
    console.log('  3. Run build-windows.bat or follow BUILD-INSTRUCTIONS.md');
    console.log('  4. Find your EXE in dist/packages/');

  } catch (error) {
    console.error('\n❌ EXE Package creation failed:', error.message);
    process.exit(1);
  }
}

// Run the build
createEXEPackage();
