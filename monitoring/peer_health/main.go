package main

import (
	"fmt"
	"log"
	"os"
	"peer_health/ethcontracts"
	"peer_health/httputil"
	"peer_health/registrar"
	"strings"
	"time"

	"golang.org/x/exp/slices"
	"golang.org/x/exp/slog"
	"golang.org/x/sync/errgroup"
)

type Config struct {
	NodeType             string
	Env                  string
	Self                 registrar.Peer
	Peers                []registrar.Peer
	DiscoveryPostgresDSN string `json:"-"`
	ContentPostgresDSN   string `json:"-"`
	RedisDSN             string `json:"-"`
}

func main() {
	env := os.Getenv("ENV")
	slog.Info("starting", "ENV", env)

	switch env {
	case "prod":
		startStagingOrProd(true)
	case "stage":
		startStagingOrProd(false)
	case "single":
		slog.Info("no need to monitor peers when running a single node. sleeping forever...")
		// block forever so container doesn't restart constantly
		c := make(chan struct{})
		<-c
	default:
		// TODO
		// startDevCluster()
		c := make(chan struct{})
		<-c
	}
}

func startStagingOrProd(isProd bool) {
	nodeType := getenvWithDefault("NODE_TYPE", "all") // content || discovery || all
	env := mustGetenv("ENV")                          // prod || stage || dev

	// must have either a CN or DN endpoint configured
	myEndpoint := os.Getenv("creatorNodeEndpoint")
	if myEndpoint == "" {
		myEndpoint = mustGetenv("audius_discprov_url")
	}
	logger := slog.With("endpoint", myEndpoint)

	// must have either a CN or DN private key configured
	privateKeyHex := os.Getenv("delegatePrivateKey")
	if privateKeyHex == "" {
		privateKeyHex = mustGetenv("audius_delegate_private_key")
	}
	privateKey, err := ethcontracts.ParsePrivateKeyHex(privateKeyHex)
	if err != nil {
		log.Fatal("invalid private key", err)
	}
	// compute wallet address
	walletAddress := ethcontracts.ComputeAddressFromPrivateKey(privateKey)

	// fetch peers
	g := registrar.NewMultiStaging()
	if isProd {
		g = registrar.NewMultiProd()
	}
	var peers []registrar.Peer

	eg := new(errgroup.Group)
	eg.Go(func() error {
		peers, err = g.Peers(nodeType)
		return err
	})
	if err := eg.Wait(); err != nil {
		panic(err)
	}

	logger.Info("fetched registered nodes", "peers", len(peers), "nodeType", nodeType, "env", env)

	redisDSN := os.Getenv("audius_redis_url")
	if redisDSN == "" {
		if redisHost, redisPort := os.Getenv("redisHost"), os.Getenv("redisPort"); redisHost != "" && redisPort != "" {
			redisDSN = fmt.Sprintf("redis://%s:%s/00", redisHost, redisPort)
		}
	}

	config := Config{
		Self: registrar.Peer{
			Host:   httputil.RemoveTrailingSlash(strings.ToLower(myEndpoint)),
			Wallet: strings.ToLower(walletAddress),
		},
		NodeType:             nodeType,
		Env:                  env,
		Peers:                peers,
		DiscoveryPostgresDSN: os.Getenv("audius_db_url"),
		ContentPostgresDSN:   os.Getenv("dbUrl"),
		RedisDSN:             redisDSN,
	}

	ph, err := New(config)
	if err != nil {
		logger.Error("failed to init PeerHealths", "err", err)
	}

	go refreshPeersAndSigners(ph, g, nodeType)

	ph.Start()
}

// fetch registered nodes from chain / The Graph every 30 minutes and restart if they've changed
func refreshPeersAndSigners(ph *PeerHealths, g registrar.PeerProvider, nodeType string) {
	ticker := time.NewTicker(30 * time.Minute)
	for range ticker.C {
		var peers []registrar.Peer
		var err error

		eg := new(errgroup.Group)
		eg.Go(func() error {
			peers, err = g.Peers(nodeType)
			return err
		})
		if err := eg.Wait(); err != nil {
			slog.Error("failed to fetch registered nodes", "err", err)
			continue
		}

		var combined, configCombined []string

		for _, peer := range peers {
			combined = append(combined, fmt.Sprintf("%s,%s", httputil.RemoveTrailingSlash(strings.ToLower(peer.Host)), strings.ToLower(peer.Wallet)))
		}

		for _, configPeer := range ph.Config.Peers {
			configCombined = append(configCombined, fmt.Sprintf("%s,%s", httputil.RemoveTrailingSlash(strings.ToLower(configPeer.Host)), strings.ToLower(configPeer.Wallet)))
		}

		slices.Sort(combined)
		slices.Sort(configCombined)
		if !slices.Equal(combined, configCombined) {
			slog.Info("peers changed on chain. restarting...", "peers", len(peers), "combined", combined, "configCombined", configCombined)
			os.Exit(0) // restarting from inside the app is too error-prone so we'll let docker compose autoheal handle it
		}
	}
}

func mustGetenv(key string) string {
	val := os.Getenv(key)
	if val == "" {
		slog.Info(fmt.Sprintf("missing required env variable: %s. sleeping...", key))
		// if config is incorrect, sleep a bit to prevent container from restarting constantly
		time.Sleep(time.Hour)
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
