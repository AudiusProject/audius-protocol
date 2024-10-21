.PHONY: gen-py

gen-py:
	@echo "Generating Python gRPC code..."
	python3 -m grpc_tools.protoc \
			--python_out=./gen \
			--grpc_python_out=./gen \
			--plugin=protoc-gen-mypy=$(which protoc-gen-mypy) \
			--proto_path=../../../../../pkg/core \
			../../../../../pkg/core/protocol.proto
