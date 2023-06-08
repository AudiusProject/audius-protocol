package rpcz

import (
	"crypto/ecdsa"
	"encoding/base64"
	"encoding/json"

	"comms.audius.co/discovery/schema"
	"github.com/ethereum/go-ethereum/crypto"
)

func PrepareSignedRpcLog(rpc *schema.RawRPC, privateKey *ecdsa.PrivateKey) (*schema.RpcLog, error) {
	rpcJson, err := json.Marshal(rpc)
	if err != nil {
		return nil, err
	}

	msgHash := crypto.Keccak256Hash(rpcJson)
	sig, err := crypto.Sign(msgHash[:], privateKey)
	if err != nil {
		return nil, err
	}

	sigBase64 := base64.StdEncoding.EncodeToString(sig)
	// return sigBase64, nil

	wallet := crypto.PubkeyToAddress(privateKey.PublicKey).Hex()

	rpcLog := &schema.RpcLog{
		Rpc:        rpcJson,
		Sig:        sigBase64,
		FromWallet: wallet,
	}

	return rpcLog, nil
}
