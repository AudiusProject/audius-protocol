package main

import (
	"context"
	"log"

	"github.com/AudiusProject/audius-protocol/core/gen/proto"
	"github.com/AudiusProject/audius-protocol/core/sdk"
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

	_, err = sdk.SetKeyValue(ctx, &proto.SetKeyValueRequest{
		Key:   "batman",
		Value: "bruce wayne",
	})
	checkErr(err)

	_, err = sdk.GetKeyValue(ctx, &proto.GetKeyValueRequest{Key: "batman"})
	checkErr(err)
}
