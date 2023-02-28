package peering

import (
	"fmt"
	"strings"
	"time"
)

type Info struct {
	Host string
	SPID string

	Address         string
	Nkey            string
	IP              string
	NatsClusterName string
	NatsRoute       string
	// todo: public key for shared secret stuff?

	IsSelf          bool
	NatsIsReachable bool
	AsOf            time.Time
}

func (p *Peering) MyInfo() (*Info, error) {
	info := &Info{
		Address:         p.Config.Keys.DelegatePublicKey,
		Nkey:            p.Config.Keys.NkeyPublic,
		IP:              p.IP,
		NatsClusterName: p.Config.NatsClusterName,
		NatsRoute:       fmt.Sprintf("nats://%s:%s@%s:6222", p.NatsClusterUsername, p.NatsClusterPassword, p.IP),
		NatsIsReachable: p.NatsIsReachable,
	}
	return info, nil
}

func WalletEquals(a, b string) bool {
	return strings.EqualFold(a, b)
}
