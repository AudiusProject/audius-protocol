package main

import (
	"encoding/json"
	"fmt"
	"log"
	"mediorum/ethcontracts"
	"mediorum/httputil"
	"mediorum/registrar"
	"mediorum/server"
	"os"
	"strconv"
	"strings"
	"sync"
	"time"

	_ "embed"

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
	logger := slog.With("creatorNodeEndpoint", os.Getenv("creatorNodeEndpoint"))
	g := registrar.NewMultiStaging()
	if isProd {
		g = registrar.NewMultiProd()
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

	migrateQmCidIters, err := strconv.Atoi(getenvWithDefault("MIGRATE_QM_CID_ITERS", "0"))
	if err != nil {
		logger.Warn("failed to parse MIGRATE_QM_CID_ITERS; defaulting to 0", "err", err)
	}

	config := server.MediorumConfig{
		Self: server.Peer{
			Host:   httputil.RemoveTrailingSlash(strings.ToLower(creatorNodeEndpoint)),
			Wallet: strings.ToLower(walletAddress),
		},
		ListenPort:           "1991",
		Peers:                peers,
		Signers:              signers,
		ReplicationFactor:    5,
		PrivateKey:           privateKeyHex,
		Dir:                  "/tmp/mediorum",
		PostgresDSN:          os.Getenv("dbUrl"),
		BlobStoreDSN:         os.Getenv("AUDIUS_STORAGE_DRIVER_URL"),
		MoveFromBlobStoreDSN: os.Getenv("AUDIUS_STORAGE_DRIVER_URL_MOVE_FROM"),
		TrustedNotifierID:    trustedNotifierID,
		SPID:                 spID,
		SPOwnerWallet:        os.Getenv("spOwnerWallet"),
		GitSHA:               os.Getenv("GIT_SHA"),
		AudiusDockerCompose:  os.Getenv("AUDIUS_DOCKER_COMPOSE_GIT_SHA"),
		AutoUpgradeEnabled:   os.Getenv("autoUpgradeEnabled") == "true",
		StoreAll:             os.Getenv("STORE_ALL") == "true",
		VersionJson:          GetVersionJson(),
		MigrateQmCidIters:    migrateQmCidIters,
	}

	ss, err := server.New(config)
	if err != nil {
		logger.Error("failed to create server", "err", err)
		log.Fatal(err)
	}

	go refreshPeersAndSigners(ss, g)

	ss.MustStart()
}

func startDevInstance() {
	idx := "1"
	if v := os.Getenv("IDX"); v != "" {
		idx = v
	}
	spID, err := strconv.Atoi(idx)
	if err != nil {
		log.Fatalf("failed to parse spID: %v", err)
	}

	postgresDSN := fmt.Sprintf("postgres://postgres:example@localhost:5454/m%s", idx)
	if v := os.Getenv("dbUrl"); v != "" {
		postgresDSN = v
	}

	hostNameTemplate := getenvWithDefault("hostNameTemplate", "http://localhost:199%s")
	network := devNetwork(hostNameTemplate, 7)

	config := server.MediorumConfig{
		Self: server.Peer{
			Host:   fmt.Sprintf(hostNameTemplate, idx),
			Wallet: "0xWallet" + idx,
		},
		Peers:               network,
		ReplicationFactor:   3,
		Dir:                 fmt.Sprintf("/tmp/mediorum_dev_%s", idx),
		PostgresDSN:         postgresDSN,
		ListenPort:          "199" + idx,
		SPID:                spID,
		SPOwnerWallet:       "0xWallet" + idx,
		GitSHA:              os.Getenv("GIT_SHA"),
		AudiusDockerCompose: os.Getenv("AUDIUS_DOCKER_COMPOSE_GIT_SHA"),
		AutoUpgradeEnabled:  os.Getenv("autoUpgradeEnabled") == "true",
		VersionJson:         GetVersionJson(),
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
		spID, err := ethcontracts.GetServiceProviderIdFromEndpoint(peer.Host, peer.Wallet)
		if err != nil || spID == 0 {
			slog.Error(fmt.Sprintf("failed to recover spID for %s, %s (this is expected if running locally without eth-ganache)", peer.Host, peer.Wallet), "err", err)
			spID = idx + 1
		}
		config := server.MediorumConfig{
			Self:                peer,
			Peers:               network,
			Signers:             signers,
			ReplicationFactor:   3,
			Dir:                 fmt.Sprintf(dirTemplate, idx+1),
			PostgresDSN:         fmt.Sprintf(dbUrlTemplate, idx+1),
			ListenPort:          fmt.Sprintf("199%d", idx+1),
			SPID:                spID,
			SPOwnerWallet:       peer.Wallet,
			GitSHA:              os.Getenv("GIT_SHA"),
			AudiusDockerCompose: os.Getenv("AUDIUS_DOCKER_COMPOSE_GIT_SHA"),
			AutoUpgradeEnabled:  os.Getenv("autoUpgradeEnabled") == "true",
			VersionJson:         GetVersionJson(),
		}
		privKeyEnvVar := fmt.Sprintf("CN%d_SP_OWNER_PRIVATE_KEY", idx+1)
		if privateKey, found := os.LookupEnv(privKeyEnvVar); found {
			log.Printf("%s found, using it\n", privKeyEnvVar)
			config.PrivateKey = privateKey
		} else {
			log.Printf("%s not found, using hardcoded key\n", privKeyEnvVar)
			switch privKeyEnvVar {
			case "CN1_SP_OWNER_PRIVATE_KEY":
				config.PrivateKey = "21118f9a6de181061a2abd549511105adb4877cf9026f271092e6813b7cf58ab"
			case "CN2_SP_OWNER_PRIVATE_KEY":
				config.PrivateKey = "1166189cdf129cdcb011f2ad0e5be24f967f7b7026d162d7c36073b12020b61c"
			case "CN3_SP_OWNER_PRIVATE_KEY":
				config.PrivateKey = "1aa14c63d481dcc1185a654eb52c9c0749d07ac8f30ef17d45c3c391d9bf68eb"
			case "CN4_SP_OWNER_PRIVATE_KEY":
				config.PrivateKey = "4a23fe455a34bb47f8f3282a4f6d36c22987275f0bb9aacb251568df7d038385"
			case "CN5_SP_OWNER_PRIVATE_KEY":
				config.PrivateKey = "2450bb2893d0bddf92f4ac88cb65a8e94b56e89f7ec3e46c9c88b2b46ebe3ca5"
			default:
				log.Printf("CN%d_SP_OWNER_PRIVATE_KEY not found, and no hardcoded option available\n", idx+1)
			}
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
		addressEnvVar := fmt.Sprintf("CN%d_SP_OWNER_ADDRESS", i)
		defaultAddress := ""
		switch addressEnvVar {
		case "CN1_SP_OWNER_ADDRESS":
			defaultAddress = "0x0D38e653eC28bdea5A2296fD5940aaB2D0B8875c"
		case "CN2_SP_OWNER_ADDRESS":
			defaultAddress = "0x1B569e8f1246907518Ff3386D523dcF373e769B6"
		case "CN3_SP_OWNER_ADDRESS":
			defaultAddress = "0xCBB025e7933FADfc7C830AE520Fb2FD6D28c1065"
		case "CN4_SP_OWNER_ADDRESS":
			defaultAddress = "0xdDEEA4839bBeD92BDAD8Ec79AE4f4Bc2Be1A3974"
		case "CN5_SP_OWNER_ADDRESS":
			defaultAddress = "0xBC2cf859f671B78BA42EBB65Deb31Cc7fEc07019"
		default:
			defaultAddress = fmt.Sprintf("0xWallet%d", i)
			fmt.Printf("Invalid address variable, using %s\n", defaultAddress)
		}
		network = append(network, server.Peer{
			Host:   fmt.Sprintf(hostNameTemplate, i),
			Wallet: getenvWithDefault(addressEnvVar, defaultAddress),
		})
	}
	return network
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
