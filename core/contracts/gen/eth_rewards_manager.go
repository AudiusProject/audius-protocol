// Code generated - DO NOT EDIT.
// This file is a generated binding and any manual changes will be lost.

package gen

import (
	"errors"
	"math/big"
	"strings"

	ethereum "github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/accounts/abi"
	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/event"
)

// Reference imports to suppress errors if they are not otherwise used.
var (
	_ = errors.New
	_ = big.NewInt
	_ = strings.NewReader
	_ = ethereum.NotFound
	_ = bind.Bind
	_ = common.Big1
	_ = types.BloomLookup
	_ = event.NewSubscription
	_ = abi.ConvertType
)

// EthRewardsManagerMetaData contains all meta data concerning the EthRewardsManager contract.
var EthRewardsManagerMetaData = &bind.MetaData{
	ABI: "[{\"constant\":false,\"inputs\":[],\"name\":\"initialize\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"address\",\"name\":\"_tokenAddress\",\"type\":\"address\"},{\"internalType\":\"address\",\"name\":\"_governanceAddress\",\"type\":\"address\"},{\"internalType\":\"address\",\"name\":\"_wormholeAddress\",\"type\":\"address\"},{\"internalType\":\"bytes32\",\"name\":\"_recipient\",\"type\":\"bytes32\"},{\"internalType\":\"address[]\",\"name\":\"_antiAbuseOracleAddresses\",\"type\":\"address[]\"}],\"name\":\"initialize\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"address\",\"name\":\"_governanceAddress\",\"type\":\"address\"}],\"name\":\"setGovernanceAddress\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"bytes32\",\"name\":\"_recipient\",\"type\":\"bytes32\"}],\"name\":\"setRecipientAddress\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"address[]\",\"name\":\"_antiAbuseOracleAddresses\",\"type\":\"address[]\"}],\"name\":\"setAntiAbuseOracleAddresses\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"arbiterFee\",\"type\":\"uint256\"},{\"internalType\":\"uint32\",\"name\":\"_nonce\",\"type\":\"uint32\"}],\"name\":\"transferToSolana\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"token\",\"outputs\":[{\"internalType\":\"address\",\"name\":\"\",\"type\":\"address\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"getGovernanceAddress\",\"outputs\":[{\"internalType\":\"address\",\"name\":\"\",\"type\":\"address\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"getRecipientAddress\",\"outputs\":[{\"internalType\":\"bytes32\",\"name\":\"\",\"type\":\"bytes32\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"getAntiAbuseOracleAddresses\",\"outputs\":[{\"internalType\":\"address[]\",\"name\":\"\",\"type\":\"address[]\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"}]",
}

// EthRewardsManagerABI is the input ABI used to generate the binding from.
// Deprecated: Use EthRewardsManagerMetaData.ABI instead.
var EthRewardsManagerABI = EthRewardsManagerMetaData.ABI

// EthRewardsManager is an auto generated Go binding around an Ethereum contract.
type EthRewardsManager struct {
	EthRewardsManagerCaller     // Read-only binding to the contract
	EthRewardsManagerTransactor // Write-only binding to the contract
	EthRewardsManagerFilterer   // Log filterer for contract events
}

// EthRewardsManagerCaller is an auto generated read-only Go binding around an Ethereum contract.
type EthRewardsManagerCaller struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// EthRewardsManagerTransactor is an auto generated write-only Go binding around an Ethereum contract.
type EthRewardsManagerTransactor struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// EthRewardsManagerFilterer is an auto generated log filtering Go binding around an Ethereum contract events.
type EthRewardsManagerFilterer struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// EthRewardsManagerSession is an auto generated Go binding around an Ethereum contract,
// with pre-set call and transact options.
type EthRewardsManagerSession struct {
	Contract     *EthRewardsManager // Generic contract binding to set the session for
	CallOpts     bind.CallOpts      // Call options to use throughout this session
	TransactOpts bind.TransactOpts  // Transaction auth options to use throughout this session
}

