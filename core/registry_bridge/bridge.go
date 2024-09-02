package registry_bridge

import "time"

func (r *Registry) Start() error {
	timeToWait := 8 * time.Hour

	// query local chain every 10 secs because it's free
	if r.config.Environment == "dev" {
		timeToWait = 10 * time.Second
	}

	r.stopChan = make(chan struct{})

	for {
		r.updateRegisteredNodes()

		select {
		case <-time.After(timeToWait):
		case <-r.stopChan:
			return nil
		}
	}
}

func (r *Registry) Stop() {
	close(r.stopChan)
}
