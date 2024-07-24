dev::
	@go run main.go

dev-discovery::
	@go run main.go -env-file=./infra/dev_config/discovery.env

deps::
	@go install github.com/onsi/ginkgo/v2/ginkgo@v2.19.0
	@brew install protobuf
	@go install github.com/sqlc-dev/sqlc/cmd/sqlc@latest
	@go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
	@go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest

gen::
	cd db && sqlc generate
	protoc --go_out=./pkg/gen --go-grpc_out=./pkg/gen ./protocol.proto
	go mod tidy

test::
	@go test -v ./pkg/...
	@cd test/integration && ginkgo -r
