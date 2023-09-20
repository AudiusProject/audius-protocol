package crudr

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"mediorum/httputil"
	"mediorum/server/signature"
	"net/http"
	"strings"
	"time"

	"github.com/oklog/ulid/v2"
	"golang.org/x/exp/slog"
	"gorm.io/gorm/clause"
)

type PeerClient struct {
	Host     string
	Seeded   bool
	outbox   chan []byte
	crudr    *Crudr
	logger   *slog.Logger
	selfHost string
}

func NewPeerClient(host string, crudr *Crudr, selfHost string) *PeerClient {
	// buffer up to N outgoing messages
	// if full, Send will drop outgoing message
	// which is okay because of sweep
	outboxBufferSize := 8

	return &PeerClient{
		Host:     httputil.RemoveTrailingSlash(strings.ToLower(host)),
		outbox:   make(chan []byte, outboxBufferSize),
		crudr:    crudr,
		logger:   slog.With("crudr_client", httputil.RemoveTrailingSlash(strings.ToLower(host))),
		selfHost: selfHost,
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
			p.crudr.myPrivateKey,
			p.selfHost,
		)

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
		time.Sleep(time.Minute * 2)
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

	req, err := http.NewRequest("GET", endpoint, nil)
	if err != nil {
		return fmt.Errorf("failed to create request: %v", err)
	}

	req.Header.Set("User-Agent", "mediorum "+p.selfHost)

	resp, err := client.Do(req)
	if err != nil {
		p.Seeded = true // we can't reach this peer, so we're not able to seed any further
		return fmt.Errorf("request failed: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		p.Seeded = true // we can't reach this peer, so we're not able to seed any further
		return fmt.Errorf("bad status: %d", resp.StatusCode)
	}

	var ops []*Op
	dec := json.NewDecoder(resp.Body)
	err = dec.Decode(&ops)
	if err != nil {
		return err
	}

	for _, op := range ops {
		// ignore old blobs ops
		if op.Table == "blobs" {
			lastUlid = op.ULID
			continue
		}

		err := p.crudr.ApplyOp(op)
		if err != nil {
			p.logger.Error("failed to apply op", "op", op, "err", err)
		} else {
			lastUlid = op.ULID
		}
	}

	// seeding is complete once there are no more ulids to sweep (or very few left)
	if !p.Seeded && len(ops) < 10 {
		p.logger.Info("seeding complete (no more ulids to sweep)")
		p.Seeded = true
	}

	// set cursor
	{
		upsertClause := clause.OnConflict{UpdateAll: true}
		err := p.crudr.DB.Clauses(upsertClause).Create(&Cursor{Host: host, LastULID: lastUlid}).Error
		if err != nil {
			p.logger.Error("failed to set cursor", "err", err)
		}
	}

	p.logger.Debug("backfill done", "host", host, "count", len(ops), "last_ulid", lastUlid)

	// seeding is complete if the last ulid is within the last hour
	if !p.Seeded {
		parsedULID, err := ulid.Parse(lastUlid)
		if err == nil {
			t := ulid.Time(parsedULID.Time())
			since := time.Since(t)
			if since < time.Hour {
				p.logger.Info("seeding complete (timestamp <1hr)", "last_ulid", lastUlid, "since_minutes", since.Minutes())
				p.Seeded = true
			} else {
				p.logger.Info("seeding not complete (last ulid is too old)", "last_ulid", lastUlid, "since_minutes", since.Minutes())
			}
		} else {
			p.logger.Warn(fmt.Sprintf("failed to parse last ulid: '%s'", lastUlid), "err", err)
		}
	}

	return nil
}