// EthRewardsManagerCallerSession is an auto generated read-only Go binding around an Ethereum contract,
// with pre-set call options.
type EthRewardsManagerCallerSession struct {
	Contract *EthRewardsManagerCaller // Generic contract caller binding to set the session for
	CallOpts bind.CallOpts            // Call options to use throughout this session
}

// EthRewardsManagerTransactorSession is an auto generated write-only Go binding around an Ethereum contract,
// with pre-set transact options.
type EthRewardsManagerTransactorSession struct {
	Contract     *EthRewardsManagerTransactor // Generic contract transactor binding to set the session for
	TransactOpts bind.TransactOpts            // Transaction auth options to use throughout this session
}

// EthRewardsManagerRaw is an auto generated low-level Go binding around an Ethereum contract.
type EthRewardsManagerRaw struct {
	Contract *EthRewardsManager // Generic contract binding to access the raw methods on
}

// EthRewardsManagerCallerRaw is an auto generated low-level read-only Go binding around an Ethereum contract.
type EthRewardsManagerCallerRaw struct {
	Contract *EthRewardsManagerCaller // Generic read-only contract binding to access the raw methods on
}

// EthRewardsManagerTransactorRaw is an auto generated low-level write-only Go binding around an Ethereum contract.
type EthRewardsManagerTransactorRaw struct {
	Contract *EthRewardsManagerTransactor // Generic write-only contract binding to access the raw methods on
}

// NewEthRewardsManager creates a new instance of EthRewardsManager, bound to a specific deployed contract.
func NewEthRewardsManager(address common.Address, backend bind.ContractBackend) (*EthRewardsManager, error) {
	contract, err := bindEthRewardsManager(address, backend, backend, backend)
	if err != nil {
		return nil, err
	}
	return &EthRewardsManager{EthRewardsManagerCaller: EthRewardsManagerCaller{contract: contract}, EthRewardsManagerTransactor: EthRewardsManagerTransactor{contract: contract}, EthRewardsManagerFilterer: EthRewardsManagerFilterer{contract: contract}}, nil
}

// NewEthRewardsManagerCaller creates a new read-only instance of EthRewardsManager, bound to a specific deployed contract.
func NewEthRewardsManagerCaller(address common.Address, caller bind.ContractCaller) (*EthRewardsManagerCaller, error) {
	contract, err := bindEthRewardsManager(address, caller, nil, nil)
	if err != nil {
		return nil, err
	}
	return &EthRewardsManagerCaller{contract: contract}, nil
}

// NewEthRewardsManagerTransactor creates a new write-only instance of EthRewardsManager, bound to a specific deployed contract.
func NewEthRewardsManagerTransactor(address common.Address, transactor bind.ContractTransactor) (*EthRewardsManagerTransactor, error) {
	contract, err := bindEthRewardsManager(address, nil, transactor, nil)
	if err != nil {
		return nil, err
	}
	return &EthRewardsManagerTransactor{contract: contract}, nil
}

// NewEthRewardsManagerFilterer creates a new log filterer instance of EthRewardsManager, bound to a specific deployed contract.
func NewEthRewardsManagerFilterer(address common.Address, filterer bind.ContractFilterer) (*EthRewardsManagerFilterer, error) {
	contract, err := bindEthRewardsManager(address, nil, nil, filterer)
	if err != nil {
		return nil, err
	}
	return &EthRewardsManagerFilterer{contract: contract}, nil
}

// bindEthRewardsManager binds a generic wrapper to an already deployed contract.
func bindEthRewardsManager(address common.Address, caller bind.ContractCaller, transactor bind.ContractTransactor, filterer bind.ContractFilterer) (*bind.BoundContract, error) {
	parsed, err := EthRewardsManagerMetaData.GetAbi()
	if err != nil {
		return nil, err
	}
	return bind.NewBoundContract(address, *parsed, caller, transactor, filterer), nil
}

// Call invokes the (constant) contract method with params as input values and
// sets the output to result. The result type might be a single field for simple
// returns, a slice of interfaces for anonymous returns and a struct for named
// returns.
func (_EthRewardsManager *EthRewardsManagerRaw) Call(opts *bind.CallOpts, result *[]interface{}, method string, params ...interface{}) error {
	return _EthRewardsManager.Contract.EthRewardsManagerCaller.contract.Call(opts, result, method, params...)
}

