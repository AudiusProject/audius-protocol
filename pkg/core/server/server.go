package server

import (
	"net/http"
	"net/http/pprof"

	"github.com/AudiusProject/audius-protocol/pkg/core/common"
	"github.com/AudiusProject/audius-protocol/pkg/core/config"
	"github.com/AudiusProject/audius-protocol/pkg/core/db"
	"github.com/AudiusProject/audius-protocol/pkg/core/mempool"
	cconfig "github.com/cometbft/cometbft/config"
	"github.com/cometbft/cometbft/rpc/client/local"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/labstack/echo/v4"
)

type Server struct {
	config  *config.Config
	cconfig *cconfig.Config
	logger  *common.Logger
	rpc     *local.Local
	db      *db.Queries
	self    *http.Client
	mempl   *mempool.Mempool
}

func NewServer(config *config.Config, cconfig *cconfig.Config, logger *common.Logger, rpc *local.Local, pool *pgxpool.Pool, e *echo.Echo, mempl *mempool.Mempool) (*Server, error) {
	s := &Server{
		config:  config,
		cconfig: cconfig,
		rpc:     rpc,
		logger:  logger.Child("http_server"),
		db:      db.New(pool),
		mempl:   mempl,
		self:    nil,
	}

	g := e.Group("/core")
	s.registerRoutes(g)

	return s, nil
}

func (s *Server) registerRoutes(e *echo.Group) {
	/** routes **/
	e.GET("/nodes", s.getRegisteredNodes)
	e.GET("/nodes/verbose", s.getRegisteredNodes)
	e.GET("/nodes/discovery", s.getRegisteredNodes)
	e.GET("/nodes/discovery/verbose", s.getRegisteredNodes)
	e.GET("/nodes/content", s.getRegisteredNodes)
	e.GET("/nodes/content/verbose", s.getRegisteredNodes)
	e.Any("/comet*", s.proxyCometRequest)

	/** debugging endpoints **/
	e.GET("/debug/mempl", s.getMempl)
	e.GET("/debug/pprof/", echo.WrapHandler(http.HandlerFunc(pprof.Index)))
	e.GET("/debug/pprof/cmdline", echo.WrapHandler(http.HandlerFunc(pprof.Cmdline)))
	e.GET("/debug/pprof/profile", echo.WrapHandler(http.HandlerFunc(pprof.Profile)))
	e.GET("/debug/pprof/symbol", echo.WrapHandler(http.HandlerFunc(pprof.Symbol)))
	e.POST("/debug/pprof/symbol", echo.WrapHandler(http.HandlerFunc(pprof.Symbol)))
	e.GET("/debug/pprof/trace", echo.WrapHandler(http.HandlerFunc(pprof.Trace)))
	e.GET("/debug/pprof/heap", echo.WrapHandler(pprof.Handler("heap")))
	e.GET("/debug/pprof/goroutine", echo.WrapHandler(pprof.Handler("goroutine")))
	e.GET("/debug/pprof/threadcreate", echo.WrapHandler(pprof.Handler("threadcreate")))
	e.GET("/debug/pprof/block", echo.WrapHandler(pprof.Handler("block")))
}
