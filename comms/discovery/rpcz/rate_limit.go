package rpcz

import (
	"strconv"
	"sync"

	"comms.audius.co/discovery/config"
	"github.com/nats-io/nats.go"
)

func NewRateLimiter(jsc nats.JetStreamContext) (*RateLimiter, error) {

	// kv
	kv, err := jsc.CreateKeyValue(&nats.KeyValueConfig{
		Bucket:   config.RateLimitRulesBucketName,
		Replicas: config.NatsReplicaCount,
	})
	if err != nil {
		return nil, err
	}

	watcher, err := kv.WatchAll()
	if err != nil {
		return nil, err
	}

	limiter := &RateLimiter{
		kv:      kv,
		watcher: watcher,
		limits:  map[string]int{},
	}

	go limiter.watch()

	return limiter, nil
}

type RateLimiter struct {
	sync.RWMutex
	kv      nats.KeyValue
	watcher nats.KeyWatcher
	limits  map[string]int
}

func (limiter *RateLimiter) watch() {
	for change := range limiter.watcher.Updates() {
		if change == nil {
			continue
		}

		val, err := strconv.Atoi(string(change.Value()))
		if err != nil {
			config.Logger.Warn("invalid rate limit value", "key", change.Key(), "err", err)
		} else {
			limiter.Lock()
			limiter.limits[change.Key()] = val
			limiter.Unlock()
		}
	}
}

func (limiter *RateLimiter) Get(rule string) int {
	limiter.RLock()
	defer limiter.RUnlock()

	if val := limiter.limits[rule]; val != 0 {
		return val
	}

	return config.DefaultRateLimitRules[rule]
}
