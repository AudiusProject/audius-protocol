// implementation of the grpc service definition found in the audius protocol.proto spec
package server

import (
	"fmt"
	"net"
)

func (s *Server) startGRPC() error {
	s.logger.Info("core gRPC server starting")

	grpcLis, err := net.Listen("tcp", s.config.GRPCladdr)
	if err != nil {
		return fmt.Errorf("grpc listener not created: %v", err)
	}

	return s.grpcServer.Serve(grpcLis)
}
