package peering

import (
	"comms.audius.co/discovery/config"
	"github.com/nats-io/nats.go"
)

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
