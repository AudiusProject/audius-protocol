package rpcz

import (
	"bytes"
	"net/http"
	"strings"

	"comms.audius.co/shared/signing"
	"golang.org/x/exp/slog"
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
	for _, peer := range proc.discoveryConfig.Peers() {
		if strings.EqualFold(peer.Wallet, proc.discoveryConfig.MyWallet) {
			continue
		}

		peer := peer
		go func() {
			endpoint := peer.Host + "/comms/rpc/receive"
			req, err := http.NewRequest("POST", endpoint, bytes.NewReader(payload))
			if err != nil {
				panic(err)
			}

			// add header for signed nonce
			req.Header.Add("Content-Type", "application/json")
			req.Header.Add("Authorization", signing.BasicAuthNonce(proc.discoveryConfig.MyPrivateKey))

			resp, err := proc.httpClient.Do(req)
			if err != nil {
				slog.Debug("push failed", "host", peer.Host, "err", err)
				return
			}
			defer resp.Body.Close()

			if resp.StatusCode != 200 {
				slog.Debug("push bad status", "host", peer.Host, "status", resp.StatusCode)
			}
		}()
	}

}
