// implementation of the grpc service definition found in the audius protocol.proto spec
package server

import (
	"context"
	"errors"
	"fmt"
	"net"
	"reflect"
	"strings"
	"time"

	"github.com/AudiusProject/audius-protocol/pkg/core/common"
	"github.com/AudiusProject/audius-protocol/pkg/core/gen/core_proto"
	"github.com/cometbft/cometbft/abci/types"
	gogo "github.com/cosmos/gogoproto/proto"
	"github.com/iancoleman/strcase"
	"google.golang.org/grpc"
	"google.golang.org/protobuf/proto"
)

var (
	TrackPlaysProtoName     string
	ManageEntitiesProtoName string
	SlaRollupProtoName      string
	SlaNodeReportProtoName  string
)

func init() {
	TrackPlaysProtoName = GetProtoTypeName(&core_proto.TrackPlays{})
	ManageEntitiesProtoName = GetProtoTypeName(&core_proto.ManageEntityLegacy{})
	SlaRollupProtoName = GetProtoTypeName(&core_proto.SlaRollup{})
	SlaNodeReportProtoName = GetProtoTypeName(&core_proto.SlaNodeReport{})
}

func GetProtoTypeName(msg proto.Message) string {
	return strcase.ToSnake(reflect.TypeOf(msg).Elem().Name())
}

func (s *Server) SendTransaction(ctx context.Context, req *core_proto.SendTransactionRequest) (*core_proto.TransactionResponse, error) {
	// TODO: do validation check
	txhash, err := common.ToTxHash(req.GetTransaction())
	if err != nil {
		return nil, fmt.Errorf("could not get tx hash of signed tx: %v", err)
	}

	// TODO: use data companion to keep this value up to date via channel
	status, err := s.rpc.Status(ctx)
	if err != nil {
		return nil, fmt.Errorf("chain not healthy: %v", err)
	}

	deadline := status.SyncInfo.LatestBlockHeight + 10
	mempoolTx := &MempoolTransaction{
		Tx:       req.GetTransaction(),
		Deadline: deadline,
	}

	ps := s.txPubsub

	txHashCh := ps.Subscribe(txhash)
	defer ps.Unsubscribe(txhash, txHashCh)

	s.logger.Infof("adding tx: %v", req.Transaction)

	// add transaction to mempool with broadcast set to true
	err = s.mempl.AddTransaction(txhash, mempoolTx, true)
	if err != nil {
		s.logger.Errorf("tx could not be included in mempool %s: %v", txhash, err)
		return nil, fmt.Errorf("could not add tx to mempool %v", err)
	}

	select {
	case <-txHashCh:
		return &core_proto.TransactionResponse{
			Txhash:      txhash,
			Transaction: req.GetTransaction(),
		}, nil
	case <-time.After(30 * time.Second):
		s.logger.Errorf("tx timeout waiting to be included %s", txhash)
		return nil, errors.New("tx waiting timeout")
	}
}

func (s *Server) ForwardTransaction(ctx context.Context, req *core_proto.ForwardTransactionRequest) (*core_proto.ForwardTransactionResponse, error) {
	// TODO: check signature from known node

	// TODO: validate transaction in same way as send transaction

	mempoolKey, err := common.ToTxHash(req.GetTransaction())
	if err != nil {
		return nil, fmt.Errorf("could not get tx hash of signed tx: %v", err)
	}

	s.logger.Debugf("received forwarded tx: %v", req.Transaction)

	// TODO: intake block deadline from request
	status, err := s.rpc.Status(ctx)
	if err != nil {
		return nil, fmt.Errorf("chain not healthy: %v", err)
	}

	deadline := status.SyncInfo.LatestBlockHeight + 10
	mempoolTx := &MempoolTransaction{
		Tx:       req.GetTransaction(),
		Deadline: deadline,
	}

	err = s.mempl.AddTransaction(mempoolKey, mempoolTx, false)
	if err != nil {
		return nil, fmt.Errorf("could not add tx to mempool %v", err)
	}

	return &core_proto.ForwardTransactionResponse{}, nil
}

func (s *Server) GetTransaction(ctx context.Context, req *core_proto.GetTransactionRequest) (*core_proto.TransactionResponse, error) {
	txhash := req.GetTxhash()

	s.logger.Debug("query", "txhash", txhash)

	tx, err := s.db.GetTx(ctx, txhash)
	if err != nil {
		return nil, err
	}

	var txResult types.TxResult
	err = gogo.Unmarshal(tx.TxResult, &txResult)
	if err != nil {
		return nil, err
	}

	var transaction core_proto.SignedTransaction
	err = proto.Unmarshal(txResult.GetTx(), &transaction)
	if err != nil {
		return nil, err
	}

	res := &core_proto.TransactionResponse{
		Txhash:      txhash,
		Transaction: &transaction,
	}

	return res, nil
}

func (s *Server) GetBlock(ctx context.Context, req *core_proto.GetBlockRequest) (*core_proto.BlockResponse, error) {
	block, err := s.rpc.Block(ctx, &req.Height)
	if err != nil {
		blockInFutureMsg := "must be less than or equal to the current blockchain height"
		if strings.Contains(err.Error(), blockInFutureMsg) {
			// return block with -1 to indicate it doesn't exist yet
			return &core_proto.BlockResponse{
				Chainid: s.config.GenesisFile.ChainID,
				Height:  -1,
			}, nil
		}
		s.logger.Errorf("error getting block: %v", err)
		return nil, err
	}

	txs := []*core_proto.SignedTransaction{}
	for _, tx := range block.Block.Txs {
		var transaction core_proto.SignedTransaction
		err = proto.Unmarshal(tx, &transaction)
		if err != nil {
			return nil, err
		}
		txs = append(txs, &transaction)
	}

	res := &core_proto.BlockResponse{
		Blockhash:    block.BlockID.Hash.String(),
		Chainid:      s.config.GenesisFile.ChainID,
		Proposer:     block.Block.ProposerAddress.String(),
		Height:       block.Block.Height,
		Transactions: txs,
	}

	return res, nil
}
func (s *Server) GetNodeInfo(ctx context.Context, req *core_proto.GetNodeInfoRequest) (*core_proto.NodeInfoResponse, error) {
	status, err := s.rpc.Status(ctx)
	if err != nil {
		return nil, err
	}

	res := &core_proto.NodeInfoResponse{
		Chainid:       s.config.GenesisFile.ChainID,
		Synced:        !status.SyncInfo.CatchingUp,
		CometAddress:  s.config.ProposerAddress,
		EthAddress:    s.config.WalletAddress,
		CurrentHeight: status.SyncInfo.LatestBlockHeight,
	}
	return res, nil
}

func (s *Server) Ping(ctx context.Context, req *core_proto.PingRequest) (*core_proto.PingResponse, error) {
	return &core_proto.PingResponse{Message: "pong"}, nil
}

func (s *Server) startGRPC() error {
	s.logger.Info("core gRPC server starting")

	grpcLis, err := net.Listen("tcp", s.config.GRPCladdr)
	if err != nil {
		return fmt.Errorf("grpc listener not created: %v", err)
	}

	gs := grpc.NewServer()
	core_proto.RegisterProtocolServer(gs, s)
	s.grpcServer = gs

	return gs.Serve(grpcLis)
}
