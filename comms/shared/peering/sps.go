package peering

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"

	"comms.audius.co/discovery/config"
	"github.com/avast/retry-go"
)

type ServiceNode struct {
	ID                  string `json:"id"`
	SPID                string `json:"spID"`
	Endpoint            string `json:"endpoint"`
	DelegateOwnerWallet string `json:"delegateOwnerWallet"`
	Type                struct {
		ID string `json:"id"`
	} `json:"type"`
}

var (
	allNodes = map[string]ServiceNode{}
)

func PollRegisteredNodes(registeredNodesOverride []ServiceNode) error {
	if len(registeredNodesOverride) > 0 {
		mu.Lock()
		for _, sp := range registeredNodesOverride {
			allNodes[sp.ID] = sp
		}
		mu.Unlock()
		return nil
	}

	// don't start polling for
	if config.Env == "standalone" || os.Getenv("test_host") != "" {
		return nil
	}

	refresh := func() error {
		config.Logger.Debug("refreshing SPs")
		sps, err := queryServiceNodes(config.IsStaging)
		if err != nil {
			config.Logger.Warn("refresh SPs failed " + err.Error())
			return err
		}
		mu.Lock()
		for _, sp := range sps {
			allNodes[sp.ID] = sp
		}
		mu.Unlock()
		return nil
	}

	// start polling in goroutine
	go func() {
		for {
			time.Sleep(time.Hour)
			retry.Do(refresh)
		}
	}()

	return retry.Do(refresh)

}

func listNodes(typeFilter string) ([]ServiceNode, error) {
	// TODO: yuk
	// docker compose v2 dev single node
	if os.Getenv("test_host") != "" && config.Env == "standalone" {
		return testNodes[:1], nil
	}
	// docker compose v2 multi node
	if os.Getenv("test_host") != "" {
		return testNodes, nil
	}
	// make dev.discovery
	if config.Env == "standalone" && len(allNodes) == 0 {
		return []ServiceNode{}, nil
	}

	result := []ServiceNode{}
	mu.Lock()
	for _, node := range allNodes {
		if typeFilter == "" || node.Type.ID == typeFilter {
			result = append(result, node)
		}
	}
	mu.Unlock()
	return result, nil
}

func AllNodes() ([]ServiceNode, error) {
	return listNodes("")
}

func GetDiscoveryNodes() ([]ServiceNode, error) {
	return listNodes("discovery-node")
}

func GetContentNodes() ([]ServiceNode, error) {
	return listNodes("content-node")
}

var testNodes = []ServiceNode{
	{
		Endpoint:            "http://com1:8924",
		DelegateOwnerWallet: "0x1c185053c2259f72fd023ED89B9b3EBbD841DA0F",
	},
	{
		Endpoint:            "http://com2:8924",
		DelegateOwnerWallet: "0x90b8d2655A7C268d0fA31758A714e583AE54489D",
	},
	{
		Endpoint:            "http://com3:8924",
		DelegateOwnerWallet: "0xb7b9599EeB2FD9237C94cFf02d74368Bb2df959B",
	},
	{
		Endpoint:            "http://com4:8924",
		DelegateOwnerWallet: "0xfa4f42633Cb0c72Aa35D3D1A3566abb7142c7b16",
	},
}

var (
	prodEndpoint = `https://api.thegraph.com/subgraphs/name/audius-infra/audius-network-mainnet`

	stagingEndpoint = `https://api.thegraph.com/subgraphs/name/audius-infra/audius-network-goerli`

	gql = `
		query ServiceProviders($skip: Int) {
			serviceNodes(where: {isRegistered: true}, orderBy: spId, skip: $skip) {
				id
				spId
				endpoint
				delegateOwnerWallet
				type {
					id
				}
			}
		}
	`
)

func queryServiceNodes(isStaging bool) ([]ServiceNode, error) {

	endpoint := prodEndpoint
	if isStaging {
		endpoint = stagingEndpoint
	}

	allNodes := []ServiceNode{}

	for {
		input := map[string]interface{}{
			"query": gql,
			"variables": map[string]interface{}{
				"skip": len(allNodes),
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

		if len(output.Data.ServiceNodes) == 0 {
			break
		}

		allNodes = append(allNodes, output.Data.ServiceNodes...)

	}

	return allNodes, nil
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
