//go:build !osx
// +build !osx

package main

import (
	"fmt"

	"github.com/spf13/cobra"
)

var sbCmd = &cobra.Command{
	Use:   "statusbar",
	Short: "Run status bar [n/a]",
	RunE: func(cmd *cobra.Command, args []string) error {
		fmt.Println("statusbar command not available in this build")
		return nil
	},
}
