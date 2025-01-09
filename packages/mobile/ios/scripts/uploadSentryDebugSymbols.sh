export NODE_BINARY=node
export SENTRY_PROPERTIES=sentry.properties

npm --prefix ../ run sentry-cli upload-dsym
