package server

import (
	"fmt"

	"github.com/AudiusProject/audius-protocol/core/sdk"
)

func (ss *MediorumServer) getCoreSdk() (*sdk.Sdk, error) {
	if ss.coreSdk != nil {
		return ss.coreSdk, nil
	}
	if err := ss.initCoreSdk(); err != nil {
		return nil, err
	}
	return ss.coreSdk, nil
}

func (ss *MediorumServer) initCoreSdk() error {
	coreSdk, err := sdk.NewSdk(sdk.WithGrpcendpoint(ss.Config.CoreGRPCEndpoint))
	if err != nil {
		return fmt.Errorf("error initialized core sdk: %v", err)
	}
	ss.coreSdk = coreSdk
	return nil
}
