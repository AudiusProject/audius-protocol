package pubkeystore

import (
	"context"
	"encoding/base64"
	"errors"
	"math/big"

	"comms.audius.co/discovery/config"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/common/math"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/ethereum/go-ethereum/signer/core/apitypes"
)

func findAddUserTransaction(ctx context.Context, blockNumber *big.Int) (string, error) {
	var chainId int64 = 99
	verifyingContract := "0x981c44040cb6150a2b8a7f63fb182760505bf666"

	if config.IsStaging {
		chainId = 77
		verifyingContract = "0x39d26a6a138ddf8b447d651d5d3883644d277251"
	}

	block, err := poaClient.BlockByNumber(ctx, blockNumber)
	if err != nil {
		return "", err
	}

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
			"AddUserRequest": []apitypes.Type{
				{
					Name: "handle",
					Type: "bytes16",
				},
				{
					Name: "nonce",
					Type: "bytes32",
				},
			},
		},
		Domain: apitypes.TypedDataDomain{
			Name:              "User Factory",
			Version:           "1",
			ChainId:           math.NewHexOrDecimal256(chainId),
			VerifyingContract: verifyingContract,
		},
		PrimaryType: "AddUserRequest",
		Message:     map[string]interface{}{},
	}

	// try each transaction in this block to find the one that checks out
	// skip any that fail
	for _, tx := range block.Transactions() {

		params, err := unpackTransactionInput(tx.Data())
		if err != nil {
			continue
		}

		// we have loaded both ABIs in our ABI instance
		// so it's possible to successfully decode a EM tx when we are looking for an addUser
		// if the params contains _entityId it is not the tx we are looking for
		if _, ok := params["_entityId"]; ok {
			continue
		}

		owner := params["_owner"].(common.Address)
		handle := params["_handle"].([16]byte)
		nonce := params["_nonce"].([32]byte)
		subjectSig := params["_subjectSig"].([]byte)

		typedData.Message["handle"] = handle[:]
		typedData.Message["nonce"] = nonce[:]

		pubkeyBytes, err := recoverPublicKey(subjectSig, typedData)
		if err != nil {
			continue
		}

		pubkey, err := crypto.UnmarshalPubkey(pubkeyBytes)
		if err != nil {
			continue
		}
		address := crypto.PubkeyToAddress(*pubkey)

		if address == owner {
			// success
			return base64.StdEncoding.EncodeToString(pubkeyBytes), nil
		}

	}

	return "", errors.New("not found")
}
