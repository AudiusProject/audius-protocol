package chain

import (
	"context"
	"encoding/hex"
	"errors"
	"time"

	"github.com/AudiusProject/audius-protocol/pkg/core/common"
	"github.com/AudiusProject/audius-protocol/pkg/core/config"
	"github.com/AudiusProject/audius-protocol/pkg/core/contracts"
	"github.com/AudiusProject/audius-protocol/pkg/core/db"
	gen_proto "github.com/AudiusProject/audius-protocol/pkg/core/gen/proto"
	"github.com/AudiusProject/audius-protocol/pkg/core/mempool"
	"github.com/AudiusProject/audius-protocol/pkg/core/pubsub"
	abcitypes "github.com/cometbft/cometbft/abci/types"
	cometbfttypes "github.com/cometbft/cometbft/types"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"google.golang.org/protobuf/proto"
)

type CoreApplication struct {
	logger    *common.Logger
	queries   *db.Queries
	contracts *contracts.AudiusContracts
	pool      *pgxpool.Pool
	config    *config.Config
	mempl     *mempool.Mempool
	txPubsub  *pubsub.TransactionHashPubsub

	onGoingBlock pgx.Tx
	finalizedTxs []string
}

var _ abcitypes.Application = (*CoreApplication)(nil)

func NewCoreApplication(logger *common.Logger, pool *pgxpool.Pool, contracts *contracts.AudiusContracts, envConfig *config.Config, mempl *mempool.Mempool, txPubsub *pubsub.TransactionHashPubsub) *CoreApplication {
	return &CoreApplication{
		logger:       logger,
		queries:      db.New(pool),
		contracts:    contracts,
		pool:         pool,
		onGoingBlock: nil,
		config:       envConfig,
		mempl:        mempl,
		txPubsub:     txPubsub,
		finalizedTxs: []string{},
	}
}

func (app *CoreApplication) Info(ctx context.Context, info *abcitypes.InfoRequest) (*abcitypes.InfoResponse, error) {
	latest, err := app.queries.GetLatestAppState(ctx)
	if err != nil && !errors.Is(err, pgx.ErrNoRows) {
		// Log the error and return a default response
		app.logger.Errorf("Error retrieving app state: %v", err)
		return &abcitypes.InfoResponse{}, nil
	}

	app.logger.Infof("app starting at block %d with hash %s", latest.BlockHeight, hex.EncodeToString(latest.AppHash))

	res := &abcitypes.InfoResponse{
		LastBlockHeight:  latest.BlockHeight,
		LastBlockAppHash: latest.AppHash,
	}

	return res, nil
}

func (app *CoreApplication) Query(ctx context.Context, req *abcitypes.QueryRequest) (*abcitypes.QueryResponse, error) {
	return &abcitypes.QueryResponse{}, nil
}

func (app *CoreApplication) CheckTx(_ context.Context, check *abcitypes.CheckTxRequest) (*abcitypes.CheckTxResponse, error) {
	// check if protobuf event
	_, err := app.isValidSignedTransaction(check.Tx)
	if err == nil {
		return &abcitypes.CheckTxResponse{Code: abcitypes.CodeTypeOK}, nil
	}
	return &abcitypes.CheckTxResponse{Code: 1}, nil
}

func (app *CoreApplication) InitChain(_ context.Context, chain *abcitypes.InitChainRequest) (*abcitypes.InitChainResponse, error) {
	return &abcitypes.InitChainResponse{}, nil
}

