package rpcz

import (
	"bytes"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"time"

	"comms.audius.co/discovery/db"
	"comms.audius.co/discovery/schema"
	"comms.audius.co/shared/signing"
	"github.com/avast/retry-go"
	"golang.org/x/exp/slog"
)

type PeerClient struct {
	Host   string
	outbox chan []byte
	proc   *RPCProcessor
	logger *slog.Logger

	err error
}

func NewPeerClient(host string, proc *RPCProcessor) *PeerClient {
	// buffer up to N outgoing messages
	// if full, Send will drop outgoing message
	// which is okay because of sweep
	outboxBufferSize := 8

	return &PeerClient{
		Host:   host,
		proc:   proc,
		outbox: make(chan []byte, outboxBufferSize),
		logger: slog.With("peer", host),
	}
}

func (p *PeerClient) Start() {
	// todo: should be able to stop these
	go p.startSender()
	go p.startSweeper()
}

func (p *PeerClient) Send(data []byte) bool {
	select {
	case p.outbox <- data:
		return true
	default:
		p.logger.Info("outbox full, dropping message", "msg", string(data), "len", len(p.outbox), "cap", cap(p.outbox))
		return false
	}
}

// sender goroutine will POST signed messages to peers (push)
func (p *PeerClient) startSender() {
	httpClient := http.Client{
		Timeout: 5 * time.Second,
	}
	for data := range p.outbox {
		endpoint := p.Host + "/comms/rpc/receive" // hardcoded
		req := signing.SignedPost(
			endpoint,
			"application/json",
			bytes.NewReader(data),
			p.proc.discoveryConfig.MyPrivateKey)

		resp, err := httpClient.Do(req)
		if err != nil {
			log.Println("push failed", "host", p.Host, "err", err)
			continue
		}

		if resp.StatusCode != 200 {
			log.Println("push bad status", "host", p.Host, "status", resp.StatusCode)
		}

		resp.Body.Close()
	}
}

// sweeper goroutine will pull messages on interval
func (c *PeerClient) startSweeper() {
	for i := 0; ; i++ {
		c.err = c.doSweep(i)
		if c.err != nil {
			c.logger.Error("sweep error", c.err)
			// if broken... add extra sleep
			time.Sleep(time.Minute * 2)
		}
		time.Sleep(time.Minute)
	}
}

func (c *PeerClient) doSweep(i int) error {
	host := c.Host
	bulkEndpoint := "/comms/rpc/bulk"

	// get cursor

	var after time.Time

	// first time: get everything from beginning
	// this is temporary to recover old messages after code changes fix things
	// todo: remove the `i` counter and simply resume from cursor
	if i > 0 {
		err := db.Conn.Get(&after, "SELECT relayed_at FROM rpc_cursor WHERE relayed_by=$1", host)
		if err != nil && err != sql.ErrNoRows {
			c.logger.Error("backfill failed to get cursor: ", err)
		}
	}

	endpoint := host + bulkEndpoint + "?after=" + url.QueryEscape(after.Format(time.RFC3339Nano))
	started := time.Now()

	req, err := http.NewRequest("GET", endpoint, nil)
	if err != nil {
		return err
	}

	// add header for signed nonce
	req.Header.Add("Authorization", signing.BasicAuthNonce(c.proc.discoveryConfig.MyPrivateKey))

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
		err = retry.Do(
			func() error {
				return c.proc.Apply(op)
			},
			retry.Delay(time.Second),
			retry.MaxDelay(time.Second*5))

		// if apply error stop here (don't advance cursor)
		// will restart here on next doSeep loop
		if err != nil {
			c.logger.Error("sweep apply error", err)
			break
		}

		cursor = op.RelayedAt
	}

	if !cursor.IsZero() {
		c.logger.Info("sweep done", "took", time.Since(started).String(), "count", len(ops), "cursor", cursor)
		q := `insert into rpc_cursor values ($1, $2) on conflict (relayed_by) do update set relayed_at = $2;`
		_, err = db.Conn.Exec(q, host, cursor)
		return err
	}

	return err
}
