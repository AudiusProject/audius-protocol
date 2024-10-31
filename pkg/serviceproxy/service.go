package serviceproxy

import "github.com/labstack/echo/v4"

type ProxyRoutes struct {
	// address -> nil just for constant access
	registeredNodes map[string]struct{}
	directProxy     DirectProxy
}

func NewProxyRoutes(registeredNodes map[string]struct{},
	directProxy DirectProxy) *ProxyRoutes {
	return &ProxyRoutes{
		registeredNodes: registeredNodes,
		directProxy:     directProxy,
	}
}

func (ps *ProxyRoutes) GetIPDataRoute(c echo.Context) error {
	if err := validateProxyRequest(c, ps.registeredNodes); err != nil {
		return err
	}

	ip := c.Param("ip")

	res, err := ps.directProxy.GetIPData(ip)
	if err != nil {
		return err
	}

	return c.JSON(200, res)
}
