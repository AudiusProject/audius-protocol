// Package config provides the configuration for the storage node by reading env vars.
package config

import (
	"crypto/ecdsa"
	"encoding/hex"
	"fmt"
	"log"
	"os"

	"github.com/ethereum/go-ethereum/crypto"
	"github.com/kelseyhightower/envconfig"
)

type PrivateKeyDecoder ecdsa.PrivateKey
type PublicKeyDecoder PublicKey
type PublicKey struct {
	Hex string
}

type StorageConfig struct {
	DelegatePrivateKey PrivateKeyDecoder `envconfig:"delegate_private_key"`
	DelegatePublicKey  PublicKeyDecoder  `envconfig:"delegate_private_key"` // Derives public key from private key
}

var storageConfig *StorageConfig

// GetStorageConfig returns the storage config by parsing env vars.
func GetStorageConfig() *StorageConfig {
	if storageConfig == nil {
		convertLegacyEnvVars()
		var newStorageConfig StorageConfig
		err := envconfig.Process("audius", &newStorageConfig)
		if err != nil {
			log.Fatal("failed to load storage config: ", err.Error())
		}
		storageConfig = &newStorageConfig
		log.Printf(
			"Parsed StorageConfig:\nDelegatePrivateKey: [hidden]\nDelegatePublicKey: %v\n",
			storageConfig.DelegatePublicKey,
		)
	}
	return storageConfig
}

// convertLegacyEnvVars handles all the ugly logic of ensuring all env vars are set correctly.
func convertLegacyEnvVars() {
	// Ensure private key env var is set by checking deprecated env var or generating random private key
	if os.Getenv("audius_delegate_private_key") == "" {
		if os.Getenv("delegatePrivateKey") == "" {
			privateKeyHex := generatePrivateKeyHex()
			log.Print("WARN: Missing audius_delegate_private_key and deprecated fallback delegatePrivateKey env vars. Generating random private key.")
			os.Setenv("audius_delegate_private_key", privateKeyHex)
		} else {
			log.Print("WARN: Using DEPRECATED 'delegatePrivateKey' env var. Please set 'audius_delegate_private_key' env var to the same value.")
			os.Setenv("audius_delegate_private_key", os.Getenv("delegatePrivateKey"))
		}
	}
}

func (pkd *PrivateKeyDecoder) Decode(value string) error {
	privateBytes, err := hex.DecodeString(value)
	if err != nil {
		return fmt.Errorf("failed to decode private key: %v", err)
	}
	privateKey, err := crypto.ToECDSA(privateBytes)
	if err != nil {
		return fmt.Errorf("failed to convert private key to ecdsa: %v", err)
	}
	*pkd = PrivateKeyDecoder(*privateKey)
	return nil
}

func (pkd *PublicKeyDecoder) Decode(value string) error {
	var privateKey PrivateKeyDecoder
	err := privateKey.Decode(value)
	if err != nil {
		return err
	}
	publicKeyHex := crypto.PubkeyToAddress(privateKey.PublicKey).Hex()
	*pkd = PublicKeyDecoder(PublicKey{Hex: publicKeyHex})
	return nil
}

func generatePrivateKeyHex() string {
	privateKey, err := crypto.GenerateKey()
	if err != nil {
		log.Fatal(err)
	}
	privateKeyBytes := crypto.FromECDSA(privateKey)
	return hex.EncodeToString(privateKeyBytes)
}
