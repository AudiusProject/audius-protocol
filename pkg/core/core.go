package core

import (
	"context"
	"fmt"
	"net"

	"github.com/AudiusProject/audius-protocol/pkg/core/accounts"
	"github.com/AudiusProject/audius-protocol/pkg/core/chain"
	"github.com/AudiusProject/audius-protocol/pkg/core/common"
	"github.com/AudiusProject/audius-protocol/pkg/core/config"
	"github.com/AudiusProject/audius-protocol/pkg/core/config/genesis"
	"github.com/AudiusProject/audius-protocol/pkg/core/console"
	"github.com/AudiusProject/audius-protocol/pkg/core/contracts"
	"github.com/AudiusProject/audius-protocol/pkg/core/db"
	"github.com/AudiusProject/audius-protocol/pkg/core/grpc"
	"github.com/AudiusProject/audius-protocol/pkg/core/registry_bridge"
	"github.com/AudiusProject/audius-protocol/pkg/core/server"

	cconfig "github.com/cometbft/cometbft/config"
	"github.com/cometbft/cometbft/p2p"
	"github.com/cometbft/cometbft/privval"

	"github.com/cometbft/cometbft/rpc/client/local"
	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/improbable-eng/grpc-web/go/grpcweb"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"golang.org/x/sync/errgroup"
)

func Run(ctx context.Context, logger *common.Logger) error {
	return run(ctx, logger)
}

func run(ctx context.Context, logger *common.Logger) error {
	logger.Info("good morning!")

	config, cometConfig, err := setupNode(logger)
	if err != nil {
		return fmt.Errorf("setting up node: %v", err)
	}

	logger.Info("configuration created")

	// db migrations
	if err := db.RunMigrations(logger, config.PSQLConn, config.RunDownMigrations()); err != nil {
		return fmt.Errorf("running migrations: %v", err)
	}

	logger.Info("db migrations successful")

	pool, err := pgxpool.New(ctx, config.PSQLConn) // Use the passed context for the pool
	if err != nil {
		return fmt.Errorf("couldn't create pgx pool: %v", err)
	}
	defer pool.Close()

	// Create an errgroup to manage concurrent tasks with context
	eg, ctx := errgroup.WithContext(ctx)

	e := echo.New()
	e.Pre(middleware.RemoveTrailingSlash())
	e.Use(middleware.Recover())
	e.HideBanner = true

	ethrpc, err := ethclient.Dial(config.EthRPCUrl)
	if err != nil {
		return fmt.Errorf("eth client dial err: %v", err)
	}
	defer ethrpc.Close()

	c, err := contracts.NewAudiusContracts(ethrpc, config.EthRegistryAddress)
	if err != nil {
		return fmt.Errorf("contracts init error: %v", err)
	}
	logger.Info("initialized contracts")

	node, err := chain.NewNode(logger, config, cometConfig, pool, c)
	if err != nil {
		return fmt.Errorf("node init error: %v", err)
	}

	// Start the node (cometbft)
	eg.Go(func() error {
		logger.Info("core CometBFT node starting")
		return node.Start()
	})

	logger.Info("new node created")

	rpc := local.New(node)

	logger.Info("local rpc initialized")

	registryBridge, err := registry_bridge.NewRegistryBridge(logger, config, rpc, c, pool)
	if err != nil {
		return fmt.Errorf("registry bridge init error: %v", err)
	}

	// Start the registry bridge
	eg.Go(func() error {
		logger.Info("core registry bridge starting")
		return registryBridge.Start()
	})

	con, err := console.NewConsole(config, logger, e, pool)
	if err != nil {
		return fmt.Errorf("console init error: %v", err)
	}

	eg.Go(func() error {
		logger.Info("core Console starting")
		return con.Start()
	})

	grpcServer, err := grpc.NewGRPCServer(logger, config, rpc, pool)
	if err != nil {
		return fmt.Errorf("grpc init error: %v", err)
	}

	grpcWeb := grpcweb.WrapServer(grpcServer.GetServer())

	logger.Info("grpc server created")

	_, err = server.NewServer(config, node.Config(), logger, rpc, pool, e, grpcWeb)
	if err != nil {
		return fmt.Errorf("server init error: %v", err)
	}

	// Start the HTTP server
	eg.Go(func() error {
		logger.Info("core HTTP server starting")
		return e.Start(config.CoreServerAddr)
	})

	grpcLis, err := net.Listen("tcp", config.GRPCladdr)
	if err != nil {
		return fmt.Errorf("grpc listener not created: %v", err)
	}

	// Start the gRPC server
	eg.Go(func() error {
		logger.Info("core gRPC server starting")
		return grpcServer.Serve(grpcLis)
	})

	// Close all services when the context is canceled
	defer func() {
		logger.Info("Shutting down all services...")
		e.Shutdown(ctx)
		node.Stop()
		grpcLis.Close()
		ethrpc.Close()
	}()

	// Wait for all services to finish or for context cancellation
	return eg.Wait()
}

