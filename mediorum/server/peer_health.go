package server

import (
	"net/http"
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
				resp, err := httpClient.Get(peer.ApiPath("/status")) // todo: switch to /internal/ok later
				if err == nil {
					if resp.StatusCode == 200 {
						// mark healthy
						ss.peerHealthMutex.Lock()
						ss.peerHealth[peer.Host] = time.Now()
						ss.peerHealthMutex.Unlock()
					}
					resp.Body.Close()
				}
				wg.Done()
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
