package server

import (
	"mediorum/httputil"
	"net/http"
	"strings"
	"sync"
	"time"
)

func (ss *MediorumServer) startHealthPoller() {
	time.Sleep(time.Second)

	httpClient := http.Client{
		Timeout: time.Second,
	}

	for i := 0; ; i++ {
		wg := sync.WaitGroup{}
		wg.Add(len(ss.Config.Peers))
		for _, peer := range ss.Config.Peers {
			peer := peer
			go func() {
				defer wg.Done()
				req, err := http.NewRequest("GET", peer.ApiPath("/internal/ok"), nil)
				if err != nil {
					return
				}
				req.Header.Set("User-Agent", "mediorum "+ss.Config.Self.Host)
				resp, err := httpClient.Do(req)
				if err != nil {
					return
				}
				resp.Body.Close()
				if resp.StatusCode == 200 {
					// mark healthy
					ss.peerHealthMutex.Lock()
					ss.peerHealth[httputil.RemoveTrailingSlash(strings.ToLower(peer.Host))] = time.Now()
					ss.peerHealthMutex.Unlock()
				}

			}()
		}
		wg.Wait()

		if i < 2 {
			time.Sleep(time.Second)
		} else {
			time.Sleep(time.Second * 30)
		}
	}
}

func (ss *MediorumServer) findHealthyPeers(aliveInLast time.Duration) []string {
	result := []string{}
	ss.peerHealthMutex.RLock()
	for host, ts := range ss.peerHealth {
		if time.Since(ts) < aliveInLast {
			result = append(result, host)
		}
	}
	ss.peerHealthMutex.RUnlock()

	return result
}
