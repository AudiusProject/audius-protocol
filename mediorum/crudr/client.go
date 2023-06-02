package crudr

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"mediorum/server/signature"
	"net/http"
	"time"

	"golang.org/x/exp/slog"
	"gorm.io/gorm/clause"
)

type PeerClient struct {
	Host   string
	outbox chan []byte
	crudr  *Crudr
	logger *slog.Logger
}

func NewPeerClient(host string, crudr *Crudr) *PeerClient {
	// buffer up to N outgoing messages
	// if full, Send will drop outgoing message
	// which is okay because of sweep
	outboxBufferSize := 8

	return &PeerClient{
		Host:   host,
		outbox: make(chan []byte, outboxBufferSize),
		crudr:  crudr,
		logger: slog.With("cruder_client", host),
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

func (p *PeerClient) startSender() {
	httpClient := http.Client{
		Timeout: 5 * time.Second,
	}
	for data := range p.outbox {
		endpoint := p.Host + "/internal/crud/push" // hardcoded
		req := signature.SignedPost(
			endpoint,
			"application/json",
			bytes.NewReader(data),
			p.crudr.myPrivateKey)

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

func (p *PeerClient) startSweeper() {
	for {
		err := p.doSweep()
		if err != nil {
			p.logger.Warn("sweep failed", "err", err)
		}
		time.Sleep(time.Second * 30)
	}
}

func (p *PeerClient) doSweep() error {

	host := p.Host
	bulkEndpoint := "/internal/crud/sweep" // hardcoded

	// get cursor
	lastUlid := ""
	{
		var cursor Cursor
		err := p.crudr.DB.Where("host = ?", host).First(&cursor).Error
		if err != nil {
			p.logger.Info("failed to get cursor", "err", err)
		} else {
			lastUlid = cursor.LastULID
		}
	}

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
		err := p.crudr.ApplyOp(op)
		if err != nil {
			fmt.Println(err)
		} else {
			lastUlid = op.ULID
		}
	}

	// set cursor
	{
		upsertClause := clause.OnConflict{UpdateAll: true}
		err := p.crudr.DB.Clauses(upsertClause).Create(&Cursor{Host: host, LastULID: lastUlid}).Error
		if err != nil {
			p.logger.Info("failed to set cursor", "err", err)
		}
	}

	p.logger.Debug("backfill done", "host", host, "count", len(ops), "last_ulid", lastUlid)

	return nil
}
