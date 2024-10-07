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

// StakingMetaData contains all meta data concerning the Staking contract.
var StakingMetaData = &bind.MetaData{
	ABI: "[{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"user\",\"type\":\"address\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"amount\",\"type\":\"uint256\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"total\",\"type\":\"uint256\"}],\"name\":\"Slashed\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"user\",\"type\":\"address\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"amount\",\"type\":\"uint256\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"total\",\"type\":\"uint256\"}],\"name\":\"Staked\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"user\",\"type\":\"address\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"amount\",\"type\":\"uint256\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"total\",\"type\":\"uint256\"}],\"name\":\"Unstaked\",\"type\":\"event\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"address\",\"name\":\"_tokenAddress\",\"type\":\"address\"},{\"internalType\":\"address\",\"name\":\"_governanceAddress\",\"type\":\"address\"}],\"name\":\"initialize\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[],\"name\":\"initialize\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"address\",\"name\":\"_governanceAddress\",\"type\":\"address\"}],\"name\":\"setGovernanceAddress\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"address\",\"name\":\"_claimsManager\",\"type\":\"address\"}],\"name\":\"setClaimsManagerAddress\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"address\",\"name\":\"_spFactory\",\"type\":\"address\"}],\"name\":\"setServiceProviderFactoryAddress\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"address\",\"name\":\"_delegateManager\",\"type\":\"address\"}],\"name\":\"setDelegateManagerAddress\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"_amount\",\"type\":\"uint256\"},{\"internalType\":\"address\",\"name\":\"_stakerAccount\",\"type\":\"address\"}],\"name\":\"stakeRewards\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"_amount\",\"type\":\"uint256\"},{\"internalType\":\"address\",\"name\":\"_stakerAccount\",\"type\":\"address\"}],\"name\":\"updateClaimHistory\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"_amount\",\"type\":\"uint256\"},{\"internalType\":\"address\",\"name\":\"_slashAddress\",\"type\":\"address\"}],\"name\":\"slash\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"address\",\"name\":\"_accountAddress\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"_amount\",\"type\":\"uint256\"}],\"name\":\"stakeFor\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"address\",\"name\":\"_accountAddress\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"_amount\",\"type\":\"uint256\"}],\"name\":\"unstakeFor\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"address\",\"name\":\"_accountAddress\",\"type\":\"address\"},{\"internalType\":\"address\",\"name\":\"_delegatorAddress\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"_amount\",\"type\":\"uint256\"}],\"name\":\"delegateStakeFor\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"address\",\"name\":\"_accountAddress\",\"type\":\"address\"},{\"internalType\":\"address\",\"name\":\"_delegatorAddress\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"_amount\",\"type\":\"uint256\"}],\"name\":\"undelegateStakeFor\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"token\",\"outputs\":[{\"internalType\":\"address\",\"name\":\"\",\"type\":\"address\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"supportsHistory\",\"outputs\":[{\"internalType\":\"bool\",\"name\":\"\",\"type\":\"bool\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[{\"internalType\":\"address\",\"name\":\"_accountAddress\",\"type\":\"address\"}],\"name\":\"lastStakedFor\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[{\"internalType\":\"address\",\"name\":\"_accountAddress\",\"type\":\"address\"}],\"name\":\"lastClaimedFor\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[{\"internalType\":\"address\",\"name\":\"_accountAddress\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"_blockNumber\",\"type\":\"uint256\"}],\"name\":\"totalStakedForAt\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"_blockNumber\",\"type\":\"uint256\"}],\"name\":\"totalStakedAt\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"getGovernanceAddress\",\"outputs\":[{\"internalType\":\"address\",\"name\":\"\",\"type\":\"address\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"getClaimsManagerAddress\",\"outputs\":[{\"internalType\":\"address\",\"name\":\"\",\"type\":\"address\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"getServiceProviderFactoryAddress\",\"outputs\":[{\"internalType\":\"address\",\"name\":\"\",\"type\":\"address\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"getDelegateManagerAddress\",\"outputs\":[{\"internalType\":\"address\",\"name\":\"\",\"type\":\"address\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[{\"internalType\":\"address\",\"name\":\"_accountAddress\",\"type\":\"address\"}],\"name\":\"isStaker\",\"outputs\":[{\"internalType\":\"bool\",\"name\":\"\",\"type\":\"bool\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[{\"internalType\":\"address\",\"name\":\"_accountAddress\",\"type\":\"address\"}],\"name\":\"totalStakedFor\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"totalStaked\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"}]",
}

// StakingABI is the input ABI used to generate the binding from.
// Deprecated: Use StakingMetaData.ABI instead.
var StakingABI = StakingMetaData.ABI

// Staking is an auto generated Go binding around an Ethereum contract.
type Staking struct {
	StakingCaller     // Read-only binding to the contract
	StakingTransactor // Write-only binding to the contract
	StakingFilterer   // Log filterer for contract events
}

// StakingCaller is an auto generated read-only Go binding around an Ethereum contract.
type StakingCaller struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// StakingTransactor is an auto generated write-only Go binding around an Ethereum contract.
type StakingTransactor struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// StakingFilterer is an auto generated log filtering Go binding around an Ethereum contract events.
type StakingFilterer struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// StakingSession is an auto generated Go binding around an Ethereum contract,
// with pre-set call and transact options.
type StakingSession struct {
	Contract     *Staking          // Generic contract binding to set the session for
	CallOpts     bind.CallOpts     // Call options to use throughout this session
	TransactOpts bind.TransactOpts // Transaction auth options to use throughout this session
}

// StakingCallerSession is an auto generated read-only Go binding around an Ethereum contract,
// with pre-set call options.
type StakingCallerSession struct {
	Contract *StakingCaller // Generic contract caller binding to set the session for
	CallOpts bind.CallOpts  // Call options to use throughout this session
}

// StakingTransactorSession is an auto generated write-only Go binding around an Ethereum contract,
// with pre-set transact options.
type StakingTransactorSession struct {
	Contract     *StakingTransactor // Generic contract transactor binding to set the session for
	TransactOpts bind.TransactOpts  // Transaction auth options to use throughout this session
}

// StakingRaw is an auto generated low-level Go binding around an Ethereum contract.
type StakingRaw struct {
	Contract *Staking // Generic contract binding to access the raw methods on
}

// StakingCallerRaw is an auto generated low-level read-only Go binding around an Ethereum contract.
type StakingCallerRaw struct {
	Contract *StakingCaller // Generic read-only contract binding to access the raw methods on
}

// StakingTransactorRaw is an auto generated low-level write-only Go binding around an Ethereum contract.
type StakingTransactorRaw struct {
	Contract *StakingTransactor // Generic write-only contract binding to access the raw methods on
}

