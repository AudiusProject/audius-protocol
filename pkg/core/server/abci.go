package server

import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"time"

	"github.com/AudiusProject/audius-protocol/pkg/core/common"
	"github.com/AudiusProject/audius-protocol/pkg/core/db"
	"github.com/AudiusProject/audius-protocol/pkg/core/gen/core_proto"
	"github.com/cometbft/cometbft/abci/types"
	abcitypes "github.com/cometbft/cometbft/abci/types"
	cfg "github.com/cometbft/cometbft/config"
	"github.com/cometbft/cometbft/crypto/ed25519"
	nm "github.com/cometbft/cometbft/node"
	"github.com/cometbft/cometbft/p2p"
	"github.com/cometbft/cometbft/privval"
	"github.com/cometbft/cometbft/proxy"
	"github.com/cometbft/cometbft/rpc/client/local"
	cometbfttypes "github.com/cometbft/cometbft/types"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"google.golang.org/protobuf/proto"
)

// state that the abci specifically relies on
type ABCIState struct {
	onGoingBlock pgx.Tx
	finalizedTxs []string
}

func NewABCIState() *ABCIState {
	return &ABCIState{
		onGoingBlock: nil,
		finalizedTxs: []string{},
	}
}

var _ abcitypes.Application = (*Server)(nil)

// initializes the cometbft node and the abci application which is the server itself
// connects the local rpc instance to the abci application once successfully created
func (s *Server) startABCI() error {
	s.logger.Info("starting abci")

	cometConfig := s.cometbftConfig
	pv := privval.LoadFilePV(
		cometConfig.PrivValidatorKeyFile(),
		cometConfig.PrivValidatorStateFile(),
	)

	nodeKey, err := p2p.LoadNodeKey(cometConfig.NodeKeyFile())
	if err != nil {
		return fmt.Errorf("failed to load node's key: %v", err)
	}

	node, err := nm.NewNode(
		context.Background(),
		cometConfig,
		pv,
		nodeKey,
		proxy.NewLocalClientCreator(s),
		nm.DefaultGenesisDocProviderFunc(cometConfig),
		cfg.DefaultDBProvider,
		nm.DefaultMetricsProvider(cometConfig.Instrumentation),
		s.logger.Child("chain"),
	)

	if err != nil {
		s.logger.Errorf("error creating node: %v", err)
		return fmt.Errorf("creating node: %v", err)
	}

	s.node = node

	s.logger.Info("said node was ready")

	s.rpc = local.New(s.node)
	close(s.awaitRpcReady)

	s.logger.Info("core CometBFT node starting")

	if err := s.node.Start(); err != nil {
		s.logger.Errorf("cometbft failed to start: %v", err)
		return err
	}
	return nil
}

func (s *Server) Info(ctx context.Context, info *abcitypes.InfoRequest) (*abcitypes.InfoResponse, error) {
	latest, err := s.db.GetLatestAppState(ctx)
	if err != nil && !errors.Is(err, pgx.ErrNoRows) {
		// Log the error and return a default response
		s.logger.Errorf("Error retrieving app state: %v", err)
		return &abcitypes.InfoResponse{}, nil
	}

	s.logger.Infof("app starting at block %d with hash %s", latest.BlockHeight, hex.EncodeToString(latest.AppHash))

	res := &abcitypes.InfoResponse{
		LastBlockHeight:  latest.BlockHeight,
		LastBlockAppHash: latest.AppHash,
	}

	return res, nil
}

func (s *Server) Query(ctx context.Context, req *abcitypes.QueryRequest) (*abcitypes.QueryResponse, error) {
	return &abcitypes.QueryResponse{}, nil
}

func (s *Server) CheckTx(_ context.Context, check *abcitypes.CheckTxRequest) (*abcitypes.CheckTxResponse, error) {
	// check if protobuf event
	_, err := s.isValidSignedTransaction(check.Tx)
	if err == nil {
		return &abcitypes.CheckTxResponse{Code: abcitypes.CodeTypeOK}, nil
	}
	return &abcitypes.CheckTxResponse{Code: 1}, nil
}

func (s *Server) InitChain(_ context.Context, chain *abcitypes.InitChainRequest) (*abcitypes.InitChainResponse, error) {
	return &abcitypes.InitChainResponse{}, nil
}

