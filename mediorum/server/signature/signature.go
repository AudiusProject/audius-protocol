package signature

import (
	"encoding/hex"
	"encoding/json"

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
