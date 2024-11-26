package utils

import (
	"log"
	"os"

	"github.com/AudiusProject/audius-protocol/pkg/core/sdk"
)

var (
	discoveryOneGrpc = getEnvWithDefault("discoveryOneGRPC", "0.0.0.0:6613")
	discoveryOneJrpc = getEnvWithDefault("discoveryOneJRPC", "http://0.0.0.0:6612")
	discoveryOneOapi = getEnvWithDefault("discoveryOneOAPI", "audius-protocol-discovery-provider-1")

	contentOneGrpc = getEnvWithDefault("contentOneGRPC", "0.0.0.0:6713")
	contentOneJrpc = getEnvWithDefault("contentOneJRPC", "http://0.0.0.0:6712")
	contentOneOapi = getEnvWithDefault("contentOneOAPI", "audius-protocol-creator-node-1")

	contentTwoGrpc = getEnvWithDefault("contentTwoGRPC", "0.0.0.0:6723")
	contentTwoJrpc = getEnvWithDefault("contentTwoJRPC", "http://0.0.0.0:6722")
	contentTwoOapi = getEnvWithDefault("contentTwoOAPI", "audius-protocol-creator-node-2")

	contentThreeGrpc = getEnvWithDefault("contentThreeGRPC", "0.0.0.0:6733")
	contentThreeJrpc = getEnvWithDefault("contentThreeJRPC", "http://0.0.0.0:6732")
	contentThreeOapi = getEnvWithDefault("contentThreeOAPI", "audius-protocol-creator-node-3")

	DiscoveryOne = newTestSdk(discoveryOneGrpc, discoveryOneJrpc, discoveryOneOapi)
	ContentOne   = newTestSdk(contentOneGrpc, contentOneJrpc, contentOneOapi)
	ContentTwo   = newTestSdk(contentTwoGrpc, contentTwoJrpc, contentTwoOapi)
	ContentThree = newTestSdk(contentThreeGrpc, contentThreeJrpc, contentThreeOapi)
)

func getEnvWithDefault(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}

func newTestSdk(grpc, jrpc, oapi string) *sdk.Sdk {
	node, err := sdk.NewSdk(sdk.WithGrpcendpoint(grpc), sdk.WithJrpcendpoint(jrpc), sdk.WithOapiendpoint(oapi))
	if err != nil {
		log.Panicf("node init error %s %s: %v", grpc, jrpc, err)
	}
	return node
}
