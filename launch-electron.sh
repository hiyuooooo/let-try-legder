#!/bin/bash

echo "🖥️  Multi-Account Ledger - Electron Desktop App"
echo "=================================================="

# Check if Linux unpacked version exists
if [ -d "dist/packages/linux-unpacked" ]; then
    echo "✅ Linux Electron app found"
    echo "🚀 Launching Multi-Account Ledger..."
    cd "dist/packages/linux-unpacked"
    ./"Multi-Account Ledger"
elif [ -d "dist/packages/win-unpacked" ]; then
    echo "✅ Windows Electron app found"
    echo "🚀 Launching Multi-Account Ledger..."
    cd "dist/packages/win-unpacked"
    ./"Multi-Account Ledger.exe"
else
    echo "❌ No Electron app found. Please run: npm run pack"
    exit 1
fi
