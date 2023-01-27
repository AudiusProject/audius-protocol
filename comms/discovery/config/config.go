package config

import (
	"crypto/ecdsa"
	"encoding/hex"
	"log"
	"os"
	"os/exec"
	"strings"

	"github.com/ethereum/go-ethereum/crypto"
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

	NatsClusterUsername = ""
	NatsClusterPassword = ""
	NatsUseNkeys        = true
	NatsReplicaCount    = 3
	NatsIsReachable     = false

	IsStaging     = Env == "stage"
	IsCreatorNode = false
)

func init() {
	Logger.SetHandler(log15.StreamHandler(os.Stdout, log15.TerminalFormat()))
}

func Init() {
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

	privateKeyHex := mgetenv("audius_delegate_private_key", "delegatePrivateKey")
	if privateKeyHex == "" {
		privateKeyHex = generatePrivateKeyHex()
		Logger.Warn("audius_delegate_private_key not provided. Using randomly generated private key.")
	}

	// wallet address
	privateBytes, err := hex.DecodeString(privateKeyHex)
	if err != nil {
		log.Fatal("audius_delegate_private_key: invalid hex", err)
	}

	PrivateKey, err = crypto.ToECDSA(privateBytes)
	if err != nil {
		log.Fatal("audius_delegate_private_key: invalid key", err)
	}

	WalletAddress = crypto.PubkeyToAddress(PrivateKey.PublicKey).Hex()

	// nkey
	NkeyPair, err = nkeys.FromRawSeed(nkeys.PrefixByteUser, privateBytes)
	if err != nil {
		log.Fatal("audius_delegate_private_key: invalid nkey", err)
	}

	if NatsUseNkeys {
		if err := configureNatsCliNkey(); err != nil {
			Logger.Warn("failed to write cli nkey config: " + err.Error())
		}
	}

	NkeyPublic, err = NkeyPair.PublicKey()
	if err != nil {
		log.Fatal("audius_delegate_private_key: invalid nkey", err)
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
	NatsClusterUsername = signedHex[0:10]
	NatsClusterPassword = signedHex[10:20]

	Logger.Info("config",
		"env", Env,
		"wallet", WalletAddress,
		"nkey", NkeyPublic,
		"ip", IP,
		"nu", NatsClusterUsername,
		"np", NatsClusterPassword)
}

func mgetenv(keys ...string) string {
	for _, k := range keys {
		v := os.Getenv(k)
		if v != "" {
			return v
		}
	}
	return ""
}

func dieOnErr(err error) {
	if err != nil {
		log.Fatal(err)
	}
}

func generatePrivateKeyHex() string {
	privateKey, err := crypto.GenerateKey()
	if err != nil {
		log.Fatal(err)
	}
	privateKeyBytes := crypto.FromECDSA(privateKey)
	return hex.EncodeToString(privateKeyBytes)
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
