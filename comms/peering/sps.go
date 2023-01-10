package peering

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"

	"comms.audius.co/config"
)

type ServiceNode struct {
	ID                  string
	SPID                string
	Endpoint            string
	DelegateOwnerWallet string
}

func GetDiscoveryNodes() ([]ServiceNode, error) {
	if config.Env == "standalone" {
		return []ServiceNode{}, nil
	}
	if os.Getenv("test_host") != "" {
		return testDiscoveryNodes, nil
	}

	// todo: some caching
	return queryServiceNodes(false, config.IsStaging)
}

func GetContentNodes() ([]ServiceNode, error) {
	// todo: some caching
	return queryServiceNodes(true, config.IsStaging)
}

var testDiscoveryNodes = []ServiceNode{
	{
		Endpoint:            "http://com1:8925",
		DelegateOwnerWallet: "0x1c185053c2259f72fd023ED89B9b3EBbD841DA0F",
	},
	{
		Endpoint:            "http://com2:8925",
		DelegateOwnerWallet: "0x90b8d2655A7C268d0fA31758A714e583AE54489D",
	},
	{
		Endpoint:            "http://com3:8925",
		DelegateOwnerWallet: "0xb7b9599EeB2FD9237C94cFf02d74368Bb2df959B",
	},
	{
		Endpoint:            "http://com4:8925",
		DelegateOwnerWallet: "0xfa4f42633Cb0c72Aa35D3D1A3566abb7142c7b16",
	},
}

var (
	prodEndpoint = `https://api.thegraph.com/subgraphs/name/audius-infra/audius-network-mainnet`

	stagingEndpoint = `https://api.thegraph.com/subgraphs/name/audius-infra/audius-network-goerli`

	gql = `
		query ServiceProviders($type: String) {
			serviceNodes(where: {isRegistered: true, type: $type}) {
				id
				spId
				endpoint
				delegateOwnerWallet
			}
		}
	`
)

func queryServiceNodes(isContent, isStaging bool) ([]ServiceNode, error) {

	endpoint := prodEndpoint
	if isStaging {
		endpoint = stagingEndpoint
	}

	nodeType := "discovery-node"
	if isContent {
		nodeType = "content-node"
	}

	input := map[string]interface{}{
		"query": gql,
		"variables": map[string]interface{}{
			"type": nodeType,
		},
	}

	output := struct {
		Data struct {
			ServiceNodes []ServiceNode
		}
	}{}

	err := postJson(endpoint, input, &output)
	if err != nil {
		return nil, err
	}

	return output.Data.ServiceNodes, nil
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
