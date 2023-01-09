package jetstream

import (
	"sync"

	"github.com/nats-io/nats.go"
)

type JetstreamClient struct {
	sync.Mutex
	context nats.JetStreamContext
}

var (
	jetstreamClient JetstreamClient
)

func SetJetstreamContext(jsc nats.JetStreamContext) {
	client := &jetstreamClient
	client.Lock()
	client.context = jsc
	client.Unlock()
}

func GetJetstreamContext() nats.JetStreamContext {
	client := &jetstreamClient
	client.Lock()
	defer client.Unlock()
	return client.context
}
