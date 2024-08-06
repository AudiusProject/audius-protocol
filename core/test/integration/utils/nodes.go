package utils

import (
	"log"

	"github.com/AudiusProject/audius-protocol/core/sdk"
)

var (
	DiscoveryOne = newTestSdk("core-discovery-1:50051", "http://core-discovery-1:26657")
	ContentOne   = newTestSdk("core-content-1:50051", "http://core-content-1:26657")
	ContentTwo   = newTestSdk("core-content-2:50051", "http://core-content-2:26657")
	ContentThree = newTestSdk("core-content-3:50051", "http://core-content-3:26657")
)

func newTestSdk(grpc, jrpc string) *sdk.Sdk {
	node, err := sdk.NewSdk(sdk.WithGrpcendpoint(grpc), sdk.WithJrpcendpoint(jrpc))
	if err != nil {
		log.Panicf("node init error %s %s: %v", grpc, jrpc, err)
	}
	return node
}
