GO_SRCS := $(shell find . -type f -name '*.go') go.sum go.mod $(wildcard config/genesis/*.json)
JS_SRCS := $(shell find . -type f -name '*.js')
NATIVE_BIN := ./tmp/core
AMD64_BIN := ./tmp/core-amd64

SQL_SRCS := $(shell find db/sql -type f -name '*.sql') db/sqlc.yaml
SQL_ARTIFACTS := $(wildcard db/*.sql.go)

PROTO_SRCS := protocol.proto
PROTO_ARTIFACTS := $(wildcard gen/proto/*.pb.go)

TEMPL_SRCS := $(shell find console -type f -name "*.templ")
TEMPL_ARTIFACTS := $(shell find console -type f -name "*_templ.go")

GEN_SRCS := $(SQL_SRCS) $(PROTO_SRCS) $(TEMPL_SRCS)
GEN_ARTIFACTS :=  $(PROTO_ARTIFACTS) $(SQL_ARTIFACTS) $(TEMPL_ARTIFACTS)

VERSION_LDFLAG := -X github.com/AudiusProject/audius-protocol/core/config.Version=$(shell git rev-parse HEAD)

.PHONY: build-native
build-native: $(NATIVE_BIN)

$(NATIVE_BIN): $(GO_SRCS) $(JS_SRCS)
	@go build -ldflags "$(VERSION_LDFLAG)" -o ./tmp/core

.PHONY: build-amd64
build-amd64: $(AMD64_BIN)

$(AMD64_BIN): $(GO_SRCS) $(JS_SRCS)
	@GOOS=linux GOARCH=amd64 go build -ldflags "$(VERSION_LDFLAG)" -o ./tmp/core-amd64

.PHONY: deps
deps:
	@go install github.com/onsi/ginkgo/v2/ginkgo@v2.19.0
	@brew install protobuf
	@go install github.com/sqlc-dev/sqlc/cmd/sqlc@latest
	@go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
	@go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest
	@go install github.com/cortesi/modd/cmd/modd@latest
	@go install github.com/a-h/templ/cmd/templ@latest
	@go install github.com/ethereum/go-ethereum/cmd/abigen@latest
	@go mod tidy

.PHONY: gen
gen: $(GEN_ARTIFACTS)

$(GEN_ARTIFACTS): $(GEN_SRCS)
	@which -s sqlc templ modd || ( \
		echo "ERROR: audius core dev tooling not found." \
		"Run 'make deps' to install necessary golang packages." \
		&& false \
	)
	go generate ./...
	cd db && sqlc generate
	protoc --go_out=./gen --go-grpc_out=./gen ./protocol.proto
	go mod tidy

.PHONY: dev
dev: gen
	audius-compose down
	audius-compose up db core core-content-1 core-content-2 core-content-3 eth-ganache ingress

.PHONY: test
test: gen
	go test -v ./... -timeout 60s

.PHONY: sandbox-hosts
sandbox-hosts:
	chmod +x ./infra/add-sandbox-hosts.sh && ./infra/add-sandbox-hosts.sh

.PHONY: sandbox
sandbox: build-amd64
	@docker compose -f ./infra/docker-compose.yml --profile prod --profile stage --profile dev up --build -d

.PHONY: down-sandbox
down-sandbox:
	@docker compose -f ./infra/docker-compose.yml --profile prod --profile stage --profile dev down

.PHONY: prod-sandbox
prod-sandbox:
	@docker compose -f ./infra/docker-compose.yml --profile prod up --build -d

.PHONY: stage-sandbox
stage-sandbox:
	@docker compose -f ./infra/docker-compose.yml --profile stage up --build -d

.PHONY: dev-sandbox
dev-sandbox:
	@docker compose -f ./infra/docker-compose.yml --profile dev up --build -d

.PHONY: clean-sandbox
clean-sandbox: down-sandbox
	rm -rf ./tmp

.PHONY: livereload
livereload:
	modd

.PHONY: push-prerelease
push-prerelease:
	DOCKER_DEFAULT_PLATFORM=linux/amd64 audius-compose push core --prod
	crane copy "audius/core:$(shell git rev-parse HEAD)" "audius/core:prerelease"

.PHONY: push-edge
push-edge:
	DOCKER_DEFAULT_PLATFORM=linux/amd64 audius-compose push core --prod
	crane copy "audius/core:$(shell git rev-parse HEAD)" "audius/core:edge"

.PHONY: console
console: gen
	@NO_DOCKER=on modd