func (app *CoreApplication) PrepareProposal(ctx context.Context, proposal *abcitypes.PrepareProposalRequest) (*abcitypes.PrepareProposalResponse, error) {
	proposalTxs := [][]byte{}

	shouldProposeNewRollup := app.shouldProposeNewRollup(ctx, proposal.Height)
	if shouldProposeNewRollup {
		rollupTx, err := app.createRollupTx(ctx, proposal.Time, proposal.Height)
		if err != nil {
			app.logger.Error("Failed to create rollup transaction", "error", err)
		} else {
			proposalTxs = append(proposalTxs, rollupTx)
		}
	}

	// keep batch at 1000 even if sla rollup occurs
	batch := 1000
	if shouldProposeNewRollup {
		batch = batch - 1
	}

	txMemBatch := app.mempl.GetBatch(batch)

	// TODO: parallelize
	for _, tx := range txMemBatch {
		// app.validateTx(tx)
		txBytes, err := proto.Marshal(tx)
		if err != nil {
			app.logger.Errorf("tx made it into prepare but couldn't be marshalled: %v", err)
			continue
		}
		proposalTxs = append(proposalTxs, txBytes)
	}

	app.logger.Infof("proposing %d txs", proposalTxs)
	return &abcitypes.PrepareProposalResponse{Txs: proposalTxs}, nil
}

func (app *CoreApplication) ProcessProposal(ctx context.Context, proposal *abcitypes.ProcessProposalRequest) (*abcitypes.ProcessProposalResponse, error) {
	valid, err := app.validateBlockTxs(ctx, proposal.Time, proposal.Height, proposal.Txs)
	if err != nil {
		app.logger.Error("Reporting unknown proposal status due to validation error", "error", err)
		return &abcitypes.ProcessProposalResponse{Status: abcitypes.PROCESS_PROPOSAL_STATUS_UNKNOWN}, err
	} else if !valid {
		return &abcitypes.ProcessProposalResponse{Status: abcitypes.PROCESS_PROPOSAL_STATUS_REJECT}, nil
	}
	return &abcitypes.ProcessProposalResponse{Status: abcitypes.PROCESS_PROPOSAL_STATUS_ACCEPT}, nil
}

func (app *CoreApplication) FinalizeBlock(ctx context.Context, req *abcitypes.FinalizeBlockRequest) (*abcitypes.FinalizeBlockResponse, error) {
	logger := app.logger
	var txs = make([]*abcitypes.ExecTxResult, len(req.Txs))

	// open in progres pg transaction
	app.startInProgressTx(ctx)
	for i, tx := range req.Txs {
		signedTx, err := app.isValidSignedTransaction(tx)
		if err == nil {
			// set tx to ok and set to not okay later if error occurs
			txs[i] = &abcitypes.ExecTxResult{Code: abcitypes.CodeTypeOK}

			txhash, err := app.toTxHash(signedTx)
			if err != nil {
				app.logger.Errorf("error getting tx hash: %v", err)
				txs[i] = &abcitypes.ExecTxResult{Code: 2}
			}

			finalizedTx, err := app.finalizeTransaction(ctx, signedTx, txhash)
			if err != nil {
				app.logger.Errorf("error finalizing event: %v", err)
				txs[i] = &abcitypes.ExecTxResult{Code: 2}
			}

			if err := app.persistTxStat(ctx, finalizedTx, txhash, req.Height, req.Time); err != nil {
				// don't halt consensus on this
				app.logger.Errorf("failed to persist tx stat: %v", err)
			}

			// set finalized txs in finalize step to remove from mempool during commit step
			// always append to finalized even in error conditions to be removed from mempool
			app.finalizedTxs = append(app.finalizedTxs, txhash)
		} else {
			logger.Errorf("Error: invalid transaction index %v", i)
			txs[i] = &abcitypes.ExecTxResult{Code: 1}
		}
	}

	nextAppHash := app.serializeAppState([]byte{}, req.GetTxs())

	if err := app.getDb().UpsertAppState(ctx, db.UpsertAppStateParams{
		BlockHeight: req.Height,
		AppHash:     nextAppHash,
	}); err != nil {
		app.logger.Errorf("error upserting app state %v", err)
	}

	// increment number of proposed blocks for sla auditor
	addr := cometbfttypes.Address(req.ProposerAddress).String()
	if err := app.getDb().UpsertSlaRollupReport(ctx, addr); err != nil {
		app.logger.Error(
			"Error attempting to increment blocks proposed by node",
			"address",
			addr,
			"error",
			err,
		)
	}

	return &abcitypes.FinalizeBlockResponse{
		TxResults: txs,
		AppHash:   nextAppHash,
	}, nil
}

