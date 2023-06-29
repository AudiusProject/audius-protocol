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
	outboxBufferSize := 64

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
	// for now we reset cursor on boot every time...
	// this is to try to resolve any prior bad state...
	// if everything works we can remove this step
	db.Conn.MustExec(`delete from rpc_cursor where relayed_by=$1`, c.Host)

	for {
		c.err = c.doSweep()
		if c.err != nil {
			c.logger.Error("sweep error", c.err)
		}
		time.Sleep(time.Second * 30)
	}
}

func (c *PeerClient) doSweep() error {
	host := c.Host
	bulkEndpoint := "/comms/rpc/bulk"

	// get cursor

	var after time.Time
	err := db.Conn.Get(&after, "SELECT relayed_at FROM rpc_cursor WHERE relayed_by=$1", host)
	if err != nil && err != sql.ErrNoRows {
		c.logger.Error("backfill failed to get cursor: ", "err", err)
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

	// add any prior rpc_error rows to the end for retry
	err = c.appendRpcErrorRows(&ops)
	if err != nil {
		c.logger.Error("failed to query rpc_error rows", err)
	}

	var cursor time.Time
	for _, op := range ops {
		logger := c.logger.With("sig", op.Sig)
		err = c.proc.Apply(op)

		if err != nil {
			// if apply error, record in rpc_error table
			logger.Error("sweep apply error", "err", err, "sig", op.Sig)
			if err := c.insertRpcError(op, err); err != nil {
				logger.Error("failed to insert rpc_error row", err)
			}
		} else {
			// if ok, clear any prior error
			if _, err := db.Conn.Exec(`delete from rpc_error where sig = $1`, op.Sig); err != nil {
				logger.Error("failed to clear rpc_error rows", err)
			}
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

func (c *PeerClient) insertRpcError(op *schema.RpcLog, applyError error) error {
	opJson, err := json.Marshal(op)
	if err != nil {
		return err
	}

	_, err = db.Conn.Exec(`
	insert into rpc_error
		(sig, rpc_log_json, error_text, error_count, last_attempt)
	values
		($1, $2, $3, 1, now())
	on conflict (sig) do update set error_text = $3, error_count = rpc_error.error_count + 1, last_attempt = now()
	`, op.Sig, opJson, applyError.Error())

	return err
}

func (c *PeerClient) appendRpcErrorRows(ops *[]*schema.RpcLog) error {
	var js []string
	err := db.Conn.Select(&js, `select rpc_log_json from rpc_error where rpc_log_json->>'relayed_by' = $1 and error_count < 30 order by last_attempt asc`, c.Host)
	if err != nil {
		return err
	}
	for _, j := range js {
		var op *schema.RpcLog
		err := json.Unmarshal([]byte(j), &op)
		if err == nil {
			*ops = append(*ops, op)
		}
	}

	return nil
}
