
server::
	@	audius_discprov_env='standalone' \
		audius_delegate_private_key='293589cdf207ed2f2253bb72b17bb7f2cfe399cdc34712b1d32908d969682238' \
		audius_db_url='postgresql://postgres:postgres@localhost:5454/audius_discovery?sslmode=disable' \
		go run main.go


reset::
	docker compose down --volumes
	docker compose up comdb -d
	DATABASE_URL="postgresql://postgres:postgres@localhost:5454/audius_discovery?sslmode=disable" \
		dbmate --wait up
	docker exec -it comdb psql -U postgres -c "create database comtest WITH TEMPLATE audius_discovery"

psql::
	docker exec -it comdb psql -U postgres audius_discovery

db.schema::
	pg_dump --schema-only --create --no-owner --no-privileges postgres://postgres:postgres@10.128.0.23:5454/audius_discovery > database/docker-initdb/00_schema.sql





cluster.up::
	GOOS=linux go build -o comms-linux
	docker compose up

cluster.stagger::
	GOOS=linux go build -o comms-linux
	docker compose up -d com1
	sleep 10
	docker compose up -d com2
	sleep 40
	docker compose up -d com3
	sleep 80
	docker compose up -d com4


fmt::
	go fmt ./...

test::
	docker compose up -d comdb
	# go test ./database -v -count=1
	go test ./...


# this is a "fast build and push"
# we build target specific binary on our host machine (osx)
# and copy into container (see Dockerfile with build instructions commented out)
# this is nice because go is good at cross compiling and cross compiling inside a docker container running on QEMU is 10x slower
# also we get build cache... end result is a 10 second build and push, which is nice.
# also... this is pretty much identical to doing a docker "multi-stage" build, but way simpler.
build.fast::
	CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o build/comms-linux-amd64
	DOCKER_DEFAULT_PLATFORM=linux/amd64 docker build . -t audius/wip-comms:latest
	docker push audius/wip-comms:latest

# build::
# 	DOCKER_DEFAULT_PLATFORM=linux/amd64 docker build . -t audius/wip-comms:latest
# 	docker push audius/wip-comms:latest


tools::
	go install github.com/kyleconroy/sqlc/cmd/sqlc@main
	CGO_ENABLED=0 go install github.com/nats-io/natscli/nats@latest
	CGO_ENABLED=0 go install github.com/amacneil/dbmate@latest

sqlc:: reset
	sqlc generate

quicktype::
	cp ../audius-protocol/libs/src/sdk/api/chats/serverTypes.ts schema/schema.ts
	npx quicktype --package schema --out schema/schema.go --just-types-and-package schema/*.ts
