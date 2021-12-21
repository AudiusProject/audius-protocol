export SENTRY_PROPERTIES=sentry.properties
if [[ -z "${SENTRY_BINARY}" ]]; then
  export SENTRY_BINARY=../node_modules/@sentry/cli/bin/sentry-cli
fi
$SENTRY_BINARY upload-dsym