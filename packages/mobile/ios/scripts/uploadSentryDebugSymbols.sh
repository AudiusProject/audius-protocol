source "${PROJECT_DIR}/.xcode.env"

export PROJECT_ROOT=$PWD/..
export SENTRY_PROPERTIES="${PROJECT_ROOT}/ios/sentry.properties"

"$NPM_BINARY" --prefix ../ run sentry-cli -- upload-dsym
