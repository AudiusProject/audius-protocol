package peering

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/http"
	"sort"
	"strings"
	"sync"
	"time"

	"comms.audius.co/shared/config"
	"github.com/ethereum/go-ethereum/crypto"
	"golang.org/x/exp/slog"
)

// todo: this should probably live in a struct
var (
	mu      sync.Mutex
	peerMap = map[string]*Info{}
)

func (p *Peering) Solicit() map[string]*Info {

	slog.Info("solicit begin")

	sps, err := p.AllNodes()
	if err != nil {
		slog.Error("solicit failed", err)
		return peerMap
	}

	var wg sync.WaitGroup

	for _, sp := range sps {
		sp := sp
		wg.Add(1)
		go func() {
			u := sp.Endpoint + "/nats/exchange"
			info, err := p.solicitServer(u)
			if err != nil {
				// p.Logger.Debug("get info failed", "endpoint", u, "err", err)
			} else {
				info.Host = sp.Endpoint
				info.SPID = sp.SPID

				mu.Lock()
				peerMap[info.IP] = info
				mu.Unlock()
			}
			wg.Done()
		}()
	}

	wg.Wait()

	slog.Info("solicit done", "sps", len(sps), "peers", len(peerMap))

	return peerMap

}

func (p *Peering) addPeer(info *Info) {
	mu.Lock()
	defer mu.Unlock()

	if _, known := peerMap[info.IP]; !known {
		slog.Info("adding peer", "info", info)
		peerMap[info.IP] = info
	}
}

func (p *Peering) ListPeers() []Info {
	mu.Lock()
	defer mu.Unlock()
	peers := make([]Info, 0, len(peerMap))
	for _, i := range peerMap {
		peers = append(peers, *i)
	}
	sort.Slice(peers, func(i, j int) bool {
		return peers[i].IP < peers[j].IP
	})
	return peers
}

func (p *Peering) solicitServer(endpoint string) (*Info, error) {

	// sign request
	myInfo, err := p.MyInfo()
	if err != nil {
		return nil, err
	}

	resp, err := p.PostSignedJSON(endpoint, myInfo)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("%s: %s", endpoint, resp.Status)
	}

	// get response peer info
	dec := json.NewDecoder(resp.Body)
	var info *Info
	err = dec.Decode(&info)
	if err != nil {
		return nil, err
	}

	info.IsSelf = strings.EqualFold(info.Address, p.Config.Keys.DelegatePublicKey)
	info.AsOf = time.Now()

	return info, nil
}

func (p *Peering) PostSignedJSON(endpoint string, obj interface{}) (*http.Response, error) {
	payload, err := json.Marshal(obj)
	if err != nil {
		return nil, err
	}

	hash := crypto.Keccak256Hash(payload)
	signature, err := crypto.Sign(hash.Bytes(), p.Config.Keys.DelegatePrivateKey)
	if err != nil {
		return nil, err
	}

	// send request
	req, err := http.NewRequest("POST", endpoint, bytes.NewReader(payload))
	if err != nil {
		return nil, err
	}

	sigBase64 := base64.StdEncoding.EncodeToString(signature)
	req.Header.Set(config.SigHeader, sigBase64)

	return http.DefaultClient.Do(req)
}
