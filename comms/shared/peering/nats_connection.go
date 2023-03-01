package peering

import (
	"fmt"
	"os"
	"strings"

	"github.com/nats-io/nats.go"
	"golang.org/x/exp/slog"
)

func (p *NatsPeering) DialNats(peerMap map[string]*Info) (*nats.Conn, error) {
	natsUrl := os.Getenv("NATS_SERVER_URL")
	if len(natsUrl) == 0 {
		natsUrl = nats.DefaultURL
	}

	if len(peerMap) != 0 {
		goodNatsUrls := []string{}
		if p.NatsConnectionTest(natsUrl) {
			goodNatsUrls = append(goodNatsUrls, natsUrl)
		}
		for _, peer := range peerMap {
			if peer.NatsIsReachable && peer.NatsClusterName == p.Config.NatsClusterName {
				u := fmt.Sprintf("nats://%s:4222", peer.IP)
				goodNatsUrls = append(goodNatsUrls, u)
			}
		}
		natsUrl = strings.Join(goodNatsUrls, ",")
		slog.Info("nats client url: " + natsUrl)
	}

	nc, err := p.DialNatsUrl(natsUrl)
	if err != nil {
		return nil, fmt.Errorf("failed to dial natsUrl %q: %v", natsUrl, err)
	}
	return nc, nil
}

func (p *NatsPeering) DialJetstream(peerMap map[string]*Info) (nats.JetStreamContext, error) {
	nc, err := p.DialNats(peerMap)
	if err != nil {
		return nil, err
	}
	j, err := nc.JetStream()
	if err != nil {
		return nil, fmt.Errorf("failed to open jetstream connection: %v", err)
	}
	return j, nil
}

func (p *NatsPeering) NatsConnectionTest(natsUrl string) bool {
	// nats connection test
	nc, err := p.DialNatsUrl(natsUrl)
	ok := false
	if err != nil {
		slog.With("url", natsUrl).Error("nats connection test failed", err)
	} else {
		// servers := nc.Servers()
		// fmt.Println("nc servers", servers)
		ok = true
		nc.Close()
	}
	return ok
}

func (p *NatsPeering) DialNatsUrl(natsUrl string) (*nats.Conn, error) {
	nkeySign := func(nonce []byte) ([]byte, error) {
		return p.Config.Keys.NkeyPair.Sign(nonce)
	}
	return nats.Connect(natsUrl, nats.Nkey(p.Config.Keys.NkeyPublic, nkeySign))
}
