#!/bin/sh
# https://github.com/gliderlabs/logspout/blob/818dd8260e52d2c148280d86170bdf5267b5c637/build.sh
# due to: https://github.com/gliderlabs/logspout/blob/818dd8260e52d2c148280d86170bdf5267b5c637/Dockerfile#L9-L11

set -e
apk add --update go build-base git mercurial ca-certificates
cd /src
go build -ldflags "-X main.Version=$1" -o /bin/logspout
apk del go git mercurial build-base
rm -rf /root/go /var/cache/apk/*

# backwards compatibility
ln -fs /tmp/docker.sock /var/run/docker.sock

