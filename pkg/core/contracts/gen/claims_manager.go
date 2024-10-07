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

// ClaimsManagerMetaData contains all meta data concerning the ClaimsManager contract.
var ClaimsManagerMetaData = &bind.MetaData{
	ABI: "[{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"_claimer\",\"type\":\"address\"},{\"indexed\":true,\"internalType\":\"uint256\",\"name\":\"_rewards\",\"type\":\"uint256\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"_oldTotal\",\"type\":\"uint256\"},{\"indexed\":true,\"internalType\":\"uint256\",\"name\":\"_newTotal\",\"type\":\"uint256\"}],\"name\":\"ClaimProcessed\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"_newCommunityPoolAddress\",\"type\":\"address\"}],\"name\":\"CommunityPoolAddressUpdated\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"_transferAddress\",\"type\":\"address\"},{\"indexed\":true,\"internalType\":\"uint256\",\"name\":\"_amount\",\"type\":\"uint256\"}],\"name\":\"CommunityRewardsTransferred\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"_newDelegateManagerAddress\",\"type\":\"address\"}],\"name\":\"DelegateManagerAddressUpdated\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"uint256\",\"name\":\"_amount\",\"type\":\"uint256\"}],\"name\":\"FundingAmountUpdated\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"uint256\",\"name\":\"_blockDifference\",\"type\":\"uint256\"}],\"name\":\"FundingRoundBlockDiffUpdated\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"_newGovernanceAddress\",\"type\":\"address\"}],\"name\":\"GovernanceAddressUpdated\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"uint256\",\"name\":\"_amount\",\"type\":\"uint256\"}],\"name\":\"RecurringCommunityFundingAmountUpdated\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"uint256\",\"name\":\"_blockNumber\",\"type\":\"uint256\"},{\"indexed\":true,\"internalType\":\"uint256\",\"name\":\"_roundNumber\",\"type\":\"uint256\"},{\"indexed\":true,\"internalType\":\"uint256\",\"name\":\"_fundAmount\",\"type\":\"uint256\"}],\"name\":\"RoundInitiated\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"_newServiceProviderFactoryAddress\",\"type\":\"address\"}],\"name\":\"ServiceProviderFactoryAddressUpdated\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"_newStakingAddress\",\"type\":\"address\"}],\"name\":\"StakingAddressUpdated\",\"type\":\"event\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"address\",\"name\":\"_tokenAddress\",\"type\":\"address\"},{\"internalType\":\"address\",\"name\":\"_governanceAddress\",\"type\":\"address\"}],\"name\":\"initialize\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[],\"name\":\"initialize\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"getFundingRoundBlockDiff\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"getLastFundedBlock\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"getFundsPerRound\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"getTotalClaimedInRound\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"getGovernanceAddress\",\"outputs\":[{\"internalType\":\"address\",\"name\":\"\",\"type\":\"address\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"getServiceProviderFactoryAddress\",\"outputs\":[{\"internalType\":\"address\",\"name\":\"\",\"type\":\"address\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"getDelegateManagerAddress\",\"outputs\":[{\"internalType\":\"address\",\"name\":\"\",\"type\":\"address\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"getStakingAddress\",\"outputs\":[{\"internalType\":\"address\",\"name\":\"\",\"type\":\"address\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"getCommunityPoolAddress\",\"outputs\":[{\"internalType\":\"address\",\"name\":\"\",\"type\":\"address\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"getRecurringCommunityFundingAmount\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"address\",\"name\":\"_governanceAddress\",\"type\":\"address\"}],\"name\":\"setGovernanceAddress\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"address\",\"name\":\"_stakingAddress\",\"type\":\"address\"}],\"name\":\"setStakingAddress\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"address\",\"name\":\"_serviceProviderFactoryAddress\",\"type\":\"address\"}],\"name\":\"setServiceProviderFactoryAddress\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"address\",\"name\":\"_delegateManagerAddress\",\"type\":\"address\"}],\"name\":\"setDelegateManagerAddress\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[],\"name\":\"initiateRound\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"address\",\"name\":\"_claimer\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"_totalLockedForSP\",\"type\":\"uint256\"}],\"name\":\"processClaim\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"_newAmount\",\"type\":\"uint256\"}],\"name\":\"updateFundingAmount\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[{\"internalType\":\"address\",\"name\":\"_sp\",\"type\":\"address\"}],\"name\":\"claimPending\",\"outputs\":[{\"internalType\":\"bool\",\"name\":\"\",\"type\":\"bool\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"_newFundingRoundBlockDiff\",\"type\":\"uint256\"}],\"name\":\"updateFundingRoundBlockDiff\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"_newRecurringCommunityFundingAmount\",\"type\":\"uint256\"}],\"name\":\"updateRecurringCommunityFundingAmount\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"address\",\"name\":\"_newCommunityPoolAddress\",\"type\":\"address\"}],\"name\":\"updateCommunityPoolAddress\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"}]",
}

// ClaimsManagerABI is the input ABI used to generate the binding from.
// Deprecated: Use ClaimsManagerMetaData.ABI instead.
var ClaimsManagerABI = ClaimsManagerMetaData.ABI

// ClaimsManager is an auto generated Go binding around an Ethereum contract.
type ClaimsManager struct {
	ClaimsManagerCaller     // Read-only binding to the contract
	ClaimsManagerTransactor // Write-only binding to the contract
	ClaimsManagerFilterer   // Log filterer for contract events
}

// ClaimsManagerCaller is an auto generated read-only Go binding around an Ethereum contract.
type ClaimsManagerCaller struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// ClaimsManagerTransactor is an auto generated write-only Go binding around an Ethereum contract.
type ClaimsManagerTransactor struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// ClaimsManagerFilterer is an auto generated log filtering Go binding around an Ethereum contract events.
type ClaimsManagerFilterer struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// ClaimsManagerSession is an auto generated Go binding around an Ethereum contract,
// with pre-set call and transact options.
type ClaimsManagerSession struct {
	Contract     *ClaimsManager    // Generic contract binding to set the session for
	CallOpts     bind.CallOpts     // Call options to use throughout this session
	TransactOpts bind.TransactOpts // Transaction auth options to use throughout this session
}

// ClaimsManagerCallerSession is an auto generated read-only Go binding around an Ethereum contract,
// with pre-set call options.
type ClaimsManagerCallerSession struct {
	Contract *ClaimsManagerCaller // Generic contract caller binding to set the session for
	CallOpts bind.CallOpts        // Call options to use throughout this session
}

// ClaimsManagerTransactorSession is an auto generated write-only Go binding around an Ethereum contract,
// with pre-set transact options.
type ClaimsManagerTransactorSession struct {
	Contract     *ClaimsManagerTransactor // Generic contract transactor binding to set the session for
	TransactOpts bind.TransactOpts        // Transaction auth options to use throughout this session
}

// ClaimsManagerRaw is an auto generated low-level Go binding around an Ethereum contract.
type ClaimsManagerRaw struct {
	Contract *ClaimsManager // Generic contract binding to access the raw methods on
}

// ClaimsManagerCallerRaw is an auto generated low-level read-only Go binding around an Ethereum contract.
type ClaimsManagerCallerRaw struct {
	Contract *ClaimsManagerCaller // Generic read-only contract binding to access the raw methods on
}

// ClaimsManagerTransactorRaw is an auto generated low-level write-only Go binding around an Ethereum contract.
type ClaimsManagerTransactorRaw struct {
	Contract *ClaimsManagerTransactor // Generic write-only contract binding to access the raw methods on
}

// NewClaimsManager creates a new instance of ClaimsManager, bound to a specific deployed contract.
func NewClaimsManager(address common.Address, backend bind.ContractBackend) (*ClaimsManager, error) {
	contract, err := bindClaimsManager(address, backend, backend, backend)
	if err != nil {
		return nil, err
	}
	return &ClaimsManager{ClaimsManagerCaller: ClaimsManagerCaller{contract: contract}, ClaimsManagerTransactor: ClaimsManagerTransactor{contract: contract}, ClaimsManagerFilterer: ClaimsManagerFilterer{contract: contract}}, nil
}

// NewClaimsManagerCaller creates a new read-only instance of ClaimsManager, bound to a specific deployed contract.
func NewClaimsManagerCaller(address common.Address, caller bind.ContractCaller) (*ClaimsManagerCaller, error) {
	contract, err := bindClaimsManager(address, caller, nil, nil)
	if err != nil {
		return nil, err
	}
	return &ClaimsManagerCaller{contract: contract}, nil
}

// NewClaimsManagerTransactor creates a new write-only instance of ClaimsManager, bound to a specific deployed contract.
func NewClaimsManagerTransactor(address common.Address, transactor bind.ContractTransactor) (*ClaimsManagerTransactor, error) {
	contract, err := bindClaimsManager(address, nil, transactor, nil)
	if err != nil {
		return nil, err
	}
	return &ClaimsManagerTransactor{contract: contract}, nil
}

// NewClaimsManagerFilterer creates a new log filterer instance of ClaimsManager, bound to a specific deployed contract.
func NewClaimsManagerFilterer(address common.Address, filterer bind.ContractFilterer) (*ClaimsManagerFilterer, error) {
	contract, err := bindClaimsManager(address, nil, nil, filterer)
	if err != nil {
		return nil, err
	}
	return &ClaimsManagerFilterer{contract: contract}, nil
}

// bindClaimsManager binds a generic wrapper to an already deployed contract.
func bindClaimsManager(address common.Address, caller bind.ContractCaller, transactor bind.ContractTransactor, filterer bind.ContractFilterer) (*bind.BoundContract, error) {
	parsed, err := ClaimsManagerMetaData.GetAbi()
	if err != nil {
		return nil, err
	}
	return bind.NewBoundContract(address, *parsed, caller, transactor, filterer), nil
}

// Call invokes the (constant) contract method with params as input values and
// sets the output to result. The result type might be a single field for simple
// returns, a slice of interfaces for anonymous returns and a struct for named
// returns.
func (_ClaimsManager *ClaimsManagerRaw) Call(opts *bind.CallOpts, result *[]interface{}, method string, params ...interface{}) error {
	return _ClaimsManager.Contract.ClaimsManagerCaller.contract.Call(opts, result, method, params...)
}

// Transfer initiates a plain transaction to move funds to the contract, calling
// its default method if one is available.
func (_ClaimsManager *ClaimsManagerRaw) Transfer(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _ClaimsManager.Contract.ClaimsManagerTransactor.contract.Transfer(opts)
}

// Transact invokes the (paid) contract method with params as input values.
func (_ClaimsManager *ClaimsManagerRaw) Transact(opts *bind.TransactOpts, method string, params ...interface{}) (*types.Transaction, error) {
	return _ClaimsManager.Contract.ClaimsManagerTransactor.contract.Transact(opts, method, params...)
}

// Call invokes the (constant) contract method with params as input values and
// sets the output to result. The result type might be a single field for simple
// returns, a slice of interfaces for anonymous returns and a struct for named
// returns.
func (_ClaimsManager *ClaimsManagerCallerRaw) Call(opts *bind.CallOpts, result *[]interface{}, method string, params ...interface{}) error {
	return _ClaimsManager.Contract.contract.Call(opts, result, method, params...)
}

