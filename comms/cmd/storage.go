package cmd

import (
	"time"

	"github.com/spf13/cobra"
)

// storageCmd represents the storage command
var storageCmd = &cobra.Command{
	Use:   "storage",
	Short: "",
	Long:  ``,
	Run: func(cmd *cobra.Command, args []string) {
		// just sleep
		time.Sleep(time.Hour * 1000)
	},
}

func init() {
	rootCmd.AddCommand(storageCmd)
}
