# This script should be run from the Makefile only.
set -eo pipefail

make_target="$1"
arch="$2"
platform="$3"

VERSION_LDFLAG := -X main.Version=$(shell git rev-parse HEAD)

CGO_ENABLED=0 GOOS=linux GOARCH=amd64  go build -ldflags "$(VERSION_LDFLAG)" -o $make_target ./cmd/audiusd