func (app CoreApplication) Commit(ctx context.Context, commit *abcitypes.CommitRequest) (*abcitypes.CommitResponse, error) {
	if err := app.commitInProgressTx(ctx); err != nil {
		app.logger.Error("failure to commit tx", "error", err)
		return &abcitypes.CommitResponse{}, err
	}

	// rm txs from mempool
	app.mempl.RemoveBatch(app.finalizedTxs)
	// broadcast txs to subscribers
	for _, txhash := range app.finalizedTxs {
		app.txPubsub.Publish(ctx, txhash, struct{}{})
	}
	// reset abci finalized txs
	app.finalizedTxs = []string{}

	return &abcitypes.CommitResponse{}, nil
}

func (app *CoreApplication) ListSnapshots(_ context.Context, snapshots *abcitypes.ListSnapshotsRequest) (*abcitypes.ListSnapshotsResponse, error) {
	return &abcitypes.ListSnapshotsResponse{}, nil
}

func (app *CoreApplication) OfferSnapshot(_ context.Context, snapshot *abcitypes.OfferSnapshotRequest) (*abcitypes.OfferSnapshotResponse, error) {
	return &abcitypes.OfferSnapshotResponse{}, nil
}

func (app *CoreApplication) LoadSnapshotChunk(_ context.Context, chunk *abcitypes.LoadSnapshotChunkRequest) (*abcitypes.LoadSnapshotChunkResponse, error) {
	return &abcitypes.LoadSnapshotChunkResponse{}, nil
}

func (app *CoreApplication) ApplySnapshotChunk(_ context.Context, chunk *abcitypes.ApplySnapshotChunkRequest) (*abcitypes.ApplySnapshotChunkResponse, error) {
	return &abcitypes.ApplySnapshotChunkResponse{Result: abcitypes.APPLY_SNAPSHOT_CHUNK_RESULT_ACCEPT}, nil
}

func (app CoreApplication) ExtendVote(_ context.Context, extend *abcitypes.ExtendVoteRequest) (*abcitypes.ExtendVoteResponse, error) {
	return &abcitypes.ExtendVoteResponse{}, nil
}

func (app *CoreApplication) VerifyVoteExtension(_ context.Context, verify *abcitypes.VerifyVoteExtensionRequest) (*abcitypes.VerifyVoteExtensionResponse, error) {
	return &abcitypes.VerifyVoteExtensionResponse{}, nil
}

func (app *CoreApplication) isValidSignedTransaction(tx []byte) (*gen_proto.SignedTransaction, error) {
	var msg gen_proto.SignedTransaction
	err := proto.Unmarshal(tx, &msg)
	if err != nil {
		return nil, err
	}
	return &msg, nil
}

func (app *CoreApplication) validateBlockTxs(ctx context.Context, blockTime time.Time, blockHeight int64, txs [][]byte) (bool, error) {
	alreadyContainsRollup := false
	for _, tx := range txs {
		protoEvent, err := app.isValidSignedTransaction(tx)
		if err != nil {
			app.logger.Error(" **** Invalid block bcz not proto event or KVp")
			return false, nil
		}

		switch protoEvent.Transaction.(type) {
		case *gen_proto.SignedTransaction_Plays:
		case *gen_proto.SignedTransaction_ValidatorRegistration:
		case *gen_proto.SignedTransaction_SlaRollup:
			if alreadyContainsRollup {
				app.logger.Error(" **** Invalid block already have rollup")
				return false, nil
			} else if valid, err := app.isValidRollup(ctx, blockTime, blockHeight, protoEvent.GetSlaRollup()); err != nil {
				app.logger.Error(" **** Invalid block bcuz err", "error", err)
				return false, err
			} else if !valid {
				app.logger.Error(" **** Invalid block bcuz invalid rollup")
				return false, nil
			}
			alreadyContainsRollup = true
		}
	}
	return true, nil
}

func (app *CoreApplication) toTxHash(msg proto.Message) (string, error) {
	return common.ToTxHash(msg)
}
