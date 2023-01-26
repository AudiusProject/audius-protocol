package jetstream

import (
	"fmt"
	"strings"
	"sync"

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
			ok := peering.NatsConnectionTest(u)
			if ok {
				goodNatsUrls = append(goodNatsUrls, u)
			}
		}
		natsUrl = strings.Join(goodNatsUrls, ",")
	}

	nc, err := peering.DialNatsUrl(natsUrl)
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
