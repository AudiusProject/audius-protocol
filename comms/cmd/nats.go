package cmd

import (
	"comms.audius.co/natsd"
	"github.com/spf13/cobra"
)

var natsCmd = &cobra.Command{
	Use:   "nats",
	Short: "",
	Long: ``,
	Run: func(cmd *cobra.Command, args []string) {
		natsd.NatsMain()
	},
}

func init() {
	rootCmd.AddCommand(natsCmd)
}
