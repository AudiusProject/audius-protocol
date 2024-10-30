package serviceproxy

import "github.com/labstack/echo/v4"

type ProxyServer struct {
	// address -> nil just for constant access
	registeredNodes map[string]struct{}
	directProxy     DirectProxy
}

func NewProxyServer(registeredNodes map[string]struct{},
	directProxy DirectProxy) *ProxyServer {
	return &ProxyServer{
		registeredNodes: registeredNodes,
		directProxy:     directProxy,
	}
}

func (ps *ProxyServer) GetIPDataRoute(c echo.Context) error {
	// TODO: check signature

	ip := c.Param("ip")

	res, err := ps.directProxy.GetIPData(ip)
	if err != nil {
		return err
	}

	return c.JSON(200, res)
}
