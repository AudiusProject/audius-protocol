package console

import (
	"net/http"

	"github.com/AudiusProject/audius-protocol/core/common"
	"github.com/AudiusProject/audius-protocol/core/console/middleware"
	"github.com/labstack/echo/v4"
)

const baseURL = "/console"
const fragmentURL = "/fragment"
const fragmentBaseURL = baseURL + fragmentURL

func (c *Console) registerRoutes(logger *common.Logger, e *echo.Echo) {

	g := e.Group(baseURL)
	fg := e.Group(fragmentBaseURL)

	g.Use(middleware.JsonExtensionMiddleware)
	g.Use(middleware.ErrorLoggerMiddleware(logger))

	g.GET("", func(ctx echo.Context) error {
		// Redirect to the base group's overview page
		basePath := ctx.Path()
		return ctx.Redirect(http.StatusMovedPermanently, basePath+"/overview")
	})

	g.GET("/block/:block", c.blockFragment)

	// htmx fragments that make up pages derived from routes
	fg.GET("/overview", c.overviewFragment)
	fg.GET("/analytics", c.analyticsFragment)
	fg.GET("/nodes", c.nodesFragment)
	fg.GET("/content", c.contentFragment)
	fg.GET("/uptime", c.uptimeFragment)
	fg.GET("/block/:block", c.blockFragment)

	// future pages
	// g.GET("/blocks", c.blocksPage)
	// g.GET("/txs", c.txsPage)
	// g.GET("/tx/:tx", c.txPage)
	//g.GET("/nodes/:node", c.nodePage)
	//g.GET("/content/users", c.usersPage)
	//g.GET("/content/tracks", c.tracksPage)
	//g.GET("/content/plays", c.playsPage)
}
