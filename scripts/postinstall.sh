npm run install-hooks
npm run patch-package

if [[ -z "${SKIP_POD_INSTALL}" ]]; then
  # Symlink react-native into the mobile package bc npm doesn't
  # support nohoist
  cd packages/mobile/node_modules
  ln -s ../../../node_modules/react-native react-native
  ln -s ../../../node_modules/react-native-code-push react-native-code-push
  cd ../ios
  bundle check || bundle install
  if command -v pod >/dev/null; then
    pod install
  fi
  cd ../../..
fi

if [[ -z "${CI}" ]]; then
  ./dev-tools/setup.sh
fi
