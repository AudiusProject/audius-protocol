package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"net/url"
	"os"
	"os/signal"
	"sync"
	"syscall"
	"time"

	"github.com/go-redis/redis/v8"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/exp/maps"
	"golang.org/x/exp/slices"
	"golang.org/x/exp/slog"
)

type PeerHealths struct {
	quit                  chan os.Signal
	peerHealthsMutex      sync.RWMutex
	peerHealths           map[string]*PeerHealth
	unreachablePeers      []string
	failsPeerReachability bool
	logger                *slog.Logger
	Config                Config
	DiscoveryPgPool       *pgxpool.Pool
	ContentPgPool         *pgxpool.Pool
	Redis                 *redis.Client
}

type PeerHealth struct {
	LastReachable  time.Time            `json:"lastReachable"`
	LastHealthy    time.Time            `json:"lastHealthy"`
	ReachablePeers map[string]time.Time `json:"reachablePeers"`
}

func New(config Config) (*PeerHealths, error) {
	// validate DSN config
	if config.RedisDSN == "" {
		log.Fatal("redis DSN is required")
	}

	// TODO uncomment when used for uptime metrics
	// if config.DiscoveryPostgresDSN == "" && config.ContentPostgresDSN == "" {
	// 	log.Fatal("discovery and/or content postgres DSN is required")
	// }

	// validate host config
	if config.Self.Host == "" {
		log.Fatal("host is required")
	} else if hostUrl, err := url.Parse(config.Self.Host); err != nil {
		log.Fatal("invalid host: ", err, "host", hostUrl)
	}

	logger := slog.With("self", config.Self.Host)

	// TODO uncomment when used for uptime metrics
	// dial DB(s)
	var discoveryPgPool *pgxpool.Pool
	var contentPgPool *pgxpool.Pool
	// var err error
	// if config.DiscoveryPostgresDSN != "" {
	// 	discoveryPgConfig, _ := pgxpool.ParseConfig(config.DiscoveryPostgresDSN)
	// 	discoveryPgPool, err = pgxpool.NewWithConfig(context.Background(), discoveryPgConfig)
	// 	if err != nil {
	// 		logger.Error("dial discovery postgres failed", "err", err)
	// 	}
	// }
	// if config.ContentPostgresDSN != "" {
	// 	contentPgConfig, _ := pgxpool.ParseConfig(config.ContentPostgresDSN)
	// 	contentPgPool, err = pgxpool.NewWithConfig(context.Background(), contentPgConfig)
	// 	if err != nil {
	// 		logger.Error("dial content postgres failed", "err", err)
	// 	}
	// }

	// dial redis
	opt, err := redis.ParseURL(config.RedisDSN)
	if err != nil {
		panic(err)
	}
	redisClient := redis.NewClient(opt)
	logger.Info("connected to redis")

	ph := &PeerHealths{
		quit:            make(chan os.Signal, 1),
		peerHealths:     map[string]*PeerHealth{},
		logger:          logger,
		Config:          config,
		DiscoveryPgPool: discoveryPgPool,
		ContentPgPool:   contentPgPool,
		Redis:           redisClient,
	}

	return ph, nil
}

func (ph *PeerHealths) Start() {
	go ph.startHealthPoller()
	go ph.monitorPeerReachability()

	// signals
	signal.Notify(ph.quit, os.Interrupt, syscall.SIGINT, syscall.SIGTERM)
	<-ph.quit
	close(ph.quit)

	ph.Stop()
}

func (ph *PeerHealths) Stop() {
	ph.logger.Info("stopping")
	if ph.DiscoveryPgPool != nil {
		ph.DiscoveryPgPool.Close()
	}
	if ph.ContentPgPool != nil {
		ph.ContentPgPool.Close()
	}
	if ph.Redis != nil {
		ph.Redis.Close()
	}
	ph.logger.Info("bye")
}

func (ph *PeerHealths) startHealthPoller() {
	time.Sleep(time.Second)

	ph.logger.Info("starting health poller")

	httpClient := http.Client{
		Timeout: time.Second,
	}

	for i := 0; ; i++ {
		wg := sync.WaitGroup{}
		wg.Add(len(ph.Config.Peers))
		for _, peer := range ph.Config.Peers {
			peer := peer
			go func() {
				defer wg.Done()
				if peer.Host == ph.Config.Self.Host {
					return
				}
				req, err := http.NewRequest("GET", apiPath(peer.Host, "/health_check"), nil)
				if err != nil {
					return
				}
				req.Header.Set("User-Agent", "peer health monitor "+ph.Config.Self.Host)
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
					// set node as reachable
					ph.peerHealthsMutex.Lock()
					defer ph.peerHealthsMutex.Unlock()
					if _, ok := ph.peerHealths[peer.Host]; !ok {
						ph.peerHealths[peer.Host] = &PeerHealth{}
					}
					ph.peerHealths[peer.Host].LastReachable = time.Now()

					// set node as healthy
					if resp.StatusCode == 200 {
						// node isn't healthy if there's any other node that is reachable by >50% of other nodes but not by this node
						unreachablePeers := ph.getReachableByMajorityButNotByHost(peer.Host)
						// TODO: we can remove the "|| true" if we want to enforce peer reachability.
						// Need to add peerHealths to discovery health check before this is possible for discovery peers.
						if len(unreachablePeers) == 0 || true {
							ph.peerHealths[peer.Host].LastHealthy = time.Now()
						}
					}

					if peerHealthsMap, ok := data["peerHealths"].(map[string]interface{}); ok {
						// set node's reachable peers
						for host, hostPeerHealths := range peerHealthsMap {
							if peerHealth, ok := hostPeerHealths.(map[string]interface{}); ok {
								if lastReachable, ok := peerHealth["LastReachable"].(string); ok {
									if t, err := time.Parse(time.RFC3339Nano, lastReachable); err == nil {
										ph.peerHealths[peer.Host].ReachablePeers[host] = t
									}
								}
							}
						}
					}
				}
			}()
		}
		wg.Wait()

		// Set in redis for other containers to access
		ph.peerHealthsMutex.Lock()
		peerHealthsJSON, err := json.Marshal(ph.peerHealths)
		if err != nil {
			panic(err)
		}
		ph.peerHealthsMutex.Unlock()
		err = ph.Redis.Set(context.Background(), "peerHealths", peerHealthsJSON, 0).Err()
		if err != nil {
			panic(err)
		}

		if i < 5 {
			time.Sleep(time.Second)
		} else {
			time.Sleep(time.Minute * 2)
		}
	}
}