func (s *Server) PrepareProposal(ctx context.Context, proposal *abcitypes.PrepareProposalRequest) (*abcitypes.PrepareProposalResponse, error) {
	proposalTxs := [][]byte{}

	shouldProposeNewRollup := s.shouldProposeNewRollup(ctx, proposal.Height)
	if shouldProposeNewRollup {
		rollupTx, err := s.createRollupTx(ctx, proposal.Time, proposal.Height)
		if err != nil {
			s.logger.Error("Failed to create rollup transaction", "error", err)
		} else {
			proposalTxs = append(proposalTxs, rollupTx)
		}
	}

	// keep batch at 1000 even if sla rollup occurs
	batch := 1000
	if shouldProposeNewRollup {
		batch = batch - 1
	}

	txMemBatch := s.mempl.GetBatch(batch, proposal.Height)

	// TODO: parallelize
	for _, tx := range txMemBatch {
		// app.validateTx(tx)
		txBytes, err := proto.Marshal(tx)
		if err != nil {
			s.logger.Errorf("tx made it into prepare but couldn't be marshalled: %v", err)
			continue
		}
		proposalTxs = append(proposalTxs, txBytes)
	}

	s.logger.Infof("proposing %d txs", proposalTxs)
	return &abcitypes.PrepareProposalResponse{Txs: proposalTxs}, nil
}

func (s *Server) ProcessProposal(ctx context.Context, proposal *abcitypes.ProcessProposalRequest) (*abcitypes.ProcessProposalResponse, error) {
	valid, err := s.validateBlockTxs(ctx, proposal.Time, proposal.Height, proposal.Txs)
	if err != nil {
		s.logger.Error("Reporting unknown proposal status due to validation error", "error", err)
		return &abcitypes.ProcessProposalResponse{Status: abcitypes.PROCESS_PROPOSAL_STATUS_UNKNOWN}, err
	} else if !valid {
		return &abcitypes.ProcessProposalResponse{Status: abcitypes.PROCESS_PROPOSAL_STATUS_REJECT}, nil
	}
	return &abcitypes.ProcessProposalResponse{Status: abcitypes.PROCESS_PROPOSAL_STATUS_ACCEPT}, nil
}

func (s *Server) FinalizeBlock(ctx context.Context, req *abcitypes.FinalizeBlockRequest) (*abcitypes.FinalizeBlockResponse, error) {
	logger := s.logger
	state := s.abciState
	var txs = make([]*abcitypes.ExecTxResult, len(req.Txs))
	var validatorUpdates = abcitypes.ValidatorUpdates{}
	var validatorUpdatesMap = map[string]bool{}

	// open in progres pg transaction
	s.startInProgressTx(ctx)
	for i, tx := range req.Txs {
		signedTx, err := s.isValidSignedTransaction(tx)
		if err == nil {
			// set tx to ok and set to not okay later if error occurs
			txs[i] = &abcitypes.ExecTxResult{Code: abcitypes.CodeTypeOK}

			txhash, err := s.toTxHash(signedTx)
			if err != nil {
				s.logger.Errorf("error getting tx hash: %v", err)
				txs[i] = &abcitypes.ExecTxResult{Code: 2}
			}

			finalizedTx, err := s.finalizeTransaction(ctx, signedTx, txhash)
			if err != nil {
				s.logger.Errorf("error finalizing event: %v", err)
				txs[i] = &abcitypes.ExecTxResult{Code: 2}
			} else if vr := signedTx.GetValidatorRegistration(); vr != nil {
				// Avoid error when duplicate validator update txs are in the same block
				vrPubKey := ed25519.PubKey(vr.GetPubKey())
				vrAddr := vrPubKey.Address().String()
				if _, ok := validatorUpdatesMap[vrAddr]; !ok {
					validatorUpdates = append(
						validatorUpdates,
						abcitypes.ValidatorUpdate{
							Power:       vr.Power,
							PubKeyBytes: vr.PubKey,
							PubKeyType:  "ed25519",
						},
					)
					validatorUpdatesMap[vrAddr] = true
				}
			}

			if err := s.persistTxStat(ctx, finalizedTx, txhash, req.Height, req.Time); err != nil {
				// don't halt consensus on this
				s.logger.Errorf("failed to persist tx stat: %v", err)
			}

			// set finalized txs in finalize step to remove from mempool during commit step
			// always append to finalized even in error conditions to be removed from mempool
			state.finalizedTxs = append(state.finalizedTxs, txhash)
		} else {
			logger.Errorf("Error: invalid transaction index %v", i)
			txs[i] = &abcitypes.ExecTxResult{Code: 1}
		}
	}

	nextAppHash := s.serializeAppState([]byte{}, req.GetTxs())

	if err := s.getDb().UpsertAppState(ctx, db.UpsertAppStateParams{
		BlockHeight: req.Height,
		AppHash:     nextAppHash,
	}); err != nil {
		s.logger.Errorf("error upserting app state %v", err)
	}

	// increment number of proposed blocks for sla auditor
	addr := cometbfttypes.Address(req.ProposerAddress).String()
	if err := s.getDb().UpsertSlaRollupReport(ctx, addr); err != nil {
		s.logger.Error(
			"Error attempting to increment blocks proposed by node",
			"address",
			addr,
			"error",
			err,
		)
	}

	// routine every hundredth block to remove expired txs
	// run in separate goroutine to not affect consensus time
	hundredthBlock := req.Height%100 == 0
	if hundredthBlock {
		go s.mempl.RemoveExpiredTransactions(req.Height)
	}

	jailedValidators, err := s.handleDuplicateVoteEvidence(ctx, req)
	if err != nil {
		s.logger.Errorf("could not handle duplicate vote evidence: %v", err)
	} else {
		validatorUpdates = append(validatorUpdates, jailedValidators...)
	}

	return &abcitypes.FinalizeBlockResponse{
		TxResults:        txs,
		AppHash:          nextAppHash,
		ValidatorUpdates: validatorUpdates,
	}, nil
}

