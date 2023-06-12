package server

import (
	"net/http"
	"sync"
	"time"
)

func (ss *MediorumServer) startHealthPoller() {
	httpClient := http.Client{
		Timeout: time.Second,
	}

	for i := 0; ; i++ {
		wg := sync.WaitGroup{}
		wg.Add(len(ss.Config.Peers))
		for _, peer := range ss.Config.Peers {
			peer := peer
			go func() {
				resp, err := httpClient.Get(peer.ApiPath("/status"))
				if err == nil {
					if resp.StatusCode == 200 {
						// mark healthy
						ss.mu.Lock()
						ss.peerHealth[peer.Host] = time.Now()
						ss.mu.Unlock()
					}
					resp.Body.Close()
				}
				wg.Done()
			}()
		}
		wg.Wait()

		if i < 10 {
			time.Sleep(time.Second)
		} else {
			time.Sleep(time.Second * 30)
		}
	}
}

func (ss *MediorumServer) findHealthyPeers(aliveInLast time.Duration) []string {
	result := []string{}
	ss.mu.Lock()
	for host, ts := range ss.peerHealth {
		if time.Since(ts) < aliveInLast {
			result = append(result, host)
		}
	}
	ss.mu.Unlock()

	return result
}
