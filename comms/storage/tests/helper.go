package tests

import (
	"context"
	"net/http"

	discoveryConfig "comms.audius.co/discovery/config"
	"comms.audius.co/shared/peering"
	storageclient "comms.audius.co/storage/client"
	"comms.audius.co/storage/config"
	"comms.audius.co/storage/storageserver"
	"github.com/nats-io/nats.go"
)

func SpawnServer() (*storageclient.StorageClient, *storageserver.StorageServer, error) {
	storageConfig := config.GetStorageConfig()

	// TODO: We need to change a bunch of stuff in shared/peering/ before we can remove this.
	//       Make each config usage in shared/peering take the needed arguments instead of the whole config.
	discoveryConfig.Init(storageConfig.Keys)

	peering := peering.New(storageConfig.DevOnlyRegisteredNodes)
	jsc, err := func() (nats.JetStreamContext, error) {
		err := peering.PollRegisteredNodes()
		if err != nil {
			return nil, err
		}
		peerMap := peering.Solicit()
		return peering.DialJetstream(peerMap)
	}()
	if err != nil {
		return nil, nil, err
	}

	allNodes, err := peering.GetContentNodes()
	if err != nil {
		return nil, nil, err
	}
	ss := storageserver.NewProd(storageConfig, jsc, allNodes)

	// Start server
	go func() {
		if err := ss.WebServer.Start(":8926"); err != nil && err != http.ErrServerClosed {
			ss.WebServer.Logger.Fatal("shutting down the server", err)
		}
	}()

	if err := ss.WebServer.Shutdown(context.Background()); err != nil {
		ss.WebServer.Logger.Fatal(err)
	}

	client := storageclient.NewStorageClient("http://node1")

	return &client, ss, nil
}
