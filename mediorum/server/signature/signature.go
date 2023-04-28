package signature

import (
	"encoding/hex"
	"encoding/json"

	"github.com/ethereum/go-ethereum/crypto"
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

	hashData := crypto.Keccak256([]byte(envelope.Data))

	signatureBytes, err := hex.DecodeString(envelope.Signature[2:])
	if err != nil {
		return nil, err
	}

	// I hate etherum
	signatureBytes[64] -= 27

	recoveredSigner, err := crypto.Ecrecover(hashData, signatureBytes)
	if err != nil {
		return nil, err
	}

	recoveredPublicKey, err := crypto.UnmarshalPubkey(recoveredSigner)
	if err != nil {
		return nil, err
	}

	recoveredAddress := crypto.PubkeyToAddress(*recoveredPublicKey).Hex()

	var data SignatureData
	err = json.Unmarshal([]byte(envelope.Data), &data)
	if err != nil {
		return nil, err
	}

	recovered := &RecoveredSignature{
		Data:         data,
		SignerWallet: recoveredAddress,
	}

	return recovered, nil
}
