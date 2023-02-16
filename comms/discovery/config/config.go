package config

import (
	"crypto/ecdsa"
	"encoding/hex"
	"log"
	"os"
	"os/exec"
	"strings"

	sharedConfig "comms.audius.co/shared/config"
	"github.com/inconshreveable/log15"
	"github.com/nats-io/nkeys"
)

var (
	Logger = log15.New()

	Env = os.Getenv("audius_discprov_env")

	PrivateKey    *ecdsa.PrivateKey
	WalletAddress string

	NkeyPair   nkeys.KeyPair
	NkeyPublic string

	IP string

	NatsClusterName     = "comms"
	NatsClusterUsername = ""
	NatsClusterPassword = ""
	NatsUseNkeys        = true
	NatsReplicaCount    = 3
	NatsIsReachable     = false

	IsStaging     = Env == "stage"
	IsCreatorNode = false

	discoveryConfig *DiscoveryConfig
)

type DiscoveryConfig struct {
	Keys sharedConfig.KeysConfigDecoder `envconfig:"DELEGATE_PRIVATE_KEY" required:"true" json:"Keys"`
}

// GetDiscoveryConfig returns the discovery config by parsing env vars.
func GetDiscoveryConfig() *DiscoveryConfig {
	if discoveryConfig == nil {
		discoveryConfig = &DiscoveryConfig{}
		sharedConfig.EnsurePrivKeyAndLoadConf(discoveryConfig)
	}
	return discoveryConfig
}

func init() {
	Logger.SetHandler(log15.StreamHandler(os.Stdout, log15.TerminalFormat()))
}

func Init(keysConfig sharedConfig.KeysConfigDecoder) {
	PrivateKey = keysConfig.DelegatePrivateKey
	WalletAddress = keysConfig.DelegatePublicKey
	NkeyPair = keysConfig.NkeyPair
	NkeyPublic = keysConfig.NkeyPublic

	var err error

	// todo: hack for creator node config
	if strings.Contains(os.Getenv("creatorNodeEndpoint"), "staging") {
		Env = "stage"
		IsStaging = true
	}
	if os.Getenv("delegateOwnerWallet") != "" {
		IsCreatorNode = true
	}

	switch Env {
	case "standalone":
		envStandalone()
	default:
		Logger.Info("no env defaults for: " + Env)
	}

	if NatsUseNkeys {
		if err := configureNatsCliNkey(); err != nil {
			Logger.Warn("failed to write cli nkey config: " + err.Error())
		}
	}

	// ip addr
	for i := 0; i < 5; i++ {
		IP, err = getIp()
		if err != nil {
			Logger.Warn("getIp failed", "attempt", i, "err", err)
		} else {
			break
		}
	}

	// use our private key to sign our wallet address
	// to generate a consistent username + password for this node's NATS cluster route
	// that is unguessable
	// we return this in the "exchange" endpoint to valid peer nodes
	// so that NATS clients can only cluster with us after doing the "exchange"
	signed, err := NkeyPair.Sign([]byte(WalletAddress))
	dieOnErr(err)
	signedHex := hex.EncodeToString(signed)
	NatsClusterUsername = NatsClusterName
	NatsClusterPassword = signedHex[0:15]

	Logger.Info("config",
		"env", Env,
		"wallet", WalletAddress,
		"nkey", NkeyPublic,
		"ip", IP,
		"nats_cluster", NatsClusterName,
		"nu", NatsClusterUsername,
		"np", NatsClusterPassword)
}

func GetEnvDefault(k, defaultV string) string {
	v := os.Getenv(k)
	if len(v) == 0 {
		return defaultV
	}
	return v
}

func dieOnErr(err error) {
	if err != nil {
		log.Fatal(err)
	}
}

func configureNatsCliNkey() error {
	if !NatsUseNkeys {
		return nil
	}

	var err error

	bytes, err := NkeyPair.Seed()
	if err != nil {
		return err
	}

	tmpFile := "/tmp/nkey_seed.txt"
	err = os.WriteFile(tmpFile, bytes, 0644)
	if err != nil {
		return err
	}

	_, err = exec.Command("nats", "context", "save", "--nkey", tmpFile, "default").Output()
	if err != nil {
		return err
	}

	_, err = exec.Command("nats", "context", "select", "default").Output()
	if err != nil {
		return err
	}

	return nil
}
