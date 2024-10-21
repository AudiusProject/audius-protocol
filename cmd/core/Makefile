GO_SRCS := $(shell find ../../pkg/core -type f -name '*.go') ../../go.sum ../../go.mod $(wildcard ../../pkg/core/config/genesis/*.json)
JS_SRCS := $(shell find ../../pkg/core -type f -name '*.js')
NATIVE_BIN := ../../bin/core
AMD64_BIN := ../../bin/core-amd64

SQL_SRCS := $(shell find ../../pkg/core/db/sql -type f -name '*.sql') ../../pkg/core/db/sqlc.yaml
SQL_ARTIFACTS := $(wildcard ../../pkg/core/db/*.sql.go)

PROTO_SRCS := ../../pkg/core/protocol.proto
PROTO_ARTIFACTS := $(wildcard ../../pkg/core/gen/proto/*.pb.go)

TEMPL_SRCS := $(shell find ../../pkg/core/console -type f -name "*.templ")
TEMPL_ARTIFACTS := $(shell find ../../pkg/core/console -type f -name "*_templ.go")

GEN_SRCS := $(SQL_SRCS) $(PROTO_SRCS) $(TEMPL_SRCS)
GEN_ARTIFACTS :=  $(PROTO_ARTIFACTS) $(SQL_ARTIFACTS) $(TEMPL_ARTIFACTS)

VERSION_LDFLAG := -X github.com/AudiusProject/audius-protocol/core/config.Version=$(shell git rev-parse HEAD)

.PHONY: core-build-native
core-build-native: $(NATIVE_BIN)

$(NATIVE_BIN): $(GO_SRCS) $(JS_SRCS)
	@go build -ldflags "$(VERSION_LDFLAG)" -o ../../bin/core ./main.go

.PHONY: core-build-amd64
core-build-amd64: $(AMD64_BIN)

$(AMD64_BIN): $(GO_SRCS) $(JS_SRCS)
	@GOOS=linux GOARCH=amd64 go build -ldflags "$(VERSION_LDFLAG)" -o ../../bin/core-amd64

.PHONY: core-deps
core-deps:
	@go install github.com/onsi/ginkgo/v2/ginkgo@v2.19.0
	@brew install protobuf
	@go install github.com/sqlc-dev/sqlc/cmd/sqlc@latest
	@go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
	@go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest
	@go install github.com/cortesi/modd/cmd/modd@latest
	@go install github.com/a-h/templ/cmd/templ@latest
	@go install github.com/ethereum/go-ethereum/cmd/abigen@latest
	@go mod tidy

.PHONY: core-gen
core-gen: $(GEN_ARTIFACTS)

$(GEN_ARTIFACTS): $(GEN_SRCS)
	@which sqlc templ modd > /dev/null || ( \
		echo "ERROR: audius core dev tooling not found." \
		"Run 'make core-deps' to install necessary golang packages." \
		&& false \
	)
	cd ../../pkg/core && go generate ./...
	cd ../../pkg/core/db && sqlc generate
	protoc --go_out=../../pkg/core/gen --go-grpc_out=../../pkg/core/gen --proto_path=../../pkg/core ../../pkg/core/protocol.proto
	go mod tidy

.PHONY: core-dev
core-dev: core-gen
	audius-compose down
	audius-compose up db core core-content-1 core-content-2 core-content-3 eth-ganache ingress

.PHONY: core-test
core-test: core-gen
	go test -v ../../pkg/core/... -timeout 60s

.PHONY: core-sandbox-hosts
core-sandbox-hosts:
	chmod +x ./cmd/core/infra/add-sandbox-hosts.sh && ./cmd/core/infra/add-sandbox-hosts.sh

.PHONY: core-sandbox
core-sandbox: build-amd64
	@docker compose -f ./cmd/core/infra/docker-compose.yml --profile prod --profile stage --profile dev up --build -d

.PHONY: core-down-sandbox
core-down-sandbox:
	@docker compose -f ./cmd/core/infra/docker-compose.yml --profile prod --profile stage --profile dev down

.PHONY: core-prod-sandbox
core-prod-sandbox:
	@docker compose -f ./cmd/core/infra/docker-compose.yml --profile prod up --build -d

.PHONY: core-stage-sandbox
core-stage-sandbox:
	@docker compose -f ./cmd/core/infra/docker-compose.yml --profile stage up --build -d

.PHONY: core-dev-sandbox
core-dev-sandbox:
	@docker compose -f ./cmd/core/infra/docker-compose.yml --profile dev up --build -d

.PHONY: core-clean-sandbox
core-clean-sandbox: down-sandbox
	rm -rf ../../bin/*

.PHONY: core-livereload
core-livereload:
	modd
