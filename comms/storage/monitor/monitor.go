// Package monitor provides a way to sync up each node's state to NATS so that any node can query the state of any other node.
package monitor

import (
	"encoding/json"
	"fmt"
	"log"
	"time"

	"comms.audius.co/storage/decider"
	"comms.audius.co/storage/logstream"
	"github.com/avast/retry-go"
	"github.com/nats-io/nats.go"
)

type Monitor struct {
	namespace      string
	nodeStatusesKV nats.KeyValue
	healthyNodesKV nats.KeyValue
	logstream      *logstream.LogStream
	jsc            nats.JetStreamContext
	healthTTLHours float64
}

const (
	NodeStatusesKVName                 string = "nodeStatuses"
	UpdateHealthyNodeSetStreamName     string = "updateHealthyNodeSet"
	UpdateHealthyNodeSetSubj           string = "storage.updateHealthyNodeSet"
	UpdateHealthyNodeSetStreamReplicas int    = 3
)

func New(namespace string, healthyNodesKV nats.KeyValue, logstream *logstream.LogStream, healthTTLHours float64, jsc nats.JetStreamContext) *Monitor {
	// Create KV store for each node to set its endpoint, health, and the list of shards it stores
	nodeStatusesKV, err := jsc.CreateKeyValue(&nats.KeyValueConfig{
		Bucket:      NodeStatusesKVName,
		Description: "Each node's endpoint, health, and the list of shards it stores",
	})
	if err != nil {
		log.Fatalf("failed to create nodeStatuses KV store: %v", err)
	}

	return &Monitor{
		namespace:      namespace,
		nodeStatusesKV: nodeStatusesKV,
		healthyNodesKV: healthyNodesKV,
		logstream:      logstream,
		jsc:            jsc,
		healthTTLHours: healthTTLHours,
	}
}

// GetNodeStatuses returns a map of pubKey to NodeStatus for all nodes in the network.
func (m Monitor) GetNodeStatuses() (map[string]logstream.NodeStatus, error) {
	nodeStatuses := make(map[string]logstream.NodeStatus)

	pubKeys, err := m.nodeStatusesKV.Keys()
	if err != nil {
		return nil, err
	}
	for _, pubKey := range pubKeys {
		nodeStatus := logstream.NodeStatus{}
		entry, err := m.nodeStatusesKV.Get(pubKey)
		if err != nil {
			return nil, err
		}
		err = json.Unmarshal(entry.Value(), &nodeStatus)
		if err != nil {
			return nil, err
		}
		nodeStatuses[pubKey] = nodeStatus
	}

	return nodeStatuses, nil
}

// SetNodeStatusOKOnInterval sets the node's status to OK on the given interval.
func (m Monitor) SetNodeStatusOKOnInterval(nodePubKey, host string, d *decider.RendezvousDecider, intervalSeconds int) {
	// Run once immediately
	err := m.setOKStatus(nodePubKey, host, d.ShardsStored)
	if err != nil {
		log.Printf("Failed to set OK status for node %s: %v", nodePubKey, err)
	}

	// Run on interval
	go func() {
		for range time.Tick(time.Second * time.Duration(intervalSeconds)) {
			err := m.setOKStatus(nodePubKey, host, d.ShardsStored)
			if err != nil {
				log.Printf("Failed to set OK status for node %s: %v", nodePubKey, err)
			}
		}
	}()
}

