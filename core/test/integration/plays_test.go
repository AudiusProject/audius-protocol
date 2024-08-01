package integration_test

import (
	"context"
	"time"

	"github.com/AudiusProject/audius-protocol/core/gen/proto"
	"github.com/AudiusProject/audius-protocol/core/grpc"
	"github.com/AudiusProject/audius-protocol/core/sdk"
	"github.com/google/uuid"
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
	protob "google.golang.org/protobuf/proto"
	"google.golang.org/protobuf/types/known/timestamppb"
)

var _ = Describe("Plays", func() {
	It("submits and reads back a play through grpc", func() {
		ctx := context.Background()

		sdk, err := sdk.NewSdk(sdk.WithGrpcendpoint("0.0.0.0:6612"))
		Expect(err).To(BeNil())

		listens := []*proto.Listen{
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

		playEvent := &proto.Event{
			Body: &proto.Event_Plays{
				Plays: &proto.PlaysEvent{
					Listens: listens,
				},
			},
		}

		expectedTxHash, err := grpc.ToTxHash(playEvent)
		Expect(err).To(BeNil())

		req := &proto.SubmitEventRequest{
			Event: playEvent,
		}

		submitRes, err := sdk.SubmitEvent(ctx, req)
		Expect(err).To(BeNil())

		txhash := submitRes.GetTxhash()
		Expect(expectedTxHash).To(Equal(txhash))

		time.Sleep(time.Second * 1)

		playEventRes, err := sdk.GetEvent(ctx, &proto.GetEventRequest{Txhash: txhash})
		Expect(err).To(BeNil())

		Expect(protob.Equal(playEvent, playEventRes.GetEvent())).To(BeTrue())

		// test rpc get hash works too
		txResult, err := sdk.Tx(ctx, []byte(txhash), true)
		Expect(err).To(BeNil())
		Expect(txResult.Hash.Bytes()).To(Equal([]byte(txhash)))
	})
})
