package mediorum

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"strconv"
	"strings"
	"time"

	_ "embed"

	"github.com/AudiusProject/audius-protocol/pkg/core/common"
	"github.com/AudiusProject/audius-protocol/pkg/httputil"
	"github.com/AudiusProject/audius-protocol/pkg/mediorum/ethcontracts"
	"github.com/AudiusProject/audius-protocol/pkg/mediorum/server"
	"github.com/AudiusProject/audius-protocol/pkg/registrar"
	"golang.org/x/exp/slices"
	"golang.org/x/exp/slog"
	"golang.org/x/sync/errgroup"
)

//go:embed .version.json
var versionJSON []byte

func GetVersionJson() server.VersionJson {
	var versionJson server.VersionJson

	if err := json.Unmarshal(versionJSON, &versionJson); err != nil {
		log.Fatalf("unable to parse .version.json file: %v", err)
	}

	return versionJson
}

func init() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{AddSource: true}))
	slog.SetDefault(logger)
}

func Run(ctx context.Context, logger *common.Logger) error {
	mediorumEnv := os.Getenv("MEDIORUM_ENV")
	slog.Info("starting", "MEDIORUM_ENV", mediorumEnv)

	startMediorum(mediorumEnv)
	return nil
}

func startMediorum(mediorumEnv string) {
	logger := slog.With("creatorNodeEndpoint", os.Getenv("creatorNodeEndpoint"))

	isProd := mediorumEnv == "prod"
	isStage := mediorumEnv == "stage"
	isDev := mediorumEnv == "dev"

	var g registrar.PeerProvider
	if isProd {
		g = registrar.NewMultiProd()
	}
	if isStage {
		g = registrar.NewMultiStaging()
	}
	if isDev {
		g = registrar.NewMultiDev()
	}

	var peers, signers []server.Peer
	var err error

	eg := new(errgroup.Group)
	eg.Go(func() error {
		peers, err = g.Peers()
		if !isDev {
			return err
		}

		for {
			if len(peers) >= 3 {
				return nil
			}

			time.Sleep(3 * time.Second)

			peers, err = g.Peers()
			if err != nil {
				return err
			}
		}
	})
	eg.Go(func() error {
		signers, err = g.Signers()
		if !isDev {
			return err
		}

		for {
			if len(peers) >= 1 {
				return nil
			}

			time.Sleep(3 * time.Second)

			signers, err = g.Signers()
			if err != nil {
				return err
			}
		}
	})
	if err := eg.Wait(); err != nil {
		panic(err)
	}
	logger.Info("fetched registered nodes", "peers", len(peers), "signers", len(signers))

	creatorNodeEndpoint := mustGetenv("creatorNodeEndpoint")
	privateKeyHex := mustGetenv("delegatePrivateKey")

	privateKey, err := ethcontracts.ParsePrivateKeyHex(privateKeyHex)
	if err != nil {
		log.Fatal("invalid private key", err)
	}

	// compute wallet address
	walletAddress := ethcontracts.ComputeAddressFromPrivateKey(privateKey)
	delegateOwnerWallet := os.Getenv("delegateOwnerWallet")
	if !strings.EqualFold(walletAddress, delegateOwnerWallet) {
		slog.Warn("incorrect delegateOwnerWallet env config", "incorrect", delegateOwnerWallet, "computed", walletAddress)
	}

	trustedNotifierID, err := strconv.Atoi(getenvWithDefault("trustedNotifierID", "1"))
	if err != nil {
		logger.Warn("failed to parse trustedNotifierID", "err", err)
	}
	spID, err := ethcontracts.GetServiceProviderIdFromEndpoint(creatorNodeEndpoint, walletAddress)
	if err != nil || spID == 0 {
		go func() {
			for range time.Tick(10 * time.Second) {
				logger.Warn("failed to recover spID - please register at https://dashboard.audius.org and restart the server", "err", err)
			}
		}()
	}

	config := server.MediorumConfig{
		Self: server.Peer{
			Host:   httputil.RemoveTrailingSlash(strings.ToLower(creatorNodeEndpoint)),
			Wallet: strings.ToLower(walletAddress),
		},
		ListenPort:                "1991",
		Peers:                     peers,
		Signers:                   signers,
		ReplicationFactor:         4, // HashMigration: use R=2 (crc32) + R=2 (sha256)
		PrivateKey:                privateKeyHex,
		Dir:                       "/tmp/mediorum",
		PostgresDSN:               getenvWithDefault("dbUrl", "postgres://postgres:postgres@db:5432/audius_creator_node"),
		BlobStoreDSN:              os.Getenv("AUDIUS_STORAGE_DRIVER_URL"),
		MoveFromBlobStoreDSN:      os.Getenv("AUDIUS_STORAGE_DRIVER_URL_MOVE_FROM"),
		TrustedNotifierID:         trustedNotifierID,
		SPID:                      spID,
		SPOwnerWallet:             os.Getenv("spOwnerWallet"),
		GitSHA:                    os.Getenv("GIT_SHA"),
		AudiusDockerCompose:       os.Getenv("AUDIUS_DOCKER_COMPOSE_GIT_SHA"),
		AutoUpgradeEnabled:        os.Getenv("autoUpgradeEnabled") == "true",
		StoreAll:                  os.Getenv("STORE_ALL") == "true",
		VersionJson:               GetVersionJson(),
		DiscoveryListensEndpoints: discoveryListensEndpoints(),
		CoreGRPCEndpoint:          getenvWithDefault("coreGRPCEndpoint", "audiusd:50051"),
	}

	ss, err := server.New(config)
	if err != nil {
		logger.Error("failed to create server", "err", err)
		log.Fatal(err)
	}

	go refreshPeersAndSigners(ss, g)

	ss.MustStart()
}

func mustGetenv(key string) string {
	val := os.Getenv(key)
	if val == "" {
		log.Println("missing required env variable: ", key, " sleeping ...")
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

// fetch registered nodes from chain / The Graph every 30 minutes and restart if they've changed
func refreshPeersAndSigners(ss *server.MediorumServer, g registrar.PeerProvider) {
	logger := slog.With("creatorNodeEndpoint", os.Getenv("creatorNodeEndpoint"))
	ticker := time.NewTicker(30 * time.Minute)
	for range ticker.C {
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
			logger.Error("failed to fetch registered nodes", "err", err)
			continue
		}

		var combined, configCombined []string

		for _, peer := range append(peers, signers...) {
			combined = append(combined, fmt.Sprintf("%s,%s", httputil.RemoveTrailingSlash(strings.ToLower(peer.Host)), strings.ToLower(peer.Wallet)))
		}

		for _, configPeer := range append(ss.Config.Peers, ss.Config.Signers...) {
			configCombined = append(configCombined, fmt.Sprintf("%s,%s", httputil.RemoveTrailingSlash(strings.ToLower(configPeer.Host)), strings.ToLower(configPeer.Wallet)))
		}

		slices.Sort(combined)
		slices.Sort(configCombined)
		if !slices.Equal(combined, configCombined) {
			logger.Info("peers or signers changed on chain. restarting...", "peers", len(peers), "signers", len(signers), "combined", combined, "configCombined", configCombined)
			os.Exit(0) // restarting from inside the app is too error-prone so we'll let docker compose autoheal handle it
		}
	}
}

func discoveryListensEndpoints() []string {
	endpoints := os.Getenv("discoveryListensEndpoints")
	if endpoints == "" {
		return []string{}
	}
	return strings.Split(endpoints, ",")
}
