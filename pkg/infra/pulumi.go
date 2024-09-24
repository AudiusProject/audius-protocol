package infra

import (
	"bufio"
	"context"
	"fmt"
	"os"
	"os/exec"
	"runtime"
	"strings"

	"github.com/AudiusProject/audius-protocol/pkg/conf"
	"github.com/AudiusProject/audius-protocol/pkg/logger"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/ec2"
	"github.com/pulumi/pulumi/sdk/v3/go/auto"
	"github.com/pulumi/pulumi/sdk/v3/go/auto/optdestroy"
	"github.com/pulumi/pulumi/sdk/v3/go/auto/optpreview"
	"github.com/pulumi/pulumi/sdk/v3/go/auto/optup"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
)

var (
	confCtxConfig *conf.ContextConfig
)

func init() {
	var err error
	confCtxConfig, err = conf.ReadOrCreateContextConfig()
	if err != nil {
		logger.Error("Failed to retrieve context. ", err)
		return
	}
}

func pulumiInit() {
	baseDir, err := conf.GetConfigBaseDir()
	if err != nil {
		logger.Error("Failed to retrieve config base dir. ", err)
		return
	}

	envVars := map[string]string{
		// local pulumi stacks require this passphrase env var
		// we are not using pulumi secrets - so this is not a security risk
		"PULUMI_CONFIG_PASSPHRASE": "",
		// use a single ~/.audius/.pulumi for all pulumi state management files
		// the .pulumi dir is created upon pulumi login below
		"PULUMI_HOME": fmt.Sprintf("%s/.pulumi", baseDir),
	}
	err = setMultipleEnvVars(envVars)
	if err != nil {
		logger.Error("Error setting environment variables: %v", err)
		return
	}
	err = pulumiLogin(baseDir)
	if err != nil {
		if execErr, ok := err.(*exec.Error); ok && execErr.Err == exec.ErrNotFound {
			confirmation, err := promptConfirmation(
				"'audius-ctl infra' requires Pulumi (https://pulumi.io).\nPulumi is not installed. Would you like to install it now? [y/N]: ")
			if err != nil {
				logger.Error("Error reading confirmation:", err)
				return
			}
			if confirmation {
				if installErr := installPulumi(); installErr != nil {
					logger.Error("Failed to install Pulumi: %v\n", installErr)
				}
				logger.Info("Pulumi installed successfully.")
				if err := pulumiLogin(baseDir); err != nil {
					logger.Error("Failed to login to Pulumi: %v\n", err)
				}
			} else {
				logger.Info("Pulumi installation canceled.")
			}
			// TODO: i would prefer not to exit 0 after a successful pulumi install
			// yet there is a nil pointer bug in here somewhere that i do not have time to fix rn
			// re running the update command after an install works consistently
			os.Exit(0)
		} else {
			logger.Error("Failed to execute command: %v\n", err)
			return
		}
		return
	}
}

func promptConfirmation(prompt string) (bool, error) {
	reader := bufio.NewReader(os.Stdin)
	fmt.Print(prompt)
	response, err := reader.ReadString('\n')
	if err != nil {
		return false, err
	}
	response = strings.TrimSpace(response)
	return strings.ToLower(response) == "y" || strings.ToLower(response) == "yes", nil
}

func installPulumi() error {
	var cmd *exec.Cmd
	switch runtime.GOOS {
	case "darwin":
		cmd = exec.Command("brew", "install", "pulumi/tap/pulumi")
	case "linux":
		cmd = exec.Command("curl", "-fsSL", "https://get.pulumi.com", "|", "sh")
	default:
		return fmt.Errorf("automatic Pulumi installation is not supported on this OS")
	}
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	return cmd.Run()
}

func pulumiLogin(baseDir string) error {
	cmd := exec.Command("pulumi", "login", fmt.Sprintf("file://%s", baseDir))
	_, err := cmd.CombinedOutput()
	return err
}

func setMultipleEnvVars(vars map[string]string) error {
	for key, value := range vars {
		err := os.Setenv(key, value)
		if err != nil {
			return err
		}
	}
	return nil
}

func getStack(ctx context.Context, pulumiFunc pulumi.RunFunc) (*auto.Stack, error) {
	pulumiInit()

	projectName := "audius-d"
	stackName, err := conf.GetCurrentContextName()
	if err != nil {
		return nil, err
	}
	stack, err := auto.UpsertStackInlineSource(ctx, stackName, projectName, pulumiFunc)
	if err != nil {
		return nil, fmt.Errorf("failed to create or select stack: %w", err)
	}
	return &stack, nil
}

