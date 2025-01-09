export NODE_BINARY=node 
export SENTRY_PROPERTIES=sentry.properties 
export EXTRA_PACKAGER_ARGS=\"--sourcemap-output $DERIVED_FILE_DIR/main.jsbundle.map\" 
export PROJECT_ROOT=$PWD/.. 
 
npm --prefix ../ run sentry-cli -- react-native xcode ../../../node_modules/react-native/scripts/react-native-xcode.sh 