// NewStaking creates a new instance of Staking, bound to a specific deployed contract.
func NewStaking(address common.Address, backend bind.ContractBackend) (*Staking, error) {
	contract, err := bindStaking(address, backend, backend, backend)
	if err != nil {
		return nil, err
	}
	return &Staking{StakingCaller: StakingCaller{contract: contract}, StakingTransactor: StakingTransactor{contract: contract}, StakingFilterer: StakingFilterer{contract: contract}}, nil
}

// NewStakingCaller creates a new read-only instance of Staking, bound to a specific deployed contract.
func NewStakingCaller(address common.Address, caller bind.ContractCaller) (*StakingCaller, error) {
	contract, err := bindStaking(address, caller, nil, nil)
	if err != nil {
		return nil, err
	}
	return &StakingCaller{contract: contract}, nil
}

// NewStakingTransactor creates a new write-only instance of Staking, bound to a specific deployed contract.
func NewStakingTransactor(address common.Address, transactor bind.ContractTransactor) (*StakingTransactor, error) {
	contract, err := bindStaking(address, nil, transactor, nil)
	if err != nil {
		return nil, err
	}
	return &StakingTransactor{contract: contract}, nil
}

// NewStakingFilterer creates a new log filterer instance of Staking, bound to a specific deployed contract.
func NewStakingFilterer(address common.Address, filterer bind.ContractFilterer) (*StakingFilterer, error) {
	contract, err := bindStaking(address, nil, nil, filterer)
	if err != nil {
		return nil, err
	}
	return &StakingFilterer{contract: contract}, nil
}

// bindStaking binds a generic wrapper to an already deployed contract.
func bindStaking(address common.Address, caller bind.ContractCaller, transactor bind.ContractTransactor, filterer bind.ContractFilterer) (*bind.BoundContract, error) {
	parsed, err := StakingMetaData.GetAbi()
	if err != nil {
		return nil, err
	}
	return bind.NewBoundContract(address, *parsed, caller, transactor, filterer), nil
}

// Call invokes the (constant) contract method with params as input values and
// sets the output to result. The result type might be a single field for simple
// returns, a slice of interfaces for anonymous returns and a struct for named
// returns.
func (_Staking *StakingRaw) Call(opts *bind.CallOpts, result *[]interface{}, method string, params ...interface{}) error {
	return _Staking.Contract.StakingCaller.contract.Call(opts, result, method, params...)
}

// Transfer initiates a plain transaction to move funds to the contract, calling
// its default method if one is available.
func (_Staking *StakingRaw) Transfer(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _Staking.Contract.StakingTransactor.contract.Transfer(opts)
}

// Transact invokes the (paid) contract method with params as input values.
func (_Staking *StakingRaw) Transact(opts *bind.TransactOpts, method string, params ...interface{}) (*types.Transaction, error) {
	return _Staking.Contract.StakingTransactor.contract.Transact(opts, method, params...)
}

// Call invokes the (constant) contract method with params as input values and
// sets the output to result. The result type might be a single field for simple
// returns, a slice of interfaces for anonymous returns and a struct for named
// returns.
func (_Staking *StakingCallerRaw) Call(opts *bind.CallOpts, result *[]interface{}, method string, params ...interface{}) error {
	return _Staking.Contract.contract.Call(opts, result, method, params...)
}

// Transfer initiates a plain transaction to move funds to the contract, calling
// its default method if one is available.
func (_Staking *StakingTransactorRaw) Transfer(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _Staking.Contract.contract.Transfer(opts)
}

// Transact invokes the (paid) contract method with params as input values.
func (_Staking *StakingTransactorRaw) Transact(opts *bind.TransactOpts, method string, params ...interface{}) (*types.Transaction, error) {
	return _Staking.Contract.contract.Transact(opts, method, params...)
}

// GetClaimsManagerAddress is a free data retrieval call binding the contract method 0x948e5426.
//
// Solidity: function getClaimsManagerAddress() view returns(address)
func (_Staking *StakingCaller) GetClaimsManagerAddress(opts *bind.CallOpts) (common.Address, error) {
	var out []interface{}
	err := _Staking.contract.Call(opts, &out, "getClaimsManagerAddress")

	if err != nil {
		return *new(common.Address), err
	}

	out0 := *abi.ConvertType(out[0], new(common.Address)).(*common.Address)

	return out0, err

}

// GetClaimsManagerAddress is a free data retrieval call binding the contract method 0x948e5426.
//
// Solidity: function getClaimsManagerAddress() view returns(address)
func (_Staking *StakingSession) GetClaimsManagerAddress() (common.Address, error) {
	return _Staking.Contract.GetClaimsManagerAddress(&_Staking.CallOpts)
}

// GetClaimsManagerAddress is a free data retrieval call binding the contract method 0x948e5426.
//
// Solidity: function getClaimsManagerAddress() view returns(address)
func (_Staking *StakingCallerSession) GetClaimsManagerAddress() (common.Address, error) {
	return _Staking.Contract.GetClaimsManagerAddress(&_Staking.CallOpts)
}

// GetDelegateManagerAddress is a free data retrieval call binding the contract method 0xd16543f6.
//
// Solidity: function getDelegateManagerAddress() view returns(address)
func (_Staking *StakingCaller) GetDelegateManagerAddress(opts *bind.CallOpts) (common.Address, error) {
	var out []interface{}
	err := _Staking.contract.Call(opts, &out, "getDelegateManagerAddress")

	if err != nil {
		return *new(common.Address), err
	}

	out0 := *abi.ConvertType(out[0], new(common.Address)).(*common.Address)

	return out0, err

}

// GetDelegateManagerAddress is a free data retrieval call binding the contract method 0xd16543f6.
//
// Solidity: function getDelegateManagerAddress() view returns(address)
func (_Staking *StakingSession) GetDelegateManagerAddress() (common.Address, error) {
	return _Staking.Contract.GetDelegateManagerAddress(&_Staking.CallOpts)
}

// GetDelegateManagerAddress is a free data retrieval call binding the contract method 0xd16543f6.
//
// Solidity: function getDelegateManagerAddress() view returns(address)
func (_Staking *StakingCallerSession) GetDelegateManagerAddress() (common.Address, error) {
	return _Staking.Contract.GetDelegateManagerAddress(&_Staking.CallOpts)
}

// GetGovernanceAddress is a free data retrieval call binding the contract method 0x73252494.
//
// Solidity: function getGovernanceAddress() view returns(address)
func (_Staking *StakingCaller) GetGovernanceAddress(opts *bind.CallOpts) (common.Address, error) {
	var out []interface{}
	err := _Staking.contract.Call(opts, &out, "getGovernanceAddress")

	if err != nil {
		return *new(common.Address), err
	}

	out0 := *abi.ConvertType(out[0], new(common.Address)).(*common.Address)

	return out0, err

}

