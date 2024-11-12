package server

import (
	"errors"
	"os"

	"github.com/AudiusProject/audius-protocol/pkg/core/common"
	"github.com/AudiusProject/audius-protocol/pkg/serviceproxy"
)

var (
	prodServicers  = []string{"https://creatornode.audius.co", "https://creatornode2.audius.co", "https://creatornode3.audius.co"}
	stageServicers = []string{"https://creatornode5.staging.audius.co", "https://creatornode6.staging.audius.co", "https://creatornode7.staging.audius.co"}
	devServicers   = []string{"http://audius-protocol-creator-node-1"}
)

func (ss *MediorumServer) initServiceProxy() error {
	env := ss.Config.Env
	host := ss.Config.Self.Host
	var servicers []string

	// determine correct servicers based on env
	switch env {
	case "dev", "local":
		servicers = devServicers
	case "stage", "staging":
		servicers = stageServicers
	case "prod", "production":
		servicers = prodServicers
	default:
		return errors.New("env not valid")
	}

	// figure out if this node should be providing services or proxying
	iAmServicer := false
	for _, url := range servicers {
		if url == host {
			iAmServicer = true
			break
		}
	}

	// modify endpoints to the right route
	for i, servicer := range servicers {
		servicers[i] = servicer + "/internal/ip_data"
	}

	ipDataApiKey := os.Getenv("ipDataApiKey")
	useMockData := env == "dev"

	logger := common.NewLogger(nil)

	if iAmServicer {
		registeredNodes := make(map[string]struct{})

		for _, peer := range ss.Config.Peers {
			registeredNodes[peer.Wallet] = struct{}{}
		}

		directProxy := serviceproxy.NewDirectProxy(logger, ipDataApiKey, useMockData)
		serviceRoutes := serviceproxy.NewProxyRoutes(registeredNodes, directProxy)

		ss.serviceProxy = directProxy
		ss.serviceProxyRoutes = serviceRoutes
		return nil
	}

	ss.serviceProxy = serviceproxy.NewRemoteProxy(logger, ss.Config.privateKey, servicers, 10)
	return nil
}
