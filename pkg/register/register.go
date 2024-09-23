package register

import (
	"context"
	"crypto/ecdsa"
	_ "embed"
	"fmt"
	"log"
	"math/big"
	"strings"

	"github.com/AudiusProject/audius-protocol/pkg/logger"
	"github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/accounts/abi"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/ethereum/go-ethereum/ethclient"
)

//go:embed ABIs/ERC20Detailed.json
var erc20ABIFile string

//go:embed ABIs/Registry.json
var registryABIFile string

//go:embed ABIs/ServiceProviderFactory.json
var spfABIFile string

const (
	// For devnet registration
	GanacheAudiusTokenAddress      = "0xdcB2fC9469808630DD0744b0adf97C0003fC29B2"
	GanacheContractRegistryAddress = "0xABbfF712977dB51f9f212B85e8A4904c818C2b63"
)

func RegisterNode(
	registrationNodeType string,
	nodeEndpoint string,
	ethProviderUrl string,
	tokenAddress string,
	contractRegistryAddress string,
	ownerWallet string,
	privateKey string,
) error {
	client, err := ethclient.Dial(ethProviderUrl)
	if err != nil {
		return logger.Error("Failed to dial ethereum client:", err)
	}
	delegateOwnerWallet := common.HexToAddress(ownerWallet)
	pKey, err := crypto.HexToECDSA(privateKey)
	if err != nil {
		return logger.Error("Failed to encode private key:", err)
	}
	ethRegistryAddress := common.HexToAddress(contractRegistryAddress)
	tokenABI := getContractABI(erc20ABIFile)
	serviceProviderFactoryABI := getContractABI(spfABIFile)

	var tokenDecimals uint8
	tokenDecimalsData, err := tokenABI.Pack("decimals")
	if err != nil {
		return logger.Error("Failed to pack tokenABI for token decimals:", err)
	}
	ethTokenAddress := common.HexToAddress(tokenAddress)
	tokenDecimalsResult, err := client.CallContract(
		context.Background(),
		ethereum.CallMsg{
			To:   &ethTokenAddress,
			Data: tokenDecimalsData,
		},
		nil,
	)
	if err != nil {
		return logger.Error("Failed to retrieve token decimals:", err)
	}

	if err = tokenABI.UnpackIntoInterface(&tokenDecimals, "decimals", tokenDecimalsResult); err != nil {
		return logger.Error("Failed to unpack token decimals result:", err)
	}

	coeff := new(big.Int).Exp(big.NewInt(10), big.NewInt(int64(tokenDecimals)), nil)
	stakedTokensAmount := new(big.Int).Mul(big.NewInt(200000), coeff)

	stakingProxyAddr, err := getContractAddress(client, ethRegistryAddress, "StakingProxy")
	if err != nil {
		return logger.Error("Failed to get contract addr for staking proxy", err)
	}
	tokenApprovalData, err := tokenABI.Pack(
		"approve",
		stakingProxyAddr,
		stakedTokensAmount,
	)
	if err != nil {
		return logger.Error("Failed to pack abi: ", err)
	}
	err = client.SendTransaction(
		context.Background(),
		getSignedTx(client, tokenApprovalData, delegateOwnerWallet, ethTokenAddress, pKey),
	)
	if err != nil {
		return logger.Error("Failed to approve tokens: ", err)
	}

	var bytes32NodeType [32]byte
	copy(bytes32NodeType[:], []byte(registrationNodeType))

	spfAddress, err := getContractAddress(client, ethRegistryAddress, "ServiceProviderFactory")
	if err != nil {
		return logger.Error("Failed to get contract addr for service provider factory", err)
	}
	spfRegisterData, err := serviceProviderFactoryABI.Pack(
		"register",
		bytes32NodeType,
		nodeEndpoint,
		stakedTokensAmount,
		delegateOwnerWallet,
	)
	if err != nil {
		return logger.Error("Failed to pack serviceProviderFactoryABI:", err)
	}
	err = client.SendTransaction(
		context.Background(),
		getSignedTx(client, spfRegisterData, delegateOwnerWallet, *spfAddress, pKey),
	)
	if err != nil {
		return logger.Error("Failed to register node transaction:", err)
	}
	return nil
}

func getContractABI(abiFile string) *abi.ABI {
	resultABI, err := abi.JSON(strings.NewReader(abiFile))
	if err != nil {
		logger.Error(fmt.Sprintf("Failed to create contract ABI from file '%s':", abiFile), err)
		return nil
	}

	return &resultABI
}

func getContractAddress(client *ethclient.Client, ethRegistryAddress common.Address, contractName string) (*common.Address, error) {
	registryABI := getContractABI(registryABIFile)

	var bytes32Key [32]byte
	copy(bytes32Key[:], []byte(contractName))

	// The actual method is getContract(bytes32), but it's overloaded and go-ethereum is dumb.
	data, err := registryABI.Pack("getContract0", bytes32Key)
	if err != nil {
		logger.Error("Failed to pack registryABI:", err)
		return nil, err
	}

	msg := ethereum.CallMsg{
		To:   &ethRegistryAddress,
		Data: data,
	}

	resultBytes, err := client.CallContract(context.Background(), msg, nil)
	if err != nil {
		logger.Error("Failed to retrieve contract address:", err)
		return nil, err
	}

	var contractAddr common.Address
	if err = registryABI.UnpackIntoInterface(&contractAddr, "getContract0", resultBytes); err != nil {
		logger.Error("Failed to unpack result:", err)
		return nil, err
	}

	return &contractAddr, nil
}

func getSignedTx(client *ethclient.Client, txData []byte, from common.Address, to common.Address, privateKey *ecdsa.PrivateKey) *types.Transaction {
	nonce, err := client.PendingNonceAt(context.Background(), from)
	if err != nil {
		logger.Error("Failed to get nonce:", err)
	}
	chainID, err := client.ChainID(context.Background())
	if err != nil {
		logger.Error("Failed to get chain id:", err)
	}
	if err != nil {
		if strings.Contains(err.Error(), "Endpoint already registered") {
			log.Println("endpoint already registered")
		} else {
			logger.Error("Failed to estimate gas limit:", err)
		}
	}
	gasPrice, err := client.SuggestGasPrice(context.Background())
	if err != nil {
		logger.Error("Failed to suggest gas price:", err)
	}
	// hardcoded gas price while in dev
	tx := types.NewTransaction(nonce, to, big.NewInt(0), 20000000, gasPrice, txData)
	signedTx, err := types.SignTx(tx, types.NewEIP155Signer(chainID), privateKey)
	if err != nil {
		logger.Error("Failed to sign tx:", err)
	}
	return signedTx
}
