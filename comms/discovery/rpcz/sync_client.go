package rpcz

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"strings"
	"time"

	"comms.audius.co/discovery/config"
	"comms.audius.co/discovery/db"
	"comms.audius.co/discovery/schema"
	"comms.audius.co/discovery/the_graph"
	"golang.org/x/exp/slog"
)

type RpcSseMessage struct {
	Header map[string][]string
	Data   json.RawMessage
}

func (c *RPCProcessor) StartSSEClients(discoveryConfig *config.DiscoveryConfig, peerList []the_graph.Peer) {
	for _, peer := range peerList {
		if strings.EqualFold(peer.Wallet, discoveryConfig.MyWallet) {
			log.Println("skipping self", peer)
			continue
		}
		if peer.Host == "" {
			log.Println("bad peer", peer)
			continue
		}

		go c.startPullCursor(peer.Host, "/comms/rpc/bulk")
	}
}

func (c *RPCProcessor) startPullCursor(host, bulkEndpoint string) {
	for {
		err := c.doPull(host, bulkEndpoint)
		if err != nil {
			log.Println("PULL ERR", host, err)
		}
		time.Sleep(time.Minute)
	}
}

func (c *RPCProcessor) doPull(host, bulkEndpoint string) error {

	// get cursor
	var after time.Time
	err := db.Conn.Get(&after, "SELECT relayed_at FROM rpc_cursor WHERE relayed_by=$1", host)
	if err != nil {
		log.Println("backfill failed to get cursor: ", err)
	} else {
		log.Println("backfill", host, "after", after)
	}

	endpoint := host + bulkEndpoint + "?after=" + url.QueryEscape(after.Format(time.RFC3339))
	started := time.Now()

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

	var cursor time.Time
	for _, op := range ops {
		err := c.Apply(op)
		if err != nil {
			// todo: what to do when op apply fails during backfill???
			// with cursor we'll not see this row again...
			//  retry locally?
			//  save to dead letter table?
			//  periodically re-do all?
			fmt.Println(err)
		}
		cursor = op.RelayedAt
	}

	slog.Info("backfill done", "host", host, "took", time.Since(started), "count", len(ops), "cursor", cursor)

	q := `insert into rpc_cursor values ($1, $2) on conflict (relayed_by) do update set relayed_at = $2;`
	_, err = db.Conn.Exec(q, host, cursor)
	return err
}
