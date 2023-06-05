package server

import (
	"fmt"
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

		// more health stuff like:
		// pending transcode tasks
		// is deregistering / readonly type of thing
	}
}

func (ss *MediorumServer) findHealthyPeers(aliveInLast string) ([]ServerHealth, error) {
	// was unable to get this to work with ? or $1
	// so use string interpolation.
	// this value should always be programmer provided, so not worried about sql injection
	// so long as we don't expose as a query param or whatever
	whereAlive := fmt.Sprintf("alive_at >= NOW() - INTERVAL '%s'", aliveInLast)

	healths := []ServerHealth{}
	err := ss.crud.DB.
		Where(whereAlive).
		Order("host").
		Find(&healths).
		Error
	if err != nil {
		ss.logger.Warn(err.Error())
	}
	return healths, err
}

func (ss *MediorumServer) findHealthyHostNames(aliveInLast string) []string {
	hosts := []string{}
	if healths, err := ss.findHealthyPeers(aliveInLast); err == nil {
		for _, health := range healths {
			hosts = append(hosts, health.Host)
		}
	}
	return hosts
}
