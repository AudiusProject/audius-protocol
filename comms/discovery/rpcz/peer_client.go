package rpcz

import (
	"bytes"
	"log"
	"net/http"
	"time"

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

func (p *PeerClient) Send(data []byte) bool {
	select {
	case p.outbox <- data:
		return true
	default:
		return false
	}
}

// sender goroutine will POST signed messages to peers (push)
func (p *PeerClient) startSender() {
	httpClient := http.Client{
		Timeout: 5 * time.Second,
	}
	for data := range p.outbox {
		endpoint := p.Host + "/comms/rpc/receive?msgpack=t" // hardcoded
		req := signing.SignedPost(
			endpoint,
			"application/msgpack",
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
