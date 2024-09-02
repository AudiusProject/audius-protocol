SQL_SRCS := $(shell find db/sql/ -type f -name '*.sql') db/sqlc.yaml

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
gen: $(SQL_SRCS)
	@which sqlc || ( \
		echo "ERROR: sqlc command not found." \
		"Run 'make deps' to install necessary tooling." \
		&& false \
	)
	go generate ./...
	cd db && sqlc generate
	go mod tidy

build-native:
	@go build -o ./tmp/core

build-amd64:
	@GOOS=linux GOARCH=amd64 go build -o ./tmp/core-amd64

.PHONY: dev
dev:
	make gen
	audius-compose up db core core-content-1 core-content-2 core-content-3

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
