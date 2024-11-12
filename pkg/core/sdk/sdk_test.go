package sdk

import (
	"context"
	"fmt"
	"testing"

	"github.com/AudiusProject/audius-protocol/pkg/core/gen/proto"
	"github.com/stretchr/testify/require"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

func TestSdk(t *testing.T) {
	t.Run("it can hit the /grpc endpoint", func(t *testing.T) {
		ctx := context.Background()

		grpcConn, err := grpc.NewClient("http://audius-protocol-creator-node-2/core/grpc", grpc.WithTransportCredentials(insecure.NewCredentials()))
		require.Nil(t, err)

		sdk := proto.NewProtocolClient(grpcConn)

		res, err := sdk.Ping(ctx, &proto.PingRequest{})
		require.Nil(t, err)

		fmt.Printf("got response: %v\n", res)
	})
}