// GetGovernanceAddress is a free data retrieval call binding the contract method 0x73252494.
//
// Solidity: function getGovernanceAddress() view returns(address)
func (_Staking *StakingSession) GetGovernanceAddress() (common.Address, error) {
	return _Staking.Contract.GetGovernanceAddress(&_Staking.CallOpts)
}

// GetGovernanceAddress is a free data retrieval call binding the contract method 0x73252494.
//
// Solidity: function getGovernanceAddress() view returns(address)
func (_Staking *StakingCallerSession) GetGovernanceAddress() (common.Address, error) {
	return _Staking.Contract.GetGovernanceAddress(&_Staking.CallOpts)
}

// GetServiceProviderFactoryAddress is a free data retrieval call binding the contract method 0x002ae74a.
//
// Solidity: function getServiceProviderFactoryAddress() view returns(address)
func (_Staking *StakingCaller) GetServiceProviderFactoryAddress(opts *bind.CallOpts) (common.Address, error) {
	var out []interface{}
	err := _Staking.contract.Call(opts, &out, "getServiceProviderFactoryAddress")

	if err != nil {
		return *new(common.Address), err
	}

	out0 := *abi.ConvertType(out[0], new(common.Address)).(*common.Address)

	return out0, err

}

// GetServiceProviderFactoryAddress is a free data retrieval call binding the contract method 0x002ae74a.
//
// Solidity: function getServiceProviderFactoryAddress() view returns(address)
func (_Staking *StakingSession) GetServiceProviderFactoryAddress() (common.Address, error) {
	return _Staking.Contract.GetServiceProviderFactoryAddress(&_Staking.CallOpts)
}

// GetServiceProviderFactoryAddress is a free data retrieval call binding the contract method 0x002ae74a.
//
// Solidity: function getServiceProviderFactoryAddress() view returns(address)
func (_Staking *StakingCallerSession) GetServiceProviderFactoryAddress() (common.Address, error) {
	return _Staking.Contract.GetServiceProviderFactoryAddress(&_Staking.CallOpts)
}

// IsStaker is a free data retrieval call binding the contract method 0x6f1e8533.
//
// Solidity: function isStaker(address _accountAddress) view returns(bool)
func (_Staking *StakingCaller) IsStaker(opts *bind.CallOpts, _accountAddress common.Address) (bool, error) {
	var out []interface{}
	err := _Staking.contract.Call(opts, &out, "isStaker", _accountAddress)

	if err != nil {
		return *new(bool), err
	}

	out0 := *abi.ConvertType(out[0], new(bool)).(*bool)

	return out0, err

}

// IsStaker is a free data retrieval call binding the contract method 0x6f1e8533.
//
// Solidity: function isStaker(address _accountAddress) view returns(bool)
func (_Staking *StakingSession) IsStaker(_accountAddress common.Address) (bool, error) {
	return _Staking.Contract.IsStaker(&_Staking.CallOpts, _accountAddress)
}

// IsStaker is a free data retrieval call binding the contract method 0x6f1e8533.
//
// Solidity: function isStaker(address _accountAddress) view returns(bool)
func (_Staking *StakingCallerSession) IsStaker(_accountAddress common.Address) (bool, error) {
	return _Staking.Contract.IsStaker(&_Staking.CallOpts, _accountAddress)
}

