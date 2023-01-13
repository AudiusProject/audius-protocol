package peering

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"sync"
	"time"

	"comms.audius.co/config"
	"comms.audius.co/jetstream"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/nats-io/nats.go"
)

var manager = &NatsManager{}

// todo: this should probably live in a struct
var (
	mu            sync.Mutex
	peersByWallet = map[string]*Info{}
)

func Solicit() {

	config.Logger.Info("solicit begin")

	sps, err := GetDiscoveryNodes()
	if err != nil {
		config.Logger.Error("solicit failed: " + err.Error())
		return
	}

	var wg sync.WaitGroup

	goodNatsUrls := []string{}

	for _, sp := range sps {
		sp := sp
		wg.Add(1)
		go func() {
			u := sp.Endpoint + "/comms/exchange"
			info, err := solicitServer(u)
			if err != nil {
				config.Logger.Warn("get info failed", "endpoint", sp.Endpoint, "err", err)
			} else {
				mu.Lock()
				peersByWallet[info.Address] = info

				if info.NatsConnected {
					goodNatsUrls = append(goodNatsUrls, fmt.Sprintf("nats://%s:4222", info.IP))
				}

				mu.Unlock()
			}
			wg.Done()
		}()
	}

	wg.Wait()

	manager.StartNats(peersByWallet)

	// create nats client with valid connections
	goodNatsUrl := strings.Join(goodNatsUrls, ",")
	config.Logger.Debug("nats client urls: " + goodNatsUrl)
	for i := 0; i < 5; i++ {
		var nc *nats.Conn
		var jsc nats.JetStreamContext

		if err != nil {
			config.Logger.Warn("dial nats failed "+err.Error(), "attempt", i)
			time.Sleep(time.Second)
		}

		nc, err = dialNatsUrl(goodNatsUrl)
		if err != nil {
			continue
		}

		jsc, err = nc.JetStream(nats.PublishAsyncMaxPending(256))
		if err != nil {
			continue
		}

		jetstream.SetJetstreamContext(jsc)
		break

	}

	config.Logger.Info("solicit done")

}

func AddPeer(info *Info) {
	mu.Lock()
	defer mu.Unlock()

	if existing, ok := peersByWallet[info.Address]; ok && info.IP == existing.IP {
		config.Logger.Info("peer already known", "wallet", existing.Address)
	} else {
		config.Logger.Info("adding peer", "wallet", info.Address)
		peersByWallet[info.Address] = info
		// trying to pre-emptively add peer causes routing to cycle endlessly
		// at least in the docker env
		// manager.StartNats(peersByWallet)
	}

}

func ListPeers() []Info {
	mu.Lock()
	defer mu.Unlock()
	peers := make([]Info, 0, len(peersByWallet))
	for _, i := range peersByWallet {
		peers = append(peers, *i)
	}
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

	// get response peer info
	dec := json.NewDecoder(resp.Body)
	var info *Info
	err = dec.Decode(&info)
	if err != nil {
		return nil, err
	}

	info.IsSelf = info.Address == config.WalletAddress

	// nats connection test
	natsUrl := fmt.Sprintf("nats://%s:4222", info.IP)
	nc, err := dialNatsUrl(natsUrl)
	if err != nil {
		config.Logger.Warn("nats connection test failed", "ip", info.IP, "err", err)
	} else {
		servers := nc.Servers()
		fmt.Println("nc servers", servers)
		info.NatsConnected = true
		nc.Close()
	}

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
