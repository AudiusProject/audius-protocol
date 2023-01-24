package natsd

import (
	"io"
	"net/http"
	"time"

	"comms.audius.co/discovery/config"
	"comms.audius.co/shared/peering"
	"github.com/labstack/echo/v4"
)

func NatsMain() {
	config.Init()
	peering.PollRegisteredNodes()

	go startServer()

	natsman := NatsManager{}
	for {
		peerMap := peering.Solicit()
		natsman.StartNats(peerMap)
		time.Sleep(time.Minute * 2)
	}
}

func startServer() {
	e := echo.New()
	e.HideBanner = true
	e.Debug = true

	proxyNats := func(c echo.Context) error {
		resp, err := http.Get("http://localhost:8222/" + c.Param("info"))
		if err != nil {
			return err
		}
		defer resp.Body.Close()
		body, err := io.ReadAll(resp.Body)
		if err != nil {
			return err
		}
		return c.Blob(resp.StatusCode, resp.Header.Get("Content-Type"), body)
	}

	e.GET("/nats", func(c echo.Context) error {
		return c.Redirect(302, "/nats/")
	})

	e.GET("/nats/", proxyNats)

	e.GET("/nats/:info", proxyNats)

	e.POST("/nats/exchange", peering.ExchangeEndpoint)

	e.GET("/nats/sps", func(c echo.Context) error {
		sps, err := peering.AllNodes()
		if err != nil {
			return err
		}
		return c.JSON(200, sps)
	})

	e.GET("/nats/peers", func(c echo.Context) error {
		peers := peering.ListPeers()
		for idx, peer := range peers {
			// peer.IP = ""
			peer.NatsRoute = ""
			peers[idx] = peer
		}
		return c.JSON(200, peers)
	})

	e.Logger.Fatal(e.Start(":8924"))
}
