GO_SRCS := $(shell find . -type f -name '*.go') go.sum go.mod $(wildcard config/genesis/*.json)
NATIVE_BIN := ./tmp/core
AMD64_BIN := ./tmp/core-amd64

SQL_SRCS := $(shell find db/sql -type f -name '*.sql') db/sqlc.yaml
SQL_ARTIFACTS := $(wildcard db/*.sql.go)

PROTO_SRCS := protocol.proto
PROTO_ARTIFACTS := $(wildcard gen/proto/*.pb.go)

TEMPL_SRCS := $(wildcard console/components/*.templ)
TEMPL_ARTIFACTS := $(wildcard console/components/*_templ.go)

GEN_SRCS := $(SQL_SRCS) $(PROTO_SRCS) $(TEMPL_SRCS)
GEN_ARTIFACTS :=  $(PROTO_ARTIFACTS) $(SQL_ARTIFACTS) $(TEMPL_ARTIFACTS)

.PHONY: build-native
build-native: $(NATIVE_BIN)

$(NATIVE_BIN): $(GO_SRCS)
	@go build -o ./tmp/core

.PHONY: build-amd64
build-amd64: $(AMD64_BIN)

$(AMD64_BIN): $(GO_SRCS)
	@GOOS=linux GOARCH=amd64 go build -o ./tmp/core-amd64

.PHONY: deps
deps:
	@go install github.com/onsi/ginkgo/v2/ginkgo@v2.19.0
	@brew install protobuf
	@go install github.com/sqlc-dev/sqlc/cmd/sqlc@latest
	@go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
	@go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest
	@go install github.com/cortesi/modd/cmd/modd@latest
	@go install github.com/a-h/templ/cmd/templ@latest
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
	audius-compose up db core core-content-1 core-content-2 core-content-3 eth-ganache

.PHONY: sandbox-node
sandbox-node:
	@docker compose -f ./infra/docker-compose.yml down
	@docker compose -f ./infra/docker-compose.yml up --build

.PHONY: sandbox
sandbox:
	@go run ./scripts/sandbox.go

.PHONY: livereload
livereload:
	modd
