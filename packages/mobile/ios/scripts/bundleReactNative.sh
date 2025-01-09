source "${PROJECT_DIR}/.xcode.env"

export SENTRY_PROPERTIES=sentry.properties 
export EXTRA_PACKAGER_ARGS=\"--sourcemap-output $DERIVED_FILE_DIR/main.jsbundle.map\" 
export PROJECT_ROOT=$PWD/.. 
 
"$NPM_BINARY" --prefix ../ run sentry-cli -- react-native xcode ../../../node_modules/react-native/scripts/react-native-xcode.sh
