package console

import (
	"context"
	"time"

	"github.com/AudiusProject/audius-protocol/pkg/core/common"
	"github.com/AudiusProject/audius-protocol/pkg/core/config"
	"github.com/AudiusProject/audius-protocol/pkg/core/console/views/pages"
	"github.com/AudiusProject/audius-protocol/pkg/core/db"
	"github.com/AudiusProject/audius-protocol/pkg/core/grpc"
	"github.com/cometbft/cometbft/rpc/client"
)

type State struct {
	rpc    client.Client
	logger *common.Logger
	db     *db.Queries

	latestBlocks       []pages.BlockView
	latestTransactions []db.CoreTxResult

	totalBlocks         int64
	totalTransactions   int64
	totalPlays          int64
	totalValidators     int64
	totalManageEntities int64

	isSyncing bool

	chainId      string
	ethAddress   string
	cometAddress string
}

func NewState(config *config.Config, rpc client.Client, logger *common.Logger, db *db.Queries) (*State, error) {
	return &State{
		rpc:    rpc,
		logger: logger,
		db:     db,

		chainId:      config.GenesisFile.ChainID,
		ethAddress:   config.WalletAddress,
		cometAddress: config.ProposerAddress,
	}, nil
}

func (state *State) recalculateState() {
	ctx := context.Background()
	logger := state.logger

	recentTransactions, err := state.db.GetRecentTxs(ctx)
	if err != nil {
		logger.Errorf("could not get recent txs: %v", err)
	} else {
		state.latestTransactions = recentTransactions
	}

	// on initial load
	totalTxs, err := state.db.TotalTransactions(ctx)
	if err != nil {
		logger.Errorf("could not get total txs: %v", err)
	} else {
		state.totalTransactions = totalTxs
	}

	totalBlocks, err := state.db.TotalBlocks(ctx)
	if err != nil {
		logger.Errorf("could not get total blocks: %v", err)
	} else {
		state.totalBlocks = totalBlocks
	}

	totalPlays, err := state.db.TotalTransactionsByType(ctx, grpc.TrackPlaysProtoName)
	if err != nil {
		logger.Errorf("could not get total plays: %v", err)
	} else {
		state.totalPlays = totalPlays
	}

	totalManageEntities, err := state.db.TotalTransactionsByType(ctx, grpc.ManageEntitiesProtoName)
	if err != nil {
		logger.Errorf("could not get total manage entities: %v", err)
	} else {
		state.totalManageEntities = totalManageEntities
	}

	totalValidators, err := state.db.TotalValidators(ctx)
	if err != nil {
		logger.Errorf("could not get total validators: %v", err)
	} else {
		state.totalValidators = totalValidators
	}

	latestBlocks := []pages.BlockView{}

	latestIndexedBlocks, err := state.db.GetRecentBlocks(context.Background())
	if err != nil {
		state.logger.Errorf("failed to get latest blocks in db: %v", err)
	}

	for _, block := range latestIndexedBlocks {
		indexedTxs, err := state.db.GetBlockTransactions(context.Background(), block.Height)
		if err != nil {
			state.logger.Errorf("could not get block txs: %v", err)
		}

		txs := [][]byte{}
		for _, tx := range indexedTxs {
			txs = append(txs, tx.TxResult)
		}

		latestBlocks = append(latestBlocks, pages.BlockView{
			Height:    block.Height,
			Timestamp: block.CreatedAt.Time,
			Txs: txs,
		})
	}

	state.latestBlocks = latestBlocks

	status, err := state.rpc.Status(ctx)
	if err == nil {
		state.isSyncing = status.SyncInfo.CatchingUp
	}
}

func (state *State) Start() error {
	state.recalculateState()

	for {
		time.Sleep(5 * time.Second)

		totalBlocks, err := state.db.TotalBlocks(context.Background())
		if err != nil {
			state.logger.Errorf("could not get total blocks: %v", err)
			continue
		}

		if totalBlocks <= state.totalBlocks {
			// total blocks hasn't changed
			continue
		}
		
		// new block(s) present, rehydrate
		state.recalculateState()
	}
}
