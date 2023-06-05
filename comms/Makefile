GIT_HASH ?= $(shell git rev-parse --verify HEAD)

up:: down migrate
	audius-compose up --comms comms-test

down::
	(docker compose down --volumes || true)

psql::
	docker exec -it db psql -U postgres audius_discovery

fmt::
	go fmt ./...

test::
	docker logs -f comms-test

migrate::
	audius-compose up db && \
	DATABASE_URL="postgresql://postgres:postgres@localhost:5454/audius_discovery?sslmode=disable" \
		dbmate --wait --no-dump-schema --migrations-dir ./discovery/db/migrations up
	(docker exec -it audius-protocol-db-1 psql -U postgres -c "create database comms_test WITH TEMPLATE audius_discovery" || true)


# formerly build.fast but uses qemu - slow
# note we use the "a1" tag to delineate a push from local for testing
build.push::
	DOCKER_DEFAULT_PLATFORM=linux/amd64 docker build -t audius/comms:a1 .
	docker push audius/comms:a1

# does not use qemu - fast
# used for quick stage/prod deployments from localhost
build.push.fast::
	CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o build/comms-amd64
	DOCKER_DEFAULT_PLATFORM=linux/amd64 docker build . -f ./DockerfileFast -t audius/comms:a1 -t audius/comms:${GIT_HASH}
	docker push audius/comms:a1
	docker push audius/comms:${GIT_HASH}

tools::
	CGO_ENABLED=0 go install github.com/amacneil/dbmate@latest
	go install github.com/rakyll/hey@latest

quicktype::
	cp ../libs/src/sdk/api/chats/serverTypes.ts discovery/schema/schema.ts
	npx quicktype@23.0.37 --package schema --out discovery/schema/schema.go --just-types-and-package discovery/schema/schema.ts
	# gofmt -w discovery/schema/schema.go