// Transfer initiates a plain transaction to move funds to the contract, calling
// its default method if one is available.
func (_EthRewardsManager *EthRewardsManagerRaw) Transfer(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _EthRewardsManager.Contract.EthRewardsManagerTransactor.contract.Transfer(opts)
}

// Transact invokes the (paid) contract method with params as input values.
func (_EthRewardsManager *EthRewardsManagerRaw) Transact(opts *bind.TransactOpts, method string, params ...interface{}) (*types.Transaction, error) {
	return _EthRewardsManager.Contract.EthRewardsManagerTransactor.contract.Transact(opts, method, params...)
}

// Call invokes the (constant) contract method with params as input values and
// sets the output to result. The result type might be a single field for simple
// returns, a slice of interfaces for anonymous returns and a struct for named
// returns.
func (_EthRewardsManager *EthRewardsManagerCallerRaw) Call(opts *bind.CallOpts, result *[]interface{}, method string, params ...interface{}) error {
	return _EthRewardsManager.Contract.contract.Call(opts, result, method, params...)
}

// Transfer initiates a plain transaction to move funds to the contract, calling
// its default method if one is available.
func (_EthRewardsManager *EthRewardsManagerTransactorRaw) Transfer(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _EthRewardsManager.Contract.contract.Transfer(opts)
}

// Transact invokes the (paid) contract method with params as input values.
func (_EthRewardsManager *EthRewardsManagerTransactorRaw) Transact(opts *bind.TransactOpts, method string, params ...interface{}) (*types.Transaction, error) {
	return _EthRewardsManager.Contract.contract.Transact(opts, method, params...)
}

// GetAntiAbuseOracleAddresses is a free data retrieval call binding the contract method 0x5550a621.
//
// Solidity: function getAntiAbuseOracleAddresses() view returns(address[])
func (_EthRewardsManager *EthRewardsManagerCaller) GetAntiAbuseOracleAddresses(opts *bind.CallOpts) ([]common.Address, error) {
	var out []interface{}
	err := _EthRewardsManager.contract.Call(opts, &out, "getAntiAbuseOracleAddresses")

	if err != nil {
		return *new([]common.Address), err
	}

	out0 := *abi.ConvertType(out[0], new([]common.Address)).(*[]common.Address)

	return out0, err

}

// GetAntiAbuseOracleAddresses is a free data retrieval call binding the contract method 0x5550a621.
//
// Solidity: function getAntiAbuseOracleAddresses() view returns(address[])
func (_EthRewardsManager *EthRewardsManagerSession) GetAntiAbuseOracleAddresses() ([]common.Address, error) {
	return _EthRewardsManager.Contract.GetAntiAbuseOracleAddresses(&_EthRewardsManager.CallOpts)
}

// GetAntiAbuseOracleAddresses is a free data retrieval call binding the contract method 0x5550a621.
//
// Solidity: function getAntiAbuseOracleAddresses() view returns(address[])
func (_EthRewardsManager *EthRewardsManagerCallerSession) GetAntiAbuseOracleAddresses() ([]common.Address, error) {
	return _EthRewardsManager.Contract.GetAntiAbuseOracleAddresses(&_EthRewardsManager.CallOpts)
}

// GetGovernanceAddress is a free data retrieval call binding the contract method 0x73252494.
//
// Solidity: function getGovernanceAddress() view returns(address)
func (_EthRewardsManager *EthRewardsManagerCaller) GetGovernanceAddress(opts *bind.CallOpts) (common.Address, error) {
	var out []interface{}
	err := _EthRewardsManager.contract.Call(opts, &out, "getGovernanceAddress")

	if err != nil {
		return *new(common.Address), err
	}

	out0 := *abi.ConvertType(out[0], new(common.Address)).(*common.Address)

	return out0, err

}

// GetGovernanceAddress is a free data retrieval call binding the contract method 0x73252494.
//
// Solidity: function getGovernanceAddress() view returns(address)
func (_EthRewardsManager *EthRewardsManagerSession) GetGovernanceAddress() (common.Address, error) {
	return _EthRewardsManager.Contract.GetGovernanceAddress(&_EthRewardsManager.CallOpts)
}

