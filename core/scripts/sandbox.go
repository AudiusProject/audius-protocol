package main

import (
	"context"
	"log"

	"github.com/AudiusProject/audius-protocol/core/gen/proto"
	"github.com/AudiusProject/audius-protocol/core/sdk"
	"github.com/davecgh/go-spew/spew"
)

func main() {
	sdk, _ := sdk.NewSdk(sdk.WithGrpcendpoint("0.0.0.0:6612"))
	res, err := sdk.GetEvent(context.Background(), &proto.GetEventRequest{Txhash: "23AC594AADFD9D6B807A4B45389056CF40E525AE6AAB4EA85CBCF0A9095510A2"})
	if err != nil {
		log.Fatal(err)
	}
	spew.Dump(res.Event.Body)
}
