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
)

var _ = Describe("Plays", func() {
	It("submits and reads back a play through grpc", func() {
		ctx := context.Background()

		sdk, err := sdk.NewSdk(sdk.WithGrpcendpoint("0.0.0.0:6612"))
		Expect(err).To(BeNil())

		plays := make(map[string]*proto.PlayRecord)
		plays["trackid1"] = &proto.PlayRecord{
			ListenerAddress: uuid.NewString(),
			Count:           5,
		}
		plays["trackid2"] = &proto.PlayRecord{
			ListenerAddress: uuid.NewString(),
			Count:           10,
		}

		playEvent := &proto.Event{
			Body: &proto.Event_Plays{
				Plays: &proto.PlaysEvent{
					Plays: plays,
				},
			},
		}

		expectedTxHash, err := grpc.ToTxHash(playEvent)
		Expect(err).To(BeNil())

		req := &proto.SubmitEventRequest{
			// TODO: impl
			Signature: "",
			Event:     playEvent,
		}

		submitRes, err := sdk.SubmitEvent(ctx, req)
		Expect(err).To(BeNil())

		txhash := submitRes.GetTxhash()
		Expect(expectedTxHash).To(Equal(txhash))

		time.Sleep(time.Second * 1)

		playEventRes, err := sdk.GetEvent(ctx, &proto.GetEventRequest{Txhash: txhash})
		Expect(err).To(BeNil())

		Expect(protob.Equal(playEvent, playEventRes.GetEvent())).To(BeTrue())
	})
})
