package registry_bridge

import "time"

func (r *Registry) Start() error {
	timeToWait := 8 * time.Hour

	// query local chain every 10 secs because it's free
	if r.config.Environment == "dev" || r.config.Environment == "sandbox" {
		timeToWait = 30 * time.Second
	}

	r.stopChan = make(chan struct{})

	for {
		if err := r.RegisterSelf(); err != nil {
			r.logger.Errorf("node registration failed, will try again: %v", err)
		}

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
