package ethcontracts

import (
	"context"
	"errors"
	"fmt"
	"math/big"
	"os"

	"github.com/AudiusProject/audius-protocol/pkg/httputil"

	"github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/ethclient"
)

type ServiceProvider struct {
	Owner               string
	Endpoint            string
	SpID                int
	Type                string
	BlockNumber         int
	DelegateOwnerWallet string
}

type NotifierInfo struct {
	Wallet   string `json:"wallet"`
	Endpoint string `json:"endpoint"`
	Email    string `json:"email"`
}

func GetNotifierForID(ID string, delegateOwnerWallet string) (NotifierInfo, error) {
	client, err := ethclient.Dial(os.Getenv("ethProviderUrl"))
	if err != nil {
		return NotifierInfo{}, fmt.Errorf("failed to connect to Ethereum node: %v", err)
	}

	ethRegistryAddress := os.Getenv("ethRegistryAddress")
	notifierContractAddress, err := GetContractAddr(client, common.HexToAddress(ethRegistryAddress), "TrustedNotifierManagerProxy")
	if err != nil {
		return NotifierInfo{}, fmt.Errorf("failed to get contract address: %v", err)
	}

	notifierID := new(big.Int)
	notifierID.SetString(ID, 10)
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
		Endpoint: httputil.RemoveTrailingSlash(output.Endpoint),
		Email:    httputil.RemoveTrailingSlash(output.Email),
	}, nil
}

func GetServiceProviderIdFromEndpoint(endpoint string, delegateOwnerWallet string) (int, error) {
	client, err := ethclient.Dial(os.Getenv("ethProviderUrl"))
	if err != nil {
		return 0, fmt.Errorf("failed to connect to Ethereum node: %v", err)
	}

	ethRegistryAddress := os.Getenv("ethRegistryAddress")
	serviceProviderFactoryAddress, err := GetContractAddr(client, common.HexToAddress(ethRegistryAddress), "ServiceProviderFactory")
	if err != nil {
		return 0, fmt.Errorf("failed to get contract address: %v", err)
	}

	callData, err := serviceProviderFactoryAbi.Pack("getServiceProviderIdFromEndpoint", endpoint)
	if err != nil {
		return 0, fmt.Errorf("failed to pack contract method: %v", err)
	}

	result, err := client.CallContract(context.Background(), ethereum.CallMsg{
		From: common.HexToAddress(delegateOwnerWallet),
		To:   &serviceProviderFactoryAddress,
		Data: callData,
	}, nil)

	if err != nil {
		return 0, fmt.Errorf("failed to call contract method: %v", err)
	}

	var output *big.Int

	err = serviceProviderFactoryAbi.UnpackIntoInterface(&output, "getServiceProviderIdFromEndpoint", result)
	if err != nil {
		return 0, fmt.Errorf("failed to unpack contract method result: %v", err)
	}

	return int(output.Uint64()), nil
}

func GetServiceProviderList(serviceType string) ([]ServiceProvider, error) {
	client, err := ethclient.Dial(os.Getenv("ethProviderUrl"))
	if err != nil {
		return nil, fmt.Errorf("failed to connect to Ethereum node: %v", err)
	}

	serviceProviderFactoryAddress, err := GetContractAddr(client, common.HexToAddress(os.Getenv("ethRegistryAddress")), "ServiceProviderFactory")
	if err != nil {
		return nil, fmt.Errorf("failed to get contract address: %v", err)
	}

	numberOfProviders, err := getTotalServiceTypeProviders(client, serviceProviderFactoryAddress, serviceType)
	if err != nil {
		return nil, fmt.Errorf("failed to get total number of service providers: %v", err)
	}

	var providers []ServiceProvider
	for i := 1; i <= numberOfProviders; i++ {
		provider, err := getServiceEndpointInfo(client, serviceProviderFactoryAddress, serviceType, i)
		if err != nil {
			return nil, fmt.Errorf("failed to get service provider info: %v", err)
		}
		if provider.Endpoint != "" {
			providers = append(providers, provider)
		}
	}

	return providers, nil
}

func getTotalServiceTypeProviders(client *ethclient.Client, contractAddress common.Address, serviceType string) (int, error) {
	var serviceTypeBytes [32]byte
	copy(serviceTypeBytes[:], []byte(serviceType))
	callData, err := serviceProviderFactoryAbi.Pack("getTotalServiceTypeProviders", serviceTypeBytes)
	if err != nil {
		return 0, fmt.Errorf("failed to pack contract method: %v", err)
	}

	result, err := client.CallContract(context.Background(), ethereum.CallMsg{
		To:   &contractAddress,
		Data: callData,
	}, nil)

	if err != nil {
		return 0, fmt.Errorf("failed to call contract method: %v", err)
	}

	var totalProviders *big.Int
	err = serviceProviderFactoryAbi.UnpackIntoInterface(&totalProviders, "getTotalServiceTypeProviders", result)
	if err != nil {
		return 0, fmt.Errorf("failed to unpack contract method result: %v", err)
	}

	return int(totalProviders.Int64()), nil
}

func getServiceEndpointInfo(client *ethclient.Client, contractAddress common.Address, serviceType string, serviceId int) (ServiceProvider, error) {
	var serviceTypeBytes [32]byte
	copy(serviceTypeBytes[:], []byte(serviceType))
	callData, err := serviceProviderFactoryAbi.Pack("getServiceEndpointInfo", serviceTypeBytes, big.NewInt(int64(serviceId)))
	if err != nil {
		return ServiceProvider{}, fmt.Errorf("failed to pack contract method: %v", err)
	}

	result, err := client.CallContract(context.Background(), ethereum.CallMsg{
		To:   &contractAddress,
		Data: callData,
	}, nil)

	if err != nil {
		return ServiceProvider{}, fmt.Errorf("failed to call contract method: %v", err)
	}

	var info struct {
		Owner               common.Address
		Endpoint            string
		BlockNumber         *big.Int
		DelegateOwnerWallet common.Address
	}
	err = serviceProviderFactoryAbi.UnpackIntoInterface(&info, "getServiceEndpointInfo", result)
	if err != nil {
		return ServiceProvider{}, fmt.Errorf("failed to unpack contract method result: %v", err)
	}

	return ServiceProvider{
		Owner:               info.Owner.Hex(),
		Endpoint:            info.Endpoint,
		SpID:                serviceId,
		Type:                serviceType,
		BlockNumber:         int(info.BlockNumber.Int64()),
		DelegateOwnerWallet: info.DelegateOwnerWallet.Hex(),
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
