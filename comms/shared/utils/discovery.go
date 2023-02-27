package utils

import (
	"crypto/ecdsa"
	"encoding/json"
	"strings"

	"comms.audius.co/shared/config"
	"github.com/ethereum/go-ethereum/crypto"
	"golang.org/x/exp/slices"
)

func IsValidDiscoveryNode(nodes []config.ServiceNode, wallet string) bool {
	wallets := make([]string, len(nodes))
	for _, value := range nodes {
		wallets = append(wallets, strings.ToLower(value.DelegateOwnerWallet))
	}

	includes := slices.Contains(wallets, strings.ToLower(wallet))
	return includes
}

func GenerateSignature[T any](data T, privateKey *ecdsa.PrivateKey) ([]byte, error) {
	toSignStr, err := json.Marshal(data)
	if err != nil {
		return nil, err
	}

	toSignHash := crypto.Keccak256(toSignStr)
	signedResponse, err := crypto.Sign(toSignHash, privateKey)
	if err != nil {
		return nil, err
	}

	return signedResponse, nil
}
