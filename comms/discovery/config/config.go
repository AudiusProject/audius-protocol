package config

import (
	"crypto/ecdsa"
	"encoding/hex"
	"log"
	"os"
	"sync"

	"comms.audius.co/discovery/misc"
	"comms.audius.co/discovery/the_graph"
	"github.com/ethereum/go-ethereum/crypto"
	"golang.org/x/exp/slog"
)

type DiscoveryConfig struct {
	MyHost             string
	MyWallet           string
	MyPrivateKey       *ecdsa.PrivateKey `json:"-"`
	IsStaging          bool
	IsSandbox          bool // audius-d sandbox (comms_sandbox env var)
	IsDev              bool
	IsRegisteredWallet bool

	mu    sync.RWMutex
	peers []the_graph.Peer
}

func (c *DiscoveryConfig) SetPeers(peers []the_graph.Peer) {
	c.mu.Lock()
	c.peers = peers
	c.mu.Unlock()
}

func (c *DiscoveryConfig) Peers() []the_graph.Peer {
	c.mu.RLock()
	defer c.mu.RUnlock()
	return c.peers
}

// Parse returns the discovery config by parsing env vars.
func Parse() *DiscoveryConfig {
	c := &DiscoveryConfig{}

	c.MyHost = misc.TrimTrailingSlash(os.Getenv("audius_discprov_url"))
	c.IsStaging = os.Getenv("AUDIUS_IS_STAGING") == "true"
	c.IsDev = os.Getenv("comms_dev_mode") == "true"
	c.IsSandbox = os.Getenv("comms_sandbox") == "true"

	pk, err := parsePrivateKey(os.Getenv("audius_delegate_private_key"))
	if err != nil {
		log.Fatal("invalid private key", err)
	}
	c.MyPrivateKey = pk

	addressFromEnv := os.Getenv("audius_delegate_owner_wallet")
	realAddress := crypto.PubkeyToAddress(pk.PublicKey).Hex()
	if realAddress != addressFromEnv {
		slog.Warn("audius_delegate_owner_wallet env variable doesn't match private key address", "audius_delegate_owner_wallet", addressFromEnv, "derived", realAddress)
	}
	c.MyWallet = realAddress

	return c
}

func parsePrivateKey(pk string) (*ecdsa.PrivateKey, error) {
	privateBytes, err := hex.DecodeString(pk)
	if err != nil {
		return nil, err
	}
	return crypto.ToECDSA(privateBytes)
}
