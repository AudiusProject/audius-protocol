package server

import (
	"mediorum/crudr"

	"github.com/labstack/echo/v4"
)

func (ss *MediorumServer) getCrudStream(c echo.Context) error {
	w := c.Response()
	r := c.Request()

	go func() {
		// Received Browser Disconnection
		<-r.Context().Done()
		ss.logger.Info("sse client connection closed", "ip", r.RemoteAddr)
	}()

	ss.crud.SSEServer.ServeHTTP(w, r)
	return nil
}

func (ss *MediorumServer) getCrudBulk(c echo.Context) error {
	after := c.QueryParam("after")
	var ops []*crudr.Op
	ss.crud.DB.Unscoped().
		Where("host = ? AND ulid > ?", ss.Config.Self.Host, after).
		Find(&ops)
	return c.JSON(200, ops)
}
