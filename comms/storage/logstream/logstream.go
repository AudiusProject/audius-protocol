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
	HealthyNodes []string `json:"healthyNodes"`
	UpdatedBy    string   `json:"updatedBy"`
}

type RebalanceLog struct {
	PrevShards []string `json:"prevShards"`
	NewShards  []string `json:"newShards"`
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
	msg, err := json.Marshal(RebalanceLog{
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
	msg, err := json.Marshal(RebalanceLog{
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
func (ls LogStream) GetNStatusUpdatesSince(n int, numHoursAgo float64, pubKey string) ([]NodeStatus, error) {
	subject := fmt.Sprintf("storage.log.%s.statusUpdate", pubKey)
	subscription, err := ls.jsc.SubscribeSync(
		subject,
		nats.OrderedConsumer(),
		nats.StartTime(time.Now().UTC().Add(time.Duration(float64(-time.Hour)*numHoursAgo))),
		nats.BindStream(StreamName),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create subscription: %v", err)
	}
	defer subscription.Unsubscribe()

	statusUpdates := make(chan []NodeStatus)
	go func() {
		var updates []NodeStatus
		for {
			msg, err := subscription.NextMsg(3 * time.Second)
			if err != nil {
				statusUpdates <- updates
				return
			}

			var update NodeStatus
			err = json.Unmarshal(msg.Data, &update)
			if err != nil {
				statusUpdates <- updates
				return
			}
			updates = append(updates, update)
			msg.AckSync()

			// Return after N updates
			if len(updates) == n {
				fmt.Println("found all updates: ")
				statusUpdates <- updates
				return
			}
		}
	}()

	select {
	case updates := <-statusUpdates:
		fmt.Println("select case returning success")
		return updates, nil
	case <-time.After(20 * time.Second):
		fmt.Println("select case returning timeout")
		return nil, fmt.Errorf("timed out waiting for updates")
	}
}
