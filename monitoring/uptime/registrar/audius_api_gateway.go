package registrar

import (
	"encoding/json"
	"io/ioutil"
	"peer_health/httputil"
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

func (p *audiusApiGatewayProvider) Peers(nodeType string) ([]Peer, error) {
	var peers []Peer
	var err error
	switch nodeType {
	case "content":
		peers, err = p.contentPeers()
	case "discovery":
		peers, err = p.discoveryPeers()
	case "all":
		discoveryPeers, err := p.discoveryPeers()
		if err != nil {
			return nil, err
		}
		contentPeers, err := p.contentPeers()
		if err != nil {
			return nil, err
		}
		peers = append(discoveryPeers, contentPeers...)
	}
	return peers, err
}

func (p *audiusApiGatewayProvider) contentPeers() ([]Peer, error) {
	return p.getNodes("/content/verbose?all=true")
}

func (p *audiusApiGatewayProvider) discoveryPeers() ([]Peer, error) {
	return p.getNodes("/discovery/verbose?all=true")
}

func (p *audiusApiGatewayProvider) getNodes(path string) ([]Peer, error) {
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

	var peers []Peer
	for _, node := range nodeResponse.Data {
		peer := Peer{
			Host:   httputil.RemoveTrailingSlash(strings.ToLower(node.Endpoint)),
			Wallet: strings.ToLower(node.DelegateOwnerWallet),
		}
		peers = append(peers, peer)
	}

	return peers, nil
}
