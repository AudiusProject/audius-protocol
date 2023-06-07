package signature

import (
	"crypto/ecdsa"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"sort"
	"time"

	"github.com/ethereum/go-ethereum/accounts"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/gowebpki/jcs"
	"github.com/storyicon/sigverify"
)

type SignatureEnvelope struct {
	Data      string
	Signature string
}

type SignatureData struct {
	Cid         string `json:"cid"`
	ShouldCache int    `json:"shouldCache"`
	Timestamp   int64  `json:"timestamp"`
	TrackId     int64  `json:"trackId"`
}

type RecoveredSignature struct {
	Data         SignatureData
	SignerWallet string
}

type ListenTSSignature struct {
	Signature string
	Timestamp string
}

func (r *RecoveredSignature) String() string {
	j, _ := json.Marshal(r)
	return string(j)
}

func ParseFromQueryString(queryStringValue string) (*RecoveredSignature, error) {
	var envelope *SignatureEnvelope

	err := json.Unmarshal([]byte(queryStringValue), &envelope)
	if err != nil {
		return nil, err
	}

	// ensure json keys are sorted
	inner, err := jcs.Transform([]byte(envelope.Data))
	if err != nil {
		return nil, err
	}

	hash := crypto.Keccak256Hash(inner)

	signatureBytes, err := hex.DecodeString(envelope.Signature[2:])
	if err != nil {
		return nil, err
	}

	recoveredAddress, err := sigverify.EcRecoverEx(hash.Bytes(), signatureBytes)
	if err != nil {
		return nil, err
	}

	var data SignatureData
	err = json.Unmarshal([]byte(envelope.Data), &data)
	if err != nil {
		return nil, err
	}

	recovered := &RecoveredSignature{
		Data:         data,
		SignerWallet: recoveredAddress.String(),
	}

	return recovered, nil
}

func GenerateListenTimestampAndSignature(privateKey *ecdsa.PrivateKey) (*ListenTSSignature, error) {
	// based on: https://github.com/AudiusProject/audius-protocol/blob/main/creator-node/src/apiSigning.ts
	// '{"data":"listen","timestamp":"2023-05-24T15:37:57.051Z"}'
	timestamp := time.Now().UTC().Format(time.RFC3339)
	data := fmt.Sprintf("{\"data\":\"listen\",\"timestamp\":\"%s\"}", timestamp)

	signature, err := Sign(data, privateKey)
	if err != nil {
		fmt.Println("Error signing message:", err)
		return nil, err
	}
	signatureHex := fmt.Sprintf("0x%s", hex.EncodeToString(signature))

	return &ListenTSSignature{
		Signature: signatureHex,
		Timestamp: timestamp,
	}, nil
}

// From https://github.com/AudiusProject/sig/blob/main/go/index.go
func Sign(input string, privateKey *ecdsa.PrivateKey) ([]byte, error) {
	// hash the input
	hash := crypto.Keccak256Hash([]byte(input))
	// TextHash will prepend Ethereum signed message prefix to the hash
	// and hash that again
	hash2 := accounts.TextHash(hash.Bytes())

	signature, err := crypto.Sign(hash2, privateKey)
	if err != nil {
		return nil, err
	}
	return signature, nil
}

// From https://github.com/AudiusProject/sig/blob/main/go/index.go
func recover(input string, signature []byte) (common.Address, error) {
	hash := crypto.Keccak256Hash([]byte(input))
	return sigverify.EcRecoverEx(hash.Bytes(), signature)
}

func sortedMap(m map[string]interface{}) map[string]interface{} {
	keys := make([]string, 0, len(m))
	for k := range m {
		keys = append(keys, k)
	}
	sort.Strings(keys)

	result := make(map[string]interface{})
	for _, k := range keys {
		switch v := m[k].(type) {
		case map[string]interface{}:
			result[k] = sortedMap(v)
		case []interface{}:
			arr := make([]interface{}, len(v))
			for i, elem := range v {
				if elemMap, ok := elem.(map[string]interface{}); ok {
					arr[i] = sortedMap(elemMap)
				} else {
					arr[i] = elem
				}
			}
			result[k] = arr
		default:
			result[k] = v
		}
	}

	return result
}

func SortKeys(data interface{}) (string, error) {
	jsonString, err := json.Marshal(data)
	if err != nil {
		return "", err
	}

	var dataMap map[string]interface{}
	err = json.Unmarshal(jsonString, &dataMap)
	if err != nil {
		return "", err
	}

	sortedDataMap := sortedMap(dataMap)

	sortedJsonString, err := json.Marshal(sortedDataMap)
	if err != nil {
		return "", err
	}

	return string(sortedJsonString), nil
}
