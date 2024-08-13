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

// DelegateManagerV2MetaData contains all meta data concerning the DelegateManagerV2 contract.
var DelegateManagerV2MetaData = &bind.MetaData{
	ABI: "[{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"_claimer\",\"type\":\"address\"},{\"indexed\":true,\"internalType\":\"uint256\",\"name\":\"_rewards\",\"type\":\"uint256\"},{\"indexed\":true,\"internalType\":\"uint256\",\"name\":\"_newTotal\",\"type\":\"uint256\"}],\"name\":\"Claim\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"_newClaimsManagerAddress\",\"type\":\"address\"}],\"name\":\"ClaimsManagerAddressUpdated\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"_newGovernanceAddress\",\"type\":\"address\"}],\"name\":\"GovernanceAddressUpdated\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"_delegator\",\"type\":\"address\"},{\"indexed\":true,\"internalType\":\"address\",\"name\":\"_serviceProvider\",\"type\":\"address\"},{\"indexed\":true,\"internalType\":\"uint256\",\"name\":\"_increaseAmount\",\"type\":\"uint256\"}],\"name\":\"IncreaseDelegatedStake\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"uint256\",\"name\":\"_maxDelegators\",\"type\":\"uint256\"}],\"name\":\"MaxDelegatorsUpdated\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"uint256\",\"name\":\"_minDelegationAmount\",\"type\":\"uint256\"}],\"name\":\"MinDelegationUpdated\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"uint256\",\"name\":\"_removeDelegatorEvalDuration\",\"type\":\"uint256\"}],\"name\":\"RemoveDelegatorEvalDurationUpdated\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"uint256\",\"name\":\"_removeDelegatorLockupDuration\",\"type\":\"uint256\"}],\"name\":\"RemoveDelegatorLockupDurationUpdated\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"_serviceProvider\",\"type\":\"address\"},{\"indexed\":true,\"internalType\":\"address\",\"name\":\"_delegator\",\"type\":\"address\"}],\"name\":\"RemoveDelegatorRequestCancelled\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"_serviceProvider\",\"type\":\"address\"},{\"indexed\":true,\"internalType\":\"address\",\"name\":\"_delegator\",\"type\":\"address\"},{\"indexed\":true,\"internalType\":\"uint256\",\"name\":\"_unstakedAmount\",\"type\":\"uint256\"}],\"name\":\"RemoveDelegatorRequestEvaluated\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"_serviceProvider\",\"type\":\"address\"},{\"indexed\":true,\"internalType\":\"address\",\"name\":\"_delegator\",\"type\":\"address\"},{\"indexed\":true,\"internalType\":\"uint256\",\"name\":\"_lockupExpiryBlock\",\"type\":\"uint256\"}],\"name\":\"RemoveDelegatorRequested\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"_serviceProvider\",\"type\":\"address\"},{\"indexed\":true,\"internalType\":\"uint256\",\"name\":\"_spMinDelegationAmount\",\"type\":\"uint256\"}],\"name\":\"SPMinDelegationAmountUpdated\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"_newServiceProviderFactoryAddress\",\"type\":\"address\"}],\"name\":\"ServiceProviderFactoryAddressUpdated\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"_target\",\"type\":\"address\"},{\"indexed\":true,\"internalType\":\"uint256\",\"name\":\"_amount\",\"type\":\"uint256\"},{\"indexed\":true,\"internalType\":\"uint256\",\"name\":\"_newTotal\",\"type\":\"uint256\"}],\"name\":\"Slash\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"_newStakingAddress\",\"type\":\"address\"}],\"name\":\"StakingAddressUpdated\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"uint256\",\"name\":\"_undelegateLockupDuration\",\"type\":\"uint256\"}],\"name\":\"UndelegateLockupDurationUpdated\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"_delegator\",\"type\":\"address\"},{\"indexed\":true,\"internalType\":\"address\",\"name\":\"_serviceProvider\",\"type\":\"address\"},{\"indexed\":true,\"internalType\":\"uint256\",\"name\":\"_amount\",\"type\":\"uint256\"}],\"name\":\"UndelegateStakeRequestCancelled\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"_delegator\",\"type\":\"address\"},{\"indexed\":true,\"internalType\":\"address\",\"name\":\"_serviceProvider\",\"type\":\"address\"},{\"indexed\":true,\"internalType\":\"uint256\",\"name\":\"_amount\",\"type\":\"uint256\"}],\"name\":\"UndelegateStakeRequestEvaluated\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"_delegator\",\"type\":\"address\"},{\"indexed\":true,\"internalType\":\"address\",\"name\":\"_serviceProvider\",\"type\":\"address\"},{\"indexed\":true,\"internalType\":\"uint256\",\"name\":\"_amount\",\"type\":\"uint256\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"_lockupExpiryBlock\",\"type\":\"uint256\"}],\"name\":\"UndelegateStakeRequested\",\"type\":\"event\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"address\",\"name\":\"_tokenAddress\",\"type\":\"address\"},{\"internalType\":\"address\",\"name\":\"_governanceAddress\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"_undelegateLockupDuration\",\"type\":\"uint256\"}],\"name\":\"initialize\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[],\"name\":\"initialize\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"address\",\"name\":\"_targetSP\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"_amount\",\"type\":\"uint256\"}],\"name\":\"delegateStake\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"address\",\"name\":\"_target\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"_amount\",\"type\":\"uint256\"}],\"name\":\"requestUndelegateStake\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[],\"name\":\"cancelUndelegateStakeRequest\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[],\"name\":\"undelegateStake\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"address\",\"name\":\"_serviceProvider\",\"type\":\"address\"}],\"name\":\"claimRewards\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"_amount\",\"type\":\"uint256\"},{\"internalType\":\"address\",\"name\":\"_slashAddress\",\"type\":\"address\"}],\"name\":\"slash\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"address\",\"name\":\"_serviceProvider\",\"type\":\"address\"},{\"internalType\":\"address\",\"name\":\"_delegator\",\"type\":\"address\"}],\"name\":\"requestRemoveDelegator\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"address\",\"name\":\"_serviceProvider\",\"type\":\"address\"},{\"internalType\":\"address\",\"name\":\"_delegator\",\"type\":\"address\"}],\"name\":\"cancelRemoveDelegatorRequest\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"address\",\"name\":\"_serviceProvider\",\"type\":\"address\"},{\"internalType\":\"address\",\"name\":\"_delegator\",\"type\":\"address\"}],\"name\":\"removeDelegator\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"address\",\"name\":\"_serviceProvider\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"_spMinDelegationAmount\",\"type\":\"uint256\"}],\"name\":\"updateSPMinDelegationAmount\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"_duration\",\"type\":\"uint256\"}],\"name\":\"updateUndelegateLockupDuration\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"_maxDelegators\",\"type\":\"uint256\"}],\"name\":\"updateMaxDelegators\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"_minDelegationAmount\",\"type\":\"uint256\"}],\"name\":\"updateMinDelegationAmount\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"_duration\",\"type\":\"uint256\"}],\"name\":\"updateRemoveDelegatorLockupDuration\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"_duration\",\"type\":\"uint256\"}],\"name\":\"updateRemoveDelegatorEvalDuration\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"address\",\"name\":\"_governanceAddress\",\"type\":\"address\"}],\"name\":\"setGovernanceAddress\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"address\",\"name\":\"_stakingAddress\",\"type\":\"address\"}],\"name\":\"setStakingAddress\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"address\",\"name\":\"_spFactory\",\"type\":\"address\"}],\"name\":\"setServiceProviderFactoryAddress\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"address\",\"name\":\"_claimsManagerAddress\",\"type\":\"address\"}],\"name\":\"setClaimsManagerAddress\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[{\"internalType\":\"address\",\"name\":\"_sp\",\"type\":\"address\"}],\"name\":\"getDelegatorsList\",\"outputs\":[{\"internalType\":\"address[]\",\"name\":\"\",\"type\":\"address[]\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[{\"internalType\":\"address\",\"name\":\"_delegator\",\"type\":\"address\"}],\"name\":\"getTotalDelegatorStake\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[{\"internalType\":\"address\",\"name\":\"_sp\",\"type\":\"address\"}],\"name\":\"getTotalDelegatedToServiceProvider\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[{\"internalType\":\"address\",\"name\":\"_sp\",\"type\":\"address\"}],\"name\":\"getTotalLockedDelegationForServiceProvider\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[{\"internalType\":\"address\",\"name\":\"_delegator\",\"type\":\"address\"},{\"internalType\":\"address\",\"name\":\"_serviceProvider\",\"type\":\"address\"}],\"name\":\"getDelegatorStakeForServiceProvider\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[{\"internalType\":\"address\",\"name\":\"_delegator\",\"type\":\"address\"}],\"name\":\"getPendingUndelegateRequest\",\"outputs\":[{\"internalType\":\"address\",\"name\":\"target\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"amount\",\"type\":\"uint256\"},{\"internalType\":\"uint256\",\"name\":\"lockupExpiryBlock\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[{\"internalType\":\"address\",\"name\":\"_serviceProvider\",\"type\":\"address\"},{\"internalType\":\"address\",\"name\":\"_delegator\",\"type\":\"address\"}],\"name\":\"getPendingRemoveDelegatorRequest\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[{\"internalType\":\"address\",\"name\":\"_serviceProvider\",\"type\":\"address\"}],\"name\":\"getSPMinDelegationAmount\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"getUndelegateLockupDuration\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"getMaxDelegators\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"getMinDelegationAmount\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"getRemoveDelegatorLockupDuration\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"getRemoveDelegatorEvalDuration\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"getGovernanceAddress\",\"outputs\":[{\"internalType\":\"address\",\"name\":\"\",\"type\":\"address\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"getServiceProviderFactoryAddress\",\"outputs\":[{\"internalType\":\"address\",\"name\":\"\",\"type\":\"address\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"getClaimsManagerAddress\",\"outputs\":[{\"internalType\":\"address\",\"name\":\"\",\"type\":\"address\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"getStakingAddress\",\"outputs\":[{\"internalType\":\"address\",\"name\":\"\",\"type\":\"address\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"}]",
}

// DelegateManagerV2ABI is the input ABI used to generate the binding from.
// Deprecated: Use DelegateManagerV2MetaData.ABI instead.
var DelegateManagerV2ABI = DelegateManagerV2MetaData.ABI

// DelegateManagerV2 is an auto generated Go binding around an Ethereum contract.
type DelegateManagerV2 struct {
	DelegateManagerV2Caller     // Read-only binding to the contract
	DelegateManagerV2Transactor // Write-only binding to the contract
	DelegateManagerV2Filterer   // Log filterer for contract events
}

// DelegateManagerV2Caller is an auto generated read-only Go binding around an Ethereum contract.
type DelegateManagerV2Caller struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// DelegateManagerV2Transactor is an auto generated write-only Go binding around an Ethereum contract.
type DelegateManagerV2Transactor struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// DelegateManagerV2Filterer is an auto generated log filtering Go binding around an Ethereum contract events.
type DelegateManagerV2Filterer struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// DelegateManagerV2Session is an auto generated Go binding around an Ethereum contract,
// with pre-set call and transact options.
type DelegateManagerV2Session struct {
	Contract     *DelegateManagerV2 // Generic contract binding to set the session for
	CallOpts     bind.CallOpts      // Call options to use throughout this session
	TransactOpts bind.TransactOpts  // Transaction auth options to use throughout this session
}

// DelegateManagerV2CallerSession is an auto generated read-only Go binding around an Ethereum contract,
// with pre-set call options.
type DelegateManagerV2CallerSession struct {
	Contract *DelegateManagerV2Caller // Generic contract caller binding to set the session for
	CallOpts bind.CallOpts            // Call options to use throughout this session
}

// DelegateManagerV2TransactorSession is an auto generated write-only Go binding around an Ethereum contract,
// with pre-set transact options.
type DelegateManagerV2TransactorSession struct {
	Contract     *DelegateManagerV2Transactor // Generic contract transactor binding to set the session for
	TransactOpts bind.TransactOpts            // Transaction auth options to use throughout this session
}

// DelegateManagerV2Raw is an auto generated low-level Go binding around an Ethereum contract.
type DelegateManagerV2Raw struct {
	Contract *DelegateManagerV2 // Generic contract binding to access the raw methods on
}

// DelegateManagerV2CallerRaw is an auto generated low-level read-only Go binding around an Ethereum contract.
type DelegateManagerV2CallerRaw struct {
	Contract *DelegateManagerV2Caller // Generic read-only contract binding to access the raw methods on
}

// DelegateManagerV2TransactorRaw is an auto generated low-level write-only Go binding around an Ethereum contract.
type DelegateManagerV2TransactorRaw struct {
	Contract *DelegateManagerV2Transactor // Generic write-only contract binding to access the raw methods on
}

// NewDelegateManagerV2 creates a new instance of DelegateManagerV2, bound to a specific deployed contract.
func NewDelegateManagerV2(address common.Address, backend bind.ContractBackend) (*DelegateManagerV2, error) {
	contract, err := bindDelegateManagerV2(address, backend, backend, backend)
	if err != nil {
		return nil, err
	}
	return &DelegateManagerV2{DelegateManagerV2Caller: DelegateManagerV2Caller{contract: contract}, DelegateManagerV2Transactor: DelegateManagerV2Transactor{contract: contract}, DelegateManagerV2Filterer: DelegateManagerV2Filterer{contract: contract}}, nil
}

// NewDelegateManagerV2Caller creates a new read-only instance of DelegateManagerV2, bound to a specific deployed contract.
func NewDelegateManagerV2Caller(address common.Address, caller bind.ContractCaller) (*DelegateManagerV2Caller, error) {
	contract, err := bindDelegateManagerV2(address, caller, nil, nil)
	if err != nil {
		return nil, err
	}
	return &DelegateManagerV2Caller{contract: contract}, nil
}

// NewDelegateManagerV2Transactor creates a new write-only instance of DelegateManagerV2, bound to a specific deployed contract.
func NewDelegateManagerV2Transactor(address common.Address, transactor bind.ContractTransactor) (*DelegateManagerV2Transactor, error) {
	contract, err := bindDelegateManagerV2(address, nil, transactor, nil)
	if err != nil {
		return nil, err
	}
	return &DelegateManagerV2Transactor{contract: contract}, nil
}

// NewDelegateManagerV2Filterer creates a new log filterer instance of DelegateManagerV2, bound to a specific deployed contract.
func NewDelegateManagerV2Filterer(address common.Address, filterer bind.ContractFilterer) (*DelegateManagerV2Filterer, error) {
	contract, err := bindDelegateManagerV2(address, nil, nil, filterer)
	if err != nil {
		return nil, err
	}
	return &DelegateManagerV2Filterer{contract: contract}, nil
}

// bindDelegateManagerV2 binds a generic wrapper to an already deployed contract.
func bindDelegateManagerV2(address common.Address, caller bind.ContractCaller, transactor bind.ContractTransactor, filterer bind.ContractFilterer) (*bind.BoundContract, error) {
	parsed, err := DelegateManagerV2MetaData.GetAbi()
	if err != nil {
		return nil, err
	}
	return bind.NewBoundContract(address, *parsed, caller, transactor, filterer), nil
}

// Call invokes the (constant) contract method with params as input values and
// sets the output to result. The result type might be a single field for simple
// returns, a slice of interfaces for anonymous returns and a struct for named
// returns.
func (_DelegateManagerV2 *DelegateManagerV2Raw) Call(opts *bind.CallOpts, result *[]interface{}, method string, params ...interface{}) error {
	return _DelegateManagerV2.Contract.DelegateManagerV2Caller.contract.Call(opts, result, method, params...)
}

// Transfer initiates a plain transaction to move funds to the contract, calling
// its default method if one is available.
func (_DelegateManagerV2 *DelegateManagerV2Raw) Transfer(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _DelegateManagerV2.Contract.DelegateManagerV2Transactor.contract.Transfer(opts)
}

// Transact invokes the (paid) contract method with params as input values.
func (_DelegateManagerV2 *DelegateManagerV2Raw) Transact(opts *bind.TransactOpts, method string, params ...interface{}) (*types.Transaction, error) {
	return _DelegateManagerV2.Contract.DelegateManagerV2Transactor.contract.Transact(opts, method, params...)
}

// Call invokes the (constant) contract method with params as input values and
// sets the output to result. The result type might be a single field for simple
// returns, a slice of interfaces for anonymous returns and a struct for named
// returns.
func (_DelegateManagerV2 *DelegateManagerV2CallerRaw) Call(opts *bind.CallOpts, result *[]interface{}, method string, params ...interface{}) error {
	return _DelegateManagerV2.Contract.contract.Call(opts, result, method, params...)
}

// Transfer initiates a plain transaction to move funds to the contract, calling
// its default method if one is available.
func (_DelegateManagerV2 *DelegateManagerV2TransactorRaw) Transfer(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _DelegateManagerV2.Contract.contract.Transfer(opts)
}

// Transact invokes the (paid) contract method with params as input values.
func (_DelegateManagerV2 *DelegateManagerV2TransactorRaw) Transact(opts *bind.TransactOpts, method string, params ...interface{}) (*types.Transaction, error) {
	return _DelegateManagerV2.Contract.contract.Transact(opts, method, params...)
}

// GetClaimsManagerAddress is a free data retrieval call binding the contract method 0x948e5426.
//
// Solidity: function getClaimsManagerAddress() view returns(address)
func (_DelegateManagerV2 *DelegateManagerV2Caller) GetClaimsManagerAddress(opts *bind.CallOpts) (common.Address, error) {
	var out []interface{}
	err := _DelegateManagerV2.contract.Call(opts, &out, "getClaimsManagerAddress")

	if err != nil {
		return *new(common.Address), err
	}

	out0 := *abi.ConvertType(out[0], new(common.Address)).(*common.Address)

	return out0, err

}

// GetClaimsManagerAddress is a free data retrieval call binding the contract method 0x948e5426.
//
// Solidity: function getClaimsManagerAddress() view returns(address)
func (_DelegateManagerV2 *DelegateManagerV2Session) GetClaimsManagerAddress() (common.Address, error) {
	return _DelegateManagerV2.Contract.GetClaimsManagerAddress(&_DelegateManagerV2.CallOpts)
}

// GetClaimsManagerAddress is a free data retrieval call binding the contract method 0x948e5426.
//
// Solidity: function getClaimsManagerAddress() view returns(address)
func (_DelegateManagerV2 *DelegateManagerV2CallerSession) GetClaimsManagerAddress() (common.Address, error) {
	return _DelegateManagerV2.Contract.GetClaimsManagerAddress(&_DelegateManagerV2.CallOpts)
}

