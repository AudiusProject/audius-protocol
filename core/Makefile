deps::
	@go install github.com/onsi/ginkgo/v2/ginkgo@v2.19.0
	@brew install protobuf
	@go install github.com/sqlc-dev/sqlc/cmd/sqlc@latest
	@go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
	@go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest

gen::
	protoc --go_out=./pkg/gen --go-grpc_out=./pkg/gen ./protocol.proto
	go mod tidy

test::
	@go test -v ./pkg/...
	@cd test/integration && ginkgo -r
