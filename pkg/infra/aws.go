package infra

import (
	"fmt"
	"time"

	"github.com/AudiusProject/audius-protocol/pkg/conf"
	"github.com/pulumi/pulumi-aws/sdk/v4/go/aws/s3"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/ec2"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
)

var (
	ami          = "ami-05fb0b8c1424f266b" // Ubuntu, 22.04 LTS, amd64 jammy image build on 2023-12-07
	instanceType = "c5.2xlarge"
	volumeSize   = 100
)

func awsCredentialsValid(networkConfig *conf.NetworkConfig) bool {
	if networkConfig != nil && networkConfig.Infra != nil {
		return networkConfig.Infra.AWSAccessKeyID != "" && networkConfig.Infra.AWSSecretAccessKey != "" && networkConfig.Infra.AWSRegion != ""
	}
	return false
}

func awsAuthProvider(pCtx *pulumi.Context, uid string) (*aws.Provider, error) {
	if awsCredentialsValid(&confCtxConfig.Network) {
		// TODO: we could use a single aws provider for all node operations i.e. remove need for uid
		provider, err := aws.NewProvider(pCtx, fmt.Sprintf("aws-%s", uid), &aws.ProviderArgs{
			AccessKey: pulumi.String(confCtxConfig.Network.Infra.AWSAccessKeyID),
			SecretKey: pulumi.String(confCtxConfig.Network.Infra.AWSSecretAccessKey),
			Region:    pulumi.String(confCtxConfig.Network.Infra.AWSRegion),
		})
		if err != nil {
			return nil, fmt.Errorf("failed to create AWS provider: %w", err)
		}
		return provider, nil
	}
	return nil, fmt.Errorf("invalid AWS credentials")
}

func awsCreateEC2Instance(pCtx *pulumi.Context, provider *aws.Provider, instanceName string) (*ec2.Instance, string, error) {
	baseDir, err := conf.GetConfigBaseDir()
	if err != nil {
		return nil, "", err
	}

	// TODO: as of now, we are creating independent keys for every host in the context
	// we could and probably should use one key per context set of nodes
	privateKeyFilePath, publicKeyPem, err := ensureRSAKeyPair(baseDir, instanceName)
	if err != nil {
		return nil, "", fmt.Errorf("unable to ensure RSA key pair: %w", err)
	}

	keyPair, err := ec2.NewKeyPair(pCtx, fmt.Sprintf("%s-keypair", instanceName), &ec2.KeyPairArgs{
		PublicKey: pulumi.String(publicKeyPem),
	}, pulumi.Provider(provider))
	if err != nil {
		return nil, privateKeyFilePath, fmt.Errorf("unable to create key pair: %w", err)
	}

	userData := `#!/bin/bash
set -x
set -e

# install system level deps
sudo apt update
sudo apt install -y apt-transport-https ca-certificates curl software-properties-common
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
sudo apt update
sudo apt install -y docker-ce git
sudo usermod -aG docker ubuntu

# signal for successful completion
touch /home/ubuntu/user-data-done
`

	secGroup, err := ec2.NewSecurityGroup(pCtx, fmt.Sprintf("%s-secgroup", instanceName), &ec2.SecurityGroupArgs{
		Description: pulumi.String("Allow HTTP, HTTPS, and SSH access"),
		Ingress: ec2.SecurityGroupIngressArray{
			ec2.SecurityGroupIngressArgs{
				Protocol:    pulumi.String("tcp"),
				FromPort:    pulumi.Int(80),
				ToPort:      pulumi.Int(80),
				CidrBlocks:  pulumi.StringArray{pulumi.String("0.0.0.0/0")},
				Description: pulumi.String("Allow HTTP"),
			},
			ec2.SecurityGroupIngressArgs{
				Protocol:    pulumi.String("tcp"),
				FromPort:    pulumi.Int(443),
				ToPort:      pulumi.Int(443),
				CidrBlocks:  pulumi.StringArray{pulumi.String("0.0.0.0/0")},
				Description: pulumi.String("Allow HTTPS"),
			},
			ec2.SecurityGroupIngressArgs{
				Protocol:    pulumi.String("tcp"),
				FromPort:    pulumi.Int(22),
				ToPort:      pulumi.Int(22),
				CidrBlocks:  pulumi.StringArray{pulumi.String("0.0.0.0/0")},
				Description: pulumi.String("Allow SSH"),
			},
		},
		Egress: ec2.SecurityGroupEgressArray{
			ec2.SecurityGroupEgressArgs{
				Protocol:   pulumi.String("-1"),
				FromPort:   pulumi.Int(0),
				ToPort:     pulumi.Int(0),
				CidrBlocks: pulumi.StringArray{pulumi.String("0.0.0.0/0")},
			},
		},
	}, pulumi.Provider(provider))
	if err != nil {
		return nil, privateKeyFilePath, fmt.Errorf("unable to create security group: %w", err)
	}

	instance, err := ec2.NewInstance(pCtx, fmt.Sprintf("%s-ec2-instance", instanceName), &ec2.InstanceArgs{
		Ami:          pulumi.String(ami),
		InstanceType: pulumi.String(instanceType),
		UserData:     pulumi.String(userData),
		KeyName:      keyPair.KeyName,
		SecurityGroups: pulumi.StringArray{
			secGroup.Name,
		},
		Tags: pulumi.StringMap{
			"Name": pulumi.String(instanceName),
		},
		RootBlockDevice: &ec2.InstanceRootBlockDeviceArgs{
			VolumeType:          pulumi.String("gp3"),
			VolumeSize:          pulumi.Int(volumeSize),
			DeleteOnTermination: pulumi.Bool(true),
		},
	}, pulumi.Provider(provider))
	if err != nil {
		return nil, privateKeyFilePath, fmt.Errorf("unable to create EC2 instance: %w", err)
	}

	pCtx.Export(fmt.Sprintf("%s-instance-ip", instanceName), instance.PublicIp)
	pCtx.Export(fmt.Sprintf("%s-instance-pk", instanceName), pulumi.String(privateKeyFilePath))

	return instance, privateKeyFilePath, nil
}

func awsCreateS3Bucket(pCtx *pulumi.Context, provider *aws.Provider, bucketName string) (*s3.Bucket, error) {
	bucket, err := s3.NewBucket(pCtx, bucketName, &s3.BucketArgs{
		Bucket: pulumi.String(bucketName),
	}, pulumi.Provider(provider))
	if err != nil {
		return nil, fmt.Errorf("failed to create S3 bucket: %w", err)
	}

	return bucket, nil
}

func waitForUserDataCompletion(privateKeyPath, publicIP string) error {
	const timeout = 3 * time.Minute
	const checkInterval = 10 * time.Second
	const completionSignalCommand = "test -f /home/ubuntu/user-data-done && echo 'done' || echo 'not done'"

	startTime := time.Now()
	for {
		if time.Since(startTime) > timeout {
			return fmt.Errorf("timeout waiting for user data script to complete")
		}
		output, err := executeSSHCommand(privateKeyPath, publicIP, completionSignalCommand)
		if err != nil {
			fmt.Println("Error checking for user data completion:", err)
		} else if output == "done\n" {
			fmt.Println("User data script completed successfully.")
			return nil
		}
		fmt.Println("Waiting for instance provisioning to complete...")
		time.Sleep(checkInterval)
	}
}
