package utils

import (
	"crypto/ecdsa"
	"crypto/elliptic"
	"encoding/json"

	"comms.audius.co/shared/peering"
	"github.com/ethereum/go-ethereum/crypto"
	"golang.org/x/exp/slices"
)

func IsValidDiscoveryNode(wallet string) bool {

	p := peering.New(nil)

	nodes, err := p.GetDiscoveryNodes()
	if err != nil {
		return false
	}

	wallets := make([]string, len(nodes))
	for _, value := range nodes {
		wallets = append(wallets, value.DelegateOwnerWallet)
	}

	includes := slices.Contains(wallets, wallet)
	return includes
}

func GenerateSignature[T any](data map[string]T, privateKey *ecdsa.PrivateKey) ([]byte, error) {
	toSignStr, err := json.Marshal(data)
	if err != nil {
		return []byte{}, nil
	}

	toSignHash := crypto.Keccak256(toSignStr)
	signedResponse, err := crypto.Sign(toSignHash, privateKey)
	if err != nil {
		return []byte{}, err
	}

	return signedResponse, nil
}

func GenerateSignatureForString(data []byte, privateKey *ecdsa.PrivateKey) ([]byte, error) {
	toSignHash := crypto.Keccak256(data)
	signedResponse, err := crypto.Sign(toSignHash, privateKey)
	if err != nil {
		return []byte{}, err
	}

	return signedResponse, nil
}

func MarshalPubECDSA(key *ecdsa.PublicKey) []byte {
	var identifier []byte
	switch key.Params().BitSize {
	case 256:
		identifier = []byte("nistp256")
	case 384:
		identifier = []byte("nistp384")
	case 521:
		identifier = []byte("nistp521")
	default:
		panic("ssh: unsupported ecdsa key size")
	}
	keyBytes := elliptic.Marshal(key.Curve, key.X, key.Y)

	length := len(identifier) + 4
	length += len(keyBytes) + 4

	ret := make([]byte, length)
	r := marshalString(ret, identifier)
	r = marshalString(r, keyBytes)
	return ret
}

func marshalString(to []byte, s []byte) []byte {
	to[0] = byte(len(s) >> 24)
	to[1] = byte(len(s) >> 16)
	to[2] = byte(len(s) >> 8)
	to[3] = byte(len(s))
	to = to[4:]
	copy(to, s)
	return to[len(s):]
}