GIT_HASH ?= $(shell git rev-parse --verify HEAD)

up:: down
	audius-compose up --comms comms-test

down::
	(docker compose down --volumes || true)

psql::
	docker exec -it db psql -U postgres audius_discovery

fmt::
	go fmt ./...

test::
	docker logs -f comms-test



steve.test::
	docker compose -f docker-compose.test.yml up -d

	audius_db_url="postgresql://postgres:password@localhost:25432/postgres?sslmode=disable" \
	go run main.go discovery-migrations

	audius_delegate_private_key="c82ad757622db5a148089e0a8fc1741cefa8677ab56a2ac9e38dac905c5ad7c7" \
	audius_db_url="postgresql://postgres:password@localhost:25432/postgres?sslmode=disable" \
	go test ./... -count=1


# formerly build.fast but uses qemu - slow
# note we use the "a1" tag to delineate a push from local for testing
build.push::
	DOCKER_DEFAULT_PLATFORM=linux/amd64 docker build -t audius/comms:a1 .
	docker push audius/comms:a1

# does not use qemu - fast
# used for quick stage/prod deployments from localhost
build.push.fast::
	CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o build/comms-amd64
	DOCKER_DEFAULT_PLATFORM=linux/amd64 docker build . -f ./DockerfileFast -t audius/comms:z1
	docker push audius/comms:z1


quicktype::
	cp ../packages/libs/src/sdk/api/chats/serverTypes.ts discovery/schema/schema.ts
	npx quicktype@23.0.37 --package schema --out discovery/schema/schema.go --just-types-and-package discovery/schema/schema.ts
	# gofmt -w discovery/schema/schema.go
