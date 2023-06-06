package cmd

import (
	"encoding/json"
	"fmt"
	"time"

	"comms.audius.co/discovery"
	"comms.audius.co/discovery/config"
	"comms.audius.co/discovery/db"
	"comms.audius.co/discovery/rpcz"
	"comms.audius.co/discovery/schema"
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
	rootCmd.AddCommand(&cobra.Command{
		Use: "ban",
		Run: func(cmd *cobra.Command, args []string) {
			fmt.Println("banning:", args)
			sendInternalRpc("internal.chat.ban", map[string]any{
				"user_ids": args,
			})
		},
	})
	rootCmd.AddCommand(&cobra.Command{
		Use: "unban",
		Run: func(cmd *cobra.Command, args []string) {
			fmt.Println("unbanning:", args)
			sendInternalRpc("internal.chat.unban", map[string]any{
				"user_ids": args,
			})
		},
	})
}

func sendInternalRpc(method string, params any) error {
	paramsJson, err := json.Marshal(params)
	if err != nil {
		panic(err)
	}

	rawRpc := &schema.RawRPC{
		Method:    method,
		Params:    paramsJson,
		Timestamp: time.Now().UnixMilli(),
	}

	err = db.Dial()
	if err != nil {
		panic(err)
	}

	discoveryConfig := config.Parse()
	if err != nil {
		panic(err)
	}

	proc, err := rpcz.NewProcessor(discoveryConfig)
	if err != nil {
		panic(err)
	}

	log, err := rpcz.PrepareSignedRpcLog(rawRpc, discoveryConfig.MyPrivateKey)
	if err != nil {
		panic(err)
	}

	_, err = proc.ApplyAndPublish(log)
	if err != nil {
		panic(err)
	}

	return nil
}
