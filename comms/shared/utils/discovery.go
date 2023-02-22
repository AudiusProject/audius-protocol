package utils

import (
	"crypto/ecdsa"
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

