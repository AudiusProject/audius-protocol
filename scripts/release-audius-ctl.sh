# This script should be run from the Makefile only.
set -eo pipefail

if [[ -n $(git status -s) ]]; then
  echo "There are uncommitted changes in the repository."
  exit 1
fi

if ! [ -f bin/audius-ctl-x86_64 ] || ! [ -f bin/audius-ctl-arm64 ] || ! [ -f bin/audius-ctl-x86_64-macos ] || ! [ -f bin/audius-ctl-arm64-macos ]; then
  echo 'Please run `make audius-ctl-production-build` before attempting to release'
  exit 1
fi

OS="$(uname -s)"
ARCH=$(uname -m)
BINARY_NAME="audius-ctl-${ARCH}"
if [ "$OS" = "Darwin" ]; then
    BINARY_NAME="${BINARY_NAME}-macos"
fi
release_version="$(bin/$BINARY_NAME --version)"

if ! echo $release_version | grep -E "^[0-9]+\.[0-9]+\.[0-9]+$" >/dev/null; then
  echo "'$release_version' is in an unsupported format for release version."
  echo 'Please run `make audius-ctl-production-build` before attempting to release'
  exit 1
fi

release_tag="audius-ctl@$release_version"

if gh release view "$release_tag" &> /dev/null; then
  echo "Release $release_tag already exists."
  exit 1
fi

gh release create --generate-notes --target "$(git rev-parse HEAD)" "$release_tag" bin/audius-ctl*
