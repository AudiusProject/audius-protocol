package main

import (
	"fmt"
	"os"
	"strings"

	"github.com/AudiusProject/audius-protocol/pkg/conf"
	"github.com/AudiusProject/audius-protocol/pkg/logger"
	"github.com/spf13/cobra"
)

func hostsCompletionFunction(cmd *cobra.Command, args []string, toComplete string) ([]string, cobra.ShellCompDirective) {
	hosts, err := getAvailableHostsWithPrefix(toComplete)
	if err != nil {
		fmt.Fprintf(os.Stderr, "%s\n", err.Error())
		return nil, cobra.ShellCompDirectiveNoFileComp
	}
	return hosts, cobra.ShellCompDirectiveNoFileComp
}

func contextCompletionFunction(cmd *cobra.Command, args []string, toComplete string) ([]string, cobra.ShellCompDirective) {
	if len(args) != 0 {
		return nil, cobra.ShellCompDirectiveNoFileComp
	}
	return getAvailableContextsWithPrefix(toComplete), cobra.ShellCompDirectiveNoFileComp
}

func getAvailableHostsWithPrefix(prefix string) ([]string, error) {
	ctx, err := readOrCreateContext()
	if err != nil {
		return nil, logger.Error("Could not get current context:", err)
	}
	hosts := make([]string, 0)
	for host, _ := range ctx.Nodes {
		if strings.HasPrefix(host, prefix) {
			hosts = append(hosts, host)
		}
	}
	return hosts, nil
}

func getAvailableContextsWithPrefix(prefix string) []string {
	ctxs, err := conf.GetContexts()
	if err != nil {
		fmt.Fprintf(os.Stderr, "%s\n", err.Error())
		return nil
	}
	matches := make([]string, 0)
	for _, ctx := range ctxs {
		if strings.HasPrefix(ctx, prefix) {
			matches = append(matches, ctx)
		}
	}
	return matches
}