// LastClaimedFor is a free data retrieval call binding the contract method 0x46350ae6.
//
// Solidity: function lastClaimedFor(address _accountAddress) view returns(uint256)
func (_Staking *StakingCaller) LastClaimedFor(opts *bind.CallOpts, _accountAddress common.Address) (*big.Int, error) {
	var out []interface{}
	err := _Staking.contract.Call(opts, &out, "lastClaimedFor", _accountAddress)

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

// LastClaimedFor is a free data retrieval call binding the contract method 0x46350ae6.
//
// Solidity: function lastClaimedFor(address _accountAddress) view returns(uint256)
func (_Staking *StakingSession) LastClaimedFor(_accountAddress common.Address) (*big.Int, error) {
	return _Staking.Contract.LastClaimedFor(&_Staking.CallOpts, _accountAddress)
}

// LastClaimedFor is a free data retrieval call binding the contract method 0x46350ae6.
//
// Solidity: function lastClaimedFor(address _accountAddress) view returns(uint256)
func (_Staking *StakingCallerSession) LastClaimedFor(_accountAddress common.Address) (*big.Int, error) {
	return _Staking.Contract.LastClaimedFor(&_Staking.CallOpts, _accountAddress)
}

// LastStakedFor is a free data retrieval call binding the contract method 0x233b7451.
//
// Solidity: function lastStakedFor(address _accountAddress) view returns(uint256)
func (_Staking *StakingCaller) LastStakedFor(opts *bind.CallOpts, _accountAddress common.Address) (*big.Int, error) {
	var out []interface{}
	err := _Staking.contract.Call(opts, &out, "lastStakedFor", _accountAddress)

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

// LastStakedFor is a free data retrieval call binding the contract method 0x233b7451.
//
// Solidity: function lastStakedFor(address _accountAddress) view returns(uint256)
func (_Staking *StakingSession) LastStakedFor(_accountAddress common.Address) (*big.Int, error) {
	return _Staking.Contract.LastStakedFor(&_Staking.CallOpts, _accountAddress)
}

// LastStakedFor is a free data retrieval call binding the contract method 0x233b7451.
//
// Solidity: function lastStakedFor(address _accountAddress) view returns(uint256)
func (_Staking *StakingCallerSession) LastStakedFor(_accountAddress common.Address) (*big.Int, error) {
	return _Staking.Contract.LastStakedFor(&_Staking.CallOpts, _accountAddress)
}

// SupportsHistory is a free data retrieval call binding the contract method 0x7033e4a6.
//
// Solidity: function supportsHistory() view returns(bool)
func (_Staking *StakingCaller) SupportsHistory(opts *bind.CallOpts) (bool, error) {
	var out []interface{}
	err := _Staking.contract.Call(opts, &out, "supportsHistory")

	if err != nil {
		return *new(bool), err
	}

	out0 := *abi.ConvertType(out[0], new(bool)).(*bool)

	return out0, err

}

// SupportsHistory is a free data retrieval call binding the contract method 0x7033e4a6.
//
// Solidity: function supportsHistory() view returns(bool)
func (_Staking *StakingSession) SupportsHistory() (bool, error) {
	return _Staking.Contract.SupportsHistory(&_Staking.CallOpts)
}

// SupportsHistory is a free data retrieval call binding the contract method 0x7033e4a6.
//
// Solidity: function supportsHistory() view returns(bool)
func (_Staking *StakingCallerSession) SupportsHistory() (bool, error) {
	return _Staking.Contract.SupportsHistory(&_Staking.CallOpts)
}

// Token is a free data retrieval call binding the contract method 0xfc0c546a.
//
// Solidity: function token() view returns(address)
func (_Staking *StakingCaller) Token(opts *bind.CallOpts) (common.Address, error) {
	var out []interface{}
	err := _Staking.contract.Call(opts, &out, "token")

	if err != nil {
		return *new(common.Address), err
	}

	out0 := *abi.ConvertType(out[0], new(common.Address)).(*common.Address)

	return out0, err

}

// Token is a free data retrieval call binding the contract method 0xfc0c546a.
//
// Solidity: function token() view returns(address)
func (_Staking *StakingSession) Token() (common.Address, error) {
	return _Staking.Contract.Token(&_Staking.CallOpts)
}

// Token is a free data retrieval call binding the contract method 0xfc0c546a.
//
// Solidity: function token() view returns(address)
func (_Staking *StakingCallerSession) Token() (common.Address, error) {
	return _Staking.Contract.Token(&_Staking.CallOpts)
}

// TotalStaked is a free data retrieval call binding the contract method 0x817b1cd2.
//
// Solidity: function totalStaked() view returns(uint256)
func (_Staking *StakingCaller) TotalStaked(opts *bind.CallOpts) (*big.Int, error) {
	var out []interface{}
	err := _Staking.contract.Call(opts, &out, "totalStaked")

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

// TotalStaked is a free data retrieval call binding the contract method 0x817b1cd2.
//
// Solidity: function totalStaked() view returns(uint256)
func (_Staking *StakingSession) TotalStaked() (*big.Int, error) {
	return _Staking.Contract.TotalStaked(&_Staking.CallOpts)
}

// TotalStaked is a free data retrieval call binding the contract method 0x817b1cd2.
//
// Solidity: function totalStaked() view returns(uint256)
func (_Staking *StakingCallerSession) TotalStaked() (*big.Int, error) {
	return _Staking.Contract.TotalStaked(&_Staking.CallOpts)
}

// TotalStakedAt is a free data retrieval call binding the contract method 0xc9c53232.
//
// Solidity: function totalStakedAt(uint256 _blockNumber) view returns(uint256)
func (_Staking *StakingCaller) TotalStakedAt(opts *bind.CallOpts, _blockNumber *big.Int) (*big.Int, error) {
	var out []interface{}
	err := _Staking.contract.Call(opts, &out, "totalStakedAt", _blockNumber)

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

// TotalStakedAt is a free data retrieval call binding the contract method 0xc9c53232.
//
// Solidity: function totalStakedAt(uint256 _blockNumber) view returns(uint256)
func (_Staking *StakingSession) TotalStakedAt(_blockNumber *big.Int) (*big.Int, error) {
	return _Staking.Contract.TotalStakedAt(&_Staking.CallOpts, _blockNumber)
}

// TotalStakedAt is a free data retrieval call binding the contract method 0xc9c53232.
//
// Solidity: function totalStakedAt(uint256 _blockNumber) view returns(uint256)
func (_Staking *StakingCallerSession) TotalStakedAt(_blockNumber *big.Int) (*big.Int, error) {
	return _Staking.Contract.TotalStakedAt(&_Staking.CallOpts, _blockNumber)
}

// TotalStakedFor is a free data retrieval call binding the contract method 0x4b341aed.
//
// Solidity: function totalStakedFor(address _accountAddress) view returns(uint256)
func (_Staking *StakingCaller) TotalStakedFor(opts *bind.CallOpts, _accountAddress common.Address) (*big.Int, error) {
	var out []interface{}
	err := _Staking.contract.Call(opts, &out, "totalStakedFor", _accountAddress)

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

// TotalStakedFor is a free data retrieval call binding the contract method 0x4b341aed.
//
// Solidity: function totalStakedFor(address _accountAddress) view returns(uint256)
func (_Staking *StakingSession) TotalStakedFor(_accountAddress common.Address) (*big.Int, error) {
	return _Staking.Contract.TotalStakedFor(&_Staking.CallOpts, _accountAddress)
}

// TotalStakedFor is a free data retrieval call binding the contract method 0x4b341aed.
//
// Solidity: function totalStakedFor(address _accountAddress) view returns(uint256)
func (_Staking *StakingCallerSession) TotalStakedFor(_accountAddress common.Address) (*big.Int, error) {
	return _Staking.Contract.TotalStakedFor(&_Staking.CallOpts, _accountAddress)
}

// TotalStakedForAt is a free data retrieval call binding the contract method 0xede38421.
//
// Solidity: function totalStakedForAt(address _accountAddress, uint256 _blockNumber) view returns(uint256)
func (_Staking *StakingCaller) TotalStakedForAt(opts *bind.CallOpts, _accountAddress common.Address, _blockNumber *big.Int) (*big.Int, error) {
	var out []interface{}
	err := _Staking.contract.Call(opts, &out, "totalStakedForAt", _accountAddress, _blockNumber)

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

// TotalStakedForAt is a free data retrieval call binding the contract method 0xede38421.
//
// Solidity: function totalStakedForAt(address _accountAddress, uint256 _blockNumber) view returns(uint256)
func (_Staking *StakingSession) TotalStakedForAt(_accountAddress common.Address, _blockNumber *big.Int) (*big.Int, error) {
	return _Staking.Contract.TotalStakedForAt(&_Staking.CallOpts, _accountAddress, _blockNumber)
}

// TotalStakedForAt is a free data retrieval call binding the contract method 0xede38421.
//
// Solidity: function totalStakedForAt(address _accountAddress, uint256 _blockNumber) view returns(uint256)
func (_Staking *StakingCallerSession) TotalStakedForAt(_accountAddress common.Address, _blockNumber *big.Int) (*big.Int, error) {
	return _Staking.Contract.TotalStakedForAt(&_Staking.CallOpts, _accountAddress, _blockNumber)
}

// DelegateStakeFor is a paid mutator transaction binding the contract method 0x6c483ff3.
//
// Solidity: function delegateStakeFor(address _accountAddress, address _delegatorAddress, uint256 _amount) returns()
func (_Staking *StakingTransactor) DelegateStakeFor(opts *bind.TransactOpts, _accountAddress common.Address, _delegatorAddress common.Address, _amount *big.Int) (*types.Transaction, error) {
	return _Staking.contract.Transact(opts, "delegateStakeFor", _accountAddress, _delegatorAddress, _amount)
}

// DelegateStakeFor is a paid mutator transaction binding the contract method 0x6c483ff3.
//
// Solidity: function delegateStakeFor(address _accountAddress, address _delegatorAddress, uint256 _amount) returns()
func (_Staking *StakingSession) DelegateStakeFor(_accountAddress common.Address, _delegatorAddress common.Address, _amount *big.Int) (*types.Transaction, error) {
	return _Staking.Contract.DelegateStakeFor(&_Staking.TransactOpts, _accountAddress, _delegatorAddress, _amount)
}

// DelegateStakeFor is a paid mutator transaction binding the contract method 0x6c483ff3.
//
// Solidity: function delegateStakeFor(address _accountAddress, address _delegatorAddress, uint256 _amount) returns()
func (_Staking *StakingTransactorSession) DelegateStakeFor(_accountAddress common.Address, _delegatorAddress common.Address, _amount *big.Int) (*types.Transaction, error) {
	return _Staking.Contract.DelegateStakeFor(&_Staking.TransactOpts, _accountAddress, _delegatorAddress, _amount)
}

// Initialize is a paid mutator transaction binding the contract method 0x485cc955.
//
// Solidity: function initialize(address _tokenAddress, address _governanceAddress) returns()
func (_Staking *StakingTransactor) Initialize(opts *bind.TransactOpts, _tokenAddress common.Address, _governanceAddress common.Address) (*types.Transaction, error) {
	return _Staking.contract.Transact(opts, "initialize", _tokenAddress, _governanceAddress)
}

// Initialize is a paid mutator transaction binding the contract method 0x485cc955.
//
// Solidity: function initialize(address _tokenAddress, address _governanceAddress) returns()
func (_Staking *StakingSession) Initialize(_tokenAddress common.Address, _governanceAddress common.Address) (*types.Transaction, error) {
	return _Staking.Contract.Initialize(&_Staking.TransactOpts, _tokenAddress, _governanceAddress)
}

// Initialize is a paid mutator transaction binding the contract method 0x485cc955.
//
// Solidity: function initialize(address _tokenAddress, address _governanceAddress) returns()
func (_Staking *StakingTransactorSession) Initialize(_tokenAddress common.Address, _governanceAddress common.Address) (*types.Transaction, error) {
	return _Staking.Contract.Initialize(&_Staking.TransactOpts, _tokenAddress, _governanceAddress)
}

// Initialize0 is a paid mutator transaction binding the contract method 0x8129fc1c.
//
// Solidity: function initialize() returns()
func (_Staking *StakingTransactor) Initialize0(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _Staking.contract.Transact(opts, "initialize0")
}

// Initialize0 is a paid mutator transaction binding the contract method 0x8129fc1c.
//
// Solidity: function initialize() returns()
func (_Staking *StakingSession) Initialize0() (*types.Transaction, error) {
	return _Staking.Contract.Initialize0(&_Staking.TransactOpts)
}

// Initialize0 is a paid mutator transaction binding the contract method 0x8129fc1c.
//
// Solidity: function initialize() returns()
func (_Staking *StakingTransactorSession) Initialize0() (*types.Transaction, error) {
	return _Staking.Contract.Initialize0(&_Staking.TransactOpts)
}

// SetClaimsManagerAddress is a paid mutator transaction binding the contract method 0xaa70d236.
//
// Solidity: function setClaimsManagerAddress(address _claimsManager) returns()
func (_Staking *StakingTransactor) SetClaimsManagerAddress(opts *bind.TransactOpts, _claimsManager common.Address) (*types.Transaction, error) {
	return _Staking.contract.Transact(opts, "setClaimsManagerAddress", _claimsManager)
}

// SetClaimsManagerAddress is a paid mutator transaction binding the contract method 0xaa70d236.
//
// Solidity: function setClaimsManagerAddress(address _claimsManager) returns()
func (_Staking *StakingSession) SetClaimsManagerAddress(_claimsManager common.Address) (*types.Transaction, error) {
	return _Staking.Contract.SetClaimsManagerAddress(&_Staking.TransactOpts, _claimsManager)
}

// SetClaimsManagerAddress is a paid mutator transaction binding the contract method 0xaa70d236.
//
// Solidity: function setClaimsManagerAddress(address _claimsManager) returns()
func (_Staking *StakingTransactorSession) SetClaimsManagerAddress(_claimsManager common.Address) (*types.Transaction, error) {
	return _Staking.Contract.SetClaimsManagerAddress(&_Staking.TransactOpts, _claimsManager)
}

// SetDelegateManagerAddress is a paid mutator transaction binding the contract method 0xea63d651.
//
// Solidity: function setDelegateManagerAddress(address _delegateManager) returns()
func (_Staking *StakingTransactor) SetDelegateManagerAddress(opts *bind.TransactOpts, _delegateManager common.Address) (*types.Transaction, error) {
	return _Staking.contract.Transact(opts, "setDelegateManagerAddress", _delegateManager)
}

// SetDelegateManagerAddress is a paid mutator transaction binding the contract method 0xea63d651.
//
// Solidity: function setDelegateManagerAddress(address _delegateManager) returns()
func (_Staking *StakingSession) SetDelegateManagerAddress(_delegateManager common.Address) (*types.Transaction, error) {
	return _Staking.Contract.SetDelegateManagerAddress(&_Staking.TransactOpts, _delegateManager)
}

// SetDelegateManagerAddress is a paid mutator transaction binding the contract method 0xea63d651.
//
// Solidity: function setDelegateManagerAddress(address _delegateManager) returns()
func (_Staking *StakingTransactorSession) SetDelegateManagerAddress(_delegateManager common.Address) (*types.Transaction, error) {
	return _Staking.Contract.SetDelegateManagerAddress(&_Staking.TransactOpts, _delegateManager)
}

// SetGovernanceAddress is a paid mutator transaction binding the contract method 0xcfc16254.
//
// Solidity: function setGovernanceAddress(address _governanceAddress) returns()
func (_Staking *StakingTransactor) SetGovernanceAddress(opts *bind.TransactOpts, _governanceAddress common.Address) (*types.Transaction, error) {
	return _Staking.contract.Transact(opts, "setGovernanceAddress", _governanceAddress)
}

// SetGovernanceAddress is a paid mutator transaction binding the contract method 0xcfc16254.
//
// Solidity: function setGovernanceAddress(address _governanceAddress) returns()
func (_Staking *StakingSession) SetGovernanceAddress(_governanceAddress common.Address) (*types.Transaction, error) {
	return _Staking.Contract.SetGovernanceAddress(&_Staking.TransactOpts, _governanceAddress)
}

// SetGovernanceAddress is a paid mutator transaction binding the contract method 0xcfc16254.
//
// Solidity: function setGovernanceAddress(address _governanceAddress) returns()
func (_Staking *StakingTransactorSession) SetGovernanceAddress(_governanceAddress common.Address) (*types.Transaction, error) {
	return _Staking.Contract.SetGovernanceAddress(&_Staking.TransactOpts, _governanceAddress)
}

// SetServiceProviderFactoryAddress is a paid mutator transaction binding the contract method 0x201ae9db.
//
// Solidity: function setServiceProviderFactoryAddress(address _spFactory) returns()
func (_Staking *StakingTransactor) SetServiceProviderFactoryAddress(opts *bind.TransactOpts, _spFactory common.Address) (*types.Transaction, error) {
	return _Staking.contract.Transact(opts, "setServiceProviderFactoryAddress", _spFactory)
}

// SetServiceProviderFactoryAddress is a paid mutator transaction binding the contract method 0x201ae9db.
//
// Solidity: function setServiceProviderFactoryAddress(address _spFactory) returns()
func (_Staking *StakingSession) SetServiceProviderFactoryAddress(_spFactory common.Address) (*types.Transaction, error) {
	return _Staking.Contract.SetServiceProviderFactoryAddress(&_Staking.TransactOpts, _spFactory)
}

// SetServiceProviderFactoryAddress is a paid mutator transaction binding the contract method 0x201ae9db.
//
// Solidity: function setServiceProviderFactoryAddress(address _spFactory) returns()
func (_Staking *StakingTransactorSession) SetServiceProviderFactoryAddress(_spFactory common.Address) (*types.Transaction, error) {
	return _Staking.Contract.SetServiceProviderFactoryAddress(&_Staking.TransactOpts, _spFactory)
}

// Slash is a paid mutator transaction binding the contract method 0x3d82e3c1.
//
// Solidity: function slash(uint256 _amount, address _slashAddress) returns()
func (_Staking *StakingTransactor) Slash(opts *bind.TransactOpts, _amount *big.Int, _slashAddress common.Address) (*types.Transaction, error) {
	return _Staking.contract.Transact(opts, "slash", _amount, _slashAddress)
}

// Slash is a paid mutator transaction binding the contract method 0x3d82e3c1.
//
// Solidity: function slash(uint256 _amount, address _slashAddress) returns()
func (_Staking *StakingSession) Slash(_amount *big.Int, _slashAddress common.Address) (*types.Transaction, error) {
	return _Staking.Contract.Slash(&_Staking.TransactOpts, _amount, _slashAddress)
}

// Slash is a paid mutator transaction binding the contract method 0x3d82e3c1.
//
// Solidity: function slash(uint256 _amount, address _slashAddress) returns()
func (_Staking *StakingTransactorSession) Slash(_amount *big.Int, _slashAddress common.Address) (*types.Transaction, error) {
	return _Staking.Contract.Slash(&_Staking.TransactOpts, _amount, _slashAddress)
}

// StakeFor is a paid mutator transaction binding the contract method 0x2ee40908.
//
// Solidity: function stakeFor(address _accountAddress, uint256 _amount) returns()
func (_Staking *StakingTransactor) StakeFor(opts *bind.TransactOpts, _accountAddress common.Address, _amount *big.Int) (*types.Transaction, error) {
	return _Staking.contract.Transact(opts, "stakeFor", _accountAddress, _amount)
}

// StakeFor is a paid mutator transaction binding the contract method 0x2ee40908.
//
// Solidity: function stakeFor(address _accountAddress, uint256 _amount) returns()
func (_Staking *StakingSession) StakeFor(_accountAddress common.Address, _amount *big.Int) (*types.Transaction, error) {
	return _Staking.Contract.StakeFor(&_Staking.TransactOpts, _accountAddress, _amount)
}

// StakeFor is a paid mutator transaction binding the contract method 0x2ee40908.
//
// Solidity: function stakeFor(address _accountAddress, uint256 _amount) returns()
func (_Staking *StakingTransactorSession) StakeFor(_accountAddress common.Address, _amount *big.Int) (*types.Transaction, error) {
	return _Staking.Contract.StakeFor(&_Staking.TransactOpts, _accountAddress, _amount)
}

// StakeRewards is a paid mutator transaction binding the contract method 0x9b172b35.
//
// Solidity: function stakeRewards(uint256 _amount, address _stakerAccount) returns()
func (_Staking *StakingTransactor) StakeRewards(opts *bind.TransactOpts, _amount *big.Int, _stakerAccount common.Address) (*types.Transaction, error) {
	return _Staking.contract.Transact(opts, "stakeRewards", _amount, _stakerAccount)
}

// StakeRewards is a paid mutator transaction binding the contract method 0x9b172b35.
//
// Solidity: function stakeRewards(uint256 _amount, address _stakerAccount) returns()
func (_Staking *StakingSession) StakeRewards(_amount *big.Int, _stakerAccount common.Address) (*types.Transaction, error) {
	return _Staking.Contract.StakeRewards(&_Staking.TransactOpts, _amount, _stakerAccount)
}

// StakeRewards is a paid mutator transaction binding the contract method 0x9b172b35.
//
// Solidity: function stakeRewards(uint256 _amount, address _stakerAccount) returns()
func (_Staking *StakingTransactorSession) StakeRewards(_amount *big.Int, _stakerAccount common.Address) (*types.Transaction, error) {
	return _Staking.Contract.StakeRewards(&_Staking.TransactOpts, _amount, _stakerAccount)
}

// UndelegateStakeFor is a paid mutator transaction binding the contract method 0xccd9838a.
//
// Solidity: function undelegateStakeFor(address _accountAddress, address _delegatorAddress, uint256 _amount) returns()
func (_Staking *StakingTransactor) UndelegateStakeFor(opts *bind.TransactOpts, _accountAddress common.Address, _delegatorAddress common.Address, _amount *big.Int) (*types.Transaction, error) {
	return _Staking.contract.Transact(opts, "undelegateStakeFor", _accountAddress, _delegatorAddress, _amount)
}

// UndelegateStakeFor is a paid mutator transaction binding the contract method 0xccd9838a.
//
// Solidity: function undelegateStakeFor(address _accountAddress, address _delegatorAddress, uint256 _amount) returns()
func (_Staking *StakingSession) UndelegateStakeFor(_accountAddress common.Address, _delegatorAddress common.Address, _amount *big.Int) (*types.Transaction, error) {
	return _Staking.Contract.UndelegateStakeFor(&_Staking.TransactOpts, _accountAddress, _delegatorAddress, _amount)
}

// UndelegateStakeFor is a paid mutator transaction binding the contract method 0xccd9838a.
//
// Solidity: function undelegateStakeFor(address _accountAddress, address _delegatorAddress, uint256 _amount) returns()
func (_Staking *StakingTransactorSession) UndelegateStakeFor(_accountAddress common.Address, _delegatorAddress common.Address, _amount *big.Int) (*types.Transaction, error) {
	return _Staking.Contract.UndelegateStakeFor(&_Staking.TransactOpts, _accountAddress, _delegatorAddress, _amount)
}

// UnstakeFor is a paid mutator transaction binding the contract method 0x36ef088c.
//
// Solidity: function unstakeFor(address _accountAddress, uint256 _amount) returns()
func (_Staking *StakingTransactor) UnstakeFor(opts *bind.TransactOpts, _accountAddress common.Address, _amount *big.Int) (*types.Transaction, error) {
	return _Staking.contract.Transact(opts, "unstakeFor", _accountAddress, _amount)
}

// UnstakeFor is a paid mutator transaction binding the contract method 0x36ef088c.
//
// Solidity: function unstakeFor(address _accountAddress, uint256 _amount) returns()
func (_Staking *StakingSession) UnstakeFor(_accountAddress common.Address, _amount *big.Int) (*types.Transaction, error) {
	return _Staking.Contract.UnstakeFor(&_Staking.TransactOpts, _accountAddress, _amount)
}

// UnstakeFor is a paid mutator transaction binding the contract method 0x36ef088c.
//
// Solidity: function unstakeFor(address _accountAddress, uint256 _amount) returns()
func (_Staking *StakingTransactorSession) UnstakeFor(_accountAddress common.Address, _amount *big.Int) (*types.Transaction, error) {
	return _Staking.Contract.UnstakeFor(&_Staking.TransactOpts, _accountAddress, _amount)
}

// UpdateClaimHistory is a paid mutator transaction binding the contract method 0xa2e5e73e.
//
// Solidity: function updateClaimHistory(uint256 _amount, address _stakerAccount) returns()
func (_Staking *StakingTransactor) UpdateClaimHistory(opts *bind.TransactOpts, _amount *big.Int, _stakerAccount common.Address) (*types.Transaction, error) {
	return _Staking.contract.Transact(opts, "updateClaimHistory", _amount, _stakerAccount)
}

// UpdateClaimHistory is a paid mutator transaction binding the contract method 0xa2e5e73e.
//
// Solidity: function updateClaimHistory(uint256 _amount, address _stakerAccount) returns()
func (_Staking *StakingSession) UpdateClaimHistory(_amount *big.Int, _stakerAccount common.Address) (*types.Transaction, error) {
	return _Staking.Contract.UpdateClaimHistory(&_Staking.TransactOpts, _amount, _stakerAccount)
}

// UpdateClaimHistory is a paid mutator transaction binding the contract method 0xa2e5e73e.
//
// Solidity: function updateClaimHistory(uint256 _amount, address _stakerAccount) returns()
func (_Staking *StakingTransactorSession) UpdateClaimHistory(_amount *big.Int, _stakerAccount common.Address) (*types.Transaction, error) {
	return _Staking.Contract.UpdateClaimHistory(&_Staking.TransactOpts, _amount, _stakerAccount)
}

// StakingSlashedIterator is returned from FilterSlashed and is used to iterate over the raw logs and unpacked data for Slashed events raised by the Staking contract.
type StakingSlashedIterator struct {
	Event *StakingSlashed // Event containing the contract specifics and raw log

	contract *bind.BoundContract // Generic contract to use for unpacking event data
	event    string              // Event name to use for unpacking event data

	logs chan types.Log        // Log channel receiving the found contract events
	sub  ethereum.Subscription // Subscription for errors, completion and termination
	done bool                  // Whether the subscription completed delivering logs
	fail error                 // Occurred error to stop iteration
}

// Next advances the iterator to the subsequent event, returning whether there
// are any more events found. In case of a retrieval or parsing error, false is
// returned and Error() can be queried for the exact failure.
func (it *StakingSlashedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(StakingSlashed)
			if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
				it.fail = err
				return false
			}
			it.Event.Raw = log
			return true

		default:
			return false
		}
	}
	// Iterator still in progress, wait for either a data or an error event
	select {
	case log := <-it.logs:
		it.Event = new(StakingSlashed)
		if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
			it.fail = err
			return false
		}
		it.Event.Raw = log
		return true

	case err := <-it.sub.Err():
		it.done = true
		it.fail = err
		return it.Next()
	}
}

// Error returns any retrieval or parsing error occurred during filtering.
func (it *StakingSlashedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *StakingSlashedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// StakingSlashed represents a Slashed event raised by the Staking contract.
type StakingSlashed struct {
	User   common.Address
	Amount *big.Int
	Total  *big.Int
	Raw    types.Log // Blockchain specific contextual infos
}

// FilterSlashed is a free log retrieval operation binding the contract event 0x45a371af55b0726877a30f464edc14db5879ab096590bacce682cf6c18223596.
//
// Solidity: event Slashed(address indexed user, uint256 amount, uint256 total)
func (_Staking *StakingFilterer) FilterSlashed(opts *bind.FilterOpts, user []common.Address) (*StakingSlashedIterator, error) {

	var userRule []interface{}
	for _, userItem := range user {
		userRule = append(userRule, userItem)
	}

	logs, sub, err := _Staking.contract.FilterLogs(opts, "Slashed", userRule)
	if err != nil {
		return nil, err
	}
	return &StakingSlashedIterator{contract: _Staking.contract, event: "Slashed", logs: logs, sub: sub}, nil
}

// WatchSlashed is a free log subscription operation binding the contract event 0x45a371af55b0726877a30f464edc14db5879ab096590bacce682cf6c18223596.
//
// Solidity: event Slashed(address indexed user, uint256 amount, uint256 total)
func (_Staking *StakingFilterer) WatchSlashed(opts *bind.WatchOpts, sink chan<- *StakingSlashed, user []common.Address) (event.Subscription, error) {

	var userRule []interface{}
	for _, userItem := range user {
		userRule = append(userRule, userItem)
	}

	logs, sub, err := _Staking.contract.WatchLogs(opts, "Slashed", userRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(StakingSlashed)
				if err := _Staking.contract.UnpackLog(event, "Slashed", log); err != nil {
					return err
				}
				event.Raw = log

				select {
				case sink <- event:
				case err := <-sub.Err():
					return err
				case <-quit:
					return nil
				}
			case err := <-sub.Err():
				return err
			case <-quit:
				return nil
			}
		}
	}), nil
}

