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
	Self       registrar.Peer
	Peers      []registrar.Peer
	ListenPort string
	Dir        string

	Env       string
	NodeType  string
	AudiusUrl string

	EthNetworkId       string
	EthTokenAddress    string
	EthRegistryAddress string
	EthProviderUrl     string
	EthOwnerWallet     string

	QueryProposalStartBlock string
	GqlUri                  string
	GqlBackupUri            string

	EntityManagerAddress string

	IdentityServiceEndpoint string

	WormholeContractAddress          string
	ClaimDistributionContractAddress string
	SolanaClusterEndpoint            string
	WAudioMintAddress                string
	UsdcMintAddress                  string
	SolanaTokenProgramAddress        string
	ClaimableTokenPda                string
	SolanaFeePayerAddress            string
	ClaimableTokenProgramAddress     string
	PaymentRouterProgramAddress      string
	RewardsManagerProgramId          string
	RewardsManagerProgramPda         string
	RewardsManagerTokenPda           string
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
	// must have either a CN or DN endpoint configured, along with other env vars
	myEndpoint := ""
	audiusUrl := ""

	ethNetworkId := ""
	ethTokenAddress := ""
	ethRegistryAddress := ""
	ethProviderUrl := ""
	ethOwnerWallet := ""

	queryProposalStartBlock := ""
	gqlUri := ""
	gqlBackupUri := ""

	entityManagerAddress := ""

	identityService := ""

	wormholeContractAddress := ""
	claimDistributionContractAddress := ""
	solanaClusterEndpoint := ""
	wAudioMintAddress := ""
	usdcMintAddress := ""
	solanaTokenProgramAddress := ""
	claimableTokenPda := ""
	solanaFeePayerAddress := ""
	claimableTokenProgramAddress := ""
	paymentRouterProgramAddress := ""
	rewardsManagerProgramId := ""
	rewardsManagerProgramPda := ""
	rewardsManagerTokenPda := ""

	if nodeType == "content" {
		myEndpoint = mustGetenv("creatorNodeEndpoint")
		audiusUrl = mustGetenv("audiusUrl")

		ethNetworkId = mustGetenv("ethNetworkId")
		ethTokenAddress = mustGetenv("ethTokenAddress")
		ethRegistryAddress = mustGetenv("ethRegistryAddress")
		ethProviderUrl = mustGetenv("ethProviderUrl")
		ethOwnerWallet = os.Getenv("ethOwnerWallet")

		queryProposalStartBlock = mustGetenv("queryProposalStartBlock")
		gqlUri = mustGetenv("gqlUri")
		gqlBackupUri = os.Getenv("gqlBackupUri")

		entityManagerAddress = mustGetenv("entityManagerAddress")

		identityService = mustGetenv("identityService")

		wormholeContractAddress = mustGetenv("wormholeContractAddress")
		claimDistributionContractAddress = mustGetenv("claimDistributionContractAddress")
		solanaClusterEndpoint = mustGetenv("solanaClusterEndpoint")
		wAudioMintAddress = mustGetenv("wAudioMintAddress")
		usdcMintAddress = mustGetenv("usdcMintAddress")
		solanaTokenProgramAddress = mustGetenv("solanaTokenProgramAddress")
		claimableTokenPda = mustGetenv("claimableTokenPda")
		solanaFeePayerAddress = mustGetenv("solanaFeePayerAddress")
		claimableTokenProgramAddress = mustGetenv("claimableTokenProgramAddress")
		rewardsManagerProgramId = mustGetenv("rewardsManagerProgramId")
		rewardsManagerProgramPda = mustGetenv("rewardsManagerProgramPda")
		rewardsManagerTokenPda = mustGetenv("rewardsManagerTokenPda")
	} else if nodeType == "discovery" {
		myEndpoint = mustGetenv("audius_discprov_url")
		audiusUrl = mustGetenv("audius_url")

		ethNetworkId = mustGetenv("audius_eth_network_id")
		ethTokenAddress = mustGetenv("audius_eth_token_address")
		ethRegistryAddress = mustGetenv("audius_eth_contracts_registry")
		ethProviderUrl = mustGetenv("audius_web3_eth_provider_url")
		ethOwnerWallet = os.Getenv("audius_eth_owner_wallet")

		queryProposalStartBlock = mustGetenv("audius_query_proposal_start_block")
		gqlUri = mustGetenv("audius_gql_uri")
		gqlBackupUri = os.Getenv("audius_gql_backup_uri")

		entityManagerAddress = mustGetenv("audius_contracts_entity_manager_address")

		identityService = mustGetenv("audius_discprov_identity_service_url")

		wormholeContractAddress = mustGetenv("audius_wormhole_contract_address")
		claimDistributionContractAddress = mustGetenv("audius_solana_claim_distribution_contract_address")
		solanaClusterEndpoint = mustGetenv("audius_solana_cluster_endpoint")
		wAudioMintAddress = mustGetenv("audius_solana_waudio_mint")
		usdcMintAddress = mustGetenv("audius_solana_usdc_mint")
		solanaTokenProgramAddress = mustGetenv("audius_solana_token_program_address")
		claimableTokenPda = mustGetenv("audius_solana_claimable_token_pda")
		solanaFeePayerAddress = mustGetenv("audius_solana_fee_payer_address")
		claimableTokenProgramAddress = mustGetenv("audius_solana_user_bank_program_address")
		paymentRouterProgramAddress = mustGetenv("audius_solana_payment_router_program_address")
		rewardsManagerProgramId = mustGetenv("audius_solana_rewards_manager_program_address")
		rewardsManagerProgramPda = mustGetenv("audius_solana_rewards_manager_account")
		rewardsManagerTokenPda = mustGetenv("audius_solana_rewards_manager_token_pda")
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
		Peers:      peers,
		ListenPort: "1996",
		Dir:        "/bolt",

		Env:       env,
		NodeType:  nodeType,
		AudiusUrl: audiusUrl,

		EthNetworkId:       ethNetworkId,
		EthTokenAddress:    ethTokenAddress,
		EthRegistryAddress: ethRegistryAddress,
		EthProviderUrl:     ethProviderUrl,
		EthOwnerWallet:     ethOwnerWallet,

		QueryProposalStartBlock: queryProposalStartBlock,
		GqlUri:                  gqlUri,
		GqlBackupUri:            gqlBackupUri,

		EntityManagerAddress: entityManagerAddress,

		IdentityServiceEndpoint: identityService,

		WormholeContractAddress:          wormholeContractAddress,
		ClaimDistributionContractAddress: claimDistributionContractAddress,
		SolanaClusterEndpoint:            solanaClusterEndpoint,
		WAudioMintAddress:                wAudioMintAddress,
		UsdcMintAddress:                  usdcMintAddress,
		SolanaTokenProgramAddress:        solanaTokenProgramAddress,
		ClaimableTokenPda:                claimableTokenPda,
		SolanaFeePayerAddress:            solanaFeePayerAddress,
		ClaimableTokenProgramAddress:     claimableTokenProgramAddress,
		PaymentRouterProgramAddress:	  paymentRouterProgramAddress,
		RewardsManagerProgramId:          rewardsManagerProgramId,
		RewardsManagerProgramPda:         rewardsManagerProgramPda,
		RewardsManagerTokenPda:           rewardsManagerTokenPda,
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
