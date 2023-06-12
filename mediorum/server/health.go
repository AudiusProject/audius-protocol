package server

import (
	"time"
)

func (ss *MediorumServer) startHealthBroadcaster() {
	ss.logger.Debug("starting health broadcaster")

	// broadcast health more often on boot (1s)
	// and more slowly after (45s)
	count := 0
	delay := time.Second

	for {
		select {
		case <-ss.quit:
			ss.logger.Debug("health broadcaster exit")
			return
		case <-time.After(delay):
			ss.crud.Patch(ss.healthReport())
			if count < 10 {
				count++
			} else if count == 10 {
				delay = time.Second * 45
			}
		}
	}
}

func (ss *MediorumServer) healthReport() ServerHealth {
	return ServerHealth{
		Host:      ss.Config.Self.Host,
		StartedAt: ss.StartedAt,
		AliveAt:   time.Now().UTC(),
		Version:   vcsRevision,
		BuiltAt:   vcsBuildTime,
	}
}
