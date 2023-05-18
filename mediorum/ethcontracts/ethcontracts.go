package ethcontracts

import (
	"context"
	"fmt"
	"math/big"
	"os"

	"github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/accounts/abi"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/ethclient"
)

type NotifierInfo struct {
	Wallet   string
	Endpoint string
	Email    string
}

type RegistryClient struct {
	client *ethclient.Client
	abi    abi.ABI
	addr   common.Address
}

func GetNotifierForID(ID string) (NotifierInfo, error) {
	client, err := ethclient.Dial(os.Getenv("ethProviderUrl"))
	if err != nil {
		return NotifierInfo{}, fmt.Errorf("failed to connect to Ethereum node: %v", err)
	}

	ethRegistryAddress := os.Getenv("ethRegistryAddress")
	ethRegistry := NewRegistryClient(client, trustedNotifierManagerAbi, common.HexToAddress(ethRegistryAddress))
	delegateOwnerWallet := os.Getenv("delegateOwnerWallet")

	notifierID := new(big.Int)
	notifierID.SetString(ID, 10)

	// TODO: is this the wrong address? it would be ethRegistryAddress or dataRegistryAddress I think. it wouldn't make sense to be entityManagerAddress
	// Is it something else? How to find where it's deployed to? Check where libs reads its address
	// contractAddress :=  common.HexToAddress(dataRegistryAddress)
	notifierContractAddressStr, err := ethRegistry.GetContract("TrustedNotifierManager") // TODO: Does this need to include .sol? Maybe check on etherscan
	notifierContractAddress := common.HexToAddress(notifierContractAddressStr)

	// trustedNotifierManagerAbi.MethodById()

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
		Endpoint: output.Endpoint,
		Email:    output.Email,
	}, nil
}

func NewRegistryClient(client *ethclient.Client, abi abi.ABI, addr common.Address) *RegistryClient {
	return &RegistryClient{
		client: client,
		abi:    abi,
		addr:   addr,
	}
}

func (rc *RegistryClient) GetContract(contractRegistryKey string) (string, error) {
	paddedKey := fmt.Sprintf("%-32s", contractRegistryKey) // pad the key to 32 bytes
	hexKey := fmt.Sprintf("%x", paddedKey)                 // convert to hex

	callData, err := rc.abi.Pack("getContract", hexKey)
	if err != nil {
		return "", err
	}

	result, err := rc.client.CallContract(context.Background(), ethereum.CallMsg{
		To:   &rc.addr,
		Data: callData,
	}, nil)
	if err != nil {
		return "", err
	}

	var output string
	err = rc.abi.UnpackIntoInterface(&output, "getContract", result)
	if err != nil {
		return "", err
	}

	return output, nil
}

func GetRegistryAddressForContract(client *ethclient.Client, registryClient *RegistryClient, contractName string, contractAddresses map[string]string) (string, error) {
	if contractAddresses == nil {
		contractAddresses = make(map[string]string)
	}

	addr, ok := contractAddresses[contractName]
	if !ok {
		var err error
		addr, err = registryClient.GetContract(contractName)
		if err != nil {
			return "", err
		}

		contractAddresses[contractName] = addr
	}

	return addr, nil
}
