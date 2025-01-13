source "${PROJECT_DIR}/.xcode.env"

export PROJECT_ROOT=$PWD/..
export EXTRA_PACKAGER_ARGS=\"--sourcemap-output $DERIVED_FILE_DIR/main.jsbundle.map\" 
export SENTRY_PROPERTIES="${PROJECT_ROOT}/ios/sentry.properties"
 
"$NPM_BINARY" --prefix ../ run sentry-cli -- react-native xcode ../../../node_modules/react-native/scripts/react-native-xcode.sh
