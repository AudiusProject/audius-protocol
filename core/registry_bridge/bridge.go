package registry_bridge

import "time"

func (r *Registry) Start() error {
	timeToWait := 8 * time.Hour

	// query local chain every 10 secs because it's free
	if r.config.Environment == "dev" {
		timeToWait = 10 * time.Second
	}
	for {
		r.updateRegisteredNodes()

		time.Sleep(timeToWait)
	}
}
