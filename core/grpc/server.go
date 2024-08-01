package grpc

import (
	"context"
	"net"

	"github.com/AudiusProject/audius-protocol/core/common"
	"github.com/AudiusProject/audius-protocol/core/config"
	"github.com/AudiusProject/audius-protocol/core/gen/proto"
	"github.com/cometbft/cometbft/rpc/client/local"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type GRPCServer struct {
	logger *common.Logger
	chain  *local.Local
	server *grpc.Server
	proto.UnimplementedProtocolServer
}

func NewGRPCServer(logger *common.Logger, config *config.Config, chain *local.Local) (*GRPCServer, error) {
	server := &GRPCServer{
		logger: logger,
		chain:  chain,
	}

	s := grpc.NewServer()
	proto.RegisterProtocolServer(s, server)
	server.server = s

	return server, nil
}

func (s *GRPCServer) Serve(lis net.Listener) error {
	return s.server.Serve(lis)
}

func (s *GRPCServer) SubmitEvent(_ context.Context, event *proto.SubmitEventRequest) (*proto.SubmitEventResponse, error) {
	// example of message type switching
	switch body := event.Event.GetBody().(type) {
	case *proto.Event_Plays:
		s.logger.Infof("plays event %v", body.Plays.GetPlays())
	default:
		s.logger.Warn("unknown event type")
	}

	err := SendTx(s.logger, s.chain, event)
	if err != nil {
		return nil, err
	}
	return nil, status.Errorf(codes.Unimplemented, "method SubmitEvent not implemented")
}

func (s *GRPCServer) GetEvent(context.Context, *proto.GetEventRequest) (*proto.GetEventResponse, error) {
	return nil, status.Errorf(codes.Unimplemented, "method GetEvent not implemented")
}

func (s *GRPCServer) SayHello(ctx context.Context, req *proto.HelloRequest) (*proto.HelloResponse, error) {
	return &proto.HelloResponse{Message: "Hello " + req.Name}, nil
}
