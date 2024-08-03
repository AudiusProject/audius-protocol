SQL_SRCS := $(shell find db/sql/ -type f -name '*.sql') db/sqlc.yaml

.PHONY: deps
deps:
	@go install github.com/onsi/ginkgo/v2/ginkgo@v2.19.0
	@brew install protobuf
	@go install github.com/sqlc-dev/sqlc/cmd/sqlc@latest
	@go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
	@go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest
	@go mod tidy

gen: $(SQL_SRCS)
	@which sqlc || ( \
		echo "ERROR: sqlc command not found." \
		"Run 'make deps' to install necessary tooling." \
		&& false \
	)
	cd db && sqlc generate

.PHONY: dev-discovery-1 dev-content-1 dev-content-2 dev-content-3
dev-discovery-1:
	@go run main.go -env-file=./infra/dev_config/discovery-one.env

dev-content-1:
	@go run main.go -env-file=./infra/dev_config/content-one.env

dev-content-2:
	@go run main.go -env-file=./infra/dev_config/content-two.env

dev-content-3:
	@go run main.go -env-file=./infra/dev_config/content-three.env

