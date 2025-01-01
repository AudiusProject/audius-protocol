package registrar

import (
	"errors"
	"fmt"

	"github.com/AudiusProject/audius-protocol/pkg/mediorum/server"
)

func NewMultiStaging() PeerProvider {
	return multiProvider{
		providers: []PeerProvider{
			NewAudiusApiGatewayStaging(),
			NewGraphStaging(),
			NewEthChainProvider(),
		},
	}

}

func NewMultiProd() PeerProvider {
	return multiProvider{
		providers: []PeerProvider{
			NewAudiusApiGatewayProd(),
			NewGraphProd(),
			NewEthChainProvider(),
		},
	}
}

func NewMultiDev() PeerProvider {
	return multiProvider{
		providers: []PeerProvider{
			NewEthChainProvider(),
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
		} else {
			fmt.Println(err)
		}
	}
	return nil, errors.New("all providers failed")
}

func (p multiProvider) Signers() ([]server.Peer, error) {
	for _, provider := range p.providers {
		if vals, err := provider.Signers(); err == nil {
			return vals, nil
		} else {
			fmt.Println(err)
		}
	}
	return nil, errors.New("all providers failed")
}
