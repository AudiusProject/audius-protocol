package natsd

import (
	"io"
	"math"
	"net/http"
	"time"

	discoveryConfig "comms.audius.co/discovery/config"
	natsConfig "comms.audius.co/natsd/config"
	"comms.audius.co/shared/peering"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

func NatsMain() {
	natsConfig := natsConfig.GetNatsConfig()
	discoveryConfig.Init(natsConfig.PeeringConfig.Keys, natsConfig.PeeringConfig.TestHost)

	{
		var err error
		discoveryConfig.NatsIsReachable, err = selfConnectionProbe(discoveryConfig.IP)
		if err != nil {
			discoveryConfig.Logger.Warn("self connection test error " + err.Error())
		}
	}

	peering := peering.New(&natsConfig.PeeringConfig)

	go startServer(peering)

	peering.PollRegisteredNodes()

	natsman := NatsManager{}
	for n := 0; ; n++ {
		peerMap := peering.Solicit()
		if discoveryConfig.NatsIsReachable {
			natsman.StartNats(peerMap)
		}

		// poll with exponential backoff:
		// 2^n seconds (min 8 max 600 seconds)
		delay := math.Pow(2, float64(n+4))
		if delay > 600 {
			delay = 600
		}
		time.Sleep(time.Second * time.Duration(delay))
	}
}

func startServer(peering *peering.Peering) {
	e := echo.New()
	e.HideBanner = true
	e.Debug = true

	// Middleware
	// e.Use(middleware.Logger())
	e.Use(middleware.Recover())
	e.Use(middleware.CORS())

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
		if resp.Header.Get("Content-Type") == "application/json" {
			body = redactIp(body)
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
		return redactedJson(c, sps)
	})

	e.GET("/nats/peers", func(c echo.Context) error {
		peers := peering.ListPeers()
		for idx, peer := range peers {
			// peer.IP = ""
			peer.NatsRoute = ""
			peers[idx] = peer
		}
		return redactedJson(c, peers)
	})

	e.GET("/nats/self", func(c echo.Context) error {
		return redactedJson(c, map[string]interface{}{
			"is_staging":        peering.Config.IsStaging,
			"is_content":        discoveryConfig.IsCreatorNode,
			"nats_is_reachable": discoveryConfig.NatsIsReachable,
			"nkey":              discoveryConfig.NkeyPublic,
		})
	})

	e.Logger.Fatal(e.Start(":8924"))
}
