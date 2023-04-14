package crudr

import (
	"bytes"
	"log"
	"net/http"
)

// this is a crappy version of POST broadcast
// that does fire and forget style to all peers...
//
// a better version will have a chan of messages to send and will send them with N workers
// and also do the "pull" consumer code in `sync_client.go`
// and also keep track of if server is up and healthy and only push if yes.
//
// if push fails, it's okay because the pull consumer has a cursor and will come along and get it on an interval.
func (c *Crudr) broadcast(payload []byte) {
	for _, peerHost := range c.peerHosts {
		peerHost := peerHost
		go func() {
			// todo: endpoint config
			endpoint := peerHost + "/internal/crud/push"
			resp, err := http.Post(endpoint, "application/json", bytes.NewReader(payload))
			if err != nil {
				log.Println("push failed", "host", peerHost, "err", err)
				return
			}
			defer resp.Body.Close()

			if resp.StatusCode != 200 {
				log.Println("push bad status", "host", peerHost, "status", resp.StatusCode)
			}
		}()
	}
}
