package ethcontracts

import (
	"context"
	"errors"
	"fmt"
	"math/big"
	"os"
	"regexp"

	"github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/ethclient"
)

type NotifierInfo struct {
	Wallet   string
	Endpoint string
	Email    string
}

func GetNotifierForID(ID string) (NotifierInfo, error) {
	client, err := ethclient.Dial(os.Getenv("ethProviderUrl"))
	if err != nil {
		return NotifierInfo{}, fmt.Errorf("failed to connect to Ethereum node: %v", err)
	}

	ethRegistryAddress := os.Getenv("ethRegistryAddress")
	delegateOwnerWallet := os.Getenv("delegateOwnerWallet")

	notifierID := new(big.Int)
	notifierID.SetString(ID, 10)

	notifierContractAddress, err := GetContractAddr(client, common.HexToAddress(ethRegistryAddress), "TrustedNotifierManagerProxy")
	if err != nil {
		return NotifierInfo{}, fmt.Errorf("failed to get contract address: %v", err)
	}

	callData, err := trustedNotifierManagerAbi.Pack("getNotifierForID", notifierID)
	if err != nil {
		return NotifierInfo{}, fmt.Errorf("failed to pack contract method: %v", err)
	}

	result, err := client.CallContract(context.Background(), ethereum.CallMsg{
		From: common.HexToAddress(delegateOwnerWallet),
		To:   &notifierContractAddress,
		Data: callData,
	}, nil)

	if err != nil {
		return NotifierInfo{}, fmt.Errorf("failed to call contract method: %v", err)
	}

	var output struct {
		Wallet   common.Address
		Endpoint string
		Email    string
	}

	err = trustedNotifierManagerAbi.UnpackIntoInterface(&output, "getNotifierForID", result)
	if err != nil {
		return NotifierInfo{}, fmt.Errorf("failed to unpack contract method result: %v", err)
	}

	return NotifierInfo{
		Wallet:   output.Wallet.Hex(),
		Endpoint: removeTrailingSlash(output.Endpoint),
		Email:    removeTrailingSlash(output.Email),
	}, nil
}

func GetContractAddr(client *ethclient.Client, ethRegistryAddr common.Address, contractRegistryKey string) (common.Address, error) {
	var bytes32Key [32]byte
	copy(bytes32Key[:], []byte(contractRegistryKey))
	// The actual method is getContract(bytes32), but it's overloaded and go-ethereum is dumb.
	// I debugged this by checking the output of ethRegistryAbi.Methods
	callData, err := ethRegistryAbi.Pack("getContract0", bytes32Key)
	if err != nil {
		return common.Address{}, errors.New("failed to pack getContract method: " + err.Error())
	}

	result, err := client.CallContract(context.Background(), ethereum.CallMsg{
		To:   &ethRegistryAddr,
		Data: callData,
	}, nil)
	if err != nil {
		return common.Address{}, errors.New("failed to call getContract method: " + err.Error())
	}

	var contractAddr common.Address
	err = ethRegistryAbi.UnpackIntoInterface(&contractAddr, "getContract0", result)
	if err != nil {
		return common.Address{}, errors.New("failed to unpack getContract method result: " + err.Error())
	}
	if contractAddr.String() == "0x0000000000000000000000000000000000000000" {
		return common.Address{}, errors.New("contract not found")
	}

	return contractAddr, nil
}

func removeTrailingSlash(s string) string {
	re := regexp.MustCompile("/$")
	return re.ReplaceAllString(s, "")
}
