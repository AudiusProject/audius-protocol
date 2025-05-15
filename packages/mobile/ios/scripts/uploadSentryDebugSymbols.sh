export NODE_BINARY=node
export SENTRY_PROPERTIES=sentry.properties
export SENTRY_ALLOW_FAILURE=true
export SENTRY_DISABLE_AUTO_UPLOAD=true

/bin/sh ../node_modules/@sentry/react-native/scripts/sentry-xcode-debug-files.sh