// @dev lock ph.peerHealthsMutex before calling this
func (ph *PeerHealths) getReachableByMajorityButNotByHost(host string) []string {
	if host == ph.Config.Self.Host {
		return []string{} // not meant to be called on self
	}

	// for each peer, count how many other peers can reach it
	twoMinAgo := time.Now().Add(-2 * time.Minute)
	numReachableBy := map[string]int{}
	totalReachableHosts := 0
	for _, peer := range ph.Config.Peers {
		if peer.Host == host || peer.Host == ph.Config.Self.Host {
			continue
		}
		if !slices.Contains(maps.Keys(numReachableBy), peer.Host) {
			numReachableBy[peer.Host] = 0
		}

		health, ok := ph.peerHealths[peer.Host]
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
			if lastReachable, ok := ph.peerHealths[peer].ReachablePeers[host]; !ok || lastReachable.Before(twoMinAgo) {
				// but the host in question can't reach the peer
				unreachableByHost = append(unreachableByHost, peer)
			}
		}
	}

	return unreachableByHost
}

func (ph *PeerHealths) monitorPeerReachability() {
	ph.logger.Info("starting peer reachability monitor")

	ticker := time.NewTicker(1 * time.Minute)
	for range ticker.C {
		// find unreachable nodes in the last 2 minutes
		var unreachablePeers []string
		for _, peer := range ph.Config.Peers {
			if peer.Host == ph.Config.Self.Host {
				continue
			}
			if peerHealth, ok := ph.peerHealths[peer.Host]; ok {
				if peerHealth.LastReachable.Before(time.Now().Add(-2 * time.Minute)) {
					unreachablePeers = append(unreachablePeers, peer.Host)
				}
			} else {
				unreachablePeers = append(unreachablePeers, peer.Host)
			}
		}

		// check if each unreachable node was also unreachable last time we checked (so we ignore temporary downtime from restarts/updates)
		failsPeerReachability := false
		for _, unreachable := range unreachablePeers {
			if slices.Contains(ph.unreachablePeers, unreachable) {
				// we can't reach this peer. self-mark unhealthy if >50% of other nodes can
				if ph.canMajorityReachHost(unreachable) {
					// TODO: we can self-mark unhealthy if we want to enforce peer reachability
					failsPeerReachability = true
					break
				}
			} else {
				ph.logger.Info("new unreachable peer", "peer", unreachable)
			}
		}

		ph.peerHealthsMutex.Lock()
		if failsPeerReachability != ph.failsPeerReachability {
			if failsPeerReachability {
				ph.logger.Info("failing peer reachability")
			} else {
				ph.logger.Info("no longer failing peer reachability")
			}
		}
		ph.unreachablePeers = unreachablePeers
		ph.failsPeerReachability = failsPeerReachability
		ph.peerHealthsMutex.Unlock()

		// Set in redis for other containers to access
		unreachablePeersJSON, err := json.Marshal(unreachablePeers)
		if err != nil {
			panic(err)
		}
		err = ph.Redis.Set(context.Background(), "unreachablePeers", unreachablePeersJSON, 0).Err()
		if err != nil {
			panic(err)
		}
		err = ph.Redis.Set(context.Background(), "failsPeerReachability", failsPeerReachability, 0).Err()
		if err != nil {
			panic(err)
		}
	}
}

func (ph *PeerHealths) canMajorityReachHost(host string) bool {
	ph.peerHealthsMutex.RLock()
	defer ph.peerHealthsMutex.RUnlock()

	twoMinAgo := time.Now().Add(-2 * time.Minute)
	numCanReach, numTotal := 0, 0
	for _, peer := range ph.peerHealths {
		if peer.LastReachable.After(twoMinAgo) {
			numTotal++
			if lastReachable, ok := peer.ReachablePeers[host]; ok && lastReachable.After(twoMinAgo) {
				numCanReach++
			}
		}
	}
	return numTotal < 5 || numCanReach > numTotal/2
}
