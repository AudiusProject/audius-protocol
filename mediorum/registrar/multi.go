package registrar

import (
	"errors"
	"mediorum/server"
)

func NewMultiStaging() PeerProvider {
	return multiProvider{
		providers: []PeerProvider{
			NewAudiusApiGatewayStaging(),
			NewGraphStaging(),
		},
	}

}

func NewMultiProd() PeerProvider {
	return multiProvider{
		providers: []PeerProvider{
			NewAudiusApiGatewayProd(),
			NewGraphProd(),
		},
	}
}

type multiProvider struct {
	providers []PeerProvider
}

func (p multiProvider) Peers() ([]server.Peer, error) {
	for _, provider := range p.providers {
		if vals, err := provider.Peers(); err == nil {
			return vals, nil
		}
	}
	return nil, errors.New("all providers failed")
}

func (p multiProvider) Signers() ([]server.Peer, error) {
	for _, provider := range p.providers {
		if vals, err := provider.Signers(); err == nil {
			return vals, nil
		}
	}
	return nil, errors.New("all providers failed")
}
