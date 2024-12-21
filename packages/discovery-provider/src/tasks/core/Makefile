.PHONY: gen-py
gen-py:
	@echo "Generating Python gRPC code with type stubs..."
	python3 -m grpc_tools.protoc \
		--mypy_out=./gen \
		--plugin=protoc-gen-mypy=`which protoc-gen-mypy` \
		--proto_path=../../../../../pkg/core/protocol \
		../../../../../pkg/core/protocol/protocol.proto
