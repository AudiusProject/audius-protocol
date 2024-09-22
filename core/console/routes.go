package console

import (
	"github.com/AudiusProject/audius-protocol/core/common"
	"github.com/AudiusProject/audius-protocol/core/console/middleware"
	"github.com/labstack/echo/v4"
)

func (c *Console) registerRoutes(logger *common.Logger, groups ...*echo.Group) {
	for _, g := range groups {
		g.Use(middleware.JsonExtensionMiddleware)
		g.Use(middleware.ErrorLoggerMiddleware(logger))

		g.GET("", c.overviewPage)
		g.GET("/analytics", c.analyticsPage)
		g.GET("/nodes", c.nodesPage)
		g.GET("/content", c.contentPage)
		g.GET("/uptime", c.uptimePage)

		// g.GET("/blocks", c.blocksPage)
		g.GET("/block/:block", c.blockPage)
		// g.GET("/txs", c.txsPage)
		// g.GET("/tx/:tx", c.txPage)
		//g.GET("/nodes/:node", c.nodePage)
		//g.GET("/content/users", c.usersPage)
		//g.GET("/content/tracks", c.tracksPage)
		//g.GET("/content/plays", c.playsPage)
	}
}
