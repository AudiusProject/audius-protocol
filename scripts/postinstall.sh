npm run patch-package

npm run build
npm run install-hooks

if [[ -z "${SKIP_POD_INSTALL}" ]]; then
  # Symlink react-native into the mobile package bc npm doesn't
  # support nohoist
  cd apps/mobile/node_modules
  ln -s ../../../node_modules/react-native react-native
  cd ../ios
  if command -v pod >/dev/null; then
    pod install
  fi
fi