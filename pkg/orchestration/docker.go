package orchestration

import (
	"bufio"
	"bytes"
	"context"
	"fmt"
	"io"
	"math/rand"
	"net/http"
	"os"
	"regexp"
	"strings"
	"time"

	"github.com/AudiusProject/audius-protocol/pkg/conf"
	"github.com/AudiusProject/audius-protocol/pkg/logger"
	"github.com/docker/cli/cli/connhelper"
	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/api/types/mount"
	"github.com/docker/docker/client"
	"github.com/docker/docker/pkg/archive"
	"github.com/docker/go-connections/nat"
	"github.com/joho/godotenv"
)

var (
	internalVolumes = map[conf.NodeType][]string{
		conf.Content: {
			"/var/k8s/mediorum",
			"/var/k8s/creator-node-backend",
			"/var/k8s/creator-node-db-15",
			"/var/k8s/bolt",
			"/var/k8s/audius-core",
		},
		conf.Discovery: {
			"/var/k8s/discovery-provider-db",
			"/var/k8s/discovery-provider-chain",
			"/var/k8s/bolt",
			"/var/k8s/audius-core",
		},
		conf.Identity: {
			"/var/k8s/identity-service-db",
		},
	}

	semverRegex = regexp.MustCompile(`\d+\.\d+\.\d+`)
)

