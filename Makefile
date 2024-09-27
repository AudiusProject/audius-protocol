NETWORK ?= stage
AD_TAG ?= default
# One of patch, minor, or major
UPGRADE_TYPE ?= patch

ABI_DIR := pkg/register/ABIs
SRC := $(shell find pkg cmd -type f -name '*.go') go.mod go.sum

VERSION_LDFLAG := -X main.Version=$(shell git rev-parse HEAD)
# Intentionally kept separate to allow dynamic versioning
#LDFLAGS := ""

# WIP
bin/audiusd: $(SRC)
	@echo "Building audiusd for local platform and architecture..."
	CGO_ENABLED=0 go build -ldflags "$(VERSION_LDFLAG) $(LDFLAGS)" -o bin/audiusd-native ./cmd/audiusd

bin/audiusd-x86: $(SRC)
	@echo "Building audiusd for x86 Linux..."
	GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build -ldflags "$(VERSION_LDFLAG) $(LDFLAGS)" -o bin/audiusd-x86 ./cmd/audiusd
# END WIP

bin/audius-ctl-native: $(SRC)
	@echo "Building audius-ctl for local platform and architecture..."
	CGO_ENABLED=0 go build -ldflags "$(VERSION_LDFLAG) $(LDFLAGS)" -o bin/audius-ctl-native ./cmd/audius-ctl

bin/audius-ctl-arm64: $(SRC)
	@echo "Building arm audius-ctl..."
	CGO_ENABLED=0 GOOS=linux GOARCH=arm64 go build -ldflags "$(VERSION_LDFLAG) $(LDFLAGS)" -o bin/audius-ctl-arm64 ./cmd/audius-ctl

bin/audius-ctl-x86_64: $(SRC)
	@echo "Building x86 audius-ctl..."
	CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags "$(VERSION_LDFLAG) $(LDFLAGS)" -o bin/audius-ctl-x86_64 ./cmd/audius-ctl

bin/audius-ctl-arm64-macos: $(SRC)
	@echo "Building macos arm audius-ctl..."
	CGO_ENABLED=0 GOOS=darwin GOARCH=arm64 go build -ldflags "$(VERSION_LDFLAG) $(LDFLAGS)" -o bin/audius-ctl-arm64-macos ./cmd/audius-ctl

bin/audius-ctl-x86_64-macos: $(SRC)
	@echo "Building macos x86_64 audius-ctl..."
	CGO_ENABLED=0 GOOS=darwin GOARCH=amd64 go build -ldflags "$(VERSION_LDFLAG) $(LDFLAGS)" -o bin/audius-ctl-x86_64-macos ./cmd/audius-ctl

# Experimental statusbar feature
bin/audius-ctl-arm64-macos-experimental: $(SRC)
	@echo "Building macos arm audius-ctl..."
	GOOS=darwin GOARCH=arm64 go build -tags osx -ldflags "$(VERSION_LDFLAG) $(LDFLAGS)" -o bin/audius-ctl-arm64-macos ./cmd/audius-ctl

.PHONY: release-audius-ctl audius-ctl-production-build
release-audius-ctl:
	bash scripts/release-audius-ctl.sh

audius-ctl-production-build: VERSION_LDFLAG := -X main.Version=$(shell bash scripts/get-new-audius-ctl-version.sh $(UPGRADE_TYPE))
audius-ctl-production-build: clean regen-abis bin/audius-ctl-arm64 bin/audius-ctl-x86_64 bin/audius-ctl-arm64-macos bin/audius-ctl-x86_64-macos

.PHONY: regen-abis
regen-abis:
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
	bash scripts/install-audius-ctl.sh

uninstall:
	bash scripts/uninstall-audius-ctl.sh

.PHONY: clean
clean:
	rm -f bin/*
