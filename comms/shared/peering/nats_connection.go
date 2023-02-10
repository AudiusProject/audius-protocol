package peering

import (
	"fmt"
	"strings"

	"comms.audius.co/discovery/config"
	"github.com/nats-io/nats.go"
)

func DialJetstream(peerMap map[string]*Info) (nats.JetStreamContext, error) {
	natsUrl := config.GetEnvDefault("NATS_SERVER_URL", nats.DefaultURL)

	if len(peerMap) != 0 {
		goodNatsUrls := []string{}
		for _, peer := range peerMap {
			if peer.NatsIsReachable {
				u := fmt.Sprintf("nats://%s:4222", peer.IP)
				goodNatsUrls = append(goodNatsUrls, u)
			}
		}
		natsUrl = strings.Join(goodNatsUrls, ",")
		config.Logger.Info("nats client url: " + natsUrl)
	}

	nc, err := DialNatsUrl(natsUrl)
	if err != nil {
		return nil, fmt.Errorf("failed to dial natsUrl %q: %v", natsUrl, err)
	}
	j, err := nc.JetStream()
	if err != nil {
		return nil, fmt.Errorf("failed to open jetstream connection: %v", err)
	}
	return j, nil
}

func NatsConnectionTest(natsUrl string) bool {
	// nats connection test
	nc, err := DialNatsUrl(natsUrl)
	ok := false
	if err != nil {
		config.Logger.Warn("nats connection test failed", "url", natsUrl, "err", err)
	} else {
		// servers := nc.Servers()
		// fmt.Println("nc servers", servers)
		ok = true
		nc.Close()
	}
	return ok
}

func DialNatsUrl(natsUrl string) (*nats.Conn, error) {
	if config.NatsUseNkeys {
		nkeySign := func(nonce []byte) ([]byte, error) {
			return config.NkeyPair.Sign(nonce)
		}
		return nats.Connect(natsUrl, nats.Nkey(config.NkeyPublic, nkeySign))
	} else {
		return nats.Connect(natsUrl)
	}
}
