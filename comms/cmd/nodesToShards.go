package cmd

import (
	"encoding/json"
	"fmt"

	"github.com/spf13/cobra"
)

var nodesToShardsCmd = &cobra.Command{
	Use:   "nodesToShards",
	Short: "",
	Long:  ``,
	Run: func(cmd *cobra.Command, args []string) {
		clientCount, err := initClients()
		if err != nil || clientCount < 1 {
			fmt.Println("Couldn't find any clients")
			return
		}

		client := ClientList[0]
		nodesToShards, err := client.GetNodeStatuses()
		if err != nil {
			fmt.Printf("getting nodes to shards error, %+v\n", nodesToShards)
			return
		}

		prettyPrint, err := json.MarshalIndent(nodesToShards, "", "  ")
		if err != nil {
			return
		}

		fmt.Printf("%s\n", prettyPrint)
	},
}

func init() {
	storageCmd.AddCommand(nodesToShardsCmd)
}
