.PHONY: gen-py

gen-py:
	@echo "Generating Python gRPC code..."
	python3 -m grpc_tools.protoc \
		--python_out=./gen \
		--grpc_python_out=./gen \
		--proto_path=../../../../../pkg/core \
		../../../../../pkg/core/protocol.proto
