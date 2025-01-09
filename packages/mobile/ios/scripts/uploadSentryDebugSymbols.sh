source "${PROJECT_DIR}/.xcode.env"

export SENTRY_PROPERTIES=sentry.properties

"$NPM_BINARY" --prefix ../ run sentry-cli -- upload-dsym