// ParseSlashed is a log parse operation binding the contract event 0x45a371af55b0726877a30f464edc14db5879ab096590bacce682cf6c18223596.
//
// Solidity: event Slashed(address indexed user, uint256 amount, uint256 total)
func (_Staking *StakingFilterer) ParseSlashed(log types.Log) (*StakingSlashed, error) {
	event := new(StakingSlashed)
	if err := _Staking.contract.UnpackLog(event, "Slashed", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// StakingStakedIterator is returned from FilterStaked and is used to iterate over the raw logs and unpacked data for Staked events raised by the Staking contract.
type StakingStakedIterator struct {
	Event *StakingStaked // Event containing the contract specifics and raw log

	contract *bind.BoundContract // Generic contract to use for unpacking event data
	event    string              // Event name to use for unpacking event data

	logs chan types.Log        // Log channel receiving the found contract events
	sub  ethereum.Subscription // Subscription for errors, completion and termination
	done bool                  // Whether the subscription completed delivering logs
	fail error                 // Occurred error to stop iteration
}

// Next advances the iterator to the subsequent event, returning whether there
// are any more events found. In case of a retrieval or parsing error, false is
// returned and Error() can be queried for the exact failure.
func (it *StakingStakedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(StakingStaked)
			if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
				it.fail = err
				return false
			}
			it.Event.Raw = log
			return true

		default:
			return false
		}
	}
	// Iterator still in progress, wait for either a data or an error event
	select {
	case log := <-it.logs:
		it.Event = new(StakingStaked)
		if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
			it.fail = err
			return false
		}
		it.Event.Raw = log
		return true

	case err := <-it.sub.Err():
		it.done = true
		it.fail = err
		return it.Next()
	}
}

