package peering

import (
	"fmt"
	"testing"
)

func TestPeers(t *testing.T) {
	t.Skip()

	input := map[string]interface{}{
		"query": gql,
		"variables": map[string]interface{}{
			"type": "discovery-node",
		},
	}

	output := struct {
		Data struct {
			ServiceNodes []ServiceNode
		}
	}{}

	err := postJson(prodEndpoint, input, &output)
	if err != nil {
		panic(err)
	}

	for _, sp := range output.Data.ServiceNodes {
		fmt.Println(sp)
	}

	// cnById := map[string]string{}
	// for _, sp := range output.Data.ServiceNodes {
	// 	cnById[sp.SPID] = sp.Endpoint
	// }

	// fmt.Println(cnById)
}
