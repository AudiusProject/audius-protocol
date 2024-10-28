package rpcz

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"time"

	"comms.audius.co/discovery/db"
	"comms.audius.co/discovery/schema"
	"comms.audius.co/shared/signing"
	"github.com/vmihailenco/msgpack/v5"
	"golang.org/x/exp/slog"
)

// sweeper goroutine will pull messages on interval
func (proc *RPCProcessor) startSweeper() {
	for {
		// visit each host in turn
		for _, peer := range proc.discoveryConfig.Peers() {
			if peer.Host == proc.discoveryConfig.MyHost {
				continue
			}

			logger := slog.With("host", peer.Host)
			if err := proc.sweepHost(peer.Host); err != nil {
				logger.Error("sweepHost failed", "err", err)
			}
		}

		// visit any failed rpc rows for retry
		proc.sweepFailed()

		time.Sleep(time.Second * 10)
	}

}

func (proc *RPCProcessor) sweepHost(host string) error {
	logger := slog.With("sweep_host", host)
	bulkEndpoint := "/comms/rpc/bulk"

	// get cursor
	var after time.Time
	err := db.Conn.Get(&after, "SELECT relayed_at FROM rpc_cursor WHERE relayed_by=$1", host)
	if err != nil && err != sql.ErrNoRows {
		logger.Error("backfill failed to get cursor: ", "err", err)
	}

	endpoint := host + bulkEndpoint + "?msgpack=t&after=" + url.QueryEscape(after.Format(time.RFC3339Nano))
	started := time.Now()

	req, err := http.NewRequest("GET", endpoint, nil)
	if err != nil {
		return err
	}

	// add header for signed nonce
	req.Header.Add("Authorization", signing.BasicAuthNonce(proc.discoveryConfig.MyPrivateKey))

	client := &http.Client{
		Timeout: time.Second * 10,
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

	if resp.Header.Get("Content-Type") == "application/msgpack" {
		dec := msgpack.NewDecoder(resp.Body)
		err = dec.Decode(&ops)
		if err != nil {
			return err
		}
	} else {
		dec := json.NewDecoder(resp.Body)
		err = dec.Decode(&ops)
		if err != nil {
			return err
		}
	}

	var cursor time.Time
	for _, op := range ops {
		proc.sweeperApply(op)
		cursor = op.AppliedAt
	}

	if !cursor.IsZero() {
		logger.Info("sweep done", "took", time.Since(started).String(), "count", len(ops), "cursor", cursor)
		q := `insert into rpc_cursor values ($1, $2) on conflict (relayed_by) do update set relayed_at = $2;`
		_, err = db.Conn.Exec(q, host, cursor)
		return err
	}

	return err
}

func (proc *RPCProcessor) sweepFailed() {
	ops, err := getRpcErrorRows()
	if err != nil {
		slog.Error("getRpcErrorRows failed", "err", err)
		return
	}
	for _, op := range ops {
		proc.sweeperApply(op)
	}
}

func (proc *RPCProcessor) sweeperApply(op *schema.RpcLog) {
	logger := logger.With("sig", op.Sig)

	err := proc.Apply(op)

	if err != nil {
		// if apply error, record in rpc_error table
		logger.Error("sweep apply error", "err", err, "sig", op.Sig)
		if err := insertRpcError(op, err); err != nil {
			logger.Error("failed to insert rpc_error row", "err", err)
		}
	} else {
		// if ok, clear any prior error
		if ok, err := db.Conn.Exec(`delete from rpc_error where sig = $1`, op.Sig); err != nil {
			logger.Error("failed to clear rpc_error rows", "err", err)
		} else if c, _ := ok.RowsAffected(); c > 0 {
			logger.Info("rpc_error resolved")
		}
	}
}

func insertRpcError(op *schema.RpcLog, applyError error) error {
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

func getRpcErrorRows() ([]*schema.RpcLog, error) {
	var js []string
	err := db.Conn.Select(&js, `select rpc_log_json from rpc_error where error_count < 30 order by last_attempt asc`)
	if err != nil {
		return nil, err
	}

	var ops []*schema.RpcLog
	for _, j := range js {
		var op *schema.RpcLog
		err := json.Unmarshal([]byte(j), &op)
		if err == nil {
			ops = append(ops, op)
		}
	}

	return ops, nil
}