// Error returns any retrieval or parsing error occurred during filtering.
func (it *StakingStakedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *StakingStakedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// StakingStaked represents a Staked event raised by the Staking contract.
type StakingStaked struct {
	User   common.Address
	Amount *big.Int
	Total  *big.Int
	Raw    types.Log // Blockchain specific contextual infos
}

// FilterStaked is a free log retrieval operation binding the contract event 0x1449c6dd7851abc30abf37f57715f492010519147cc2652fbc38202c18a6ee90.
//
// Solidity: event Staked(address indexed user, uint256 amount, uint256 total)
func (_Staking *StakingFilterer) FilterStaked(opts *bind.FilterOpts, user []common.Address) (*StakingStakedIterator, error) {

	var userRule []interface{}
	for _, userItem := range user {
		userRule = append(userRule, userItem)
	}

	logs, sub, err := _Staking.contract.FilterLogs(opts, "Staked", userRule)
	if err != nil {
		return nil, err
	}
	return &StakingStakedIterator{contract: _Staking.contract, event: "Staked", logs: logs, sub: sub}, nil
}

// WatchStaked is a free log subscription operation binding the contract event 0x1449c6dd7851abc30abf37f57715f492010519147cc2652fbc38202c18a6ee90.
//
// Solidity: event Staked(address indexed user, uint256 amount, uint256 total)
func (_Staking *StakingFilterer) WatchStaked(opts *bind.WatchOpts, sink chan<- *StakingStaked, user []common.Address) (event.Subscription, error) {

	var userRule []interface{}
	for _, userItem := range user {
		userRule = append(userRule, userItem)
	}

	logs, sub, err := _Staking.contract.WatchLogs(opts, "Staked", userRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(StakingStaked)
				if err := _Staking.contract.UnpackLog(event, "Staked", log); err != nil {
					return err
				}
				event.Raw = log

				select {
				case sink <- event:
				case err := <-sub.Err():
					return err
				case <-quit:
					return nil
				}
			case err := <-sub.Err():
				return err
			case <-quit:
				return nil
			}
		}
	}), nil
}

