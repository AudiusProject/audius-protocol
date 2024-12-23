package server

import (
	"time"

	"github.com/AudiusProject/audius-protocol/pkg/core/sdk"
)

func (ss *MediorumServer) getCoreSdk() (*sdk.Sdk, error) {
	// await core sdk ready
	<-ss.coreSdkReady
	return ss.coreSdk, nil
}

func (ss *MediorumServer) initCoreSdk() error {
	coreSdk, err := sdk.NewSdk(sdk.WithGrpcendpoint(ss.Config.CoreGRPCEndpoint))
	if err == nil {
		ss.coreSdk = coreSdk
		close(ss.coreSdkReady)
		return nil
	}

	for {
		time.Sleep(5 * time.Second)

		coreSdk, err := sdk.NewSdk(sdk.WithGrpcendpoint(ss.Config.CoreGRPCEndpoint))
		if err != nil {
			continue
		}

		ss.coreSdk = coreSdk
		close(ss.coreSdkReady)
		return nil
	}
}
