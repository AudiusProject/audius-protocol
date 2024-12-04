package console

import (
	"github.com/labstack/echo/v4"
)

type HealthCheckResponse struct {
	Healthy           bool     `json:"healthy"`
	Errors            []string `json:"errors"`
	TotalBlocks       int64    `json:"totalBlocks"`
	TotalTransactions int64    `json:"totalTransactions"`
	ChainId           string   `json:"chainId"`
	EthAddress        string   `json:"ethAddress"`
	CometAddress      string   `json:"cometAddress"`
}

func (con *Console) getHealth(c echo.Context) error {
	healthy := true
	errs := []string{}
	if con.state.isSyncing {
		healthy = false
		errs = append(errs, "Node is syncing")
	}
	res := HealthCheckResponse{
		Healthy:           healthy,
		Errors:            errs,
		TotalBlocks:       con.state.totalBlocks,
		TotalTransactions: con.state.totalTransactions,
		ChainId:           con.state.chainId,
		EthAddress:        con.state.ethAddress,
		CometAddress:      con.state.cometAddress,
	}
	c.Response().Header().Set("Access-Control-Allow-Origin", "*")
	return c.JSON(200, res)
}