// Transfer initiates a plain transaction to move funds to the contract, calling
// its default method if one is available.
func (_ClaimsManager *ClaimsManagerTransactorRaw) Transfer(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _ClaimsManager.Contract.contract.Transfer(opts)
}

// Transact invokes the (paid) contract method with params as input values.
func (_ClaimsManager *ClaimsManagerTransactorRaw) Transact(opts *bind.TransactOpts, method string, params ...interface{}) (*types.Transaction, error) {
	return _ClaimsManager.Contract.contract.Transact(opts, method, params...)
}

// ClaimPending is a free data retrieval call binding the contract method 0xd017f483.
//
// Solidity: function claimPending(address _sp) view returns(bool)
func (_ClaimsManager *ClaimsManagerCaller) ClaimPending(opts *bind.CallOpts, _sp common.Address) (bool, error) {
	var out []interface{}
	err := _ClaimsManager.contract.Call(opts, &out, "claimPending", _sp)

	if err != nil {
		return *new(bool), err
	}

	out0 := *abi.ConvertType(out[0], new(bool)).(*bool)

	return out0, err

}

// ClaimPending is a free data retrieval call binding the contract method 0xd017f483.
//
// Solidity: function claimPending(address _sp) view returns(bool)
func (_ClaimsManager *ClaimsManagerSession) ClaimPending(_sp common.Address) (bool, error) {
	return _ClaimsManager.Contract.ClaimPending(&_ClaimsManager.CallOpts, _sp)
}

// ClaimPending is a free data retrieval call binding the contract method 0xd017f483.
//
// Solidity: function claimPending(address _sp) view returns(bool)
func (_ClaimsManager *ClaimsManagerCallerSession) ClaimPending(_sp common.Address) (bool, error) {
	return _ClaimsManager.Contract.ClaimPending(&_ClaimsManager.CallOpts, _sp)
}

// GetCommunityPoolAddress is a free data retrieval call binding the contract method 0xad5186f6.
//
// Solidity: function getCommunityPoolAddress() view returns(address)
func (_ClaimsManager *ClaimsManagerCaller) GetCommunityPoolAddress(opts *bind.CallOpts) (common.Address, error) {
	var out []interface{}
	err := _ClaimsManager.contract.Call(opts, &out, "getCommunityPoolAddress")

	if err != nil {
		return *new(common.Address), err
	}

	out0 := *abi.ConvertType(out[0], new(common.Address)).(*common.Address)

	return out0, err

}

// GetCommunityPoolAddress is a free data retrieval call binding the contract method 0xad5186f6.
//
// Solidity: function getCommunityPoolAddress() view returns(address)
func (_ClaimsManager *ClaimsManagerSession) GetCommunityPoolAddress() (common.Address, error) {
	return _ClaimsManager.Contract.GetCommunityPoolAddress(&_ClaimsManager.CallOpts)
}

// GetCommunityPoolAddress is a free data retrieval call binding the contract method 0xad5186f6.
//
// Solidity: function getCommunityPoolAddress() view returns(address)
func (_ClaimsManager *ClaimsManagerCallerSession) GetCommunityPoolAddress() (common.Address, error) {
	return _ClaimsManager.Contract.GetCommunityPoolAddress(&_ClaimsManager.CallOpts)
}

// GetDelegateManagerAddress is a free data retrieval call binding the contract method 0xd16543f6.
//
// Solidity: function getDelegateManagerAddress() view returns(address)
func (_ClaimsManager *ClaimsManagerCaller) GetDelegateManagerAddress(opts *bind.CallOpts) (common.Address, error) {
	var out []interface{}
	err := _ClaimsManager.contract.Call(opts, &out, "getDelegateManagerAddress")

	if err != nil {
		return *new(common.Address), err
	}

	out0 := *abi.ConvertType(out[0], new(common.Address)).(*common.Address)

	return out0, err

}

// GetDelegateManagerAddress is a free data retrieval call binding the contract method 0xd16543f6.
//
// Solidity: function getDelegateManagerAddress() view returns(address)
func (_ClaimsManager *ClaimsManagerSession) GetDelegateManagerAddress() (common.Address, error) {
	return _ClaimsManager.Contract.GetDelegateManagerAddress(&_ClaimsManager.CallOpts)
}

// GetDelegateManagerAddress is a free data retrieval call binding the contract method 0xd16543f6.
//
// Solidity: function getDelegateManagerAddress() view returns(address)
func (_ClaimsManager *ClaimsManagerCallerSession) GetDelegateManagerAddress() (common.Address, error) {
	return _ClaimsManager.Contract.GetDelegateManagerAddress(&_ClaimsManager.CallOpts)
}

