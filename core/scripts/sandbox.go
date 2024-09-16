package main

import (
	"context"
	"log"
	"math/rand"
	"time"

	"github.com/AudiusProject/audius-protocol/core/gen/proto"
	"github.com/AudiusProject/audius-protocol/core/sdk"
	"github.com/google/uuid"
)

const letterBytes = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"

func checkErr(e error) {
	if e != nil {
		log.Fatal(e)
	}
}

func main() {
	rand.Seed(time.Now().UnixNano())
	ctx := context.Background()

	sdk, err := sdk.NewSdk(sdk.WithGrpcendpoint("0.0.0.0:6612"), sdk.WithJrpcendpoint("http://0.0.0.0:6611"))
	checkErr(err)

	_, err = sdk.Ping(ctx, &proto.PingRequest{})
	checkErr(err)

	for {
		randString := uuid.NewString()
		log.Printf("Setting 'randomString' to '%s'", randString)
		time.Sleep(1 * time.Second)
		_, err = sdk.SetKeyValue(ctx, &proto.SetKeyValueRequest{
			Key:   "randomString",
			Value: randString,
		})
		checkErr(err)
	}
}
