package server

import (
	"time"
)

func (ss *MediorumServer) startHealthBroadcaster() {
	ss.logger.Debug("starting health broadcaster")

	delay := time.Second * 45

	for {
		select {
		case <-ss.quit:
			ss.logger.Debug("health broadcaster exit")
			return
		case <-time.After(delay):
			ss.crud.Patch(ss.healthReport())

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
