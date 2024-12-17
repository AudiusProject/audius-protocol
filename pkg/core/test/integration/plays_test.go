package integration_test

import (
	"context"
	"time"

	"github.com/AudiusProject/audius-protocol/pkg/core/common"
	"github.com/AudiusProject/audius-protocol/pkg/core/gen/core_proto"
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

		listens := []*core_proto.TrackPlay{
			{
				UserId:    uuid.NewString(),
				TrackId:   uuid.NewString(),
				Timestamp: timestamppb.New(time.Now()),
				Signature: "todo: impl",
				City:      uuid.NewString(),
				Region:    uuid.NewString(),
				Country:   uuid.NewString(),
			},
			{
				UserId:    uuid.NewString(),
				TrackId:   uuid.NewString(),
				Timestamp: timestamppb.New(time.Now()),
				Signature: "todo: impl",
				City:      uuid.NewString(),
				Region:    uuid.NewString(),
				Country:   uuid.NewString(),
			},
			{
				UserId:    uuid.NewString(),
				TrackId:   uuid.NewString(),
				Timestamp: timestamppb.New(time.Now()),
				Signature: "todo: impl",
				City:      uuid.NewString(),
				Region:    uuid.NewString(),
				Country:   uuid.NewString(),
			},
		}

		playEvent := &core_proto.SignedTransaction{
			Transaction: &core_proto.SignedTransaction_Plays{
				Plays: &core_proto.TrackPlays{
					Plays: listens,
				},
			},
		}

		expectedTxHash, err := common.ToTxHash(playEvent)
		Expect(err).To(BeNil())

		req := &core_proto.SendTransactionRequest{
			Transaction: playEvent,
		}

		submitRes, err := sdk.SendTransaction(ctx, req)
		Expect(err).To(BeNil())

		txhash := submitRes.GetTxhash()
		Expect(expectedTxHash).To(Equal(txhash))

		time.Sleep(time.Second * 1)

		playEventRes, err := sdk.GetTransaction(ctx, &core_proto.GetTransactionRequest{Txhash: txhash})
		Expect(err).To(BeNil())

		Expect(protob.Equal(playEvent, playEventRes.GetTransaction())).To(BeTrue())
	})
})
