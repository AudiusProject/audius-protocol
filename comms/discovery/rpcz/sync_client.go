package rpcz

import (
	"errors"
	"fmt"
	"log"
	"time"

	"comms.audius.co/shared/peering"
	"github.com/r3labs/sse/v2"
)

func (c *RPCProcessor) StartSSEClients(peerMap peering.PeerMap) {
	for _, peer := range peerMap {
		go c.sseStart(peer.Host, "/comms/rpc/stream", "comms/rpc/bulk")
	}
}

func (c *RPCProcessor) sseStart(host, streamEndpoint, bulkEndpoint string) {
	for {
		err := c.sseDial(host, streamEndpoint, bulkEndpoint)
		if err != nil {
			log.Println("_______ ____ sse client died", "host", host, "err", err)
		}
		time.Sleep(time.Second * 2)
	}
}

func (c *RPCProcessor) sseDial(host, streamEndpoint, bulkEndpoint string) error {
	logger := logger.New("client_of", host)
	logger.Debug("creating client")

	endpoint := host + streamEndpoint
	client := sse.NewClient(endpoint)

	events := make(chan *sse.Event, 64)
	err := client.SubscribeChan("rpcs", events)
	if err != nil {
		return fmt.Errorf("subscribe chan failed: %v", err)
	}

	client.OnConnect(func(c *sse.Client) {
		logger.Debug("sse connected")
	})

	client.OnDisconnect(func(c *sse.Client) {
		logger.Warn("sse disconnected !!!!")
	})

	// resume from
	// var lastUlid string
	// row := c.DB.Table("ops").Where("host = ?", host).Select("max(ulid)").Row()
	// row.Scan(&lastUlid)
	// logger.Debug("starting backfill", "last_ulid", lastUlid)

	// err = c.clientBackfill(host, bulkEndpoint, lastUlid)
	// if err != nil {
	// 	return fmt.Errorf("backfill failed: %v", err)
	// }

	logger.Debug("processing events")
	for {

		select {
		case e := <-events:
			// var op *Op
			// err := json.Unmarshal(e.Data, &op)
			// if err != nil {
			// 	logger.Warn("bad event json: " + string(e.Data))
			// 	continue
			// }

			// err = c.apply(op)
			// if err != nil {
			// 	logger.Warn("apply failed", "err", err)
			// }

			fmt.Println("__________ GOT SSE", e)

		case <-time.After(600 * time.Second):
			return errors.New("health timeout")
		}
	}

}
