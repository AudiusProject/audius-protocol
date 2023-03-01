package config

import (
	"crypto/ecdsa"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log"
	"os"

	"github.com/ethereum/go-ethereum/crypto"
	"github.com/kelseyhightower/envconfig"
	"github.com/nats-io/nkeys"
)

type ServiceNode struct {
	ID                  string `json:"id"`
	SPID                string `json:"spID"`
	Endpoint            string `json:"endpoint"`
	DelegateOwnerWallet string `json:"delegateOwnerWallet"`
	Type                struct {
		ID string `json:"id"`
	} `json:"type"`
}

type ServiceNodesDecoder []ServiceNode

type KeysConfig struct {
	DelegatePrivateKey *ecdsa.PrivateKey `envconfig:"AUDIUS_DELEGATE_PRIVATE_KEY" required:"true" json:"-"`

	// Fields derived from DelegatePrivateKey
	DelegatePublicKey string        `envconfig:"AUDIUS_DELEGATE_PRIVATE_KEY" json:"delegatePublicKey"`
	NkeyPair          nkeys.KeyPair `envconfig:"AUDIUS_DELEGATE_PRIVATE_KEY" json:"-"`
	NkeyPublic        string        `envconfig:"AUDIUS_DELEGATE_PRIVATE_KEY" json:"nKeyPublic"`
}
type KeysConfigDecoder KeysConfig

type PeeringConfig struct {
	Keys                   KeysConfigDecoder   `envconfig:"AUDIUS_DELEGATE_PRIVATE_KEY" required:"true" json:"keys"`
	DevOnlyRegisteredNodes ServiceNodesDecoder `envconfig:"AUDIUS_DEV_ONLY_REGISTERED_NODES" json:"devOnlyRegisteredNodes"`
	NatsClusterName        string              `envconfig:"AUDIUS_NATS_CLUSTER_NAME" default:"comms" json:"natsClusterName"`
	TestHost               string              `envconfig:"AUDIUS_TEST_HOST" json:"testHost"`
	IsStaging              bool                `envconfig:"AUDIUS_IS_STAGING" json:"isStaging"`
}

// EnsurePrivKeyAndLoadConf ensures the private key env var is set and loads a config struct from env vars.
func EnsurePrivKeyAndLoadConf[T any](config *T) {
	EnsurePrivateKeyIsSet()
	if err := envconfig.Process("", config); err != nil {
		log.Fatalf("failed to load %T: %v", *config, err.Error())
	}
	configBytes, _ := json.MarshalIndent(config, "", "\t")
	log.Printf("Parsed %T: %s", *config, string(configBytes))
}

// EnsurePrivateKeyIsSet ensures there's a value for the env var `AUDIUS_DELEGATE_PRIVATE_KEY` by first falling back to `delegatePrivateKey` and then generating a random private key if neither is set.
func EnsurePrivateKeyIsSet() {
	if os.Getenv("AUDIUS_DELEGATE_PRIVATE_KEY") == "" && os.Getenv("audius_delegate_private_key") != "" {
		os.Setenv("AUDIUS_DELEGATE_PRIVATE_KEY", os.Getenv("audius_delegate_private_key"))
	}

	// Ensure private key env var is set by checking deprecated env var or generating random private key
	if os.Getenv("AUDIUS_DELEGATE_PRIVATE_KEY") == "" {
		if os.Getenv("delegatePrivateKey") == "" {
			log.Print("WARN: Missing 'AUDIUS_DELEGATE_PRIVATE_KEY' and deprecated fallback delegatePrivateKey env vars. Generating random private key.")
			privKey := generatePrivateKeyHex()
			fmt.Println("Generated private key: ", privKey)
			os.Setenv("AUDIUS_DELEGATE_PRIVATE_KEY", privKey)
		} else {
			log.Print("WARN: Using DEPRECATED 'delegatePrivateKey' env var. Please set 'AUDIUS_DELEGATE_PRIVATE_KEY' env var to the same value.")
			os.Setenv("AUDIUS_DELEGATE_PRIVATE_KEY", os.Getenv("delegatePrivateKey"))
		}
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

func (snd *ServiceNodesDecoder) Decode(value string) error {
	var nodes []ServiceNode
	err := json.Unmarshal([]byte(value), &nodes)
	if err != nil {
		return fmt.Errorf("failed to decode service nodes: %v", err)
	}
	*snd = ServiceNodesDecoder(nodes)
	return nil
}

func (kcd *KeysConfigDecoder) Decode(value string) error {
	privateBytes, err := hex.DecodeString(value)
	if err != nil {
		return fmt.Errorf("AUDIUS_DELEGATE_PRIVATE_KEY: failed to decode: %v", err)
	}

	privateKey, err := crypto.ToECDSA(privateBytes)
	if err != nil {
		return fmt.Errorf("AUDIUS_DELEGATE_PRIVATE_KEY: failed to convert private key to ecdsa: %v", err)
	}

	nKeyPair, err := nkeys.FromRawSeed(nkeys.PrefixByteUser, privateBytes)
	if err != nil {
		return fmt.Errorf("AUDIUS_DELEGATE_PRIVATE_KEY: invalid nkey: %v", err)
	}

	nKeyPublic, err := nKeyPair.PublicKey()
	if err != nil {
		return fmt.Errorf("AUDIUS_DELEGATE_PRIVATE_KEY: invalid nkey: %v", err)
	}

	*kcd = KeysConfigDecoder(KeysConfig{
		DelegatePrivateKey: privateKey,
		DelegatePublicKey:  crypto.PubkeyToAddress(privateKey.PublicKey).Hex(),
		NkeyPair:           nKeyPair,
		NkeyPublic:         nKeyPublic,
	})
	return nil
}