func Update(ctx context.Context, skipPreview bool) error {
	s, err := getStack(ctx, func(pCtx *pulumi.Context) error {
		for host, nodeConfig := range confCtxConfig.Nodes {
			instanceName := host
			bucketName := fmt.Sprintf("mediorum--%s", instanceName)
			var instance *ec2.Instance

			if awsCredentialsValid(&confCtxConfig.Network) {
				provider, err := awsAuthProvider(pCtx, host)
				if err != nil {
					return err
				}
				ec2Instance, privateKeyFilePath, err := awsCreateEC2Instance(pCtx, provider, instanceName)
				if err != nil {
					return err
				}
				instance = ec2Instance
				ec2Instance.PublicIp.ApplyT(func(ip string) error {
					if err := waitForUserDataCompletion(privateKeyFilePath, ip); err != nil {
						logger.Error("Error waiting for user data completion: %v\n", err)
					}
					return nil
				})
				if nodeConfig.Type == conf.Content {
					_, err = awsCreateS3Bucket(pCtx, provider, bucketName)
					if err != nil {
						return err
					}
				}
			}
			if cloudflareCredentialsValid(&confCtxConfig.Network) {
				provider, err := cloudflareAuthProvider(pCtx, host)
				if err != nil {
					return err
				}
				domain := confCtxConfig.Network.Infra.CloudflareTLD
				zoneId := confCtxConfig.Network.Infra.CloudflareZoneId
				recordName := strings.Replace(instanceName, fmt.Sprintf(".%s", domain), "", 1)
				recordIp := instance.PublicIp
				// TODO: instance name only needed for consistent pulumi output keys
				err = cloudflareAddDNSRecord(pCtx, provider, zoneId, recordName, recordIp, instanceName)
				if err != nil {
					return err
				}
			}
		}
		return nil
	})
	if err != nil {
		return err
	}

	if !skipPreview {
		_, err = s.Preview(ctx, optpreview.ProgressStreams(os.Stdout))
		if err != nil {
			return fmt.Errorf("failed to run Update: %w", err)
		}

		fmt.Println("Do you want to proceed with the update? (y/N)")
		var response string
		fmt.Scanln(&response)
		if response != "y" {
			return nil
		}
	}

	upResult, err := s.Up(ctx, optup.ProgressStreams(os.Stdout))
	if err != nil {
		return fmt.Errorf("failed to run Update: %w", err)
	}

	// After a successful Up, proceed with the SSH config update
	for host, _ := range confCtxConfig.Nodes {
		pk, _ := upResult.Outputs[fmt.Sprintf("%s-instance-pk", host)].Value.(string)
		ip, _ := upResult.Outputs[fmt.Sprintf("%s-instance-ip", host)].Value.(string)
		updateSSHConfig(host, pk, ip)
	}

	return nil
}

func Destroy(ctx context.Context, skipConfirmation bool) error {
	if !skipConfirmation {
		fmt.Print("Are you sure you want to destroy? [y/N]: ")
		reader := bufio.NewReader(os.Stdin)
		response, err := reader.ReadString('\n')
		if err != nil {
			return fmt.Errorf("error reading confirmation response: %w", err)
		}

		if strings.TrimSpace(strings.ToLower(response)) != "y" {
			fmt.Println("Destroy canceled.")
			return nil
		}
	}
	s, err := getStack(ctx, func(pCtx *pulumi.Context) error {
		return nil
	})
	if err != nil {
		return err
	}
	_, err = s.Destroy(ctx, optdestroy.ProgressStreams(os.Stdout))
	if err != nil {
		return fmt.Errorf("failed to run Destroy: %w", err)
	}
	return nil
}

func Cancel(ctx context.Context) error {
	s, err := getStack(ctx, func(pCtx *pulumi.Context) error {
		return nil
	})
	if err != nil {
		return err
	}
	err = s.Cancel(ctx)
	if err != nil {
		return fmt.Errorf("failed to run Cancel: %w", err)
	}
	return nil
}

func GetStackOutput(ctx context.Context, outputName string) (string, error) {
	s, err := getStack(ctx, func(pCtx *pulumi.Context) error {
		return nil
	})
	if err != nil {
		return "", fmt.Errorf("failed to get or init stack: %w", err)
	}
	outputs, err := s.Outputs(ctx)
	if err != nil {
		return "", fmt.Errorf("failed to get outputs: %w", err)
	}
	output, ok := outputs[outputName]
	if !ok {
		return "", fmt.Errorf("output %s not found", outputName)
	}
	value, ok := output.Value.(string)
	if !ok {
		return "", fmt.Errorf("output %s is not a string", outputName)
	}
	return value, nil
}
