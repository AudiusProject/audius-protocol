package cmd

import (
	"fmt"

	"comms.audius.co/storage/telemetry"
	"github.com/spf13/cobra"
)

var numRequests int
var concurrency int
var queriesPerSecond float64
var timeout int

var loadTestCmd = &cobra.Command{
	Use:   "loadTest",
	Short: "",
	Long: ``,
	Run: func(cmd *cobra.Command, args []string) {
		telemetry.DiscardLogs()
		clientCount, err := initClients()
		if err != nil || clientCount < 1 {
			fmt.Printf("Couldn't find any clients, %+v\n", err)
			return
		}

		client := ClientList[0]
		_, err = client.AudioUploadLoadTest(numRequests, concurrency, queriesPerSecond, timeout)
		if err != nil {
			fmt.Printf("%+v\n", err)
		}
	},
}

func init() {
	storageCmd.AddCommand(loadTestCmd)
	loadTestCmd.Flags().IntVarP(&numRequests, "numRequests", "n", 100, "number of upload requests")
	loadTestCmd.Flags().IntVarP(&concurrency, "concurrency", "c", 10, "number of concurreny requests")
	loadTestCmd.Flags().Float64VarP(&queriesPerSecond, "queries", "q", 0, "queries per second i.e. request throttle (0 means no throttle)")
	loadTestCmd.Flags().IntVarP(&timeout, "timeout", "t", 30, "request timeout in seconds")
}
