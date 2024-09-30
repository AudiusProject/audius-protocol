# This script should be run from the Makefile only.
set -eo pipefail

if [[ -n $(git status -s) ]]; then
    echo "There are uncommitted changes in the repository."
    exit 1
fi

artifacts=(bin/audius-ctl-{arm64,x86_64}-{linux,darwin})
for art in "${artifacts[@]}"; do
    if ! [ -f "$art" ]; then
        echo "Please run 'make audius-ctl-production-build' before attempting to release"
        exit 1
    fi
done

# Pick the binary for current architecture so that we can extract the version
OS="$(uname -s | tr '[:upper:]' '[:lower:]')"
ARCH="$(uname -m)"
BINARY_NAME="audius-ctl-${ARCH}-${OS}"
release_version="$("bin/$BINARY_NAME" --version)"

if ! echo "$release_version" | grep -E "^[0-9]+\.[0-9]+\.[0-9]+$" >/dev/null; then
    echo "'$release_version' is in an unsupported format for release version."
    echo "Please run 'make audius-ctl-production-build' before attempting to release"
    exit 1
fi

release_tag="audius-ctl@$release_version"

gh release create --generate-notes --target "$(git rev-parse HEAD)" "$release_tag" bin/audius-ctl*