// GetGovernanceAddress is a free data retrieval call binding the contract method 0x73252494.
//
// Solidity: function getGovernanceAddress() view returns(address)
func (_EthRewardsManager *EthRewardsManagerCallerSession) GetGovernanceAddress() (common.Address, error) {
	return _EthRewardsManager.Contract.GetGovernanceAddress(&_EthRewardsManager.CallOpts)
}

// GetRecipientAddress is a free data retrieval call binding the contract method 0x7ce87b43.
//
// Solidity: function getRecipientAddress() view returns(bytes32)
func (_EthRewardsManager *EthRewardsManagerCaller) GetRecipientAddress(opts *bind.CallOpts) ([32]byte, error) {
	var out []interface{}
	err := _EthRewardsManager.contract.Call(opts, &out, "getRecipientAddress")

	if err != nil {
		return *new([32]byte), err
	}

	out0 := *abi.ConvertType(out[0], new([32]byte)).(*[32]byte)

	return out0, err

}

// GetRecipientAddress is a free data retrieval call binding the contract method 0x7ce87b43.
//
// Solidity: function getRecipientAddress() view returns(bytes32)
func (_EthRewardsManager *EthRewardsManagerSession) GetRecipientAddress() ([32]byte, error) {
	return _EthRewardsManager.Contract.GetRecipientAddress(&_EthRewardsManager.CallOpts)
}

// GetRecipientAddress is a free data retrieval call binding the contract method 0x7ce87b43.
//
// Solidity: function getRecipientAddress() view returns(bytes32)
func (_EthRewardsManager *EthRewardsManagerCallerSession) GetRecipientAddress() ([32]byte, error) {
	return _EthRewardsManager.Contract.GetRecipientAddress(&_EthRewardsManager.CallOpts)
}

// Token is a free data retrieval call binding the contract method 0xfc0c546a.
//
// Solidity: function token() view returns(address)
func (_EthRewardsManager *EthRewardsManagerCaller) Token(opts *bind.CallOpts) (common.Address, error) {
	var out []interface{}
	err := _EthRewardsManager.contract.Call(opts, &out, "token")

	if err != nil {
		return *new(common.Address), err
	}

	out0 := *abi.ConvertType(out[0], new(common.Address)).(*common.Address)

	return out0, err

}

// Token is a free data retrieval call binding the contract method 0xfc0c546a.
//
// Solidity: function token() view returns(address)
func (_EthRewardsManager *EthRewardsManagerSession) Token() (common.Address, error) {
	return _EthRewardsManager.Contract.Token(&_EthRewardsManager.CallOpts)
}

// Token is a free data retrieval call binding the contract method 0xfc0c546a.
//
// Solidity: function token() view returns(address)
func (_EthRewardsManager *EthRewardsManagerCallerSession) Token() (common.Address, error) {
	return _EthRewardsManager.Contract.Token(&_EthRewardsManager.CallOpts)
}

// Initialize is a paid mutator transaction binding the contract method 0x8129fc1c.
//
// Solidity: function initialize() returns()
func (_EthRewardsManager *EthRewardsManagerTransactor) Initialize(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _EthRewardsManager.contract.Transact(opts, "initialize")
}

// Initialize is a paid mutator transaction binding the contract method 0x8129fc1c.
//
// Solidity: function initialize() returns()
func (_EthRewardsManager *EthRewardsManagerSession) Initialize() (*types.Transaction, error) {
	return _EthRewardsManager.Contract.Initialize(&_EthRewardsManager.TransactOpts)
}

// Initialize is a paid mutator transaction binding the contract method 0x8129fc1c.
//
// Solidity: function initialize() returns()
func (_EthRewardsManager *EthRewardsManagerTransactorSession) Initialize() (*types.Transaction, error) {
	return _EthRewardsManager.Contract.Initialize(&_EthRewardsManager.TransactOpts)
}

