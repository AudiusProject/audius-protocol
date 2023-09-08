GIT_HASH ?= $(shell git rev-parse --verify HEAD)

dev::
	rm -rf **/*.db
	rm -rf /tmp/mediorum*
	LIVE_UI=true air
	# LIVE_UI=true go run main.go

dev2::
	rm -rf /tmp/mediorum*
	LIVE_UI=true goreman -set-ports=false start

test:: pg.bounce
	rm -rf /tmp/mediorum_test
	go test ./... -count=1 -timeout 60s


tools::
	go install github.com/mattn/goreman@latest
	go install github.com/cosmtrek/air@latest

build::
	DOCKER_DEFAULT_PLATFORM=linux/amd64 docker build . -t audius/mediorum:latest -t audius/mediorum:${GIT_HASH}
	docker push audius/mediorum:latest
	docker push audius/mediorum:${GIT_HASH}

build.fast::
	CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o build/mediorum-linux-amd64
	CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o build/mediorum-cmd-linux-amd64 cmd/main.go
	DOCKER_DEFAULT_PLATFORM=linux/amd64 docker build . -f ./Dockerfile.fast -t audius/mediorum:latest
	docker push audius/mediorum:latest

psql::
	docker compose up -d --wait
	docker exec -it pg psql -U postgres

pg.up:
	docker compose up -d --wait

pg.bounce::
	docker compose down --volumes
	docker compose up -d --wait
	rm -rf /tmp/mediorum*
	sleep 2

cmd.loadtest::
	go run cmd/main.go test -num 10
