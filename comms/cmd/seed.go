package cmd

import (
	"comms.audius.co/shared/peering"
	"comms.audius.co/storage/client"
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
		imageCmd.Run(cmd, args)
		audioCmd.Run(cmd, args)
	},
}

func init() {
	storageCmd.AddCommand(seedCmd)

	seedCmd.PersistentFlags().BoolVarP(&multi, "multi", "m", true, "whether to seed a single node or multi node setup")

	p := peering.New(nil)
	cnodes, err := p.GetContentNodes()
	if err != nil {

	}

	ClientList = make([]client.StorageClient, len(cnodes))
	for _, cnode := range cnodes {
		storageClient := client.StorageClient{Endpoint: cnode.Endpoint}
		ClientList = append(ClientList, storageClient)
	}
}
