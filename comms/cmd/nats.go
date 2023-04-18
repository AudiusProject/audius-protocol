package cmd

import (
	"time"

	"github.com/spf13/cobra"
)

var natsCmd = &cobra.Command{
	Use:   "nats",
	Short: "",
	Long:  ``,
	Run: func(cmd *cobra.Command, args []string) {
		// todo: rm all the nats code
		// for now just sleep
		time.Sleep(time.Hour * 1000)
	},
}

func init() {
	rootCmd.AddCommand(natsCmd)
}