// Initialize0 is a paid mutator transaction binding the contract method 0x945decf4.
//
// Solidity: function initialize(address _tokenAddress, address _governanceAddress, address _wormholeAddress, bytes32 _recipient, address[] _antiAbuseOracleAddresses) returns()
func (_EthRewardsManager *EthRewardsManagerTransactor) Initialize0(opts *bind.TransactOpts, _tokenAddress common.Address, _governanceAddress common.Address, _wormholeAddress common.Address, _recipient [32]byte, _antiAbuseOracleAddresses []common.Address) (*types.Transaction, error) {
	return _EthRewardsManager.contract.Transact(opts, "initialize0", _tokenAddress, _governanceAddress, _wormholeAddress, _recipient, _antiAbuseOracleAddresses)
}

// Initialize0 is a paid mutator transaction binding the contract method 0x945decf4.
//
// Solidity: function initialize(address _tokenAddress, address _governanceAddress, address _wormholeAddress, bytes32 _recipient, address[] _antiAbuseOracleAddresses) returns()
func (_EthRewardsManager *EthRewardsManagerSession) Initialize0(_tokenAddress common.Address, _governanceAddress common.Address, _wormholeAddress common.Address, _recipient [32]byte, _antiAbuseOracleAddresses []common.Address) (*types.Transaction, error) {
	return _EthRewardsManager.Contract.Initialize0(&_EthRewardsManager.TransactOpts, _tokenAddress, _governanceAddress, _wormholeAddress, _recipient, _antiAbuseOracleAddresses)
}

// Initialize0 is a paid mutator transaction binding the contract method 0x945decf4.
//
// Solidity: function initialize(address _tokenAddress, address _governanceAddress, address _wormholeAddress, bytes32 _recipient, address[] _antiAbuseOracleAddresses) returns()
func (_EthRewardsManager *EthRewardsManagerTransactorSession) Initialize0(_tokenAddress common.Address, _governanceAddress common.Address, _wormholeAddress common.Address, _recipient [32]byte, _antiAbuseOracleAddresses []common.Address) (*types.Transaction, error) {
	return _EthRewardsManager.Contract.Initialize0(&_EthRewardsManager.TransactOpts, _tokenAddress, _governanceAddress, _wormholeAddress, _recipient, _antiAbuseOracleAddresses)
}

// SetAntiAbuseOracleAddresses is a paid mutator transaction binding the contract method 0x8d9e6088.
//
// Solidity: function setAntiAbuseOracleAddresses(address[] _antiAbuseOracleAddresses) returns()
func (_EthRewardsManager *EthRewardsManagerTransactor) SetAntiAbuseOracleAddresses(opts *bind.TransactOpts, _antiAbuseOracleAddresses []common.Address) (*types.Transaction, error) {
	return _EthRewardsManager.contract.Transact(opts, "setAntiAbuseOracleAddresses", _antiAbuseOracleAddresses)
}

// SetAntiAbuseOracleAddresses is a paid mutator transaction binding the contract method 0x8d9e6088.
//
// Solidity: function setAntiAbuseOracleAddresses(address[] _antiAbuseOracleAddresses) returns()
func (_EthRewardsManager *EthRewardsManagerSession) SetAntiAbuseOracleAddresses(_antiAbuseOracleAddresses []common.Address) (*types.Transaction, error) {
	return _EthRewardsManager.Contract.SetAntiAbuseOracleAddresses(&_EthRewardsManager.TransactOpts, _antiAbuseOracleAddresses)
}

// SetAntiAbuseOracleAddresses is a paid mutator transaction binding the contract method 0x8d9e6088.
//
// Solidity: function setAntiAbuseOracleAddresses(address[] _antiAbuseOracleAddresses) returns()
func (_EthRewardsManager *EthRewardsManagerTransactorSession) SetAntiAbuseOracleAddresses(_antiAbuseOracleAddresses []common.Address) (*types.Transaction, error) {
	return _EthRewardsManager.Contract.SetAntiAbuseOracleAddresses(&_EthRewardsManager.TransactOpts, _antiAbuseOracleAddresses)
}