/*
Reads in config, sets up comet files, and cleans up state
based on setup configuration.

- reads in env config
- determines env
- gathers chain id
*/
func setupNode(logger *common.Logger) (*config.Config, *cconfig.Config, error) {
	// read in env / dotenv config
	envConfig, err := config.ReadConfig(logger)
	if err != nil {
		return nil, nil, fmt.Errorf("reading env config: %v", err)
	}

	// gather genesis doc based on environment
	genDoc, err := genesis.Read(envConfig.Environment)
	if err != nil {
		return nil, nil, fmt.Errorf("reading genesis: %v", err)
	}
	envConfig.GenesisFile = genDoc

	if envConfig.StandaloneConsole {
		return envConfig, nil, nil
	}

	// gather chain id
	chainID := genDoc.ChainID

	// assemble comet paths
	cometRootDir := fmt.Sprintf("%s/%s", envConfig.RootDir, chainID)
	cometConfigDir := fmt.Sprintf("%s/config", cometRootDir)
	cometDataDir := fmt.Sprintf("%s/data", cometRootDir)

	// create dirs if they don't exist
	if err := common.CreateDirIfNotExist(cometRootDir); err != nil {
		return nil, nil, fmt.Errorf("created comet root dir: %v", err)
	}

	if err := common.CreateDirIfNotExist(cometConfigDir); err != nil {
		return nil, nil, fmt.Errorf("created comet config dir: %v", err)
	}

	if err := common.CreateDirIfNotExist(cometDataDir); err != nil {
		return nil, nil, fmt.Errorf("created comet data dir: %v", err)
	}

	// create default comet config
	cometConfig := cconfig.DefaultConfig()
	cometConfig.SetRoot(cometRootDir)

	// get derived comet key
	delegatePrivateKey := envConfig.DelegatePrivateKey
	key, err := accounts.EthToCometKey(delegatePrivateKey)
	if err != nil {
		return nil, nil, fmt.Errorf("creating key %v", err)
	}
	envConfig.CometKey = key

	ethKey, err := accounts.EthToEthKey(delegatePrivateKey)
	if err != nil {
		return nil, nil, fmt.Errorf("creating eth key %v", err)
	}
	envConfig.EthereumKey = ethKey

	// get paths to priv validator and state file
	privValKeyFile := cometConfig.PrivValidatorKeyFile()
	privValStateFile := cometConfig.PrivValidatorStateFile()

	// set validator and state file for derived comet key
	var pv *privval.FilePV
	if common.FileExists(privValKeyFile) {
		logger.Info("Found private validator", "keyFile", privValKeyFile,
			"stateFile", privValStateFile)
		pv = privval.LoadFilePV(privValKeyFile, privValStateFile)
	} else {
		pv = privval.NewFilePV(key, privValKeyFile, privValStateFile)
		pv.Save()
		logger.Info("Generated private validator", "keyFile", privValKeyFile,
			"stateFile", privValStateFile)
	}

	// now that we know proposer addr, set in config
	envConfig.ProposerAddress = pv.GetAddress().String()

	// setup p2p key from derived key
	nodeKeyFile := cometConfig.NodeKeyFile()
	if common.FileExists(nodeKeyFile) {
		logger.Info("Found node key", "path", nodeKeyFile)
	} else {
		p2pKey := p2p.NodeKey{
			PrivKey: key,
		}
		if err := p2pKey.SaveAs(nodeKeyFile); err != nil {
			return nil, nil, fmt.Errorf("creating node key %v", err)
		}
		logger.Info("Generated node key", "path", nodeKeyFile)
	}

	// save gen file if it doesn't exist
	genFile := cometConfig.GenesisFile()
	if common.FileExists(genFile) {
		logger.Info("Found genesis file", "path", genFile)
	} else {
		if err := genDoc.SaveAs(genFile); err != nil {
			return nil, nil, fmt.Errorf("saving gen file %v", err)
		}
		logger.Info("generated new genesis, running down migrations to start new")
		envConfig.RunDownMigration = true
		logger.Info("Generated genesis file", "path", genFile)
	}

	// after succesful setup, setup comet config.toml
	// postgres indexer config
	cometConfig.TxIndex.Indexer = "psql"
	cometConfig.TxIndex.PsqlConn = envConfig.PSQLConn
	cometConfig.TxIndex.TableBlocks = "core_blocks"
	cometConfig.TxIndex.TableTxResults = "core_tx_results"
	cometConfig.TxIndex.TableEvents = "core_events"
	cometConfig.TxIndex.TableAttributes = "core_attributes"

	// db and state config
	cometConfig.Consensus.CreateEmptyBlocks = false

	// mempool
	cometConfig.Mempool.Recheck = true
	cometConfig.Mempool.Size = 100000

	// peering
	cometConfig.P2P.PexReactor = true
	cometConfig.P2P.AddrBookStrict = envConfig.AddrBookStrict
	if envConfig.PersistentPeers != "" {
		cometConfig.P2P.PersistentPeers = envConfig.PersistentPeers
	}
	if envConfig.Seeds != "" {
		cometConfig.P2P.Seeds = envConfig.Seeds
	}
	if envConfig.ExternalAddress != "" {
		cometConfig.P2P.ExternalAddress = envConfig.ExternalAddress
	}

	// connection settings
	if envConfig.RPCladdr != "" {
		cometConfig.RPC.ListenAddress = envConfig.RPCladdr
	}
	if envConfig.P2PLaddr != "" {
		cometConfig.P2P.ListenAddress = envConfig.P2PLaddr
	}

	cometConfig.P2P.MaxNumOutboundPeers = envConfig.MaxOutboundPeers
	cometConfig.P2P.MaxNumInboundPeers = envConfig.MaxInboundPeers

	return envConfig, cometConfig, nil
}
