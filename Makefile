NETWORK ?= stage
AD_TAG ?= default
# One of patch, minor, or major
UPGRADE_TYPE ?= patch

ABI_DIR := pkg/register/ABIs
EMBED_SRCS := $(wildcard pkg/core/config/genesis/*.json)
JS_SRCS := $(shell find pkg/core -type f -name '*.js')
GO_SRCS := $(shell find pkg cmd -type f -name '*.go') go.mod go.sum

CORE_SRCS := $(GO_SRCS) $(JS_SRCS) $(EMBED_SRCS)

SQL_SRCS := $(shell find pkg/core/db/sql -type f -name '*.sql') pkg/core/db/sqlc.yaml
SQL_ARTIFACTS := $(wildcard pkg/core/db/*.sql.go)

PROTO_SRCS := pkg/core/protocol.proto
PROTO_ARTIFACTS := $(wildcard pkg/core/gen/proto/*.pb.go)

TEMPL_SRCS := $(shell find pkg/core/console -type f -name "*.templ")
TEMPL_ARTIFACTS := $(shell find pkg/core/console -type f -name "*_templ.go")

GEN_SRCS := $(SQL_SRCS) $(PROTO_SRCS) $(TEMPL_SRCS)
GEN_ARTIFACTS :=  $(PROTO_ARTIFACTS) $(SQL_ARTIFACTS) $(TEMPL_ARTIFACTS)

VERSION_LDFLAG := -X github.com/AudiusProject/audius-protocol/core/config.Version=$(shell git rev-parse HEAD)


#############
## AUDIUSD ##
#############

bin/audiusd-native: $(GO_SRCS)
	@echo "Building audiusd for local platform and architecture..."
	@bash scripts/build-audiusd.sh $@

bin/audiusd-x86_64-linux: $(GO_SRCS)
	@echo "Building x86 audiusd for linux..."
	@bash scripts/build-audiusd.sh $@ amd64 linux

bin/audius-ctl-native: $(GO_SRCS)
	@echo "Building audius-ctl for local platform and architecture..."
	@bash scripts/build-audius-ctl.sh $@

bin/audius-ctl-arm64-linux: $(GO_SRCS)
	@echo "Building arm audius-ctl for linux..."
	@bash scripts/build-audius-ctl.sh $@ arm64 linux

bin/audius-ctl-x86_64-linux: $(GO_SRCS)
	@echo "Building x86 audius-ctl for linux..."
	@bash scripts/build-audius-ctl.sh $@ amd64 linux

bin/audius-ctl-arm64-darwin: $(GO_SRCS)
	@echo "Building macos arm audius-ctl..."
	@bash scripts/build-audius-ctl.sh $@ arm64 darwin

bin/audius-ctl-x86_64-darwin: $(GO_SRCS)
	@echo "Building macos x86 audius-ctl..."
	@bash scripts/build-audius-ctl.sh $@ amd64 darwin

# Experimental statusbar feature
bin/audius-ctl-arm64-darwin-experimental: $(GO_SRCS)
	@echo "Building macos arm audius-ctl..."
	@GOOS=darwin GOARCH=arm64 go build -tags osx -ldflags -X main.Version="$(shell git rev-parse HEAD)" -o bin/audius-ctl-arm64-darwin-experimental ./cmd/audius-ctl

.PHONY: release-audius-ctl audius-ctl-production-build
release-audius-ctl:
	bash scripts/release-audius-ctl.sh

audius-ctl-production-build: clean regen-abis bin/audius-ctl-arm64-linux bin/audius-ctl-x86_64-linux bin/audius-ctl-arm64-darwin bin/audius-ctl-x86_64-darwin

.PHONY: regen-abis
regen-abis: $(ABI_ARTIFACTS)
	@jq '.abi' packages/libs/src/eth-contracts/ABIs/ERC20Detailed.json > $(ABI_DIR)/ERC20Detailed.json
	@jq '.abi' packages/libs/src/eth-contracts/ABIs/Registry.json > $(ABI_DIR)/Registry.json
	@jq '.abi' packages/libs/src/eth-contracts/ABIs/ServiceProviderFactory.json > $(ABI_DIR)/ServiceProviderFactory.json

.PHONY: build-docker-local build-push-docker
build-docker-local:
	@echo "Building Docker image for local platform..."
	docker buildx build --load -t audius/audius-d:$(AD_TAG) pkg/orchestration

build-push-docker:
	@echo "Building and pushing Docker images for all platforms..."
	docker buildx build --platform linux/amd64,linux/arm64 --push -t audius/audius-d:$(AD_TAG) pkg/orchestration

.PHONY: install uninstall
install:
	@bash scripts/install-audius-ctl.sh local

uninstall:
	@bash scripts/uninstall-audius-ctl.sh

.PHONY: clean
clean:
	rm -f bin/*


##############
## MEDIORUM ##
##############

.PHONY: mediorum-dev
mediorum-dev:
	@if [ "$$(docker ps -q -f name=postgres)" ]; then \
		echo "container 'postgres' is already running"; \
	else \
		docker run --rm --name postgres -v $$(pwd)/cmd/mediorum/.initdb:/docker-entrypoint-initdb.d -e POSTGRES_PASSWORD=example -p 5454:5432 -d postgres; \
	fi
	go run cmd/mediorum/main.go


##########
## CORE ##
##########

.PHONY: core-build-native
core-build-native: bin/core

bin/core: $(CORE_SRCS)
	@go build -ldflags "$(VERSION_LDFLAG)" -o bin/core ./main.go

.PHONY: core-build-amd64
core-build-amd64: bin/core-amd64

bin/core-amd64: $(CORE_SRCS)
	@GOOS=linux GOARCH=amd64 go build -ldflags "$(VERSION_LDFLAG)" -o bin/core-amd64

.PHONY: core-gen
core-gen: $(GEN_ARTIFACTS)

$(GEN_ARTIFACTS): $(GEN_SRCS)
	@which sqlc templ modd > /dev/null || ( \
		echo "ERROR: audius core dev tooling not found." \
		"Run 'make core-deps' to install necessary golang packages." \
		&& false \
	)
	cd pkg/core && go generate ./...
	cd pkg/core/db && sqlc generate
	protoc --go_out=pkg/core/gen --go-grpc_out=pkg/core/gen --proto_path=pkg/core pkg/core/protocol.proto
	go mod tidy

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
	@scripts/add-sandbox-hosts.sh

.PHONY: core-dev
core-dev: core-gen
	audius-compose down
	audius-compose up db core core-content-1 core-content-2 core-content-3 eth-ganache ingress

.PHONY: core-test
core-test: core-gen
	go test -v pkg/core/... -timeout 60s

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

.PHONY: core-livereload
core-livereload:
	modd