// UpdateHealthyNodeSetOnInterval sets up a subscriber to process 1 updateHealthyNodeSet message every intervalHours hours.
// Publishes 1 updateHealthyNodeSet message immdediately. The message is Nak'd until it's time to update the set of healthy nodes. Then it's Nak'd again until the next interval.
func (m Monitor) UpdateHealthyNodeSetOnInterval(intervalHours float64) error {
	// Create stream
	_, err := m.jsc.AddStream(&nats.StreamConfig{
		Name:        UpdateHealthyNodeSetStreamName,
		Description: "Stream for message to trigger an update of the set of healthy nodes",
		Replicas:    UpdateHealthyNodeSetStreamReplicas,
		Subjects:    []string{UpdateHealthyNodeSetSubj},
		Retention:   nats.WorkQueuePolicy,
		MaxMsgs:     1, // We only need 1 message in the stream - we just Nak it until it's time to update the set of healthy nodes, and then Nak again for the next interval
	})
	if err != nil {
		return fmt.Errorf("failed to create updateHealthyNodeSet stream: %v", err)
	}

	// Send an updateHealthyNodeSet message
	_, err = m.jsc.Publish(UpdateHealthyNodeSetSubj, []byte{})
	if err != nil {
		log.Printf("warn: failed to publish updateHealthyNodeSet msg: %v", err)
	}

	// Set up subscriber to only process 1 updateHealthyNodeSet message every intervalHours hours.
	// Nak the message with a delay so it gets infinitely reprocessed (default nats.MaxDeliver=0) on the interval.
	var sub *nats.Subscription
	err = retry.Do(
		func() error {
			var err error
			sub, err = m.jsc.QueueSubscribeSync("", UpdateHealthyNodeSetStreamName, nats.BindStream(UpdateHealthyNodeSetStreamName))
			if err != nil {
				return err
			}
			return nil
		},
	)
	if err != nil {
		return fmt.Errorf("failed to create updateHealthyNodeSet KV subscription: %v", err)
	}
	go func() {
		for {
			msg, err := sub.NextMsg(5 * time.Second)
			if err == nats.ErrTimeout {
				continue
			}
			if err != nil {
				fmt.Printf("error getting updateHealthyNodeSet msg: %v\n", err)
				continue
			}

			numUpdates, err := m.healthyNodesKV.History(m.namespace)

			// Init flow -- ignore intervalHours and just update immediately for the first 10 times.
			// Otherwise we could run into a race condition where the healthy node set is empty during startup.
			if err == nats.ErrKeyNotFound || len(numUpdates) < 10 {
				err = m.updateHealthyNodeSet()
				if err != nil {
					fmt.Printf("error updating set of healthy nodes: %v\n", err)
				}
				msg.NakWithDelay(15 * time.Second) // Delay 15s to give other nodes time to come online and update their statuses
			} else if err == nil {
				// No error - update if it's been more than intervalHours since last update
				currHealthyNodes, err := m.healthyNodesKV.Get(m.namespace)
				if err != nil {
					fmt.Printf("error getting healthyNodes KV: %v\n", err)
					msg.Nak()
					continue
				}
				nextUpdateTime := currHealthyNodes.Created().UTC().Add(time.Duration(float64(time.Hour) * intervalHours))
				if time.Now().UTC().After(nextUpdateTime) {
					err = m.updateHealthyNodeSet()
					if err != nil {
						fmt.Printf("error updating set of healthy nodes: %v\n", err)
					}
				}

				// Delay until next update time
				msg.NakWithDelay(nextUpdateTime.Sub(time.Now().UTC()) + time.Second)
			} else {
				// Error reading KV - retry immediately
				if err != nil {
					fmt.Printf("error reading healthyNodes KV history: %v\n", err)
					msg.Nak()
				}
			}
		}
	}()
	return nil
}

func (m Monitor) setOKStatus(nodePubKey, host string, shards []string) error {
	status, err := json.Marshal(logstream.NodeStatus{
		Host:   host,
		LastOK: time.Now().UTC(),
		Shards: shards,
	})
	if err != nil {
		return err
	}
	m.logstream.LogStatusUpdate(status)
	_, err = m.nodeStatusesKV.Put(nodePubKey, status)
	if err != nil {
		return err
	}
	return nil
}

// updateHealthyNodeSet updates the healthyNodes KV with all nodes that reported an OK status within the last m.healthTTLHours hours.
func (m Monitor) updateHealthyNodeSet() error {
	nodeStatuses, err := m.GetNodeStatuses()
	if err != nil {
		return fmt.Errorf("failed to get node statuses: %v", err)
	}
	healthyNodes := make([]string, 0, len(nodeStatuses))
	for nodePubKey, nodeStatus := range nodeStatuses {
		if time.Now().UTC().Sub(nodeStatus.LastOK) < time.Duration(float64(time.Hour)*m.healthTTLHours) {
			healthyNodes = append(healthyNodes, nodePubKey)
		}
	}

	healthyNodesBytes, err := json.Marshal(healthyNodes)
	if err != nil {
		return fmt.Errorf("failed to marshal healthy nodes: %v", err)
	}
	m.logstream.LogUpdateHealthyNodeSet(healthyNodes)
	_, err = m.healthyNodesKV.Put(m.namespace, healthyNodesBytes)
	if err != nil {
		return err
	}
	return nil
}
