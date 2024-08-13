SQL_SRCS := $(shell find db/sql/ -type f -name '*.sql') db/sqlc.yaml

.PHONY: deps
deps:
	@go install github.com/onsi/ginkgo/v2/ginkgo@v2.19.0
	@brew install protobuf
	@go install github.com/sqlc-dev/sqlc/cmd/sqlc@latest
	@go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
	@go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest
	@go install github.com/ethereum/go-ethereum/cmd/abigen@latest
	@go install github.com/cortesi/modd/cmd/modd@latest
	@go mod tidy

gen: $(SQL_SRCS)
	@which sqlc || ( \
		echo "ERROR: sqlc command not found." \
		"Run 'make deps' to install necessary tooling." \
		&& false \
	)
	go generate ./...

.PHONY: dev hotreload
dev:
	audius-compose up db core core-content-1 core-content-2 core-content-3

hotreload:
	modd

.PHONY: sandbox
sandbox:
	@go run ./scripts/sandbox.go
