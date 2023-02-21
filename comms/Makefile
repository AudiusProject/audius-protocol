
dev.discovery::
	@	audius_discprov_env='standalone' \
		AUDIUS_DELEGATE_PRIVATE_KEY='293589cdf207ed2f2253bb72b17bb7f2cfe399cdc34712b1d32908d969682238' \
		audius_db_url='postgresql://postgres:postgres@localhost:5454/audius_discovery?sslmode=disable' \
		go run main.go discovery

reset::
	docker compose down --volumes
	docker compose up comdb comnats -d
	DATABASE_URL="postgresql://postgres:postgres@localhost:5454/audius_discovery?sslmode=disable" \
		dbmate --wait --no-dump-schema --migrations-dir ./discovery/db/migrations up
	docker exec -it comdb psql -U postgres -c "create database comtest WITH TEMPLATE audius_discovery"

localhosts="127.0.0.1       node1 node2 node3 node4 ingress"
storage.hosts::
	@	if ! grep -q $(localhosts) /etc/hosts; \
		then echo Adding development hosts to /etc/hosts; \
		echo $(localhosts) | sudo tee -a /etc/hosts; fi

storage.dev.up::
	docker compose -f docker-compose.v2.dev.yml up -d --build

storage.multi.up::
	docker compose -f docker-compose.v2.multi.yml up -d --build

storage.dev:: down storage.hosts storage.dev.up

storage.multi:: down storage.hosts storage.multi.up

down::
	(docker compose down --volumes || true) && \
	(docker compose -f docker-compose.v2.dev.yml down -v || true) && \
	(docker compose -f docker-compose.v2.multi.yml down -v || true)

psql::
	docker exec -it comdb psql -U postgres audius_discovery




fmt::
	go fmt ./...

test::
	docker compose up -d comdb
	audius_discprov_env='standalone' test_host='com1' go test ./... -count=1


test.load::
	hey -n 10000 -c 50 http://localhost:8926/storage/jobs

storage.seed.audio::
	docker exec -it storage1 sh -c "./comms storage seed audio"

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
