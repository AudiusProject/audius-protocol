package server

import (
	"fmt"

	"github.com/AudiusProject/audius-protocol/pkg/core/sdk"
)

var (
	initializing              = false
	initialized               = false
	initializationError error = nil
)

func (ss *MediorumServer) getCoreSdk() (*sdk.Sdk, error) {
	if initializationError != nil {
		return nil, initializationError
	}

	if ss.coreSdk != nil {
		return ss.coreSdk, nil
	}

	if err := ss.initCoreSdk(); err != nil {
		return nil, err
	}

	return ss.coreSdk, nil
}

func (ss *MediorumServer) initCoreSdk() error {
	// another goroutine is initializing
	if initialized || initializing {
		return nil
	}

	defer func() {
		// initialize on either error or success
		initialized = true
		initializing = false
	}()

	// claim lock
	initializing = true
	coreSdk, err := sdk.NewSdk(sdk.WithGrpcendpoint(ss.Config.CoreGRPCEndpoint), sdk.WithJrpcendpoint(ss.Config.CoreJRPCEndpoint))
	if err != nil {
		initializationError = err
		return fmt.Errorf("error initialized core sdk: %v", err)
	}
	ss.coreSdk = coreSdk
	return nil
}