// deploys a server node generically
func runNode(
	host string,
	config conf.NodeConfig,
	nconf conf.NetworkConfig,
	audiusdTag string,
) error {
	dockerClient, err := getDockerClient(host)
	if err != nil {
		return logger.Error(err)
	}
	defer dockerClient.Close()

	var adcDir string
	switch config.Type {
	case conf.Content:
		adcDir = "creator-node"
	case conf.Discovery:
		adcDir = "discovery-provider"
	case conf.Identity:
		adcDir = "identity-service"
	}

	if isContainerRunning(dockerClient, host) {
		logger.Infof("audius-d container already running on %s", host)
		logger.Info("Re-upping internal services for good measure...")
		if err := audiusCli(dockerClient, host, "launch", "-y", adcDir); err != nil {
			return logger.Error("Failed to launch node:", err)
		}
		logger.Infof("Done re-upping internal services on %s", host)
		logger.Infof("Use 'audius-ctl restart %s' for a clean restart", host)
		return nil
	} else if isContainerNameInUse(dockerClient, host) {
		logger.Infof("stopped audius-d container exists on %s, removing and starting with current config", host)
		if err := removeContainerByName(dockerClient, host); err != nil {
			return logger.Error(err)
		}
	}

	logger.Infof("\nStarting %s\n", host)

	if audiusdTag == "" {
		audiusdTag = "default"
	}

	containerConfig := &container.Config{
		Image: fmt.Sprintf("audius/audius-d:%s", audiusdTag),
	}
	hostConfig := &container.HostConfig{
		Privileged: true,
		Mounts: []mount.Mount{
			{
				Type:   mount.TypeVolume,
				Source: fmt.Sprintf("audius-d-%s", host),
				Target: "/var/lib/docker",
			},
		},
	}
	for _, vol := range internalVolumes[config.Type] {
		if exists, err := dirExistsOnHost(host, vol); err != nil {
			return logger.Error(err)
		} else if exists { // data is leftover from a migrated host
			hostConfig.Mounts = append(hostConfig.Mounts, mount.Mount{
				Type:   mount.TypeBind,
				Source: vol,
				Target: vol,
			})
		} else { // new host, just use named volumes instead of binds
			splitPath := strings.Split(vol, "/")
			volName := splitPath[len(splitPath)-1]
			hostConfig.Mounts = append(hostConfig.Mounts, mount.Mount{
				Type:   mount.TypeVolume,
				Source: volName,
				Target: vol,
			})
		}
	}

	var port uint = 80
	var tlsPort uint = 443
	if config.HttpPort != 0 {
		port = config.HttpPort
	}
	if config.HttpsPort != 0 {
		tlsPort = config.HttpsPort
	}
	httpPorts := fmt.Sprintf("%d:%d", port, port)
	httpsPorts := fmt.Sprintf("%d:%d", tlsPort, tlsPort)
	allPorts := []string{httpPorts, httpsPorts}
	if config.Type == conf.Discovery {
		// Required for chain peering and discovery
		allPorts = append(allPorts, "30300:30300", "30300:30300/udp")
	}
	if config.HostPorts != "" {
		allPorts = append(allPorts, strings.Split(config.HostPorts, ",")...)
	}

	if config.CorePortP2P == 0 {
		config.CorePortP2P = 26656
	}

	if config.CorePortRPC == 0 {
		config.CorePortRPC = 26657
	}

	allPorts = append(allPorts, fmt.Sprintf("%d:26656", config.CorePortP2P), fmt.Sprintf("%d:26657", config.CorePortRPC))

	portSet, portBindings, err := nat.ParsePortSpecs(allPorts)
	if err != nil {
		return logger.Error(err)
	}
	containerConfig.ExposedPorts = portSet
	hostConfig.PortBindings = portBindings

	if nconf.DeployOn == conf.Devnet {
		hostConfig.NetworkMode = "deployments_devnet"
		hostConfig.ExtraHosts = []string{
			"creator-1.devnet.audius-d:172.100.0.1",
			"discovery-1.devnet.audius-d:172.100.0.1",
			"identity.devnet.audius-d:172.100.0.1",
			"eth-ganache.devnet.audius-d:172.100.0.1",
			"acdc-ganache.devnet.audius-d:172.100.0.1",
			"solana-test-validator.devnet.audius-d:172.100.0.1",
		}
		containerConfig.Env = []string{"HOST_DOCKER_INTERNAL=172.100.0.1"}
	}

	logger.Info("Pulling audius-d image...")
	pullResp, err := dockerClient.ImagePull(context.Background(), containerConfig.Image, types.ImagePullOptions{})
	if err != nil {
		return logger.Error("Failed to pull image:", err)
	}
	defer pullResp.Close()
	if err := readAndLogCommandOutput(bufio.NewReader(pullResp)); err != nil {
		return logger.Error("Error reading ImagePull output:", err)
	}

	// create wrapper container
	createResponse, err := dockerClient.ContainerCreate(
		context.Background(),
		containerConfig,
		hostConfig,
		nil,
		nil,
		host,
	)
	if err != nil {
		return logger.Error("Failed to create container:", err)
	}
	if err := dockerClient.ContainerStart(
		context.Background(),
		createResponse.ID,
		container.StartOptions{},
	); err != nil {
		return logger.Error("Failed to start container:", err)
	}

	// Wait for audius-d wrapper to be ready
	ready := false
	timeout := time.After(30 * time.Second)
	for !ready {
		select {
		case <-timeout:
			return logger.Error("Timeout waiting for audius-d wrapper container to be ready")
		default:
			inspect, err := dockerClient.ContainerInspect(context.Background(), createResponse.ID)
			if err != nil {
				return logger.Error("Could not get status of audius-d container:", err)
			}
			time.Sleep(5 * time.Second)
			ready = inspect.State.Running
			logger.Debugf("audius-d wrapper status: %s", inspect.State.Status)
		}
	}

	logger.Info("Configuring audius node...")

	if config.Type != conf.Identity {
		privateKey, err := NormalizedPrivateKey(host, config.PrivateKey)
		if err != nil {
			return logger.Error(err)
		}
		config.PrivateKey = privateKey
	}
	override := config.ToOverrideEnv(host, nconf)
	// generate the override.env file locally
	// WARNING: not thread safe due to constant filename
	if err := appendRemoteConfig(host, override, config.RemoteConfigFile); err != nil {
		return logger.Error(err)
	}
	localOverridePath := "./override.env"
	if err := godotenv.Write(override, localOverridePath); err != nil {
		return logger.Error(err)
	}

	// copy the override.env file to the server and then into the wrapper container
	overrideFile, err := os.Open(localOverridePath)
	if err != nil {
		return logger.Error(err)
	}
	defer overrideFile.Close()
	tarReader, err := archive.Tar(overrideFile.Name(), archive.Gzip)
	if err != nil {
		return logger.Error(err)
	}
	defer tarReader.Close()
	if err := dockerClient.CopyToContainer(
		context.Background(),
		createResponse.ID,
		fmt.Sprintf("/root/audius-docker-compose/%s", adcDir),
		tarReader,
		types.CopyToContainerOptions{},
	); err != nil {
		return logger.Error(err)
	}
	if err := os.Remove(localOverridePath); err != nil {
		return logger.Error(err)
	}

	logger.Info("Ensuring orchestration config is up to date...")

	// Configure branch
	var branch string
	switch config.Version {
	case "", "current":
		branch = "main"
	case "edge":
		branch = "foundation"
	case "prerelease":
		branch = "stage"
	default:
		if semverRegex.MatchString(config.Version) {
			branch = "main"
		} else {
			branch = config.Version // TODO: remove when adc repo is deprecated
		}
	}
	logger.Debugf("Using branch %s", branch)
	if err := audiusCli(dockerClient, host, "pull-reset", branch); err != nil {
		return logger.Error("Failed to pull latest orchestration config:", err)
	}

	// Stop any running containers left over from an unclean shutdown
	logger.Debug("Shutting down any auto-restarted containers")
	if err := audiusCli(dockerClient, host, "down"); err != nil {
		logger.Warnf("Warning: skipping error encountered while preparing environment: %s", err.Error())
	}

	// Configure tag (will replace branch configuration)
	var tag string
	switch config.Version {
	case "prerelease", "edge", "current":
		tag = config.Version
	case "":
		tag = "current"
	default:
		if semverRegex.MatchString(config.Version) {
			tag = config.Version
		}
	}
	if err := audiusCli(dockerClient, host, "set-tag", "-y", tag); err != nil {
		return logger.Error("Failed to set version tag for protocol stack:", err)
	}

	// Configure auto update
	var updateInterval string
	rand.Seed(time.Now().UnixNano())
	if config.Version == "prerelease" && nconf.DeployOn == conf.Testnet {
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
	if err := audiusCli(dockerClient, host, "auto-upgrade", fmt.Sprintf("%s * * * *", updateInterval)); err != nil {
		return logger.Error(err)
	}
	if err := dockerExec(dockerClient, host, "crond"); err != nil {
		return logger.Error(err)
	}

	// set network
	var network string
	switch nconf.DeployOn {
	case conf.Devnet:
		network = "dev"
	case conf.Testnet:
		network = "stage"
	case conf.Mainnet:
		network = "prod"
	default:
		network = "dev"
	}
	if err := audiusCli(dockerClient, host, "set-network", network); err != nil {
		return logger.Error("Failed setting network configuration:", err)
	}

	// launch the protocol stack
	logger.Info("Launching the protocol stack (first time may take a while)...")
	if err := audiusCli(dockerClient, host, "launch", "-y", "--auto-seed", adcDir); err != nil {
		return logger.Error("Failed to launch node:", err)
	}

	return nil
}

func isContainerRunning(dockerClient *client.Client, containerName string) bool {
	containers, err := dockerClient.ContainerList(context.Background(), container.ListOptions{})
	if err != nil {
		logger.Warn(err.Error())
		return false
	}
	for _, c := range containers {
		for _, name := range c.Names {
			if name == "/"+containerName && c.State == "running" {
				return true
			}
		}
	}
	return false
}

func isContainerNameInUse(dockerClient *client.Client, containerName string) bool {
	containers, err := dockerClient.ContainerList(context.Background(), container.ListOptions{All: true})
	if err != nil {
		logger.Warn(err.Error())
		return false
	}
	for _, c := range containers {
		for _, name := range c.Names {
			if name == "/"+containerName {
				return true
			}
		}
	}
	return false
}

func removeContainerByName(dockerClient *client.Client, containerName string) error {
	containers, err := dockerClient.ContainerList(context.Background(), container.ListOptions{All: true})
	if err != nil {
		return err
	}
	for _, c := range containers {
		for _, name := range c.Names {
			if name == "/"+containerName {
				err := dockerClient.ContainerRemove(context.Background(), c.ID, container.RemoveOptions{Force: true})
				return err
			}
		}
	}
	logger.Warnf("Container %s does not exist.", containerName)
	return nil
}

func startDevnetDocker() error {
	logger.Info("Starting local eth, sol, and acdc chains")
	err := execLocal("docker", "compose", "-f", "dev-tools/compose/docker-compose.devnet.yml", "up", "-d")
	if err != nil {
		return err
	}
	time.Sleep(5 * time.Second)
	return nil
}

func downDockerNode(host string) error {
	dockerClient, err := getDockerClient(host)
	if err != nil {
		return logger.Error(err)
	}
	defer dockerClient.Close()

	logger.Info("Spinning down internal services for a clean shutdown...")
	if err := audiusCli(dockerClient, host, "down"); err != nil {
		logger.Warnf("Warning: could not spin down internal services on host %s: %s", host, err.Error())
	}
	logger.Info("Spinning down wrapper container...")
	if err := removeContainerByName(dockerClient, host); err != nil {
		return logger.Error(err)
	}
	return nil
}

func downDevnetDocker() error {
	if err := execLocal("docker", "compose", "-f", "dev-tools/compose/docker-compose.devnet.yml", "down"); err != nil {
		return err
	}
	return nil
}

func audiusCli(dockerClient *client.Client, host string, args ...string) error {
	cmds := []string{"audius-cli"}
	cmds = append(cmds, args...)
	return dockerExec(dockerClient, host, cmds...)
}

func dockerExec(dockerClient *client.Client, host string, cmds ...string) error {
	execConfig := types.ExecConfig{
		AttachStdout: true,
		AttachStderr: true,
		Cmd:          cmds,
	}
	resp, err := dockerClient.ContainerExecCreate(context.Background(), host, execConfig)
	if err != nil {
		return err
	}
	execResp, err := dockerClient.ContainerExecAttach(context.Background(), resp.ID, types.ExecStartCheck{})
	if err != nil {
		return err
	}
	defer execResp.Close()
	if err := readAndLogCommandOutput(execResp.Reader); err != nil {
		return logger.Error("Error reading command output:", err)
	}

	execInspect, err := dockerClient.ContainerExecInspect(context.Background(), resp.ID)
	if err != nil {
		return err
	}
	if execInspect.Running {
		return logger.Errorf("Docker exec process still running with id %d", execInspect.Pid)
	}
	if execInspect.ExitCode != 0 {
		return logger.Errorf("Docker exec process returned non-zero exit code %d", execInspect.ExitCode)
	}

	return nil
}

func getDockerClient(host string) (*client.Client, error) {
	isLocalhost, err := resolvesToLocalhost(host)
	if err != nil {
		return nil, err
	} else if isLocalhost {
		return client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	} else {
		hostScheme := fmt.Sprintf("ssh://%s", host)
		helper, err := connhelper.GetConnectionHelper(hostScheme)
		if err != nil {
			return nil, err
		}
		return client.NewClientWithOpts(
			client.WithHTTPClient(
				&http.Client{
					Transport: &http.Transport{
						DialContext: helper.Dialer,
					},
				},
			),
			client.WithHost(helper.Host),
			client.WithDialContext(helper.Dialer),
			client.WithAPIVersionNegotiation(),
		)
	}
}

func dirExistsOnHost(host, dir string) (bool, error) {
	outBuf := new(bytes.Buffer)
	errBuf := new(bytes.Buffer)
	if err := execOnHost(host, outBuf, errBuf, "test", "-d", dir); err != nil {
		if strings.Contains(err.Error(), "exit status 1") {
			logger.Debugf("%s does not exist on host", dir)
			return false, nil
		} else {
			return false, logger.Error(errBuf.String(), err)
		}
	}
	logger.Debugf("%s exists on host", dir)
	return true, nil
}

func readAndLogCommandOutput(output *bufio.Reader) error {
	for {
		line, isPrefix, err := output.ReadLine()
		if err == io.EOF {
			if len(line) > 0 {
				logger.Debug(string(line)) // Print the last line if it doesn't end with a newline
			}
			break
		} else if err != nil {
			return err
		}

		fullLine := make([]byte, len(line))
		copy(fullLine, line)
		for isPrefix {
			line, isPrefix, err = output.ReadLine()
			if err != nil && err != io.EOF {
				return err
			}
			fullLine = append(fullLine, line...)
		}
		logger.Debug(string(fullLine))
	}
	return nil
}