// SetGovernanceAddress is a paid mutator transaction binding the contract method 0xcfc16254.
//
// Solidity: function setGovernanceAddress(address _governanceAddress) returns()
func (_EthRewardsManager *EthRewardsManagerTransactor) SetGovernanceAddress(opts *bind.TransactOpts, _governanceAddress common.Address) (*types.Transaction, error) {
	return _EthRewardsManager.contract.Transact(opts, "setGovernanceAddress", _governanceAddress)
}

// SetGovernanceAddress is a paid mutator transaction binding the contract method 0xcfc16254.
//
// Solidity: function setGovernanceAddress(address _governanceAddress) returns()
func (_EthRewardsManager *EthRewardsManagerSession) SetGovernanceAddress(_governanceAddress common.Address) (*types.Transaction, error) {
	return _EthRewardsManager.Contract.SetGovernanceAddress(&_EthRewardsManager.TransactOpts, _governanceAddress)
}

// SetGovernanceAddress is a paid mutator transaction binding the contract method 0xcfc16254.
//
// Solidity: function setGovernanceAddress(address _governanceAddress) returns()
func (_EthRewardsManager *EthRewardsManagerTransactorSession) SetGovernanceAddress(_governanceAddress common.Address) (*types.Transaction, error) {
	return _EthRewardsManager.Contract.SetGovernanceAddress(&_EthRewardsManager.TransactOpts, _governanceAddress)
}

// SetRecipientAddress is a paid mutator transaction binding the contract method 0x05a7cdd6.
//
// Solidity: function setRecipientAddress(bytes32 _recipient) returns()
func (_EthRewardsManager *EthRewardsManagerTransactor) SetRecipientAddress(opts *bind.TransactOpts, _recipient [32]byte) (*types.Transaction, error) {
	return _EthRewardsManager.contract.Transact(opts, "setRecipientAddress", _recipient)
}

// SetRecipientAddress is a paid mutator transaction binding the contract method 0x05a7cdd6.
//
// Solidity: function setRecipientAddress(bytes32 _recipient) returns()
func (_EthRewardsManager *EthRewardsManagerSession) SetRecipientAddress(_recipient [32]byte) (*types.Transaction, error) {
	return _EthRewardsManager.Contract.SetRecipientAddress(&_EthRewardsManager.TransactOpts, _recipient)
}

// SetRecipientAddress is a paid mutator transaction binding the contract method 0x05a7cdd6.
//
// Solidity: function setRecipientAddress(bytes32 _recipient) returns()
func (_EthRewardsManager *EthRewardsManagerTransactorSession) SetRecipientAddress(_recipient [32]byte) (*types.Transaction, error) {
	return _EthRewardsManager.Contract.SetRecipientAddress(&_EthRewardsManager.TransactOpts, _recipient)
}

// TransferToSolana is a paid mutator transaction binding the contract method 0x4316d72d.
//
// Solidity: function transferToSolana(uint256 arbiterFee, uint32 _nonce) returns()
func (_EthRewardsManager *EthRewardsManagerTransactor) TransferToSolana(opts *bind.TransactOpts, arbiterFee *big.Int, _nonce uint32) (*types.Transaction, error) {
	return _EthRewardsManager.contract.Transact(opts, "transferToSolana", arbiterFee, _nonce)
}

// TransferToSolana is a paid mutator transaction binding the contract method 0x4316d72d.
//
// Solidity: function transferToSolana(uint256 arbiterFee, uint32 _nonce) returns()
func (_EthRewardsManager *EthRewardsManagerSession) TransferToSolana(arbiterFee *big.Int, _nonce uint32) (*types.Transaction, error) {
	return _EthRewardsManager.Contract.TransferToSolana(&_EthRewardsManager.TransactOpts, arbiterFee, _nonce)
}

// TransferToSolana is a paid mutator transaction binding the contract method 0x4316d72d.
//
// Solidity: function transferToSolana(uint256 arbiterFee, uint32 _nonce) returns()
func (_EthRewardsManager *EthRewardsManagerTransactorSession) TransferToSolana(arbiterFee *big.Int, _nonce uint32) (*types.Transaction, error) {
	return _EthRewardsManager.Contract.TransferToSolana(&_EthRewardsManager.TransactOpts, arbiterFee, _nonce)
}
