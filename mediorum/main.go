package main

import (
	"fmt"
	"log"
	"mediorum/registrar"
	"mediorum/server"
	"os"
	"strconv"
	"sync"

	"golang.org/x/exp/slog"
	"golang.org/x/sync/errgroup"
)

func init() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout))
	slog.SetDefault(logger)
}

func main() {
	mediorumEnv := os.Getenv("MEDIORUM_ENV")
	slog.Info("starting", "MEDIORUM_ENV", mediorumEnv)

	switch mediorumEnv {
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

	var peers, signers []server.Peer
	var err error

	eg := new(errgroup.Group)
	eg.Go(func() error {
		peers, err = g.Peers()
		return err
	})
	eg.Go(func() error {
		signers, err = g.Signers()
		return err
	})
	if err := eg.Wait(); err != nil {
		panic(err)
	}
	slog.Info("fetched registered nodes", "peers", len(peers), "signers", len(signers))

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
		Signers:           signers,
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
	devNetworkCount, _ := strconv.Atoi(getenvWithDefault("devNetworkCount", "3"))

	network := devNetwork(hostNameTemplate, devNetworkCount)
	signers := []server.Peer{
		{
			Host:   "audius-protocol-discovery-provider-1",
			Wallet: "0x73EB6d82CFB20bA669e9c178b718d770C49BB52f",
		},
		{
			Host:   "audius-protocol-discovery-provider-2",
			Wallet: "0x9D8E5fAc117b15DaCED7C326Ae009dFE857621f1",
		},
		{
			Host:   "audius-protocol-discovery-provider-3",
			Wallet: "0x982a8CbE734cb8c29A6a7E02a3B0e4512148F6F9",
		},
	}

	wg := sync.WaitGroup{}

	for idx, peer := range network {
		peer := peer
		config := server.MediorumConfig{
			Self:              peer,
			Peers:             network,
			Signers:           signers,
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
