/*
Copyright © 2023 NAME HERE <EMAIL ADDRESS>
*/
package cmd

import (
	"github.com/spf13/cobra"
)

const (
	NODE1           = "http://node1"
	NODE2           = "http://node2"
	NODE3           = "http://node3"
	NODE4           = "http://node4"
)

var idToNode = map[int]string {
	0: NODE1,
	1: NODE2,
	2: NODE3,
	3: NODE4,
}

// seedCmd represents the seed command
var seedCmd = &cobra.Command{
	Use:   "seed",
	Short: "populate storage with test data",
	Long: `Upload test images or audio to the jetstream
	and persistent storage.

	./comms storage seed audio
	./comms storage seed image
	`,
	Run: func(cmd *cobra.Command, args []string) {
		imageCmd.Execute()
		audioCmd.Execute()
	},
}

func init() {
	storageCmd.AddCommand(seedCmd)
}
