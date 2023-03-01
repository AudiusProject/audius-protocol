package tests

import (
	"net/http"

	sharedConfig "comms.audius.co/shared/config"
	"comms.audius.co/shared/peering"
	"github.com/labstack/echo/v4"
	"github.com/nats-io/nats.go"
)

var dnodes []sharedConfig.ServiceNode

type MockPeering struct{}

func (mp *MockPeering) AllNodes() ([]sharedConfig.ServiceNode, error) {
	return nil, nil
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
func (mp *MockPeering) GetContentNodes() ([]sharedConfig.ServiceNode, error) {
	return nil, nil
}
func (mp *MockPeering) GetDiscoveryNodes() ([]sharedConfig.ServiceNode, error) {
	return dnodes, nil
}
func (mp *MockPeering) ListPeers() []peering.Info {
	return nil
}
func (mp *MockPeering) MyInfo() (*peering.Info, error) {
	return nil, nil
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