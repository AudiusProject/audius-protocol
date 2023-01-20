package jetstream

import (
	"fmt"
	"strings"
	"sync"

	"comms.audius.co/discovery/config"
	"comms.audius.co/shared/peering"
	"github.com/nats-io/nats.go"
)

var (
	mu  sync.RWMutex
	jsc nats.JetStreamContext
)

func Dial(peerMap map[string]*peering.Info) error {
	natsUrl := nats.DefaultURL

	if peerMap != nil {
		goodNatsUrls := []string{}
		for _, peer := range peerMap {
			u := fmt.Sprintf("nats://%s:4222", peer.IP)
			ok := natsConnectionTest(u)
			if ok {
				goodNatsUrls = append(goodNatsUrls, u)
			}
		}
		natsUrl = strings.Join(goodNatsUrls, ",")
	}

	nc, err := dialNatsUrl(natsUrl)
	if err != nil {
		return err
	}
	j, err := nc.JetStream()
	if err != nil {
		return err
	}
	SetJetstreamContext(j)
	return nil
}

func natsConnectionTest(natsUrl string) bool {
	// nats connection test
	nc, err := dialNatsUrl(natsUrl)
	ok := false
	if err != nil {
		config.Logger.Warn("nats connection test failed", "url", natsUrl, "err", err)
	} else {
		servers := nc.Servers()
		fmt.Println("nc servers", servers)
		ok = true
		nc.Close()
	}
	return ok
}

func dialNatsUrl(natsUrl string) (*nats.Conn, error) {
	if config.NatsUseNkeys {
		nkeySign := func(nonce []byte) ([]byte, error) {
			return config.NkeyPair.Sign(nonce)
		}
		return nats.Connect(natsUrl, nats.Nkey(config.NkeyPublic, nkeySign))
	} else {
		return nats.Connect(natsUrl)
	}
}

func SetJetstreamContext(j nats.JetStreamContext) {
	mu.Lock()
	jsc = j
	mu.Unlock()
}

func GetJetstreamContext() nats.JetStreamContext {
	mu.RLock()
	defer mu.RUnlock()
	return jsc
}