// GetFundingRoundBlockDiff is a free data retrieval call binding the contract method 0x44616718.
//
// Solidity: function getFundingRoundBlockDiff() view returns(uint256)
func (_ClaimsManager *ClaimsManagerCaller) GetFundingRoundBlockDiff(opts *bind.CallOpts) (*big.Int, error) {
	var out []interface{}
	err := _ClaimsManager.contract.Call(opts, &out, "getFundingRoundBlockDiff")

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

// GetFundingRoundBlockDiff is a free data retrieval call binding the contract method 0x44616718.
//
// Solidity: function getFundingRoundBlockDiff() view returns(uint256)
func (_ClaimsManager *ClaimsManagerSession) GetFundingRoundBlockDiff() (*big.Int, error) {
	return _ClaimsManager.Contract.GetFundingRoundBlockDiff(&_ClaimsManager.CallOpts)
}

// GetFundingRoundBlockDiff is a free data retrieval call binding the contract method 0x44616718.
//
// Solidity: function getFundingRoundBlockDiff() view returns(uint256)
func (_ClaimsManager *ClaimsManagerCallerSession) GetFundingRoundBlockDiff() (*big.Int, error) {
	return _ClaimsManager.Contract.GetFundingRoundBlockDiff(&_ClaimsManager.CallOpts)
}

// GetFundsPerRound is a free data retrieval call binding the contract method 0x2a2085f3.
//
// Solidity: function getFundsPerRound() view returns(uint256)
func (_ClaimsManager *ClaimsManagerCaller) GetFundsPerRound(opts *bind.CallOpts) (*big.Int, error) {
	var out []interface{}
	err := _ClaimsManager.contract.Call(opts, &out, "getFundsPerRound")

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

// GetFundsPerRound is a free data retrieval call binding the contract method 0x2a2085f3.
//
// Solidity: function getFundsPerRound() view returns(uint256)
func (_ClaimsManager *ClaimsManagerSession) GetFundsPerRound() (*big.Int, error) {
	return _ClaimsManager.Contract.GetFundsPerRound(&_ClaimsManager.CallOpts)
}

// GetFundsPerRound is a free data retrieval call binding the contract method 0x2a2085f3.
//
// Solidity: function getFundsPerRound() view returns(uint256)
func (_ClaimsManager *ClaimsManagerCallerSession) GetFundsPerRound() (*big.Int, error) {
	return _ClaimsManager.Contract.GetFundsPerRound(&_ClaimsManager.CallOpts)
}

// GetGovernanceAddress is a free data retrieval call binding the contract method 0x73252494.
//
// Solidity: function getGovernanceAddress() view returns(address)
func (_ClaimsManager *ClaimsManagerCaller) GetGovernanceAddress(opts *bind.CallOpts) (common.Address, error) {
	var out []interface{}
	err := _ClaimsManager.contract.Call(opts, &out, "getGovernanceAddress")

	if err != nil {
		return *new(common.Address), err
	}

	out0 := *abi.ConvertType(out[0], new(common.Address)).(*common.Address)

	return out0, err

}

// GetGovernanceAddress is a free data retrieval call binding the contract method 0x73252494.
//
// Solidity: function getGovernanceAddress() view returns(address)
func (_ClaimsManager *ClaimsManagerSession) GetGovernanceAddress() (common.Address, error) {
	return _ClaimsManager.Contract.GetGovernanceAddress(&_ClaimsManager.CallOpts)
}

// GetGovernanceAddress is a free data retrieval call binding the contract method 0x73252494.
//
// Solidity: function getGovernanceAddress() view returns(address)
func (_ClaimsManager *ClaimsManagerCallerSession) GetGovernanceAddress() (common.Address, error) {
	return _ClaimsManager.Contract.GetGovernanceAddress(&_ClaimsManager.CallOpts)
}

// GetLastFundedBlock is a free data retrieval call binding the contract method 0x60558c0f.
//
// Solidity: function getLastFundedBlock() view returns(uint256)
func (_ClaimsManager *ClaimsManagerCaller) GetLastFundedBlock(opts *bind.CallOpts) (*big.Int, error) {
	var out []interface{}
	err := _ClaimsManager.contract.Call(opts, &out, "getLastFundedBlock")

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

// GetLastFundedBlock is a free data retrieval call binding the contract method 0x60558c0f.
//
// Solidity: function getLastFundedBlock() view returns(uint256)
func (_ClaimsManager *ClaimsManagerSession) GetLastFundedBlock() (*big.Int, error) {
	return _ClaimsManager.Contract.GetLastFundedBlock(&_ClaimsManager.CallOpts)
}

// GetLastFundedBlock is a free data retrieval call binding the contract method 0x60558c0f.
//
// Solidity: function getLastFundedBlock() view returns(uint256)
func (_ClaimsManager *ClaimsManagerCallerSession) GetLastFundedBlock() (*big.Int, error) {
	return _ClaimsManager.Contract.GetLastFundedBlock(&_ClaimsManager.CallOpts)
}

// GetRecurringCommunityFundingAmount is a free data retrieval call binding the contract method 0xe26cd9ca.
//
// Solidity: function getRecurringCommunityFundingAmount() view returns(uint256)
func (_ClaimsManager *ClaimsManagerCaller) GetRecurringCommunityFundingAmount(opts *bind.CallOpts) (*big.Int, error) {
	var out []interface{}
	err := _ClaimsManager.contract.Call(opts, &out, "getRecurringCommunityFundingAmount")

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

// GetRecurringCommunityFundingAmount is a free data retrieval call binding the contract method 0xe26cd9ca.
//
// Solidity: function getRecurringCommunityFundingAmount() view returns(uint256)
func (_ClaimsManager *ClaimsManagerSession) GetRecurringCommunityFundingAmount() (*big.Int, error) {
	return _ClaimsManager.Contract.GetRecurringCommunityFundingAmount(&_ClaimsManager.CallOpts)
}

// GetRecurringCommunityFundingAmount is a free data retrieval call binding the contract method 0xe26cd9ca.
//
// Solidity: function getRecurringCommunityFundingAmount() view returns(uint256)
func (_ClaimsManager *ClaimsManagerCallerSession) GetRecurringCommunityFundingAmount() (*big.Int, error) {
	return _ClaimsManager.Contract.GetRecurringCommunityFundingAmount(&_ClaimsManager.CallOpts)
}

// GetServiceProviderFactoryAddress is a free data retrieval call binding the contract method 0x002ae74a.
//
// Solidity: function getServiceProviderFactoryAddress() view returns(address)
func (_ClaimsManager *ClaimsManagerCaller) GetServiceProviderFactoryAddress(opts *bind.CallOpts) (common.Address, error) {
	var out []interface{}
	err := _ClaimsManager.contract.Call(opts, &out, "getServiceProviderFactoryAddress")

	if err != nil {
		return *new(common.Address), err
	}

	out0 := *abi.ConvertType(out[0], new(common.Address)).(*common.Address)

	return out0, err

}

// GetServiceProviderFactoryAddress is a free data retrieval call binding the contract method 0x002ae74a.
//
// Solidity: function getServiceProviderFactoryAddress() view returns(address)
func (_ClaimsManager *ClaimsManagerSession) GetServiceProviderFactoryAddress() (common.Address, error) {
	return _ClaimsManager.Contract.GetServiceProviderFactoryAddress(&_ClaimsManager.CallOpts)
}

// GetServiceProviderFactoryAddress is a free data retrieval call binding the contract method 0x002ae74a.
//
// Solidity: function getServiceProviderFactoryAddress() view returns(address)
func (_ClaimsManager *ClaimsManagerCallerSession) GetServiceProviderFactoryAddress() (common.Address, error) {
	return _ClaimsManager.Contract.GetServiceProviderFactoryAddress(&_ClaimsManager.CallOpts)
}

// GetStakingAddress is a free data retrieval call binding the contract method 0x0e9ed68b.
//
// Solidity: function getStakingAddress() view returns(address)
func (_ClaimsManager *ClaimsManagerCaller) GetStakingAddress(opts *bind.CallOpts) (common.Address, error) {
	var out []interface{}
	err := _ClaimsManager.contract.Call(opts, &out, "getStakingAddress")

	if err != nil {
		return *new(common.Address), err
	}

	out0 := *abi.ConvertType(out[0], new(common.Address)).(*common.Address)

	return out0, err

}

// GetStakingAddress is a free data retrieval call binding the contract method 0x0e9ed68b.
//
// Solidity: function getStakingAddress() view returns(address)
func (_ClaimsManager *ClaimsManagerSession) GetStakingAddress() (common.Address, error) {
	return _ClaimsManager.Contract.GetStakingAddress(&_ClaimsManager.CallOpts)
}

// GetStakingAddress is a free data retrieval call binding the contract method 0x0e9ed68b.
//
// Solidity: function getStakingAddress() view returns(address)
func (_ClaimsManager *ClaimsManagerCallerSession) GetStakingAddress() (common.Address, error) {
	return _ClaimsManager.Contract.GetStakingAddress(&_ClaimsManager.CallOpts)
}

// GetTotalClaimedInRound is a free data retrieval call binding the contract method 0xd1158d94.
//
// Solidity: function getTotalClaimedInRound() view returns(uint256)
func (_ClaimsManager *ClaimsManagerCaller) GetTotalClaimedInRound(opts *bind.CallOpts) (*big.Int, error) {
	var out []interface{}
	err := _ClaimsManager.contract.Call(opts, &out, "getTotalClaimedInRound")

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

// GetTotalClaimedInRound is a free data retrieval call binding the contract method 0xd1158d94.
//
// Solidity: function getTotalClaimedInRound() view returns(uint256)
func (_ClaimsManager *ClaimsManagerSession) GetTotalClaimedInRound() (*big.Int, error) {
	return _ClaimsManager.Contract.GetTotalClaimedInRound(&_ClaimsManager.CallOpts)
}

// GetTotalClaimedInRound is a free data retrieval call binding the contract method 0xd1158d94.
//
// Solidity: function getTotalClaimedInRound() view returns(uint256)
func (_ClaimsManager *ClaimsManagerCallerSession) GetTotalClaimedInRound() (*big.Int, error) {
	return _ClaimsManager.Contract.GetTotalClaimedInRound(&_ClaimsManager.CallOpts)
}

// Initialize is a paid mutator transaction binding the contract method 0x485cc955.
//
// Solidity: function initialize(address _tokenAddress, address _governanceAddress) returns()
func (_ClaimsManager *ClaimsManagerTransactor) Initialize(opts *bind.TransactOpts, _tokenAddress common.Address, _governanceAddress common.Address) (*types.Transaction, error) {
	return _ClaimsManager.contract.Transact(opts, "initialize", _tokenAddress, _governanceAddress)
}

// Initialize is a paid mutator transaction binding the contract method 0x485cc955.
//
// Solidity: function initialize(address _tokenAddress, address _governanceAddress) returns()
func (_ClaimsManager *ClaimsManagerSession) Initialize(_tokenAddress common.Address, _governanceAddress common.Address) (*types.Transaction, error) {
	return _ClaimsManager.Contract.Initialize(&_ClaimsManager.TransactOpts, _tokenAddress, _governanceAddress)
}

// Initialize is a paid mutator transaction binding the contract method 0x485cc955.
//
// Solidity: function initialize(address _tokenAddress, address _governanceAddress) returns()
func (_ClaimsManager *ClaimsManagerTransactorSession) Initialize(_tokenAddress common.Address, _governanceAddress common.Address) (*types.Transaction, error) {
	return _ClaimsManager.Contract.Initialize(&_ClaimsManager.TransactOpts, _tokenAddress, _governanceAddress)
}

// Initialize0 is a paid mutator transaction binding the contract method 0x8129fc1c.
//
// Solidity: function initialize() returns()
func (_ClaimsManager *ClaimsManagerTransactor) Initialize0(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _ClaimsManager.contract.Transact(opts, "initialize0")
}

// Initialize0 is a paid mutator transaction binding the contract method 0x8129fc1c.
//
// Solidity: function initialize() returns()
func (_ClaimsManager *ClaimsManagerSession) Initialize0() (*types.Transaction, error) {
	return _ClaimsManager.Contract.Initialize0(&_ClaimsManager.TransactOpts)
}

// Initialize0 is a paid mutator transaction binding the contract method 0x8129fc1c.
//
// Solidity: function initialize() returns()
func (_ClaimsManager *ClaimsManagerTransactorSession) Initialize0() (*types.Transaction, error) {
	return _ClaimsManager.Contract.Initialize0(&_ClaimsManager.TransactOpts)
}

// InitiateRound is a paid mutator transaction binding the contract method 0xb8a0ca0e.
//
// Solidity: function initiateRound() returns()
func (_ClaimsManager *ClaimsManagerTransactor) InitiateRound(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _ClaimsManager.contract.Transact(opts, "initiateRound")
}

// InitiateRound is a paid mutator transaction binding the contract method 0xb8a0ca0e.
//
// Solidity: function initiateRound() returns()
func (_ClaimsManager *ClaimsManagerSession) InitiateRound() (*types.Transaction, error) {
	return _ClaimsManager.Contract.InitiateRound(&_ClaimsManager.TransactOpts)
}

// InitiateRound is a paid mutator transaction binding the contract method 0xb8a0ca0e.
//
// Solidity: function initiateRound() returns()
func (_ClaimsManager *ClaimsManagerTransactorSession) InitiateRound() (*types.Transaction, error) {
	return _ClaimsManager.Contract.InitiateRound(&_ClaimsManager.TransactOpts)
}

// ProcessClaim is a paid mutator transaction binding the contract method 0x6ffc215c.
//
// Solidity: function processClaim(address _claimer, uint256 _totalLockedForSP) returns(uint256)
func (_ClaimsManager *ClaimsManagerTransactor) ProcessClaim(opts *bind.TransactOpts, _claimer common.Address, _totalLockedForSP *big.Int) (*types.Transaction, error) {
	return _ClaimsManager.contract.Transact(opts, "processClaim", _claimer, _totalLockedForSP)
}

// ProcessClaim is a paid mutator transaction binding the contract method 0x6ffc215c.
//
// Solidity: function processClaim(address _claimer, uint256 _totalLockedForSP) returns(uint256)
func (_ClaimsManager *ClaimsManagerSession) ProcessClaim(_claimer common.Address, _totalLockedForSP *big.Int) (*types.Transaction, error) {
	return _ClaimsManager.Contract.ProcessClaim(&_ClaimsManager.TransactOpts, _claimer, _totalLockedForSP)
}

// ProcessClaim is a paid mutator transaction binding the contract method 0x6ffc215c.
//
// Solidity: function processClaim(address _claimer, uint256 _totalLockedForSP) returns(uint256)
func (_ClaimsManager *ClaimsManagerTransactorSession) ProcessClaim(_claimer common.Address, _totalLockedForSP *big.Int) (*types.Transaction, error) {
	return _ClaimsManager.Contract.ProcessClaim(&_ClaimsManager.TransactOpts, _claimer, _totalLockedForSP)
}

// SetDelegateManagerAddress is a paid mutator transaction binding the contract method 0xea63d651.
//
// Solidity: function setDelegateManagerAddress(address _delegateManagerAddress) returns()
func (_ClaimsManager *ClaimsManagerTransactor) SetDelegateManagerAddress(opts *bind.TransactOpts, _delegateManagerAddress common.Address) (*types.Transaction, error) {
	return _ClaimsManager.contract.Transact(opts, "setDelegateManagerAddress", _delegateManagerAddress)
}

// SetDelegateManagerAddress is a paid mutator transaction binding the contract method 0xea63d651.
//
// Solidity: function setDelegateManagerAddress(address _delegateManagerAddress) returns()
func (_ClaimsManager *ClaimsManagerSession) SetDelegateManagerAddress(_delegateManagerAddress common.Address) (*types.Transaction, error) {
	return _ClaimsManager.Contract.SetDelegateManagerAddress(&_ClaimsManager.TransactOpts, _delegateManagerAddress)
}

// SetDelegateManagerAddress is a paid mutator transaction binding the contract method 0xea63d651.
//
// Solidity: function setDelegateManagerAddress(address _delegateManagerAddress) returns()
func (_ClaimsManager *ClaimsManagerTransactorSession) SetDelegateManagerAddress(_delegateManagerAddress common.Address) (*types.Transaction, error) {
	return _ClaimsManager.Contract.SetDelegateManagerAddress(&_ClaimsManager.TransactOpts, _delegateManagerAddress)
}

// SetGovernanceAddress is a paid mutator transaction binding the contract method 0xcfc16254.
//
// Solidity: function setGovernanceAddress(address _governanceAddress) returns()
func (_ClaimsManager *ClaimsManagerTransactor) SetGovernanceAddress(opts *bind.TransactOpts, _governanceAddress common.Address) (*types.Transaction, error) {
	return _ClaimsManager.contract.Transact(opts, "setGovernanceAddress", _governanceAddress)
}

// SetGovernanceAddress is a paid mutator transaction binding the contract method 0xcfc16254.
//
// Solidity: function setGovernanceAddress(address _governanceAddress) returns()
func (_ClaimsManager *ClaimsManagerSession) SetGovernanceAddress(_governanceAddress common.Address) (*types.Transaction, error) {
	return _ClaimsManager.Contract.SetGovernanceAddress(&_ClaimsManager.TransactOpts, _governanceAddress)
}

// SetGovernanceAddress is a paid mutator transaction binding the contract method 0xcfc16254.
//
// Solidity: function setGovernanceAddress(address _governanceAddress) returns()
func (_ClaimsManager *ClaimsManagerTransactorSession) SetGovernanceAddress(_governanceAddress common.Address) (*types.Transaction, error) {
	return _ClaimsManager.Contract.SetGovernanceAddress(&_ClaimsManager.TransactOpts, _governanceAddress)
}

// SetServiceProviderFactoryAddress is a paid mutator transaction binding the contract method 0x201ae9db.
//
// Solidity: function setServiceProviderFactoryAddress(address _serviceProviderFactoryAddress) returns()
func (_ClaimsManager *ClaimsManagerTransactor) SetServiceProviderFactoryAddress(opts *bind.TransactOpts, _serviceProviderFactoryAddress common.Address) (*types.Transaction, error) {
	return _ClaimsManager.contract.Transact(opts, "setServiceProviderFactoryAddress", _serviceProviderFactoryAddress)
}

// SetServiceProviderFactoryAddress is a paid mutator transaction binding the contract method 0x201ae9db.
//
// Solidity: function setServiceProviderFactoryAddress(address _serviceProviderFactoryAddress) returns()
func (_ClaimsManager *ClaimsManagerSession) SetServiceProviderFactoryAddress(_serviceProviderFactoryAddress common.Address) (*types.Transaction, error) {
	return _ClaimsManager.Contract.SetServiceProviderFactoryAddress(&_ClaimsManager.TransactOpts, _serviceProviderFactoryAddress)
}

// SetServiceProviderFactoryAddress is a paid mutator transaction binding the contract method 0x201ae9db.
//
// Solidity: function setServiceProviderFactoryAddress(address _serviceProviderFactoryAddress) returns()
func (_ClaimsManager *ClaimsManagerTransactorSession) SetServiceProviderFactoryAddress(_serviceProviderFactoryAddress common.Address) (*types.Transaction, error) {
	return _ClaimsManager.Contract.SetServiceProviderFactoryAddress(&_ClaimsManager.TransactOpts, _serviceProviderFactoryAddress)
}

// SetStakingAddress is a paid mutator transaction binding the contract method 0xf4e0d9ac.
//
// Solidity: function setStakingAddress(address _stakingAddress) returns()
func (_ClaimsManager *ClaimsManagerTransactor) SetStakingAddress(opts *bind.TransactOpts, _stakingAddress common.Address) (*types.Transaction, error) {
	return _ClaimsManager.contract.Transact(opts, "setStakingAddress", _stakingAddress)
}

// SetStakingAddress is a paid mutator transaction binding the contract method 0xf4e0d9ac.
//
// Solidity: function setStakingAddress(address _stakingAddress) returns()
func (_ClaimsManager *ClaimsManagerSession) SetStakingAddress(_stakingAddress common.Address) (*types.Transaction, error) {
	return _ClaimsManager.Contract.SetStakingAddress(&_ClaimsManager.TransactOpts, _stakingAddress)
}

// SetStakingAddress is a paid mutator transaction binding the contract method 0xf4e0d9ac.
//
// Solidity: function setStakingAddress(address _stakingAddress) returns()
func (_ClaimsManager *ClaimsManagerTransactorSession) SetStakingAddress(_stakingAddress common.Address) (*types.Transaction, error) {
	return _ClaimsManager.Contract.SetStakingAddress(&_ClaimsManager.TransactOpts, _stakingAddress)
}

// UpdateCommunityPoolAddress is a paid mutator transaction binding the contract method 0xab0254c2.
//
// Solidity: function updateCommunityPoolAddress(address _newCommunityPoolAddress) returns()
func (_ClaimsManager *ClaimsManagerTransactor) UpdateCommunityPoolAddress(opts *bind.TransactOpts, _newCommunityPoolAddress common.Address) (*types.Transaction, error) {
	return _ClaimsManager.contract.Transact(opts, "updateCommunityPoolAddress", _newCommunityPoolAddress)
}

// UpdateCommunityPoolAddress is a paid mutator transaction binding the contract method 0xab0254c2.
//
// Solidity: function updateCommunityPoolAddress(address _newCommunityPoolAddress) returns()
func (_ClaimsManager *ClaimsManagerSession) UpdateCommunityPoolAddress(_newCommunityPoolAddress common.Address) (*types.Transaction, error) {
	return _ClaimsManager.Contract.UpdateCommunityPoolAddress(&_ClaimsManager.TransactOpts, _newCommunityPoolAddress)
}

// UpdateCommunityPoolAddress is a paid mutator transaction binding the contract method 0xab0254c2.
//
// Solidity: function updateCommunityPoolAddress(address _newCommunityPoolAddress) returns()
func (_ClaimsManager *ClaimsManagerTransactorSession) UpdateCommunityPoolAddress(_newCommunityPoolAddress common.Address) (*types.Transaction, error) {
	return _ClaimsManager.Contract.UpdateCommunityPoolAddress(&_ClaimsManager.TransactOpts, _newCommunityPoolAddress)
}

// UpdateFundingAmount is a paid mutator transaction binding the contract method 0x51dd2125.
//
// Solidity: function updateFundingAmount(uint256 _newAmount) returns()
func (_ClaimsManager *ClaimsManagerTransactor) UpdateFundingAmount(opts *bind.TransactOpts, _newAmount *big.Int) (*types.Transaction, error) {
	return _ClaimsManager.contract.Transact(opts, "updateFundingAmount", _newAmount)
}

// UpdateFundingAmount is a paid mutator transaction binding the contract method 0x51dd2125.
//
// Solidity: function updateFundingAmount(uint256 _newAmount) returns()
func (_ClaimsManager *ClaimsManagerSession) UpdateFundingAmount(_newAmount *big.Int) (*types.Transaction, error) {
	return _ClaimsManager.Contract.UpdateFundingAmount(&_ClaimsManager.TransactOpts, _newAmount)
}

// UpdateFundingAmount is a paid mutator transaction binding the contract method 0x51dd2125.
//
// Solidity: function updateFundingAmount(uint256 _newAmount) returns()
func (_ClaimsManager *ClaimsManagerTransactorSession) UpdateFundingAmount(_newAmount *big.Int) (*types.Transaction, error) {
	return _ClaimsManager.Contract.UpdateFundingAmount(&_ClaimsManager.TransactOpts, _newAmount)
}

// UpdateFundingRoundBlockDiff is a paid mutator transaction binding the contract method 0xd949d2d0.
//
// Solidity: function updateFundingRoundBlockDiff(uint256 _newFundingRoundBlockDiff) returns()
func (_ClaimsManager *ClaimsManagerTransactor) UpdateFundingRoundBlockDiff(opts *bind.TransactOpts, _newFundingRoundBlockDiff *big.Int) (*types.Transaction, error) {
	return _ClaimsManager.contract.Transact(opts, "updateFundingRoundBlockDiff", _newFundingRoundBlockDiff)
}

// UpdateFundingRoundBlockDiff is a paid mutator transaction binding the contract method 0xd949d2d0.
//
// Solidity: function updateFundingRoundBlockDiff(uint256 _newFundingRoundBlockDiff) returns()
func (_ClaimsManager *ClaimsManagerSession) UpdateFundingRoundBlockDiff(_newFundingRoundBlockDiff *big.Int) (*types.Transaction, error) {
	return _ClaimsManager.Contract.UpdateFundingRoundBlockDiff(&_ClaimsManager.TransactOpts, _newFundingRoundBlockDiff)
}

// UpdateFundingRoundBlockDiff is a paid mutator transaction binding the contract method 0xd949d2d0.
//
// Solidity: function updateFundingRoundBlockDiff(uint256 _newFundingRoundBlockDiff) returns()
func (_ClaimsManager *ClaimsManagerTransactorSession) UpdateFundingRoundBlockDiff(_newFundingRoundBlockDiff *big.Int) (*types.Transaction, error) {
	return _ClaimsManager.Contract.UpdateFundingRoundBlockDiff(&_ClaimsManager.TransactOpts, _newFundingRoundBlockDiff)
}

// UpdateRecurringCommunityFundingAmount is a paid mutator transaction binding the contract method 0xe863cbb6.
//
// Solidity: function updateRecurringCommunityFundingAmount(uint256 _newRecurringCommunityFundingAmount) returns()
func (_ClaimsManager *ClaimsManagerTransactor) UpdateRecurringCommunityFundingAmount(opts *bind.TransactOpts, _newRecurringCommunityFundingAmount *big.Int) (*types.Transaction, error) {
	return _ClaimsManager.contract.Transact(opts, "updateRecurringCommunityFundingAmount", _newRecurringCommunityFundingAmount)
}

// UpdateRecurringCommunityFundingAmount is a paid mutator transaction binding the contract method 0xe863cbb6.
//
// Solidity: function updateRecurringCommunityFundingAmount(uint256 _newRecurringCommunityFundingAmount) returns()
func (_ClaimsManager *ClaimsManagerSession) UpdateRecurringCommunityFundingAmount(_newRecurringCommunityFundingAmount *big.Int) (*types.Transaction, error) {
	return _ClaimsManager.Contract.UpdateRecurringCommunityFundingAmount(&_ClaimsManager.TransactOpts, _newRecurringCommunityFundingAmount)
}

// UpdateRecurringCommunityFundingAmount is a paid mutator transaction binding the contract method 0xe863cbb6.
//
// Solidity: function updateRecurringCommunityFundingAmount(uint256 _newRecurringCommunityFundingAmount) returns()
func (_ClaimsManager *ClaimsManagerTransactorSession) UpdateRecurringCommunityFundingAmount(_newRecurringCommunityFundingAmount *big.Int) (*types.Transaction, error) {
	return _ClaimsManager.Contract.UpdateRecurringCommunityFundingAmount(&_ClaimsManager.TransactOpts, _newRecurringCommunityFundingAmount)
}

// ClaimsManagerClaimProcessedIterator is returned from FilterClaimProcessed and is used to iterate over the raw logs and unpacked data for ClaimProcessed events raised by the ClaimsManager contract.
type ClaimsManagerClaimProcessedIterator struct {
	Event *ClaimsManagerClaimProcessed // Event containing the contract specifics and raw log

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
func (it *ClaimsManagerClaimProcessedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(ClaimsManagerClaimProcessed)
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
		it.Event = new(ClaimsManagerClaimProcessed)
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
func (it *ClaimsManagerClaimProcessedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *ClaimsManagerClaimProcessedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// ClaimsManagerClaimProcessed represents a ClaimProcessed event raised by the ClaimsManager contract.
type ClaimsManagerClaimProcessed struct {
	Claimer  common.Address
	Rewards  *big.Int
	OldTotal *big.Int
	NewTotal *big.Int
	Raw      types.Log // Blockchain specific contextual infos
}

// FilterClaimProcessed is a free log retrieval operation binding the contract event 0xd87a3f3b3833d1f959bcb6d7c5810d9242d8cf6a77a4240184b33859ceccf8b7.
//
// Solidity: event ClaimProcessed(address indexed _claimer, uint256 indexed _rewards, uint256 _oldTotal, uint256 indexed _newTotal)
func (_ClaimsManager *ClaimsManagerFilterer) FilterClaimProcessed(opts *bind.FilterOpts, _claimer []common.Address, _rewards []*big.Int, _newTotal []*big.Int) (*ClaimsManagerClaimProcessedIterator, error) {

	var _claimerRule []interface{}
	for _, _claimerItem := range _claimer {
		_claimerRule = append(_claimerRule, _claimerItem)
	}
	var _rewardsRule []interface{}
	for _, _rewardsItem := range _rewards {
		_rewardsRule = append(_rewardsRule, _rewardsItem)
	}

	var _newTotalRule []interface{}
	for _, _newTotalItem := range _newTotal {
		_newTotalRule = append(_newTotalRule, _newTotalItem)
	}

	logs, sub, err := _ClaimsManager.contract.FilterLogs(opts, "ClaimProcessed", _claimerRule, _rewardsRule, _newTotalRule)
	if err != nil {
		return nil, err
	}
	return &ClaimsManagerClaimProcessedIterator{contract: _ClaimsManager.contract, event: "ClaimProcessed", logs: logs, sub: sub}, nil
}

// WatchClaimProcessed is a free log subscription operation binding the contract event 0xd87a3f3b3833d1f959bcb6d7c5810d9242d8cf6a77a4240184b33859ceccf8b7.
//
// Solidity: event ClaimProcessed(address indexed _claimer, uint256 indexed _rewards, uint256 _oldTotal, uint256 indexed _newTotal)
func (_ClaimsManager *ClaimsManagerFilterer) WatchClaimProcessed(opts *bind.WatchOpts, sink chan<- *ClaimsManagerClaimProcessed, _claimer []common.Address, _rewards []*big.Int, _newTotal []*big.Int) (event.Subscription, error) {

	var _claimerRule []interface{}
	for _, _claimerItem := range _claimer {
		_claimerRule = append(_claimerRule, _claimerItem)
	}
	var _rewardsRule []interface{}
	for _, _rewardsItem := range _rewards {
		_rewardsRule = append(_rewardsRule, _rewardsItem)
	}

	var _newTotalRule []interface{}
	for _, _newTotalItem := range _newTotal {
		_newTotalRule = append(_newTotalRule, _newTotalItem)
	}

	logs, sub, err := _ClaimsManager.contract.WatchLogs(opts, "ClaimProcessed", _claimerRule, _rewardsRule, _newTotalRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(ClaimsManagerClaimProcessed)
				if err := _ClaimsManager.contract.UnpackLog(event, "ClaimProcessed", log); err != nil {
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

// ParseClaimProcessed is a log parse operation binding the contract event 0xd87a3f3b3833d1f959bcb6d7c5810d9242d8cf6a77a4240184b33859ceccf8b7.
//
// Solidity: event ClaimProcessed(address indexed _claimer, uint256 indexed _rewards, uint256 _oldTotal, uint256 indexed _newTotal)
func (_ClaimsManager *ClaimsManagerFilterer) ParseClaimProcessed(log types.Log) (*ClaimsManagerClaimProcessed, error) {
	event := new(ClaimsManagerClaimProcessed)
	if err := _ClaimsManager.contract.UnpackLog(event, "ClaimProcessed", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// ClaimsManagerCommunityPoolAddressUpdatedIterator is returned from FilterCommunityPoolAddressUpdated and is used to iterate over the raw logs and unpacked data for CommunityPoolAddressUpdated events raised by the ClaimsManager contract.
type ClaimsManagerCommunityPoolAddressUpdatedIterator struct {
	Event *ClaimsManagerCommunityPoolAddressUpdated // Event containing the contract specifics and raw log

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
func (it *ClaimsManagerCommunityPoolAddressUpdatedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(ClaimsManagerCommunityPoolAddressUpdated)
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
		it.Event = new(ClaimsManagerCommunityPoolAddressUpdated)
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
func (it *ClaimsManagerCommunityPoolAddressUpdatedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *ClaimsManagerCommunityPoolAddressUpdatedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// ClaimsManagerCommunityPoolAddressUpdated represents a CommunityPoolAddressUpdated event raised by the ClaimsManager contract.
type ClaimsManagerCommunityPoolAddressUpdated struct {
	NewCommunityPoolAddress common.Address
	Raw                     types.Log // Blockchain specific contextual infos
}

// FilterCommunityPoolAddressUpdated is a free log retrieval operation binding the contract event 0xc5ca1722c22b0f252e610ced534cb4e638625687f2dce278c50154281fb064a1.
//
// Solidity: event CommunityPoolAddressUpdated(address indexed _newCommunityPoolAddress)
func (_ClaimsManager *ClaimsManagerFilterer) FilterCommunityPoolAddressUpdated(opts *bind.FilterOpts, _newCommunityPoolAddress []common.Address) (*ClaimsManagerCommunityPoolAddressUpdatedIterator, error) {

	var _newCommunityPoolAddressRule []interface{}
	for _, _newCommunityPoolAddressItem := range _newCommunityPoolAddress {
		_newCommunityPoolAddressRule = append(_newCommunityPoolAddressRule, _newCommunityPoolAddressItem)
	}

	logs, sub, err := _ClaimsManager.contract.FilterLogs(opts, "CommunityPoolAddressUpdated", _newCommunityPoolAddressRule)
	if err != nil {
		return nil, err
	}
	return &ClaimsManagerCommunityPoolAddressUpdatedIterator{contract: _ClaimsManager.contract, event: "CommunityPoolAddressUpdated", logs: logs, sub: sub}, nil
}

// WatchCommunityPoolAddressUpdated is a free log subscription operation binding the contract event 0xc5ca1722c22b0f252e610ced534cb4e638625687f2dce278c50154281fb064a1.
//
// Solidity: event CommunityPoolAddressUpdated(address indexed _newCommunityPoolAddress)
func (_ClaimsManager *ClaimsManagerFilterer) WatchCommunityPoolAddressUpdated(opts *bind.WatchOpts, sink chan<- *ClaimsManagerCommunityPoolAddressUpdated, _newCommunityPoolAddress []common.Address) (event.Subscription, error) {

	var _newCommunityPoolAddressRule []interface{}
	for _, _newCommunityPoolAddressItem := range _newCommunityPoolAddress {
		_newCommunityPoolAddressRule = append(_newCommunityPoolAddressRule, _newCommunityPoolAddressItem)
	}

	logs, sub, err := _ClaimsManager.contract.WatchLogs(opts, "CommunityPoolAddressUpdated", _newCommunityPoolAddressRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(ClaimsManagerCommunityPoolAddressUpdated)
				if err := _ClaimsManager.contract.UnpackLog(event, "CommunityPoolAddressUpdated", log); err != nil {
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

// ParseCommunityPoolAddressUpdated is a log parse operation binding the contract event 0xc5ca1722c22b0f252e610ced534cb4e638625687f2dce278c50154281fb064a1.
//
// Solidity: event CommunityPoolAddressUpdated(address indexed _newCommunityPoolAddress)
func (_ClaimsManager *ClaimsManagerFilterer) ParseCommunityPoolAddressUpdated(log types.Log) (*ClaimsManagerCommunityPoolAddressUpdated, error) {
	event := new(ClaimsManagerCommunityPoolAddressUpdated)
	if err := _ClaimsManager.contract.UnpackLog(event, "CommunityPoolAddressUpdated", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// ClaimsManagerCommunityRewardsTransferredIterator is returned from FilterCommunityRewardsTransferred and is used to iterate over the raw logs and unpacked data for CommunityRewardsTransferred events raised by the ClaimsManager contract.
type ClaimsManagerCommunityRewardsTransferredIterator struct {
	Event *ClaimsManagerCommunityRewardsTransferred // Event containing the contract specifics and raw log

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
func (it *ClaimsManagerCommunityRewardsTransferredIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(ClaimsManagerCommunityRewardsTransferred)
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
		it.Event = new(ClaimsManagerCommunityRewardsTransferred)
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
func (it *ClaimsManagerCommunityRewardsTransferredIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *ClaimsManagerCommunityRewardsTransferredIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// ClaimsManagerCommunityRewardsTransferred represents a CommunityRewardsTransferred event raised by the ClaimsManager contract.
type ClaimsManagerCommunityRewardsTransferred struct {
	TransferAddress common.Address
	Amount          *big.Int
	Raw             types.Log // Blockchain specific contextual infos
}

// FilterCommunityRewardsTransferred is a free log retrieval operation binding the contract event 0xce08e5ed436b159ce771e0bb9b9f9e6bfc01fed01422fe1461feecf4c3d15eb1.
//
// Solidity: event CommunityRewardsTransferred(address indexed _transferAddress, uint256 indexed _amount)
func (_ClaimsManager *ClaimsManagerFilterer) FilterCommunityRewardsTransferred(opts *bind.FilterOpts, _transferAddress []common.Address, _amount []*big.Int) (*ClaimsManagerCommunityRewardsTransferredIterator, error) {

	var _transferAddressRule []interface{}
	for _, _transferAddressItem := range _transferAddress {
		_transferAddressRule = append(_transferAddressRule, _transferAddressItem)
	}
	var _amountRule []interface{}
	for _, _amountItem := range _amount {
		_amountRule = append(_amountRule, _amountItem)
	}

	logs, sub, err := _ClaimsManager.contract.FilterLogs(opts, "CommunityRewardsTransferred", _transferAddressRule, _amountRule)
	if err != nil {
		return nil, err
	}
	return &ClaimsManagerCommunityRewardsTransferredIterator{contract: _ClaimsManager.contract, event: "CommunityRewardsTransferred", logs: logs, sub: sub}, nil
}

// WatchCommunityRewardsTransferred is a free log subscription operation binding the contract event 0xce08e5ed436b159ce771e0bb9b9f9e6bfc01fed01422fe1461feecf4c3d15eb1.
//
// Solidity: event CommunityRewardsTransferred(address indexed _transferAddress, uint256 indexed _amount)
func (_ClaimsManager *ClaimsManagerFilterer) WatchCommunityRewardsTransferred(opts *bind.WatchOpts, sink chan<- *ClaimsManagerCommunityRewardsTransferred, _transferAddress []common.Address, _amount []*big.Int) (event.Subscription, error) {

	var _transferAddressRule []interface{}
	for _, _transferAddressItem := range _transferAddress {
		_transferAddressRule = append(_transferAddressRule, _transferAddressItem)
	}
	var _amountRule []interface{}
	for _, _amountItem := range _amount {
		_amountRule = append(_amountRule, _amountItem)
	}

	logs, sub, err := _ClaimsManager.contract.WatchLogs(opts, "CommunityRewardsTransferred", _transferAddressRule, _amountRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(ClaimsManagerCommunityRewardsTransferred)
				if err := _ClaimsManager.contract.UnpackLog(event, "CommunityRewardsTransferred", log); err != nil {
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

// ParseCommunityRewardsTransferred is a log parse operation binding the contract event 0xce08e5ed436b159ce771e0bb9b9f9e6bfc01fed01422fe1461feecf4c3d15eb1.
//
// Solidity: event CommunityRewardsTransferred(address indexed _transferAddress, uint256 indexed _amount)
func (_ClaimsManager *ClaimsManagerFilterer) ParseCommunityRewardsTransferred(log types.Log) (*ClaimsManagerCommunityRewardsTransferred, error) {
	event := new(ClaimsManagerCommunityRewardsTransferred)
	if err := _ClaimsManager.contract.UnpackLog(event, "CommunityRewardsTransferred", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// ClaimsManagerDelegateManagerAddressUpdatedIterator is returned from FilterDelegateManagerAddressUpdated and is used to iterate over the raw logs and unpacked data for DelegateManagerAddressUpdated events raised by the ClaimsManager contract.
type ClaimsManagerDelegateManagerAddressUpdatedIterator struct {
	Event *ClaimsManagerDelegateManagerAddressUpdated // Event containing the contract specifics and raw log

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
func (it *ClaimsManagerDelegateManagerAddressUpdatedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(ClaimsManagerDelegateManagerAddressUpdated)
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
		it.Event = new(ClaimsManagerDelegateManagerAddressUpdated)
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
func (it *ClaimsManagerDelegateManagerAddressUpdatedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *ClaimsManagerDelegateManagerAddressUpdatedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// ClaimsManagerDelegateManagerAddressUpdated represents a DelegateManagerAddressUpdated event raised by the ClaimsManager contract.
type ClaimsManagerDelegateManagerAddressUpdated struct {
	NewDelegateManagerAddress common.Address
	Raw                       types.Log // Blockchain specific contextual infos
}

// FilterDelegateManagerAddressUpdated is a free log retrieval operation binding the contract event 0xc6f2f93d680d907c15617652a0861512922e68a2c4c4821732a8aa324ec541ea.
//
// Solidity: event DelegateManagerAddressUpdated(address indexed _newDelegateManagerAddress)
func (_ClaimsManager *ClaimsManagerFilterer) FilterDelegateManagerAddressUpdated(opts *bind.FilterOpts, _newDelegateManagerAddress []common.Address) (*ClaimsManagerDelegateManagerAddressUpdatedIterator, error) {

	var _newDelegateManagerAddressRule []interface{}
	for _, _newDelegateManagerAddressItem := range _newDelegateManagerAddress {
		_newDelegateManagerAddressRule = append(_newDelegateManagerAddressRule, _newDelegateManagerAddressItem)
	}

	logs, sub, err := _ClaimsManager.contract.FilterLogs(opts, "DelegateManagerAddressUpdated", _newDelegateManagerAddressRule)
	if err != nil {
		return nil, err
	}
	return &ClaimsManagerDelegateManagerAddressUpdatedIterator{contract: _ClaimsManager.contract, event: "DelegateManagerAddressUpdated", logs: logs, sub: sub}, nil
}

// WatchDelegateManagerAddressUpdated is a free log subscription operation binding the contract event 0xc6f2f93d680d907c15617652a0861512922e68a2c4c4821732a8aa324ec541ea.
//
// Solidity: event DelegateManagerAddressUpdated(address indexed _newDelegateManagerAddress)
func (_ClaimsManager *ClaimsManagerFilterer) WatchDelegateManagerAddressUpdated(opts *bind.WatchOpts, sink chan<- *ClaimsManagerDelegateManagerAddressUpdated, _newDelegateManagerAddress []common.Address) (event.Subscription, error) {

	var _newDelegateManagerAddressRule []interface{}
	for _, _newDelegateManagerAddressItem := range _newDelegateManagerAddress {
		_newDelegateManagerAddressRule = append(_newDelegateManagerAddressRule, _newDelegateManagerAddressItem)
	}

	logs, sub, err := _ClaimsManager.contract.WatchLogs(opts, "DelegateManagerAddressUpdated", _newDelegateManagerAddressRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(ClaimsManagerDelegateManagerAddressUpdated)
				if err := _ClaimsManager.contract.UnpackLog(event, "DelegateManagerAddressUpdated", log); err != nil {
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

// ParseDelegateManagerAddressUpdated is a log parse operation binding the contract event 0xc6f2f93d680d907c15617652a0861512922e68a2c4c4821732a8aa324ec541ea.
//
// Solidity: event DelegateManagerAddressUpdated(address indexed _newDelegateManagerAddress)
func (_ClaimsManager *ClaimsManagerFilterer) ParseDelegateManagerAddressUpdated(log types.Log) (*ClaimsManagerDelegateManagerAddressUpdated, error) {
	event := new(ClaimsManagerDelegateManagerAddressUpdated)
	if err := _ClaimsManager.contract.UnpackLog(event, "DelegateManagerAddressUpdated", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// ClaimsManagerFundingAmountUpdatedIterator is returned from FilterFundingAmountUpdated and is used to iterate over the raw logs and unpacked data for FundingAmountUpdated events raised by the ClaimsManager contract.
type ClaimsManagerFundingAmountUpdatedIterator struct {
	Event *ClaimsManagerFundingAmountUpdated // Event containing the contract specifics and raw log

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
func (it *ClaimsManagerFundingAmountUpdatedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(ClaimsManagerFundingAmountUpdated)
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
		it.Event = new(ClaimsManagerFundingAmountUpdated)
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
func (it *ClaimsManagerFundingAmountUpdatedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *ClaimsManagerFundingAmountUpdatedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// ClaimsManagerFundingAmountUpdated represents a FundingAmountUpdated event raised by the ClaimsManager contract.
type ClaimsManagerFundingAmountUpdated struct {
	Amount *big.Int
	Raw    types.Log // Blockchain specific contextual infos
}

// FilterFundingAmountUpdated is a free log retrieval operation binding the contract event 0x35f5c1f870f9b4f51737ef93b22b698a62ee1ad3a1b902cb5126f8bec48d551d.
//
// Solidity: event FundingAmountUpdated(uint256 indexed _amount)
func (_ClaimsManager *ClaimsManagerFilterer) FilterFundingAmountUpdated(opts *bind.FilterOpts, _amount []*big.Int) (*ClaimsManagerFundingAmountUpdatedIterator, error) {

	var _amountRule []interface{}
	for _, _amountItem := range _amount {
		_amountRule = append(_amountRule, _amountItem)
	}

	logs, sub, err := _ClaimsManager.contract.FilterLogs(opts, "FundingAmountUpdated", _amountRule)
	if err != nil {
		return nil, err
	}
	return &ClaimsManagerFundingAmountUpdatedIterator{contract: _ClaimsManager.contract, event: "FundingAmountUpdated", logs: logs, sub: sub}, nil
}

// WatchFundingAmountUpdated is a free log subscription operation binding the contract event 0x35f5c1f870f9b4f51737ef93b22b698a62ee1ad3a1b902cb5126f8bec48d551d.
//
// Solidity: event FundingAmountUpdated(uint256 indexed _amount)
func (_ClaimsManager *ClaimsManagerFilterer) WatchFundingAmountUpdated(opts *bind.WatchOpts, sink chan<- *ClaimsManagerFundingAmountUpdated, _amount []*big.Int) (event.Subscription, error) {

	var _amountRule []interface{}
	for _, _amountItem := range _amount {
		_amountRule = append(_amountRule, _amountItem)
	}

	logs, sub, err := _ClaimsManager.contract.WatchLogs(opts, "FundingAmountUpdated", _amountRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(ClaimsManagerFundingAmountUpdated)
				if err := _ClaimsManager.contract.UnpackLog(event, "FundingAmountUpdated", log); err != nil {
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

// ParseFundingAmountUpdated is a log parse operation binding the contract event 0x35f5c1f870f9b4f51737ef93b22b698a62ee1ad3a1b902cb5126f8bec48d551d.
//
// Solidity: event FundingAmountUpdated(uint256 indexed _amount)
func (_ClaimsManager *ClaimsManagerFilterer) ParseFundingAmountUpdated(log types.Log) (*ClaimsManagerFundingAmountUpdated, error) {
	event := new(ClaimsManagerFundingAmountUpdated)
	if err := _ClaimsManager.contract.UnpackLog(event, "FundingAmountUpdated", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// ClaimsManagerFundingRoundBlockDiffUpdatedIterator is returned from FilterFundingRoundBlockDiffUpdated and is used to iterate over the raw logs and unpacked data for FundingRoundBlockDiffUpdated events raised by the ClaimsManager contract.
type ClaimsManagerFundingRoundBlockDiffUpdatedIterator struct {
	Event *ClaimsManagerFundingRoundBlockDiffUpdated // Event containing the contract specifics and raw log

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
func (it *ClaimsManagerFundingRoundBlockDiffUpdatedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(ClaimsManagerFundingRoundBlockDiffUpdated)
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
		it.Event = new(ClaimsManagerFundingRoundBlockDiffUpdated)
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
func (it *ClaimsManagerFundingRoundBlockDiffUpdatedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *ClaimsManagerFundingRoundBlockDiffUpdatedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// ClaimsManagerFundingRoundBlockDiffUpdated represents a FundingRoundBlockDiffUpdated event raised by the ClaimsManager contract.
type ClaimsManagerFundingRoundBlockDiffUpdated struct {
	BlockDifference *big.Int
	Raw             types.Log // Blockchain specific contextual infos
}

// FilterFundingRoundBlockDiffUpdated is a free log retrieval operation binding the contract event 0xb232cc65f47f6afbf081c311f328ec4a698b72b5048af6fda8f11ba0c7557a21.
//
// Solidity: event FundingRoundBlockDiffUpdated(uint256 indexed _blockDifference)
func (_ClaimsManager *ClaimsManagerFilterer) FilterFundingRoundBlockDiffUpdated(opts *bind.FilterOpts, _blockDifference []*big.Int) (*ClaimsManagerFundingRoundBlockDiffUpdatedIterator, error) {

	var _blockDifferenceRule []interface{}
	for _, _blockDifferenceItem := range _blockDifference {
		_blockDifferenceRule = append(_blockDifferenceRule, _blockDifferenceItem)
	}

	logs, sub, err := _ClaimsManager.contract.FilterLogs(opts, "FundingRoundBlockDiffUpdated", _blockDifferenceRule)
	if err != nil {
		return nil, err
	}
	return &ClaimsManagerFundingRoundBlockDiffUpdatedIterator{contract: _ClaimsManager.contract, event: "FundingRoundBlockDiffUpdated", logs: logs, sub: sub}, nil
}

// WatchFundingRoundBlockDiffUpdated is a free log subscription operation binding the contract event 0xb232cc65f47f6afbf081c311f328ec4a698b72b5048af6fda8f11ba0c7557a21.
//
// Solidity: event FundingRoundBlockDiffUpdated(uint256 indexed _blockDifference)
func (_ClaimsManager *ClaimsManagerFilterer) WatchFundingRoundBlockDiffUpdated(opts *bind.WatchOpts, sink chan<- *ClaimsManagerFundingRoundBlockDiffUpdated, _blockDifference []*big.Int) (event.Subscription, error) {

	var _blockDifferenceRule []interface{}
	for _, _blockDifferenceItem := range _blockDifference {
		_blockDifferenceRule = append(_blockDifferenceRule, _blockDifferenceItem)
	}

	logs, sub, err := _ClaimsManager.contract.WatchLogs(opts, "FundingRoundBlockDiffUpdated", _blockDifferenceRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(ClaimsManagerFundingRoundBlockDiffUpdated)
				if err := _ClaimsManager.contract.UnpackLog(event, "FundingRoundBlockDiffUpdated", log); err != nil {
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

// ParseFundingRoundBlockDiffUpdated is a log parse operation binding the contract event 0xb232cc65f47f6afbf081c311f328ec4a698b72b5048af6fda8f11ba0c7557a21.
//
// Solidity: event FundingRoundBlockDiffUpdated(uint256 indexed _blockDifference)
func (_ClaimsManager *ClaimsManagerFilterer) ParseFundingRoundBlockDiffUpdated(log types.Log) (*ClaimsManagerFundingRoundBlockDiffUpdated, error) {
	event := new(ClaimsManagerFundingRoundBlockDiffUpdated)
	if err := _ClaimsManager.contract.UnpackLog(event, "FundingRoundBlockDiffUpdated", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// ClaimsManagerGovernanceAddressUpdatedIterator is returned from FilterGovernanceAddressUpdated and is used to iterate over the raw logs and unpacked data for GovernanceAddressUpdated events raised by the ClaimsManager contract.
type ClaimsManagerGovernanceAddressUpdatedIterator struct {
	Event *ClaimsManagerGovernanceAddressUpdated // Event containing the contract specifics and raw log

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
func (it *ClaimsManagerGovernanceAddressUpdatedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(ClaimsManagerGovernanceAddressUpdated)
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
		it.Event = new(ClaimsManagerGovernanceAddressUpdated)
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
func (it *ClaimsManagerGovernanceAddressUpdatedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *ClaimsManagerGovernanceAddressUpdatedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// ClaimsManagerGovernanceAddressUpdated represents a GovernanceAddressUpdated event raised by the ClaimsManager contract.
type ClaimsManagerGovernanceAddressUpdated struct {
	NewGovernanceAddress common.Address
	Raw                  types.Log // Blockchain specific contextual infos
}

// FilterGovernanceAddressUpdated is a free log retrieval operation binding the contract event 0xd0e77a42021adb46a85dc0dbcdd75417f2042ed5c51474cb43a25ce0f1049a1e.
//
// Solidity: event GovernanceAddressUpdated(address indexed _newGovernanceAddress)
func (_ClaimsManager *ClaimsManagerFilterer) FilterGovernanceAddressUpdated(opts *bind.FilterOpts, _newGovernanceAddress []common.Address) (*ClaimsManagerGovernanceAddressUpdatedIterator, error) {

	var _newGovernanceAddressRule []interface{}
	for _, _newGovernanceAddressItem := range _newGovernanceAddress {
		_newGovernanceAddressRule = append(_newGovernanceAddressRule, _newGovernanceAddressItem)
	}

	logs, sub, err := _ClaimsManager.contract.FilterLogs(opts, "GovernanceAddressUpdated", _newGovernanceAddressRule)
	if err != nil {
		return nil, err
	}
	return &ClaimsManagerGovernanceAddressUpdatedIterator{contract: _ClaimsManager.contract, event: "GovernanceAddressUpdated", logs: logs, sub: sub}, nil
}

// WatchGovernanceAddressUpdated is a free log subscription operation binding the contract event 0xd0e77a42021adb46a85dc0dbcdd75417f2042ed5c51474cb43a25ce0f1049a1e.
//
// Solidity: event GovernanceAddressUpdated(address indexed _newGovernanceAddress)
func (_ClaimsManager *ClaimsManagerFilterer) WatchGovernanceAddressUpdated(opts *bind.WatchOpts, sink chan<- *ClaimsManagerGovernanceAddressUpdated, _newGovernanceAddress []common.Address) (event.Subscription, error) {

	var _newGovernanceAddressRule []interface{}
	for _, _newGovernanceAddressItem := range _newGovernanceAddress {
		_newGovernanceAddressRule = append(_newGovernanceAddressRule, _newGovernanceAddressItem)
	}

	logs, sub, err := _ClaimsManager.contract.WatchLogs(opts, "GovernanceAddressUpdated", _newGovernanceAddressRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(ClaimsManagerGovernanceAddressUpdated)
				if err := _ClaimsManager.contract.UnpackLog(event, "GovernanceAddressUpdated", log); err != nil {
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

// ParseGovernanceAddressUpdated is a log parse operation binding the contract event 0xd0e77a42021adb46a85dc0dbcdd75417f2042ed5c51474cb43a25ce0f1049a1e.
//
// Solidity: event GovernanceAddressUpdated(address indexed _newGovernanceAddress)
func (_ClaimsManager *ClaimsManagerFilterer) ParseGovernanceAddressUpdated(log types.Log) (*ClaimsManagerGovernanceAddressUpdated, error) {
	event := new(ClaimsManagerGovernanceAddressUpdated)
	if err := _ClaimsManager.contract.UnpackLog(event, "GovernanceAddressUpdated", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// ClaimsManagerRecurringCommunityFundingAmountUpdatedIterator is returned from FilterRecurringCommunityFundingAmountUpdated and is used to iterate over the raw logs and unpacked data for RecurringCommunityFundingAmountUpdated events raised by the ClaimsManager contract.
type ClaimsManagerRecurringCommunityFundingAmountUpdatedIterator struct {
	Event *ClaimsManagerRecurringCommunityFundingAmountUpdated // Event containing the contract specifics and raw log

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
func (it *ClaimsManagerRecurringCommunityFundingAmountUpdatedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(ClaimsManagerRecurringCommunityFundingAmountUpdated)
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
		it.Event = new(ClaimsManagerRecurringCommunityFundingAmountUpdated)
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
func (it *ClaimsManagerRecurringCommunityFundingAmountUpdatedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *ClaimsManagerRecurringCommunityFundingAmountUpdatedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// ClaimsManagerRecurringCommunityFundingAmountUpdated represents a RecurringCommunityFundingAmountUpdated event raised by the ClaimsManager contract.
type ClaimsManagerRecurringCommunityFundingAmountUpdated struct {
	Amount *big.Int
	Raw    types.Log // Blockchain specific contextual infos
}

// FilterRecurringCommunityFundingAmountUpdated is a free log retrieval operation binding the contract event 0x8b2bf6a6ffc7c8ed425995eb7107a342bf51229917a1326a1c885f2b9d912327.
//
// Solidity: event RecurringCommunityFundingAmountUpdated(uint256 indexed _amount)
func (_ClaimsManager *ClaimsManagerFilterer) FilterRecurringCommunityFundingAmountUpdated(opts *bind.FilterOpts, _amount []*big.Int) (*ClaimsManagerRecurringCommunityFundingAmountUpdatedIterator, error) {

	var _amountRule []interface{}
	for _, _amountItem := range _amount {
		_amountRule = append(_amountRule, _amountItem)
	}

	logs, sub, err := _ClaimsManager.contract.FilterLogs(opts, "RecurringCommunityFundingAmountUpdated", _amountRule)
	if err != nil {
		return nil, err
	}
	return &ClaimsManagerRecurringCommunityFundingAmountUpdatedIterator{contract: _ClaimsManager.contract, event: "RecurringCommunityFundingAmountUpdated", logs: logs, sub: sub}, nil
}

// WatchRecurringCommunityFundingAmountUpdated is a free log subscription operation binding the contract event 0x8b2bf6a6ffc7c8ed425995eb7107a342bf51229917a1326a1c885f2b9d912327.
//
// Solidity: event RecurringCommunityFundingAmountUpdated(uint256 indexed _amount)
func (_ClaimsManager *ClaimsManagerFilterer) WatchRecurringCommunityFundingAmountUpdated(opts *bind.WatchOpts, sink chan<- *ClaimsManagerRecurringCommunityFundingAmountUpdated, _amount []*big.Int) (event.Subscription, error) {

	var _amountRule []interface{}
	for _, _amountItem := range _amount {
		_amountRule = append(_amountRule, _amountItem)
	}

	logs, sub, err := _ClaimsManager.contract.WatchLogs(opts, "RecurringCommunityFundingAmountUpdated", _amountRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(ClaimsManagerRecurringCommunityFundingAmountUpdated)
				if err := _ClaimsManager.contract.UnpackLog(event, "RecurringCommunityFundingAmountUpdated", log); err != nil {
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

// ParseRecurringCommunityFundingAmountUpdated is a log parse operation binding the contract event 0x8b2bf6a6ffc7c8ed425995eb7107a342bf51229917a1326a1c885f2b9d912327.
//
// Solidity: event RecurringCommunityFundingAmountUpdated(uint256 indexed _amount)
func (_ClaimsManager *ClaimsManagerFilterer) ParseRecurringCommunityFundingAmountUpdated(log types.Log) (*ClaimsManagerRecurringCommunityFundingAmountUpdated, error) {
	event := new(ClaimsManagerRecurringCommunityFundingAmountUpdated)
	if err := _ClaimsManager.contract.UnpackLog(event, "RecurringCommunityFundingAmountUpdated", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// ClaimsManagerRoundInitiatedIterator is returned from FilterRoundInitiated and is used to iterate over the raw logs and unpacked data for RoundInitiated events raised by the ClaimsManager contract.
type ClaimsManagerRoundInitiatedIterator struct {
	Event *ClaimsManagerRoundInitiated // Event containing the contract specifics and raw log

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
func (it *ClaimsManagerRoundInitiatedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(ClaimsManagerRoundInitiated)
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
		it.Event = new(ClaimsManagerRoundInitiated)
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
func (it *ClaimsManagerRoundInitiatedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *ClaimsManagerRoundInitiatedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// ClaimsManagerRoundInitiated represents a RoundInitiated event raised by the ClaimsManager contract.
type ClaimsManagerRoundInitiated struct {
	BlockNumber *big.Int
	RoundNumber *big.Int
	FundAmount  *big.Int
	Raw         types.Log // Blockchain specific contextual infos
}

// FilterRoundInitiated is a free log retrieval operation binding the contract event 0x50c871fcfd35cc7fec951a160fcf2767a7d9d81da9da506207ec65402a369c07.
//
// Solidity: event RoundInitiated(uint256 indexed _blockNumber, uint256 indexed _roundNumber, uint256 indexed _fundAmount)
func (_ClaimsManager *ClaimsManagerFilterer) FilterRoundInitiated(opts *bind.FilterOpts, _blockNumber []*big.Int, _roundNumber []*big.Int, _fundAmount []*big.Int) (*ClaimsManagerRoundInitiatedIterator, error) {

	var _blockNumberRule []interface{}
	for _, _blockNumberItem := range _blockNumber {
		_blockNumberRule = append(_blockNumberRule, _blockNumberItem)
	}
	var _roundNumberRule []interface{}
	for _, _roundNumberItem := range _roundNumber {
		_roundNumberRule = append(_roundNumberRule, _roundNumberItem)
	}
	var _fundAmountRule []interface{}
	for _, _fundAmountItem := range _fundAmount {
		_fundAmountRule = append(_fundAmountRule, _fundAmountItem)
	}

	logs, sub, err := _ClaimsManager.contract.FilterLogs(opts, "RoundInitiated", _blockNumberRule, _roundNumberRule, _fundAmountRule)
	if err != nil {
		return nil, err
	}
	return &ClaimsManagerRoundInitiatedIterator{contract: _ClaimsManager.contract, event: "RoundInitiated", logs: logs, sub: sub}, nil
}

// WatchRoundInitiated is a free log subscription operation binding the contract event 0x50c871fcfd35cc7fec951a160fcf2767a7d9d81da9da506207ec65402a369c07.
//
// Solidity: event RoundInitiated(uint256 indexed _blockNumber, uint256 indexed _roundNumber, uint256 indexed _fundAmount)
func (_ClaimsManager *ClaimsManagerFilterer) WatchRoundInitiated(opts *bind.WatchOpts, sink chan<- *ClaimsManagerRoundInitiated, _blockNumber []*big.Int, _roundNumber []*big.Int, _fundAmount []*big.Int) (event.Subscription, error) {

	var _blockNumberRule []interface{}
	for _, _blockNumberItem := range _blockNumber {
		_blockNumberRule = append(_blockNumberRule, _blockNumberItem)
	}
	var _roundNumberRule []interface{}
	for _, _roundNumberItem := range _roundNumber {
		_roundNumberRule = append(_roundNumberRule, _roundNumberItem)
	}
	var _fundAmountRule []interface{}
	for _, _fundAmountItem := range _fundAmount {
		_fundAmountRule = append(_fundAmountRule, _fundAmountItem)
	}

	logs, sub, err := _ClaimsManager.contract.WatchLogs(opts, "RoundInitiated", _blockNumberRule, _roundNumberRule, _fundAmountRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(ClaimsManagerRoundInitiated)
				if err := _ClaimsManager.contract.UnpackLog(event, "RoundInitiated", log); err != nil {
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

// ParseRoundInitiated is a log parse operation binding the contract event 0x50c871fcfd35cc7fec951a160fcf2767a7d9d81da9da506207ec65402a369c07.
//
// Solidity: event RoundInitiated(uint256 indexed _blockNumber, uint256 indexed _roundNumber, uint256 indexed _fundAmount)
func (_ClaimsManager *ClaimsManagerFilterer) ParseRoundInitiated(log types.Log) (*ClaimsManagerRoundInitiated, error) {
	event := new(ClaimsManagerRoundInitiated)
	if err := _ClaimsManager.contract.UnpackLog(event, "RoundInitiated", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// ClaimsManagerServiceProviderFactoryAddressUpdatedIterator is returned from FilterServiceProviderFactoryAddressUpdated and is used to iterate over the raw logs and unpacked data for ServiceProviderFactoryAddressUpdated events raised by the ClaimsManager contract.
type ClaimsManagerServiceProviderFactoryAddressUpdatedIterator struct {
	Event *ClaimsManagerServiceProviderFactoryAddressUpdated // Event containing the contract specifics and raw log

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
func (it *ClaimsManagerServiceProviderFactoryAddressUpdatedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(ClaimsManagerServiceProviderFactoryAddressUpdated)
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
		it.Event = new(ClaimsManagerServiceProviderFactoryAddressUpdated)
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
func (it *ClaimsManagerServiceProviderFactoryAddressUpdatedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *ClaimsManagerServiceProviderFactoryAddressUpdatedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// ClaimsManagerServiceProviderFactoryAddressUpdated represents a ServiceProviderFactoryAddressUpdated event raised by the ClaimsManager contract.
type ClaimsManagerServiceProviderFactoryAddressUpdated struct {
	NewServiceProviderFactoryAddress common.Address
	Raw                              types.Log // Blockchain specific contextual infos
}

// FilterServiceProviderFactoryAddressUpdated is a free log retrieval operation binding the contract event 0x373f84f0177a6c2e019f2e0e73c988359e56e111629a261c9bba5c968c383ed1.
//
// Solidity: event ServiceProviderFactoryAddressUpdated(address indexed _newServiceProviderFactoryAddress)
func (_ClaimsManager *ClaimsManagerFilterer) FilterServiceProviderFactoryAddressUpdated(opts *bind.FilterOpts, _newServiceProviderFactoryAddress []common.Address) (*ClaimsManagerServiceProviderFactoryAddressUpdatedIterator, error) {

	var _newServiceProviderFactoryAddressRule []interface{}
	for _, _newServiceProviderFactoryAddressItem := range _newServiceProviderFactoryAddress {
		_newServiceProviderFactoryAddressRule = append(_newServiceProviderFactoryAddressRule, _newServiceProviderFactoryAddressItem)
	}

	logs, sub, err := _ClaimsManager.contract.FilterLogs(opts, "ServiceProviderFactoryAddressUpdated", _newServiceProviderFactoryAddressRule)
	if err != nil {
		return nil, err
	}
	return &ClaimsManagerServiceProviderFactoryAddressUpdatedIterator{contract: _ClaimsManager.contract, event: "ServiceProviderFactoryAddressUpdated", logs: logs, sub: sub}, nil
}

// WatchServiceProviderFactoryAddressUpdated is a free log subscription operation binding the contract event 0x373f84f0177a6c2e019f2e0e73c988359e56e111629a261c9bba5c968c383ed1.
//
// Solidity: event ServiceProviderFactoryAddressUpdated(address indexed _newServiceProviderFactoryAddress)
func (_ClaimsManager *ClaimsManagerFilterer) WatchServiceProviderFactoryAddressUpdated(opts *bind.WatchOpts, sink chan<- *ClaimsManagerServiceProviderFactoryAddressUpdated, _newServiceProviderFactoryAddress []common.Address) (event.Subscription, error) {

	var _newServiceProviderFactoryAddressRule []interface{}
	for _, _newServiceProviderFactoryAddressItem := range _newServiceProviderFactoryAddress {
		_newServiceProviderFactoryAddressRule = append(_newServiceProviderFactoryAddressRule, _newServiceProviderFactoryAddressItem)
	}

	logs, sub, err := _ClaimsManager.contract.WatchLogs(opts, "ServiceProviderFactoryAddressUpdated", _newServiceProviderFactoryAddressRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(ClaimsManagerServiceProviderFactoryAddressUpdated)
				if err := _ClaimsManager.contract.UnpackLog(event, "ServiceProviderFactoryAddressUpdated", log); err != nil {
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

// ParseServiceProviderFactoryAddressUpdated is a log parse operation binding the contract event 0x373f84f0177a6c2e019f2e0e73c988359e56e111629a261c9bba5c968c383ed1.
//
// Solidity: event ServiceProviderFactoryAddressUpdated(address indexed _newServiceProviderFactoryAddress)
func (_ClaimsManager *ClaimsManagerFilterer) ParseServiceProviderFactoryAddressUpdated(log types.Log) (*ClaimsManagerServiceProviderFactoryAddressUpdated, error) {
	event := new(ClaimsManagerServiceProviderFactoryAddressUpdated)
	if err := _ClaimsManager.contract.UnpackLog(event, "ServiceProviderFactoryAddressUpdated", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// ClaimsManagerStakingAddressUpdatedIterator is returned from FilterStakingAddressUpdated and is used to iterate over the raw logs and unpacked data for StakingAddressUpdated events raised by the ClaimsManager contract.
type ClaimsManagerStakingAddressUpdatedIterator struct {
	Event *ClaimsManagerStakingAddressUpdated // Event containing the contract specifics and raw log

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
func (it *ClaimsManagerStakingAddressUpdatedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(ClaimsManagerStakingAddressUpdated)
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
		it.Event = new(ClaimsManagerStakingAddressUpdated)
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
func (it *ClaimsManagerStakingAddressUpdatedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *ClaimsManagerStakingAddressUpdatedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// ClaimsManagerStakingAddressUpdated represents a StakingAddressUpdated event raised by the ClaimsManager contract.
type ClaimsManagerStakingAddressUpdated struct {
	NewStakingAddress common.Address
	Raw               types.Log // Blockchain specific contextual infos
}

// FilterStakingAddressUpdated is a free log retrieval operation binding the contract event 0x8ae96d8af35324a34b19e4f33e72d620b502f69595bb43870ab5fd7a7de78239.
//
// Solidity: event StakingAddressUpdated(address indexed _newStakingAddress)
func (_ClaimsManager *ClaimsManagerFilterer) FilterStakingAddressUpdated(opts *bind.FilterOpts, _newStakingAddress []common.Address) (*ClaimsManagerStakingAddressUpdatedIterator, error) {

	var _newStakingAddressRule []interface{}
	for _, _newStakingAddressItem := range _newStakingAddress {
		_newStakingAddressRule = append(_newStakingAddressRule, _newStakingAddressItem)
	}

	logs, sub, err := _ClaimsManager.contract.FilterLogs(opts, "StakingAddressUpdated", _newStakingAddressRule)
	if err != nil {
		return nil, err
	}
	return &ClaimsManagerStakingAddressUpdatedIterator{contract: _ClaimsManager.contract, event: "StakingAddressUpdated", logs: logs, sub: sub}, nil
}

// WatchStakingAddressUpdated is a free log subscription operation binding the contract event 0x8ae96d8af35324a34b19e4f33e72d620b502f69595bb43870ab5fd7a7de78239.
//
// Solidity: event StakingAddressUpdated(address indexed _newStakingAddress)
func (_ClaimsManager *ClaimsManagerFilterer) WatchStakingAddressUpdated(opts *bind.WatchOpts, sink chan<- *ClaimsManagerStakingAddressUpdated, _newStakingAddress []common.Address) (event.Subscription, error) {

	var _newStakingAddressRule []interface{}
	for _, _newStakingAddressItem := range _newStakingAddress {
		_newStakingAddressRule = append(_newStakingAddressRule, _newStakingAddressItem)
	}

	logs, sub, err := _ClaimsManager.contract.WatchLogs(opts, "StakingAddressUpdated", _newStakingAddressRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(ClaimsManagerStakingAddressUpdated)
				if err := _ClaimsManager.contract.UnpackLog(event, "StakingAddressUpdated", log); err != nil {
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

// ParseStakingAddressUpdated is a log parse operation binding the contract event 0x8ae96d8af35324a34b19e4f33e72d620b502f69595bb43870ab5fd7a7de78239.
//
// Solidity: event StakingAddressUpdated(address indexed _newStakingAddress)
func (_ClaimsManager *ClaimsManagerFilterer) ParseStakingAddressUpdated(log types.Log) (*ClaimsManagerStakingAddressUpdated, error) {
	event := new(ClaimsManagerStakingAddressUpdated)
	if err := _ClaimsManager.contract.UnpackLog(event, "StakingAddressUpdated", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}
