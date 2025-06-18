export NODE_BINARY=node 
export SENTRY_PROPERTIES=sentry.properties 
export PROJECT_ROOT=$PWD/.. 
export SENTRY_ALLOW_FAILURE=true
export SENTRY_DISABLE_AUTO_UPLOAD=true

WITH_ENVIRONMENT="../node_modules/react-native/scripts/xcode/with-environment.sh"
REACT_NATIVE_XCODE="../node_modules/react-native/scripts/react-native-xcode.sh"
SENTRY_XCODE="../node_modules/@sentry/react-native/scripts/sentry-xcode.sh"
BUNDLE_REACT_NATIVE="/bin/sh $SENTRY_XCODE $REACT_NATIVE_XCODE"

/bin/sh -c "$WITH_ENVIRONMENT \"$BUNDLE_REACT_NATIVE\""