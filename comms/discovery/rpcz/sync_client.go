package rpcz

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"time"

	"comms.audius.co/discovery/config"
	"comms.audius.co/discovery/db"
	"comms.audius.co/discovery/schema"
	"comms.audius.co/shared/signing"
	"github.com/avast/retry-go"
	"golang.org/x/exp/slog"
)

type RpcSseMessage struct {
	Header map[string][]string
	Data   json.RawMessage
}

func (c *RPCProcessor) StartSweepers(discoveryConfig *config.DiscoveryConfig) {
	for _, peer := range discoveryConfig.Peers() {
		if strings.EqualFold(peer.Wallet, discoveryConfig.MyWallet) {
			continue
		}
		if peer.Host == "" {
			slog.Info("bad peer", "peer", peer)
			continue
		}

		go c.startSweeper(peer.Host, "/comms/rpc/bulk")
	}
}

func (c *RPCProcessor) startSweeper(host, bulkEndpoint string) {
	for {
		err := c.doSweep(host, bulkEndpoint)
		if err != nil {
			slog.Error("sweep error", err, "host", host)
		}
		time.Sleep(time.Minute)
	}
}

func (c *RPCProcessor) doSweep(host, bulkEndpoint string) error {

	// get cursor
	var after time.Time

	err := db.Conn.Get(&after, "SELECT relayed_at FROM rpc_cursor WHERE relayed_by=$1", host)
	if err != nil {
		slog.Error("backfill failed to get cursor: ", err)
	}

	endpoint := host + bulkEndpoint + "?after=" + url.QueryEscape(after.Format(time.RFC3339Nano))
	started := time.Now()

	req, err := http.NewRequest("GET", endpoint, nil)
	if err != nil {
		return err
	}

	// add header for signed nonce
	req.Header.Add("Authorization", signing.BasicAuthNonce(c.discoveryConfig.MyPrivateKey))

	client := &http.Client{
		Timeout: time.Minute,
	}

	resp, err := client.Do(req)
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
		// if apply fails during sweep
		// it could be because discovery indexer is behind
		// retry locally and only advance cursor on success
		err := retry.Do(
			func() error {
				return c.Apply(op)
			},
			retry.Delay(time.Second),
			retry.MaxDelay(time.Second*5))
		if err != nil {
			slog.Error("sweep error", err)
		} else {
			cursor = op.RelayedAt
		}
	}

	if len(ops) > 0 {
		slog.Info("backfill done", "host", host, "took", time.Since(started), "count", len(ops), "cursor", cursor)

		q := `insert into rpc_cursor values ($1, $2) on conflict (relayed_by) do update set relayed_at = $2;`
		_, err = db.Conn.Exec(q, host, cursor)
		return err
	}

	return nil
}
