// Package jobsmonitor watches KV bucket for status changes and updates job info.
package jobsmonitor

import (
	"encoding/json"
	"net"
	"sort"
	"sync"

	"comms.audius.co/storage/jobs"
	"comms.audius.co/storage/jobs/jobsutil"
	"github.com/gobwas/ws"
	"github.com/gobwas/ws/wsutil"
	"github.com/inconshreveable/log15"
	"github.com/nats-io/nats.go"
)

type JobsMonitor interface {
	PutInTable(jobs.Job)
	GetJob(id string) jobs.Job
	GetObject(bucket string, key string) (nats.ObjectResult, error)
	RegisterWebsocket(conn net.Conn)
	List() []jobs.Job
}

type jobsMonitor struct {
	table      map[string]jobs.Job
	websockets map[net.Conn]bool
	mu         sync.RWMutex
	logger     log15.Logger
	objStore   nats.ObjectStore
	watcher    nats.KeyWatcher
	isCurrent  bool
}

func New(objStore nats.ObjectStore, watcher nats.KeyWatcher, logger log15.Logger) JobsMonitor {
	monitor := &jobsMonitor{
		table:      make(map[string]jobs.Job),
		websockets: make(map[net.Conn]bool),
		logger:     logger,
		objStore:   objStore,
		watcher:    watcher,
	}
	go monitor.watch()
	return monitor
}

func (monitor *jobsMonitor) PutInTable(job jobs.Job) {
	monitor.mu.Lock()
	monitor.table[job.GetID()] = job
	monitor.mu.Unlock()
}

func (monitor *jobsMonitor) GetJob(id string) jobs.Job {
	monitor.mu.RLock()
	defer monitor.mu.RUnlock()
	return monitor.table[id]
}

func (monitor *jobsMonitor) GetObject(bucket string, key string) (nats.ObjectResult, error) {
	// TODO: sharding
	return monitor.objStore.Get(key)
}

func (monitor *jobsMonitor) RegisterWebsocket(conn net.Conn) {
	monitor.mu.Lock()
	monitor.websockets[conn] = true
	monitor.mu.Unlock()

	jobs := monitor.List()
	payload, _ := json.Marshal(jobs)
	monitor.websocketSend(conn, payload)
}

func (monitor *jobsMonitor) List() []jobs.Job {
	monitor.mu.RLock()
	defer monitor.mu.RUnlock()

	jobs := make([]jobs.Job, 0, len(monitor.table))
	for _, j := range monitor.table {
		jobs = append(jobs, j)
	}

	// Sort reverse chronological
	sort.Slice(jobs, func(i, j int) bool {
		return jobs[j].GetCreatedAt().Before(*jobs[i].GetCreatedAt())
	})

	return jobs
}

func (monitor *jobsMonitor) watch() {
	for change := range monitor.watcher.Updates() {
		if change == nil {
			monitor.isCurrent = true
			continue
		}

		// Read value of job after latest change
		job, err := jobsutil.UnmarshalJobFromJson(change.Value())
		if err != nil {
			monitor.logger.Warn(err.Error())
			continue
		}

		// Update table
		monitor.PutInTable(job)

		// Notify listeners
		if monitor.isCurrent {
			for conn := range monitor.websockets {
				monitor.websocketSend(conn, change.Value())
			}
		}

	}
}

func (monitor *jobsMonitor) websocketSend(conn net.Conn, payload []byte) {
	err := wsutil.WriteServerMessage(conn, ws.OpText, payload)
	if err != nil {
		// If write fails, remove this conn
		monitor.logger.Debug("Removing conn " + err.Error())
		monitor.mu.Lock()
		delete(monitor.websockets, conn)
		monitor.mu.Unlock()
	}
}
