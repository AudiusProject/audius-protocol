package server

import "github.com/labstack/echo/v4"

type RegisteredNodeResponse struct {
	Endpoint     string `json:"endpoint"`
	EthAddress   string `json:"ethereum_address"`
	CometAddress string `json:"comet_address"`
}

func (s *Server) getRegisteredNodes(c echo.Context) error {
	ctx := c.Request().Context()

	nodes, err := s.db.GetAllRegisteredNodes(ctx)
	if err != nil {
		return err
	}

	res := []*RegisteredNodeResponse{}
	for _, node := range nodes {
		res = append(res, &RegisteredNodeResponse{
			Endpoint:     node.Endpoint,
			EthAddress:   node.EthAddress,
			CometAddress: node.CometAddress,
		})
	}

	return c.JSON(200, res)
}
