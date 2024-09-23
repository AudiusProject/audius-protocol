package main

import (
	"bufio"
	"fmt"
	"os"
	"strings"

	"github.com/AudiusProject/audius-protocol/pkg/conf"
	"github.com/AudiusProject/audius-protocol/pkg/logger"
)

func filterNodesFromContext(desired []string, ctx *conf.ContextConfig) (map[string]conf.NodeConfig, error) {
	result := make(map[string]conf.NodeConfig)
	for _, desiredHost := range desired {
		matched := false
		for host, config := range ctx.Nodes {
			if desiredHost == host {
				matched = true
				result[host] = config
			}
		}
		if !matched {
			return nil, logger.Errorf("Node %s does not exist. Check your configuration (`audius-ctl config`)", desiredHost)
		}
	}
	return result, nil

}

func askForConfirmation(s string) bool {
	reader := bufio.NewReader(os.Stdin)

	for {
		fmt.Fprintf(os.Stderr, "%s [y/n]: ", s)

		response, err := reader.ReadString('\n')
		if err != nil {
			logger.Error("Error encountered reading from stdin")
			return false
		}

		response = strings.ToLower(strings.TrimSpace(response))

		if response == "y" || response == "yes" {
			return true
		} else if response == "n" || response == "no" {
			return false
		}
	}
}
