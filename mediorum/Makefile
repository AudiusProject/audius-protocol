dev::
	rm -rf **/*.db
	rm -rf /tmp/mediorum*
	LIVE_UI=true air
	# LIVE_UI=true go run main.go

dev2::
	rm -rf /tmp/mediorum*
	LIVE_UI=true goreman -set-ports=false start

test:: pg.bounce
	sleep 2
	docker compose up -d --wait
	go test ./... -count=1


tools::
	go install github.com/mattn/goreman@latest
	go install github.com/cosmtrek/air@latest

build::
	DOCKER_DEFAULT_PLATFORM=linux/amd64 docker build . -t audius/mediorum:latest
	docker push audius/mediorum:latest

build.fast::
	CC=x86_64-linux-musl-gcc CXX=x86_64-linux-musl-g++ GOARCH=amd64 GOOS=linux CGO_ENABLED=1 go build -tags "sqlite_stat4 sqlite_trace" -ldflags "-linkmode external -extldflags -static" -o build/mediorum-linux-amd64
	DOCKER_DEFAULT_PLATFORM=linux/amd64 docker build . -f ./Dockerfile.fast -t audius/mediorum:latest
	docker push audius/mediorum:latest


psql::
	docker compose up -d --wait
	docker exec -it pg psql -U postgres

pg.bounce::
	docker compose down --volumes
	docker compose up -d --wait
