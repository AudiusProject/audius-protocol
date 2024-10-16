package main

import (
	"github.com/AudiusProject/audius-protocol/pkg/logger"
	"github.com/AudiusProject/audius-protocol/pkg/orchestration"
	"github.com/spf13/cobra"
)

var (
	jumpCmd = &cobra.Command{
		Use:               "jump <host>",
		Short:             "Open a shell into the audius-d container running on a host.",
		ValidArgsFunction: hostsCompletionFunction,
		Args:              cobra.ExactArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			ctx, err := readOrCreateContext()
			if err != nil {
				return logger.Error("Could not get current context:", err)
			}
			if _, ok := ctx.Nodes[args[0]]; !ok {
				return logger.Errorf("No host named '%s' in the current context.", args[0])
			}
			return orchestration.ShellIntoNode(args[0], ctx.Nodes[args[0]].IsLocalhost)
		},
	}
)
