package cmd

import (
	"comms.audius.co/discovery"
	"comms.audius.co/discovery/db"
	"github.com/spf13/cobra"
)

// discoveryCmd represents the discovery command
var discoveryCmd = &cobra.Command{
	Use:   "discovery",
	Short: "",
	Long:  ``,
	Run: func(cmd *cobra.Command, args []string) {
		discovery.DiscoveryMain()
	},
}

// discoveryMigrationsCmd represents the discovery-migrations command
var discoveryMigrationsCmd = &cobra.Command{
	Use:   "discovery-migrations",
	Short: "",
	Long:  ``,
	Run: func(cmd *cobra.Command, args []string) {
		db.RunMigrations()
	},
}

func init() {
	rootCmd.AddCommand(discoveryCmd)
	rootCmd.AddCommand(discoveryMigrationsCmd)
}
