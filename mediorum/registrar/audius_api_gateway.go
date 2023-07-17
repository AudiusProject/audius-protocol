package registrar

import (
	"encoding/json"
	"io/ioutil"
	"mediorum/httputil"
	"mediorum/server"
	"strings"
)

type NodeResponse struct {
	Data []Node `json:"data"`
}

type Node struct {
	Owner               string `json:"owner"`
	Endpoint            string `json:"endpoint"`
	SpID                int    `json:"spID"`
	Type                string `json:"type"`
	BlockNumber         int    `json:"blockNumber"`
	DelegateOwnerWallet string `json:"delegateOwnerWallet"`
}

func NewAudiusApiGatewayStaging() PeerProvider {
	endpoint := `https://api.staging.audius.co`
	return &audiusApiGatewayProvider{endpoint}
}

func NewAudiusApiGatewayProd() PeerProvider {
	endpoint := `https://api.audius.co`
	return &audiusApiGatewayProvider{endpoint}
}

type audiusApiGatewayProvider struct {
	endpoint string
}

func (p *audiusApiGatewayProvider) Peers() ([]server.Peer, error) {
	return p.getNodes("/content/verbose?all=true")
}

func (p *audiusApiGatewayProvider) Signers() ([]server.Peer, error) {
	return p.getNodes("/discovery/verbose?all=true")
}

func (p *audiusApiGatewayProvider) getNodes(path string) ([]server.Peer, error) {
	endpoint := p.endpoint + path

	resp, err := httpClient.Get(endpoint)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var nodeResponse NodeResponse
	err = json.Unmarshal(body, &nodeResponse)
	if err != nil {
		return nil, err
	}

	var peers []server.Peer
	for _, node := range nodeResponse.Data {
		peer := server.Peer{
			Host:   httputil.RemoveTrailingSlash(strings.ToLower(node.Endpoint)),
			Wallet: strings.ToLower(node.DelegateOwnerWallet),
		}
		peers = append(peers, peer)
	}

	return peers, nil
}
