package integration_test

import (
	"context"
	"time"

	"github.com/AudiusProject/audius-protocol/pkg/core/gen/proto"
	"github.com/AudiusProject/audius-protocol/pkg/core/grpc"
	"github.com/AudiusProject/audius-protocol/pkg/core/test/integration/utils"
	"github.com/google/uuid"
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
	protob "google.golang.org/protobuf/proto"
	"google.golang.org/protobuf/types/known/timestamppb"
)

var _ = Describe("Plays", func() {
	It("submits and reads back a play through grpc", func() {
		ctx := context.Background()

		sdk := utils.DiscoveryOne

		listens := []*proto.TrackPlay{
			{
				UserId:    uuid.NewString(),
				TrackId:   uuid.NewString(),
				Timestamp: timestamppb.New(time.Now()),
				Signature: "todo: impl",
			},
			{
				UserId:    uuid.NewString(),
				TrackId:   uuid.NewString(),
				Timestamp: timestamppb.New(time.Now()),
				Signature: "todo: impl",
			},
			{
				UserId:    uuid.NewString(),
				TrackId:   uuid.NewString(),
				Timestamp: timestamppb.New(time.Now()),
				Signature: "todo: impl",
			},
		}

		playEvent := &proto.SignedTransaction{
			Transaction: &proto.SignedTransaction_Plays{
				Plays: &proto.TrackPlays{
					Plays: listens,
				},
			},
		}

		expectedTxHash, err := grpc.ToTxHash(playEvent)
		Expect(err).To(BeNil())

		req := &proto.SendTransactionRequest{
			Transaction: playEvent,
		}

		submitRes, err := sdk.SendTransaction(ctx, req)
		Expect(err).To(BeNil())

		txhash := submitRes.GetTxhash()
		Expect(expectedTxHash).To(Equal(txhash))

		time.Sleep(time.Second * 1)

		playEventRes, err := sdk.GetTransaction(ctx, &proto.GetTransactionRequest{Txhash: txhash})
		Expect(err).To(BeNil())

		Expect(protob.Equal(playEvent, playEventRes.GetTransaction())).To(BeTrue())

		// test rpc get hash works too
		txResult, err := sdk.Tx(ctx, []byte(txhash), true)
		Expect(err).To(BeNil())
		Expect(txResult.Hash.Bytes()).To(Equal([]byte(txhash)))
	})
})
