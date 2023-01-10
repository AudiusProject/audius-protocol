package peering

import (
	"fmt"
	"strings"

	"comms.audius.co/config"
)

type Info struct {
	Address   string
	Nkey      string
	IP        string
	NatsRoute string
	// todo: public key for shared secret stuff?
}

func MyInfo() (*Info, error) {
	info := &Info{
		Address:   config.WalletAddress,
		Nkey:      config.NkeyPublic,
		IP:        config.IP,
		NatsRoute: fmt.Sprintf("nats://%s:%s@%s:6222", config.NatsClusterUsername, config.NatsClusterPassword, config.IP),
	}
	return info, nil
}

func WalletEquals(a, b string) bool {
	return strings.ToLower(a) == strings.ToLower(b)
}
