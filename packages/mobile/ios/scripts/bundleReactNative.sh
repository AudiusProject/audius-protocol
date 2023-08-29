export NODE_BINARY=node 
export SENTRY_PROPERTIES=sentry.properties 
export EXTRA_PACKAGER_ARGS=\"--sourcemap-output $DERIVED_FILE_DIR/main.jsbundle.map\" 
export PROJECT_ROOT=$PWD/.. 
 
cp ../node_modules/@sentry/cli/bin/sentry-cli .
sentry-cli react-native xcode ../../../node_modules/react-native/scripts/react-native-xcode.sh 