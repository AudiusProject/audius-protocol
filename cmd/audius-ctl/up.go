package main

import (
	"fmt"
	"os"

	"github.com/AudiusProject/audius-protocol/pkg/conf"
	"github.com/AudiusProject/audius-protocol/pkg/logger"
	"github.com/AudiusProject/audius-protocol/pkg/orchestration"
	"github.com/spf13/cobra"
)

var (
	awaitHealthy = false
	audiusdTag   = "default"
	upCmd        = &cobra.Command{
		Use:               "up [hosts]",
		Short:             "Spin up the audius nodes specified in your config, optionally specifying which hosts.",
		ValidArgsFunction: hostsCompletionFunction,
		RunE: func(cmd *cobra.Command, args []string) error {
			return runUpNodes(awaitHealthy, audiusdTag, args)
		},
	}

	downAll   = false
	downForce = false
	downCmd   = &cobra.Command{
		Use:               "down [HOST ...] [--all/-a, --force/-f]",
		Short:             "Spin down nodes and network in the current context.",
		ValidArgsFunction: hostsCompletionFunction,
		RunE: func(cmd *cobra.Command, args []string) error {
			return runDownNodes(downAll, downForce, args)
		},
	}

	restartCmd = &cobra.Command{
		Use:               "restart [HOST ...] [--all/-a, --force/-f, -w/--await-healthy]",
		Short:             "Fully turn down and then turn up audius-d.",
		ValidArgsFunction: hostsCompletionFunction,
		RunE: func(cmd *cobra.Command, args []string) error {
			if err := restartNodes(downAll, downForce, awaitHealthy, args); err != nil {
				// assumes err is returned due to cancellation or bad arguments because run down failures are skipped.
				return err
			}
			return nil
		},
	}
	devnetCmd = &cobra.Command{
		Use:   "devnet [command]",
		Short: "Spin up local ethereum, solana, and acdc chains for development",
		RunE: func(cmd *cobra.Command, args []string) error {
			ctx, err := readOrCreateContext()
			if err != nil {
				return logger.Error("Could not get current context:", err)
			}
			return orchestration.StartDevnet(ctx)
		},
	}
	devnetDownCmd = &cobra.Command{
		Use:   "down",
		Short: "Shut down local ethereum, solana, and acdc chains",
		RunE: func(cmd *cobra.Command, args []string) error {
			ctx, err := readOrCreateContext()
			if err != nil {
				return logger.Error("Could not get current context:", err)
			}
			return orchestration.DownDevnet(ctx)
		},
	}
)

func init() {
	upCmd.Flags().BoolVarP(&awaitHealthy, "await-healthy", "w", false, "Wait for services to become healthy before returning.")
	upCmd.Flags().StringVar(&audiusdTag, "audius-d-version", "default", "(Development) override docker image tag to use (audius/audius-d:<version>)")
	downCmd.Flags().BoolVarP(&downAll, "all", "a", false, "Take down all nodes in the current configuration.")
	downCmd.Flags().BoolVarP(&downForce, "force", "f", false, "Do not ask for confirmation.")
	restartCmd.Flags().BoolVarP(&awaitHealthy, "await-healthy", "w", false, "Wait for services to become healthy before returning.")
	restartCmd.Flags().StringVar(&audiusdTag, "audius-d-version", "default", "(Development) override docker image tag to use (audius/audius-d:<version>)")
	restartCmd.Flags().BoolVarP(&downAll, "all", "a", false, "Take down all nodes in the current configuration.")
	restartCmd.Flags().BoolVarP(&downForce, "force", "f", false, "Do not ask for confirmation.")
	devnetCmd.AddCommand(devnetDownCmd)
}

func readOrCreateContext() (*conf.ContextConfig, error) {
	ctx_config, err := conf.ReadOrCreateContextConfig()
	if err != nil {
		return nil, logger.Error("Failed to retrieve context: ", err)
	}
	return ctx_config, nil
}

func runDownNodes(all bool, force bool, hosts []string) error {
	ctx, err := readOrCreateContext()
	if err != nil {
		return logger.Error("Could not get current context:", err)
	}

	if all && len(hosts) > 0 {
		return logger.Error("Cannot combine specific nodes with flag --all/-a.")
	} else if !all && len(hosts) == 0 && len(ctx.Nodes) > 1 {
		return logger.Error("Must specify which nodes to take down or use --all/-a.")
	}

	var nodesToRunDown map[string]conf.NodeConfig
	if all || len(ctx.Nodes) == 1 {
		nodesToRunDown = ctx.Nodes
	} else {
		nodesToRunDown, err = filterNodesFromContext(hosts, ctx)
		if err != nil {
			return err
		}
	}

	infoString := "This will run down the following nodes:"
	for host := range nodesToRunDown {
		infoString += fmt.Sprintf("\n%s", host)
	}
	fmt.Fprintf(os.Stderr, "%s\n", infoString)

	if !force && !askForConfirmation("Are you sure you want to continue?") {
		return logger.Error("Aborted")
	}

	for host, config := range nodesToRunDown {
		if err := orchestration.RunDownNode(host, config.IsLocalhost); err != nil {
			fmt.Fprintf(os.Stderr, "Warning: skipping error encountered while spinning down %s: %s", host, err.Error())
		}
	}
	return nil
}

func runUpNodes(waitForHealthy bool, audiusdTag string, hosts []string) error {
	var nodesToRunUp map[string]conf.NodeConfig
	ctx, err := readOrCreateContext()
	if err != nil {
		return logger.Error("Could not get current context:", err)
	}
	if len(hosts) == 0 {
		nodesToRunUp = ctx.Nodes
	} else {
		nodesToRunUp, err = filterNodesFromContext(hosts, ctx)
		if err != nil {
			return err
		}
	}
	orchestration.RunAudiusNodes(nodesToRunUp, ctx.Network, waitForHealthy, audiusdTag)
	return nil
}

func restartNodes(all, force, waitForHealthy bool, hosts []string) error {
	ctx, err := readOrCreateContext()
	if err != nil {
		return logger.Error("Could not get current context:", err)
	}

	if all && len(hosts) > 0 {
		return logger.Error("Cannot combine specific nodes with flag --all/-a.")
	} else if !all && len(hosts) == 0 && len(ctx.Nodes) > 1 {
		return logger.Error("Must specify which nodes to take down or use --all/-a.")
	}

	var nodesToRestart map[string]conf.NodeConfig
	if all || len(ctx.Nodes) == 1 {
		nodesToRestart = ctx.Nodes
	} else {
		nodesToRestart, err = filterNodesFromContext(hosts, ctx)
		if err != nil {
			return err
		}
	}

	infoString := "This will restart the following nodes in order:"
	for host := range nodesToRestart {
		infoString += fmt.Sprintf("\n%s", host)
	}
	fmt.Fprintf(os.Stderr, "%s\n", infoString)

	if !force && !askForConfirmation("Are you sure you want to continue?") {
		return logger.Error("Aborted")
	}

	for host, config := range nodesToRestart {
		if err := orchestration.RunDownNode(host, config.IsLocalhost); err != nil {
			fmt.Fprintf(os.Stderr, "Warning: skipping error encountered while spinning down %s: %s", host, err.Error())
		}
		orchestration.RunAudiusNodes(
			map[string]conf.NodeConfig{host: config},
			ctx.Network,
			waitForHealthy,
			audiusdTag,
		)
	}
	return nil
}
