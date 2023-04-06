package main

import (
	"fmt"
	"log"
	"mediorum/registrar"
	"mediorum/server"
	"os"
	"sync"
)

func main() {
	preset := os.Getenv("MEDIORUM_ENV")

	switch preset {
	case "prod":
		startStagingOrProd(true)
	case "stage":
		startStagingOrProd(false)
	case "single":
		startDevInstance()
	default:
		startDevCluster()
	}
}

func startStagingOrProd(isProd bool) {
	g := registrar.NewGraphStaging()
	if isProd {
		g = registrar.NewGraphProd()
	}
	peers, err := g.Peers()
	if err != nil {
		panic(err)
	}

	creatorNodeEndpoint := mustGetenv("creatorNodeEndpoint")
	delegateOwnerWallet := mustGetenv("delegateOwnerWallet")
	privateKey := mustGetenv("delegatePrivateKey")

	config := server.MediorumConfig{
		Self: server.Peer{
			Host:   creatorNodeEndpoint,
			Wallet: delegateOwnerWallet,
		},
		ListenPort:        "1991",
		Peers:             peers,
		ReplicationFactor: 3,
		PrivateKey:        privateKey,
		Dir:               "/tmp/mediorum",
		PostgresDSN:       os.Getenv("dbUrl"),
		LegacyFSRoot:      getenvWithDefault("storagePath", "/file_storage"),
	}

	ss, err := server.New(config)
	if err != nil {
		log.Fatal(err)
	}

	ss.MustStart()
}

func mustGetenv(key string) string {
	val := os.Getenv(key)
	if val == "" {
		log.Fatal("missing required env variable: ", key)
	}
	return val
}

func getenvWithDefault(key string, fallback string) string {
	val := os.Getenv(key)
	if val == "" {
		return fallback
	}
	return val
}

func startDevInstance() {
	// synthetic network
	network := devNetwork(7)

	idx := os.Getenv("IDX")
	if idx == "" {
		log.Fatal("IDX env var required")
	}

	config := server.MediorumConfig{
		Self: server.Peer{
			Host:   "http://localhost:199" + idx,
			Wallet: "0xPort" + idx,
		},
		Peers:             network,
		ReplicationFactor: 3,
		Dir:               fmt.Sprintf("/tmp/mediorum_dev_%s", idx),
		PostgresDSN:       fmt.Sprintf("postgres://postgres:example@localhost:5444/m%s", idx),
	}

	ss, err := server.New(config)
	if err != nil {
		log.Fatal(err)
	}

	ss.MustStart()
}

func startDevCluster() {
	network := devNetwork(5)
	wg := sync.WaitGroup{}

	for idx, peer := range network {
		peer := peer
		config := server.MediorumConfig{
			Self:              peer,
			Peers:             network,
			ReplicationFactor: 3,
			Dir:               fmt.Sprintf("/tmp/mediorum_%s", peer.Wallet),
			PostgresDSN:       fmt.Sprintf("postgres://postgres:example@localhost:5444/m%d", idx+1),
		}

		wg.Add(1)
		go func() {
			ss, err := server.New(config)
			if err != nil {
				log.Fatal(err)
			}

			ss.MustStart()
			wg.Done()
		}()
	}

	wg.Wait()
}

func devNetwork(n int) []server.Peer {
	network := []server.Peer{}
	for i := 1; i <= n; i++ {
		network = append(network, server.Peer{
			Host:   fmt.Sprintf("http://localhost:199%d", i),
			Wallet: fmt.Sprintf("0xWallet%d", i), // todo keypair stuff
		})
	}
	return network
}
