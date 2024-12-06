package orchestration

import (
	"bytes"
	"fmt"
	"io"
	"math/rand"
	"net"
	"os"
	"os/exec"
	"strings"
	"time"

	"github.com/AudiusProject/audius-protocol/pkg/conf"
	"github.com/AudiusProject/audius-protocol/pkg/core/config"
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
		var err error
		if nodeConfig.Type == conf.Content {
			err = runNodeWrapperless(
				host,
				nodeConfig,
				network,
			)
		} else {
			err = runNode(
				host,
				nodeConfig,
				network,
				audiusdTagOverride,
			)
		}
		if err != nil {
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

// WARNING: only effective when run by audius-ctl cli
func setAutoUpdateCron(host, version string, network conf.NetworkType) error {
	var updateInterval string
	rand.Seed(time.Now().UnixNano())
	if version == "prerelease" && network == conf.Testnet {
		// Stage nodes should update continuously, slightly staggered
		updateInterval = fmt.Sprintf("%d-59/5", rand.Intn(5))
	} else if config.Version == "edge" {
		// Frequent, staggerd release of foundation and other canary nodes
		updateInterval = fmt.Sprintf("%d-59/25", rand.Intn(25))
	} else {
		// Hourly release for everything else
		// starting 55 minutes from now (for randomness + prevent updates during CI)
		fiveMinutesAgo := time.Now().Add(-5 * time.Minute).Minute()
		updateInterval = fmt.Sprint(fiveMinutesAgo)
	}
	schedule := fmt.Sprintf("%s * * * *", updateInterval)
	executable, err := os.Executable()
	if err != nil {
		return logger.Error("Failed to retrieve executable path:", err)
	}
	restartCommand := fmt.Sprintf("bash -c '%s restart -f %s'", executable, host)
	comment := fmt.Sprintf("# audius auto-upgrade for %s", host)
	cronJob := fmt.Sprintf("%s %s %s", schedule, restartCommand, comment)
	script := fmt.Sprintf(
		`(crontab -l | grep -v '%s'; echo "%s" ) | crontab - `,
		host,
		cronJob,
	)
	if err := execLocal("bash", "-c", script); err != nil {
		return logger.Error("Failed to execute crontab script:", err)
	}

	logger.Debugf("auto-upgrade cron job added successfully for %s", host)
	return nil
}

func copyFileToHost(host, src, dest string) error {
	var cmd *exec.Cmd
	if host == "localhost" {
		cmd = exec.Command("cp", src, dest)
	} else {
		cmd = exec.Command("scp", src, fmt.Sprintf("%s:%s", host, dest))
	}
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	return cmd.Run()
}
