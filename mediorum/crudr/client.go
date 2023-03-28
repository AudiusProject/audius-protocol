package crudr

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"time"

	"github.com/r3labs/sse/v2"
)

func (c *Crudr) NewClient(host, streamEndpoint, bulkEndpoint string) {
	for {
		err := c.newClient(host, streamEndpoint, bulkEndpoint)
		if err != nil {
			c.logger.Warn("sse client died", "host", host, "err", err)
		}
		time.Sleep(time.Second * 5)
	}
}

func (c *Crudr) newClient(host, streamEndpoint, bulkEndpoint string) error {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	logger := c.logger.New("client_of", host)
	logger.Debug("creating client")

	endpoint := host + streamEndpoint
	client := sse.NewClient(endpoint)

	transport := http.DefaultTransport.(*http.Transport).Clone()
	transport.MaxConnsPerHost = 10
	client.Connection.Transport = transport

	events := make(chan *sse.Event, 64)
	err := client.SubscribeChanWithContext(ctx, LocalStreamName, events)
	if err != nil {
		return fmt.Errorf("subscribe chan failed: %v", err)
	}
	defer client.Unsubscribe(events)

	client.OnConnect(func(c *sse.Client) {
		logger.Debug("sse connected")
	})

	client.OnDisconnect(func(c *sse.Client) {
		logger.Warn("sse disconnected !!!!")
	})

	// resume from
	var lastUlid string
	row := c.DB.Table("ops").Where("host = ?", host).Select("max(ulid)").Row()
	row.Scan(&lastUlid)
	logger.Debug("starting backfill", "last_ulid", lastUlid)

	err = c.clientBackfill(host, bulkEndpoint, lastUlid)
	if err != nil {
		return fmt.Errorf("backfill failed: %v", err)
	}

	logger.Debug("processing events")
	for {

		select {
		case e := <-events:
			var op *Op
			err := json.Unmarshal(e.Data, &op)
			if err != nil {
				logger.Warn("bad event json: " + string(e.Data))
				continue
			}

			err = c.apply(op)
			if err != nil {
				logger.Warn("apply failed", "err", err)
			}

		case <-time.After(30 * time.Second):
			return errors.New("health timeout")
		}
	}

}

func (c *Crudr) clientBackfill(host, bulkEndpoint, lastUlid string) error {

	endpoint := host + bulkEndpoint + "?after=" + lastUlid

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

	var ops []*Op
	dec := json.NewDecoder(resp.Body)
	err = dec.Decode(&ops)
	if err != nil {
		return err
	}

	for _, op := range ops {
		err := c.apply(op)
		if err != nil {
			fmt.Println(err)
		}
	}

	c.logger.Debug("backfill done", "host", host, "count", len(ops))

	return nil
}
