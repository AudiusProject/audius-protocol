// Package logstream provides a way to log a node's core actions to a NATS stream for visibility and debugging.
package logstream

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/avast/retry-go"
	"github.com/nats-io/nats.go"
	"golang.org/x/exp/slog"

	natsdConfig "comms.audius.co/natsd/config"
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
			Replicas:    natsdConfig.NatsReplicaCount,
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

// GetStatusUpdatesInRange returns status updates for a pubKey in the start to end range.
func (ls LogStream) GetStatusUpdatesInRange(start time.Time, end time.Time, pubKey string, logs *[]NodeStatus) error {
	subject := fmt.Sprintf("storage.log.%s.statusUpdate", pubKey)
	return GetLogsForSubjInRange(start, end, subject, ls.jsc, logs)
}

// GetRebalanceStartsInRange returns rebalanceStart logs for pubKey in the start to end range.
func (ls LogStream) GetRebalanceStartsInRange(start time.Time, end time.Time, pubKey string, logs *[]RebalanceStartLog) error {
	subject := fmt.Sprintf("storage.log.%s.rebalanceStart", pubKey)
	return GetLogsForSubjInRange(start, end, subject, ls.jsc, logs)
}

// GetRebalanceEndsInRange returns rebalanceEnd logs for pubKey in the start to end range.
func (ls LogStream) GetRebalanceEndsInRange(start time.Time, end time.Time, pubKey string, logs *[]RebalanceEndLog) error {
	subject := fmt.Sprintf("storage.log.%s.rebalanceEnd", pubKey)
	return GetLogsForSubjInRange(start, end, subject, ls.jsc, logs)
}

// GetUpdateHealthyNodeSetsInRange returns updateHealthyNodeSet logs in the start to end range.
func (ls LogStream) GetUpdateHealthyNodeSetsInRange(start time.Time, end time.Time, logs *[]UpdateHealthyNodeSetLog) error {
	return GetLogsForSubjInRange(start, end, "storage.log.updateHealthyNodeSet", ls.jsc, logs)
}

// GetLogsForSubjInRange sets *logs to the logs for the given subject in the start to end range.
func GetLogsForSubjInRange[T any](start time.Time, end time.Time, subject string, jsc nats.JetStreamContext, logs *[]T) error {
	subscription, err := jsc.SubscribeSync(
		subject,
		nats.OrderedConsumer(),
		nats.StartTime(start),
		nats.BindStream(StreamName),
	)
	if err != nil {
		return fmt.Errorf("failed to create subscription for %T logs: %v", *logs, err)
	}
	defer subscription.Unsubscribe()

	logsChan := make(chan []T)
	go func() {
		var logs []T
		for {
			msg, err := subscription.NextMsg(3 * time.Second)
			if err != nil {
				logsChan <- logs
				return
			}

			var log T
			err = json.Unmarshal(msg.Data, &log)
			if err != nil {
				logsChan <- logs
				return
			}
			logs = append(logs, log)
			msg.AckSync()

			// Return once we've read logs until 'end' time
			var t time.Time
			switch logType := any(log).(type) {
			case NodeStatus:
				t = logType.LastOK
			case RebalanceStartLog:
				t = logType.Timestamp
			case RebalanceEndLog:
				t = logType.Timestamp
			case UpdateHealthyNodeSetLog:
				t = logType.Timestamp
			default:
				slog.Warn("unknown log type: %T", logType)
				logsChan <- logs
				return
			}
			if t.After(end) {
				logsChan <- logs
				return
			}
		}
	}()

	select {
	case *logs = <-logsChan:
		return nil
	case <-time.After(10 * time.Second):
		return fmt.Errorf("timed out waiting for %T logs", logs)
	}
}
