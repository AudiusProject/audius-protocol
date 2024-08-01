package grpc

import (
	"context"
	"net"

	"github.com/AudiusProject/audius-protocol/core/common"
	"github.com/AudiusProject/audius-protocol/core/config"
	"github.com/AudiusProject/audius-protocol/core/db"
	"github.com/AudiusProject/audius-protocol/core/gen/proto"
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
		logger: logger,
		chain:  chain,
		db:     db.New(pool),
	}

	s := grpc.NewServer()
	proto.RegisterProtocolServer(s, server)
	server.server = s

	return server, nil
}

func (s *GRPCServer) Serve(lis net.Listener) error {
	return s.server.Serve(lis)
}

func (s *GRPCServer) SubmitEvent(_ context.Context, req *proto.SubmitEventRequest) (*proto.SubmitEventResponse, error) {
	// example of message type switching
	switch body := req.Event.GetBody().(type) {
	case *proto.Event_Plays:
		s.logger.Infof("plays event %v", body.Plays.GetPlays())
	default:
		s.logger.Warn("unknown event type")
	}

	txhash, err := SendTx(s.logger, s.chain, req.GetEvent())
	if err != nil {
		return nil, err
	}

	res := &proto.SubmitEventResponse{
		Txhash: txhash,
	}

	return res, nil
}

func (s *GRPCServer) GetEvent(ctx context.Context, req *proto.GetEventRequest) (*proto.GetEventResponse, error) {
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

	var event proto.Event
	err = protob.Unmarshal(txResult.GetTx(), &event)
	if err != nil {
		return nil, err
	}

	res := &proto.GetEventResponse{
		Event: &event,
	}

	return res, nil
}

func (s *GRPCServer) SayHello(ctx context.Context, req *proto.HelloRequest) (*proto.HelloResponse, error) {
	return &proto.HelloResponse{Message: "Hello " + req.Name}, nil
}
