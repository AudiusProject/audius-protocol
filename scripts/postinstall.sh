npm run install-hooks

if [[ -z "${SKIP_POD_INSTALL}" ]]; then
  # Symlink react-native into the mobile package bc npm doesn't
  # support nohoist
  cd packages/mobile/node_modules
  ln -s ../../../node_modules/react-native react-native
  ln -s ../../../node_modules/react-native-code-push react-native-code-push
  cd ../ios
  if command -v bundle >/dev/null; then
    bundle check || bundle install
  fi
  if command -v pod >/dev/null; then
    pod install
  fi
  cd ../../..
fi

if [[ -z "${CI}" ]]; then
  ./dev-tools/setup.sh
fi
