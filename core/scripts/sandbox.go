package main

import (
	"context"
	"log"

	"github.com/AudiusProject/audius-protocol/core/gen/proto"
	"github.com/AudiusProject/audius-protocol/core/sdk"
	"golang.org/x/sync/errgroup"
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

	g, ctx := errgroup.WithContext(ctx)

	g.Go(func() error {
		_, err := sdk.SetKeyValue(ctx, &proto.SetKeyValueRequest{
			Key:   "batman",
			Value: "bruce wayne",
		})
		return err
	})

	g.Go(func() error {
		_, err := sdk.SetKeyValue(ctx, &proto.SetKeyValueRequest{
			Key:   "superman",
			Value: "clark kent",
		})
		return err
	})

	g.Go(func() error {
		_, err := sdk.SetKeyValue(ctx, &proto.SetKeyValueRequest{
			Key:   "wonder woman",
			Value: "diana prince",
		})
		return err
	})

	g.Go(func() error {
		_, err := sdk.SetKeyValue(ctx, &proto.SetKeyValueRequest{
			Key:   "spiderman",
			Value: "peter parker",
		})
		return err
	})

	g.Go(func() error {
		_, err := sdk.SetKeyValue(ctx, &proto.SetKeyValueRequest{
			Key:   "thanos",
			Value: "did nothing wrong",
		})
		return err
	})

	g.Go(func() error {
		_, err := sdk.SetKeyValue(ctx, &proto.SetKeyValueRequest{
			Key:   "i am",
			Value: "iron man",
		})
		return err
	})

	// Wait for all goroutines to complete
	if err := g.Wait(); err != nil {
		checkErr(err)
	}
}
