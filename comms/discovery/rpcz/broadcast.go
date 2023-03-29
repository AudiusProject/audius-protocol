package rpcz

import (
	"bytes"
	"log"
	"strings"
)

// this is a crappy version of POST broadcast
// that does fire and forget style to all peers...
//
// a better version will have a chan of messages to send and will send them with N workers
// and also do the "pull" consumer code in `sync_client.go`
// and also keep track of if server is up and healthy and only push if yes.
//
// if push fails, it's okay because the pull consumer has a cursor and will come along and get it on an interval.
func (proc *RPCProcessor) broadcast(payload []byte) {
	for _, peer := range proc.peerList {
		if strings.EqualFold(peer.Wallet, proc.discoveryConfig.MyWallet) {
			continue
		}

		peer := peer
		go func() {
			resp, err := proc.httpClient.Post(peer.Host+"/comms/rpc/receive", "application/json", bytes.NewReader(payload))
			if err != nil {
				log.Println("push failed", "host", peer.Host, "err", err)
			}
			defer resp.Body.Close()

			if resp.StatusCode != 200 {
				log.Println("push bad status", "host", peer.Host, "status", resp.StatusCode)
			} else {
				log.Println("push OK", "host", peer.Host)
			}
		}()
	}

}
