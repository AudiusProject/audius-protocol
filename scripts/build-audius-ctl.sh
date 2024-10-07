# This script should be run from the Makefile only.
set -eo pipefail

make_target="$1"
arch="$2"
platform="$3"


CGO_ENABLED=0 GOOS="$platform" GOARCH="$arch" go build -ldflags "-X main.Version=$(bash scripts/get-new-audius-ctl-version.sh "$make_target")" -o "$make_target" ./cmd/audius-ctl
