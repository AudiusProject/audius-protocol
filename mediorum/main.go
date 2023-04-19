package main

import (
	"fmt"
	"log"
	"mediorum/registrar"
	"mediorum/server"
	"os"
	"strings"
	"sync"
	"time"
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
		UpstreamCN:        getenvWithDefault("upstreamCreatorNode", "http://server:4000"),
	}

	ss, err := server.New(config)
	if err != nil {
		log.Fatal(err)
	}

	// for prod: gradual rollout to a subset of hosts
	if isProd {
		hostSubset := []string{"audius.co", "cultur3stake.com"}
		shouldStart := false
		for _, tld := range hostSubset {
			if strings.Contains(config.Self.Host, tld) {
				shouldStart = true
			}
		}
		if !shouldStart {
			log.Println("shouldStart = false... sleeping")
			time.Sleep(time.Hour * 10000)
			log.Fatal("bye")
		}
	}

	ss.MustStart()
}

func startDevInstance() {
	idx := "1"
	if v := os.Getenv("IDX"); v != "" {
		idx = v
	}

	postgresDSN := fmt.Sprintf("postgres://postgres:example@localhost:5454/m%s", idx)
	if v := os.Getenv("dbUrl"); v != "" {
		postgresDSN = v
	}

	hostNameTemplate := getenvWithDefault("hostNameTemplate", "http://localhost:199%d")
	network := devNetwork(hostNameTemplate, 7)

	config := server.MediorumConfig{
		Self: server.Peer{
			Host:   fmt.Sprintf(hostNameTemplate, idx),
			Wallet: "0xWallet" + idx,
		},
		Peers:             network,
		ReplicationFactor: 3,
		Dir:               fmt.Sprintf("/tmp/mediorum_dev_%s", idx),
		PostgresDSN:       postgresDSN,
		ListenPort:        "199" + idx,
	}

	ss, err := server.New(config)
	if err != nil {
		log.Fatal(err)
	}

	ss.MustStart()
}

func startDevCluster() {

	dirTemplate := getenvWithDefault("dirTemplate", "/tmp/mediorum_dev_%d")
	dbUrlTemplate := getenvWithDefault("dbUrlTemplate", "postgres://postgres:example@localhost:5454/m%d")
	hostNameTemplate := getenvWithDefault("hostNameTemplate", "http://localhost:199%d")
	upstreamCNTemplate := getenvWithDefault("upstreamCNTemplate", "http://audius-protocol-creator-node-container-%d:4000")

	network := devNetwork(hostNameTemplate, 3)
	wg := sync.WaitGroup{}

	for idx, peer := range network {
		peer := peer
		config := server.MediorumConfig{
			Self:              peer,
			Peers:             network,
			ReplicationFactor: 3,
			Dir:               fmt.Sprintf(dirTemplate, idx+1),
			PostgresDSN:       fmt.Sprintf(dbUrlTemplate, idx+1),
			ListenPort:        fmt.Sprintf("199%d", idx+1),
			UpstreamCN:        fmt.Sprintf(upstreamCNTemplate, idx+1),
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

func devNetwork(hostNameTemplate string, n int) []server.Peer {
	network := []server.Peer{}
	for i := 1; i <= n; i++ {
		network = append(network, server.Peer{
			Host:   fmt.Sprintf(hostNameTemplate, i),
			Wallet: fmt.Sprintf("0xWallet%d", i), // todo keypair stuff
		})
	}
	return network
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
