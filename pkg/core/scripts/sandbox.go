package main

import (
	"context"
	"log"
	"math/rand"
	"time"

	"github.com/AudiusProject/audius-protocol/pkg/core/gen/core_proto"
	"github.com/AudiusProject/audius-protocol/pkg/core/sdk"
	"github.com/google/uuid"
	"google.golang.org/protobuf/types/known/timestamppb"
)

func checkErr(e error) {
	if e != nil {
		log.Fatal(e)
	}
}

func main() {
	ctx := context.Background()

	sdk, err := sdk.NewSdk(sdk.WithGrpcendpoint("0.0.0.0:6613"), sdk.WithJrpcendpoint("http://0.0.0.0:6612"))
	checkErr(err)

	_, err = sdk.Ping(ctx, &core_proto.PingRequest{})
	checkErr(err)

	for {
		time.Sleep(1 * time.Second)
		_, err = sdk.SendTransaction(ctx, &core_proto.SendTransactionRequest{
			Transaction: &core_proto.SignedTransaction{
				Transaction: &core_proto.SignedTransaction_ManageEntity{
					ManageEntity: &core_proto.ManageEntityLegacy{
						UserId:     rand.Int63(),
						EntityId:   rand.Int63(),
						EntityType: uuid.NewString(),
						Action:     uuid.NewString(),
						Metadata:   "some json",
						Signature:  uuid.NewString(),
					},
				},
			},
		})
		checkErr(err)

		_, err = sdk.SendTransaction(ctx, &core_proto.SendTransactionRequest{
			Transaction: &core_proto.SignedTransaction{
				Transaction: &core_proto.SignedTransaction_Plays{
					Plays: &core_proto.TrackPlays{
						Plays: []*core_proto.TrackPlay{{
							UserId:    uuid.NewString(),
							TrackId:   uuid.NewString(),
							Timestamp: timestamppb.Now(),
							Signature: "sig",
						}},
					},
				},
			},
		})
		checkErr(err)
	}
}
