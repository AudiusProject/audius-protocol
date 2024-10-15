package server

import (
	"net/http"

	"github.com/AudiusProject/audius-protocol/pkg/core/common"
	"github.com/AudiusProject/audius-protocol/pkg/core/config"
	"github.com/AudiusProject/audius-protocol/pkg/core/db"
	cconfig "github.com/cometbft/cometbft/config"
	"github.com/cometbft/cometbft/rpc/client/local"
	"github.com/improbable-eng/grpc-web/go/grpcweb"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/labstack/echo/v4"
)

type Server struct {
	config  *config.Config
	cconfig *cconfig.Config
	logger  *common.Logger
	rpc     *local.Local
	grpcWeb *grpcweb.WrappedGrpcServer
	db      *db.Queries
	self    *http.Client
}

func NewServer(config *config.Config, cconfig *cconfig.Config, logger *common.Logger, rpc *local.Local, pool *pgxpool.Pool, e *echo.Echo, grpcWeb *grpcweb.WrappedGrpcServer) (*Server, error) {
	s := &Server{
		config:  config,
		cconfig: cconfig,
		rpc:     rpc,
		grpcWeb: grpcWeb,
		logger:  logger.Child("http_server"),
		db:      db.New(pool),
		self:    nil,
	}

	g := e.Group("/core")
	s.registerRoutes(g)

	return s, nil
}

func (s *Server) registerRoutes(e *echo.Group) {

	e.GET("/genesis.json", s.getGenesisJSON)
	e.GET("/nodes", s.getRegisteredNodes)
	e.GET("/nodes/verbose", s.getRegisteredNodes)
	e.GET("/nodes/discovery", s.getRegisteredNodes)
	e.GET("/nodes/discovery/verbose", s.getRegisteredNodes)
	e.GET("/nodes/content", s.getRegisteredNodes)
	e.GET("/nodes/content/verbose", s.getRegisteredNodes)
	e.Any("/comet*", s.proxyCometRequest)
	e.Any("/grpc/*", s.proxyGRPCRequest)
}