// ParseStaked is a log parse operation binding the contract event 0x1449c6dd7851abc30abf37f57715f492010519147cc2652fbc38202c18a6ee90.
//
// Solidity: event Staked(address indexed user, uint256 amount, uint256 total)
func (_Staking *StakingFilterer) ParseStaked(log types.Log) (*StakingStaked, error) {
	event := new(StakingStaked)
	if err := _Staking.contract.UnpackLog(event, "Staked", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// StakingUnstakedIterator is returned from FilterUnstaked and is used to iterate over the raw logs and unpacked data for Unstaked events raised by the Staking contract.
type StakingUnstakedIterator struct {
	Event *StakingUnstaked // Event containing the contract specifics and raw log

	contract *bind.BoundContract // Generic contract to use for unpacking event data
	event    string              // Event name to use for unpacking event data

	logs chan types.Log        // Log channel receiving the found contract events
	sub  ethereum.Subscription // Subscription for errors, completion and termination
	done bool                  // Whether the subscription completed delivering logs
	fail error                 // Occurred error to stop iteration
}

// Next advances the iterator to the subsequent event, returning whether there
// are any more events found. In case of a retrieval or parsing error, false is
// returned and Error() can be queried for the exact failure.
func (it *StakingUnstakedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(StakingUnstaked)
			if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
				it.fail = err
				return false
			}
			it.Event.Raw = log
			return true

		default:
			return false
		}
	}
	// Iterator still in progress, wait for either a data or an error event
	select {
	case log := <-it.logs:
		it.Event = new(StakingUnstaked)
		if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
			it.fail = err
			return false
		}
		it.Event.Raw = log
		return true

	case err := <-it.sub.Err():
		it.done = true
		it.fail = err
		return it.Next()
	}
}

