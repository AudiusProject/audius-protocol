package main

import (
	"context"
	"log"
	"math/rand"
	"time"

	"github.com/AudiusProject/audius-protocol/core/gen/proto"
	"github.com/AudiusProject/audius-protocol/core/sdk"
)

const letterBytes = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"

func checkErr(e error) {
	if e != nil {
		log.Fatal(e)
	}
}

func generateRandomString(n int) string {
	b := make([]byte, n)
	for i := range b {
		b[i] = letterBytes[rand.Intn(len(letterBytes))]
	}
	return string(b)
}

func main() {
	rand.Seed(time.Now().UnixNano())
	length := 10
	randomString := generateRandomString(length)
	ctx := context.Background()

	sdk, err := sdk.NewSdk(sdk.WithGrpcendpoint("0.0.0.0:6612"), sdk.WithJrpcendpoint("http://0.0.0.0:6611"))
	checkErr(err)

	_, err = sdk.Ping(ctx, &proto.PingRequest{})
	checkErr(err)

	_, err = sdk.SetKeyValue(ctx, &proto.SetKeyValueRequest{
		Key:   "randomString",
		Value: randomString,
	})
	checkErr(err)
}
