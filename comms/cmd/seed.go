
package cmd

import (
	"comms.audius.co/storage/client"
	"github.com/spf13/cobra"
)

var ClientList = []client.StorageClient{
	client.NewStorageClient("http://node1"),
	client.NewStorageClient("http://node2"),
	client.NewStorageClient("http://node3"),
	client.NewStorageClient("http://node4"),
}

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
}
