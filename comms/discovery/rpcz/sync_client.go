package rpcz

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"strings"
	"time"

	"comms.audius.co/shared/peering"
	"github.com/nats-io/nats.go"
	"github.com/r3labs/sse/v2"
)

type RpcSseMessage struct {
	Header map[string][]string
	Data   json.RawMessage
}

func (c *RPCProcessor) StartSSEClients(peerMap peering.PeerMap) {
	for _, peer := range peerMap {
		// todo: better way to get discovery peers
		if !strings.Contains(peer.Host, "discovery") {
			log.Println("skipping non discovery node", peer.Host)
			continue
		}
		if peer.IsSelf {
			log.Println("skipping self", peer)
			continue
		}
		go c.sseStart(peer.Host, "/comms/rpc/stream", "comms/rpc/bulk")
	}
}

func (c *RPCProcessor) sseStart(host, streamEndpoint, bulkEndpoint string) {
	for {
		err := c.sseDial(host, streamEndpoint, bulkEndpoint)
		if err != nil {
			log.Println("SSE client died !!", "host", host, "err", err)
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
	err := client.SubscribeChan(sseStreamName, events)
	if err != nil {
		return fmt.Errorf("subscribe chan failed: %v", err)
	}

	client.OnConnect(func(c *sse.Client) {
		logger.Debug("sse connected")
	})

	client.OnDisconnect(func(c *sse.Client) {
		logger.Warn("sse disconnected !!!!")
	})

	// todo: backfill on boot
	// using bulkEndpoint
	// see mediorum crudr client code

	logger.Debug("processing events")
	for {

		select {
		case e := <-events:
			var msg *nats.Msg
			err := json.Unmarshal(e.Data, &msg)
			if err != nil {
				logger.Warn("bad event json: " + string(e.Data))
				continue
			}

			log.Println("GOT SSE", string(e.Data))

			c.Apply(msg)

			// todo: apply should return error
			// if err != nil {
			// 	logger.Warn("apply failed", "err", err)
			// }

		case <-time.After(600 * time.Second):
			return errors.New("health timeout")
		}
	}

}
