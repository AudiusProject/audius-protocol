package peerdiscovery

import (
	"errors"
	"time"

	"github.com/AudiusProject/audius-protocol/core/common"
	"github.com/AudiusProject/audius-protocol/core/config"
	"github.com/AudiusProject/audius-protocol/core/contracts"
	"github.com/cometbft/cometbft/p2p"
	"github.com/cometbft/cometbft/rpc/client"
)

type PeerDiscovery struct {
	config    *config.Config
	logger    *common.Logger
	contracts *contracts.AudiusContracts
	rpc       client.Client
	p2pSwitch *p2p.Switch

	expectedPeers []string
}

func NewPeerDiscovery(config *config.Config, logger *common.Logger, rpc client.Client, p2pSwitch *p2p.Switch, contracts *contracts.AudiusContracts) (*PeerDiscovery, error) {
	return &PeerDiscovery{
		config:        config,
		logger:        logger.Child("peer_discovery"),
		contracts:     contracts,
		rpc:           rpc,
		p2pSwitch:     p2pSwitch,
		expectedPeers: []string{},
	}, nil
}

func (pd *PeerDiscovery) Start() error {
	discoverTries := 20
	for {
		if err := pd.discoverPeers(); err != nil {
			pd.logger.Errorf("issue discovering peers: %v", err)

			if discoverTries == 0 {
				return errors.New("could not connect to eth to get peers")
			}

			discoverTries -= 1
			time.Sleep(30 * time.Second)
			continue
		}

		// we got peers, break
		break
	}

	for {
		if err := pd.connectToPeers(); err != nil {
			pd.logger.Errorf("issue connecting to peers: %v", err)
		}
		time.Sleep(30 * time.Second)
	}
}
