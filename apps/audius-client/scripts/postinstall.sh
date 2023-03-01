lerna bootstrap --no-ci
npm run build
npm run install-hooks
cd packages/mobile/ios
if command -v pod >/dev/null; then
  pod install
fi
