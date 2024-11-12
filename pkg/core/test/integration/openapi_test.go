package integration

import (
	"testing"

	"github.com/AudiusProject/audius-protocol/pkg/core/gen/core_openapi"
	"github.com/AudiusProject/audius-protocol/pkg/core/gen/core_openapi/protocol"
	"github.com/davecgh/go-spew/spew"
	"github.com/stretchr/testify/require"
)

func TestOpenAPI(t *testing.T) {
	t.Run("it creates an open api client", func(t *testing.T) {
		transport := core_openapi.DefaultTransportConfig().WithHost("audius-protocol-creator-node-2").WithSchemes([]string{"https"})
		client := core_openapi.NewHTTPClientWithConfig(nil, transport)

		params := protocol.NewProtocolGetNodeInfoParams()
		res, err := client.Protocol.ProtocolGetNodeInfo(params)
		require.Nil(t, err)

		spew.Dump(res.Payload)

	})
}
