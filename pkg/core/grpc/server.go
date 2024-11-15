package grpc

import (
	"context"
	"net"
	"strings"

	"github.com/AudiusProject/audius-protocol/pkg/core/common"
	"github.com/AudiusProject/audius-protocol/pkg/core/config"
	"github.com/AudiusProject/audius-protocol/pkg/core/db"
	"github.com/AudiusProject/audius-protocol/pkg/core/gen/proto"
	"github.com/AudiusProject/audius-protocol/pkg/core/mempool"
	"github.com/cometbft/cometbft/abci/types"
	"github.com/cometbft/cometbft/rpc/client/local"
	gogo "github.com/cosmos/gogoproto/proto"
	"github.com/jackc/pgx/v5/pgxpool"
	"google.golang.org/grpc"
	protob "google.golang.org/protobuf/proto"
)

type GRPCServer struct {
	logger  *common.Logger
	chain   *local.Local
	server  *grpc.Server
	db      *db.Queries
	config  *config.Config
	mempool *mempool.Mempool
	proto.UnimplementedProtocolServer
}

func NewGRPCServer(logger *common.Logger, config *config.Config, chain *local.Local, pool *pgxpool.Pool, mempool *mempool.Mempool) (*GRPCServer, error) {
	server := &GRPCServer{
		logger:  logger.Child("grpc"),
		chain:   chain,
		config:  config,
		mempool: mempool,
		db:      db.New(pool),
	}

	s := grpc.NewServer()
	proto.RegisterProtocolServer(s, server)
	server.server = s

	return server, nil
}

func (s *GRPCServer) GetServer() *grpc.Server {
	return s.server
}

func (s *GRPCServer) Serve(lis net.Listener) error {
	return s.server.Serve(lis)
}

func (s *GRPCServer) SendTransaction(_ context.Context, req *proto.SendTransactionRequest) (*proto.TransactionResponse, error) {
	// example of message type switching
	switch body := req.Transaction.GetTransaction().(type) {
	case *proto.SignedTransaction_Plays:
		s.logger.Infof("plays event %v", body.Plays.GetPlays())
	case *proto.SignedTransaction_ManageEntity:
		s.logger.Infof("manage entity %v", body.ManageEntity)
	default:
		s.logger.Warn("unknown event type")
	}

	txhash, err := SendTx(s.logger, s.chain, req.GetTransaction())
	if err != nil {
		return nil, err
	}

	res := &proto.TransactionResponse{
		Txhash:      txhash,
		Transaction: req.GetTransaction(),
	}

	return res, nil
}

func (s *GRPCServer) GetTransaction(ctx context.Context, req *proto.GetTransactionRequest) (*proto.TransactionResponse, error) {
	txhash := req.GetTxhash()

	s.logger.Info("query", "txhash", txhash)

	tx, err := s.db.GetTx(ctx, txhash)
	if err != nil {
		return nil, err
	}

	var txResult types.TxResult
	err = gogo.Unmarshal(tx.TxResult, &txResult)
	if err != nil {
		return nil, err
	}

	var transaction proto.SignedTransaction
	err = protob.Unmarshal(txResult.GetTx(), &transaction)
	if err != nil {
		return nil, err
	}

	res := &proto.TransactionResponse{
		Txhash:      txhash,
		Transaction: &transaction,
	}

	return res, nil
}

func (s *GRPCServer) GetBlock(ctx context.Context, req *proto.GetBlockRequest) (*proto.BlockResponse, error) {
	block, err := s.chain.Block(ctx, &req.Height)
	if err != nil {
		blockInFutureMsg := "must be less than or equal to the current blockchain height"
		if strings.Contains(err.Error(), blockInFutureMsg) {
			// return block with -1 to indicate it doesn't exist yet
			return &proto.BlockResponse{
				Chainid: s.config.GenesisFile.ChainID,
				Height:  -1,
			}, nil
		}
		s.logger.Errorf("error getting block: %v", err)
		return nil, err
	}

	txs := []*proto.SignedTransaction{}
	for _, tx := range block.Block.Txs {
		var transaction proto.SignedTransaction
		err = protob.Unmarshal(tx, &transaction)
		if err != nil {
			return nil, err
		}
		txs = append(txs, &transaction)
	}

	res := &proto.BlockResponse{
		Blockhash:    block.BlockID.Hash.String(),
		Chainid:      s.config.GenesisFile.ChainID,
		Proposer:     block.Block.ProposerAddress.String(),
		Height:       block.Block.Height,
		Transactions: txs,
	}

	return res, nil
}
func (s *GRPCServer) GetNodeInfo(ctx context.Context, req *proto.GetNodeInfoRequest) (*proto.NodeInfoResponse, error) {
	status, err := s.chain.Status(ctx)
	if err != nil {
		return nil, err
	}

	res := &proto.NodeInfoResponse{
		Chainid:       s.config.GenesisFile.ChainID,
		Synced:        !status.SyncInfo.CatchingUp,
		CometAddress:  s.config.ProposerAddress,
		EthAddress:    s.config.WalletAddress,
		CurrentHeight: status.SyncInfo.LatestBlockHeight,
	}
	return res, nil
}

func (s *GRPCServer) Ping(ctx context.Context, req *proto.PingRequest) (*proto.PingResponse, error) {
	return &proto.PingResponse{Message: "pong"}, nil
}
