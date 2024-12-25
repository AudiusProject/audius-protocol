NETWORK ?= stage
WRAPPER_TAG ?= default
# One of patch, minor, or major
UPGRADE_TYPE ?= patch

GIT_SHA := $(shell git rev-parse HEAD)
AD_TAG ?= $(GIT_SHA)

ABI_ARTIFACT_DIR := pkg/register/ABIs
ABI_SRC_DIR := packages/libs/src/eth-contracts/ABIs
ABI_SRCS := $(ABI_SRC_DIR)/ERC20Detailed.json $(ABI_SRC_DIR)/Registry.json $(ABI_SRC_DIR)/ServiceProviderFactory.json
ABI_ARTIFACTS := $(ABI_ARTIFACT_DIR)/ERC20Detailed.json $(ABI_ARTIFACT_DIR)/Registry.json $(ABI_ARTIFACT_DIR)/ServiceProviderFactory.json

SQL_SRCS := $(shell find pkg/core/db/sql -type f -name '*.sql') pkg/core/db/sqlc.yaml
SQL_ARTIFACTS := $(wildcard pkg/core/db/*.sql.go)

PROTO_SRCS := pkg/core/protocol/protocol.proto
PROTO_ARTIFACTS := $(wildcard pkg/core/gen/core_proto/*.pb.go)

TEMPL_SRCS := $(shell find pkg/core/console -type f -name "*.templ")
TEMPL_ARTIFACTS := $(shell find pkg/core/console -type f -name "*_templ.go")

VERSION_LDFLAG := -X github.com/AudiusProject/audius-protocol/core/config.Version=$(GIT_SHA)

JSON_SRCS := $(wildcard pkg/core/config/genesis/*.json) $(ABI_ARTIFACTS)
JS_SRCS := $(shell find pkg/core -type f -name '*.js')
GO_SRCS := $(shell find pkg cmd -type f -name '*.go')

BUILD_SRCS := $(GO_SRCS) $(JS_SRCS) $(JSON_SRCS) go.mod go.sum


bin/audiusd-native: $(BUILD_SRCS)
	@echo "Building audiusd for local platform and architecture..."
	@bash scripts/build-audiusd.sh $@

bin/audiusd-x86_64-linux: $(BUILD_SRCS)
	@echo "Building x86 audiusd for linux..."
	@bash scripts/build-audiusd.sh $@ amd64 linux

bin/audius-ctl-native: $(BUILD_SRCS)
	@echo "Building audius-ctl for local platform and architecture..."
	@bash scripts/build-audius-ctl.sh $@

bin/audius-ctl-arm64-linux: $(BUILD_SRCS)
	@echo "Building arm audius-ctl for linux..."
	@bash scripts/build-audius-ctl.sh $@ arm64 linux

bin/audius-ctl-x86_64-linux: $(BUILD_SRCS)
	@echo "Building x86 audius-ctl for linux..."
	@bash scripts/build-audius-ctl.sh $@ amd64 linux

bin/audius-ctl-arm64-darwin: $(BUILD_SRCS)
	@echo "Building macos arm audius-ctl..."
	@bash scripts/build-audius-ctl.sh $@ arm64 darwin

bin/audius-ctl-x86_64-darwin: $(BUILD_SRCS)
	@echo "Building macos x86 audius-ctl..."
	@bash scripts/build-audius-ctl.sh $@ amd64 darwin

# Experimental statusbar feature
bin/audius-ctl-arm64-darwin-experimental: $(BUILD_SRCS)
	@echo "Building macos arm audius-ctl..."
	@GOOS=darwin GOARCH=arm64 go build -tags osx -ldflags -X main.Version="$(shell git rev-parse HEAD)" -o bin/audius-ctl-arm64-darwin-experimental ./cmd/audius-ctl

.PHONY: release-audius-ctl audius-ctl-production-build
release-audius-ctl:
	bash scripts/release-audius-ctl.sh

audius-ctl-production-build: clean ignore-code-gen bin/audius-ctl-arm64-linux bin/audius-ctl-x86_64-linux bin/audius-ctl-arm64-darwin bin/audius-ctl-x86_64-darwin

.PHONY: ignore-code-gen
ignore-code-gen:
	@echo "Warning: not regenerating .go files from sql, templ, proto, etc. Using existing artifacts instead."
	@touch $(SQL_ARTIFACTS) $(TEMPL_ARTIFACTS) $(PROTO_ARTIFACTS) go.mod

.PHONY: build-wrapper-local build-push-wrapper
build-wrapper-local:
	@echo "Building Docker image for local platform..."
	docker buildx build --load -t audius/audius-d:$(WRAPPER_TAG) pkg/orchestration

build-push-wrapper:
	@echo "Building and pushing Docker images for all platforms..."
	docker buildx build --platform linux/amd64,linux/arm64 --push -t audius/audius-d:$(WRAPPER_TAG) pkg/orchestration

.PHONY: build-audiusd-local build-push-audiusd build-push-cpp
build-audiusd-local:
	docker build --build-arg GIT_SHA=$(AD_TAG) -t audius/audiusd:$(AD_TAG) -t audius/audiusd:local -f ./cmd/audiusd/Dockerfile ./

build-push-audiusd:
	DOCKER_DEFAULT_PLATFORM=linux/amd64 docker build --build-arg GIT_SHA=$(AD_TAG) --push -t audius/audiusd:$(AD_TAG) -f ./cmd/audiusd/Dockerfile ./

build-push-cpp:
	docker buildx build --platform linux/amd64,linux/arm64 --push -t audius/cpp:latest -f ./cmd/audiusd/Dockerfile.deps ./


.PHONY: force-release-stage force-release-foundation force-release-sps
force-release-stage:
	@bash scripts/release-audiusd.sh $@

force-release-foundation:
	@bash scripts/release-audiusd.sh $@

force-release-sps:
	@bash scripts/release-audiusd.sh $@


.PHONY: install uninstall
install:
	@bash scripts/install-audius-ctl.sh local

uninstall:
	@bash scripts/uninstall-audius-ctl.sh

.PHONY: clean
clean:
	rm -f bin/*

.PHONY: install-deps
install-deps:
	@brew install protobuf
	@brew install crane
	@brew install bufbuild/buf/buf
	@go install github.com/onsi/ginkgo/v2/ginkgo@v2.19.0
	@go install github.com/sqlc-dev/sqlc/cmd/sqlc@latest
	@go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
	@go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest
	@go install github.com/cortesi/modd/cmd/modd@latest
	@go install github.com/a-h/templ/cmd/templ@latest
	@go install github.com/ethereum/go-ethereum/cmd/abigen@latest
	@go install github.com/go-swagger/go-swagger/cmd/swagger@latest

go.sum: go.mod
go.mod: $(GO_SRCS)
	@# dummy go.mod file to speed up tidy times
	@[ -d node_modules ] && touch node_modules/go.mod || true
	go mod tidy
	@touch go.mod # in case there's nothing to tidy

.PHONY: gen
gen: regen-abi regen-templ regen-proto regen-sql regen-go

.PHONY: regen-abi
regen-abi: $(ABI_ARTIFACTS)
$(ABI_ARTIFACTS): $(ABI_SRCS)
	@echo Regenerating ABI contracts
	@jq '.abi' $(ABI_SRC_DIR)/ERC20Detailed.json > $(ABI_ARTIFACT_DIR)/ERC20Detailed.json
	@jq '.abi' $(ABI_SRC_DIR)/Registry.json > $(ABI_ARTIFACT_DIR)/Registry.json
	@jq '.abi' $(ABI_SRC_DIR)/ServiceProviderFactory.json > $(ABI_ARTIFACT_DIR)/ServiceProviderFactory.json

.PHONY: regen-templ
regen-templ: $(TEMPL_ARTIFACTS)
$(TEMPL_ARTIFACTS): $(TEMPL_SRCS)
	@echo Regenerating templ code
	cd pkg/core/console && go generate ./...

.PHONY: regen-proto
regen-proto: $(PROTO_ARTIFACTS)
$(PROTO_ARTIFACTS): $(PROTO_SRCS)
	@echo Regenerating protobuf code
	cd pkg/core && buf generate
	cd pkg/core/gen/core_proto && swagger generate client -f protocol.swagger.json -t ../ --client-package=core_openapi
	cd packages/discovery-provider/src/tasks/core && chmod +x fix-proto-imports.sh && ./fix-proto-imports.sh

.PHONY: regen-sql
regen-sql: $(SQL_ARTIFACTS)
$(SQL_ARTIFACTS): $(SQL_SRCS)
	@echo Regenerating sql code
	cd pkg/core/db && sqlc generate

.PHONY: regen-go
regen-go:
	cd pkg/core && go generate ./...


##############
## MEDIORUM ##
##############

.PHONY: mediorum-dev
mediorum-dev:
	@if docker ps -q -f name=postgres; then \
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
bin/core: $(BUILD_SRCS)
	@go build -ldflags "$(VERSION_LDFLAG)" -o bin/core ./cmd/core/main.go

.PHONY: core-build-amd64
core-build-amd64: bin/core-amd64
bin/core-amd64: $(BUILD_SRCS)
	@GOOS=linux GOARCH=amd64 go build -ldflags "$(VERSION_LDFLAG)" -o bin/core-amd64 ./cmd/core/main.go

.PHONY: core-dev
core-dev: gen
	audius-compose up db core core-content-1 core-content-2 core-content-3 eth-ganache ingress

.PHONY: core-test
core-test: gen
	cd pkg/core && go test -count=1 -v ./... -timeout 60s

.PHONY: core-sandbox
core-sandbox: core-build-amd64
	@scripts/add-sandbox-hosts.sh
	@docker compose -f ./cmd/core/infra/docker-compose.yml --profile prod --profile stage --profile dev up --build -d

.PHONY: core-down-sandbox
core-down-sandbox:
	@docker compose -f ./cmd/core/infra/docker-compose.yml --profile prod --profile stage --profile dev down

.PHONY: core-prod-sandbox
core-prod-sandbox: core-build-amd64
	@scripts/add-sandbox-hosts.sh
	@docker compose -f ./cmd/core/infra/docker-compose.yml --profile prod up --build -d

.PHONY: core-stage-sandbox
core-stage-sandbox: core-build-amd64
	@scripts/add-sandbox-hosts.sh
	@docker compose -f ./cmd/core/infra/docker-compose.yml --profile stage up --build -d

.PHONY: core-dev-sandbox
core-dev-sandbox: core-build-amd64
	@scripts/add-sandbox-hosts.sh
	@docker compose -f ./cmd/core/infra/docker-compose.yml --profile dev up --build -d

.PHONY: core-livereload
core-livereload:
	modd

#############################
## Audio Analysis Backfill ##
#############################

.PHONY: release-aa-backfill
release-aa-backfill:
	@DOCKER_DEFAULT_PLATFORM=linux/amd64 docker build -t audius/audio-analysis-backfill:latest -f ./cmd/audio-analysis-backfill/Dockerfile .
	@docker push audius/audio-analysis-backfill:latest

