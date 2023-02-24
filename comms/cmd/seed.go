package cmd

import (
	"fmt"
	"log"

	"comms.audius.co/shared/peering"
	"comms.audius.co/storage/client"
	"comms.audius.co/storage/config"
	"github.com/nats-io/nats.go"
	"github.com/spf13/cobra"
)

var single bool

var ClientList []*client.StorageClient

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

	seedCmd.PersistentFlags().BoolVarP(&single, "single", "s", false, "whether to seed a single node or multi node setup")
}

func initClients() (int, error) {
	storageConfig := config.GetStorageConfig()

	peering := peering.New(&storageConfig.PeeringConfig)
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
		return 0, err
	}

	cnodes, err := peering.GetContentNodes()
	if err != nil {
		fmt.Println("[ERROR] could not get content nodes")
		return 0, err
	}

	ClientList = make([]*client.StorageClient, 0)
	for _, cnode := range cnodes {
		storageClient := client.NewStorageClient(cnode.Endpoint)
		ClientList = append(ClientList, &storageClient)
	}

	return len(ClientList), nil
}
