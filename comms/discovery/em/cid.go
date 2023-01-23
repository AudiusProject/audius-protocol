package em

import (
	"fmt"
	"io"
	"net/http"

	"comms.audius.co/discovery/config"
	"comms.audius.co/shared/peering"
)

type CidFetcher struct {
	sps []peering.ServiceNode
}

func NewCidFetcher() (*CidFetcher, error) {
	sps, err := peering.GetContentNodes()
	if err != nil {
		return nil, err
	}
	cf := &CidFetcher{
		sps: sps,
	}
	return cf, nil
}

func (cf *CidFetcher) Fetch(userId int64, cid string) ([]byte, error) {

	// TODO: should lookup replica set for this userId
	// fmt.Println(" fetch cid", userId, cid)

	for _, sp := range cf.sps {
		u := sp.Endpoint + "/content/" + cid
		resp, err := http.Get(u)
		if err != nil {
			config.Logger.Debug(u, "err", err)
			continue
		}

		body, err := io.ReadAll(resp.Body)
		if resp.StatusCode == 200 {
			return body, err
		}
	}

	return nil, fmt.Errorf("cid not found: %s", cid)
}
