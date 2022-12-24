package rpcz

import (
	"log"

	"comms.audius.co/config"
	"github.com/nats-io/nats.go"
)

func SetupRateLimitRules() {
	kv, err := JetstreamClient.CreateKeyValue(&nats.KeyValueConfig{
		Bucket:   config.RateLimitRulesBucketName,
		Replicas: config.NatsReplicaCount,
	})
	if err != nil {
		log.Fatal("CreateKeyValue failed ", err, " bucket: ", config.RateLimitRulesBucketName)
	}

	for rule, limit := range config.RateLimitRules {
		_, err := kv.PutString(rule, limit)
		if err != nil {
			log.Fatal("Failed to put in KV ", err, " bucket: ", config.RateLimitRulesBucketName, " key: ", rule, " value: ", limit)
		}
	}
}
