package tests

import (
	"context"
	"net/http"

	"comms.audius.co/shared/peering"
	storageclient "comms.audius.co/storage/client"
	"comms.audius.co/storage/config"
	"comms.audius.co/storage/storageserver"
	"github.com/nats-io/nats.go"
)

func SpawnServer() (*storageclient.StorageClient, *storageserver.StorageServer, error) {
	storageConfig := config.GetStorageConfig()

	peering := peering.New(&storageConfig.PeeringConfig)
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
