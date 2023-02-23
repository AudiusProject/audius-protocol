package cmd

import (
	"comms.audius.co/discovery"
	"github.com/spf13/cobra"
)

var discoveryCmd = &cobra.Command{
	Use:   "discovery",
	Short: "",
	Long:  ``,
	Run: func(cmd *cobra.Command, args []string) {
		discovery.DiscoveryMain()
	},
}

func init() {
	rootCmd.AddCommand(discoveryCmd)
}
