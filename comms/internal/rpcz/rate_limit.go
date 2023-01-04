package rpcz

import (
	"log"

	"comms.audius.co/config"
	"comms.audius.co/jetstream"
	"github.com/nats-io/nats.go"
)

func SetupRateLimitRules() {
	jsc := jetstream.GetJetstreamContext()
	if jsc == nil {
		log.Fatal("jetstream not ready")
	}
	kv, err := jsc.CreateKeyValue(&nats.KeyValueConfig{
		Bucket:   config.RateLimitRulesBucketName,
		Replicas: config.NatsReplicaCount,
	})
	if err != nil {
		log.Fatal("CreateKeyValue failed ", err, " bucket: ", config.RateLimitRulesBucketName)
	}

	for rule, limit := range config.DefaultRateLimitRules {
		_, err := kv.PutString(rule, limit)
		if err != nil {
			log.Fatal("failed to put in KV ", err, " bucket: ", config.RateLimitRulesBucketName, " key: ", rule, " value: ", limit)
		}
	}
}
