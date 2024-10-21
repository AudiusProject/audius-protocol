package main

import (
	"context"
	"log"
	"math/rand"
	"time"

	"github.com/AudiusProject/audius-protocol/pkg/core/gen/proto"
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

	_, err = sdk.Ping(ctx, &proto.PingRequest{})
	checkErr(err)

	for {
		time.Sleep(1 * time.Second)
		_, err = sdk.SendTransaction(ctx, &proto.SendTransactionRequest{
			Transaction: &proto.SignedTransaction{
				Transaction: &proto.SignedTransaction_ManageEntity{
					ManageEntity: &proto.ManageEntityLegacy{
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

		_, err = sdk.SendTransaction(ctx, &proto.SendTransactionRequest{
			Transaction: &proto.SignedTransaction{
				Transaction: &proto.SignedTransaction_Plays{
					Plays: &proto.TrackPlays{
						Plays: []*proto.TrackPlay{{
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
