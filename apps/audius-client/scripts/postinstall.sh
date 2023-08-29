npm run patch-package
npm run build
npm run install-hooks
# Symlink react-native into the mobile package bc npm doesn't
# support nohoist
cd packages/mobile/node_modules
ln -s ../../../node_modules/react-native react-native
cd ../ios
if command -v pod >/dev/null; then
  pod install
fi
