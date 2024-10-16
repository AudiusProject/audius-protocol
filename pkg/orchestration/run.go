package orchestration

import (
	"bytes"
	"fmt"
	"io"
	"net"
	"os"
	"os/exec"
	"strings"

	"github.com/AudiusProject/audius-protocol/pkg/conf"
	"github.com/AudiusProject/audius-protocol/pkg/logger"
	"github.com/AudiusProject/audius-protocol/pkg/register"
	"github.com/joho/godotenv"
)

func StartDevnet(_ *conf.ContextConfig) error {
	return startDevnetDocker()
}

func DownDevnet(_ *conf.ContextConfig) error {
	return downDevnetDocker()
}

func RunAudiusNodes(nodes map[string]conf.NodeConfig, network conf.NetworkConfig, await bool, audiusdTagOverride string) {
	// Handle devnet-specific setup
	if network.DeployOn == conf.Devnet {
		if err := startDevnetDocker(); err != nil {
			logger.Warnf("Failed to start devnet: %s", err.Error())
		}

		// register all content nodes
		for host, nodeConfig := range nodes {
			if nodeConfig.Type != conf.Content {
				continue
			}
			err := register.RegisterNode(
				"content-node",
				fmt.Sprintf("https://%s", host),
				"http://localhost:8546",
				register.GanacheAudiusTokenAddress,
				register.GanacheContractRegistryAddress,
				nodeConfig.Wallet,
				nodeConfig.PrivateKey,
			)
			if err != nil {
				logger.Warnf("Failed to register content node: %s", err)
			}
		}
	}

	for host, nodeConfig := range nodes {
		if err := runNode(
			host,
			nodeConfig,
			network,
			audiusdTagOverride,
		); err != nil {
			logger.Warnf("Error encountered starting node %s: %s", host, err.Error())
			logger.Warnf("View full debug log at %s", logger.GetLogFilepath())
		} else {
			logger.Infof("Finished spinning up %s", host)
		}
	}

	if await {
		awaitHealthy(nodes)
	}
}

func RunDownNode(host string, isLocalhost bool) error {
	logger.Infof("Spinning down %s...", host)
	if err := downDockerNode(host, isLocalhost); err != nil {
		return logger.Error(err)
	} else {
		logger.Infof("Node %s spun down.", host)
		return nil
	}
}

func NormalizedPrivateKey(host, privateKeyConfigValue string) (string, error) {
	privateKey := privateKeyConfigValue
	if strings.HasPrefix(privateKeyConfigValue, "/") {
		// get key value from file on host
		outBuf := new(bytes.Buffer)
		errBuf := new(bytes.Buffer)
		if err := execOnHost(host, outBuf, errBuf, "cat", privateKeyConfigValue); err != nil {
			return "", logger.Error(errBuf.String(), err)
		}
		privateKey = strings.TrimSpace(outBuf.String())
	}
	privateKey = strings.TrimPrefix(privateKey, "0x")
	if len(privateKey) != 64 {
		return "", logger.Error("Invalid private key")
	}
	return privateKey, nil
}

// Append misc configuration stored in a separate file on the host.
// This is an experimental feature to allow private config to be stored
// remotely and/or in a mountable secure file on the host.
func appendRemoteConfig(host string, config map[string]string, remoteConfigPath string) error {
	if remoteConfigPath == "" {
		return nil
	} else {
		outBuf := new(bytes.Buffer)
		errBuf := new(bytes.Buffer)
		if err := execOnHost(host, outBuf, errBuf, "cat", remoteConfigPath); err != nil {
			return logger.Error(errBuf.String(), err)
		}
		miscConfig, err := godotenv.Parse(outBuf)
		if err != nil {
			return logger.Error("Could not parse remote configuration:", err)
		}
		for k, v := range miscConfig {
			config[k] = v
		}
		return nil
	}
}

func ShellIntoNode(host string, isLocalhost bool) error {
	var cmd *exec.Cmd
	isProxiedLocalhost, err := resolvesToLocalhost(host)
	if !isLocalhost && err != nil {
		return logger.Error("Error determining origin of host:", err)
	} else if isLocalhost || isProxiedLocalhost {
		cmd = exec.Command("docker", "exec", "-it", host, "/bin/bash")
	} else {
		cmd = exec.Command("ssh", "-o", "ConnectTimeout=10", "-t", host, "docker", "exec", "-it", host, "/bin/bash")
	}
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	cmd.Stdin = os.Stdin
	return cmd.Run()
}

func execLocal(command string, args ...string) error {
	cmd := exec.Command(command, args...)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	return cmd.Run()
}

func execOnHost(host string, stdout io.Writer, stderr io.Writer, command string, args ...string) error {
	var cmd *exec.Cmd
	isProxiedLocalhost, err := resolvesToLocalhost(host)
	if err != nil {
		return logger.Error("Error determining origin of host:", err)
	} else if isProxiedLocalhost {
		cmd = exec.Command(command, args...)
	} else {
		cmd = exec.Command("ssh", append([]string{host, command}, args...)...)
	}
	cmd.Stdout = stdout
	cmd.Stderr = stderr
	return cmd.Run()
}

func resolvesToLocalhost(host string) (bool, error) {
	ips, err := net.LookupHost(host)
	if err != nil {
		return false, logger.Errorf("Cannot resolve host %s: %s", host, err.Error())
	}

	for _, ip := range ips {
		if ip == "127.0.0.1" || ip == "::1" {
			return true, nil
		}
	}
	return false, nil
}
