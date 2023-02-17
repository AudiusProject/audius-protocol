up:: down storage.hosts migrate
	docker compose up -d --build

# discovery:: down migrate
# 	docker compose up discovery1 -d --build

# TODO: Make the above be an actual container `comms` instead of `go run main.go discovery` because then it can reference `nats`

localhosts="127.0.0.1       node1 node2 node3 node4 ingress"
storage.hosts::
	@	if ! grep -q $(localhosts) /etc/hosts; \
		then echo Adding development hosts to /etc/hosts; \
		echo $(localhosts) | sudo tee -a /etc/hosts; fi

# storage:: down storage.hosts
# 	docker compose up storage1 storage2 storage3 storage4 -d --build

down::
	(docker compose down --volumes || true)

psql::
	docker exec -it comdb psql -U postgres audius_discovery




fmt::
	go fmt ./...

# TODO: Add "migrate storage.hosts up" but make it not have to re-run up and migrate every time
test::
	docker logs -f test

# test::
# 	docker compose up test -d
# 	audius_discprov_env='standalone' AUDIUS_TEST_HOST='nats1' go test ./... -count=1

migrate::
	docker compose up comdb -d && \
	DATABASE_URL="postgresql://postgres:postgres@localhost:5454/audius_discovery?sslmode=disable" \
		dbmate --wait --no-dump-schema --migrations-dir ./discovery/db/migrations up
	(docker exec -it comdb psql -U postgres -c "create database comtest WITH TEMPLATE audius_discovery" || true)

test.load::
	hey -n 10000 -c 50 http://localhost:8926/storage/jobs


build::
	DOCKER_DEFAULT_PLATFORM=linux/amd64 docker build . -t audius/wip-comms:latest
	docker push audius/wip-comms:latest

build.alpine::
	CGO_ENABLED=0 GOOS=linux GOARCH=amd64
	go build -ldflags="-w -s" -o comms main.go

build.weathermap::
	cd storage/storageserver/weather-map; yarn && yarn build

# this is a "fast build and push"
# we build target specific binary on our host machine (osx)
# and copy into container (see Dockerfile with build instructions commented out)
# this is nice because go is good at cross compiling and cross compiling inside a docker container running on QEMU is 10x slower
# also we get build cache... end result is a 10 second build and push, which is nice.
# also... this is pretty much identical to doing a docker "multi-stage" build, but way simpler.
build.fast::
	CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o build/comms-linux-amd64
	DOCKER_DEFAULT_PLATFORM=linux/amd64 docker build . -f ./DockerfileFast -t audius/comms:a1
	docker push audius/comms:a1


tools::
	go install github.com/kyleconroy/sqlc/cmd/sqlc@main
	CGO_ENABLED=0 go install github.com/nats-io/natscli/nats@latest
	CGO_ENABLED=0 go install github.com/amacneil/dbmate@latest
	go install github.com/rakyll/hey@latest

quicktype::
	cp ../libs/src/sdk/api/chats/serverTypes.ts discovery/schema/schema.ts
	npx quicktype --package schema --out discovery/schema/schema.go --just-types-and-package discovery/schema/*.ts
