package cmd

import (
	"fmt"
	"log"

	discoveryConfig "comms.audius.co/discovery/config"
	"comms.audius.co/shared/peering"
	"comms.audius.co/storage/client"
	"comms.audius.co/storage/config"
	"github.com/nats-io/nats.go"
	"github.com/spf13/cobra"
)

var multi bool

var ClientList []client.StorageClient

var seedCmd = &cobra.Command{
	Use:   "seed",
	Short: "populate storage with test data",
	Long: `Upload test images or audio to the jetstream
	and persistent storage.

	./comms storage seed audio
	./comms storage seed image
	`,
	Run: func(cmd *cobra.Command, args []string) {
		initClients()
		imageCmd.Run(cmd, args)
		audioCmd.Run(cmd, args)
	},
}

func init() {
	storageCmd.AddCommand(seedCmd)

	seedCmd.PersistentFlags().BoolVarP(&multi, "multi", "m", true, "whether to seed a single node or multi node setup")
}

func initClients() {
	storageConfig := config.GetStorageConfig()

	// TODO: We need to change a bunch of stuff in shared/peering/ before we can remove this.
	//       Make each config usage in shared/peering take the needed arguments instead of the whole config.
	discoveryConfig.Init(storageConfig.Keys)

	peering := peering.New(storageConfig.DevOnlyRegisteredNodes)
	_, err := func() (nats.JetStreamContext, error) {
		err := peering.PollRegisteredNodes()
		if err != nil {
			return nil, err
		}
		peerMap := peering.Solicit()
		return peering.DialJetstream(peerMap)
	}()
	if err != nil {
		log.Fatal(err)
	}

	err = peering.PollRegisteredNodes()
	if err != nil {
		fmt.Println("[ERROR] could not poll registered nodes")
		return
	}

	cnodes, err := peering.GetContentNodes()
	if err != nil {
		fmt.Println("[ERROR] could not get content nodes")
		return
	}

	ClientList = make([]client.StorageClient, len(cnodes))
	for _, cnode := range cnodes {
		storageClient := client.StorageClient{Endpoint: cnode.Endpoint}
		fmt.Println(storageClient.Endpoint)
		ClientList = append(ClientList, storageClient)
	}
}
