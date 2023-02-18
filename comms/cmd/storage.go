/*
Copyright © 2023 NAME HERE <EMAIL ADDRESS>
*/
package cmd

import (
	"comms.audius.co/storage"
	"github.com/spf13/cobra"
)

// storageCmd represents the storage command
var storageCmd = &cobra.Command{
	Use:   "storage",
	Short: "",
	Long:  ``,
	Run: func(cmd *cobra.Command, args []string) {
		storage.StorageMain()
	},
}

func init() {
	rootCmd.AddCommand(storageCmd)
}
