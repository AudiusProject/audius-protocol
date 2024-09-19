package peerdiscovery

import (
	"context"
	"errors"
	"fmt"
	"math/big"
	"net"
	"sort"
	"strings"

	"github.com/AudiusProject/audius-protocol/core/contracts"
	"github.com/cometbft/cometbft/p2p"
	"github.com/cometbft/cometbft/rpc/client/http"
	"golang.org/x/sync/errgroup"
)

var (
	zero = big.NewInt(0)
	one  = big.NewInt(1)
)

func (pd *PeerDiscovery) discoverPeers() error {
	contentEndpoints, err := pd.getContentEndpoints()
	if err != nil {
		return err
	}

	discoveryEndpoints, err := pd.getDiscoveryEndpoints()
	if err != nil {
		return err
	}

	// merge endpoints so modulo is predictable
	endpoints := append(contentEndpoints, discoveryEndpoints...)

	err = pd.determinePeers(endpoints)
	if err != nil {
		return fmt.Errorf("could not determine peers: %v", err)
	}

	return nil
}

func (pd *PeerDiscovery) getEndpoints(serviceType [32]byte) ([]string, error) {
	c := pd.contracts
	endpoints := []string{}

	spf, err := c.GetServiceProviderFactoryContract()
	if err != nil {
		return []string{}, fmt.Errorf("could not get spf contract: %v", err)
	}

	total, err := spf.GetTotalServiceTypeProviders(nil, serviceType)
	if err != nil {
		return []string{}, fmt.Errorf("could not get total service types: %v", err)
	}

	if total.Cmp(zero) == 0 {
		pd.logger.Info("no registered nodes, trying later")
		return []string{}, nil
	}

	// iterate over bigint
	for i := new(big.Int).Set(one); i.Cmp(total) <= 0; i.Add(i, one) {
		info, err := spf.GetServiceEndpointInfo(nil, serviceType, i)
		if err != nil {
			return []string{}, fmt.Errorf("error getting service endpoint: %v", err)
		}
		endpoints = append(endpoints, info.Endpoint)
	}

	return endpoints, nil
}

func (pd *PeerDiscovery) getContentEndpoints() ([]string, error) {
	return pd.getEndpoints(contracts.ContentNode)
}

func (pd *PeerDiscovery) getDiscoveryEndpoints() ([]string, error) {
	return pd.getEndpoints(contracts.DiscoveryNode)
}

func (pd *PeerDiscovery) determinePeers(endpoints []string) error {
	sort.Strings(endpoints)

	self := pd.config.NodeEndpoint
	peerCount := pd.config.PeerCount
	peers := []string{}

	pd.logger.Info("endpoints", endpoints)

	selfIndex := -1
	for i, node := range endpoints {
		pd.logger.Infof("comparing %s with %s", self, node)
		if self == node {
			selfIndex = i
			break
		}
	}

	if selfIndex == -1 {
		return fmt.Errorf("node %s not found in endpoints", self)
	}

	for j := 1; j <= peerCount; j++ {
		peerIndex := (selfIndex + j) % len(endpoints)
		peers = append(peers, endpoints[peerIndex])
	}

	pd.expectedPeers = peers
	return nil
}

func (pd *PeerDiscovery) connectToPeers() error {
	if len(pd.expectedPeers) == 0 {
		pd.logger.Info("no peers to connect to")
		return nil
	}

	g, ctx := errgroup.WithContext(context.Background())

	existingPeers := map[p2p.ID]struct{}{}
	netInfo, err := pd.rpc.NetInfo(ctx)
	if err != nil {
		return fmt.Errorf("could not get net_info of self: %v", err)
	}
	for _, peer := range netInfo.Peers {
		existingPeers[peer.NodeInfo.ID()] = struct{}{}
	}

	for _, peer := range pd.expectedPeers {
		g.Go(func() error {
			peerRpc, err := http.New(fmt.Sprintf("%s/core/comet", peer))
			if err != nil {
				return fmt.Errorf("could not create new rpc client: %v", err)
			}

			status, err := peerRpc.Status(ctx)
			if err != nil {
				return fmt.Errorf("could not get peer status: %v", err)
			}

			nodeID := status.NodeInfo.ID()
			_, nodeAlreadyPeered := existingPeers[nodeID]
			if nodeAlreadyPeered {
				return nil
			}

			ipCheckUrl := strings.TrimPrefix(peer, "http://")
			ipCheckUrl = strings.TrimPrefix(ipCheckUrl, "https://")
			ips, err := net.LookupIP(ipCheckUrl)
			if err != nil {
				return fmt.Errorf("could not get node ip: %v", err)
			}

			if len(ips) == 0 {
				return errors.New("no ips found for host")
			}

			p2pUrl := status.NodeInfo.ListenAddr
			p2pUrl = strings.TrimPrefix(p2pUrl, "tcp://")

			_, port, err := net.SplitHostPort(p2pUrl)
			if err != nil {
				return fmt.Errorf("could not extract port: %v", err)
			}

			ip := ips[0]

			peerConnStr := fmt.Sprintf("%s@%s:%s", nodeID, ip, port)
			addr, err := p2p.NewNetAddressString(peerConnStr)
			if err != nil {
				return fmt.Errorf("could not form comet address: %v", err)
			}

			if err := pd.p2pSwitch.DialPeerWithAddress(addr); err != nil {
				return fmt.Errorf("could not dial peer: %v", err)
			}

			pd.logger.Infof("successfully peered with %s", peer)
			return nil
		})
	}

	if err := g.Wait(); err != nil {
		return err
	}

	return nil
}
