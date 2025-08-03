#!/usr/bin/env node

const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("🚀 Multi-Account Ledger Simple Build");
console.log("=====================================\n");

function runCommand(command, description) {
  return new Promise((resolve, reject) => {
    console.log(`📦 ${description}...`);
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`❌ Error: ${error.message}`);
        reject(error);
        return;
      }
      if (
        stderr &&
        !stderr.includes("deprecated") &&
        !stderr.includes("warn")
      ) {
        console.warn(`⚠️  Warning: ${stderr}`);
      }
      console.log(`✅ ${description} completed`);
      resolve(stdout);
    });
  });
}

async function createDirectories() {
  const dirs = ["dist/packages", "dist/web", "dist/electron"];
  dirs.forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`📁 Created directory: ${dir}`);
    }
  });
}

async function createLauncher() {
  const launcherContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Multi-Account Ledger</title>
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
            padding: 40px;
            background: rgba(255,255,255,0.1);
            border-radius: 20px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.2);
        }
        h1 { font-size: 2.5rem; margin-bottom: 1rem; }
        p { font-size: 1.2rem; margin-bottom: 2rem; opacity: 0.9; }
        .button {
            display: inline-block;
            padding: 15px 30px;
            background: white;
            color: #333;
            text-decoration: none;
            border-radius: 12px;
            font-weight: 600;
            font-size: 1.1rem;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        }
        .button:hover { 
            transform: translateY(-2px); 
            box-shadow: 0 6px 20px rgba(0,0,0,0.3);
        }
        .features {
            margin-top: 3rem;
            text-align: left;
            background: rgba(255,255,255,0.1);
            padding: 20px;
            border-radius: 12px;
        }
        .feature {
            margin: 10px 0;
            padding: 8px 0;
            border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        .feature:last-child { border-bottom: none; }
        .install-btn {
            margin: 10px;
            padding: 10px 20px;
            background: rgba(255,255,255,0.2);
            border: 1px solid rgba(255,255,255,0.3);
            color: white;
            text-decoration: none;
            border-radius: 8px;
            font-size: 0.9rem;
            transition: all 0.3s ease;
        }
        .install-btn:hover {
            background: rgba(255,255,255,0.3);
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>📊 Multi-Account Ledger</h1>
        <p>Professional multi-account ledger management system</p>
        <a href="index.html" class="button">🚀 Launch Application</a>
        
        <div class="features">
            <h3>✨ Features:</h3>
            <div class="feature">📈 Multi-account management</div>
            <div class="feature">🛒 Good in Cart tracking</div>
            <div class="feature">📄 PDF & Excel export</div>
            <div class="feature">💾 Offline functionality</div>
            <div class="feature">📱 Mobile responsive</div>
            <div class="feature">🔒 Local data storage</div>
        </div>

        <div style="margin-top: 30px;">
            <h3>📱 Install as App:</h3>
            <a href="#" class="install-btn" onclick="installPWA()">Install on Mobile/Desktop</a>
        </div>
    </div>

    <script>
        let deferredPrompt;

        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
        });

        function installPWA() {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                deferredPrompt.userChoice.then((choiceResult) => {
                    if (choiceResult.outcome === 'accepted') {
                        console.log('User accepted the install prompt');
                    }
                    deferredPrompt = null;
                });
            } else {
                alert('To install:\\n\\n📱 Mobile: Tap browser menu → "Add to Home Screen"\\n🖥️ Desktop: Look for install icon in address bar');
            }
        }
    </script>
</body>
</html>`;

  fs.writeFileSync("dist/web/launcher.html", launcherContent);
  console.log("✅ Created launcher page");
}

async function main() {
  try {
    console.log("🏗️  Creating build directories...");
    await createDirectories();

    console.log("\n🌐 Building web version...");
    await runCommand(
      "npm run build:web",
      "Building standalone web application",
    );

    console.log("\n🖥️  Building Electron version...");
    await runCommand("npm run build:electron", "Building desktop application");

    console.log("\n🎨 Creating launcher...");
    await createLauncher();

    console.log("\n🎉 Build Complete!");
    console.log("==================");
    console.log("\n📦 Generated files:");
    console.log("  🌐 Web App: dist/web/ (open launcher.html)");
    console.log("  🖥️  Desktop: Ready for electron-builder");
    console.log("\n💡 Next steps:");
    console.log("  • Open dist/web/launcher.html for web version");
    console.log('  • Run "npm run pack" for desktop development build');
    console.log('  • Run "npm run dist" for desktop production build');
    console.log("  • Open generate-icons.html to create app icons");
  } catch (error) {
    console.error("\n❌ Build failed:", error.message);
    process.exit(1);
  }
}

main();
