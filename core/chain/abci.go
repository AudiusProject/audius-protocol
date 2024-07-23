package chain

import (
	"bytes"
	"context"
	"errors"
	"log"

	abcitypes "github.com/cometbft/cometbft/abci/types"
	"github.com/dgraph-io/badger/v4"
)

type KVStoreApplication struct {
	db           *badger.DB
	onGoingBlock *badger.Txn
}

var _ abcitypes.Application = (*KVStoreApplication)(nil)

func NewKVStoreApplication(db *badger.DB) *KVStoreApplication {
	return &KVStoreApplication{db: db}
}

func (app *KVStoreApplication) Info(_ context.Context, info *abcitypes.InfoRequest) (*abcitypes.InfoResponse, error) {
	return &abcitypes.InfoResponse{}, nil
}

func (app *KVStoreApplication) Query(_ context.Context, req *abcitypes.QueryRequest) (*abcitypes.QueryResponse, error) {
	resp := abcitypes.QueryResponse{Key: req.Data}

	dbErr := app.db.View(func(txn *badger.Txn) error {
		item, err := txn.Get(req.Data)
		if err != nil {
			if !errors.Is(err, badger.ErrKeyNotFound) {
				return err
			}
			resp.Log = "key does not exist"
			return nil
		}

		return item.Value(func(val []byte) error {
			resp.Log = "exists"
			resp.Value = val
			return nil
		})
	})
	if dbErr != nil {
		log.Panicf("Error reading database, unable to execute query: %v", dbErr)
	}
	return &resp, nil
}

func (app *KVStoreApplication) CheckTx(_ context.Context, check *abcitypes.CheckTxRequest) (*abcitypes.CheckTxResponse, error) {
	code := app.isValid(check.Tx)
	return &abcitypes.CheckTxResponse{Code: code}, nil
}

func (app *KVStoreApplication) InitChain(_ context.Context, chain *abcitypes.InitChainRequest) (*abcitypes.InitChainResponse, error) {
	return &abcitypes.InitChainResponse{}, nil
}

func (app *KVStoreApplication) PrepareProposal(_ context.Context, proposal *abcitypes.PrepareProposalRequest) (*abcitypes.PrepareProposalResponse, error) {
	return &abcitypes.PrepareProposalResponse{Txs: proposal.Txs}, nil
}

func (app *KVStoreApplication) ProcessProposal(_ context.Context, proposal *abcitypes.ProcessProposalRequest) (*abcitypes.ProcessProposalResponse, error) {
	return &abcitypes.ProcessProposalResponse{Status: abcitypes.PROCESS_PROPOSAL_STATUS_ACCEPT}, nil
}

func (app *KVStoreApplication) FinalizeBlock(_ context.Context, req *abcitypes.FinalizeBlockRequest) (*abcitypes.FinalizeBlockResponse, error) {
	var txs = make([]*abcitypes.ExecTxResult, len(req.Txs))

	app.onGoingBlock = app.db.NewTransaction(true)
	for i, tx := range req.Txs {
		if code := app.isValid(tx); code != 0 {
			log.Printf("Error: invalid transaction index %v", i)
			txs[i] = &abcitypes.ExecTxResult{Code: code}
		} else {
			parts := bytes.SplitN(tx, []byte("="), 2)
			key, value := parts[0], parts[1]
			log.Printf("Adding key %s with value %s", key, value)

			if err := app.onGoingBlock.Set(key, value); err != nil {
				log.Panicf("Error writing to database, unable to execute tx: %v", err)
			}

			log.Printf("Successfully added key %s with value %s", key, value)

			// Add an event for the transaction execution.
			// Multiple events can be emitted for a transaction, but we are adding only one event
			txs[i] = &abcitypes.ExecTxResult{
				Code: 0,
				Events: []abcitypes.Event{
					{
						Type: "app",
						Attributes: []abcitypes.EventAttribute{
							{Key: "key", Value: string(key), Index: true},
							{Key: "value", Value: string(value), Index: true},
						},
					},
				},
			}
		}
	}

	return &abcitypes.FinalizeBlockResponse{
		TxResults: txs,
	}, nil
}

func (app KVStoreApplication) Commit(_ context.Context, commit *abcitypes.CommitRequest) (*abcitypes.CommitResponse, error) {
	return &abcitypes.CommitResponse{}, app.onGoingBlock.Commit()
}

func (app *KVStoreApplication) ListSnapshots(_ context.Context, snapshots *abcitypes.ListSnapshotsRequest) (*abcitypes.ListSnapshotsResponse, error) {
	return &abcitypes.ListSnapshotsResponse{}, nil
}

func (app *KVStoreApplication) OfferSnapshot(_ context.Context, snapshot *abcitypes.OfferSnapshotRequest) (*abcitypes.OfferSnapshotResponse, error) {
	return &abcitypes.OfferSnapshotResponse{}, nil
}

func (app *KVStoreApplication) LoadSnapshotChunk(_ context.Context, chunk *abcitypes.LoadSnapshotChunkRequest) (*abcitypes.LoadSnapshotChunkResponse, error) {
	return &abcitypes.LoadSnapshotChunkResponse{}, nil
}

func (app *KVStoreApplication) ApplySnapshotChunk(_ context.Context, chunk *abcitypes.ApplySnapshotChunkRequest) (*abcitypes.ApplySnapshotChunkResponse, error) {
	return &abcitypes.ApplySnapshotChunkResponse{Result: abcitypes.APPLY_SNAPSHOT_CHUNK_RESULT_ACCEPT}, nil
}

func (app KVStoreApplication) ExtendVote(_ context.Context, extend *abcitypes.ExtendVoteRequest) (*abcitypes.ExtendVoteResponse, error) {
	return &abcitypes.ExtendVoteResponse{}, nil
}

func (app *KVStoreApplication) VerifyVoteExtension(_ context.Context, verify *abcitypes.VerifyVoteExtensionRequest) (*abcitypes.VerifyVoteExtensionResponse, error) {
	return &abcitypes.VerifyVoteExtensionResponse{}, nil
}

func (app *KVStoreApplication) isValid(tx []byte) uint32 {
	// check format
	parts := bytes.Split(tx, []byte("="))
	if len(parts) != 2 {
		return 1
	}

	return 0
}