func (s *Server) Commit(ctx context.Context, commit *abcitypes.CommitRequest) (*abcitypes.CommitResponse, error) {
	state := s.abciState

	if err := s.commitInProgressTx(ctx); err != nil {
		s.logger.Error("failure to commit tx", "error", err)
		return &abcitypes.CommitResponse{}, err
	}

	// rm txs from mempool
	s.mempl.RemoveBatch(state.finalizedTxs)
	// broadcast txs to subscribers
	for _, txhash := range state.finalizedTxs {
		s.txPubsub.Publish(ctx, txhash, struct{}{})
	}
	// reset abci finalized txs
	state.finalizedTxs = []string{}

	return &abcitypes.CommitResponse{}, nil
}

func (s *Server) ListSnapshots(_ context.Context, snapshots *abcitypes.ListSnapshotsRequest) (*abcitypes.ListSnapshotsResponse, error) {
	return &abcitypes.ListSnapshotsResponse{}, nil
}

func (s *Server) OfferSnapshot(_ context.Context, snapshot *abcitypes.OfferSnapshotRequest) (*abcitypes.OfferSnapshotResponse, error) {
	return &abcitypes.OfferSnapshotResponse{}, nil
}

func (s *Server) LoadSnapshotChunk(_ context.Context, chunk *abcitypes.LoadSnapshotChunkRequest) (*abcitypes.LoadSnapshotChunkResponse, error) {
	return &abcitypes.LoadSnapshotChunkResponse{}, nil
}

func (s *Server) ApplySnapshotChunk(_ context.Context, chunk *abcitypes.ApplySnapshotChunkRequest) (*abcitypes.ApplySnapshotChunkResponse, error) {
	return &abcitypes.ApplySnapshotChunkResponse{Result: abcitypes.APPLY_SNAPSHOT_CHUNK_RESULT_ACCEPT}, nil
}

func (s *Server) ExtendVote(_ context.Context, extend *abcitypes.ExtendVoteRequest) (*abcitypes.ExtendVoteResponse, error) {
	return &abcitypes.ExtendVoteResponse{}, nil
}

func (s *Server) VerifyVoteExtension(_ context.Context, verify *abcitypes.VerifyVoteExtensionRequest) (*abcitypes.VerifyVoteExtensionResponse, error) {
	return &abcitypes.VerifyVoteExtensionResponse{}, nil
}

//////////////////////////////////
//// Utility Methods for ABCI ////
//////////////////////////////////

// returns in current postgres tx for this block
func (s *Server) getDb() *db.Queries {
	return s.db.WithTx(s.abciState.onGoingBlock)
}

func (s *Server) startInProgressTx(ctx context.Context) error {
	dbTx, err := s.pool.Begin(ctx)
	if err != nil {
		return err
	}

	s.abciState.onGoingBlock = dbTx
	return nil
}

// commits the current tx that's finished indexing
func (s *Server) commitInProgressTx(ctx context.Context) error {
	state := s.abciState
	if state.onGoingBlock != nil {
		err := state.onGoingBlock.Commit(ctx)
		if err != nil {
			if errors.Is(err, pgx.ErrTxClosed) {
				state.onGoingBlock = nil
				return nil
			}
			return err
		}
		state.onGoingBlock = nil
	}
	return nil
}

func (s *Server) isValidSignedTransaction(tx []byte) (*core_proto.SignedTransaction, error) {
	var msg core_proto.SignedTransaction
	err := proto.Unmarshal(tx, &msg)
	if err != nil {
		return nil, err
	}
	return &msg, nil
}

