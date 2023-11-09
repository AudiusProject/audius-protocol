package registrar

import (
	"errors"
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

func (p multiProvider) Peers(nodeType string) ([]Peer, error) {
	if nodeType != "discovery" && nodeType != "content" && nodeType != "all" {
		return nil, errors.New("invalid node type")
	}

	for _, provider := range p.providers {
		if vals, err := provider.Peers(nodeType); err == nil {
			return vals, nil
		}
	}
	return nil, errors.New("all providers failed")
}
