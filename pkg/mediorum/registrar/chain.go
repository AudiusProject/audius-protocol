package registrar

import (
	"strings"

	"github.com/AudiusProject/audius-protocol/pkg/mediorum/ethcontracts"
	"github.com/AudiusProject/audius-protocol/pkg/mediorum/httputil"

	"github.com/AudiusProject/audius-protocol/pkg/mediorum/server"
)

func NewEthChainProvider() PeerProvider {
	return &ethChainProvider{}
}

type ethChainProvider struct {
}

func (p *ethChainProvider) Peers() ([]server.Peer, error) {
	serviceProviders, err := ethcontracts.GetServiceProviderList("content-node")
	if err != nil {
		return nil, err
	}
	peers := make([]server.Peer, len(serviceProviders))
	for i, sp := range serviceProviders {
		peers[i] = server.Peer{
			Host:   httputil.RemoveTrailingSlash(strings.ToLower(sp.Endpoint)),
			Wallet: strings.ToLower(sp.DelegateOwnerWallet),
		}
	}
	return peers, nil
}

func (p *ethChainProvider) Signers() ([]server.Peer, error) {
	serviceProviders, err := ethcontracts.GetServiceProviderList("discovery-node")
	if err != nil {
		return nil, err
	}
	signers := make([]server.Peer, len(serviceProviders))
	for i, sp := range serviceProviders {
		signers[i] = server.Peer{
			Host:   httputil.RemoveTrailingSlash(strings.ToLower(sp.Endpoint)),
			Wallet: strings.ToLower(sp.DelegateOwnerWallet),
		}
	}
	return signers, nil
}