func (s *Server) validateBlockTxs(ctx context.Context, blockTime time.Time, blockHeight int64, txs [][]byte) (bool, error) {
	alreadyContainsRollup := false
	for _, tx := range txs {
		signedTx, err := s.isValidSignedTransaction(tx)
		if err != nil {
			s.logger.Error("Invalid block: unrecognized transaction type")
			return false, nil
		}

		switch signedTx.Transaction.(type) {
		case *core_proto.SignedTransaction_Plays:
		case *core_proto.SignedTransaction_ValidatorRegistration:
			if err := s.isValidRegisterNodeTx(ctx, signedTx); err != nil {
				s.logger.Error("Invalid block: invalid register node tx", "error", err)
				return false, nil
			}
		case *core_proto.SignedTransaction_SlaRollup:
			if alreadyContainsRollup {
				s.logger.Error("Invalid block: block already contains rollup")
				return false, nil
			} else if valid, err := s.isValidRollup(ctx, blockTime, blockHeight, signedTx.GetSlaRollup()); err != nil {
				s.logger.Error("Invalid block: error validating sla rollup", "error", err)
				return false, err
			} else if !valid {
				s.logger.Error("Invalid block: invalid rollup")
				return false, nil
			}
			alreadyContainsRollup = true
		}
	}
	return true, nil
}

func (s *Server) finalizeTransaction(ctx context.Context, msg *core_proto.SignedTransaction, txHash string) (proto.Message, error) {
	switch t := msg.Transaction.(type) {
	case *core_proto.SignedTransaction_Plays:
		return s.finalizePlayTransaction(ctx, msg)
	case *core_proto.SignedTransaction_ManageEntity:
		return s.finalizeManageEntity(ctx, msg)
	case *core_proto.SignedTransaction_ValidatorRegistration:
		return s.finalizeRegisterNode(ctx, msg)
	case *core_proto.SignedTransaction_SlaRollup:
		return s.finalizeSlaRollup(ctx, msg, txHash)
	default:
		return nil, fmt.Errorf("unhandled proto event: %v %T", msg, t)
	}
}

func (s *Server) persistTxStat(ctx context.Context, tx proto.Message, txhash string, height int64, blockTime time.Time) error {
	if err := s.getDb().InsertTxStat(ctx, db.InsertTxStatParams{
		TxType:      GetProtoTypeName(tx),
		TxHash:      txhash,
		BlockHeight: height,
		CreatedAt: pgtype.Timestamp{
			Time:  blockTime,
			Valid: true,
		},
	}); err != nil {
		s.logger.Error("error inserting tx stat", "error", err)
	}
	return nil
}

func (s *Server) handleDuplicateVoteEvidence(ctx context.Context, req *abcitypes.FinalizeBlockRequest) (abcitypes.ValidatorUpdates, error) {
	jailedValidators := abcitypes.ValidatorUpdates{}
	jailedValidatorAddrs := []string{}

	page := int(1)
	amountPerPage := int(500)
	currentValidators, err := s.rpc.Validators(ctx, &req.Height, &page, &amountPerPage)
	if err != nil {
		s.logger.Errorf("could not get validators: %v", err)
		return jailedValidators, err
	}

	// if misbehavior found, set power to 0 to remove
	for _, misbehavior := range req.Misbehavior {
		if misbehavior.Type == types.MISBEHAVIOR_TYPE_DUPLICATE_VOTE {
			for _, validator := range currentValidators.Validators {
				if bytes.Equal(misbehavior.Validator.Address, validator.Address) {
					jailedValidators = append(
						jailedValidators,
						abcitypes.ValidatorUpdate{
							Power:       0,
							PubKeyBytes: validator.PubKey.Bytes(),
							PubKeyType:  "ed25519",
						},
					)
					jailedValidatorAddrs = append(jailedValidatorAddrs, validator.Address.String())
				}
			}
		}
	}

	qtx := s.getDb()
	for _, jailedValidatorAddr := range jailedValidatorAddrs {
		if err := qtx.AddJailedNode(ctx, db.AddJailedNodeParams{
			CometAddress: jailedValidatorAddr,
			JailedUntil: pgtype.Int8{
				Int64: req.Height + 1000,
				Valid: true,
			},
		}); err != nil {
			return jailedValidators, fmt.Errorf("could not add jailed node: %v", err)
		}
	}

	return jailedValidators, nil
}

func (s *Server) serializeAppState(prevHash []byte, txs [][]byte) []byte {
	var combinedHash []byte

	combinedHash = append(combinedHash, prevHash...)

	for _, tx := range txs {
		combinedHash = append(combinedHash, tx...)
	}

	newAppHashBytes := sha256.Sum256(combinedHash)
	return newAppHashBytes[:]
}

func (s *Server) toTxHash(msg proto.Message) (string, error) {
	return common.ToTxHash(msg)
}
