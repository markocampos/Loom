#!/bin/bash
set -e

echo "Building Loom APK..."

# 1. Build web app
echo "Step 1: Building web assets..."
npm run build

# 2. Sync to Capacitor
echo "Step 2: Syncing to Capacitor..."
npx cap sync android

# 3. Build APK (if Android SDK available)
if command -v java &> /dev/null; then
  echo "Step 3: Building Android APK..."
  cd android && ./gradlew assembleDebug
  echo "APK: android/app/build/outputs/apk/debug/app-debug.apk"
else
  echo "Step 3: Skipped (Java/Android SDK not found)"
  echo "To build APK, install Android SDK and run: cd android && ./gradlew assembleDebug"
fi

echo "Done!"
