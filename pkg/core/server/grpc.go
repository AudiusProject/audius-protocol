package server

import "github.com/labstack/echo/v4"

func (s *Server) proxyGRPCRequest(c echo.Context) error {
	req := c.Request()
	resp := c.Response().Writer

	grpcWeb := s.grpcWeb

	if grpcWeb.IsGrpcWebRequest(req) || grpcWeb.IsAcceptableGrpcCorsRequest(req) {
		grpcWeb.ServeHTTP(resp, req)
		return nil
	}

	return echo.ErrNotFound
}
