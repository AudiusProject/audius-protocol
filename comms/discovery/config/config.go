package config

import (
	"crypto/ecdsa"
	"encoding/hex"
	"os"
	"strings"
	"sync"

	"comms.audius.co/discovery/the_graph"
	"github.com/ethereum/go-ethereum/crypto"
)

type DiscoveryConfig struct {
	MyHost          string
	MyWallet        string
	MyPrivateKeyHex string            `json:"-"`
	MyPrivateKey    *ecdsa.PrivateKey `json:"-"`
	IsStaging       bool

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

	c.MyPrivateKeyHex = os.Getenv("audius_delegate_private_key")
	c.MyWallet = os.Getenv("audius_delegate_owner_wallet")
	c.MyHost = strings.TrimRight(strings.TrimSpace(os.Getenv("audius_discprov_url")), "/") // trim any trailing /
	c.IsStaging = os.Getenv("AUDIUS_IS_STAGING") == "true"

	pk, err := parsePrivateKey(c.MyPrivateKeyHex)
	if err != nil {
		panic(err)
	}
	c.MyPrivateKey = pk

	return c
}

func parsePrivateKey(pk string) (*ecdsa.PrivateKey, error) {
	privateBytes, err := hex.DecodeString(pk)
	if err != nil {
		return nil, err
	}
	return crypto.ToECDSA(privateBytes)
}
