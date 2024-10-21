package registrar

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/AudiusProject/audius-protocol/pkg/mediorum/httputil"
	"github.com/AudiusProject/audius-protocol/pkg/mediorum/server"
)

func NewGraphStaging() PeerProvider {
	endpoint := `https://gateway-arbitrum.network.thegraph.com/api/7d7b938a80fe712cd8390bf42c88456a/subgraphs/id/Du8Zhnj3ap95TTusD6EnFNohfeVBtQftbqFgcruLCMA`
	return &graphProvider{endpoint}
}

func NewGraphProd() PeerProvider {
	endpoint := `https://gateway-arbitrum.network.thegraph.com/api/3e9ce54904ec5ee003de7785f0d24a21/subgraphs/id/F8TjrYuTLohz64J8uuDke9htSR1aY9TGCuEjJVVjUJaD`
	return &graphProvider{endpoint}
}

type graphProvider struct {
	endpoint string
}

func (p *graphProvider) Peers() ([]server.Peer, error) {
	return p.query(true)
}

func (p *graphProvider) Signers() ([]server.Peer, error) {
	return p.query(false)
}

func (p *graphProvider) query(isContent bool) ([]server.Peer, error) {

	nodeType := "discovery-node"
	if isContent {
		nodeType = "content-node"
	}

	result := []server.Peer{}

	gql := `
	query ServiceProviders($type: String, $skip: Int) {
		serviceNodes(where: {isRegistered: true, type: $type}, orderBy: spId, skip: $skip) {
			endpoint
			delegateOwnerWallet
		}
	}
	`

	for {
		input := map[string]interface{}{
			"query": gql,
			"variables": map[string]interface{}{
				"skip": len(result),
				"type": nodeType,
			},
		}

		output := struct {
			Data struct {
				ServiceNodes []struct {
					Endpoint            string `json:"endpoint"`
					DelegateOwnerWallet string `json:"delegateOwnerWallet"`
				}
			}
		}{}

		err := postJson(p.endpoint, input, &output)
		if err != nil {
			return nil, err
		}

		if len(output.Data.ServiceNodes) == 0 {
			break
		}

		for _, node := range output.Data.ServiceNodes {
			result = append(result, server.Peer{
				Host:   httputil.RemoveTrailingSlash(strings.ToLower(node.Endpoint)),
				Wallet: node.DelegateOwnerWallet,
			})
		}

	}

	return result, nil
}

var httpClient = &http.Client{
	Timeout: time.Minute,
}

func postJson(endpoint string, body interface{}, dest interface{}) error {
	buf, err := json.Marshal(body)
	if err != nil {
		return err
	}

	resp, err := httpClient.Post(endpoint, "application/json", bytes.NewReader(buf))
	if err != nil {
		return err
	}

	if resp.StatusCode != 200 {
		txt, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("postJson: %d %s %s", resp.StatusCode, endpoint, txt)
	}

	dec := json.NewDecoder(resp.Body)
	return dec.Decode(&dest)
}
