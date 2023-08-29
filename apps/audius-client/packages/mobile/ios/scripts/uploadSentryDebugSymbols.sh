export NODE_BINARY=node
export SENTRY_PROPERTIES=sentry.properties

cp ../node_modules/@sentry/cli/bin/sentry-cli .
sentry-cli upload-dsym