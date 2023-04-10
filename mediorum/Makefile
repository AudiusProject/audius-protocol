GIT_HASH ?= $(shell git rev-parse --verify HEAD)

dev::
	rm -rf **/*.db
	rm -rf /tmp/mediorum*
	LIVE_UI=true air
	# LIVE_UI=true go run main.go

dev2::
	rm -rf /tmp/mediorum*
	LIVE_UI=true goreman -set-ports=false start

test::
	go test ./... -v -count=1 -timeout 60s


tools::
	go install github.com/mattn/goreman@latest
	go install github.com/cosmtrek/air@latest

build::
	DOCKER_DEFAULT_PLATFORM=linux/amd64 docker build . -t audius/mediorum:latest -t audius/mediorum:${GIT_HASH}
	docker push audius/mediorum:latest
	docker push audius/mediorum:${GIT_HASH}

build.fast::
	CC=x86_64-linux-musl-gcc CXX=x86_64-linux-musl-g++ GOARCH=amd64 GOOS=linux CGO_ENABLED=1 go build -tags "sqlite_stat4 sqlite_trace" -ldflags "-linkmode external -extldflags -static" -o build/mediorum-linux-amd64
	DOCKER_DEFAULT_PLATFORM=linux/amd64 docker build . -f ./Dockerfile.fast -t audius/mediorum:latest -t audius/mediorum:${GIT_HASH}
	docker push audius/mediorum:latest
	docker push audius/mediorum:${GIT_HASH}