// Error returns any retrieval or parsing error occurred during filtering.
func (it *StakingUnstakedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *StakingUnstakedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// StakingUnstaked represents a Unstaked event raised by the Staking contract.
type StakingUnstaked struct {
	User   common.Address
	Amount *big.Int
	Total  *big.Int
	Raw    types.Log // Blockchain specific contextual infos
}

// FilterUnstaked is a free log retrieval operation binding the contract event 0x7fc4727e062e336010f2c282598ef5f14facb3de68cf8195c2f23e1454b2b74e.
//
// Solidity: event Unstaked(address indexed user, uint256 amount, uint256 total)
func (_Staking *StakingFilterer) FilterUnstaked(opts *bind.FilterOpts, user []common.Address) (*StakingUnstakedIterator, error) {

	var userRule []interface{}
	for _, userItem := range user {
		userRule = append(userRule, userItem)
	}

	logs, sub, err := _Staking.contract.FilterLogs(opts, "Unstaked", userRule)
	if err != nil {
		return nil, err
	}
	return &StakingUnstakedIterator{contract: _Staking.contract, event: "Unstaked", logs: logs, sub: sub}, nil
}

// WatchUnstaked is a free log subscription operation binding the contract event 0x7fc4727e062e336010f2c282598ef5f14facb3de68cf8195c2f23e1454b2b74e.
//
// Solidity: event Unstaked(address indexed user, uint256 amount, uint256 total)
func (_Staking *StakingFilterer) WatchUnstaked(opts *bind.WatchOpts, sink chan<- *StakingUnstaked, user []common.Address) (event.Subscription, error) {

	var userRule []interface{}
	for _, userItem := range user {
		userRule = append(userRule, userItem)
	}

	logs, sub, err := _Staking.contract.WatchLogs(opts, "Unstaked", userRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(StakingUnstaked)
				if err := _Staking.contract.UnpackLog(event, "Unstaked", log); err != nil {
					return err
				}
				event.Raw = log

				select {
				case sink <- event:
				case err := <-sub.Err():
					return err
				case <-quit:
					return nil
				}
			case err := <-sub.Err():
				return err
			case <-quit:
				return nil
			}
		}
	}), nil
}

// ParseUnstaked is a log parse operation binding the contract event 0x7fc4727e062e336010f2c282598ef5f14facb3de68cf8195c2f23e1454b2b74e.
//
// Solidity: event Unstaked(address indexed user, uint256 amount, uint256 total)
func (_Staking *StakingFilterer) ParseUnstaked(log types.Log) (*StakingUnstaked, error) {
	event := new(StakingUnstaked)
	if err := _Staking.contract.UnpackLog(event, "Unstaked", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}