// GetDelegatorStakeForServiceProvider is a free data retrieval call binding the contract method 0xb9ca6067.
//
// Solidity: function getDelegatorStakeForServiceProvider(address _delegator, address _serviceProvider) view returns(uint256)
func (_DelegateManagerV2 *DelegateManagerV2Caller) GetDelegatorStakeForServiceProvider(opts *bind.CallOpts, _delegator common.Address, _serviceProvider common.Address) (*big.Int, error) {
	var out []interface{}
	err := _DelegateManagerV2.contract.Call(opts, &out, "getDelegatorStakeForServiceProvider", _delegator, _serviceProvider)

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

// GetDelegatorStakeForServiceProvider is a free data retrieval call binding the contract method 0xb9ca6067.
//
// Solidity: function getDelegatorStakeForServiceProvider(address _delegator, address _serviceProvider) view returns(uint256)
func (_DelegateManagerV2 *DelegateManagerV2Session) GetDelegatorStakeForServiceProvider(_delegator common.Address, _serviceProvider common.Address) (*big.Int, error) {
	return _DelegateManagerV2.Contract.GetDelegatorStakeForServiceProvider(&_DelegateManagerV2.CallOpts, _delegator, _serviceProvider)
}

// GetDelegatorStakeForServiceProvider is a free data retrieval call binding the contract method 0xb9ca6067.
//
// Solidity: function getDelegatorStakeForServiceProvider(address _delegator, address _serviceProvider) view returns(uint256)
func (_DelegateManagerV2 *DelegateManagerV2CallerSession) GetDelegatorStakeForServiceProvider(_delegator common.Address, _serviceProvider common.Address) (*big.Int, error) {
	return _DelegateManagerV2.Contract.GetDelegatorStakeForServiceProvider(&_DelegateManagerV2.CallOpts, _delegator, _serviceProvider)
}

// GetDelegatorsList is a free data retrieval call binding the contract method 0xfed3d1fd.
//
// Solidity: function getDelegatorsList(address _sp) view returns(address[])
func (_DelegateManagerV2 *DelegateManagerV2Caller) GetDelegatorsList(opts *bind.CallOpts, _sp common.Address) ([]common.Address, error) {
	var out []interface{}
	err := _DelegateManagerV2.contract.Call(opts, &out, "getDelegatorsList", _sp)

	if err != nil {
		return *new([]common.Address), err
	}

	out0 := *abi.ConvertType(out[0], new([]common.Address)).(*[]common.Address)

	return out0, err

}

// GetDelegatorsList is a free data retrieval call binding the contract method 0xfed3d1fd.
//
// Solidity: function getDelegatorsList(address _sp) view returns(address[])
func (_DelegateManagerV2 *DelegateManagerV2Session) GetDelegatorsList(_sp common.Address) ([]common.Address, error) {
	return _DelegateManagerV2.Contract.GetDelegatorsList(&_DelegateManagerV2.CallOpts, _sp)
}

// GetDelegatorsList is a free data retrieval call binding the contract method 0xfed3d1fd.
//
// Solidity: function getDelegatorsList(address _sp) view returns(address[])
func (_DelegateManagerV2 *DelegateManagerV2CallerSession) GetDelegatorsList(_sp common.Address) ([]common.Address, error) {
	return _DelegateManagerV2.Contract.GetDelegatorsList(&_DelegateManagerV2.CallOpts, _sp)
}

// GetGovernanceAddress is a free data retrieval call binding the contract method 0x73252494.
//
// Solidity: function getGovernanceAddress() view returns(address)
func (_DelegateManagerV2 *DelegateManagerV2Caller) GetGovernanceAddress(opts *bind.CallOpts) (common.Address, error) {
	var out []interface{}
	err := _DelegateManagerV2.contract.Call(opts, &out, "getGovernanceAddress")

	if err != nil {
		return *new(common.Address), err
	}

	out0 := *abi.ConvertType(out[0], new(common.Address)).(*common.Address)

	return out0, err

}

// GetGovernanceAddress is a free data retrieval call binding the contract method 0x73252494.
//
// Solidity: function getGovernanceAddress() view returns(address)
func (_DelegateManagerV2 *DelegateManagerV2Session) GetGovernanceAddress() (common.Address, error) {
	return _DelegateManagerV2.Contract.GetGovernanceAddress(&_DelegateManagerV2.CallOpts)
}

// GetGovernanceAddress is a free data retrieval call binding the contract method 0x73252494.
//
// Solidity: function getGovernanceAddress() view returns(address)
func (_DelegateManagerV2 *DelegateManagerV2CallerSession) GetGovernanceAddress() (common.Address, error) {
	return _DelegateManagerV2.Contract.GetGovernanceAddress(&_DelegateManagerV2.CallOpts)
}

// GetMaxDelegators is a free data retrieval call binding the contract method 0x15fe4070.
//
// Solidity: function getMaxDelegators() view returns(uint256)
func (_DelegateManagerV2 *DelegateManagerV2Caller) GetMaxDelegators(opts *bind.CallOpts) (*big.Int, error) {
	var out []interface{}
	err := _DelegateManagerV2.contract.Call(opts, &out, "getMaxDelegators")

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

// GetMaxDelegators is a free data retrieval call binding the contract method 0x15fe4070.
//
// Solidity: function getMaxDelegators() view returns(uint256)
func (_DelegateManagerV2 *DelegateManagerV2Session) GetMaxDelegators() (*big.Int, error) {
	return _DelegateManagerV2.Contract.GetMaxDelegators(&_DelegateManagerV2.CallOpts)
}

// GetMaxDelegators is a free data retrieval call binding the contract method 0x15fe4070.
//
// Solidity: function getMaxDelegators() view returns(uint256)
func (_DelegateManagerV2 *DelegateManagerV2CallerSession) GetMaxDelegators() (*big.Int, error) {
	return _DelegateManagerV2.Contract.GetMaxDelegators(&_DelegateManagerV2.CallOpts)
}

// GetMinDelegationAmount is a free data retrieval call binding the contract method 0xb11caba5.
//
// Solidity: function getMinDelegationAmount() view returns(uint256)
func (_DelegateManagerV2 *DelegateManagerV2Caller) GetMinDelegationAmount(opts *bind.CallOpts) (*big.Int, error) {
	var out []interface{}
	err := _DelegateManagerV2.contract.Call(opts, &out, "getMinDelegationAmount")

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

// GetMinDelegationAmount is a free data retrieval call binding the contract method 0xb11caba5.
//
// Solidity: function getMinDelegationAmount() view returns(uint256)
func (_DelegateManagerV2 *DelegateManagerV2Session) GetMinDelegationAmount() (*big.Int, error) {
	return _DelegateManagerV2.Contract.GetMinDelegationAmount(&_DelegateManagerV2.CallOpts)
}

// GetMinDelegationAmount is a free data retrieval call binding the contract method 0xb11caba5.
//
// Solidity: function getMinDelegationAmount() view returns(uint256)
func (_DelegateManagerV2 *DelegateManagerV2CallerSession) GetMinDelegationAmount() (*big.Int, error) {
	return _DelegateManagerV2.Contract.GetMinDelegationAmount(&_DelegateManagerV2.CallOpts)
}

// GetPendingRemoveDelegatorRequest is a free data retrieval call binding the contract method 0x4a551fe7.
//
// Solidity: function getPendingRemoveDelegatorRequest(address _serviceProvider, address _delegator) view returns(uint256)
func (_DelegateManagerV2 *DelegateManagerV2Caller) GetPendingRemoveDelegatorRequest(opts *bind.CallOpts, _serviceProvider common.Address, _delegator common.Address) (*big.Int, error) {
	var out []interface{}
	err := _DelegateManagerV2.contract.Call(opts, &out, "getPendingRemoveDelegatorRequest", _serviceProvider, _delegator)

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

// GetPendingRemoveDelegatorRequest is a free data retrieval call binding the contract method 0x4a551fe7.
//
// Solidity: function getPendingRemoveDelegatorRequest(address _serviceProvider, address _delegator) view returns(uint256)
func (_DelegateManagerV2 *DelegateManagerV2Session) GetPendingRemoveDelegatorRequest(_serviceProvider common.Address, _delegator common.Address) (*big.Int, error) {
	return _DelegateManagerV2.Contract.GetPendingRemoveDelegatorRequest(&_DelegateManagerV2.CallOpts, _serviceProvider, _delegator)
}

// GetPendingRemoveDelegatorRequest is a free data retrieval call binding the contract method 0x4a551fe7.
//
// Solidity: function getPendingRemoveDelegatorRequest(address _serviceProvider, address _delegator) view returns(uint256)
func (_DelegateManagerV2 *DelegateManagerV2CallerSession) GetPendingRemoveDelegatorRequest(_serviceProvider common.Address, _delegator common.Address) (*big.Int, error) {
	return _DelegateManagerV2.Contract.GetPendingRemoveDelegatorRequest(&_DelegateManagerV2.CallOpts, _serviceProvider, _delegator)
}

// GetPendingUndelegateRequest is a free data retrieval call binding the contract method 0x9336086f.
//
// Solidity: function getPendingUndelegateRequest(address _delegator) view returns(address target, uint256 amount, uint256 lockupExpiryBlock)
func (_DelegateManagerV2 *DelegateManagerV2Caller) GetPendingUndelegateRequest(opts *bind.CallOpts, _delegator common.Address) (struct {
	Target            common.Address
	Amount            *big.Int
	LockupExpiryBlock *big.Int
}, error) {
	var out []interface{}
	err := _DelegateManagerV2.contract.Call(opts, &out, "getPendingUndelegateRequest", _delegator)

	outstruct := new(struct {
		Target            common.Address
		Amount            *big.Int
		LockupExpiryBlock *big.Int
	})
	if err != nil {
		return *outstruct, err
	}

	outstruct.Target = *abi.ConvertType(out[0], new(common.Address)).(*common.Address)
	outstruct.Amount = *abi.ConvertType(out[1], new(*big.Int)).(**big.Int)
	outstruct.LockupExpiryBlock = *abi.ConvertType(out[2], new(*big.Int)).(**big.Int)

	return *outstruct, err

}

// GetPendingUndelegateRequest is a free data retrieval call binding the contract method 0x9336086f.
//
// Solidity: function getPendingUndelegateRequest(address _delegator) view returns(address target, uint256 amount, uint256 lockupExpiryBlock)
func (_DelegateManagerV2 *DelegateManagerV2Session) GetPendingUndelegateRequest(_delegator common.Address) (struct {
	Target            common.Address
	Amount            *big.Int
	LockupExpiryBlock *big.Int
}, error) {
	return _DelegateManagerV2.Contract.GetPendingUndelegateRequest(&_DelegateManagerV2.CallOpts, _delegator)
}

// GetPendingUndelegateRequest is a free data retrieval call binding the contract method 0x9336086f.
//
// Solidity: function getPendingUndelegateRequest(address _delegator) view returns(address target, uint256 amount, uint256 lockupExpiryBlock)
func (_DelegateManagerV2 *DelegateManagerV2CallerSession) GetPendingUndelegateRequest(_delegator common.Address) (struct {
	Target            common.Address
	Amount            *big.Int
	LockupExpiryBlock *big.Int
}, error) {
	return _DelegateManagerV2.Contract.GetPendingUndelegateRequest(&_DelegateManagerV2.CallOpts, _delegator)
}

// GetRemoveDelegatorEvalDuration is a free data retrieval call binding the contract method 0x9d974fb5.
//
// Solidity: function getRemoveDelegatorEvalDuration() view returns(uint256)
func (_DelegateManagerV2 *DelegateManagerV2Caller) GetRemoveDelegatorEvalDuration(opts *bind.CallOpts) (*big.Int, error) {
	var out []interface{}
	err := _DelegateManagerV2.contract.Call(opts, &out, "getRemoveDelegatorEvalDuration")

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

// GetRemoveDelegatorEvalDuration is a free data retrieval call binding the contract method 0x9d974fb5.
//
// Solidity: function getRemoveDelegatorEvalDuration() view returns(uint256)
func (_DelegateManagerV2 *DelegateManagerV2Session) GetRemoveDelegatorEvalDuration() (*big.Int, error) {
	return _DelegateManagerV2.Contract.GetRemoveDelegatorEvalDuration(&_DelegateManagerV2.CallOpts)
}

// GetRemoveDelegatorEvalDuration is a free data retrieval call binding the contract method 0x9d974fb5.
//
// Solidity: function getRemoveDelegatorEvalDuration() view returns(uint256)
func (_DelegateManagerV2 *DelegateManagerV2CallerSession) GetRemoveDelegatorEvalDuration() (*big.Int, error) {
	return _DelegateManagerV2.Contract.GetRemoveDelegatorEvalDuration(&_DelegateManagerV2.CallOpts)
}

// GetRemoveDelegatorLockupDuration is a free data retrieval call binding the contract method 0x82d51e2c.
//
// Solidity: function getRemoveDelegatorLockupDuration() view returns(uint256)
func (_DelegateManagerV2 *DelegateManagerV2Caller) GetRemoveDelegatorLockupDuration(opts *bind.CallOpts) (*big.Int, error) {
	var out []interface{}
	err := _DelegateManagerV2.contract.Call(opts, &out, "getRemoveDelegatorLockupDuration")

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

// GetRemoveDelegatorLockupDuration is a free data retrieval call binding the contract method 0x82d51e2c.
//
// Solidity: function getRemoveDelegatorLockupDuration() view returns(uint256)
func (_DelegateManagerV2 *DelegateManagerV2Session) GetRemoveDelegatorLockupDuration() (*big.Int, error) {
	return _DelegateManagerV2.Contract.GetRemoveDelegatorLockupDuration(&_DelegateManagerV2.CallOpts)
}

// GetRemoveDelegatorLockupDuration is a free data retrieval call binding the contract method 0x82d51e2c.
//
// Solidity: function getRemoveDelegatorLockupDuration() view returns(uint256)
func (_DelegateManagerV2 *DelegateManagerV2CallerSession) GetRemoveDelegatorLockupDuration() (*big.Int, error) {
	return _DelegateManagerV2.Contract.GetRemoveDelegatorLockupDuration(&_DelegateManagerV2.CallOpts)
}

// GetSPMinDelegationAmount is a free data retrieval call binding the contract method 0xca31b4b5.
//
// Solidity: function getSPMinDelegationAmount(address _serviceProvider) view returns(uint256)
func (_DelegateManagerV2 *DelegateManagerV2Caller) GetSPMinDelegationAmount(opts *bind.CallOpts, _serviceProvider common.Address) (*big.Int, error) {
	var out []interface{}
	err := _DelegateManagerV2.contract.Call(opts, &out, "getSPMinDelegationAmount", _serviceProvider)

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

// GetSPMinDelegationAmount is a free data retrieval call binding the contract method 0xca31b4b5.
//
// Solidity: function getSPMinDelegationAmount(address _serviceProvider) view returns(uint256)
func (_DelegateManagerV2 *DelegateManagerV2Session) GetSPMinDelegationAmount(_serviceProvider common.Address) (*big.Int, error) {
	return _DelegateManagerV2.Contract.GetSPMinDelegationAmount(&_DelegateManagerV2.CallOpts, _serviceProvider)
}

// GetSPMinDelegationAmount is a free data retrieval call binding the contract method 0xca31b4b5.
//
// Solidity: function getSPMinDelegationAmount(address _serviceProvider) view returns(uint256)
func (_DelegateManagerV2 *DelegateManagerV2CallerSession) GetSPMinDelegationAmount(_serviceProvider common.Address) (*big.Int, error) {
	return _DelegateManagerV2.Contract.GetSPMinDelegationAmount(&_DelegateManagerV2.CallOpts, _serviceProvider)
}

// GetServiceProviderFactoryAddress is a free data retrieval call binding the contract method 0x002ae74a.
//
// Solidity: function getServiceProviderFactoryAddress() view returns(address)
func (_DelegateManagerV2 *DelegateManagerV2Caller) GetServiceProviderFactoryAddress(opts *bind.CallOpts) (common.Address, error) {
	var out []interface{}
	err := _DelegateManagerV2.contract.Call(opts, &out, "getServiceProviderFactoryAddress")

	if err != nil {
		return *new(common.Address), err
	}

	out0 := *abi.ConvertType(out[0], new(common.Address)).(*common.Address)

	return out0, err

}

// GetServiceProviderFactoryAddress is a free data retrieval call binding the contract method 0x002ae74a.
//
// Solidity: function getServiceProviderFactoryAddress() view returns(address)
func (_DelegateManagerV2 *DelegateManagerV2Session) GetServiceProviderFactoryAddress() (common.Address, error) {
	return _DelegateManagerV2.Contract.GetServiceProviderFactoryAddress(&_DelegateManagerV2.CallOpts)
}

// GetServiceProviderFactoryAddress is a free data retrieval call binding the contract method 0x002ae74a.
//
// Solidity: function getServiceProviderFactoryAddress() view returns(address)
func (_DelegateManagerV2 *DelegateManagerV2CallerSession) GetServiceProviderFactoryAddress() (common.Address, error) {
	return _DelegateManagerV2.Contract.GetServiceProviderFactoryAddress(&_DelegateManagerV2.CallOpts)
}

// GetStakingAddress is a free data retrieval call binding the contract method 0x0e9ed68b.
//
// Solidity: function getStakingAddress() view returns(address)
func (_DelegateManagerV2 *DelegateManagerV2Caller) GetStakingAddress(opts *bind.CallOpts) (common.Address, error) {
	var out []interface{}
	err := _DelegateManagerV2.contract.Call(opts, &out, "getStakingAddress")

	if err != nil {
		return *new(common.Address), err
	}

	out0 := *abi.ConvertType(out[0], new(common.Address)).(*common.Address)

	return out0, err

}

// GetStakingAddress is a free data retrieval call binding the contract method 0x0e9ed68b.
//
// Solidity: function getStakingAddress() view returns(address)
func (_DelegateManagerV2 *DelegateManagerV2Session) GetStakingAddress() (common.Address, error) {
	return _DelegateManagerV2.Contract.GetStakingAddress(&_DelegateManagerV2.CallOpts)
}

// GetStakingAddress is a free data retrieval call binding the contract method 0x0e9ed68b.
//
// Solidity: function getStakingAddress() view returns(address)
func (_DelegateManagerV2 *DelegateManagerV2CallerSession) GetStakingAddress() (common.Address, error) {
	return _DelegateManagerV2.Contract.GetStakingAddress(&_DelegateManagerV2.CallOpts)
}

// GetTotalDelegatedToServiceProvider is a free data retrieval call binding the contract method 0x8504f188.
//
// Solidity: function getTotalDelegatedToServiceProvider(address _sp) view returns(uint256)
func (_DelegateManagerV2 *DelegateManagerV2Caller) GetTotalDelegatedToServiceProvider(opts *bind.CallOpts, _sp common.Address) (*big.Int, error) {
	var out []interface{}
	err := _DelegateManagerV2.contract.Call(opts, &out, "getTotalDelegatedToServiceProvider", _sp)

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

// GetTotalDelegatedToServiceProvider is a free data retrieval call binding the contract method 0x8504f188.
//
// Solidity: function getTotalDelegatedToServiceProvider(address _sp) view returns(uint256)
func (_DelegateManagerV2 *DelegateManagerV2Session) GetTotalDelegatedToServiceProvider(_sp common.Address) (*big.Int, error) {
	return _DelegateManagerV2.Contract.GetTotalDelegatedToServiceProvider(&_DelegateManagerV2.CallOpts, _sp)
}

// GetTotalDelegatedToServiceProvider is a free data retrieval call binding the contract method 0x8504f188.
//
// Solidity: function getTotalDelegatedToServiceProvider(address _sp) view returns(uint256)
func (_DelegateManagerV2 *DelegateManagerV2CallerSession) GetTotalDelegatedToServiceProvider(_sp common.Address) (*big.Int, error) {
	return _DelegateManagerV2.Contract.GetTotalDelegatedToServiceProvider(&_DelegateManagerV2.CallOpts, _sp)
}

// GetTotalDelegatorStake is a free data retrieval call binding the contract method 0xb0303b75.
//
// Solidity: function getTotalDelegatorStake(address _delegator) view returns(uint256)
func (_DelegateManagerV2 *DelegateManagerV2Caller) GetTotalDelegatorStake(opts *bind.CallOpts, _delegator common.Address) (*big.Int, error) {
	var out []interface{}
	err := _DelegateManagerV2.contract.Call(opts, &out, "getTotalDelegatorStake", _delegator)

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

// GetTotalDelegatorStake is a free data retrieval call binding the contract method 0xb0303b75.
//
// Solidity: function getTotalDelegatorStake(address _delegator) view returns(uint256)
func (_DelegateManagerV2 *DelegateManagerV2Session) GetTotalDelegatorStake(_delegator common.Address) (*big.Int, error) {
	return _DelegateManagerV2.Contract.GetTotalDelegatorStake(&_DelegateManagerV2.CallOpts, _delegator)
}

// GetTotalDelegatorStake is a free data retrieval call binding the contract method 0xb0303b75.
//
// Solidity: function getTotalDelegatorStake(address _delegator) view returns(uint256)
func (_DelegateManagerV2 *DelegateManagerV2CallerSession) GetTotalDelegatorStake(_delegator common.Address) (*big.Int, error) {
	return _DelegateManagerV2.Contract.GetTotalDelegatorStake(&_DelegateManagerV2.CallOpts, _delegator)
}

// GetTotalLockedDelegationForServiceProvider is a free data retrieval call binding the contract method 0x7dc1eeba.
//
// Solidity: function getTotalLockedDelegationForServiceProvider(address _sp) view returns(uint256)
func (_DelegateManagerV2 *DelegateManagerV2Caller) GetTotalLockedDelegationForServiceProvider(opts *bind.CallOpts, _sp common.Address) (*big.Int, error) {
	var out []interface{}
	err := _DelegateManagerV2.contract.Call(opts, &out, "getTotalLockedDelegationForServiceProvider", _sp)

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

// GetTotalLockedDelegationForServiceProvider is a free data retrieval call binding the contract method 0x7dc1eeba.
//
// Solidity: function getTotalLockedDelegationForServiceProvider(address _sp) view returns(uint256)
func (_DelegateManagerV2 *DelegateManagerV2Session) GetTotalLockedDelegationForServiceProvider(_sp common.Address) (*big.Int, error) {
	return _DelegateManagerV2.Contract.GetTotalLockedDelegationForServiceProvider(&_DelegateManagerV2.CallOpts, _sp)
}

// GetTotalLockedDelegationForServiceProvider is a free data retrieval call binding the contract method 0x7dc1eeba.
//
// Solidity: function getTotalLockedDelegationForServiceProvider(address _sp) view returns(uint256)
func (_DelegateManagerV2 *DelegateManagerV2CallerSession) GetTotalLockedDelegationForServiceProvider(_sp common.Address) (*big.Int, error) {
	return _DelegateManagerV2.Contract.GetTotalLockedDelegationForServiceProvider(&_DelegateManagerV2.CallOpts, _sp)
}

// GetUndelegateLockupDuration is a free data retrieval call binding the contract method 0x09a945a0.
//
// Solidity: function getUndelegateLockupDuration() view returns(uint256)
func (_DelegateManagerV2 *DelegateManagerV2Caller) GetUndelegateLockupDuration(opts *bind.CallOpts) (*big.Int, error) {
	var out []interface{}
	err := _DelegateManagerV2.contract.Call(opts, &out, "getUndelegateLockupDuration")

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

// GetUndelegateLockupDuration is a free data retrieval call binding the contract method 0x09a945a0.
//
// Solidity: function getUndelegateLockupDuration() view returns(uint256)
func (_DelegateManagerV2 *DelegateManagerV2Session) GetUndelegateLockupDuration() (*big.Int, error) {
	return _DelegateManagerV2.Contract.GetUndelegateLockupDuration(&_DelegateManagerV2.CallOpts)
}

// GetUndelegateLockupDuration is a free data retrieval call binding the contract method 0x09a945a0.
//
// Solidity: function getUndelegateLockupDuration() view returns(uint256)
func (_DelegateManagerV2 *DelegateManagerV2CallerSession) GetUndelegateLockupDuration() (*big.Int, error) {
	return _DelegateManagerV2.Contract.GetUndelegateLockupDuration(&_DelegateManagerV2.CallOpts)
}

// CancelRemoveDelegatorRequest is a paid mutator transaction binding the contract method 0x1d0f283a.
//
// Solidity: function cancelRemoveDelegatorRequest(address _serviceProvider, address _delegator) returns()
func (_DelegateManagerV2 *DelegateManagerV2Transactor) CancelRemoveDelegatorRequest(opts *bind.TransactOpts, _serviceProvider common.Address, _delegator common.Address) (*types.Transaction, error) {
	return _DelegateManagerV2.contract.Transact(opts, "cancelRemoveDelegatorRequest", _serviceProvider, _delegator)
}

// CancelRemoveDelegatorRequest is a paid mutator transaction binding the contract method 0x1d0f283a.
//
// Solidity: function cancelRemoveDelegatorRequest(address _serviceProvider, address _delegator) returns()
func (_DelegateManagerV2 *DelegateManagerV2Session) CancelRemoveDelegatorRequest(_serviceProvider common.Address, _delegator common.Address) (*types.Transaction, error) {
	return _DelegateManagerV2.Contract.CancelRemoveDelegatorRequest(&_DelegateManagerV2.TransactOpts, _serviceProvider, _delegator)
}

// CancelRemoveDelegatorRequest is a paid mutator transaction binding the contract method 0x1d0f283a.
//
// Solidity: function cancelRemoveDelegatorRequest(address _serviceProvider, address _delegator) returns()
func (_DelegateManagerV2 *DelegateManagerV2TransactorSession) CancelRemoveDelegatorRequest(_serviceProvider common.Address, _delegator common.Address) (*types.Transaction, error) {
	return _DelegateManagerV2.Contract.CancelRemoveDelegatorRequest(&_DelegateManagerV2.TransactOpts, _serviceProvider, _delegator)
}

// CancelUndelegateStakeRequest is a paid mutator transaction binding the contract method 0x6a53f10f.
//
// Solidity: function cancelUndelegateStakeRequest() returns()
func (_DelegateManagerV2 *DelegateManagerV2Transactor) CancelUndelegateStakeRequest(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _DelegateManagerV2.contract.Transact(opts, "cancelUndelegateStakeRequest")
}

// CancelUndelegateStakeRequest is a paid mutator transaction binding the contract method 0x6a53f10f.
//
// Solidity: function cancelUndelegateStakeRequest() returns()
func (_DelegateManagerV2 *DelegateManagerV2Session) CancelUndelegateStakeRequest() (*types.Transaction, error) {
	return _DelegateManagerV2.Contract.CancelUndelegateStakeRequest(&_DelegateManagerV2.TransactOpts)
}

// CancelUndelegateStakeRequest is a paid mutator transaction binding the contract method 0x6a53f10f.
//
// Solidity: function cancelUndelegateStakeRequest() returns()
func (_DelegateManagerV2 *DelegateManagerV2TransactorSession) CancelUndelegateStakeRequest() (*types.Transaction, error) {
	return _DelegateManagerV2.Contract.CancelUndelegateStakeRequest(&_DelegateManagerV2.TransactOpts)
}

// ClaimRewards is a paid mutator transaction binding the contract method 0xef5cfb8c.
//
// Solidity: function claimRewards(address _serviceProvider) returns()
func (_DelegateManagerV2 *DelegateManagerV2Transactor) ClaimRewards(opts *bind.TransactOpts, _serviceProvider common.Address) (*types.Transaction, error) {
	return _DelegateManagerV2.contract.Transact(opts, "claimRewards", _serviceProvider)
}

// ClaimRewards is a paid mutator transaction binding the contract method 0xef5cfb8c.
//
// Solidity: function claimRewards(address _serviceProvider) returns()
func (_DelegateManagerV2 *DelegateManagerV2Session) ClaimRewards(_serviceProvider common.Address) (*types.Transaction, error) {
	return _DelegateManagerV2.Contract.ClaimRewards(&_DelegateManagerV2.TransactOpts, _serviceProvider)
}

// ClaimRewards is a paid mutator transaction binding the contract method 0xef5cfb8c.
//
// Solidity: function claimRewards(address _serviceProvider) returns()
func (_DelegateManagerV2 *DelegateManagerV2TransactorSession) ClaimRewards(_serviceProvider common.Address) (*types.Transaction, error) {
	return _DelegateManagerV2.Contract.ClaimRewards(&_DelegateManagerV2.TransactOpts, _serviceProvider)
}

// DelegateStake is a paid mutator transaction binding the contract method 0x3c323a1b.
//
// Solidity: function delegateStake(address _targetSP, uint256 _amount) returns(uint256)
func (_DelegateManagerV2 *DelegateManagerV2Transactor) DelegateStake(opts *bind.TransactOpts, _targetSP common.Address, _amount *big.Int) (*types.Transaction, error) {
	return _DelegateManagerV2.contract.Transact(opts, "delegateStake", _targetSP, _amount)
}

// DelegateStake is a paid mutator transaction binding the contract method 0x3c323a1b.
//
// Solidity: function delegateStake(address _targetSP, uint256 _amount) returns(uint256)
func (_DelegateManagerV2 *DelegateManagerV2Session) DelegateStake(_targetSP common.Address, _amount *big.Int) (*types.Transaction, error) {
	return _DelegateManagerV2.Contract.DelegateStake(&_DelegateManagerV2.TransactOpts, _targetSP, _amount)
}

// DelegateStake is a paid mutator transaction binding the contract method 0x3c323a1b.
//
// Solidity: function delegateStake(address _targetSP, uint256 _amount) returns(uint256)
func (_DelegateManagerV2 *DelegateManagerV2TransactorSession) DelegateStake(_targetSP common.Address, _amount *big.Int) (*types.Transaction, error) {
	return _DelegateManagerV2.Contract.DelegateStake(&_DelegateManagerV2.TransactOpts, _targetSP, _amount)
}

// Initialize is a paid mutator transaction binding the contract method 0x1794bb3c.
//
// Solidity: function initialize(address _tokenAddress, address _governanceAddress, uint256 _undelegateLockupDuration) returns()
func (_DelegateManagerV2 *DelegateManagerV2Transactor) Initialize(opts *bind.TransactOpts, _tokenAddress common.Address, _governanceAddress common.Address, _undelegateLockupDuration *big.Int) (*types.Transaction, error) {
	return _DelegateManagerV2.contract.Transact(opts, "initialize", _tokenAddress, _governanceAddress, _undelegateLockupDuration)
}

// Initialize is a paid mutator transaction binding the contract method 0x1794bb3c.
//
// Solidity: function initialize(address _tokenAddress, address _governanceAddress, uint256 _undelegateLockupDuration) returns()
func (_DelegateManagerV2 *DelegateManagerV2Session) Initialize(_tokenAddress common.Address, _governanceAddress common.Address, _undelegateLockupDuration *big.Int) (*types.Transaction, error) {
	return _DelegateManagerV2.Contract.Initialize(&_DelegateManagerV2.TransactOpts, _tokenAddress, _governanceAddress, _undelegateLockupDuration)
}

// Initialize is a paid mutator transaction binding the contract method 0x1794bb3c.
//
// Solidity: function initialize(address _tokenAddress, address _governanceAddress, uint256 _undelegateLockupDuration) returns()
func (_DelegateManagerV2 *DelegateManagerV2TransactorSession) Initialize(_tokenAddress common.Address, _governanceAddress common.Address, _undelegateLockupDuration *big.Int) (*types.Transaction, error) {
	return _DelegateManagerV2.Contract.Initialize(&_DelegateManagerV2.TransactOpts, _tokenAddress, _governanceAddress, _undelegateLockupDuration)
}

// Initialize0 is a paid mutator transaction binding the contract method 0x8129fc1c.
//
// Solidity: function initialize() returns()
func (_DelegateManagerV2 *DelegateManagerV2Transactor) Initialize0(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _DelegateManagerV2.contract.Transact(opts, "initialize0")
}

// Initialize0 is a paid mutator transaction binding the contract method 0x8129fc1c.
//
// Solidity: function initialize() returns()
func (_DelegateManagerV2 *DelegateManagerV2Session) Initialize0() (*types.Transaction, error) {
	return _DelegateManagerV2.Contract.Initialize0(&_DelegateManagerV2.TransactOpts)
}

// Initialize0 is a paid mutator transaction binding the contract method 0x8129fc1c.
//
// Solidity: function initialize() returns()
func (_DelegateManagerV2 *DelegateManagerV2TransactorSession) Initialize0() (*types.Transaction, error) {
	return _DelegateManagerV2.Contract.Initialize0(&_DelegateManagerV2.TransactOpts)
}

// RemoveDelegator is a paid mutator transaction binding the contract method 0xe0d229ff.
//
// Solidity: function removeDelegator(address _serviceProvider, address _delegator) returns()
func (_DelegateManagerV2 *DelegateManagerV2Transactor) RemoveDelegator(opts *bind.TransactOpts, _serviceProvider common.Address, _delegator common.Address) (*types.Transaction, error) {
	return _DelegateManagerV2.contract.Transact(opts, "removeDelegator", _serviceProvider, _delegator)
}

// RemoveDelegator is a paid mutator transaction binding the contract method 0xe0d229ff.
//
// Solidity: function removeDelegator(address _serviceProvider, address _delegator) returns()
func (_DelegateManagerV2 *DelegateManagerV2Session) RemoveDelegator(_serviceProvider common.Address, _delegator common.Address) (*types.Transaction, error) {
	return _DelegateManagerV2.Contract.RemoveDelegator(&_DelegateManagerV2.TransactOpts, _serviceProvider, _delegator)
}

// RemoveDelegator is a paid mutator transaction binding the contract method 0xe0d229ff.
//
// Solidity: function removeDelegator(address _serviceProvider, address _delegator) returns()
func (_DelegateManagerV2 *DelegateManagerV2TransactorSession) RemoveDelegator(_serviceProvider common.Address, _delegator common.Address) (*types.Transaction, error) {
	return _DelegateManagerV2.Contract.RemoveDelegator(&_DelegateManagerV2.TransactOpts, _serviceProvider, _delegator)
}

// RequestRemoveDelegator is a paid mutator transaction binding the contract method 0x721e4221.
//
// Solidity: function requestRemoveDelegator(address _serviceProvider, address _delegator) returns()
func (_DelegateManagerV2 *DelegateManagerV2Transactor) RequestRemoveDelegator(opts *bind.TransactOpts, _serviceProvider common.Address, _delegator common.Address) (*types.Transaction, error) {
	return _DelegateManagerV2.contract.Transact(opts, "requestRemoveDelegator", _serviceProvider, _delegator)
}

// RequestRemoveDelegator is a paid mutator transaction binding the contract method 0x721e4221.
//
// Solidity: function requestRemoveDelegator(address _serviceProvider, address _delegator) returns()
func (_DelegateManagerV2 *DelegateManagerV2Session) RequestRemoveDelegator(_serviceProvider common.Address, _delegator common.Address) (*types.Transaction, error) {
	return _DelegateManagerV2.Contract.RequestRemoveDelegator(&_DelegateManagerV2.TransactOpts, _serviceProvider, _delegator)
}

// RequestRemoveDelegator is a paid mutator transaction binding the contract method 0x721e4221.
//
// Solidity: function requestRemoveDelegator(address _serviceProvider, address _delegator) returns()
func (_DelegateManagerV2 *DelegateManagerV2TransactorSession) RequestRemoveDelegator(_serviceProvider common.Address, _delegator common.Address) (*types.Transaction, error) {
	return _DelegateManagerV2.Contract.RequestRemoveDelegator(&_DelegateManagerV2.TransactOpts, _serviceProvider, _delegator)
}

// RequestUndelegateStake is a paid mutator transaction binding the contract method 0xa7bac487.
//
// Solidity: function requestUndelegateStake(address _target, uint256 _amount) returns(uint256)
func (_DelegateManagerV2 *DelegateManagerV2Transactor) RequestUndelegateStake(opts *bind.TransactOpts, _target common.Address, _amount *big.Int) (*types.Transaction, error) {
	return _DelegateManagerV2.contract.Transact(opts, "requestUndelegateStake", _target, _amount)
}

// RequestUndelegateStake is a paid mutator transaction binding the contract method 0xa7bac487.
//
// Solidity: function requestUndelegateStake(address _target, uint256 _amount) returns(uint256)
func (_DelegateManagerV2 *DelegateManagerV2Session) RequestUndelegateStake(_target common.Address, _amount *big.Int) (*types.Transaction, error) {
	return _DelegateManagerV2.Contract.RequestUndelegateStake(&_DelegateManagerV2.TransactOpts, _target, _amount)
}

// RequestUndelegateStake is a paid mutator transaction binding the contract method 0xa7bac487.
//
// Solidity: function requestUndelegateStake(address _target, uint256 _amount) returns(uint256)
func (_DelegateManagerV2 *DelegateManagerV2TransactorSession) RequestUndelegateStake(_target common.Address, _amount *big.Int) (*types.Transaction, error) {
	return _DelegateManagerV2.Contract.RequestUndelegateStake(&_DelegateManagerV2.TransactOpts, _target, _amount)
}

// SetClaimsManagerAddress is a paid mutator transaction binding the contract method 0xaa70d236.
//
// Solidity: function setClaimsManagerAddress(address _claimsManagerAddress) returns()
func (_DelegateManagerV2 *DelegateManagerV2Transactor) SetClaimsManagerAddress(opts *bind.TransactOpts, _claimsManagerAddress common.Address) (*types.Transaction, error) {
	return _DelegateManagerV2.contract.Transact(opts, "setClaimsManagerAddress", _claimsManagerAddress)
}

// SetClaimsManagerAddress is a paid mutator transaction binding the contract method 0xaa70d236.
//
// Solidity: function setClaimsManagerAddress(address _claimsManagerAddress) returns()
func (_DelegateManagerV2 *DelegateManagerV2Session) SetClaimsManagerAddress(_claimsManagerAddress common.Address) (*types.Transaction, error) {
	return _DelegateManagerV2.Contract.SetClaimsManagerAddress(&_DelegateManagerV2.TransactOpts, _claimsManagerAddress)
}

// SetClaimsManagerAddress is a paid mutator transaction binding the contract method 0xaa70d236.
//
// Solidity: function setClaimsManagerAddress(address _claimsManagerAddress) returns()
func (_DelegateManagerV2 *DelegateManagerV2TransactorSession) SetClaimsManagerAddress(_claimsManagerAddress common.Address) (*types.Transaction, error) {
	return _DelegateManagerV2.Contract.SetClaimsManagerAddress(&_DelegateManagerV2.TransactOpts, _claimsManagerAddress)
}

// SetGovernanceAddress is a paid mutator transaction binding the contract method 0xcfc16254.
//
// Solidity: function setGovernanceAddress(address _governanceAddress) returns()
func (_DelegateManagerV2 *DelegateManagerV2Transactor) SetGovernanceAddress(opts *bind.TransactOpts, _governanceAddress common.Address) (*types.Transaction, error) {
	return _DelegateManagerV2.contract.Transact(opts, "setGovernanceAddress", _governanceAddress)
}

// SetGovernanceAddress is a paid mutator transaction binding the contract method 0xcfc16254.
//
// Solidity: function setGovernanceAddress(address _governanceAddress) returns()
func (_DelegateManagerV2 *DelegateManagerV2Session) SetGovernanceAddress(_governanceAddress common.Address) (*types.Transaction, error) {
	return _DelegateManagerV2.Contract.SetGovernanceAddress(&_DelegateManagerV2.TransactOpts, _governanceAddress)
}

// SetGovernanceAddress is a paid mutator transaction binding the contract method 0xcfc16254.
//
// Solidity: function setGovernanceAddress(address _governanceAddress) returns()
func (_DelegateManagerV2 *DelegateManagerV2TransactorSession) SetGovernanceAddress(_governanceAddress common.Address) (*types.Transaction, error) {
	return _DelegateManagerV2.Contract.SetGovernanceAddress(&_DelegateManagerV2.TransactOpts, _governanceAddress)
}

// SetServiceProviderFactoryAddress is a paid mutator transaction binding the contract method 0x201ae9db.
//
// Solidity: function setServiceProviderFactoryAddress(address _spFactory) returns()
func (_DelegateManagerV2 *DelegateManagerV2Transactor) SetServiceProviderFactoryAddress(opts *bind.TransactOpts, _spFactory common.Address) (*types.Transaction, error) {
	return _DelegateManagerV2.contract.Transact(opts, "setServiceProviderFactoryAddress", _spFactory)
}

// SetServiceProviderFactoryAddress is a paid mutator transaction binding the contract method 0x201ae9db.
//
// Solidity: function setServiceProviderFactoryAddress(address _spFactory) returns()
func (_DelegateManagerV2 *DelegateManagerV2Session) SetServiceProviderFactoryAddress(_spFactory common.Address) (*types.Transaction, error) {
	return _DelegateManagerV2.Contract.SetServiceProviderFactoryAddress(&_DelegateManagerV2.TransactOpts, _spFactory)
}

// SetServiceProviderFactoryAddress is a paid mutator transaction binding the contract method 0x201ae9db.
//
// Solidity: function setServiceProviderFactoryAddress(address _spFactory) returns()
func (_DelegateManagerV2 *DelegateManagerV2TransactorSession) SetServiceProviderFactoryAddress(_spFactory common.Address) (*types.Transaction, error) {
	return _DelegateManagerV2.Contract.SetServiceProviderFactoryAddress(&_DelegateManagerV2.TransactOpts, _spFactory)
}

// SetStakingAddress is a paid mutator transaction binding the contract method 0xf4e0d9ac.
//
// Solidity: function setStakingAddress(address _stakingAddress) returns()
func (_DelegateManagerV2 *DelegateManagerV2Transactor) SetStakingAddress(opts *bind.TransactOpts, _stakingAddress common.Address) (*types.Transaction, error) {
	return _DelegateManagerV2.contract.Transact(opts, "setStakingAddress", _stakingAddress)
}

// SetStakingAddress is a paid mutator transaction binding the contract method 0xf4e0d9ac.
//
// Solidity: function setStakingAddress(address _stakingAddress) returns()
func (_DelegateManagerV2 *DelegateManagerV2Session) SetStakingAddress(_stakingAddress common.Address) (*types.Transaction, error) {
	return _DelegateManagerV2.Contract.SetStakingAddress(&_DelegateManagerV2.TransactOpts, _stakingAddress)
}

// SetStakingAddress is a paid mutator transaction binding the contract method 0xf4e0d9ac.
//
// Solidity: function setStakingAddress(address _stakingAddress) returns()
func (_DelegateManagerV2 *DelegateManagerV2TransactorSession) SetStakingAddress(_stakingAddress common.Address) (*types.Transaction, error) {
	return _DelegateManagerV2.Contract.SetStakingAddress(&_DelegateManagerV2.TransactOpts, _stakingAddress)
}

// Slash is a paid mutator transaction binding the contract method 0x3d82e3c1.
//
// Solidity: function slash(uint256 _amount, address _slashAddress) returns()
func (_DelegateManagerV2 *DelegateManagerV2Transactor) Slash(opts *bind.TransactOpts, _amount *big.Int, _slashAddress common.Address) (*types.Transaction, error) {
	return _DelegateManagerV2.contract.Transact(opts, "slash", _amount, _slashAddress)
}

// Slash is a paid mutator transaction binding the contract method 0x3d82e3c1.
//
// Solidity: function slash(uint256 _amount, address _slashAddress) returns()
func (_DelegateManagerV2 *DelegateManagerV2Session) Slash(_amount *big.Int, _slashAddress common.Address) (*types.Transaction, error) {
	return _DelegateManagerV2.Contract.Slash(&_DelegateManagerV2.TransactOpts, _amount, _slashAddress)
}

// Slash is a paid mutator transaction binding the contract method 0x3d82e3c1.
//
// Solidity: function slash(uint256 _amount, address _slashAddress) returns()
func (_DelegateManagerV2 *DelegateManagerV2TransactorSession) Slash(_amount *big.Int, _slashAddress common.Address) (*types.Transaction, error) {
	return _DelegateManagerV2.Contract.Slash(&_DelegateManagerV2.TransactOpts, _amount, _slashAddress)
}

// UndelegateStake is a paid mutator transaction binding the contract method 0xfeaf8048.
//
// Solidity: function undelegateStake() returns(uint256)
func (_DelegateManagerV2 *DelegateManagerV2Transactor) UndelegateStake(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _DelegateManagerV2.contract.Transact(opts, "undelegateStake")
}

// UndelegateStake is a paid mutator transaction binding the contract method 0xfeaf8048.
//
// Solidity: function undelegateStake() returns(uint256)
func (_DelegateManagerV2 *DelegateManagerV2Session) UndelegateStake() (*types.Transaction, error) {
	return _DelegateManagerV2.Contract.UndelegateStake(&_DelegateManagerV2.TransactOpts)
}

// UndelegateStake is a paid mutator transaction binding the contract method 0xfeaf8048.
//
// Solidity: function undelegateStake() returns(uint256)
func (_DelegateManagerV2 *DelegateManagerV2TransactorSession) UndelegateStake() (*types.Transaction, error) {
	return _DelegateManagerV2.Contract.UndelegateStake(&_DelegateManagerV2.TransactOpts)
}

// UpdateMaxDelegators is a paid mutator transaction binding the contract method 0x862c95b9.
//
// Solidity: function updateMaxDelegators(uint256 _maxDelegators) returns()
func (_DelegateManagerV2 *DelegateManagerV2Transactor) UpdateMaxDelegators(opts *bind.TransactOpts, _maxDelegators *big.Int) (*types.Transaction, error) {
	return _DelegateManagerV2.contract.Transact(opts, "updateMaxDelegators", _maxDelegators)
}

// UpdateMaxDelegators is a paid mutator transaction binding the contract method 0x862c95b9.
//
// Solidity: function updateMaxDelegators(uint256 _maxDelegators) returns()
func (_DelegateManagerV2 *DelegateManagerV2Session) UpdateMaxDelegators(_maxDelegators *big.Int) (*types.Transaction, error) {
	return _DelegateManagerV2.Contract.UpdateMaxDelegators(&_DelegateManagerV2.TransactOpts, _maxDelegators)
}

// UpdateMaxDelegators is a paid mutator transaction binding the contract method 0x862c95b9.
//
// Solidity: function updateMaxDelegators(uint256 _maxDelegators) returns()
func (_DelegateManagerV2 *DelegateManagerV2TransactorSession) UpdateMaxDelegators(_maxDelegators *big.Int) (*types.Transaction, error) {
	return _DelegateManagerV2.Contract.UpdateMaxDelegators(&_DelegateManagerV2.TransactOpts, _maxDelegators)
}

// UpdateMinDelegationAmount is a paid mutator transaction binding the contract method 0x5ad15ada.
//
// Solidity: function updateMinDelegationAmount(uint256 _minDelegationAmount) returns()
func (_DelegateManagerV2 *DelegateManagerV2Transactor) UpdateMinDelegationAmount(opts *bind.TransactOpts, _minDelegationAmount *big.Int) (*types.Transaction, error) {
	return _DelegateManagerV2.contract.Transact(opts, "updateMinDelegationAmount", _minDelegationAmount)
}

// UpdateMinDelegationAmount is a paid mutator transaction binding the contract method 0x5ad15ada.
//
// Solidity: function updateMinDelegationAmount(uint256 _minDelegationAmount) returns()
func (_DelegateManagerV2 *DelegateManagerV2Session) UpdateMinDelegationAmount(_minDelegationAmount *big.Int) (*types.Transaction, error) {
	return _DelegateManagerV2.Contract.UpdateMinDelegationAmount(&_DelegateManagerV2.TransactOpts, _minDelegationAmount)
}

// UpdateMinDelegationAmount is a paid mutator transaction binding the contract method 0x5ad15ada.
//
// Solidity: function updateMinDelegationAmount(uint256 _minDelegationAmount) returns()
func (_DelegateManagerV2 *DelegateManagerV2TransactorSession) UpdateMinDelegationAmount(_minDelegationAmount *big.Int) (*types.Transaction, error) {
	return _DelegateManagerV2.Contract.UpdateMinDelegationAmount(&_DelegateManagerV2.TransactOpts, _minDelegationAmount)
}

// UpdateRemoveDelegatorEvalDuration is a paid mutator transaction binding the contract method 0xb26df564.
//
// Solidity: function updateRemoveDelegatorEvalDuration(uint256 _duration) returns()
func (_DelegateManagerV2 *DelegateManagerV2Transactor) UpdateRemoveDelegatorEvalDuration(opts *bind.TransactOpts, _duration *big.Int) (*types.Transaction, error) {
	return _DelegateManagerV2.contract.Transact(opts, "updateRemoveDelegatorEvalDuration", _duration)
}

// UpdateRemoveDelegatorEvalDuration is a paid mutator transaction binding the contract method 0xb26df564.
//
// Solidity: function updateRemoveDelegatorEvalDuration(uint256 _duration) returns()
func (_DelegateManagerV2 *DelegateManagerV2Session) UpdateRemoveDelegatorEvalDuration(_duration *big.Int) (*types.Transaction, error) {
	return _DelegateManagerV2.Contract.UpdateRemoveDelegatorEvalDuration(&_DelegateManagerV2.TransactOpts, _duration)
}

// UpdateRemoveDelegatorEvalDuration is a paid mutator transaction binding the contract method 0xb26df564.
//
// Solidity: function updateRemoveDelegatorEvalDuration(uint256 _duration) returns()
func (_DelegateManagerV2 *DelegateManagerV2TransactorSession) UpdateRemoveDelegatorEvalDuration(_duration *big.Int) (*types.Transaction, error) {
	return _DelegateManagerV2.Contract.UpdateRemoveDelegatorEvalDuration(&_DelegateManagerV2.TransactOpts, _duration)
}

// UpdateRemoveDelegatorLockupDuration is a paid mutator transaction binding the contract method 0xf5c081ad.
//
// Solidity: function updateRemoveDelegatorLockupDuration(uint256 _duration) returns()
func (_DelegateManagerV2 *DelegateManagerV2Transactor) UpdateRemoveDelegatorLockupDuration(opts *bind.TransactOpts, _duration *big.Int) (*types.Transaction, error) {
	return _DelegateManagerV2.contract.Transact(opts, "updateRemoveDelegatorLockupDuration", _duration)
}

// UpdateRemoveDelegatorLockupDuration is a paid mutator transaction binding the contract method 0xf5c081ad.
//
// Solidity: function updateRemoveDelegatorLockupDuration(uint256 _duration) returns()
func (_DelegateManagerV2 *DelegateManagerV2Session) UpdateRemoveDelegatorLockupDuration(_duration *big.Int) (*types.Transaction, error) {
	return _DelegateManagerV2.Contract.UpdateRemoveDelegatorLockupDuration(&_DelegateManagerV2.TransactOpts, _duration)
}

// UpdateRemoveDelegatorLockupDuration is a paid mutator transaction binding the contract method 0xf5c081ad.
//
// Solidity: function updateRemoveDelegatorLockupDuration(uint256 _duration) returns()
func (_DelegateManagerV2 *DelegateManagerV2TransactorSession) UpdateRemoveDelegatorLockupDuration(_duration *big.Int) (*types.Transaction, error) {
	return _DelegateManagerV2.Contract.UpdateRemoveDelegatorLockupDuration(&_DelegateManagerV2.TransactOpts, _duration)
}

// UpdateSPMinDelegationAmount is a paid mutator transaction binding the contract method 0x68579837.
//
// Solidity: function updateSPMinDelegationAmount(address _serviceProvider, uint256 _spMinDelegationAmount) returns()
func (_DelegateManagerV2 *DelegateManagerV2Transactor) UpdateSPMinDelegationAmount(opts *bind.TransactOpts, _serviceProvider common.Address, _spMinDelegationAmount *big.Int) (*types.Transaction, error) {
	return _DelegateManagerV2.contract.Transact(opts, "updateSPMinDelegationAmount", _serviceProvider, _spMinDelegationAmount)
}

// UpdateSPMinDelegationAmount is a paid mutator transaction binding the contract method 0x68579837.
//
// Solidity: function updateSPMinDelegationAmount(address _serviceProvider, uint256 _spMinDelegationAmount) returns()
func (_DelegateManagerV2 *DelegateManagerV2Session) UpdateSPMinDelegationAmount(_serviceProvider common.Address, _spMinDelegationAmount *big.Int) (*types.Transaction, error) {
	return _DelegateManagerV2.Contract.UpdateSPMinDelegationAmount(&_DelegateManagerV2.TransactOpts, _serviceProvider, _spMinDelegationAmount)
}

// UpdateSPMinDelegationAmount is a paid mutator transaction binding the contract method 0x68579837.
//
// Solidity: function updateSPMinDelegationAmount(address _serviceProvider, uint256 _spMinDelegationAmount) returns()
func (_DelegateManagerV2 *DelegateManagerV2TransactorSession) UpdateSPMinDelegationAmount(_serviceProvider common.Address, _spMinDelegationAmount *big.Int) (*types.Transaction, error) {
	return _DelegateManagerV2.Contract.UpdateSPMinDelegationAmount(&_DelegateManagerV2.TransactOpts, _serviceProvider, _spMinDelegationAmount)
}

// UpdateUndelegateLockupDuration is a paid mutator transaction binding the contract method 0xe37e191c.
//
// Solidity: function updateUndelegateLockupDuration(uint256 _duration) returns()
func (_DelegateManagerV2 *DelegateManagerV2Transactor) UpdateUndelegateLockupDuration(opts *bind.TransactOpts, _duration *big.Int) (*types.Transaction, error) {
	return _DelegateManagerV2.contract.Transact(opts, "updateUndelegateLockupDuration", _duration)
}

// UpdateUndelegateLockupDuration is a paid mutator transaction binding the contract method 0xe37e191c.
//
// Solidity: function updateUndelegateLockupDuration(uint256 _duration) returns()
func (_DelegateManagerV2 *DelegateManagerV2Session) UpdateUndelegateLockupDuration(_duration *big.Int) (*types.Transaction, error) {
	return _DelegateManagerV2.Contract.UpdateUndelegateLockupDuration(&_DelegateManagerV2.TransactOpts, _duration)
}

// UpdateUndelegateLockupDuration is a paid mutator transaction binding the contract method 0xe37e191c.
//
// Solidity: function updateUndelegateLockupDuration(uint256 _duration) returns()
func (_DelegateManagerV2 *DelegateManagerV2TransactorSession) UpdateUndelegateLockupDuration(_duration *big.Int) (*types.Transaction, error) {
	return _DelegateManagerV2.Contract.UpdateUndelegateLockupDuration(&_DelegateManagerV2.TransactOpts, _duration)
}

// DelegateManagerV2ClaimIterator is returned from FilterClaim and is used to iterate over the raw logs and unpacked data for Claim events raised by the DelegateManagerV2 contract.
type DelegateManagerV2ClaimIterator struct {
	Event *DelegateManagerV2Claim // Event containing the contract specifics and raw log

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
func (it *DelegateManagerV2ClaimIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(DelegateManagerV2Claim)
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
		it.Event = new(DelegateManagerV2Claim)
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
func (it *DelegateManagerV2ClaimIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *DelegateManagerV2ClaimIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// DelegateManagerV2Claim represents a Claim event raised by the DelegateManagerV2 contract.
type DelegateManagerV2Claim struct {
	Claimer  common.Address
	Rewards  *big.Int
	NewTotal *big.Int
	Raw      types.Log // Blockchain specific contextual infos
}

// FilterClaim is a free log retrieval operation binding the contract event 0x34fcbac0073d7c3d388e51312faf357774904998eeb8fca628b9e6f65ee1cbf7.
//
// Solidity: event Claim(address indexed _claimer, uint256 indexed _rewards, uint256 indexed _newTotal)
func (_DelegateManagerV2 *DelegateManagerV2Filterer) FilterClaim(opts *bind.FilterOpts, _claimer []common.Address, _rewards []*big.Int, _newTotal []*big.Int) (*DelegateManagerV2ClaimIterator, error) {

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

	logs, sub, err := _DelegateManagerV2.contract.FilterLogs(opts, "Claim", _claimerRule, _rewardsRule, _newTotalRule)
	if err != nil {
		return nil, err
	}
	return &DelegateManagerV2ClaimIterator{contract: _DelegateManagerV2.contract, event: "Claim", logs: logs, sub: sub}, nil
}

// WatchClaim is a free log subscription operation binding the contract event 0x34fcbac0073d7c3d388e51312faf357774904998eeb8fca628b9e6f65ee1cbf7.
//
// Solidity: event Claim(address indexed _claimer, uint256 indexed _rewards, uint256 indexed _newTotal)
func (_DelegateManagerV2 *DelegateManagerV2Filterer) WatchClaim(opts *bind.WatchOpts, sink chan<- *DelegateManagerV2Claim, _claimer []common.Address, _rewards []*big.Int, _newTotal []*big.Int) (event.Subscription, error) {

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

	logs, sub, err := _DelegateManagerV2.contract.WatchLogs(opts, "Claim", _claimerRule, _rewardsRule, _newTotalRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(DelegateManagerV2Claim)
				if err := _DelegateManagerV2.contract.UnpackLog(event, "Claim", log); err != nil {
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

// ParseClaim is a log parse operation binding the contract event 0x34fcbac0073d7c3d388e51312faf357774904998eeb8fca628b9e6f65ee1cbf7.
//
// Solidity: event Claim(address indexed _claimer, uint256 indexed _rewards, uint256 indexed _newTotal)
func (_DelegateManagerV2 *DelegateManagerV2Filterer) ParseClaim(log types.Log) (*DelegateManagerV2Claim, error) {
	event := new(DelegateManagerV2Claim)
	if err := _DelegateManagerV2.contract.UnpackLog(event, "Claim", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// DelegateManagerV2ClaimsManagerAddressUpdatedIterator is returned from FilterClaimsManagerAddressUpdated and is used to iterate over the raw logs and unpacked data for ClaimsManagerAddressUpdated events raised by the DelegateManagerV2 contract.
type DelegateManagerV2ClaimsManagerAddressUpdatedIterator struct {
	Event *DelegateManagerV2ClaimsManagerAddressUpdated // Event containing the contract specifics and raw log

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
func (it *DelegateManagerV2ClaimsManagerAddressUpdatedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(DelegateManagerV2ClaimsManagerAddressUpdated)
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
		it.Event = new(DelegateManagerV2ClaimsManagerAddressUpdated)
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
func (it *DelegateManagerV2ClaimsManagerAddressUpdatedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *DelegateManagerV2ClaimsManagerAddressUpdatedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// DelegateManagerV2ClaimsManagerAddressUpdated represents a ClaimsManagerAddressUpdated event raised by the DelegateManagerV2 contract.
type DelegateManagerV2ClaimsManagerAddressUpdated struct {
	NewClaimsManagerAddress common.Address
	Raw                     types.Log // Blockchain specific contextual infos
}

// FilterClaimsManagerAddressUpdated is a free log retrieval operation binding the contract event 0x3b3679838ffd21f454712cf443ab98f11d36d5552da016314c5cbe364a10c243.
//
// Solidity: event ClaimsManagerAddressUpdated(address indexed _newClaimsManagerAddress)
func (_DelegateManagerV2 *DelegateManagerV2Filterer) FilterClaimsManagerAddressUpdated(opts *bind.FilterOpts, _newClaimsManagerAddress []common.Address) (*DelegateManagerV2ClaimsManagerAddressUpdatedIterator, error) {

	var _newClaimsManagerAddressRule []interface{}
	for _, _newClaimsManagerAddressItem := range _newClaimsManagerAddress {
		_newClaimsManagerAddressRule = append(_newClaimsManagerAddressRule, _newClaimsManagerAddressItem)
	}

	logs, sub, err := _DelegateManagerV2.contract.FilterLogs(opts, "ClaimsManagerAddressUpdated", _newClaimsManagerAddressRule)
	if err != nil {
		return nil, err
	}
	return &DelegateManagerV2ClaimsManagerAddressUpdatedIterator{contract: _DelegateManagerV2.contract, event: "ClaimsManagerAddressUpdated", logs: logs, sub: sub}, nil
}

// WatchClaimsManagerAddressUpdated is a free log subscription operation binding the contract event 0x3b3679838ffd21f454712cf443ab98f11d36d5552da016314c5cbe364a10c243.
//
// Solidity: event ClaimsManagerAddressUpdated(address indexed _newClaimsManagerAddress)
func (_DelegateManagerV2 *DelegateManagerV2Filterer) WatchClaimsManagerAddressUpdated(opts *bind.WatchOpts, sink chan<- *DelegateManagerV2ClaimsManagerAddressUpdated, _newClaimsManagerAddress []common.Address) (event.Subscription, error) {

	var _newClaimsManagerAddressRule []interface{}
	for _, _newClaimsManagerAddressItem := range _newClaimsManagerAddress {
		_newClaimsManagerAddressRule = append(_newClaimsManagerAddressRule, _newClaimsManagerAddressItem)
	}

	logs, sub, err := _DelegateManagerV2.contract.WatchLogs(opts, "ClaimsManagerAddressUpdated", _newClaimsManagerAddressRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(DelegateManagerV2ClaimsManagerAddressUpdated)
				if err := _DelegateManagerV2.contract.UnpackLog(event, "ClaimsManagerAddressUpdated", log); err != nil {
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

// ParseClaimsManagerAddressUpdated is a log parse operation binding the contract event 0x3b3679838ffd21f454712cf443ab98f11d36d5552da016314c5cbe364a10c243.
//
// Solidity: event ClaimsManagerAddressUpdated(address indexed _newClaimsManagerAddress)
func (_DelegateManagerV2 *DelegateManagerV2Filterer) ParseClaimsManagerAddressUpdated(log types.Log) (*DelegateManagerV2ClaimsManagerAddressUpdated, error) {
	event := new(DelegateManagerV2ClaimsManagerAddressUpdated)
	if err := _DelegateManagerV2.contract.UnpackLog(event, "ClaimsManagerAddressUpdated", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// DelegateManagerV2GovernanceAddressUpdatedIterator is returned from FilterGovernanceAddressUpdated and is used to iterate over the raw logs and unpacked data for GovernanceAddressUpdated events raised by the DelegateManagerV2 contract.
type DelegateManagerV2GovernanceAddressUpdatedIterator struct {
	Event *DelegateManagerV2GovernanceAddressUpdated // Event containing the contract specifics and raw log

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
func (it *DelegateManagerV2GovernanceAddressUpdatedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(DelegateManagerV2GovernanceAddressUpdated)
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
		it.Event = new(DelegateManagerV2GovernanceAddressUpdated)
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
func (it *DelegateManagerV2GovernanceAddressUpdatedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *DelegateManagerV2GovernanceAddressUpdatedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// DelegateManagerV2GovernanceAddressUpdated represents a GovernanceAddressUpdated event raised by the DelegateManagerV2 contract.
type DelegateManagerV2GovernanceAddressUpdated struct {
	NewGovernanceAddress common.Address
	Raw                  types.Log // Blockchain specific contextual infos
}

// FilterGovernanceAddressUpdated is a free log retrieval operation binding the contract event 0xd0e77a42021adb46a85dc0dbcdd75417f2042ed5c51474cb43a25ce0f1049a1e.
//
// Solidity: event GovernanceAddressUpdated(address indexed _newGovernanceAddress)
func (_DelegateManagerV2 *DelegateManagerV2Filterer) FilterGovernanceAddressUpdated(opts *bind.FilterOpts, _newGovernanceAddress []common.Address) (*DelegateManagerV2GovernanceAddressUpdatedIterator, error) {

	var _newGovernanceAddressRule []interface{}
	for _, _newGovernanceAddressItem := range _newGovernanceAddress {
		_newGovernanceAddressRule = append(_newGovernanceAddressRule, _newGovernanceAddressItem)
	}

	logs, sub, err := _DelegateManagerV2.contract.FilterLogs(opts, "GovernanceAddressUpdated", _newGovernanceAddressRule)
	if err != nil {
		return nil, err
	}
	return &DelegateManagerV2GovernanceAddressUpdatedIterator{contract: _DelegateManagerV2.contract, event: "GovernanceAddressUpdated", logs: logs, sub: sub}, nil
}

// WatchGovernanceAddressUpdated is a free log subscription operation binding the contract event 0xd0e77a42021adb46a85dc0dbcdd75417f2042ed5c51474cb43a25ce0f1049a1e.
//
// Solidity: event GovernanceAddressUpdated(address indexed _newGovernanceAddress)
func (_DelegateManagerV2 *DelegateManagerV2Filterer) WatchGovernanceAddressUpdated(opts *bind.WatchOpts, sink chan<- *DelegateManagerV2GovernanceAddressUpdated, _newGovernanceAddress []common.Address) (event.Subscription, error) {

	var _newGovernanceAddressRule []interface{}
	for _, _newGovernanceAddressItem := range _newGovernanceAddress {
		_newGovernanceAddressRule = append(_newGovernanceAddressRule, _newGovernanceAddressItem)
	}

	logs, sub, err := _DelegateManagerV2.contract.WatchLogs(opts, "GovernanceAddressUpdated", _newGovernanceAddressRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(DelegateManagerV2GovernanceAddressUpdated)
				if err := _DelegateManagerV2.contract.UnpackLog(event, "GovernanceAddressUpdated", log); err != nil {
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
func (_DelegateManagerV2 *DelegateManagerV2Filterer) ParseGovernanceAddressUpdated(log types.Log) (*DelegateManagerV2GovernanceAddressUpdated, error) {
	event := new(DelegateManagerV2GovernanceAddressUpdated)
	if err := _DelegateManagerV2.contract.UnpackLog(event, "GovernanceAddressUpdated", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// DelegateManagerV2IncreaseDelegatedStakeIterator is returned from FilterIncreaseDelegatedStake and is used to iterate over the raw logs and unpacked data for IncreaseDelegatedStake events raised by the DelegateManagerV2 contract.
type DelegateManagerV2IncreaseDelegatedStakeIterator struct {
	Event *DelegateManagerV2IncreaseDelegatedStake // Event containing the contract specifics and raw log

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
func (it *DelegateManagerV2IncreaseDelegatedStakeIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(DelegateManagerV2IncreaseDelegatedStake)
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
		it.Event = new(DelegateManagerV2IncreaseDelegatedStake)
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
func (it *DelegateManagerV2IncreaseDelegatedStakeIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *DelegateManagerV2IncreaseDelegatedStakeIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// DelegateManagerV2IncreaseDelegatedStake represents a IncreaseDelegatedStake event raised by the DelegateManagerV2 contract.
type DelegateManagerV2IncreaseDelegatedStake struct {
	Delegator       common.Address
	ServiceProvider common.Address
	IncreaseAmount  *big.Int
	Raw             types.Log // Blockchain specific contextual infos
}

// FilterIncreaseDelegatedStake is a free log retrieval operation binding the contract event 0x82d701855f3ac4a098fc0249261c5e06d1050d23c8aa351fae8abefc2a464fda.
//
// Solidity: event IncreaseDelegatedStake(address indexed _delegator, address indexed _serviceProvider, uint256 indexed _increaseAmount)
func (_DelegateManagerV2 *DelegateManagerV2Filterer) FilterIncreaseDelegatedStake(opts *bind.FilterOpts, _delegator []common.Address, _serviceProvider []common.Address, _increaseAmount []*big.Int) (*DelegateManagerV2IncreaseDelegatedStakeIterator, error) {

	var _delegatorRule []interface{}
	for _, _delegatorItem := range _delegator {
		_delegatorRule = append(_delegatorRule, _delegatorItem)
	}
	var _serviceProviderRule []interface{}
	for _, _serviceProviderItem := range _serviceProvider {
		_serviceProviderRule = append(_serviceProviderRule, _serviceProviderItem)
	}
	var _increaseAmountRule []interface{}
	for _, _increaseAmountItem := range _increaseAmount {
		_increaseAmountRule = append(_increaseAmountRule, _increaseAmountItem)
	}

	logs, sub, err := _DelegateManagerV2.contract.FilterLogs(opts, "IncreaseDelegatedStake", _delegatorRule, _serviceProviderRule, _increaseAmountRule)
	if err != nil {
		return nil, err
	}
	return &DelegateManagerV2IncreaseDelegatedStakeIterator{contract: _DelegateManagerV2.contract, event: "IncreaseDelegatedStake", logs: logs, sub: sub}, nil
}

// WatchIncreaseDelegatedStake is a free log subscription operation binding the contract event 0x82d701855f3ac4a098fc0249261c5e06d1050d23c8aa351fae8abefc2a464fda.
//
// Solidity: event IncreaseDelegatedStake(address indexed _delegator, address indexed _serviceProvider, uint256 indexed _increaseAmount)
func (_DelegateManagerV2 *DelegateManagerV2Filterer) WatchIncreaseDelegatedStake(opts *bind.WatchOpts, sink chan<- *DelegateManagerV2IncreaseDelegatedStake, _delegator []common.Address, _serviceProvider []common.Address, _increaseAmount []*big.Int) (event.Subscription, error) {

	var _delegatorRule []interface{}
	for _, _delegatorItem := range _delegator {
		_delegatorRule = append(_delegatorRule, _delegatorItem)
	}
	var _serviceProviderRule []interface{}
	for _, _serviceProviderItem := range _serviceProvider {
		_serviceProviderRule = append(_serviceProviderRule, _serviceProviderItem)
	}
	var _increaseAmountRule []interface{}
	for _, _increaseAmountItem := range _increaseAmount {
		_increaseAmountRule = append(_increaseAmountRule, _increaseAmountItem)
	}

	logs, sub, err := _DelegateManagerV2.contract.WatchLogs(opts, "IncreaseDelegatedStake", _delegatorRule, _serviceProviderRule, _increaseAmountRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(DelegateManagerV2IncreaseDelegatedStake)
				if err := _DelegateManagerV2.contract.UnpackLog(event, "IncreaseDelegatedStake", log); err != nil {
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

// ParseIncreaseDelegatedStake is a log parse operation binding the contract event 0x82d701855f3ac4a098fc0249261c5e06d1050d23c8aa351fae8abefc2a464fda.
//
// Solidity: event IncreaseDelegatedStake(address indexed _delegator, address indexed _serviceProvider, uint256 indexed _increaseAmount)
func (_DelegateManagerV2 *DelegateManagerV2Filterer) ParseIncreaseDelegatedStake(log types.Log) (*DelegateManagerV2IncreaseDelegatedStake, error) {
	event := new(DelegateManagerV2IncreaseDelegatedStake)
	if err := _DelegateManagerV2.contract.UnpackLog(event, "IncreaseDelegatedStake", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// DelegateManagerV2MaxDelegatorsUpdatedIterator is returned from FilterMaxDelegatorsUpdated and is used to iterate over the raw logs and unpacked data for MaxDelegatorsUpdated events raised by the DelegateManagerV2 contract.
type DelegateManagerV2MaxDelegatorsUpdatedIterator struct {
	Event *DelegateManagerV2MaxDelegatorsUpdated // Event containing the contract specifics and raw log

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
func (it *DelegateManagerV2MaxDelegatorsUpdatedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(DelegateManagerV2MaxDelegatorsUpdated)
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
		it.Event = new(DelegateManagerV2MaxDelegatorsUpdated)
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
func (it *DelegateManagerV2MaxDelegatorsUpdatedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *DelegateManagerV2MaxDelegatorsUpdatedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// DelegateManagerV2MaxDelegatorsUpdated represents a MaxDelegatorsUpdated event raised by the DelegateManagerV2 contract.
type DelegateManagerV2MaxDelegatorsUpdated struct {
	MaxDelegators *big.Int
	Raw           types.Log // Blockchain specific contextual infos
}

// FilterMaxDelegatorsUpdated is a free log retrieval operation binding the contract event 0x6ba19979a519727673bc99b911e17ce26c5b91bbf7471cfc082fea38eb2a4884.
//
// Solidity: event MaxDelegatorsUpdated(uint256 indexed _maxDelegators)
func (_DelegateManagerV2 *DelegateManagerV2Filterer) FilterMaxDelegatorsUpdated(opts *bind.FilterOpts, _maxDelegators []*big.Int) (*DelegateManagerV2MaxDelegatorsUpdatedIterator, error) {

	var _maxDelegatorsRule []interface{}
	for _, _maxDelegatorsItem := range _maxDelegators {
		_maxDelegatorsRule = append(_maxDelegatorsRule, _maxDelegatorsItem)
	}

	logs, sub, err := _DelegateManagerV2.contract.FilterLogs(opts, "MaxDelegatorsUpdated", _maxDelegatorsRule)
	if err != nil {
		return nil, err
	}
	return &DelegateManagerV2MaxDelegatorsUpdatedIterator{contract: _DelegateManagerV2.contract, event: "MaxDelegatorsUpdated", logs: logs, sub: sub}, nil
}

// WatchMaxDelegatorsUpdated is a free log subscription operation binding the contract event 0x6ba19979a519727673bc99b911e17ce26c5b91bbf7471cfc082fea38eb2a4884.
//
// Solidity: event MaxDelegatorsUpdated(uint256 indexed _maxDelegators)
func (_DelegateManagerV2 *DelegateManagerV2Filterer) WatchMaxDelegatorsUpdated(opts *bind.WatchOpts, sink chan<- *DelegateManagerV2MaxDelegatorsUpdated, _maxDelegators []*big.Int) (event.Subscription, error) {

	var _maxDelegatorsRule []interface{}
	for _, _maxDelegatorsItem := range _maxDelegators {
		_maxDelegatorsRule = append(_maxDelegatorsRule, _maxDelegatorsItem)
	}

	logs, sub, err := _DelegateManagerV2.contract.WatchLogs(opts, "MaxDelegatorsUpdated", _maxDelegatorsRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(DelegateManagerV2MaxDelegatorsUpdated)
				if err := _DelegateManagerV2.contract.UnpackLog(event, "MaxDelegatorsUpdated", log); err != nil {
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

// ParseMaxDelegatorsUpdated is a log parse operation binding the contract event 0x6ba19979a519727673bc99b911e17ce26c5b91bbf7471cfc082fea38eb2a4884.
//
// Solidity: event MaxDelegatorsUpdated(uint256 indexed _maxDelegators)
func (_DelegateManagerV2 *DelegateManagerV2Filterer) ParseMaxDelegatorsUpdated(log types.Log) (*DelegateManagerV2MaxDelegatorsUpdated, error) {
	event := new(DelegateManagerV2MaxDelegatorsUpdated)
	if err := _DelegateManagerV2.contract.UnpackLog(event, "MaxDelegatorsUpdated", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// DelegateManagerV2MinDelegationUpdatedIterator is returned from FilterMinDelegationUpdated and is used to iterate over the raw logs and unpacked data for MinDelegationUpdated events raised by the DelegateManagerV2 contract.
type DelegateManagerV2MinDelegationUpdatedIterator struct {
	Event *DelegateManagerV2MinDelegationUpdated // Event containing the contract specifics and raw log

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
func (it *DelegateManagerV2MinDelegationUpdatedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(DelegateManagerV2MinDelegationUpdated)
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
		it.Event = new(DelegateManagerV2MinDelegationUpdated)
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
func (it *DelegateManagerV2MinDelegationUpdatedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *DelegateManagerV2MinDelegationUpdatedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// DelegateManagerV2MinDelegationUpdated represents a MinDelegationUpdated event raised by the DelegateManagerV2 contract.
type DelegateManagerV2MinDelegationUpdated struct {
	MinDelegationAmount *big.Int
	Raw                 types.Log // Blockchain specific contextual infos
}

// FilterMinDelegationUpdated is a free log retrieval operation binding the contract event 0x2a565983434870f0302d93575c6ee07199767028d6f294c9d1d6a1cd0979f1e1.
//
// Solidity: event MinDelegationUpdated(uint256 indexed _minDelegationAmount)
func (_DelegateManagerV2 *DelegateManagerV2Filterer) FilterMinDelegationUpdated(opts *bind.FilterOpts, _minDelegationAmount []*big.Int) (*DelegateManagerV2MinDelegationUpdatedIterator, error) {

	var _minDelegationAmountRule []interface{}
	for _, _minDelegationAmountItem := range _minDelegationAmount {
		_minDelegationAmountRule = append(_minDelegationAmountRule, _minDelegationAmountItem)
	}

	logs, sub, err := _DelegateManagerV2.contract.FilterLogs(opts, "MinDelegationUpdated", _minDelegationAmountRule)
	if err != nil {
		return nil, err
	}
	return &DelegateManagerV2MinDelegationUpdatedIterator{contract: _DelegateManagerV2.contract, event: "MinDelegationUpdated", logs: logs, sub: sub}, nil
}

// WatchMinDelegationUpdated is a free log subscription operation binding the contract event 0x2a565983434870f0302d93575c6ee07199767028d6f294c9d1d6a1cd0979f1e1.
//
// Solidity: event MinDelegationUpdated(uint256 indexed _minDelegationAmount)
func (_DelegateManagerV2 *DelegateManagerV2Filterer) WatchMinDelegationUpdated(opts *bind.WatchOpts, sink chan<- *DelegateManagerV2MinDelegationUpdated, _minDelegationAmount []*big.Int) (event.Subscription, error) {

	var _minDelegationAmountRule []interface{}
	for _, _minDelegationAmountItem := range _minDelegationAmount {
		_minDelegationAmountRule = append(_minDelegationAmountRule, _minDelegationAmountItem)
	}

	logs, sub, err := _DelegateManagerV2.contract.WatchLogs(opts, "MinDelegationUpdated", _minDelegationAmountRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(DelegateManagerV2MinDelegationUpdated)
				if err := _DelegateManagerV2.contract.UnpackLog(event, "MinDelegationUpdated", log); err != nil {
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

// ParseMinDelegationUpdated is a log parse operation binding the contract event 0x2a565983434870f0302d93575c6ee07199767028d6f294c9d1d6a1cd0979f1e1.
//
// Solidity: event MinDelegationUpdated(uint256 indexed _minDelegationAmount)
func (_DelegateManagerV2 *DelegateManagerV2Filterer) ParseMinDelegationUpdated(log types.Log) (*DelegateManagerV2MinDelegationUpdated, error) {
	event := new(DelegateManagerV2MinDelegationUpdated)
	if err := _DelegateManagerV2.contract.UnpackLog(event, "MinDelegationUpdated", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// DelegateManagerV2RemoveDelegatorEvalDurationUpdatedIterator is returned from FilterRemoveDelegatorEvalDurationUpdated and is used to iterate over the raw logs and unpacked data for RemoveDelegatorEvalDurationUpdated events raised by the DelegateManagerV2 contract.
type DelegateManagerV2RemoveDelegatorEvalDurationUpdatedIterator struct {
	Event *DelegateManagerV2RemoveDelegatorEvalDurationUpdated // Event containing the contract specifics and raw log

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
func (it *DelegateManagerV2RemoveDelegatorEvalDurationUpdatedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(DelegateManagerV2RemoveDelegatorEvalDurationUpdated)
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
		it.Event = new(DelegateManagerV2RemoveDelegatorEvalDurationUpdated)
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
func (it *DelegateManagerV2RemoveDelegatorEvalDurationUpdatedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *DelegateManagerV2RemoveDelegatorEvalDurationUpdatedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// DelegateManagerV2RemoveDelegatorEvalDurationUpdated represents a RemoveDelegatorEvalDurationUpdated event raised by the DelegateManagerV2 contract.
type DelegateManagerV2RemoveDelegatorEvalDurationUpdated struct {
	RemoveDelegatorEvalDuration *big.Int
	Raw                         types.Log // Blockchain specific contextual infos
}

// FilterRemoveDelegatorEvalDurationUpdated is a free log retrieval operation binding the contract event 0x10c34e4da809ce0e816d31562e6f5a3d38f913c470dd384ed0a73710281b23dd.
//
// Solidity: event RemoveDelegatorEvalDurationUpdated(uint256 indexed _removeDelegatorEvalDuration)
func (_DelegateManagerV2 *DelegateManagerV2Filterer) FilterRemoveDelegatorEvalDurationUpdated(opts *bind.FilterOpts, _removeDelegatorEvalDuration []*big.Int) (*DelegateManagerV2RemoveDelegatorEvalDurationUpdatedIterator, error) {

	var _removeDelegatorEvalDurationRule []interface{}
	for _, _removeDelegatorEvalDurationItem := range _removeDelegatorEvalDuration {
		_removeDelegatorEvalDurationRule = append(_removeDelegatorEvalDurationRule, _removeDelegatorEvalDurationItem)
	}

	logs, sub, err := _DelegateManagerV2.contract.FilterLogs(opts, "RemoveDelegatorEvalDurationUpdated", _removeDelegatorEvalDurationRule)
	if err != nil {
		return nil, err
	}
	return &DelegateManagerV2RemoveDelegatorEvalDurationUpdatedIterator{contract: _DelegateManagerV2.contract, event: "RemoveDelegatorEvalDurationUpdated", logs: logs, sub: sub}, nil
}

// WatchRemoveDelegatorEvalDurationUpdated is a free log subscription operation binding the contract event 0x10c34e4da809ce0e816d31562e6f5a3d38f913c470dd384ed0a73710281b23dd.
//
// Solidity: event RemoveDelegatorEvalDurationUpdated(uint256 indexed _removeDelegatorEvalDuration)
func (_DelegateManagerV2 *DelegateManagerV2Filterer) WatchRemoveDelegatorEvalDurationUpdated(opts *bind.WatchOpts, sink chan<- *DelegateManagerV2RemoveDelegatorEvalDurationUpdated, _removeDelegatorEvalDuration []*big.Int) (event.Subscription, error) {

	var _removeDelegatorEvalDurationRule []interface{}
	for _, _removeDelegatorEvalDurationItem := range _removeDelegatorEvalDuration {
		_removeDelegatorEvalDurationRule = append(_removeDelegatorEvalDurationRule, _removeDelegatorEvalDurationItem)
	}

	logs, sub, err := _DelegateManagerV2.contract.WatchLogs(opts, "RemoveDelegatorEvalDurationUpdated", _removeDelegatorEvalDurationRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(DelegateManagerV2RemoveDelegatorEvalDurationUpdated)
				if err := _DelegateManagerV2.contract.UnpackLog(event, "RemoveDelegatorEvalDurationUpdated", log); err != nil {
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

// ParseRemoveDelegatorEvalDurationUpdated is a log parse operation binding the contract event 0x10c34e4da809ce0e816d31562e6f5a3d38f913c470dd384ed0a73710281b23dd.
//
// Solidity: event RemoveDelegatorEvalDurationUpdated(uint256 indexed _removeDelegatorEvalDuration)
func (_DelegateManagerV2 *DelegateManagerV2Filterer) ParseRemoveDelegatorEvalDurationUpdated(log types.Log) (*DelegateManagerV2RemoveDelegatorEvalDurationUpdated, error) {
	event := new(DelegateManagerV2RemoveDelegatorEvalDurationUpdated)
	if err := _DelegateManagerV2.contract.UnpackLog(event, "RemoveDelegatorEvalDurationUpdated", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// DelegateManagerV2RemoveDelegatorLockupDurationUpdatedIterator is returned from FilterRemoveDelegatorLockupDurationUpdated and is used to iterate over the raw logs and unpacked data for RemoveDelegatorLockupDurationUpdated events raised by the DelegateManagerV2 contract.
type DelegateManagerV2RemoveDelegatorLockupDurationUpdatedIterator struct {
	Event *DelegateManagerV2RemoveDelegatorLockupDurationUpdated // Event containing the contract specifics and raw log

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
func (it *DelegateManagerV2RemoveDelegatorLockupDurationUpdatedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(DelegateManagerV2RemoveDelegatorLockupDurationUpdated)
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
		it.Event = new(DelegateManagerV2RemoveDelegatorLockupDurationUpdated)
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
func (it *DelegateManagerV2RemoveDelegatorLockupDurationUpdatedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *DelegateManagerV2RemoveDelegatorLockupDurationUpdatedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// DelegateManagerV2RemoveDelegatorLockupDurationUpdated represents a RemoveDelegatorLockupDurationUpdated event raised by the DelegateManagerV2 contract.
type DelegateManagerV2RemoveDelegatorLockupDurationUpdated struct {
	RemoveDelegatorLockupDuration *big.Int
	Raw                           types.Log // Blockchain specific contextual infos
}

// FilterRemoveDelegatorLockupDurationUpdated is a free log retrieval operation binding the contract event 0x6e9686f24e1165005f49d9abb260eb40aed402da21db4894ebd3895a6519a454.
//
// Solidity: event RemoveDelegatorLockupDurationUpdated(uint256 indexed _removeDelegatorLockupDuration)
func (_DelegateManagerV2 *DelegateManagerV2Filterer) FilterRemoveDelegatorLockupDurationUpdated(opts *bind.FilterOpts, _removeDelegatorLockupDuration []*big.Int) (*DelegateManagerV2RemoveDelegatorLockupDurationUpdatedIterator, error) {

	var _removeDelegatorLockupDurationRule []interface{}
	for _, _removeDelegatorLockupDurationItem := range _removeDelegatorLockupDuration {
		_removeDelegatorLockupDurationRule = append(_removeDelegatorLockupDurationRule, _removeDelegatorLockupDurationItem)
	}

	logs, sub, err := _DelegateManagerV2.contract.FilterLogs(opts, "RemoveDelegatorLockupDurationUpdated", _removeDelegatorLockupDurationRule)
	if err != nil {
		return nil, err
	}
	return &DelegateManagerV2RemoveDelegatorLockupDurationUpdatedIterator{contract: _DelegateManagerV2.contract, event: "RemoveDelegatorLockupDurationUpdated", logs: logs, sub: sub}, nil
}

// WatchRemoveDelegatorLockupDurationUpdated is a free log subscription operation binding the contract event 0x6e9686f24e1165005f49d9abb260eb40aed402da21db4894ebd3895a6519a454.
//
// Solidity: event RemoveDelegatorLockupDurationUpdated(uint256 indexed _removeDelegatorLockupDuration)
func (_DelegateManagerV2 *DelegateManagerV2Filterer) WatchRemoveDelegatorLockupDurationUpdated(opts *bind.WatchOpts, sink chan<- *DelegateManagerV2RemoveDelegatorLockupDurationUpdated, _removeDelegatorLockupDuration []*big.Int) (event.Subscription, error) {

	var _removeDelegatorLockupDurationRule []interface{}
	for _, _removeDelegatorLockupDurationItem := range _removeDelegatorLockupDuration {
		_removeDelegatorLockupDurationRule = append(_removeDelegatorLockupDurationRule, _removeDelegatorLockupDurationItem)
	}

	logs, sub, err := _DelegateManagerV2.contract.WatchLogs(opts, "RemoveDelegatorLockupDurationUpdated", _removeDelegatorLockupDurationRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(DelegateManagerV2RemoveDelegatorLockupDurationUpdated)
				if err := _DelegateManagerV2.contract.UnpackLog(event, "RemoveDelegatorLockupDurationUpdated", log); err != nil {
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

// ParseRemoveDelegatorLockupDurationUpdated is a log parse operation binding the contract event 0x6e9686f24e1165005f49d9abb260eb40aed402da21db4894ebd3895a6519a454.
//
// Solidity: event RemoveDelegatorLockupDurationUpdated(uint256 indexed _removeDelegatorLockupDuration)
func (_DelegateManagerV2 *DelegateManagerV2Filterer) ParseRemoveDelegatorLockupDurationUpdated(log types.Log) (*DelegateManagerV2RemoveDelegatorLockupDurationUpdated, error) {
	event := new(DelegateManagerV2RemoveDelegatorLockupDurationUpdated)
	if err := _DelegateManagerV2.contract.UnpackLog(event, "RemoveDelegatorLockupDurationUpdated", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// DelegateManagerV2RemoveDelegatorRequestCancelledIterator is returned from FilterRemoveDelegatorRequestCancelled and is used to iterate over the raw logs and unpacked data for RemoveDelegatorRequestCancelled events raised by the DelegateManagerV2 contract.
type DelegateManagerV2RemoveDelegatorRequestCancelledIterator struct {
	Event *DelegateManagerV2RemoveDelegatorRequestCancelled // Event containing the contract specifics and raw log

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
func (it *DelegateManagerV2RemoveDelegatorRequestCancelledIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(DelegateManagerV2RemoveDelegatorRequestCancelled)
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
		it.Event = new(DelegateManagerV2RemoveDelegatorRequestCancelled)
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
func (it *DelegateManagerV2RemoveDelegatorRequestCancelledIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *DelegateManagerV2RemoveDelegatorRequestCancelledIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// DelegateManagerV2RemoveDelegatorRequestCancelled represents a RemoveDelegatorRequestCancelled event raised by the DelegateManagerV2 contract.
type DelegateManagerV2RemoveDelegatorRequestCancelled struct {
	ServiceProvider common.Address
	Delegator       common.Address
	Raw             types.Log // Blockchain specific contextual infos
}

// FilterRemoveDelegatorRequestCancelled is a free log retrieval operation binding the contract event 0xd7a1b9c3d30d51412b848777bffec951c371bf58a13788d70c12f534f82d4cb3.
//
// Solidity: event RemoveDelegatorRequestCancelled(address indexed _serviceProvider, address indexed _delegator)
func (_DelegateManagerV2 *DelegateManagerV2Filterer) FilterRemoveDelegatorRequestCancelled(opts *bind.FilterOpts, _serviceProvider []common.Address, _delegator []common.Address) (*DelegateManagerV2RemoveDelegatorRequestCancelledIterator, error) {

	var _serviceProviderRule []interface{}
	for _, _serviceProviderItem := range _serviceProvider {
		_serviceProviderRule = append(_serviceProviderRule, _serviceProviderItem)
	}
	var _delegatorRule []interface{}
	for _, _delegatorItem := range _delegator {
		_delegatorRule = append(_delegatorRule, _delegatorItem)
	}

	logs, sub, err := _DelegateManagerV2.contract.FilterLogs(opts, "RemoveDelegatorRequestCancelled", _serviceProviderRule, _delegatorRule)
	if err != nil {
		return nil, err
	}
	return &DelegateManagerV2RemoveDelegatorRequestCancelledIterator{contract: _DelegateManagerV2.contract, event: "RemoveDelegatorRequestCancelled", logs: logs, sub: sub}, nil
}

// WatchRemoveDelegatorRequestCancelled is a free log subscription operation binding the contract event 0xd7a1b9c3d30d51412b848777bffec951c371bf58a13788d70c12f534f82d4cb3.
//
// Solidity: event RemoveDelegatorRequestCancelled(address indexed _serviceProvider, address indexed _delegator)
func (_DelegateManagerV2 *DelegateManagerV2Filterer) WatchRemoveDelegatorRequestCancelled(opts *bind.WatchOpts, sink chan<- *DelegateManagerV2RemoveDelegatorRequestCancelled, _serviceProvider []common.Address, _delegator []common.Address) (event.Subscription, error) {

	var _serviceProviderRule []interface{}
	for _, _serviceProviderItem := range _serviceProvider {
		_serviceProviderRule = append(_serviceProviderRule, _serviceProviderItem)
	}
	var _delegatorRule []interface{}
	for _, _delegatorItem := range _delegator {
		_delegatorRule = append(_delegatorRule, _delegatorItem)
	}

	logs, sub, err := _DelegateManagerV2.contract.WatchLogs(opts, "RemoveDelegatorRequestCancelled", _serviceProviderRule, _delegatorRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(DelegateManagerV2RemoveDelegatorRequestCancelled)
				if err := _DelegateManagerV2.contract.UnpackLog(event, "RemoveDelegatorRequestCancelled", log); err != nil {
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

// ParseRemoveDelegatorRequestCancelled is a log parse operation binding the contract event 0xd7a1b9c3d30d51412b848777bffec951c371bf58a13788d70c12f534f82d4cb3.
//
// Solidity: event RemoveDelegatorRequestCancelled(address indexed _serviceProvider, address indexed _delegator)
func (_DelegateManagerV2 *DelegateManagerV2Filterer) ParseRemoveDelegatorRequestCancelled(log types.Log) (*DelegateManagerV2RemoveDelegatorRequestCancelled, error) {
	event := new(DelegateManagerV2RemoveDelegatorRequestCancelled)
	if err := _DelegateManagerV2.contract.UnpackLog(event, "RemoveDelegatorRequestCancelled", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// DelegateManagerV2RemoveDelegatorRequestEvaluatedIterator is returned from FilterRemoveDelegatorRequestEvaluated and is used to iterate over the raw logs and unpacked data for RemoveDelegatorRequestEvaluated events raised by the DelegateManagerV2 contract.
type DelegateManagerV2RemoveDelegatorRequestEvaluatedIterator struct {
	Event *DelegateManagerV2RemoveDelegatorRequestEvaluated // Event containing the contract specifics and raw log

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
func (it *DelegateManagerV2RemoveDelegatorRequestEvaluatedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(DelegateManagerV2RemoveDelegatorRequestEvaluated)
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
		it.Event = new(DelegateManagerV2RemoveDelegatorRequestEvaluated)
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
func (it *DelegateManagerV2RemoveDelegatorRequestEvaluatedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *DelegateManagerV2RemoveDelegatorRequestEvaluatedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// DelegateManagerV2RemoveDelegatorRequestEvaluated represents a RemoveDelegatorRequestEvaluated event raised by the DelegateManagerV2 contract.
type DelegateManagerV2RemoveDelegatorRequestEvaluated struct {
	ServiceProvider common.Address
	Delegator       common.Address
	UnstakedAmount  *big.Int
	Raw             types.Log // Blockchain specific contextual infos
}

// FilterRemoveDelegatorRequestEvaluated is a free log retrieval operation binding the contract event 0x912ca4f48e16ea4ec940ef9071c9cc3eb57f01c07e052b1f797caaade6504f8b.
//
// Solidity: event RemoveDelegatorRequestEvaluated(address indexed _serviceProvider, address indexed _delegator, uint256 indexed _unstakedAmount)
func (_DelegateManagerV2 *DelegateManagerV2Filterer) FilterRemoveDelegatorRequestEvaluated(opts *bind.FilterOpts, _serviceProvider []common.Address, _delegator []common.Address, _unstakedAmount []*big.Int) (*DelegateManagerV2RemoveDelegatorRequestEvaluatedIterator, error) {

	var _serviceProviderRule []interface{}
	for _, _serviceProviderItem := range _serviceProvider {
		_serviceProviderRule = append(_serviceProviderRule, _serviceProviderItem)
	}
	var _delegatorRule []interface{}
	for _, _delegatorItem := range _delegator {
		_delegatorRule = append(_delegatorRule, _delegatorItem)
	}
	var _unstakedAmountRule []interface{}
	for _, _unstakedAmountItem := range _unstakedAmount {
		_unstakedAmountRule = append(_unstakedAmountRule, _unstakedAmountItem)
	}

	logs, sub, err := _DelegateManagerV2.contract.FilterLogs(opts, "RemoveDelegatorRequestEvaluated", _serviceProviderRule, _delegatorRule, _unstakedAmountRule)
	if err != nil {
		return nil, err
	}
	return &DelegateManagerV2RemoveDelegatorRequestEvaluatedIterator{contract: _DelegateManagerV2.contract, event: "RemoveDelegatorRequestEvaluated", logs: logs, sub: sub}, nil
}

// WatchRemoveDelegatorRequestEvaluated is a free log subscription operation binding the contract event 0x912ca4f48e16ea4ec940ef9071c9cc3eb57f01c07e052b1f797caaade6504f8b.
//
// Solidity: event RemoveDelegatorRequestEvaluated(address indexed _serviceProvider, address indexed _delegator, uint256 indexed _unstakedAmount)
func (_DelegateManagerV2 *DelegateManagerV2Filterer) WatchRemoveDelegatorRequestEvaluated(opts *bind.WatchOpts, sink chan<- *DelegateManagerV2RemoveDelegatorRequestEvaluated, _serviceProvider []common.Address, _delegator []common.Address, _unstakedAmount []*big.Int) (event.Subscription, error) {

	var _serviceProviderRule []interface{}
	for _, _serviceProviderItem := range _serviceProvider {
		_serviceProviderRule = append(_serviceProviderRule, _serviceProviderItem)
	}
	var _delegatorRule []interface{}
	for _, _delegatorItem := range _delegator {
		_delegatorRule = append(_delegatorRule, _delegatorItem)
	}
	var _unstakedAmountRule []interface{}
	for _, _unstakedAmountItem := range _unstakedAmount {
		_unstakedAmountRule = append(_unstakedAmountRule, _unstakedAmountItem)
	}

	logs, sub, err := _DelegateManagerV2.contract.WatchLogs(opts, "RemoveDelegatorRequestEvaluated", _serviceProviderRule, _delegatorRule, _unstakedAmountRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(DelegateManagerV2RemoveDelegatorRequestEvaluated)
				if err := _DelegateManagerV2.contract.UnpackLog(event, "RemoveDelegatorRequestEvaluated", log); err != nil {
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

// ParseRemoveDelegatorRequestEvaluated is a log parse operation binding the contract event 0x912ca4f48e16ea4ec940ef9071c9cc3eb57f01c07e052b1f797caaade6504f8b.
//
// Solidity: event RemoveDelegatorRequestEvaluated(address indexed _serviceProvider, address indexed _delegator, uint256 indexed _unstakedAmount)
func (_DelegateManagerV2 *DelegateManagerV2Filterer) ParseRemoveDelegatorRequestEvaluated(log types.Log) (*DelegateManagerV2RemoveDelegatorRequestEvaluated, error) {
	event := new(DelegateManagerV2RemoveDelegatorRequestEvaluated)
	if err := _DelegateManagerV2.contract.UnpackLog(event, "RemoveDelegatorRequestEvaluated", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// DelegateManagerV2RemoveDelegatorRequestedIterator is returned from FilterRemoveDelegatorRequested and is used to iterate over the raw logs and unpacked data for RemoveDelegatorRequested events raised by the DelegateManagerV2 contract.
type DelegateManagerV2RemoveDelegatorRequestedIterator struct {
	Event *DelegateManagerV2RemoveDelegatorRequested // Event containing the contract specifics and raw log

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
func (it *DelegateManagerV2RemoveDelegatorRequestedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(DelegateManagerV2RemoveDelegatorRequested)
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
		it.Event = new(DelegateManagerV2RemoveDelegatorRequested)
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
func (it *DelegateManagerV2RemoveDelegatorRequestedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *DelegateManagerV2RemoveDelegatorRequestedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// DelegateManagerV2RemoveDelegatorRequested represents a RemoveDelegatorRequested event raised by the DelegateManagerV2 contract.
type DelegateManagerV2RemoveDelegatorRequested struct {
	ServiceProvider   common.Address
	Delegator         common.Address
	LockupExpiryBlock *big.Int
	Raw               types.Log // Blockchain specific contextual infos
}

// FilterRemoveDelegatorRequested is a free log retrieval operation binding the contract event 0xd6f2f5867e98ef295f42626fa37ec5192436d80d6b552dc38c971b9ddbe16e10.
//
// Solidity: event RemoveDelegatorRequested(address indexed _serviceProvider, address indexed _delegator, uint256 indexed _lockupExpiryBlock)
func (_DelegateManagerV2 *DelegateManagerV2Filterer) FilterRemoveDelegatorRequested(opts *bind.FilterOpts, _serviceProvider []common.Address, _delegator []common.Address, _lockupExpiryBlock []*big.Int) (*DelegateManagerV2RemoveDelegatorRequestedIterator, error) {

	var _serviceProviderRule []interface{}
	for _, _serviceProviderItem := range _serviceProvider {
		_serviceProviderRule = append(_serviceProviderRule, _serviceProviderItem)
	}
	var _delegatorRule []interface{}
	for _, _delegatorItem := range _delegator {
		_delegatorRule = append(_delegatorRule, _delegatorItem)
	}
	var _lockupExpiryBlockRule []interface{}
	for _, _lockupExpiryBlockItem := range _lockupExpiryBlock {
		_lockupExpiryBlockRule = append(_lockupExpiryBlockRule, _lockupExpiryBlockItem)
	}

	logs, sub, err := _DelegateManagerV2.contract.FilterLogs(opts, "RemoveDelegatorRequested", _serviceProviderRule, _delegatorRule, _lockupExpiryBlockRule)
	if err != nil {
		return nil, err
	}
	return &DelegateManagerV2RemoveDelegatorRequestedIterator{contract: _DelegateManagerV2.contract, event: "RemoveDelegatorRequested", logs: logs, sub: sub}, nil
}

// WatchRemoveDelegatorRequested is a free log subscription operation binding the contract event 0xd6f2f5867e98ef295f42626fa37ec5192436d80d6b552dc38c971b9ddbe16e10.
//
// Solidity: event RemoveDelegatorRequested(address indexed _serviceProvider, address indexed _delegator, uint256 indexed _lockupExpiryBlock)
func (_DelegateManagerV2 *DelegateManagerV2Filterer) WatchRemoveDelegatorRequested(opts *bind.WatchOpts, sink chan<- *DelegateManagerV2RemoveDelegatorRequested, _serviceProvider []common.Address, _delegator []common.Address, _lockupExpiryBlock []*big.Int) (event.Subscription, error) {

	var _serviceProviderRule []interface{}
	for _, _serviceProviderItem := range _serviceProvider {
		_serviceProviderRule = append(_serviceProviderRule, _serviceProviderItem)
	}
	var _delegatorRule []interface{}
	for _, _delegatorItem := range _delegator {
		_delegatorRule = append(_delegatorRule, _delegatorItem)
	}
	var _lockupExpiryBlockRule []interface{}
	for _, _lockupExpiryBlockItem := range _lockupExpiryBlock {
		_lockupExpiryBlockRule = append(_lockupExpiryBlockRule, _lockupExpiryBlockItem)
	}

	logs, sub, err := _DelegateManagerV2.contract.WatchLogs(opts, "RemoveDelegatorRequested", _serviceProviderRule, _delegatorRule, _lockupExpiryBlockRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(DelegateManagerV2RemoveDelegatorRequested)
				if err := _DelegateManagerV2.contract.UnpackLog(event, "RemoveDelegatorRequested", log); err != nil {
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

// ParseRemoveDelegatorRequested is a log parse operation binding the contract event 0xd6f2f5867e98ef295f42626fa37ec5192436d80d6b552dc38c971b9ddbe16e10.
//
// Solidity: event RemoveDelegatorRequested(address indexed _serviceProvider, address indexed _delegator, uint256 indexed _lockupExpiryBlock)
func (_DelegateManagerV2 *DelegateManagerV2Filterer) ParseRemoveDelegatorRequested(log types.Log) (*DelegateManagerV2RemoveDelegatorRequested, error) {
	event := new(DelegateManagerV2RemoveDelegatorRequested)
	if err := _DelegateManagerV2.contract.UnpackLog(event, "RemoveDelegatorRequested", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// DelegateManagerV2SPMinDelegationAmountUpdatedIterator is returned from FilterSPMinDelegationAmountUpdated and is used to iterate over the raw logs and unpacked data for SPMinDelegationAmountUpdated events raised by the DelegateManagerV2 contract.
type DelegateManagerV2SPMinDelegationAmountUpdatedIterator struct {
	Event *DelegateManagerV2SPMinDelegationAmountUpdated // Event containing the contract specifics and raw log

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
func (it *DelegateManagerV2SPMinDelegationAmountUpdatedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(DelegateManagerV2SPMinDelegationAmountUpdated)
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
		it.Event = new(DelegateManagerV2SPMinDelegationAmountUpdated)
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
func (it *DelegateManagerV2SPMinDelegationAmountUpdatedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *DelegateManagerV2SPMinDelegationAmountUpdatedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// DelegateManagerV2SPMinDelegationAmountUpdated represents a SPMinDelegationAmountUpdated event raised by the DelegateManagerV2 contract.
type DelegateManagerV2SPMinDelegationAmountUpdated struct {
	ServiceProvider       common.Address
	SpMinDelegationAmount *big.Int
	Raw                   types.Log // Blockchain specific contextual infos
}

// FilterSPMinDelegationAmountUpdated is a free log retrieval operation binding the contract event 0xb5cbea0eea08e03cbff1c1db26b3125d44b4dd567d36c988c01ca3f6e694aea3.
//
// Solidity: event SPMinDelegationAmountUpdated(address indexed _serviceProvider, uint256 indexed _spMinDelegationAmount)
func (_DelegateManagerV2 *DelegateManagerV2Filterer) FilterSPMinDelegationAmountUpdated(opts *bind.FilterOpts, _serviceProvider []common.Address, _spMinDelegationAmount []*big.Int) (*DelegateManagerV2SPMinDelegationAmountUpdatedIterator, error) {

	var _serviceProviderRule []interface{}
	for _, _serviceProviderItem := range _serviceProvider {
		_serviceProviderRule = append(_serviceProviderRule, _serviceProviderItem)
	}
	var _spMinDelegationAmountRule []interface{}
	for _, _spMinDelegationAmountItem := range _spMinDelegationAmount {
		_spMinDelegationAmountRule = append(_spMinDelegationAmountRule, _spMinDelegationAmountItem)
	}

	logs, sub, err := _DelegateManagerV2.contract.FilterLogs(opts, "SPMinDelegationAmountUpdated", _serviceProviderRule, _spMinDelegationAmountRule)
	if err != nil {
		return nil, err
	}
	return &DelegateManagerV2SPMinDelegationAmountUpdatedIterator{contract: _DelegateManagerV2.contract, event: "SPMinDelegationAmountUpdated", logs: logs, sub: sub}, nil
}

// WatchSPMinDelegationAmountUpdated is a free log subscription operation binding the contract event 0xb5cbea0eea08e03cbff1c1db26b3125d44b4dd567d36c988c01ca3f6e694aea3.
//
// Solidity: event SPMinDelegationAmountUpdated(address indexed _serviceProvider, uint256 indexed _spMinDelegationAmount)
func (_DelegateManagerV2 *DelegateManagerV2Filterer) WatchSPMinDelegationAmountUpdated(opts *bind.WatchOpts, sink chan<- *DelegateManagerV2SPMinDelegationAmountUpdated, _serviceProvider []common.Address, _spMinDelegationAmount []*big.Int) (event.Subscription, error) {

	var _serviceProviderRule []interface{}
	for _, _serviceProviderItem := range _serviceProvider {
		_serviceProviderRule = append(_serviceProviderRule, _serviceProviderItem)
	}
	var _spMinDelegationAmountRule []interface{}
	for _, _spMinDelegationAmountItem := range _spMinDelegationAmount {
		_spMinDelegationAmountRule = append(_spMinDelegationAmountRule, _spMinDelegationAmountItem)
	}

	logs, sub, err := _DelegateManagerV2.contract.WatchLogs(opts, "SPMinDelegationAmountUpdated", _serviceProviderRule, _spMinDelegationAmountRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(DelegateManagerV2SPMinDelegationAmountUpdated)
				if err := _DelegateManagerV2.contract.UnpackLog(event, "SPMinDelegationAmountUpdated", log); err != nil {
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

// ParseSPMinDelegationAmountUpdated is a log parse operation binding the contract event 0xb5cbea0eea08e03cbff1c1db26b3125d44b4dd567d36c988c01ca3f6e694aea3.
//
// Solidity: event SPMinDelegationAmountUpdated(address indexed _serviceProvider, uint256 indexed _spMinDelegationAmount)
func (_DelegateManagerV2 *DelegateManagerV2Filterer) ParseSPMinDelegationAmountUpdated(log types.Log) (*DelegateManagerV2SPMinDelegationAmountUpdated, error) {
	event := new(DelegateManagerV2SPMinDelegationAmountUpdated)
	if err := _DelegateManagerV2.contract.UnpackLog(event, "SPMinDelegationAmountUpdated", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// DelegateManagerV2ServiceProviderFactoryAddressUpdatedIterator is returned from FilterServiceProviderFactoryAddressUpdated and is used to iterate over the raw logs and unpacked data for ServiceProviderFactoryAddressUpdated events raised by the DelegateManagerV2 contract.
type DelegateManagerV2ServiceProviderFactoryAddressUpdatedIterator struct {
	Event *DelegateManagerV2ServiceProviderFactoryAddressUpdated // Event containing the contract specifics and raw log

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
func (it *DelegateManagerV2ServiceProviderFactoryAddressUpdatedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(DelegateManagerV2ServiceProviderFactoryAddressUpdated)
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
		it.Event = new(DelegateManagerV2ServiceProviderFactoryAddressUpdated)
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
func (it *DelegateManagerV2ServiceProviderFactoryAddressUpdatedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *DelegateManagerV2ServiceProviderFactoryAddressUpdatedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// DelegateManagerV2ServiceProviderFactoryAddressUpdated represents a ServiceProviderFactoryAddressUpdated event raised by the DelegateManagerV2 contract.
type DelegateManagerV2ServiceProviderFactoryAddressUpdated struct {
	NewServiceProviderFactoryAddress common.Address
	Raw                              types.Log // Blockchain specific contextual infos
}

// FilterServiceProviderFactoryAddressUpdated is a free log retrieval operation binding the contract event 0x373f84f0177a6c2e019f2e0e73c988359e56e111629a261c9bba5c968c383ed1.
//
// Solidity: event ServiceProviderFactoryAddressUpdated(address indexed _newServiceProviderFactoryAddress)
func (_DelegateManagerV2 *DelegateManagerV2Filterer) FilterServiceProviderFactoryAddressUpdated(opts *bind.FilterOpts, _newServiceProviderFactoryAddress []common.Address) (*DelegateManagerV2ServiceProviderFactoryAddressUpdatedIterator, error) {

	var _newServiceProviderFactoryAddressRule []interface{}
	for _, _newServiceProviderFactoryAddressItem := range _newServiceProviderFactoryAddress {
		_newServiceProviderFactoryAddressRule = append(_newServiceProviderFactoryAddressRule, _newServiceProviderFactoryAddressItem)
	}

	logs, sub, err := _DelegateManagerV2.contract.FilterLogs(opts, "ServiceProviderFactoryAddressUpdated", _newServiceProviderFactoryAddressRule)
	if err != nil {
		return nil, err
	}
	return &DelegateManagerV2ServiceProviderFactoryAddressUpdatedIterator{contract: _DelegateManagerV2.contract, event: "ServiceProviderFactoryAddressUpdated", logs: logs, sub: sub}, nil
}

// WatchServiceProviderFactoryAddressUpdated is a free log subscription operation binding the contract event 0x373f84f0177a6c2e019f2e0e73c988359e56e111629a261c9bba5c968c383ed1.
//
// Solidity: event ServiceProviderFactoryAddressUpdated(address indexed _newServiceProviderFactoryAddress)
func (_DelegateManagerV2 *DelegateManagerV2Filterer) WatchServiceProviderFactoryAddressUpdated(opts *bind.WatchOpts, sink chan<- *DelegateManagerV2ServiceProviderFactoryAddressUpdated, _newServiceProviderFactoryAddress []common.Address) (event.Subscription, error) {

	var _newServiceProviderFactoryAddressRule []interface{}
	for _, _newServiceProviderFactoryAddressItem := range _newServiceProviderFactoryAddress {
		_newServiceProviderFactoryAddressRule = append(_newServiceProviderFactoryAddressRule, _newServiceProviderFactoryAddressItem)
	}

	logs, sub, err := _DelegateManagerV2.contract.WatchLogs(opts, "ServiceProviderFactoryAddressUpdated", _newServiceProviderFactoryAddressRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(DelegateManagerV2ServiceProviderFactoryAddressUpdated)
				if err := _DelegateManagerV2.contract.UnpackLog(event, "ServiceProviderFactoryAddressUpdated", log); err != nil {
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
func (_DelegateManagerV2 *DelegateManagerV2Filterer) ParseServiceProviderFactoryAddressUpdated(log types.Log) (*DelegateManagerV2ServiceProviderFactoryAddressUpdated, error) {
	event := new(DelegateManagerV2ServiceProviderFactoryAddressUpdated)
	if err := _DelegateManagerV2.contract.UnpackLog(event, "ServiceProviderFactoryAddressUpdated", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// DelegateManagerV2SlashIterator is returned from FilterSlash and is used to iterate over the raw logs and unpacked data for Slash events raised by the DelegateManagerV2 contract.
type DelegateManagerV2SlashIterator struct {
	Event *DelegateManagerV2Slash // Event containing the contract specifics and raw log

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
func (it *DelegateManagerV2SlashIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(DelegateManagerV2Slash)
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
		it.Event = new(DelegateManagerV2Slash)
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
func (it *DelegateManagerV2SlashIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *DelegateManagerV2SlashIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// DelegateManagerV2Slash represents a Slash event raised by the DelegateManagerV2 contract.
type DelegateManagerV2Slash struct {
	Target   common.Address
	Amount   *big.Int
	NewTotal *big.Int
	Raw      types.Log // Blockchain specific contextual infos
}

// FilterSlash is a free log retrieval operation binding the contract event 0xe05ad941535eea602efe44ddd7d96e5db6ad9a4865c360257aad8cf4c0a94469.
//
// Solidity: event Slash(address indexed _target, uint256 indexed _amount, uint256 indexed _newTotal)
func (_DelegateManagerV2 *DelegateManagerV2Filterer) FilterSlash(opts *bind.FilterOpts, _target []common.Address, _amount []*big.Int, _newTotal []*big.Int) (*DelegateManagerV2SlashIterator, error) {

	var _targetRule []interface{}
	for _, _targetItem := range _target {
		_targetRule = append(_targetRule, _targetItem)
	}
	var _amountRule []interface{}
	for _, _amountItem := range _amount {
		_amountRule = append(_amountRule, _amountItem)
	}
	var _newTotalRule []interface{}
	for _, _newTotalItem := range _newTotal {
		_newTotalRule = append(_newTotalRule, _newTotalItem)
	}

	logs, sub, err := _DelegateManagerV2.contract.FilterLogs(opts, "Slash", _targetRule, _amountRule, _newTotalRule)
	if err != nil {
		return nil, err
	}
	return &DelegateManagerV2SlashIterator{contract: _DelegateManagerV2.contract, event: "Slash", logs: logs, sub: sub}, nil
}

// WatchSlash is a free log subscription operation binding the contract event 0xe05ad941535eea602efe44ddd7d96e5db6ad9a4865c360257aad8cf4c0a94469.
//
// Solidity: event Slash(address indexed _target, uint256 indexed _amount, uint256 indexed _newTotal)
func (_DelegateManagerV2 *DelegateManagerV2Filterer) WatchSlash(opts *bind.WatchOpts, sink chan<- *DelegateManagerV2Slash, _target []common.Address, _amount []*big.Int, _newTotal []*big.Int) (event.Subscription, error) {

	var _targetRule []interface{}
	for _, _targetItem := range _target {
		_targetRule = append(_targetRule, _targetItem)
	}
	var _amountRule []interface{}
	for _, _amountItem := range _amount {
		_amountRule = append(_amountRule, _amountItem)
	}
	var _newTotalRule []interface{}
	for _, _newTotalItem := range _newTotal {
		_newTotalRule = append(_newTotalRule, _newTotalItem)
	}

	logs, sub, err := _DelegateManagerV2.contract.WatchLogs(opts, "Slash", _targetRule, _amountRule, _newTotalRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(DelegateManagerV2Slash)
				if err := _DelegateManagerV2.contract.UnpackLog(event, "Slash", log); err != nil {
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

// ParseSlash is a log parse operation binding the contract event 0xe05ad941535eea602efe44ddd7d96e5db6ad9a4865c360257aad8cf4c0a94469.
//
// Solidity: event Slash(address indexed _target, uint256 indexed _amount, uint256 indexed _newTotal)
func (_DelegateManagerV2 *DelegateManagerV2Filterer) ParseSlash(log types.Log) (*DelegateManagerV2Slash, error) {
	event := new(DelegateManagerV2Slash)
	if err := _DelegateManagerV2.contract.UnpackLog(event, "Slash", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// DelegateManagerV2StakingAddressUpdatedIterator is returned from FilterStakingAddressUpdated and is used to iterate over the raw logs and unpacked data for StakingAddressUpdated events raised by the DelegateManagerV2 contract.
type DelegateManagerV2StakingAddressUpdatedIterator struct {
	Event *DelegateManagerV2StakingAddressUpdated // Event containing the contract specifics and raw log

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
func (it *DelegateManagerV2StakingAddressUpdatedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(DelegateManagerV2StakingAddressUpdated)
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
		it.Event = new(DelegateManagerV2StakingAddressUpdated)
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
func (it *DelegateManagerV2StakingAddressUpdatedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *DelegateManagerV2StakingAddressUpdatedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// DelegateManagerV2StakingAddressUpdated represents a StakingAddressUpdated event raised by the DelegateManagerV2 contract.
type DelegateManagerV2StakingAddressUpdated struct {
	NewStakingAddress common.Address
	Raw               types.Log // Blockchain specific contextual infos
}

// FilterStakingAddressUpdated is a free log retrieval operation binding the contract event 0x8ae96d8af35324a34b19e4f33e72d620b502f69595bb43870ab5fd7a7de78239.
//
// Solidity: event StakingAddressUpdated(address indexed _newStakingAddress)
func (_DelegateManagerV2 *DelegateManagerV2Filterer) FilterStakingAddressUpdated(opts *bind.FilterOpts, _newStakingAddress []common.Address) (*DelegateManagerV2StakingAddressUpdatedIterator, error) {

	var _newStakingAddressRule []interface{}
	for _, _newStakingAddressItem := range _newStakingAddress {
		_newStakingAddressRule = append(_newStakingAddressRule, _newStakingAddressItem)
	}

	logs, sub, err := _DelegateManagerV2.contract.FilterLogs(opts, "StakingAddressUpdated", _newStakingAddressRule)
	if err != nil {
		return nil, err
	}
	return &DelegateManagerV2StakingAddressUpdatedIterator{contract: _DelegateManagerV2.contract, event: "StakingAddressUpdated", logs: logs, sub: sub}, nil
}

// WatchStakingAddressUpdated is a free log subscription operation binding the contract event 0x8ae96d8af35324a34b19e4f33e72d620b502f69595bb43870ab5fd7a7de78239.
//
// Solidity: event StakingAddressUpdated(address indexed _newStakingAddress)
func (_DelegateManagerV2 *DelegateManagerV2Filterer) WatchStakingAddressUpdated(opts *bind.WatchOpts, sink chan<- *DelegateManagerV2StakingAddressUpdated, _newStakingAddress []common.Address) (event.Subscription, error) {

	var _newStakingAddressRule []interface{}
	for _, _newStakingAddressItem := range _newStakingAddress {
		_newStakingAddressRule = append(_newStakingAddressRule, _newStakingAddressItem)
	}

	logs, sub, err := _DelegateManagerV2.contract.WatchLogs(opts, "StakingAddressUpdated", _newStakingAddressRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(DelegateManagerV2StakingAddressUpdated)
				if err := _DelegateManagerV2.contract.UnpackLog(event, "StakingAddressUpdated", log); err != nil {
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
func (_DelegateManagerV2 *DelegateManagerV2Filterer) ParseStakingAddressUpdated(log types.Log) (*DelegateManagerV2StakingAddressUpdated, error) {
	event := new(DelegateManagerV2StakingAddressUpdated)
	if err := _DelegateManagerV2.contract.UnpackLog(event, "StakingAddressUpdated", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// DelegateManagerV2UndelegateLockupDurationUpdatedIterator is returned from FilterUndelegateLockupDurationUpdated and is used to iterate over the raw logs and unpacked data for UndelegateLockupDurationUpdated events raised by the DelegateManagerV2 contract.
type DelegateManagerV2UndelegateLockupDurationUpdatedIterator struct {
	Event *DelegateManagerV2UndelegateLockupDurationUpdated // Event containing the contract specifics and raw log

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
func (it *DelegateManagerV2UndelegateLockupDurationUpdatedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(DelegateManagerV2UndelegateLockupDurationUpdated)
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
		it.Event = new(DelegateManagerV2UndelegateLockupDurationUpdated)
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
func (it *DelegateManagerV2UndelegateLockupDurationUpdatedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *DelegateManagerV2UndelegateLockupDurationUpdatedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// DelegateManagerV2UndelegateLockupDurationUpdated represents a UndelegateLockupDurationUpdated event raised by the DelegateManagerV2 contract.
type DelegateManagerV2UndelegateLockupDurationUpdated struct {
	UndelegateLockupDuration *big.Int
	Raw                      types.Log // Blockchain specific contextual infos
}

// FilterUndelegateLockupDurationUpdated is a free log retrieval operation binding the contract event 0xcb0491a1854ba445c5afa53dcbe6d6224e52d99cb73840cb58b0c5b79cd434bf.
//
// Solidity: event UndelegateLockupDurationUpdated(uint256 indexed _undelegateLockupDuration)
func (_DelegateManagerV2 *DelegateManagerV2Filterer) FilterUndelegateLockupDurationUpdated(opts *bind.FilterOpts, _undelegateLockupDuration []*big.Int) (*DelegateManagerV2UndelegateLockupDurationUpdatedIterator, error) {

	var _undelegateLockupDurationRule []interface{}
	for _, _undelegateLockupDurationItem := range _undelegateLockupDuration {
		_undelegateLockupDurationRule = append(_undelegateLockupDurationRule, _undelegateLockupDurationItem)
	}

	logs, sub, err := _DelegateManagerV2.contract.FilterLogs(opts, "UndelegateLockupDurationUpdated", _undelegateLockupDurationRule)
	if err != nil {
		return nil, err
	}
	return &DelegateManagerV2UndelegateLockupDurationUpdatedIterator{contract: _DelegateManagerV2.contract, event: "UndelegateLockupDurationUpdated", logs: logs, sub: sub}, nil
}

// WatchUndelegateLockupDurationUpdated is a free log subscription operation binding the contract event 0xcb0491a1854ba445c5afa53dcbe6d6224e52d99cb73840cb58b0c5b79cd434bf.
//
// Solidity: event UndelegateLockupDurationUpdated(uint256 indexed _undelegateLockupDuration)
func (_DelegateManagerV2 *DelegateManagerV2Filterer) WatchUndelegateLockupDurationUpdated(opts *bind.WatchOpts, sink chan<- *DelegateManagerV2UndelegateLockupDurationUpdated, _undelegateLockupDuration []*big.Int) (event.Subscription, error) {

	var _undelegateLockupDurationRule []interface{}
	for _, _undelegateLockupDurationItem := range _undelegateLockupDuration {
		_undelegateLockupDurationRule = append(_undelegateLockupDurationRule, _undelegateLockupDurationItem)
	}

	logs, sub, err := _DelegateManagerV2.contract.WatchLogs(opts, "UndelegateLockupDurationUpdated", _undelegateLockupDurationRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(DelegateManagerV2UndelegateLockupDurationUpdated)
				if err := _DelegateManagerV2.contract.UnpackLog(event, "UndelegateLockupDurationUpdated", log); err != nil {
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

// ParseUndelegateLockupDurationUpdated is a log parse operation binding the contract event 0xcb0491a1854ba445c5afa53dcbe6d6224e52d99cb73840cb58b0c5b79cd434bf.
//
// Solidity: event UndelegateLockupDurationUpdated(uint256 indexed _undelegateLockupDuration)
func (_DelegateManagerV2 *DelegateManagerV2Filterer) ParseUndelegateLockupDurationUpdated(log types.Log) (*DelegateManagerV2UndelegateLockupDurationUpdated, error) {
	event := new(DelegateManagerV2UndelegateLockupDurationUpdated)
	if err := _DelegateManagerV2.contract.UnpackLog(event, "UndelegateLockupDurationUpdated", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// DelegateManagerV2UndelegateStakeRequestCancelledIterator is returned from FilterUndelegateStakeRequestCancelled and is used to iterate over the raw logs and unpacked data for UndelegateStakeRequestCancelled events raised by the DelegateManagerV2 contract.
type DelegateManagerV2UndelegateStakeRequestCancelledIterator struct {
	Event *DelegateManagerV2UndelegateStakeRequestCancelled // Event containing the contract specifics and raw log

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
func (it *DelegateManagerV2UndelegateStakeRequestCancelledIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(DelegateManagerV2UndelegateStakeRequestCancelled)
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
		it.Event = new(DelegateManagerV2UndelegateStakeRequestCancelled)
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
func (it *DelegateManagerV2UndelegateStakeRequestCancelledIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *DelegateManagerV2UndelegateStakeRequestCancelledIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// DelegateManagerV2UndelegateStakeRequestCancelled represents a UndelegateStakeRequestCancelled event raised by the DelegateManagerV2 contract.
type DelegateManagerV2UndelegateStakeRequestCancelled struct {
	Delegator       common.Address
	ServiceProvider common.Address
	Amount          *big.Int
	Raw             types.Log // Blockchain specific contextual infos
}

// FilterUndelegateStakeRequestCancelled is a free log retrieval operation binding the contract event 0xdd2f922d72fb35f887498001c4c6bc61a53f40a51ad38c576e092bc7c6883523.
//
// Solidity: event UndelegateStakeRequestCancelled(address indexed _delegator, address indexed _serviceProvider, uint256 indexed _amount)
func (_DelegateManagerV2 *DelegateManagerV2Filterer) FilterUndelegateStakeRequestCancelled(opts *bind.FilterOpts, _delegator []common.Address, _serviceProvider []common.Address, _amount []*big.Int) (*DelegateManagerV2UndelegateStakeRequestCancelledIterator, error) {

	var _delegatorRule []interface{}
	for _, _delegatorItem := range _delegator {
		_delegatorRule = append(_delegatorRule, _delegatorItem)
	}
	var _serviceProviderRule []interface{}
	for _, _serviceProviderItem := range _serviceProvider {
		_serviceProviderRule = append(_serviceProviderRule, _serviceProviderItem)
	}
	var _amountRule []interface{}
	for _, _amountItem := range _amount {
		_amountRule = append(_amountRule, _amountItem)
	}

	logs, sub, err := _DelegateManagerV2.contract.FilterLogs(opts, "UndelegateStakeRequestCancelled", _delegatorRule, _serviceProviderRule, _amountRule)
	if err != nil {
		return nil, err
	}
	return &DelegateManagerV2UndelegateStakeRequestCancelledIterator{contract: _DelegateManagerV2.contract, event: "UndelegateStakeRequestCancelled", logs: logs, sub: sub}, nil
}

// WatchUndelegateStakeRequestCancelled is a free log subscription operation binding the contract event 0xdd2f922d72fb35f887498001c4c6bc61a53f40a51ad38c576e092bc7c6883523.
//
// Solidity: event UndelegateStakeRequestCancelled(address indexed _delegator, address indexed _serviceProvider, uint256 indexed _amount)
func (_DelegateManagerV2 *DelegateManagerV2Filterer) WatchUndelegateStakeRequestCancelled(opts *bind.WatchOpts, sink chan<- *DelegateManagerV2UndelegateStakeRequestCancelled, _delegator []common.Address, _serviceProvider []common.Address, _amount []*big.Int) (event.Subscription, error) {

	var _delegatorRule []interface{}
	for _, _delegatorItem := range _delegator {
		_delegatorRule = append(_delegatorRule, _delegatorItem)
	}
	var _serviceProviderRule []interface{}
	for _, _serviceProviderItem := range _serviceProvider {
		_serviceProviderRule = append(_serviceProviderRule, _serviceProviderItem)
	}
	var _amountRule []interface{}
	for _, _amountItem := range _amount {
		_amountRule = append(_amountRule, _amountItem)
	}

	logs, sub, err := _DelegateManagerV2.contract.WatchLogs(opts, "UndelegateStakeRequestCancelled", _delegatorRule, _serviceProviderRule, _amountRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(DelegateManagerV2UndelegateStakeRequestCancelled)
				if err := _DelegateManagerV2.contract.UnpackLog(event, "UndelegateStakeRequestCancelled", log); err != nil {
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

// ParseUndelegateStakeRequestCancelled is a log parse operation binding the contract event 0xdd2f922d72fb35f887498001c4c6bc61a53f40a51ad38c576e092bc7c6883523.
//
// Solidity: event UndelegateStakeRequestCancelled(address indexed _delegator, address indexed _serviceProvider, uint256 indexed _amount)
func (_DelegateManagerV2 *DelegateManagerV2Filterer) ParseUndelegateStakeRequestCancelled(log types.Log) (*DelegateManagerV2UndelegateStakeRequestCancelled, error) {
	event := new(DelegateManagerV2UndelegateStakeRequestCancelled)
	if err := _DelegateManagerV2.contract.UnpackLog(event, "UndelegateStakeRequestCancelled", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// DelegateManagerV2UndelegateStakeRequestEvaluatedIterator is returned from FilterUndelegateStakeRequestEvaluated and is used to iterate over the raw logs and unpacked data for UndelegateStakeRequestEvaluated events raised by the DelegateManagerV2 contract.
type DelegateManagerV2UndelegateStakeRequestEvaluatedIterator struct {
	Event *DelegateManagerV2UndelegateStakeRequestEvaluated // Event containing the contract specifics and raw log

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
func (it *DelegateManagerV2UndelegateStakeRequestEvaluatedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(DelegateManagerV2UndelegateStakeRequestEvaluated)
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
		it.Event = new(DelegateManagerV2UndelegateStakeRequestEvaluated)
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
func (it *DelegateManagerV2UndelegateStakeRequestEvaluatedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *DelegateManagerV2UndelegateStakeRequestEvaluatedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// DelegateManagerV2UndelegateStakeRequestEvaluated represents a UndelegateStakeRequestEvaluated event raised by the DelegateManagerV2 contract.
type DelegateManagerV2UndelegateStakeRequestEvaluated struct {
	Delegator       common.Address
	ServiceProvider common.Address
	Amount          *big.Int
	Raw             types.Log // Blockchain specific contextual infos
}

// FilterUndelegateStakeRequestEvaluated is a free log retrieval operation binding the contract event 0xdf026d8db1c407002e7abde612fb40b6031db7aa35d4b3b699d07627f891e631.
//
// Solidity: event UndelegateStakeRequestEvaluated(address indexed _delegator, address indexed _serviceProvider, uint256 indexed _amount)
func (_DelegateManagerV2 *DelegateManagerV2Filterer) FilterUndelegateStakeRequestEvaluated(opts *bind.FilterOpts, _delegator []common.Address, _serviceProvider []common.Address, _amount []*big.Int) (*DelegateManagerV2UndelegateStakeRequestEvaluatedIterator, error) {

	var _delegatorRule []interface{}
	for _, _delegatorItem := range _delegator {
		_delegatorRule = append(_delegatorRule, _delegatorItem)
	}
	var _serviceProviderRule []interface{}
	for _, _serviceProviderItem := range _serviceProvider {
		_serviceProviderRule = append(_serviceProviderRule, _serviceProviderItem)
	}
	var _amountRule []interface{}
	for _, _amountItem := range _amount {
		_amountRule = append(_amountRule, _amountItem)
	}

	logs, sub, err := _DelegateManagerV2.contract.FilterLogs(opts, "UndelegateStakeRequestEvaluated", _delegatorRule, _serviceProviderRule, _amountRule)
	if err != nil {
		return nil, err
	}
	return &DelegateManagerV2UndelegateStakeRequestEvaluatedIterator{contract: _DelegateManagerV2.contract, event: "UndelegateStakeRequestEvaluated", logs: logs, sub: sub}, nil
}

// WatchUndelegateStakeRequestEvaluated is a free log subscription operation binding the contract event 0xdf026d8db1c407002e7abde612fb40b6031db7aa35d4b3b699d07627f891e631.
//
// Solidity: event UndelegateStakeRequestEvaluated(address indexed _delegator, address indexed _serviceProvider, uint256 indexed _amount)
func (_DelegateManagerV2 *DelegateManagerV2Filterer) WatchUndelegateStakeRequestEvaluated(opts *bind.WatchOpts, sink chan<- *DelegateManagerV2UndelegateStakeRequestEvaluated, _delegator []common.Address, _serviceProvider []common.Address, _amount []*big.Int) (event.Subscription, error) {

	var _delegatorRule []interface{}
	for _, _delegatorItem := range _delegator {
		_delegatorRule = append(_delegatorRule, _delegatorItem)
	}
	var _serviceProviderRule []interface{}
	for _, _serviceProviderItem := range _serviceProvider {
		_serviceProviderRule = append(_serviceProviderRule, _serviceProviderItem)
	}
	var _amountRule []interface{}
	for _, _amountItem := range _amount {
		_amountRule = append(_amountRule, _amountItem)
	}

	logs, sub, err := _DelegateManagerV2.contract.WatchLogs(opts, "UndelegateStakeRequestEvaluated", _delegatorRule, _serviceProviderRule, _amountRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(DelegateManagerV2UndelegateStakeRequestEvaluated)
				if err := _DelegateManagerV2.contract.UnpackLog(event, "UndelegateStakeRequestEvaluated", log); err != nil {
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

// ParseUndelegateStakeRequestEvaluated is a log parse operation binding the contract event 0xdf026d8db1c407002e7abde612fb40b6031db7aa35d4b3b699d07627f891e631.
//
// Solidity: event UndelegateStakeRequestEvaluated(address indexed _delegator, address indexed _serviceProvider, uint256 indexed _amount)
func (_DelegateManagerV2 *DelegateManagerV2Filterer) ParseUndelegateStakeRequestEvaluated(log types.Log) (*DelegateManagerV2UndelegateStakeRequestEvaluated, error) {
	event := new(DelegateManagerV2UndelegateStakeRequestEvaluated)
	if err := _DelegateManagerV2.contract.UnpackLog(event, "UndelegateStakeRequestEvaluated", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// DelegateManagerV2UndelegateStakeRequestedIterator is returned from FilterUndelegateStakeRequested and is used to iterate over the raw logs and unpacked data for UndelegateStakeRequested events raised by the DelegateManagerV2 contract.
type DelegateManagerV2UndelegateStakeRequestedIterator struct {
	Event *DelegateManagerV2UndelegateStakeRequested // Event containing the contract specifics and raw log

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
func (it *DelegateManagerV2UndelegateStakeRequestedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(DelegateManagerV2UndelegateStakeRequested)
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
		it.Event = new(DelegateManagerV2UndelegateStakeRequested)
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
func (it *DelegateManagerV2UndelegateStakeRequestedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *DelegateManagerV2UndelegateStakeRequestedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// DelegateManagerV2UndelegateStakeRequested represents a UndelegateStakeRequested event raised by the DelegateManagerV2 contract.
type DelegateManagerV2UndelegateStakeRequested struct {
	Delegator         common.Address
	ServiceProvider   common.Address
	Amount            *big.Int
	LockupExpiryBlock *big.Int
	Raw               types.Log // Blockchain specific contextual infos
}

// FilterUndelegateStakeRequested is a free log retrieval operation binding the contract event 0x0c0ebdfe3f3ccdb3ad070f98a3fb9656a7b8781c299a5c0cd0f37e4d5a02556d.
//
// Solidity: event UndelegateStakeRequested(address indexed _delegator, address indexed _serviceProvider, uint256 indexed _amount, uint256 _lockupExpiryBlock)
func (_DelegateManagerV2 *DelegateManagerV2Filterer) FilterUndelegateStakeRequested(opts *bind.FilterOpts, _delegator []common.Address, _serviceProvider []common.Address, _amount []*big.Int) (*DelegateManagerV2UndelegateStakeRequestedIterator, error) {

	var _delegatorRule []interface{}
	for _, _delegatorItem := range _delegator {
		_delegatorRule = append(_delegatorRule, _delegatorItem)
	}
	var _serviceProviderRule []interface{}
	for _, _serviceProviderItem := range _serviceProvider {
		_serviceProviderRule = append(_serviceProviderRule, _serviceProviderItem)
	}
	var _amountRule []interface{}
	for _, _amountItem := range _amount {
		_amountRule = append(_amountRule, _amountItem)
	}

	logs, sub, err := _DelegateManagerV2.contract.FilterLogs(opts, "UndelegateStakeRequested", _delegatorRule, _serviceProviderRule, _amountRule)
	if err != nil {
		return nil, err
	}
	return &DelegateManagerV2UndelegateStakeRequestedIterator{contract: _DelegateManagerV2.contract, event: "UndelegateStakeRequested", logs: logs, sub: sub}, nil
}

// WatchUndelegateStakeRequested is a free log subscription operation binding the contract event 0x0c0ebdfe3f3ccdb3ad070f98a3fb9656a7b8781c299a5c0cd0f37e4d5a02556d.
//
// Solidity: event UndelegateStakeRequested(address indexed _delegator, address indexed _serviceProvider, uint256 indexed _amount, uint256 _lockupExpiryBlock)
func (_DelegateManagerV2 *DelegateManagerV2Filterer) WatchUndelegateStakeRequested(opts *bind.WatchOpts, sink chan<- *DelegateManagerV2UndelegateStakeRequested, _delegator []common.Address, _serviceProvider []common.Address, _amount []*big.Int) (event.Subscription, error) {

	var _delegatorRule []interface{}
	for _, _delegatorItem := range _delegator {
		_delegatorRule = append(_delegatorRule, _delegatorItem)
	}
	var _serviceProviderRule []interface{}
	for _, _serviceProviderItem := range _serviceProvider {
		_serviceProviderRule = append(_serviceProviderRule, _serviceProviderItem)
	}
	var _amountRule []interface{}
	for _, _amountItem := range _amount {
		_amountRule = append(_amountRule, _amountItem)
	}

	logs, sub, err := _DelegateManagerV2.contract.WatchLogs(opts, "UndelegateStakeRequested", _delegatorRule, _serviceProviderRule, _amountRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(DelegateManagerV2UndelegateStakeRequested)
				if err := _DelegateManagerV2.contract.UnpackLog(event, "UndelegateStakeRequested", log); err != nil {
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

// ParseUndelegateStakeRequested is a log parse operation binding the contract event 0x0c0ebdfe3f3ccdb3ad070f98a3fb9656a7b8781c299a5c0cd0f37e4d5a02556d.
//
// Solidity: event UndelegateStakeRequested(address indexed _delegator, address indexed _serviceProvider, uint256 indexed _amount, uint256 _lockupExpiryBlock)
func (_DelegateManagerV2 *DelegateManagerV2Filterer) ParseUndelegateStakeRequested(log types.Log) (*DelegateManagerV2UndelegateStakeRequested, error) {
	event := new(DelegateManagerV2UndelegateStakeRequested)
	if err := _DelegateManagerV2.contract.UnpackLog(event, "UndelegateStakeRequested", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}
