package pubkeystore

import (
	"context"
	"encoding/base64"
	"errors"
	"fmt"
	"math/big"
	"strings"

	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/common/math"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/ethereum/go-ethereum/signer/core/apitypes"
)

func recoverEntityManagerPubkey(ethClient *ethclient.Client, txhash string, wallet string) (string, error) {
	ctx := context.Background()

	tx, _, err := ethClient.TransactionByHash(ctx, common.HexToHash(txhash))
	if err != nil {
		return "", err
	}

	chainId, err := ethClient.ChainID(ctx)
	if err != nil {
		return "", err
	}

	params, err := unpackTransactionInput(tx.Data())
	if err != nil {
		return "", err
	}

	// since both ABIs are loaded... check that we have an entity manager tx
	// and not a UserReplicaSet... which is signed by a different keypair
	entityType, ok := params["_entityType"]
	if !ok {
		return "", errors.New("not an entity manager txn")
	}
	if entityType == "UserReplicaSet" {
		return "", errors.New("tx not signed by user keypair")
	}

	nonce := params["_nonce"].([32]byte)
	subjectSig := params["_subjectSig"].([]byte)

	var typedData = apitypes.TypedData{
		Types: apitypes.Types{
			"EIP712Domain": []apitypes.Type{
				{
					Name: "name",
					Type: "string",
				},
				{
					Name: "version",
					Type: "string",
				},
				{
					Name: "chainId",
					Type: "uint256",
				},
				{
					Name: "verifyingContract",
					Type: "address",
				},
			},
			"ManageEntity": []apitypes.Type{
				{
					Name: "userId",
					Type: "uint",
				},
				{
					Name: "entityType",
					Type: "string",
				},
				{
					Name: "entityId",
					Type: "uint",
				},
				{
					Name: "action",
					Type: "string",
				},
				{
					Name: "metadata",
					Type: "string",
				},
				{
					Name: "nonce",
					Type: "bytes32",
				},
			},
		},
		Domain: apitypes.TypedDataDomain{
			Name:              "Entity Manager",
			Version:           "1",
			ChainId:           math.NewHexOrDecimal256(chainId.Int64()),
			VerifyingContract: tx.To().Hex(),
		},
		PrimaryType: "ManageEntity",
		Message: map[string]interface{}{
			"userId":     params["_userId"].(*big.Int).String(),
			"entityType": params["_entityType"],
			"entityId":   params["_entityId"].(*big.Int).String(),
			"action":     params["_action"],
			"metadata":   params["_metadata"],
			"nonce":      nonce[:],
		},
	}

	pubkeyBytes, err := recoverPublicKey(subjectSig, typedData)
	if err != nil {
		return "", err
	}

	pubkey, err := crypto.UnmarshalPubkey(pubkeyBytes)
	if err != nil {
		return "", err
	}

	address := crypto.PubkeyToAddress(*pubkey)

	if !strings.EqualFold(address.String(), wallet) {
		fmt.Println(params, address, wallet)
		return "", errors.New("wallets don't match")
	}

	return base64.StdEncoding.EncodeToString(pubkeyBytes), nil
}
