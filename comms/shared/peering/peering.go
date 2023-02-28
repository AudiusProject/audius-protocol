package peering

import (
	"encoding/hex"
	"os"
	"os/exec"

	sharedConfig "comms.audius.co/shared/config"
	"golang.org/x/exp/slog"
)

type Peering struct {
	Config              *sharedConfig.PeeringConfig
	IP                  string
	NatsClusterUsername string
	NatsClusterPassword string
	NatsReplicaCount    int
	NatsIsReachable     bool
}

func New(config *sharedConfig.PeeringConfig) (*Peering, error) {
	p := &Peering{
		Config:           config,
		NatsReplicaCount: 3,
		NatsIsReachable:  false,
	}
	if err := p.configureNatsCliNkey(); err != nil {
		slog.Error("failed to write cli nkey config", err)
	}

	// ip addr
	var IP string
	var err error
	if config.TestHost != "" {
		IP = config.TestHost
	} else {
		for i := 0; i < 5; i++ {
			IP, err = getIp()
			if err != nil {
				slog.With("attempt", i).Error("getIp failed", err)
			} else {
				break
			}
		}
	}
	p.IP = IP

	// use our private key to sign our wallet address
	// to generate a consistent username + password for this node's NATS cluster route
	// that is unguessable
	// we return this in the "exchange" endpoint to valid peer nodes
	// so that NATS clients can only cluster with us after doing the "exchange"
	signed, err := config.Keys.NkeyPair.Sign([]byte(config.Keys.DelegatePublicKey))
	if err != nil {
		slog.Error("failed to sign wallet address", err)
		return nil, err
	}
	signedHex := hex.EncodeToString(signed)
	p.NatsClusterUsername = config.NatsClusterName
	p.NatsClusterPassword = signedHex[0:15]

	slog.Info("config",
		"isStaging", config.IsStaging,
		"wallet", config.Keys.DelegatePublicKey,
		"nkey", config.Keys.NkeyPublic,
		"ip", IP,
		"nats_cluster", config.NatsClusterName,
		"nu", p.NatsClusterUsername,
		"np", p.NatsClusterPassword)

	return p, nil
}

func (p *Peering) configureNatsCliNkey() error {
	var err error

	bytes, err := p.Config.Keys.NkeyPair.Seed()
	if err != nil {
		return err
	}

	tmpFile := "/tmp/nkey_seed.txt"
	err = os.WriteFile(tmpFile, bytes, 0644)
	if err != nil {
		return err
	}

	_, err = exec.Command("nats", "context", "save", "--nkey", tmpFile, "default", "--select").Output()
	if err != nil {
		return err
	}

	return nil
}
