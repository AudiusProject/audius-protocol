package rpcz

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"comms.audius.co/discovery/schema"
	"comms.audius.co/shared/peering"
	"github.com/r3labs/sse/v2"
	"golang.org/x/exp/slog"
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
		go c.sseStart(peer.Host, "/comms/rpc/stream", "/comms/rpc/bulk")
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

	// backfill on boot
	err = c.sseBackfill(host, bulkEndpoint)
	if err != nil {
		return fmt.Errorf("sse backfill failed: %v", err)
	}

	logger.Debug("processing events")
	for {

		select {
		case e := <-events:

			// check for ping
			if bytes.HasPrefix(e.Data, []byte("ping: ")) {
				timeString := strings.Replace(string(e.Data), "ping: ", "", 1)
				theirTime, err := time.Parse(time.RFC3339, timeString)
				if err != nil {
					log.Println("invalid ping time", string(e.Data))
				} else {
					log.Println("ping from", host, "skew", time.Since(theirTime))
				}
				continue
			}

			log.Println("GOT SSE", string(e.Data))

			var msg *schema.RpcLog
			err := json.Unmarshal(e.Data, &msg)
			if err != nil {
				logger.Warn("bad event json: " + string(e.Data))
				continue
			}

			err = c.Apply(msg)
			if err != nil {
				logger.Warn("apply failed", "err", err)
			}

		case <-time.After(45 * time.Second):
			return errors.New("health timeout")
		}
	}
}

func (c *RPCProcessor) sseBackfill(host, bulkEndpoint string) error {
	endpoint := host + bulkEndpoint // todo: + "?after=" + lastUlid

	client := &http.Client{
		Timeout: time.Minute,
	}

	resp, err := client.Get(endpoint)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return fmt.Errorf("bad status: %d", resp.StatusCode)
	}

	var ops []*schema.RpcLog
	dec := json.NewDecoder(resp.Body)
	err = dec.Decode(&ops)
	if err != nil {
		return err
	}

	for _, op := range ops {
		err := c.Apply(op)
		if err != nil {
			fmt.Println(err)
		}
	}

	slog.Info("backfill done", "host", host, "count", len(ops))

	return nil
}
