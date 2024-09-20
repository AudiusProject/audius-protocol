//go:build osx
// +build osx

package main

import (
	"github.com/AudiusProject/audius-protocol/pkg/statusbar"
	"github.com/spf13/cobra"
)

var sbCmd = &cobra.Command{
	Use:   "statusbar",
	Short: "Run osx status bar",
	RunE: func(cmd *cobra.Command, args []string) error {
		return statusbar.RunStatusBar()
	},
}
