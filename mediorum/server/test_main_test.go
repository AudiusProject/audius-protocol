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

	dbUrlTemplate := os.Getenv("dbUrlTemplate")
	if dbUrlTemplate == "" {
		dbUrlTemplate = "postgres://postgres:example@localhost:5454/m%d"
	}

	for i := 1; i <= serverCount; i++ {
		network = append(network, Peer{
			Host:   fmt.Sprintf("http://127.0.0.1:%d", 1980+i),
			Wallet: fmt.Sprintf("0xWallet%d", i), // todo keypair stuff
		})
	}

	for idx, peer := range network {
		peer := peer
		config := MediorumConfig{
			Env:               "test",
			Self:              peer,
			Peers:             network,
			ReplicationFactor: replicationFactor,
			Dir:               fmt.Sprintf("%s/%s", testBaseDir, peer.Wallet),
			PostgresDSN:       fmt.Sprintf(dbUrlTemplate, idx+1),
			VersionJson: VersionJson{
				Version: "0.0.0",
				Service: "content-node",
			},
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

	// give each server time to startup + health check
	time.Sleep(time.Second)
	log.Printf("started %d servers", serverCount)

	return servers

}

func TestMain(m *testing.M) {
	testNetwork = setupTestNetwork(5, 5)

	exitVal := m.Run()
	// todo: tear down testNetwork

	os.Exit(exitVal)
}
