package server

import "github.com/labstack/echo/v4"

func (ss *MediorumServer) getMyHealth(c echo.Context) error {
	return c.JSON(200, ss.healthReport())
}

func (ss *MediorumServer) getPeerHealth(c echo.Context) error {
	peers := []*ServerHealth{}
	ss.crud.DB.Find(&peers)
	healthyPeers, _ := ss.findHealthyPeers("2 minutes")
	return c.JSON(200, map[string]any{
		"peers":   peers,
		"healthy": healthyPeers,
	})
}
