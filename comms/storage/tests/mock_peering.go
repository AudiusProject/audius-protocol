package tests

import (
	"net/http"

	sharedConfig "comms.audius.co/shared/config"
	"comms.audius.co/shared/peering"
	"github.com/labstack/echo/v4"
	"github.com/nats-io/nats.go"
)

var (
	mockNodes  []sharedConfig.ServiceNode
	mockPeers  []peering.Info
	mockMyInfo *peering.Info
)

type MockPeering struct{}

func NewMockPeering(myInfo *peering.Info, nodes []sharedConfig.ServiceNode) {
	mockMyInfo = myInfo
	mockNodes = nodes
}

func (mp *MockPeering) AddNode(node sharedConfig.ServiceNode) {
	mockNodes = append(mockNodes, node)
}

func (mp *MockPeering) GetContentNodes() ([]sharedConfig.ServiceNode, error) {
	var cnodes []sharedConfig.ServiceNode

	for _, node := range mockNodes {
		if node.Type.ID == "content-node" {
			cnodes = append(cnodes, node)
		}
	}

	return cnodes, nil
}

func (mp *MockPeering) GetDiscoveryNodes() ([]sharedConfig.ServiceNode, error) {
	var dnodes []sharedConfig.ServiceNode

	for _, node := range mockNodes {
		if node.Type.ID == "discovery-node" {
			dnodes = append(dnodes, node)
		}
	}

	return dnodes, nil
}

func (mp *MockPeering) AllNodes() ([]sharedConfig.ServiceNode, error) {
	return mockNodes, nil
}

func (mp *MockPeering) DialJetstream(peerMap map[string]*peering.Info) (nats.JetStreamContext, error) {
	return nil, nil
}

func (mp *MockPeering) DialNats(peerMap map[string]*peering.Info) (*nats.Conn, error) {
	return nil, nil
}

func (mp *MockPeering) DialNatsUrl(natsUrl string) (*nats.Conn, error) {
	return nil, nil
}

func (mp *MockPeering) ExchangeEndpoint(c echo.Context) error {
	return nil
}

func (mp *MockPeering) ListPeers() []peering.Info {
	return mockPeers
}

func (mp *MockPeering) MyInfo() (*peering.Info, error) {
	return mockMyInfo, nil
}

func (mp *MockPeering) NatsConnectionTest(natsUrl string) bool {
	return true
}

func (mp *MockPeering) PollRegisteredNodes() error {
	return nil
}

func (mp *MockPeering) PostSignedJSON(endpoint string, obj interface{}) (*http.Response, error) {
	return nil, nil
}

func (mp *MockPeering) Solicit() map[string]*peering.Info {
	return nil
}
