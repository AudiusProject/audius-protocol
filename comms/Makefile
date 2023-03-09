up:: down etchosts migrate
	docker compose up -d --build

localhosts="127.0.0.1       node1-storage node2-storage node3-storage node4-storage node1-discovery node2-discovery node3-discovery ingress"
etchosts::
	@	if ! grep -q $(localhosts) /etc/hosts; \
		then echo Adding development hosts to /etc/hosts; \
		echo $(localhosts) | sudo tee -a /etc/hosts; fi

down::
	(docker compose down --volumes || true)

psql::
	docker exec -it comdb psql -U postgres audius_discovery

fmt::
	go fmt ./...

test::
	docker logs -f test

migrate::
	docker compose up comdb -d && \
	DATABASE_URL="postgresql://postgres:postgres@localhost:5454/audius_discovery?sslmode=disable" \
		dbmate --wait --no-dump-schema --migrations-dir ./discovery/db/migrations up
	(docker exec -it comdb psql -U postgres -c "create database comtest WITH TEMPLATE audius_discovery" || true)

test.load::
	docker exec -it storage1 sh -c "./comms storage loadTest"

storage.seed.audio::
	docker exec -it storage1 sh -c "./comms storage seed audio"

storage.seed.image::
	docker exec -it storage1 sh -c "./comms storage seed image"

build.push::
    docker build -t audius/comms:latest .
	docker push audius/comms:latest

build.weathermap::
	cd storage/storageserver/weather-map; yarn && yarn build

# # this is a "fast build and push"
# # we build target specific binary on our host machine (osx)
# # and copy into container (see Dockerfile with build instructions commented out)
# # this is nice because go is good at cross compiling and cross compiling inside a docker container running on QEMU is 10x slower
# # also we get build cache... end result is a 10 second build and push, which is nice.
# # also... this is pretty much identical to doing a docker "multi-stage" build, but way simpler.
# build.fast::
# 	CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o build/comms-linux-amd64
# 	DOCKER_DEFAULT_PLATFORM=linux/amd64 docker build . -f ./DockerfileFast -t audius/comms:a1
# 	docker push audius/comms:a1

tools::
	go install github.com/kyleconroy/sqlc/cmd/sqlc@main
	CGO_ENABLED=0 go install github.com/nats-io/natscli/nats@latest
	CGO_ENABLED=0 go install github.com/amacneil/dbmate@latest
	go install github.com/rakyll/hey@latest

quicktype::
	cp ../libs/src/sdk/api/chats/serverTypes.ts discovery/schema/schema.ts
	npx quicktype --package schema --out discovery/schema/schema.go --just-types-and-package discovery/schema/*.ts
