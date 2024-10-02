package registry_bridge

import (
	"context"
	"time"
)

func (r *Registry) Start() error {
	retries := 60
	delay := 1 * time.Minute

	if err := r.awaitNodeCatchup(context.Background()); err != nil {
		return err
	}

	for {
		if err := r.RegisterSelf(); err != nil {
			r.logger.Errorf("node registration failed, will try again: %v", err)
			time.Sleep(delay)
			retries -= 1
			if retries == 0 {
				r.logger.Warn("exhaused registration retries")
				break
			}
		} else {
			return nil
		}
	}
	return nil
}
