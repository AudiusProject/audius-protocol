package rpcz

import (
	"strconv"
	"sync"

	"comms.audius.co/discovery/config"
	"comms.audius.co/discovery/jetstream"
	"github.com/nats-io/nats.go"
)

func NewRateLimiter() (*RateLimiter, error) {
	jsc := jetstream.GetJetstreamContext()

	// kv
	kv, err := jsc.CreateKeyValue(&nats.KeyValueConfig{
		Bucket:   config.RateLimitRulesBucketName,
		Replicas: 1,
	})
	if err != nil {
		return nil, err
	}

	limiter := &RateLimiter{
		limits: map[string]int{},
	}

	watcher, err := kv.WatchAll()
	if err != nil {
		return nil, err
	}

	go func() {
		for change := range watcher.Updates() {
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
	}()

	return limiter, nil
}

type RateLimiter struct {
	sync.RWMutex
	limits map[string]int
}

func (limiter *RateLimiter) Get(rule string) int {
	limiter.RLock()
	defer limiter.RUnlock()

	if val := limiter.limits[rule]; val != 0 {
		return val
	}

	return config.DefaultRateLimitRules[rule]
}
