export SENTRY_PROPERTIES=sentry.properties
export EXTRA_PACKAGER_ARGS=\"--sourcemap-output $DERIVED_FILE_DIR/main.jsbundle.map\"
export NODE_BINARY=node
if [[ -z "${SENTRY_BINARY}" ]]; then
  export SENTRY_BINARY=../node_modules/@sentry/cli/bin/sentry-cli
fi
$SENTRY_BINARY react-native xcode ../node_modules/react-native/scripts/react-native-xcode.sh