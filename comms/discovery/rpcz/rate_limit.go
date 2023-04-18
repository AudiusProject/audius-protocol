package rpcz

import (
	"sync"

	"comms.audius.co/discovery/config"
)

func NewRateLimiter() (*RateLimiter, error) {

	limiter := &RateLimiter{
		limits: map[string]int{},
	}

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
