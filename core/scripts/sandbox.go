package main

import (
	"context"
	"log"
	"time"

	"github.com/AudiusProject/audius-protocol/core/gen/proto"
	"github.com/AudiusProject/audius-protocol/core/sdk"
	"google.golang.org/protobuf/types/known/timestamppb"
)

func checkErr(e error) {
	if e != nil {
		log.Fatal(e)
	}
}

func main() {
	ctx := context.Background()

	sdk, err := sdk.NewSdk(sdk.WithGrpcendpoint("0.0.0.0:6612"), sdk.WithJrpcendpoint("http://0.0.0.0:6611"))
	checkErr(err)

	_, err = sdk.Ping(ctx, &proto.PingRequest{})
	checkErr(err)

	for {
		time.Sleep(1 * time.Second)
		_, err = sdk.SubmitEvent(ctx, &proto.SubmitEventRequest{
			Event: &proto.Event{
				Body: &proto.Event_Plays{
					Plays: &proto.PlaysEvent{
						Listens: []*proto.Listen{{
							UserId:    "uuid.NewString()",
							TrackId:   "uuid.NewString()",
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
