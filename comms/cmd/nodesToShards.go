package cmd

import (
	"encoding/json"
	"fmt"

	"comms.audius.co/storage/telemetry"
	"github.com/spf13/cobra"
)

var nodeStatusesCmd = &cobra.Command{
	Use:   "nodeStatuses",
	Short: "",
	Long:  ``,
	Run: func(cmd *cobra.Command, args []string) {
		telemetry.DiscardLogs()
		clientCount, err := initClients()
		if err != nil || clientCount < 1 {
			fmt.Println("Couldn't find any clients")
			return
		}

		client := ClientList[0]
		nodeStatuses, err := client.GetNodeStatuses()
		if err != nil {
			fmt.Printf("getting nodes to shards error, %+v\n", nodeStatuses)
			return
		}

		prettyPrint, err := json.MarshalIndent(nodeStatuses, "", "  ")
		if err != nil {
			return
		}

		fmt.Printf("%s\n", prettyPrint)
	},
}

func init() {
	storageCmd.AddCommand(nodeStatusesCmd)
}
