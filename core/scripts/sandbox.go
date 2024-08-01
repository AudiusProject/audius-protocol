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
	res, err := sdk.GetEvent(context.Background(), &proto.GetEventRequest{Txhash: "E23871FA5C351D201AD9C72A8D0FAC55DF05813E9A3D0C22774A4C0ED4E593A8"})
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
