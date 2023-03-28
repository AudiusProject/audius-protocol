package server

import (
	"fmt"
	"log"
	"os"
	"testing"
	"time"
)

var testNetwork []*MediorumServer

func setupTestNetwork(replicationFactor, serverCount int) []*MediorumServer {

	testBaseDir := "/tmp/mediorum_test"
	os.RemoveAll(testBaseDir)

	network := []Peer{}
	servers := []*MediorumServer{}

	for i := 1; i <= serverCount; i++ {
		network = append(network, Peer{
			Host:   fmt.Sprintf("http://127.0.0.1:%d", 1980+i),
			Wallet: fmt.Sprintf("0xWallet%d", i), // todo keypair stuff
		})
	}

	for _, peer := range network {
		peer := peer
		config := MediorumConfig{
			Self:              peer,
			Peers:             network,
			ReplicationFactor: replicationFactor,
			Dir:               fmt.Sprintf("/tmp/mediorum_test/%s", peer.Wallet),
		}
		server, err := New(config)
		if err != nil {
			panic(err)
		}
		servers = append(servers, server)

		go func() {
			server.MustStart()
		}()
	}

	// give each server time to startup
	time.Sleep(time.Millisecond * 300 * time.Duration(serverCount))
	log.Printf("started %d servers", serverCount)

	return servers

}

func TestMain(m *testing.M) {
	testNetwork = setupTestNetwork(5, 9)
	exitVal := m.Run()
	// todo: tear down testNetwork

	os.Exit(exitVal)
}
