package peering

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	sharedConfig "comms.audius.co/shared/config"
	"github.com/avast/retry-go"
	"golang.org/x/exp/slog"
)

var (
	allNodes = map[string]sharedConfig.ServiceNode{}
)

func (p *Peering) PollRegisteredNodes() error {
	// overrides for tests and local dev
	if p.Config.DevOnlyRegisteredNodes != nil {
		mu.Lock()
		for _, sp := range p.Config.DevOnlyRegisteredNodes {
			allNodes[sp.ID] = sp
		}
		mu.Unlock()
		return nil
	}

	refresh := func() error {
		slog.Debug("refreshing SPs")
		sps, err := queryServiceNodes(p.Config.IsStaging)
		if err != nil {
			slog.Warn("refresh SPs failed " + err.Error())
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

func (p *Peering) listNodes(typeFilter string) ([]sharedConfig.ServiceNode, error) {
	result := []sharedConfig.ServiceNode{}
	mu.Lock()
	for _, node := range allNodes {
		if typeFilter == "" || node.Type.ID == typeFilter {
			result = append(result, node)
		}
	}
	mu.Unlock()
	return result, nil
}

func (p *Peering) AllNodes() ([]sharedConfig.ServiceNode, error) {
	return p.listNodes("")
}

func (p *Peering) GetDiscoveryNodes() ([]sharedConfig.ServiceNode, error) {
	return p.listNodes("discovery-node")
}

func (p *Peering) GetContentNodes() ([]sharedConfig.ServiceNode, error) {
	return p.listNodes("content-node")
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

func queryServiceNodes(isStaging bool) ([]sharedConfig.ServiceNode, error) {

	endpoint := prodEndpoint
	if isStaging {
		endpoint = stagingEndpoint
	}

	allNodes := []sharedConfig.ServiceNode{}

	for {
		input := map[string]interface{}{
			"query": gql,
			"variables": map[string]interface{}{
				"skip": len(allNodes),
			},
		}

		output := struct {
			Data struct {
				ServiceNodes []sharedConfig.ServiceNode
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
