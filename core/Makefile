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

gen: $(SQL_SRCS)
	@which sqlc || ( \
		echo "ERROR: sqlc command not found." \
		"Run 'make deps' to install necessary tooling." \
		&& false \
	)
	go generate ./...
	cd db && sqlc generate

.PHONY: dev solo hotreload
dev:
	make gen
	audius-compose up db core core-content-1 core-content-2 core-content-3

solo:
	rm -rf ./tmp/soloNodeHome
	@echo "starting single node cluster"
	audius-compose up db
	go run main.go -env-file=./infra/dev_config/solo.env

seed:
	curl -s '0.0.0.0:6611/broadcast_tx_commit?tx="cometbft=rocks"'

hotreload:
	modd

.PHONY: sandbox
sandbox:
	@go run ./scripts/sandbox.go
