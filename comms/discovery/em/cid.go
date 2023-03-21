package em

import (
	"fmt"
	"io"
	"net/http"

	sharedConfig "comms.audius.co/shared/config"
	"comms.audius.co/shared/peering"
	"golang.org/x/exp/slog"
)

type CidFetcher struct {
	sps []sharedConfig.ServiceNode
}

func NewCidFetcher() (*CidFetcher, error) {
	peering, err := peering.New(&sharedConfig.PeeringConfig{})
	if err != nil {
		return nil, err
	}

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
			slog.Debug(u, "err", err)
			continue
		}

		body, err := io.ReadAll(resp.Body)
		if resp.StatusCode == 200 {
			return body, err
		}
	}

	return nil, fmt.Errorf("cid not found: %s", cid)
}
