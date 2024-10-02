package grpc

import (
	"context"
	"net"

	"github.com/AudiusProject/audius-protocol/pkg/core/common"
	"github.com/AudiusProject/audius-protocol/pkg/core/config"
	"github.com/AudiusProject/audius-protocol/pkg/core/db"
	"github.com/AudiusProject/audius-protocol/pkg/core/gen/proto"
	"github.com/cometbft/cometbft/abci/types"
	"github.com/cometbft/cometbft/rpc/client/local"
	gogo "github.com/cosmos/gogoproto/proto"
	"github.com/jackc/pgx/v5/pgxpool"
	"google.golang.org/grpc"
	protob "google.golang.org/protobuf/proto"
)

type GRPCServer struct {
	logger *common.Logger
	chain  *local.Local
	server *grpc.Server
	db     *db.Queries
	proto.UnimplementedProtocolServer
}

func NewGRPCServer(logger *common.Logger, config *config.Config, chain *local.Local, pool *pgxpool.Pool) (*GRPCServer, error) {
	server := &GRPCServer{
		logger: logger.Child("grpc"),
		chain:  chain,
		db:     db.New(pool),
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

func (s *GRPCServer) Ping(ctx context.Context, req *proto.PingRequest) (*proto.PingResponse, error) {
	return &proto.PingResponse{Message: "pong"}, nil
}
