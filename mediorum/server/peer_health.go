package server

import (
	"encoding/json"
	"net/http"
	"strconv"
	"sync"
	"time"

	"github.com/labstack/echo/v4"
	"golang.org/x/exp/maps"
	"golang.org/x/exp/slices"
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
				if peer.Host == ss.Config.Self.Host {
					return
				}
				req, err := http.NewRequest("GET", apiPath(peer.Host, "/health_check"), nil)
				if err != nil {
					return
				}
				req.Header.Set("User-Agent", "mediorum "+ss.Config.Self.Host)
				resp, err := httpClient.Do(req)
				if err != nil {
					return
				}
				defer resp.Body.Close()

				// read body
				var response map[string]interface{}
				decoder := json.NewDecoder(resp.Body)
				err = decoder.Decode(&response)
				if err != nil {
					return
				}

				if data, ok := response["data"].(map[string]interface{}); ok {
					if peerHealthsMap, ok := data["peerHealths"].(map[string]interface{}); ok {

						// set node as reachable
						ss.peerHealthsMutex.Lock()
						defer ss.peerHealthsMutex.Unlock()
						if _, ok := ss.peerHealths[peer.Host]; !ok {
							ss.peerHealths[peer.Host] = &PeerHealth{}
						}
						ss.peerHealths[peer.Host].LastReachable = time.Now()

						// set node's reachable peers
						for host, hostPeerHealths := range peerHealthsMap {
							if peerHealth, ok := hostPeerHealths.(map[string]interface{}); ok {
								if lastReachable, ok := peerHealth["LastReachable"].(string); ok {
									if t, err := time.Parse(time.RFC3339Nano, lastReachable); err == nil {
										ss.peerHealths[peer.Host].ReachablePeers[host] = t
									}
								}
							}
						}

						// set node as healthy
						if resp.StatusCode == 200 {
							// node isn't healthy if there's any other node that is reachable by >50% of other nodes but not by this node
							unreachablePeers := ss.getReachableByMajorityButNotByHost(peer.Host)
							if len(unreachablePeers) == 0 || true { // TODO: we can remove the "|| true" if we want to enforce peer reachability
								ss.peerHealths[peer.Host].LastHealthy = time.Now()
							}
						}

					}
				}

			}()
		}
		wg.Wait()

		if i < 5 {
			time.Sleep(time.Second)
		} else {
			time.Sleep(time.Minute * 2)
		}
	}
}

// @dev lock ss.peerHealthsMutex before calling this
func (ss *MediorumServer) getReachableByMajorityButNotByHost(host string) []string {
	if host == ss.Config.Self.Host {
		return []string{} // not meant to be called on self
	}

	// for each peer, count how many other peers can reach it
	twoMinAgo := time.Now().Add(-2 * time.Minute)
	numReachableBy := map[string]int{}
	totalReachableHosts := 0
	for _, peer := range ss.Config.Peers {
		if peer.Host == host || peer.Host == ss.Config.Self.Host {
			continue
		}
		if !slices.Contains(maps.Keys(numReachableBy), peer.Host) {
			numReachableBy[peer.Host] = 0
		}

		health, ok := ss.peerHealths[peer.Host]
		if !ok {
			continue
		}
		if !ok || health.LastReachable.Before(twoMinAgo) {
			continue
		}

		totalReachableHosts++
		numReachableBy[peer.Host]++ // record that this peer is reachable by us

		for peersPeer, lastReachable := range health.ReachablePeers {
			if lastReachable.After(twoMinAgo) {
				numReachableBy[peersPeer]++ // record that this peer is reachable by its other peer
			}
		}
	}

	if totalReachableHosts < 5 {
		return []string{} // not enough nodes to determine majority
	}

	var unreachableByHost []string
	for peer, reachableBy := range numReachableBy {
		if reachableBy > totalReachableHosts/2 {
			// more than half of nodes can reach the peer
			if lastReachable, ok := ss.peerHealths[peer].ReachablePeers[host]; !ok || lastReachable.Before(twoMinAgo) {
				// but the host in question can't reach the peer
				unreachableByHost = append(unreachableByHost, peer)
			}
		}
	}

	return unreachableByHost
}

func (ss *MediorumServer) findHealthyPeers(aliveInLast time.Duration) []string {
	if aliveInLast < (time.Minute * 5) {
		panic("aliveInLast should be > 5 minutes")
	}
	result := []string{}
	ss.peerHealthsMutex.RLock()
	defer ss.peerHealthsMutex.RUnlock()
	for host, peerHealth := range ss.peerHealths {
		if time.Since(peerHealth.LastHealthy) < aliveInLast {
			result = append(result, host)
		}
	}

	return result
}

func (ss *MediorumServer) proxyHealthCheck(c echo.Context) error {
	peerHost := c.QueryParam("to")
	req, err := http.NewRequest("GET", apiPath(peerHost, "/health_check"), nil)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to create request"})
	}
	req.Header.Set("User-Agent", "mediorum proxy debug "+ss.Config.Self.Host)

	timeoutSec, err := strconv.Atoi(c.QueryParam("timeout_sec"))
	if err != nil {
		timeoutSec = 1
	}
	httpClient := http.Client{
		Timeout: time.Second * time.Duration(timeoutSec),
	}
	resp, err := httpClient.Do(req)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to send request"})
	}
	defer resp.Body.Close()

	var response map[string]interface{}
	decoder := json.NewDecoder(resp.Body)
	err = decoder.Decode(&response)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to decode response"})
	}

	return c.JSON(http.StatusOK, response)
}
