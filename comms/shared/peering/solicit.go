package peering

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/http"
	"sort"
	"sync"

	"comms.audius.co/discovery/config"
	"github.com/ethereum/go-ethereum/crypto"
)

// todo: this should probably live in a struct
var (
	mu      sync.Mutex
	peerMap = map[string]*Info{}
)

func Solicit() map[string]*Info {

	config.Logger.Info("solicit begin")

	sps, err := AllNodes()
	if err != nil {
		config.Logger.Error("solicit failed: " + err.Error())
		return peerMap
	}

	var wg sync.WaitGroup

	for _, sp := range sps {
		sp := sp
		wg.Add(1)
		go func() {
			u := sp.Endpoint + "/nats/exchange"
			info, err := solicitServer(u)
			if err != nil {
				config.Logger.Debug("get info failed", "endpoint", u, "err", err)
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

	config.Logger.Info("solicit done", "sps", len(sps), "peers", len(peerMap))

	return peerMap

}

func addPeer(info *Info) {
	mu.Lock()
	defer mu.Unlock()

	if _, known := peerMap[info.IP]; !known {
		config.Logger.Info("adding peer", "info", info)
		peerMap[info.IP] = info
	}
}

func ListPeers() []Info {
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

func solicitServer(endpoint string) (*Info, error) {

	// sign request
	myInfo, err := MyInfo()
	if err != nil {
		return nil, err
	}

	resp, err := PostSignedJSON(endpoint, myInfo)
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

	info.IsSelf = info.Address == config.WalletAddress

	return info, nil
}

func PostSignedJSON(endpoint string, obj interface{}) (*http.Response, error) {
	payload, err := json.Marshal(obj)
	if err != nil {
		return nil, err
	}

	hash := crypto.Keccak256Hash(payload)
	signature, err := crypto.Sign(hash.Bytes(), config.PrivateKey)
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
