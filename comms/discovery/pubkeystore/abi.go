package pubkeystore

import (
	"strings"

	"github.com/ethereum/go-ethereum/accounts/abi"
)

var addUserAbiJson = `
[
	{
		"inputs": [
		{
			"name": "_owner",
			"type": "address"
		},
		{
			"name": "_handle",
			"type": "bytes16"
		},
		{
			"name": "_nonce",
			"type": "bytes32"
		},
		{
			"name": "_subjectSig",
			"type": "bytes"
		}
		],
		"name": "addUser",
		"outputs": [
		{
			"name": "",
			"type": "uint256"
		}
		],
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [
		{
			"name": "_userId",
			"type": "uint256"
		},
		{
			"name": "_entityType",
			"type": "string"
		},
		{
			"name": "_entityId",
			"type": "uint256"
		},
		{
			"name": "_action",
			"type": "string"
		},
		{
			"name": "_metadata",
			"type": "string"
		},
		{
			"name": "_nonce",
			"type": "bytes32"
		},
		{
			"name": "_subjectSig",
			"type": "bytes"
		}
		],
		"name": "manageEntity",
		"outputs": [],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	}
]
`

var addUserAbi abi.ABI

func init() {
	var err error
	addUserAbi, err = abi.JSON(strings.NewReader(addUserAbiJson))
	if err != nil {
		panic(err)
	}
}
