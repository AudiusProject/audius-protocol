// Package logstream provides a way to log a node's core actions to a NATS stream for visibility and debugging.
package logstream

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/avast/retry-go"
	"github.com/nats-io/nats.go"
	"golang.org/x/exp/slog"
)

const StreamName string = "storageLog"

type LogStream struct {
	namespace string
	pubKey    string
	jsc       nats.JetStreamContext
}

type NodeStatus struct {
	Host   string    `json:"host"`
	LastOK time.Time `json:"lastOk"`
	Shards []string  `json:"shards"`
}

type UpdateHealthyNodeSetLog struct {
	Timestamp    time.Time `json:"timestamp"`
	HealthyNodes []string  `json:"healthyNodes"`
	UpdatedBy    string    `json:"updatedBy"`
}

type RebalanceStartLog struct {
	Timestamp  time.Time `json:"timestamp"`
	PrevShards []string  `json:"prevShards"`
	NewShards  []string  `json:"newShards"`
}

type RebalanceEndLog struct {
	Timestamp  time.Time `json:"timestamp"`
	PrevShards []string  `json:"prevShards"`
	NewShards  []string  `json:"newShards"`
	// TODO: Time spent, numFiles per shard, etc...
}

func New(namespace string, pubKey string, jsc nats.JetStreamContext) (*LogStream, error) {
	err := retry.Do(func() error {
		_, err := jsc.AddStream(&nats.StreamConfig{
			Name:        StreamName,
			Description: "Core actions logged by each node",
			Subjects:    []string{"storage.log.*.statusUpdate", "storage.log.updateHealthyNodeSet", "storage.log.*.rebalanceStart", "storage.log.*.rebalanceEnd"},
			Replicas:    3,
		})
		return err
	}, retry.Attempts(5))
	if err != nil {
		return nil, err
	}

	return &LogStream{
		namespace: namespace,
		pubKey:    pubKey,
		jsc:       jsc,
	}, nil
}

func (ls LogStream) LogStatusUpdate(status []byte) {
	err := retry.Do(func() error {
		_, err := ls.jsc.Publish(fmt.Sprintf("storage.log.%s.statusUpdate", ls.pubKey), status)
		return err
	})
	if err != nil {
		slog.With("pubKey", ls.pubKey).Warn("failed to record status update: %v", err)
	}
}

func (ls LogStream) LogUpdateHealthyNodeSet(healthyNodes []string) {
	msg, err := json.Marshal(UpdateHealthyNodeSetLog{
		Timestamp:    time.Now().UTC(),
		HealthyNodes: healthyNodes,
		UpdatedBy:    ls.pubKey,
	})
	if err != nil {
		slog.With("pubKey", ls.pubKey).Warn("failed to marshal data to record updateHealthyNodeSet: %v", err)
	}
	_, err = ls.jsc.Publish("storage.log.updateHealthyNodeSet", msg)
	if err != nil {
		slog.With("pubKey", ls.pubKey).Warn("failed to record updateHealthyNodeSet: %v", err)
	}
}

func (ls LogStream) LogRebalanceStart(prevShards []string, newShards []string) {
	msg, err := json.Marshal(RebalanceStartLog{
		Timestamp:  time.Now().UTC(),
		PrevShards: prevShards,
		NewShards:  newShards,
	})
	if err != nil {
		slog.With("pubKey", ls.pubKey).Warn("failed to marshal data to record rebalanceStart: %v", err)
	}
	_, err = ls.jsc.Publish(fmt.Sprintf("storage.log.%s.rebalanceStart", ls.pubKey), msg)
	if err != nil {
		slog.With("pubKey", ls.pubKey).Warn("failed to record rebalanceStart: %v", err)
	}
}

func (ls LogStream) LogRebalanceEnd(prevShards []string, newShards []string) {
	msg, err := json.Marshal(RebalanceEndLog{
		Timestamp:  time.Now().UTC(),
		PrevShards: prevShards,
		NewShards:  newShards,
	})
	if err != nil {
		slog.With("pubKey", ls.pubKey).Warn("failed to marshal data to record rebalanceEnd: %v", err)
	}
	_, err = ls.jsc.Publish(fmt.Sprintf("storage.log.%s.rebalanceEnd", ls.pubKey), msg)
	if err != nil {
		slog.With("pubKey", ls.pubKey).Warn("failed to record rebalanceEnd: %v", err)
	}
}

// GetNStatusUpdatesSince returns the first N status updates for a node that occurred on or after numHoursAgo hours ago.
func (ls LogStream) GetNStatusUpdatesSince(n int, numHoursAgo float64, pubKey string, logs *[]NodeStatus) error {
	subject := fmt.Sprintf("storage.log.%s.statusUpdate", pubKey)
	return GetNLogsForSubjSince(n, numHoursAgo, subject, ls.jsc, logs)
}

// GetNRebalanceStartSince returns the first N rebalanceStart logs for a node that occurred on or after numHoursAgo hours ago.
func (ls LogStream) GetNRebalanceStartsSince(n int, numHoursAgo float64, pubKey string, logs *[]RebalanceStartLog) error {
	subject := fmt.Sprintf("storage.log.%s.rebalanceStart", pubKey)
	return GetNLogsForSubjSince(n, numHoursAgo, subject, ls.jsc, logs)
}

// GetNRebalanceEndsSince returns the first N rebalanceEnd logs for a node that occurred on or after numHoursAgo hours ago.
func (ls LogStream) GetNRebalanceEndsSince(n int, numHoursAgo float64, pubKey string, logs *[]RebalanceEndLog) error {
	subject := fmt.Sprintf("storage.log.%s.rebalanceEnd", pubKey)
	return GetNLogsForSubjSince(n, numHoursAgo, subject, ls.jsc, logs)
}

// GetNUpdateHealthyNodeSetsSince returns the first N updateHealthyNodeSet logs for a node that occurred on or after numHoursAgo hours ago.
func (ls LogStream) GetNUpdateHealthyNodeSetsSince(n int, numHoursAgo float64, logs *[]UpdateHealthyNodeSetLog) error {
	return GetNLogsForSubjSince(n, numHoursAgo, "storage.log.updateHealthyNodeSet", ls.jsc, logs)
}

// GetNLogsForSubjSince sets *logs to the first N logs to subject starting from numHoursAgo hours ago.
func GetNLogsForSubjSince[T any](n int, numHoursAgo float64, subject string, jsc nats.JetStreamContext, logs *[]T) error {
	subscription, err := jsc.SubscribeSync(
		subject,
		nats.OrderedConsumer(),
		nats.StartTime(time.Now().UTC().Add(time.Duration(float64(-time.Hour)*numHoursAgo))),
		nats.BindStream(StreamName),
	)
	if err != nil {
		return fmt.Errorf("failed to create subscription for %T logs: %v", *logs, err)
	}
	defer subscription.Unsubscribe()

	nLogsChan := make(chan []T)
	go func() {
		var nLogs []T
		for {
			msg, err := subscription.NextMsg(3 * time.Second)
			if err != nil {
				nLogsChan <- nLogs
				return
			}

			var log T
			err = json.Unmarshal(msg.Data, &log)
			if err != nil {
				nLogsChan <- nLogs
				return
			}
			nLogs = append(nLogs, log)
			msg.AckSync()

			// Return after finding N logs
			if len(nLogs) == n {
				nLogsChan <- nLogs
				return
			}
		}
	}()

	select {
	case *logs = <-nLogsChan:
		return nil
	case <-time.After(10 * time.Second):
		return fmt.Errorf("timed out waiting for %T logs", logs)
	}
}
