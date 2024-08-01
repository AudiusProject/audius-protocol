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
	res, err := sdk.GetEvent(context.Background(), &proto.GetEventRequest{Txhash: ""})
	if err != nil {
		log.Fatal(err)
	}

	spewConfig := spew.ConfigState{
		Indent:                  "  ",
		DisableMethods:          true,
		DisablePointerAddresses: true,
		DisableCapacities:       true,
	}

	spewConfig.Dump(res.Event.Body)
}
