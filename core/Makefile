dev-discovery-1::
	@go run main.go -env-file=./infra/dev_config/discovery-one.env

dev-content-1::
	@go run main.go -env-file=./infra/dev_config/content-one.env

dev-content-2::
	@go run main.go -env-file=./infra/dev_config/content-two.env

dev-content-3::
	@go run main.go -env-file=./infra/dev_config/content-three.env

up:
	make down
	make gen
	cd infra && docker compose up --build -d

down:
	cd infra && docker compose down

deps::
	@go install github.com/onsi/ginkgo/v2/ginkgo@v2.19.0
	@brew install protobuf
	@go install github.com/sqlc-dev/sqlc/cmd/sqlc@latest
	@go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
	@go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest

gen::
	cd db && sqlc generate
	go mod tidy

test::
	@go test -v ./...
	@cd test/integration && ginkgo -r
