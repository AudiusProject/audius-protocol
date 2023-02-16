
dev.discovery::
	@	audius_discprov_env='standalone' \
		audius_delegate_private_key='293589cdf207ed2f2253bb72b17bb7f2cfe399cdc34712b1d32908d969682238' \
		audius_db_url='postgresql://postgres:postgres@localhost:5454/audius_discovery?sslmode=disable' \
		go run main.go discovery

reset::
	docker compose down --volumes
	docker compose up comdb comnats -d
	DATABASE_URL="postgresql://postgres:postgres@localhost:5454/audius_discovery?sslmode=disable" \
		dbmate --wait --no-dump-schema --migrations-dir ./discovery/db/migrations up
	docker exec -it comdb psql -U postgres -c "create database comtest WITH TEMPLATE audius_discovery"

down::
	docker compose down --volumes

psql::
	docker exec -it comdb psql -U postgres audius_discovery




fmt::
	go fmt ./...

test::
	docker compose up -d comdb
	audius_discprov_env='standalone' test_host='com1' go test ./... -count=1


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
	go install github.com/onsi/ginkgo/v2/ginkgo

sqlc:: reset
	sqlc generate

quicktype::
	cp ../libs/src/sdk/api/chats/serverTypes.ts discovery/schema/schema.ts
	npx quicktype --package schema --out discovery/schema/schema.go --just-types-and-package discovery/schema/*.ts

# TRENDING commands
trending.dev.run::
	@echo starting trending server
	@ 	go run main.go trending

trending.dev.test::
	@echo starting trending tests
	@	ginkgo -v ./trending/...

trending.dev.test.full::
	@echo starting trending dependencies
	@	make trending.dev.deps.up
	@	make trending.dev.test
	@echo tearing down trending dependencies
	@	make trending.dev.deps.down

trending.dev.deps.up::
	@echo starting dev dependencies
	@	docker compose -f docker-compose.trending.yml up -d
	@echo sleeping since clickhouse takes a second to startup
	@ 	sleep 6

trending.dev.deps.down::
	@echo stopping dev dependencies
	@	docker compose -f docker-compose.trending.yml down

trending.dev.restore::
	@echo restoring testdb from pg dump
	@	docker exec -i testdb pg_restore --verbose --clean --no-acl --no-owner -U postgres -d default_db < ./trending/houseparty/discProvProduction.dump

trending.dev.migrate::
	@echo migrating testdb data into chdb
	@	docker-compose exec chdb bash /sql/all.sh

trending.dev.restore.up::
	@echo starting dependencies and restoring from existing backup
	@	make trending.dev.deps.up
	@	make trending.dev.restore
	@	make trending.dev.migrate

trending.dev.restore.up.steamroll::
	@echo starting dependencies and restoring from existing backup
	@echo ignoring errors in restore process
	@	make trending.dev.deps.up
	@	make trending.dev.restore -i
	@	make trending.dev.migrate -i

trending.dev.nuke::
	@echo destroying everything and rebuilding, restoring, and running
	@	make trending.dev.deps.down
	@	make trending.dev.restore.up.steamroll
	@	make trending.dev.run
