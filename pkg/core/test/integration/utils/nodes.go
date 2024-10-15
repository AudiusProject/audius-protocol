package utils

import (
	"log"
	"os"

	"github.com/AudiusProject/audius-protocol/pkg/core/sdk"
)

var (
	discoveryOneGrpc = getEnvWithDefault("discoveryOneGRPC", "0.0.0.0:6613")
	discoveryOneJrpc = getEnvWithDefault("discoveryOneJRPC", "http://0.0.0.0:6612")

	contentOneGrpc = getEnvWithDefault("contentOneGRPC", "0.0.0.0:6713")
	contentOneJrpc = getEnvWithDefault("contentOneJRPC", "http://0.0.0.0:6712")

	contentTwoGrpc = getEnvWithDefault("contentTwoGRPC", "0.0.0.0:6723")
	contentTwoJrpc = getEnvWithDefault("contentOneJRPC", "http://0.0.0.0:6722")

	contentThreeGrpc = getEnvWithDefault("contentThreeGRPC", "0.0.0.0:6733")
	contentThreeJrpc = getEnvWithDefault("contentThreeJRPC", "http://0.0.0.0:6732")

	DiscoveryOne = newTestSdk(discoveryOneGrpc, discoveryOneJrpc)
	ContentOne   = newTestSdk(contentOneGrpc, contentOneJrpc)
	ContentTwo   = newTestSdk(contentTwoGrpc, contentTwoJrpc)
	ContentThree = newTestSdk(contentThreeGrpc, contentThreeJrpc)
)

func getEnvWithDefault(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}

func newTestSdk(grpc, jrpc string) *sdk.Sdk {
	node, err := sdk.NewSdk(sdk.WithGrpcendpoint(grpc), sdk.WithJrpcendpoint(jrpc))
	if err != nil {
		log.Panicf("node init error %s %s: %v", grpc, jrpc, err)
	}
	return node
}
