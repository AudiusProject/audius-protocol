package em

import (
	"encoding/hex"
	"encoding/json"
	"fmt"
	"time"
)

type IdentityRelayMessage struct {
	ContractRegistryKey string `json:"contractRegistryKey"`
	ContractAddress     string `json:"contractAddress"`
	SenderAddress       string `json:"senderAddress"`
	EncodedABI          string `json:"encodedABI"`
}

type EntityManagerAction struct {
	UserID     int64
	Action     string
	EntityType string
	EntityID   int64
	Metadata   string

	// the raw json fetched from the Metadata CID
	MetadataJSON json.RawMessage

	// wallet address for UserID
	// for "on chain" it's valid
	// for "off chain" we need to do eip712 recovery
	Signer string

	// either the blocktime, or the nats jetstream time
	Timestamp time.Time

	// these are populated if it came from chain
	blockNumber int
	blockhash   string
	txHash      string
	txIndex     int
}

func (a EntityManagerAction) String() string {
	return fmt.Sprintf("user=%d action=%s type=%s id=%d meta=%s at=%s", a.UserID, a.Action, a.EntityType, a.EntityID, a.Metadata, a.Timestamp)
}

// this deals with the encoded abi that is the tx input
// if reading from the chain we can use the emitted log event
// but here we parse the encoded abi
func UnpackEntityManagerParams(txInput string) (map[string]interface{}, error) {

	// decode txInput method signature
	decodedSig, err := hex.DecodeString(txInput[2:10])
	if err != nil {
		return nil, err
	}

	// recover Method from signature and ABI
	method, err := emAbi.MethodById(decodedSig)
	if err != nil {
		return nil, err
	}

	// decode txInput Payload
	decodedData, err := hex.DecodeString(txInput[10:])
	if err != nil {
		return nil, err
	}

	m := map[string]interface{}{}
	err = method.Inputs.UnpackIntoMap(m, decodedData)
	if err != nil {
		return nil, err
	}

	return m, nil

}
