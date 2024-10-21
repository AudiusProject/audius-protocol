package console

import (
	"strings"

	"github.com/AudiusProject/audius-protocol/pkg/core/console/views/pages"
	"github.com/AudiusProject/audius-protocol/pkg/core/db"
	"github.com/labstack/echo/v4"
)

func (con *Console) nodePage(c echo.Context) error {
	ctx := c.Request().Context()

	nodeID := c.Param("node")
	node := db.CoreValidator{}

	if strings.HasPrefix(nodeID, "0x") {
		record, err := con.db.GetRegisteredNodeByEthAddress(ctx, nodeID)
		if err != nil {
			return err
		}
		node = record
	} else {
		record, err := con.db.GetRegisteredNodeByCometAddress(ctx, nodeID)
		if err != nil {
			return err
		}
		node = record
	}

	view := &pages.NodePageView{
		Endpoint:     node.Endpoint,
		EthAddress:   node.EthAddress,
		CometAddress: node.CometAddress,
	}

	return con.views.RenderNodeView(c, view)
}

func (con *Console) nodesPage(c echo.Context) error {
	nodes, err := con.db.GetAllRegisteredNodes(c.Request().Context())
	if err != nil {
		return err
	}

	return con.views.RenderNodesView(c, &pages.NodesView{
		Nodes: nodes,
	})
}
