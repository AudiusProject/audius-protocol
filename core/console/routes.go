package console

import (
	"net/http"

	"github.com/AudiusProject/audius-protocol/core/common"
	"github.com/AudiusProject/audius-protocol/core/console/middleware"
	"github.com/labstack/echo/v4"
)

const baseURL = "/console"

func (c *Console) registerRoutes(logger *common.Logger, e *echo.Echo) {

	g := e.Group(baseURL)

	g.Use(middleware.JsonExtensionMiddleware)
	g.Use(middleware.ErrorLoggerMiddleware(logger, c.views))

	g.GET("", func(ctx echo.Context) error {
		// Redirect to the base group's overview page
		basePath := ctx.Path()
		return ctx.Redirect(http.StatusMovedPermanently, basePath+"/overview")
	})

	// htmx fragments that make up pages derived from routes
	g.GET("/overview", c.overviewPage)
	g.GET("/analytics", c.analyticsPage)
	g.GET("/nodes", c.nodesPage)
	g.GET("/node", c.nodesPage)
	g.GET("/node/:node", c.nodePage)
	g.GET("/content", c.contentFragment)
	g.GET("/uptime", c.uptimeFragment)
	g.GET("/block/:block", c.blockPage)
	g.GET("/tx/:tx", c.txPage)
	g.GET("/genesis", c.genesisPage)

	// future pages
	// g.GET("/blocks", c.blocksPage)
	// g.GET("/txs", c.txsPage)
	//g.GET("/nodes/:node", c.nodePage)
	//g.GET("/content/users", c.usersPage)
	//g.GET("/content/tracks", c.tracksPage)
	//g.GET("/content/plays", c.playsPage)
}
