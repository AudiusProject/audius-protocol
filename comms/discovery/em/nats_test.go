package em

import (
	"encoding/json"
	"fmt"
	"log"
	"math/big"
	"testing"
	"time"

	"comms.audius.co/discovery/config"
	"github.com/nats-io/nats.go"
	"github.com/stretchr/testify/assert"
)

var txInput = `0xd622c72d000000000000000000000000000000000000000000000000000000007dc490dc00000000000000000000000000000000000000000000000000000000000000e000000000000000000000000000000000000000000000000000000000000005ad00000000000000000000000000000000000000000000000000000000000001200000000000000000000000000000000000000000000000000000000000000160bc34971a7aa58d726c745d4dd989e046233e0a48e232c80dd9115f118b013ebd00000000000000000000000000000000000000000000000000000000000001800000000000000000000000000000000000000000000000000000000000000005547261636b0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000004536176650000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000041cc63c27f21b2ec8687e1f0168977400c379c2feaf8a4f8d9e9159ad9458a2de60bc3c0245d4bb2d8f2f69b9e547e80033e353c299f8ce05fb1781e1a7e87b74e1b00000000000000000000000000000000000000000000000000000000000000`

func TestAbi(t *testing.T) {
	params, err := UnpackEntityManagerParams(txInput)
	assert.NoError(t, err)
	fmt.Println(params)
}

func TestNatsThing(t *testing.T) {
	t.Skip()

	config.IsStaging = true // dagron

	cf, err := NewCidFetcher()
	assert.NoError(t, err)
	_ = cf

	// Connect to NATS
	nc, err := nats.Connect(nats.DefaultURL)
	assert.NoError(t, err)

	// Create JetStream Context
	js, err := nc.JetStream(nats.PublishAsyncMaxPending(256))
	assert.NoError(t, err)

	// Simple Async Ephemeral Consumer
	sub, err := js.SubscribeSync("audius.staging.>")
	assert.NoError(t, err)

	for {
		m, err := sub.NextMsg(time.Second)
		if err != nil {
			log.Println(err)
			break
		}

		var relay IdentityRelayMessage
		json.Unmarshal(m.Data, &relay)

		params, err := UnpackEntityManagerParams(relay.EncodedABI)
		assert.NoError(t, err)
		// fmt.Println(relay.ContractAddress, params["_userId"], params["_action"], params["_entityType"], params["_entityId"], params["_metadata"])

		action := EntityManagerAction{
			UserID:     params["_userId"].(*big.Int).Int64(),
			Action:     params["_action"].(string),
			EntityType: params["_entityType"].(string),
			EntityID:   params["_entityId"].(*big.Int).Int64(),
			Metadata:   params["_metadata"].(string),

			// todo: eip712 recover + verify this
			Signer: relay.SenderAddress,
		}

		natsMeta, err := m.Metadata()
		if err != nil {
			panic(err)
		}
		action.Timestamp = natsMeta.Timestamp

		// todo: combine with identitcal code in em_chain_test.go
		if action.Metadata != "" && action.EntityType != "UserReplicaSet" {
			j, err := cf.Fetch(action.UserID, action.Metadata)
			if err != nil {
				config.Logger.Warn(err.Error())
			} else {
				action.MetadataJSON = j
			}
		}

	}

	sub.Unsubscribe()

}
