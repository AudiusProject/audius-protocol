package main

import (
	"fmt"
	"log"
	"log/slog"
	"os"
	"peer_health/httputil"
	"peer_health/registrar"
	"slices"
	"strings"
	"time"

	"golang.org/x/sync/errgroup"
)

type Config struct {
	NodeType   string
	Env        string
	Self       registrar.Peer
	Peers      []registrar.Peer
	ListenPort string
	Dir        string
}

func main() {
	discoveryEnv := os.Getenv("audius_discprov_env")
	contentEnv := os.Getenv("MEDIORUM_ENV")
	if discoveryEnv == "" && contentEnv == "" {
		slog.Info("no envs set. sleeping forever...")
		// block forever so container doesn't restart constantly
		c := make(chan struct{})
		<-c
	}
	env := ""      // prod || stage
	nodeType := "" // content || discovery
	if discoveryEnv != "" {
		env = discoveryEnv
		nodeType = "discovery"
	} else {
		env = contentEnv
		nodeType = "content"
	}
	slog.Info("starting", "env", env)

	switch env {
	case "prod":
		startStagingOrProd(true, nodeType, env)
	case "stage":
		startStagingOrProd(false, nodeType, env)
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

func startStagingOrProd(isProd bool, nodeType, env string) {
	// must have either a CN or DN endpoint configured
	myEndpoint := ""
	if nodeType == "content" {
		myEndpoint = mustGetenv("creatorNodeEndpoint")
	} else if nodeType == "discovery" {
		myEndpoint = mustGetenv("audius_discprov_url")
	}
	logger := slog.With("endpoint", myEndpoint)

	// fetch peers
	g := registrar.NewMultiStaging()
	if isProd {
		g = registrar.NewMultiProd()
	}
	var peers []registrar.Peer
	var err error

	eg := new(errgroup.Group)
	eg.Go(func() error {
		peers, err = g.Peers(nodeType)
		return err
	})
	if err := eg.Wait(); err != nil {
		panic(err)
	}

	logger.Info("fetched registered nodes", "peers", len(peers), "nodeType", nodeType, "env", env)

	config := Config{
		Self: registrar.Peer{
			Host: httputil.RemoveTrailingSlash(strings.ToLower(myEndpoint)),
		},
		NodeType:   nodeType,
		Env:        env,
		Peers:      peers,
		ListenPort: "1996",
		Dir:        "/bolt",
	}

	ph, err := New(config)
	if err != nil {
		logger.Error("failed to init Uptime server", "err", err)
	}

	go refreshPeersAndSigners(ph, g, nodeType)

	ph.Start()
}

// fetch registered nodes from chain / The Graph every 30 minutes and restart if they've changed
func refreshPeersAndSigners(ph *Uptime, g registrar.PeerProvider, nodeType string) {
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
