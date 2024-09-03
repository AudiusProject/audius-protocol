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

// DelegateManagerMetaData contains all meta data concerning the DelegateManager contract.
var DelegateManagerMetaData = &bind.MetaData{
	ABI: "[{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"_claimer\",\"type\":\"address\"},{\"indexed\":true,\"internalType\":\"uint256\",\"name\":\"_rewards\",\"type\":\"uint256\"},{\"indexed\":true,\"internalType\":\"uint256\",\"name\":\"_newTotal\",\"type\":\"uint256\"}],\"name\":\"Claim\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"_newClaimsManagerAddress\",\"type\":\"address\"}],\"name\":\"ClaimsManagerAddressUpdated\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"_newGovernanceAddress\",\"type\":\"address\"}],\"name\":\"GovernanceAddressUpdated\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"_delegator\",\"type\":\"address\"},{\"indexed\":true,\"internalType\":\"address\",\"name\":\"_serviceProvider\",\"type\":\"address\"},{\"indexed\":true,\"internalType\":\"uint256\",\"name\":\"_increaseAmount\",\"type\":\"uint256\"}],\"name\":\"IncreaseDelegatedStake\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"uint256\",\"name\":\"_maxDelegators\",\"type\":\"uint256\"}],\"name\":\"MaxDelegatorsUpdated\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"uint256\",\"name\":\"_minDelegationAmount\",\"type\":\"uint256\"}],\"name\":\"MinDelegationUpdated\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"uint256\",\"name\":\"_removeDelegatorEvalDuration\",\"type\":\"uint256\"}],\"name\":\"RemoveDelegatorEvalDurationUpdated\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"uint256\",\"name\":\"_removeDelegatorLockupDuration\",\"type\":\"uint256\"}],\"name\":\"RemoveDelegatorLockupDurationUpdated\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"_serviceProvider\",\"type\":\"address\"},{\"indexed\":true,\"internalType\":\"address\",\"name\":\"_delegator\",\"type\":\"address\"}],\"name\":\"RemoveDelegatorRequestCancelled\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"_serviceProvider\",\"type\":\"address\"},{\"indexed\":true,\"internalType\":\"address\",\"name\":\"_delegator\",\"type\":\"address\"},{\"indexed\":true,\"internalType\":\"uint256\",\"name\":\"_unstakedAmount\",\"type\":\"uint256\"}],\"name\":\"RemoveDelegatorRequestEvaluated\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"_serviceProvider\",\"type\":\"address\"},{\"indexed\":true,\"internalType\":\"address\",\"name\":\"_delegator\",\"type\":\"address\"},{\"indexed\":true,\"internalType\":\"uint256\",\"name\":\"_lockupExpiryBlock\",\"type\":\"uint256\"}],\"name\":\"RemoveDelegatorRequested\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"_serviceProvider\",\"type\":\"address\"},{\"indexed\":true,\"internalType\":\"uint256\",\"name\":\"_spMinDelegationAmount\",\"type\":\"uint256\"}],\"name\":\"SPMinDelegationAmountUpdated\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"_newServiceProviderFactoryAddress\",\"type\":\"address\"}],\"name\":\"ServiceProviderFactoryAddressUpdated\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"_target\",\"type\":\"address\"},{\"indexed\":true,\"internalType\":\"uint256\",\"name\":\"_amount\",\"type\":\"uint256\"},{\"indexed\":true,\"internalType\":\"uint256\",\"name\":\"_newTotal\",\"type\":\"uint256\"}],\"name\":\"Slash\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"_newStakingAddress\",\"type\":\"address\"}],\"name\":\"StakingAddressUpdated\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"uint256\",\"name\":\"_undelegateLockupDuration\",\"type\":\"uint256\"}],\"name\":\"UndelegateLockupDurationUpdated\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"_delegator\",\"type\":\"address\"},{\"indexed\":true,\"internalType\":\"address\",\"name\":\"_serviceProvider\",\"type\":\"address\"},{\"indexed\":true,\"internalType\":\"uint256\",\"name\":\"_amount\",\"type\":\"uint256\"}],\"name\":\"UndelegateStakeRequestCancelled\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"_delegator\",\"type\":\"address\"},{\"indexed\":true,\"internalType\":\"address\",\"name\":\"_serviceProvider\",\"type\":\"address\"},{\"indexed\":true,\"internalType\":\"uint256\",\"name\":\"_amount\",\"type\":\"uint256\"}],\"name\":\"UndelegateStakeRequestEvaluated\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"_delegator\",\"type\":\"address\"},{\"indexed\":true,\"internalType\":\"address\",\"name\":\"_serviceProvider\",\"type\":\"address\"},{\"indexed\":true,\"internalType\":\"uint256\",\"name\":\"_amount\",\"type\":\"uint256\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"_lockupExpiryBlock\",\"type\":\"uint256\"}],\"name\":\"UndelegateStakeRequested\",\"type\":\"event\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"address\",\"name\":\"_tokenAddress\",\"type\":\"address\"},{\"internalType\":\"address\",\"name\":\"_governanceAddress\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"_undelegateLockupDuration\",\"type\":\"uint256\"}],\"name\":\"initialize\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[],\"name\":\"initialize\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"address\",\"name\":\"_targetSP\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"_amount\",\"type\":\"uint256\"}],\"name\":\"delegateStake\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"address\",\"name\":\"_target\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"_amount\",\"type\":\"uint256\"}],\"name\":\"requestUndelegateStake\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[],\"name\":\"cancelUndelegateStakeRequest\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[],\"name\":\"undelegateStake\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"address\",\"name\":\"_serviceProvider\",\"type\":\"address\"}],\"name\":\"claimRewards\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"_amount\",\"type\":\"uint256\"},{\"internalType\":\"address\",\"name\":\"_slashAddress\",\"type\":\"address\"}],\"name\":\"slash\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"address\",\"name\":\"_serviceProvider\",\"type\":\"address\"},{\"internalType\":\"address\",\"name\":\"_delegator\",\"type\":\"address\"}],\"name\":\"requestRemoveDelegator\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"address\",\"name\":\"_serviceProvider\",\"type\":\"address\"},{\"internalType\":\"address\",\"name\":\"_delegator\",\"type\":\"address\"}],\"name\":\"cancelRemoveDelegatorRequest\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"address\",\"name\":\"_serviceProvider\",\"type\":\"address\"},{\"internalType\":\"address\",\"name\":\"_delegator\",\"type\":\"address\"}],\"name\":\"removeDelegator\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"address\",\"name\":\"_serviceProvider\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"_spMinDelegationAmount\",\"type\":\"uint256\"}],\"name\":\"updateSPMinDelegationAmount\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"_duration\",\"type\":\"uint256\"}],\"name\":\"updateUndelegateLockupDuration\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"_maxDelegators\",\"type\":\"uint256\"}],\"name\":\"updateMaxDelegators\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"_minDelegationAmount\",\"type\":\"uint256\"}],\"name\":\"updateMinDelegationAmount\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"_duration\",\"type\":\"uint256\"}],\"name\":\"updateRemoveDelegatorLockupDuration\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"_duration\",\"type\":\"uint256\"}],\"name\":\"updateRemoveDelegatorEvalDuration\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"address\",\"name\":\"_governanceAddress\",\"type\":\"address\"}],\"name\":\"setGovernanceAddress\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"address\",\"name\":\"_stakingAddress\",\"type\":\"address\"}],\"name\":\"setStakingAddress\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"address\",\"name\":\"_spFactory\",\"type\":\"address\"}],\"name\":\"setServiceProviderFactoryAddress\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"address\",\"name\":\"_claimsManagerAddress\",\"type\":\"address\"}],\"name\":\"setClaimsManagerAddress\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[{\"internalType\":\"address\",\"name\":\"_sp\",\"type\":\"address\"}],\"name\":\"getDelegatorsList\",\"outputs\":[{\"internalType\":\"address[]\",\"name\":\"\",\"type\":\"address[]\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[{\"internalType\":\"address\",\"name\":\"_delegator\",\"type\":\"address\"}],\"name\":\"getTotalDelegatorStake\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[{\"internalType\":\"address\",\"name\":\"_sp\",\"type\":\"address\"}],\"name\":\"getTotalDelegatedToServiceProvider\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[{\"internalType\":\"address\",\"name\":\"_sp\",\"type\":\"address\"}],\"name\":\"getTotalLockedDelegationForServiceProvider\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[{\"internalType\":\"address\",\"name\":\"_delegator\",\"type\":\"address\"},{\"internalType\":\"address\",\"name\":\"_serviceProvider\",\"type\":\"address\"}],\"name\":\"getDelegatorStakeForServiceProvider\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[{\"internalType\":\"address\",\"name\":\"_delegator\",\"type\":\"address\"}],\"name\":\"getPendingUndelegateRequest\",\"outputs\":[{\"internalType\":\"address\",\"name\":\"target\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"amount\",\"type\":\"uint256\"},{\"internalType\":\"uint256\",\"name\":\"lockupExpiryBlock\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[{\"internalType\":\"address\",\"name\":\"_serviceProvider\",\"type\":\"address\"},{\"internalType\":\"address\",\"name\":\"_delegator\",\"type\":\"address\"}],\"name\":\"getPendingRemoveDelegatorRequest\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[{\"internalType\":\"address\",\"name\":\"_serviceProvider\",\"type\":\"address\"}],\"name\":\"getSPMinDelegationAmount\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"getUndelegateLockupDuration\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"getMaxDelegators\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"getMinDelegationAmount\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"getRemoveDelegatorLockupDuration\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"getRemoveDelegatorEvalDuration\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"getGovernanceAddress\",\"outputs\":[{\"internalType\":\"address\",\"name\":\"\",\"type\":\"address\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"getServiceProviderFactoryAddress\",\"outputs\":[{\"internalType\":\"address\",\"name\":\"\",\"type\":\"address\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"getClaimsManagerAddress\",\"outputs\":[{\"internalType\":\"address\",\"name\":\"\",\"type\":\"address\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"getStakingAddress\",\"outputs\":[{\"internalType\":\"address\",\"name\":\"\",\"type\":\"address\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"}]",
}

// DelegateManagerABI is the input ABI used to generate the binding from.
// Deprecated: Use DelegateManagerMetaData.ABI instead.
var DelegateManagerABI = DelegateManagerMetaData.ABI

// DelegateManager is an auto generated Go binding around an Ethereum contract.
type DelegateManager struct {
	DelegateManagerCaller     // Read-only binding to the contract
	DelegateManagerTransactor // Write-only binding to the contract
	DelegateManagerFilterer   // Log filterer for contract events
}

// DelegateManagerCaller is an auto generated read-only Go binding around an Ethereum contract.
type DelegateManagerCaller struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// DelegateManagerTransactor is an auto generated write-only Go binding around an Ethereum contract.
type DelegateManagerTransactor struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// DelegateManagerFilterer is an auto generated log filtering Go binding around an Ethereum contract events.
type DelegateManagerFilterer struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// DelegateManagerSession is an auto generated Go binding around an Ethereum contract,
// with pre-set call and transact options.
type DelegateManagerSession struct {
	Contract     *DelegateManager  // Generic contract binding to set the session for
	CallOpts     bind.CallOpts     // Call options to use throughout this session
	TransactOpts bind.TransactOpts // Transaction auth options to use throughout this session
}

// DelegateManagerCallerSession is an auto generated read-only Go binding around an Ethereum contract,
// with pre-set call options.
type DelegateManagerCallerSession struct {
	Contract *DelegateManagerCaller // Generic contract caller binding to set the session for
	CallOpts bind.CallOpts          // Call options to use throughout this session
}

// DelegateManagerTransactorSession is an auto generated write-only Go binding around an Ethereum contract,
// with pre-set transact options.
type DelegateManagerTransactorSession struct {
	Contract     *DelegateManagerTransactor // Generic contract transactor binding to set the session for
	TransactOpts bind.TransactOpts          // Transaction auth options to use throughout this session
}

// DelegateManagerRaw is an auto generated low-level Go binding around an Ethereum contract.
type DelegateManagerRaw struct {
	Contract *DelegateManager // Generic contract binding to access the raw methods on
}

// DelegateManagerCallerRaw is an auto generated low-level read-only Go binding around an Ethereum contract.
type DelegateManagerCallerRaw struct {
	Contract *DelegateManagerCaller // Generic read-only contract binding to access the raw methods on
}

// DelegateManagerTransactorRaw is an auto generated low-level write-only Go binding around an Ethereum contract.
type DelegateManagerTransactorRaw struct {
	Contract *DelegateManagerTransactor // Generic write-only contract binding to access the raw methods on
}

// NewDelegateManager creates a new instance of DelegateManager, bound to a specific deployed contract.
func NewDelegateManager(address common.Address, backend bind.ContractBackend) (*DelegateManager, error) {
	contract, err := bindDelegateManager(address, backend, backend, backend)
	if err != nil {
		return nil, err
	}
	return &DelegateManager{DelegateManagerCaller: DelegateManagerCaller{contract: contract}, DelegateManagerTransactor: DelegateManagerTransactor{contract: contract}, DelegateManagerFilterer: DelegateManagerFilterer{contract: contract}}, nil
}

// NewDelegateManagerCaller creates a new read-only instance of DelegateManager, bound to a specific deployed contract.
func NewDelegateManagerCaller(address common.Address, caller bind.ContractCaller) (*DelegateManagerCaller, error) {
	contract, err := bindDelegateManager(address, caller, nil, nil)
	if err != nil {
		return nil, err
	}
	return &DelegateManagerCaller{contract: contract}, nil
}

// NewDelegateManagerTransactor creates a new write-only instance of DelegateManager, bound to a specific deployed contract.
func NewDelegateManagerTransactor(address common.Address, transactor bind.ContractTransactor) (*DelegateManagerTransactor, error) {
	contract, err := bindDelegateManager(address, nil, transactor, nil)
	if err != nil {
		return nil, err
	}
	return &DelegateManagerTransactor{contract: contract}, nil
}

// NewDelegateManagerFilterer creates a new log filterer instance of DelegateManager, bound to a specific deployed contract.
func NewDelegateManagerFilterer(address common.Address, filterer bind.ContractFilterer) (*DelegateManagerFilterer, error) {
	contract, err := bindDelegateManager(address, nil, nil, filterer)
	if err != nil {
		return nil, err
	}
	return &DelegateManagerFilterer{contract: contract}, nil
}

// bindDelegateManager binds a generic wrapper to an already deployed contract.
func bindDelegateManager(address common.Address, caller bind.ContractCaller, transactor bind.ContractTransactor, filterer bind.ContractFilterer) (*bind.BoundContract, error) {
	parsed, err := DelegateManagerMetaData.GetAbi()
	if err != nil {
		return nil, err
	}
	return bind.NewBoundContract(address, *parsed, caller, transactor, filterer), nil
}

// Call invokes the (constant) contract method with params as input values and
// sets the output to result. The result type might be a single field for simple
// returns, a slice of interfaces for anonymous returns and a struct for named
// returns.
func (_DelegateManager *DelegateManagerRaw) Call(opts *bind.CallOpts, result *[]interface{}, method string, params ...interface{}) error {
	return _DelegateManager.Contract.DelegateManagerCaller.contract.Call(opts, result, method, params...)
}

// Transfer initiates a plain transaction to move funds to the contract, calling
// its default method if one is available.
func (_DelegateManager *DelegateManagerRaw) Transfer(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _DelegateManager.Contract.DelegateManagerTransactor.contract.Transfer(opts)
}

// Transact invokes the (paid) contract method with params as input values.
func (_DelegateManager *DelegateManagerRaw) Transact(opts *bind.TransactOpts, method string, params ...interface{}) (*types.Transaction, error) {
	return _DelegateManager.Contract.DelegateManagerTransactor.contract.Transact(opts, method, params...)
}

// Call invokes the (constant) contract method with params as input values and
// sets the output to result. The result type might be a single field for simple
// returns, a slice of interfaces for anonymous returns and a struct for named
// returns.
func (_DelegateManager *DelegateManagerCallerRaw) Call(opts *bind.CallOpts, result *[]interface{}, method string, params ...interface{}) error {
	return _DelegateManager.Contract.contract.Call(opts, result, method, params...)
}

// Transfer initiates a plain transaction to move funds to the contract, calling
// its default method if one is available.
func (_DelegateManager *DelegateManagerTransactorRaw) Transfer(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _DelegateManager.Contract.contract.Transfer(opts)
}

// Transact invokes the (paid) contract method with params as input values.
func (_DelegateManager *DelegateManagerTransactorRaw) Transact(opts *bind.TransactOpts, method string, params ...interface{}) (*types.Transaction, error) {
	return _DelegateManager.Contract.contract.Transact(opts, method, params...)
}

// GetClaimsManagerAddress is a free data retrieval call binding the contract method 0x948e5426.
//
// Solidity: function getClaimsManagerAddress() view returns(address)
func (_DelegateManager *DelegateManagerCaller) GetClaimsManagerAddress(opts *bind.CallOpts) (common.Address, error) {
	var out []interface{}
	err := _DelegateManager.contract.Call(opts, &out, "getClaimsManagerAddress")

	if err != nil {
		return *new(common.Address), err
	}

	out0 := *abi.ConvertType(out[0], new(common.Address)).(*common.Address)

	return out0, err

}

// GetClaimsManagerAddress is a free data retrieval call binding the contract method 0x948e5426.
//
// Solidity: function getClaimsManagerAddress() view returns(address)
func (_DelegateManager *DelegateManagerSession) GetClaimsManagerAddress() (common.Address, error) {
	return _DelegateManager.Contract.GetClaimsManagerAddress(&_DelegateManager.CallOpts)
}

// GetClaimsManagerAddress is a free data retrieval call binding the contract method 0x948e5426.
//
// Solidity: function getClaimsManagerAddress() view returns(address)
func (_DelegateManager *DelegateManagerCallerSession) GetClaimsManagerAddress() (common.Address, error) {
	return _DelegateManager.Contract.GetClaimsManagerAddress(&_DelegateManager.CallOpts)
}

// GetDelegatorStakeForServiceProvider is a free data retrieval call binding the contract method 0xb9ca6067.
//
// Solidity: function getDelegatorStakeForServiceProvider(address _delegator, address _serviceProvider) view returns(uint256)
func (_DelegateManager *DelegateManagerCaller) GetDelegatorStakeForServiceProvider(opts *bind.CallOpts, _delegator common.Address, _serviceProvider common.Address) (*big.Int, error) {
	var out []interface{}
	err := _DelegateManager.contract.Call(opts, &out, "getDelegatorStakeForServiceProvider", _delegator, _serviceProvider)

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

// GetDelegatorStakeForServiceProvider is a free data retrieval call binding the contract method 0xb9ca6067.
//
// Solidity: function getDelegatorStakeForServiceProvider(address _delegator, address _serviceProvider) view returns(uint256)
func (_DelegateManager *DelegateManagerSession) GetDelegatorStakeForServiceProvider(_delegator common.Address, _serviceProvider common.Address) (*big.Int, error) {
	return _DelegateManager.Contract.GetDelegatorStakeForServiceProvider(&_DelegateManager.CallOpts, _delegator, _serviceProvider)
}

// GetDelegatorStakeForServiceProvider is a free data retrieval call binding the contract method 0xb9ca6067.
//
// Solidity: function getDelegatorStakeForServiceProvider(address _delegator, address _serviceProvider) view returns(uint256)
func (_DelegateManager *DelegateManagerCallerSession) GetDelegatorStakeForServiceProvider(_delegator common.Address, _serviceProvider common.Address) (*big.Int, error) {
	return _DelegateManager.Contract.GetDelegatorStakeForServiceProvider(&_DelegateManager.CallOpts, _delegator, _serviceProvider)
}

// GetDelegatorsList is a free data retrieval call binding the contract method 0xfed3d1fd.
//
// Solidity: function getDelegatorsList(address _sp) view returns(address[])
func (_DelegateManager *DelegateManagerCaller) GetDelegatorsList(opts *bind.CallOpts, _sp common.Address) ([]common.Address, error) {
	var out []interface{}
	err := _DelegateManager.contract.Call(opts, &out, "getDelegatorsList", _sp)

	if err != nil {
		return *new([]common.Address), err
	}

	out0 := *abi.ConvertType(out[0], new([]common.Address)).(*[]common.Address)

	return out0, err

}

// GetDelegatorsList is a free data retrieval call binding the contract method 0xfed3d1fd.
//
// Solidity: function getDelegatorsList(address _sp) view returns(address[])
func (_DelegateManager *DelegateManagerSession) GetDelegatorsList(_sp common.Address) ([]common.Address, error) {
	return _DelegateManager.Contract.GetDelegatorsList(&_DelegateManager.CallOpts, _sp)
}

// GetDelegatorsList is a free data retrieval call binding the contract method 0xfed3d1fd.
//
// Solidity: function getDelegatorsList(address _sp) view returns(address[])
func (_DelegateManager *DelegateManagerCallerSession) GetDelegatorsList(_sp common.Address) ([]common.Address, error) {
	return _DelegateManager.Contract.GetDelegatorsList(&_DelegateManager.CallOpts, _sp)
}

// GetGovernanceAddress is a free data retrieval call binding the contract method 0x73252494.
//
// Solidity: function getGovernanceAddress() view returns(address)
func (_DelegateManager *DelegateManagerCaller) GetGovernanceAddress(opts *bind.CallOpts) (common.Address, error) {
	var out []interface{}
	err := _DelegateManager.contract.Call(opts, &out, "getGovernanceAddress")

	if err != nil {
		return *new(common.Address), err
	}

	out0 := *abi.ConvertType(out[0], new(common.Address)).(*common.Address)

	return out0, err

}

// GetGovernanceAddress is a free data retrieval call binding the contract method 0x73252494.
//
// Solidity: function getGovernanceAddress() view returns(address)
func (_DelegateManager *DelegateManagerSession) GetGovernanceAddress() (common.Address, error) {
	return _DelegateManager.Contract.GetGovernanceAddress(&_DelegateManager.CallOpts)
}

// GetGovernanceAddress is a free data retrieval call binding the contract method 0x73252494.
//
// Solidity: function getGovernanceAddress() view returns(address)
func (_DelegateManager *DelegateManagerCallerSession) GetGovernanceAddress() (common.Address, error) {
	return _DelegateManager.Contract.GetGovernanceAddress(&_DelegateManager.CallOpts)
}

// GetMaxDelegators is a free data retrieval call binding the contract method 0x15fe4070.
//
// Solidity: function getMaxDelegators() view returns(uint256)
func (_DelegateManager *DelegateManagerCaller) GetMaxDelegators(opts *bind.CallOpts) (*big.Int, error) {
	var out []interface{}
	err := _DelegateManager.contract.Call(opts, &out, "getMaxDelegators")

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

// GetMaxDelegators is a free data retrieval call binding the contract method 0x15fe4070.
//
// Solidity: function getMaxDelegators() view returns(uint256)
func (_DelegateManager *DelegateManagerSession) GetMaxDelegators() (*big.Int, error) {
	return _DelegateManager.Contract.GetMaxDelegators(&_DelegateManager.CallOpts)
}

// GetMaxDelegators is a free data retrieval call binding the contract method 0x15fe4070.
//
// Solidity: function getMaxDelegators() view returns(uint256)
func (_DelegateManager *DelegateManagerCallerSession) GetMaxDelegators() (*big.Int, error) {
	return _DelegateManager.Contract.GetMaxDelegators(&_DelegateManager.CallOpts)
}

// GetMinDelegationAmount is a free data retrieval call binding the contract method 0xb11caba5.
//
// Solidity: function getMinDelegationAmount() view returns(uint256)
func (_DelegateManager *DelegateManagerCaller) GetMinDelegationAmount(opts *bind.CallOpts) (*big.Int, error) {
	var out []interface{}
	err := _DelegateManager.contract.Call(opts, &out, "getMinDelegationAmount")

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

// GetMinDelegationAmount is a free data retrieval call binding the contract method 0xb11caba5.
//
// Solidity: function getMinDelegationAmount() view returns(uint256)
func (_DelegateManager *DelegateManagerSession) GetMinDelegationAmount() (*big.Int, error) {
	return _DelegateManager.Contract.GetMinDelegationAmount(&_DelegateManager.CallOpts)
}

// GetMinDelegationAmount is a free data retrieval call binding the contract method 0xb11caba5.
//
// Solidity: function getMinDelegationAmount() view returns(uint256)
func (_DelegateManager *DelegateManagerCallerSession) GetMinDelegationAmount() (*big.Int, error) {
	return _DelegateManager.Contract.GetMinDelegationAmount(&_DelegateManager.CallOpts)
}

// GetPendingRemoveDelegatorRequest is a free data retrieval call binding the contract method 0x4a551fe7.
//
// Solidity: function getPendingRemoveDelegatorRequest(address _serviceProvider, address _delegator) view returns(uint256)
func (_DelegateManager *DelegateManagerCaller) GetPendingRemoveDelegatorRequest(opts *bind.CallOpts, _serviceProvider common.Address, _delegator common.Address) (*big.Int, error) {
	var out []interface{}
	err := _DelegateManager.contract.Call(opts, &out, "getPendingRemoveDelegatorRequest", _serviceProvider, _delegator)

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

// GetPendingRemoveDelegatorRequest is a free data retrieval call binding the contract method 0x4a551fe7.
//
// Solidity: function getPendingRemoveDelegatorRequest(address _serviceProvider, address _delegator) view returns(uint256)
func (_DelegateManager *DelegateManagerSession) GetPendingRemoveDelegatorRequest(_serviceProvider common.Address, _delegator common.Address) (*big.Int, error) {
	return _DelegateManager.Contract.GetPendingRemoveDelegatorRequest(&_DelegateManager.CallOpts, _serviceProvider, _delegator)
}

// GetPendingRemoveDelegatorRequest is a free data retrieval call binding the contract method 0x4a551fe7.
//
// Solidity: function getPendingRemoveDelegatorRequest(address _serviceProvider, address _delegator) view returns(uint256)
func (_DelegateManager *DelegateManagerCallerSession) GetPendingRemoveDelegatorRequest(_serviceProvider common.Address, _delegator common.Address) (*big.Int, error) {
	return _DelegateManager.Contract.GetPendingRemoveDelegatorRequest(&_DelegateManager.CallOpts, _serviceProvider, _delegator)
}

// GetPendingUndelegateRequest is a free data retrieval call binding the contract method 0x9336086f.
//
// Solidity: function getPendingUndelegateRequest(address _delegator) view returns(address target, uint256 amount, uint256 lockupExpiryBlock)
func (_DelegateManager *DelegateManagerCaller) GetPendingUndelegateRequest(opts *bind.CallOpts, _delegator common.Address) (struct {
	Target            common.Address
	Amount            *big.Int
	LockupExpiryBlock *big.Int
}, error) {
	var out []interface{}
	err := _DelegateManager.contract.Call(opts, &out, "getPendingUndelegateRequest", _delegator)

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
func (_DelegateManager *DelegateManagerSession) GetPendingUndelegateRequest(_delegator common.Address) (struct {
	Target            common.Address
	Amount            *big.Int
	LockupExpiryBlock *big.Int
}, error) {
	return _DelegateManager.Contract.GetPendingUndelegateRequest(&_DelegateManager.CallOpts, _delegator)
}

// GetPendingUndelegateRequest is a free data retrieval call binding the contract method 0x9336086f.
//
// Solidity: function getPendingUndelegateRequest(address _delegator) view returns(address target, uint256 amount, uint256 lockupExpiryBlock)
func (_DelegateManager *DelegateManagerCallerSession) GetPendingUndelegateRequest(_delegator common.Address) (struct {
	Target            common.Address
	Amount            *big.Int
	LockupExpiryBlock *big.Int
}, error) {
	return _DelegateManager.Contract.GetPendingUndelegateRequest(&_DelegateManager.CallOpts, _delegator)
}

// GetRemoveDelegatorEvalDuration is a free data retrieval call binding the contract method 0x9d974fb5.
//
// Solidity: function getRemoveDelegatorEvalDuration() view returns(uint256)
func (_DelegateManager *DelegateManagerCaller) GetRemoveDelegatorEvalDuration(opts *bind.CallOpts) (*big.Int, error) {
	var out []interface{}
	err := _DelegateManager.contract.Call(opts, &out, "getRemoveDelegatorEvalDuration")

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

// GetRemoveDelegatorEvalDuration is a free data retrieval call binding the contract method 0x9d974fb5.
//
// Solidity: function getRemoveDelegatorEvalDuration() view returns(uint256)
func (_DelegateManager *DelegateManagerSession) GetRemoveDelegatorEvalDuration() (*big.Int, error) {
	return _DelegateManager.Contract.GetRemoveDelegatorEvalDuration(&_DelegateManager.CallOpts)
}

// GetRemoveDelegatorEvalDuration is a free data retrieval call binding the contract method 0x9d974fb5.
//
// Solidity: function getRemoveDelegatorEvalDuration() view returns(uint256)
func (_DelegateManager *DelegateManagerCallerSession) GetRemoveDelegatorEvalDuration() (*big.Int, error) {
	return _DelegateManager.Contract.GetRemoveDelegatorEvalDuration(&_DelegateManager.CallOpts)
}

// GetRemoveDelegatorLockupDuration is a free data retrieval call binding the contract method 0x82d51e2c.
//
// Solidity: function getRemoveDelegatorLockupDuration() view returns(uint256)
func (_DelegateManager *DelegateManagerCaller) GetRemoveDelegatorLockupDuration(opts *bind.CallOpts) (*big.Int, error) {
	var out []interface{}
	err := _DelegateManager.contract.Call(opts, &out, "getRemoveDelegatorLockupDuration")

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

// GetRemoveDelegatorLockupDuration is a free data retrieval call binding the contract method 0x82d51e2c.
//
// Solidity: function getRemoveDelegatorLockupDuration() view returns(uint256)
func (_DelegateManager *DelegateManagerSession) GetRemoveDelegatorLockupDuration() (*big.Int, error) {
	return _DelegateManager.Contract.GetRemoveDelegatorLockupDuration(&_DelegateManager.CallOpts)
}

// GetRemoveDelegatorLockupDuration is a free data retrieval call binding the contract method 0x82d51e2c.
//
// Solidity: function getRemoveDelegatorLockupDuration() view returns(uint256)
func (_DelegateManager *DelegateManagerCallerSession) GetRemoveDelegatorLockupDuration() (*big.Int, error) {
	return _DelegateManager.Contract.GetRemoveDelegatorLockupDuration(&_DelegateManager.CallOpts)
}

// GetSPMinDelegationAmount is a free data retrieval call binding the contract method 0xca31b4b5.
//
// Solidity: function getSPMinDelegationAmount(address _serviceProvider) view returns(uint256)
func (_DelegateManager *DelegateManagerCaller) GetSPMinDelegationAmount(opts *bind.CallOpts, _serviceProvider common.Address) (*big.Int, error) {
	var out []interface{}
	err := _DelegateManager.contract.Call(opts, &out, "getSPMinDelegationAmount", _serviceProvider)

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

// GetSPMinDelegationAmount is a free data retrieval call binding the contract method 0xca31b4b5.
//
// Solidity: function getSPMinDelegationAmount(address _serviceProvider) view returns(uint256)
func (_DelegateManager *DelegateManagerSession) GetSPMinDelegationAmount(_serviceProvider common.Address) (*big.Int, error) {
	return _DelegateManager.Contract.GetSPMinDelegationAmount(&_DelegateManager.CallOpts, _serviceProvider)
}

// GetSPMinDelegationAmount is a free data retrieval call binding the contract method 0xca31b4b5.
//
// Solidity: function getSPMinDelegationAmount(address _serviceProvider) view returns(uint256)
func (_DelegateManager *DelegateManagerCallerSession) GetSPMinDelegationAmount(_serviceProvider common.Address) (*big.Int, error) {
	return _DelegateManager.Contract.GetSPMinDelegationAmount(&_DelegateManager.CallOpts, _serviceProvider)
}

// GetServiceProviderFactoryAddress is a free data retrieval call binding the contract method 0x002ae74a.
//
// Solidity: function getServiceProviderFactoryAddress() view returns(address)
func (_DelegateManager *DelegateManagerCaller) GetServiceProviderFactoryAddress(opts *bind.CallOpts) (common.Address, error) {
	var out []interface{}
	err := _DelegateManager.contract.Call(opts, &out, "getServiceProviderFactoryAddress")

	if err != nil {
		return *new(common.Address), err
	}

	out0 := *abi.ConvertType(out[0], new(common.Address)).(*common.Address)

	return out0, err

}

// GetServiceProviderFactoryAddress is a free data retrieval call binding the contract method 0x002ae74a.
//
// Solidity: function getServiceProviderFactoryAddress() view returns(address)
func (_DelegateManager *DelegateManagerSession) GetServiceProviderFactoryAddress() (common.Address, error) {
	return _DelegateManager.Contract.GetServiceProviderFactoryAddress(&_DelegateManager.CallOpts)
}

// GetServiceProviderFactoryAddress is a free data retrieval call binding the contract method 0x002ae74a.
//
// Solidity: function getServiceProviderFactoryAddress() view returns(address)
func (_DelegateManager *DelegateManagerCallerSession) GetServiceProviderFactoryAddress() (common.Address, error) {
	return _DelegateManager.Contract.GetServiceProviderFactoryAddress(&_DelegateManager.CallOpts)
}

// GetStakingAddress is a free data retrieval call binding the contract method 0x0e9ed68b.
//
// Solidity: function getStakingAddress() view returns(address)
func (_DelegateManager *DelegateManagerCaller) GetStakingAddress(opts *bind.CallOpts) (common.Address, error) {
	var out []interface{}
	err := _DelegateManager.contract.Call(opts, &out, "getStakingAddress")

	if err != nil {
		return *new(common.Address), err
	}

	out0 := *abi.ConvertType(out[0], new(common.Address)).(*common.Address)

	return out0, err

}

// GetStakingAddress is a free data retrieval call binding the contract method 0x0e9ed68b.
//
// Solidity: function getStakingAddress() view returns(address)
func (_DelegateManager *DelegateManagerSession) GetStakingAddress() (common.Address, error) {
	return _DelegateManager.Contract.GetStakingAddress(&_DelegateManager.CallOpts)
}

// GetStakingAddress is a free data retrieval call binding the contract method 0x0e9ed68b.
//
// Solidity: function getStakingAddress() view returns(address)
func (_DelegateManager *DelegateManagerCallerSession) GetStakingAddress() (common.Address, error) {
	return _DelegateManager.Contract.GetStakingAddress(&_DelegateManager.CallOpts)
}

// GetTotalDelegatedToServiceProvider is a free data retrieval call binding the contract method 0x8504f188.
//
// Solidity: function getTotalDelegatedToServiceProvider(address _sp) view returns(uint256)
func (_DelegateManager *DelegateManagerCaller) GetTotalDelegatedToServiceProvider(opts *bind.CallOpts, _sp common.Address) (*big.Int, error) {
	var out []interface{}
	err := _DelegateManager.contract.Call(opts, &out, "getTotalDelegatedToServiceProvider", _sp)

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

// GetTotalDelegatedToServiceProvider is a free data retrieval call binding the contract method 0x8504f188.
//
// Solidity: function getTotalDelegatedToServiceProvider(address _sp) view returns(uint256)
func (_DelegateManager *DelegateManagerSession) GetTotalDelegatedToServiceProvider(_sp common.Address) (*big.Int, error) {
	return _DelegateManager.Contract.GetTotalDelegatedToServiceProvider(&_DelegateManager.CallOpts, _sp)
}

// GetTotalDelegatedToServiceProvider is a free data retrieval call binding the contract method 0x8504f188.
//
// Solidity: function getTotalDelegatedToServiceProvider(address _sp) view returns(uint256)
func (_DelegateManager *DelegateManagerCallerSession) GetTotalDelegatedToServiceProvider(_sp common.Address) (*big.Int, error) {
	return _DelegateManager.Contract.GetTotalDelegatedToServiceProvider(&_DelegateManager.CallOpts, _sp)
}

// GetTotalDelegatorStake is a free data retrieval call binding the contract method 0xb0303b75.
//
// Solidity: function getTotalDelegatorStake(address _delegator) view returns(uint256)
func (_DelegateManager *DelegateManagerCaller) GetTotalDelegatorStake(opts *bind.CallOpts, _delegator common.Address) (*big.Int, error) {
	var out []interface{}
	err := _DelegateManager.contract.Call(opts, &out, "getTotalDelegatorStake", _delegator)

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

// GetTotalDelegatorStake is a free data retrieval call binding the contract method 0xb0303b75.
//
// Solidity: function getTotalDelegatorStake(address _delegator) view returns(uint256)
func (_DelegateManager *DelegateManagerSession) GetTotalDelegatorStake(_delegator common.Address) (*big.Int, error) {
	return _DelegateManager.Contract.GetTotalDelegatorStake(&_DelegateManager.CallOpts, _delegator)
}

// GetTotalDelegatorStake is a free data retrieval call binding the contract method 0xb0303b75.
//
// Solidity: function getTotalDelegatorStake(address _delegator) view returns(uint256)
func (_DelegateManager *DelegateManagerCallerSession) GetTotalDelegatorStake(_delegator common.Address) (*big.Int, error) {
	return _DelegateManager.Contract.GetTotalDelegatorStake(&_DelegateManager.CallOpts, _delegator)
}

// GetTotalLockedDelegationForServiceProvider is a free data retrieval call binding the contract method 0x7dc1eeba.
//
// Solidity: function getTotalLockedDelegationForServiceProvider(address _sp) view returns(uint256)
func (_DelegateManager *DelegateManagerCaller) GetTotalLockedDelegationForServiceProvider(opts *bind.CallOpts, _sp common.Address) (*big.Int, error) {
	var out []interface{}
	err := _DelegateManager.contract.Call(opts, &out, "getTotalLockedDelegationForServiceProvider", _sp)

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

// GetTotalLockedDelegationForServiceProvider is a free data retrieval call binding the contract method 0x7dc1eeba.
//
// Solidity: function getTotalLockedDelegationForServiceProvider(address _sp) view returns(uint256)
func (_DelegateManager *DelegateManagerSession) GetTotalLockedDelegationForServiceProvider(_sp common.Address) (*big.Int, error) {
	return _DelegateManager.Contract.GetTotalLockedDelegationForServiceProvider(&_DelegateManager.CallOpts, _sp)
}

// GetTotalLockedDelegationForServiceProvider is a free data retrieval call binding the contract method 0x7dc1eeba.
//
// Solidity: function getTotalLockedDelegationForServiceProvider(address _sp) view returns(uint256)
func (_DelegateManager *DelegateManagerCallerSession) GetTotalLockedDelegationForServiceProvider(_sp common.Address) (*big.Int, error) {
	return _DelegateManager.Contract.GetTotalLockedDelegationForServiceProvider(&_DelegateManager.CallOpts, _sp)
}

// GetUndelegateLockupDuration is a free data retrieval call binding the contract method 0x09a945a0.
//
// Solidity: function getUndelegateLockupDuration() view returns(uint256)
func (_DelegateManager *DelegateManagerCaller) GetUndelegateLockupDuration(opts *bind.CallOpts) (*big.Int, error) {
	var out []interface{}
	err := _DelegateManager.contract.Call(opts, &out, "getUndelegateLockupDuration")

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

// GetUndelegateLockupDuration is a free data retrieval call binding the contract method 0x09a945a0.
//
// Solidity: function getUndelegateLockupDuration() view returns(uint256)
func (_DelegateManager *DelegateManagerSession) GetUndelegateLockupDuration() (*big.Int, error) {
	return _DelegateManager.Contract.GetUndelegateLockupDuration(&_DelegateManager.CallOpts)
}

// GetUndelegateLockupDuration is a free data retrieval call binding the contract method 0x09a945a0.
//
// Solidity: function getUndelegateLockupDuration() view returns(uint256)
func (_DelegateManager *DelegateManagerCallerSession) GetUndelegateLockupDuration() (*big.Int, error) {
	return _DelegateManager.Contract.GetUndelegateLockupDuration(&_DelegateManager.CallOpts)
}

// CancelRemoveDelegatorRequest is a paid mutator transaction binding the contract method 0x1d0f283a.
//
// Solidity: function cancelRemoveDelegatorRequest(address _serviceProvider, address _delegator) returns()
func (_DelegateManager *DelegateManagerTransactor) CancelRemoveDelegatorRequest(opts *bind.TransactOpts, _serviceProvider common.Address, _delegator common.Address) (*types.Transaction, error) {
	return _DelegateManager.contract.Transact(opts, "cancelRemoveDelegatorRequest", _serviceProvider, _delegator)
}

// CancelRemoveDelegatorRequest is a paid mutator transaction binding the contract method 0x1d0f283a.
//
// Solidity: function cancelRemoveDelegatorRequest(address _serviceProvider, address _delegator) returns()
func (_DelegateManager *DelegateManagerSession) CancelRemoveDelegatorRequest(_serviceProvider common.Address, _delegator common.Address) (*types.Transaction, error) {
	return _DelegateManager.Contract.CancelRemoveDelegatorRequest(&_DelegateManager.TransactOpts, _serviceProvider, _delegator)
}

// CancelRemoveDelegatorRequest is a paid mutator transaction binding the contract method 0x1d0f283a.
//
// Solidity: function cancelRemoveDelegatorRequest(address _serviceProvider, address _delegator) returns()
func (_DelegateManager *DelegateManagerTransactorSession) CancelRemoveDelegatorRequest(_serviceProvider common.Address, _delegator common.Address) (*types.Transaction, error) {
	return _DelegateManager.Contract.CancelRemoveDelegatorRequest(&_DelegateManager.TransactOpts, _serviceProvider, _delegator)
}

// CancelUndelegateStakeRequest is a paid mutator transaction binding the contract method 0x6a53f10f.
//
// Solidity: function cancelUndelegateStakeRequest() returns()
func (_DelegateManager *DelegateManagerTransactor) CancelUndelegateStakeRequest(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _DelegateManager.contract.Transact(opts, "cancelUndelegateStakeRequest")
}

// CancelUndelegateStakeRequest is a paid mutator transaction binding the contract method 0x6a53f10f.
//
// Solidity: function cancelUndelegateStakeRequest() returns()
func (_DelegateManager *DelegateManagerSession) CancelUndelegateStakeRequest() (*types.Transaction, error) {
	return _DelegateManager.Contract.CancelUndelegateStakeRequest(&_DelegateManager.TransactOpts)
}

// CancelUndelegateStakeRequest is a paid mutator transaction binding the contract method 0x6a53f10f.
//
// Solidity: function cancelUndelegateStakeRequest() returns()
func (_DelegateManager *DelegateManagerTransactorSession) CancelUndelegateStakeRequest() (*types.Transaction, error) {
	return _DelegateManager.Contract.CancelUndelegateStakeRequest(&_DelegateManager.TransactOpts)
}

// ClaimRewards is a paid mutator transaction binding the contract method 0xef5cfb8c.
//
// Solidity: function claimRewards(address _serviceProvider) returns()
func (_DelegateManager *DelegateManagerTransactor) ClaimRewards(opts *bind.TransactOpts, _serviceProvider common.Address) (*types.Transaction, error) {
	return _DelegateManager.contract.Transact(opts, "claimRewards", _serviceProvider)
}

// ClaimRewards is a paid mutator transaction binding the contract method 0xef5cfb8c.
//
// Solidity: function claimRewards(address _serviceProvider) returns()
func (_DelegateManager *DelegateManagerSession) ClaimRewards(_serviceProvider common.Address) (*types.Transaction, error) {
	return _DelegateManager.Contract.ClaimRewards(&_DelegateManager.TransactOpts, _serviceProvider)
}

// ClaimRewards is a paid mutator transaction binding the contract method 0xef5cfb8c.
//
// Solidity: function claimRewards(address _serviceProvider) returns()
func (_DelegateManager *DelegateManagerTransactorSession) ClaimRewards(_serviceProvider common.Address) (*types.Transaction, error) {
	return _DelegateManager.Contract.ClaimRewards(&_DelegateManager.TransactOpts, _serviceProvider)
}

// DelegateStake is a paid mutator transaction binding the contract method 0x3c323a1b.
//
// Solidity: function delegateStake(address _targetSP, uint256 _amount) returns(uint256)
func (_DelegateManager *DelegateManagerTransactor) DelegateStake(opts *bind.TransactOpts, _targetSP common.Address, _amount *big.Int) (*types.Transaction, error) {
	return _DelegateManager.contract.Transact(opts, "delegateStake", _targetSP, _amount)
}

// DelegateStake is a paid mutator transaction binding the contract method 0x3c323a1b.
//
// Solidity: function delegateStake(address _targetSP, uint256 _amount) returns(uint256)
func (_DelegateManager *DelegateManagerSession) DelegateStake(_targetSP common.Address, _amount *big.Int) (*types.Transaction, error) {
	return _DelegateManager.Contract.DelegateStake(&_DelegateManager.TransactOpts, _targetSP, _amount)
}

// DelegateStake is a paid mutator transaction binding the contract method 0x3c323a1b.
//
// Solidity: function delegateStake(address _targetSP, uint256 _amount) returns(uint256)
func (_DelegateManager *DelegateManagerTransactorSession) DelegateStake(_targetSP common.Address, _amount *big.Int) (*types.Transaction, error) {
	return _DelegateManager.Contract.DelegateStake(&_DelegateManager.TransactOpts, _targetSP, _amount)
}

// Initialize is a paid mutator transaction binding the contract method 0x1794bb3c.
//
// Solidity: function initialize(address _tokenAddress, address _governanceAddress, uint256 _undelegateLockupDuration) returns()
func (_DelegateManager *DelegateManagerTransactor) Initialize(opts *bind.TransactOpts, _tokenAddress common.Address, _governanceAddress common.Address, _undelegateLockupDuration *big.Int) (*types.Transaction, error) {
	return _DelegateManager.contract.Transact(opts, "initialize", _tokenAddress, _governanceAddress, _undelegateLockupDuration)
}

// Initialize is a paid mutator transaction binding the contract method 0x1794bb3c.
//
// Solidity: function initialize(address _tokenAddress, address _governanceAddress, uint256 _undelegateLockupDuration) returns()
func (_DelegateManager *DelegateManagerSession) Initialize(_tokenAddress common.Address, _governanceAddress common.Address, _undelegateLockupDuration *big.Int) (*types.Transaction, error) {
	return _DelegateManager.Contract.Initialize(&_DelegateManager.TransactOpts, _tokenAddress, _governanceAddress, _undelegateLockupDuration)
}

// Initialize is a paid mutator transaction binding the contract method 0x1794bb3c.
//
// Solidity: function initialize(address _tokenAddress, address _governanceAddress, uint256 _undelegateLockupDuration) returns()
func (_DelegateManager *DelegateManagerTransactorSession) Initialize(_tokenAddress common.Address, _governanceAddress common.Address, _undelegateLockupDuration *big.Int) (*types.Transaction, error) {
	return _DelegateManager.Contract.Initialize(&_DelegateManager.TransactOpts, _tokenAddress, _governanceAddress, _undelegateLockupDuration)
}

// Initialize0 is a paid mutator transaction binding the contract method 0x8129fc1c.
//
// Solidity: function initialize() returns()
func (_DelegateManager *DelegateManagerTransactor) Initialize0(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _DelegateManager.contract.Transact(opts, "initialize0")
}

// Initialize0 is a paid mutator transaction binding the contract method 0x8129fc1c.
//
// Solidity: function initialize() returns()
func (_DelegateManager *DelegateManagerSession) Initialize0() (*types.Transaction, error) {
	return _DelegateManager.Contract.Initialize0(&_DelegateManager.TransactOpts)
}

// Initialize0 is a paid mutator transaction binding the contract method 0x8129fc1c.
//
// Solidity: function initialize() returns()
func (_DelegateManager *DelegateManagerTransactorSession) Initialize0() (*types.Transaction, error) {
	return _DelegateManager.Contract.Initialize0(&_DelegateManager.TransactOpts)
}

// RemoveDelegator is a paid mutator transaction binding the contract method 0xe0d229ff.
//
// Solidity: function removeDelegator(address _serviceProvider, address _delegator) returns()
func (_DelegateManager *DelegateManagerTransactor) RemoveDelegator(opts *bind.TransactOpts, _serviceProvider common.Address, _delegator common.Address) (*types.Transaction, error) {
	return _DelegateManager.contract.Transact(opts, "removeDelegator", _serviceProvider, _delegator)
}

// RemoveDelegator is a paid mutator transaction binding the contract method 0xe0d229ff.
//
// Solidity: function removeDelegator(address _serviceProvider, address _delegator) returns()
func (_DelegateManager *DelegateManagerSession) RemoveDelegator(_serviceProvider common.Address, _delegator common.Address) (*types.Transaction, error) {
	return _DelegateManager.Contract.RemoveDelegator(&_DelegateManager.TransactOpts, _serviceProvider, _delegator)
}

// RemoveDelegator is a paid mutator transaction binding the contract method 0xe0d229ff.
//
// Solidity: function removeDelegator(address _serviceProvider, address _delegator) returns()
func (_DelegateManager *DelegateManagerTransactorSession) RemoveDelegator(_serviceProvider common.Address, _delegator common.Address) (*types.Transaction, error) {
	return _DelegateManager.Contract.RemoveDelegator(&_DelegateManager.TransactOpts, _serviceProvider, _delegator)
}

// RequestRemoveDelegator is a paid mutator transaction binding the contract method 0x721e4221.
//
// Solidity: function requestRemoveDelegator(address _serviceProvider, address _delegator) returns()
func (_DelegateManager *DelegateManagerTransactor) RequestRemoveDelegator(opts *bind.TransactOpts, _serviceProvider common.Address, _delegator common.Address) (*types.Transaction, error) {
	return _DelegateManager.contract.Transact(opts, "requestRemoveDelegator", _serviceProvider, _delegator)
}

// RequestRemoveDelegator is a paid mutator transaction binding the contract method 0x721e4221.
//
// Solidity: function requestRemoveDelegator(address _serviceProvider, address _delegator) returns()
func (_DelegateManager *DelegateManagerSession) RequestRemoveDelegator(_serviceProvider common.Address, _delegator common.Address) (*types.Transaction, error) {
	return _DelegateManager.Contract.RequestRemoveDelegator(&_DelegateManager.TransactOpts, _serviceProvider, _delegator)
}

// RequestRemoveDelegator is a paid mutator transaction binding the contract method 0x721e4221.
//
// Solidity: function requestRemoveDelegator(address _serviceProvider, address _delegator) returns()
func (_DelegateManager *DelegateManagerTransactorSession) RequestRemoveDelegator(_serviceProvider common.Address, _delegator common.Address) (*types.Transaction, error) {
	return _DelegateManager.Contract.RequestRemoveDelegator(&_DelegateManager.TransactOpts, _serviceProvider, _delegator)
}

// RequestUndelegateStake is a paid mutator transaction binding the contract method 0xa7bac487.
//
// Solidity: function requestUndelegateStake(address _target, uint256 _amount) returns(uint256)
func (_DelegateManager *DelegateManagerTransactor) RequestUndelegateStake(opts *bind.TransactOpts, _target common.Address, _amount *big.Int) (*types.Transaction, error) {
	return _DelegateManager.contract.Transact(opts, "requestUndelegateStake", _target, _amount)
}

// RequestUndelegateStake is a paid mutator transaction binding the contract method 0xa7bac487.
//
// Solidity: function requestUndelegateStake(address _target, uint256 _amount) returns(uint256)
func (_DelegateManager *DelegateManagerSession) RequestUndelegateStake(_target common.Address, _amount *big.Int) (*types.Transaction, error) {
	return _DelegateManager.Contract.RequestUndelegateStake(&_DelegateManager.TransactOpts, _target, _amount)
}

// RequestUndelegateStake is a paid mutator transaction binding the contract method 0xa7bac487.
//
// Solidity: function requestUndelegateStake(address _target, uint256 _amount) returns(uint256)
func (_DelegateManager *DelegateManagerTransactorSession) RequestUndelegateStake(_target common.Address, _amount *big.Int) (*types.Transaction, error) {
	return _DelegateManager.Contract.RequestUndelegateStake(&_DelegateManager.TransactOpts, _target, _amount)
}

// SetClaimsManagerAddress is a paid mutator transaction binding the contract method 0xaa70d236.
//
// Solidity: function setClaimsManagerAddress(address _claimsManagerAddress) returns()
func (_DelegateManager *DelegateManagerTransactor) SetClaimsManagerAddress(opts *bind.TransactOpts, _claimsManagerAddress common.Address) (*types.Transaction, error) {
	return _DelegateManager.contract.Transact(opts, "setClaimsManagerAddress", _claimsManagerAddress)
}

// SetClaimsManagerAddress is a paid mutator transaction binding the contract method 0xaa70d236.
//
// Solidity: function setClaimsManagerAddress(address _claimsManagerAddress) returns()
func (_DelegateManager *DelegateManagerSession) SetClaimsManagerAddress(_claimsManagerAddress common.Address) (*types.Transaction, error) {
	return _DelegateManager.Contract.SetClaimsManagerAddress(&_DelegateManager.TransactOpts, _claimsManagerAddress)
}

// SetClaimsManagerAddress is a paid mutator transaction binding the contract method 0xaa70d236.
//
// Solidity: function setClaimsManagerAddress(address _claimsManagerAddress) returns()
func (_DelegateManager *DelegateManagerTransactorSession) SetClaimsManagerAddress(_claimsManagerAddress common.Address) (*types.Transaction, error) {
	return _DelegateManager.Contract.SetClaimsManagerAddress(&_DelegateManager.TransactOpts, _claimsManagerAddress)
}

// SetGovernanceAddress is a paid mutator transaction binding the contract method 0xcfc16254.
//
// Solidity: function setGovernanceAddress(address _governanceAddress) returns()
func (_DelegateManager *DelegateManagerTransactor) SetGovernanceAddress(opts *bind.TransactOpts, _governanceAddress common.Address) (*types.Transaction, error) {
	return _DelegateManager.contract.Transact(opts, "setGovernanceAddress", _governanceAddress)
}

// SetGovernanceAddress is a paid mutator transaction binding the contract method 0xcfc16254.
//
// Solidity: function setGovernanceAddress(address _governanceAddress) returns()
func (_DelegateManager *DelegateManagerSession) SetGovernanceAddress(_governanceAddress common.Address) (*types.Transaction, error) {
	return _DelegateManager.Contract.SetGovernanceAddress(&_DelegateManager.TransactOpts, _governanceAddress)
}

// SetGovernanceAddress is a paid mutator transaction binding the contract method 0xcfc16254.
//
// Solidity: function setGovernanceAddress(address _governanceAddress) returns()
func (_DelegateManager *DelegateManagerTransactorSession) SetGovernanceAddress(_governanceAddress common.Address) (*types.Transaction, error) {
	return _DelegateManager.Contract.SetGovernanceAddress(&_DelegateManager.TransactOpts, _governanceAddress)
}

// SetServiceProviderFactoryAddress is a paid mutator transaction binding the contract method 0x201ae9db.
//
// Solidity: function setServiceProviderFactoryAddress(address _spFactory) returns()
func (_DelegateManager *DelegateManagerTransactor) SetServiceProviderFactoryAddress(opts *bind.TransactOpts, _spFactory common.Address) (*types.Transaction, error) {
	return _DelegateManager.contract.Transact(opts, "setServiceProviderFactoryAddress", _spFactory)
}

// SetServiceProviderFactoryAddress is a paid mutator transaction binding the contract method 0x201ae9db.
//
// Solidity: function setServiceProviderFactoryAddress(address _spFactory) returns()
func (_DelegateManager *DelegateManagerSession) SetServiceProviderFactoryAddress(_spFactory common.Address) (*types.Transaction, error) {
	return _DelegateManager.Contract.SetServiceProviderFactoryAddress(&_DelegateManager.TransactOpts, _spFactory)
}

// SetServiceProviderFactoryAddress is a paid mutator transaction binding the contract method 0x201ae9db.
//
// Solidity: function setServiceProviderFactoryAddress(address _spFactory) returns()
func (_DelegateManager *DelegateManagerTransactorSession) SetServiceProviderFactoryAddress(_spFactory common.Address) (*types.Transaction, error) {
	return _DelegateManager.Contract.SetServiceProviderFactoryAddress(&_DelegateManager.TransactOpts, _spFactory)
}

// SetStakingAddress is a paid mutator transaction binding the contract method 0xf4e0d9ac.
//
// Solidity: function setStakingAddress(address _stakingAddress) returns()
func (_DelegateManager *DelegateManagerTransactor) SetStakingAddress(opts *bind.TransactOpts, _stakingAddress common.Address) (*types.Transaction, error) {
	return _DelegateManager.contract.Transact(opts, "setStakingAddress", _stakingAddress)
}

// SetStakingAddress is a paid mutator transaction binding the contract method 0xf4e0d9ac.
//
// Solidity: function setStakingAddress(address _stakingAddress) returns()
func (_DelegateManager *DelegateManagerSession) SetStakingAddress(_stakingAddress common.Address) (*types.Transaction, error) {
	return _DelegateManager.Contract.SetStakingAddress(&_DelegateManager.TransactOpts, _stakingAddress)
}

// SetStakingAddress is a paid mutator transaction binding the contract method 0xf4e0d9ac.
//
// Solidity: function setStakingAddress(address _stakingAddress) returns()
func (_DelegateManager *DelegateManagerTransactorSession) SetStakingAddress(_stakingAddress common.Address) (*types.Transaction, error) {
	return _DelegateManager.Contract.SetStakingAddress(&_DelegateManager.TransactOpts, _stakingAddress)
}

// Slash is a paid mutator transaction binding the contract method 0x3d82e3c1.
//
// Solidity: function slash(uint256 _amount, address _slashAddress) returns()
func (_DelegateManager *DelegateManagerTransactor) Slash(opts *bind.TransactOpts, _amount *big.Int, _slashAddress common.Address) (*types.Transaction, error) {
	return _DelegateManager.contract.Transact(opts, "slash", _amount, _slashAddress)
}

// Slash is a paid mutator transaction binding the contract method 0x3d82e3c1.
//
// Solidity: function slash(uint256 _amount, address _slashAddress) returns()
func (_DelegateManager *DelegateManagerSession) Slash(_amount *big.Int, _slashAddress common.Address) (*types.Transaction, error) {
	return _DelegateManager.Contract.Slash(&_DelegateManager.TransactOpts, _amount, _slashAddress)
}

// Slash is a paid mutator transaction binding the contract method 0x3d82e3c1.
//
// Solidity: function slash(uint256 _amount, address _slashAddress) returns()
func (_DelegateManager *DelegateManagerTransactorSession) Slash(_amount *big.Int, _slashAddress common.Address) (*types.Transaction, error) {
	return _DelegateManager.Contract.Slash(&_DelegateManager.TransactOpts, _amount, _slashAddress)
}

// UndelegateStake is a paid mutator transaction binding the contract method 0xfeaf8048.
//
// Solidity: function undelegateStake() returns(uint256)
func (_DelegateManager *DelegateManagerTransactor) UndelegateStake(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _DelegateManager.contract.Transact(opts, "undelegateStake")
}

// UndelegateStake is a paid mutator transaction binding the contract method 0xfeaf8048.
//
// Solidity: function undelegateStake() returns(uint256)
func (_DelegateManager *DelegateManagerSession) UndelegateStake() (*types.Transaction, error) {
	return _DelegateManager.Contract.UndelegateStake(&_DelegateManager.TransactOpts)
}

// UndelegateStake is a paid mutator transaction binding the contract method 0xfeaf8048.
//
// Solidity: function undelegateStake() returns(uint256)
func (_DelegateManager *DelegateManagerTransactorSession) UndelegateStake() (*types.Transaction, error) {
	return _DelegateManager.Contract.UndelegateStake(&_DelegateManager.TransactOpts)
}

// UpdateMaxDelegators is a paid mutator transaction binding the contract method 0x862c95b9.
//
// Solidity: function updateMaxDelegators(uint256 _maxDelegators) returns()
func (_DelegateManager *DelegateManagerTransactor) UpdateMaxDelegators(opts *bind.TransactOpts, _maxDelegators *big.Int) (*types.Transaction, error) {
	return _DelegateManager.contract.Transact(opts, "updateMaxDelegators", _maxDelegators)
}

// UpdateMaxDelegators is a paid mutator transaction binding the contract method 0x862c95b9.
//
// Solidity: function updateMaxDelegators(uint256 _maxDelegators) returns()
func (_DelegateManager *DelegateManagerSession) UpdateMaxDelegators(_maxDelegators *big.Int) (*types.Transaction, error) {
	return _DelegateManager.Contract.UpdateMaxDelegators(&_DelegateManager.TransactOpts, _maxDelegators)
}

// UpdateMaxDelegators is a paid mutator transaction binding the contract method 0x862c95b9.
//
// Solidity: function updateMaxDelegators(uint256 _maxDelegators) returns()
func (_DelegateManager *DelegateManagerTransactorSession) UpdateMaxDelegators(_maxDelegators *big.Int) (*types.Transaction, error) {
	return _DelegateManager.Contract.UpdateMaxDelegators(&_DelegateManager.TransactOpts, _maxDelegators)
}

// UpdateMinDelegationAmount is a paid mutator transaction binding the contract method 0x5ad15ada.
//
// Solidity: function updateMinDelegationAmount(uint256 _minDelegationAmount) returns()
func (_DelegateManager *DelegateManagerTransactor) UpdateMinDelegationAmount(opts *bind.TransactOpts, _minDelegationAmount *big.Int) (*types.Transaction, error) {
	return _DelegateManager.contract.Transact(opts, "updateMinDelegationAmount", _minDelegationAmount)
}

// UpdateMinDelegationAmount is a paid mutator transaction binding the contract method 0x5ad15ada.
//
// Solidity: function updateMinDelegationAmount(uint256 _minDelegationAmount) returns()
func (_DelegateManager *DelegateManagerSession) UpdateMinDelegationAmount(_minDelegationAmount *big.Int) (*types.Transaction, error) {
	return _DelegateManager.Contract.UpdateMinDelegationAmount(&_DelegateManager.TransactOpts, _minDelegationAmount)
}

// UpdateMinDelegationAmount is a paid mutator transaction binding the contract method 0x5ad15ada.
//
// Solidity: function updateMinDelegationAmount(uint256 _minDelegationAmount) returns()
func (_DelegateManager *DelegateManagerTransactorSession) UpdateMinDelegationAmount(_minDelegationAmount *big.Int) (*types.Transaction, error) {
	return _DelegateManager.Contract.UpdateMinDelegationAmount(&_DelegateManager.TransactOpts, _minDelegationAmount)
}

// UpdateRemoveDelegatorEvalDuration is a paid mutator transaction binding the contract method 0xb26df564.
//
// Solidity: function updateRemoveDelegatorEvalDuration(uint256 _duration) returns()
func (_DelegateManager *DelegateManagerTransactor) UpdateRemoveDelegatorEvalDuration(opts *bind.TransactOpts, _duration *big.Int) (*types.Transaction, error) {
	return _DelegateManager.contract.Transact(opts, "updateRemoveDelegatorEvalDuration", _duration)
}

// UpdateRemoveDelegatorEvalDuration is a paid mutator transaction binding the contract method 0xb26df564.
//
// Solidity: function updateRemoveDelegatorEvalDuration(uint256 _duration) returns()
func (_DelegateManager *DelegateManagerSession) UpdateRemoveDelegatorEvalDuration(_duration *big.Int) (*types.Transaction, error) {
	return _DelegateManager.Contract.UpdateRemoveDelegatorEvalDuration(&_DelegateManager.TransactOpts, _duration)
}

// UpdateRemoveDelegatorEvalDuration is a paid mutator transaction binding the contract method 0xb26df564.
//
// Solidity: function updateRemoveDelegatorEvalDuration(uint256 _duration) returns()
func (_DelegateManager *DelegateManagerTransactorSession) UpdateRemoveDelegatorEvalDuration(_duration *big.Int) (*types.Transaction, error) {
	return _DelegateManager.Contract.UpdateRemoveDelegatorEvalDuration(&_DelegateManager.TransactOpts, _duration)
}

// UpdateRemoveDelegatorLockupDuration is a paid mutator transaction binding the contract method 0xf5c081ad.
//
// Solidity: function updateRemoveDelegatorLockupDuration(uint256 _duration) returns()
func (_DelegateManager *DelegateManagerTransactor) UpdateRemoveDelegatorLockupDuration(opts *bind.TransactOpts, _duration *big.Int) (*types.Transaction, error) {
	return _DelegateManager.contract.Transact(opts, "updateRemoveDelegatorLockupDuration", _duration)
}

// UpdateRemoveDelegatorLockupDuration is a paid mutator transaction binding the contract method 0xf5c081ad.
//
// Solidity: function updateRemoveDelegatorLockupDuration(uint256 _duration) returns()
func (_DelegateManager *DelegateManagerSession) UpdateRemoveDelegatorLockupDuration(_duration *big.Int) (*types.Transaction, error) {
	return _DelegateManager.Contract.UpdateRemoveDelegatorLockupDuration(&_DelegateManager.TransactOpts, _duration)
}

// UpdateRemoveDelegatorLockupDuration is a paid mutator transaction binding the contract method 0xf5c081ad.
//
// Solidity: function updateRemoveDelegatorLockupDuration(uint256 _duration) returns()
func (_DelegateManager *DelegateManagerTransactorSession) UpdateRemoveDelegatorLockupDuration(_duration *big.Int) (*types.Transaction, error) {
	return _DelegateManager.Contract.UpdateRemoveDelegatorLockupDuration(&_DelegateManager.TransactOpts, _duration)
}

// UpdateSPMinDelegationAmount is a paid mutator transaction binding the contract method 0x68579837.
//
// Solidity: function updateSPMinDelegationAmount(address _serviceProvider, uint256 _spMinDelegationAmount) returns()
func (_DelegateManager *DelegateManagerTransactor) UpdateSPMinDelegationAmount(opts *bind.TransactOpts, _serviceProvider common.Address, _spMinDelegationAmount *big.Int) (*types.Transaction, error) {
	return _DelegateManager.contract.Transact(opts, "updateSPMinDelegationAmount", _serviceProvider, _spMinDelegationAmount)
}

// UpdateSPMinDelegationAmount is a paid mutator transaction binding the contract method 0x68579837.
//
// Solidity: function updateSPMinDelegationAmount(address _serviceProvider, uint256 _spMinDelegationAmount) returns()
func (_DelegateManager *DelegateManagerSession) UpdateSPMinDelegationAmount(_serviceProvider common.Address, _spMinDelegationAmount *big.Int) (*types.Transaction, error) {
	return _DelegateManager.Contract.UpdateSPMinDelegationAmount(&_DelegateManager.TransactOpts, _serviceProvider, _spMinDelegationAmount)
}

// UpdateSPMinDelegationAmount is a paid mutator transaction binding the contract method 0x68579837.
//
// Solidity: function updateSPMinDelegationAmount(address _serviceProvider, uint256 _spMinDelegationAmount) returns()
func (_DelegateManager *DelegateManagerTransactorSession) UpdateSPMinDelegationAmount(_serviceProvider common.Address, _spMinDelegationAmount *big.Int) (*types.Transaction, error) {
	return _DelegateManager.Contract.UpdateSPMinDelegationAmount(&_DelegateManager.TransactOpts, _serviceProvider, _spMinDelegationAmount)
}

// UpdateUndelegateLockupDuration is a paid mutator transaction binding the contract method 0xe37e191c.
//
// Solidity: function updateUndelegateLockupDuration(uint256 _duration) returns()
func (_DelegateManager *DelegateManagerTransactor) UpdateUndelegateLockupDuration(opts *bind.TransactOpts, _duration *big.Int) (*types.Transaction, error) {
	return _DelegateManager.contract.Transact(opts, "updateUndelegateLockupDuration", _duration)
}

// UpdateUndelegateLockupDuration is a paid mutator transaction binding the contract method 0xe37e191c.
//
// Solidity: function updateUndelegateLockupDuration(uint256 _duration) returns()
func (_DelegateManager *DelegateManagerSession) UpdateUndelegateLockupDuration(_duration *big.Int) (*types.Transaction, error) {
	return _DelegateManager.Contract.UpdateUndelegateLockupDuration(&_DelegateManager.TransactOpts, _duration)
}

// UpdateUndelegateLockupDuration is a paid mutator transaction binding the contract method 0xe37e191c.
//
// Solidity: function updateUndelegateLockupDuration(uint256 _duration) returns()
func (_DelegateManager *DelegateManagerTransactorSession) UpdateUndelegateLockupDuration(_duration *big.Int) (*types.Transaction, error) {
	return _DelegateManager.Contract.UpdateUndelegateLockupDuration(&_DelegateManager.TransactOpts, _duration)
}

// DelegateManagerClaimIterator is returned from FilterClaim and is used to iterate over the raw logs and unpacked data for Claim events raised by the DelegateManager contract.
type DelegateManagerClaimIterator struct {
	Event *DelegateManagerClaim // Event containing the contract specifics and raw log

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
func (it *DelegateManagerClaimIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(DelegateManagerClaim)
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
		it.Event = new(DelegateManagerClaim)
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
func (it *DelegateManagerClaimIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *DelegateManagerClaimIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// DelegateManagerClaim represents a Claim event raised by the DelegateManager contract.
type DelegateManagerClaim struct {
	Claimer  common.Address
	Rewards  *big.Int
	NewTotal *big.Int
	Raw      types.Log // Blockchain specific contextual infos
}

// FilterClaim is a free log retrieval operation binding the contract event 0x34fcbac0073d7c3d388e51312faf357774904998eeb8fca628b9e6f65ee1cbf7.
//
// Solidity: event Claim(address indexed _claimer, uint256 indexed _rewards, uint256 indexed _newTotal)
func (_DelegateManager *DelegateManagerFilterer) FilterClaim(opts *bind.FilterOpts, _claimer []common.Address, _rewards []*big.Int, _newTotal []*big.Int) (*DelegateManagerClaimIterator, error) {

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

	logs, sub, err := _DelegateManager.contract.FilterLogs(opts, "Claim", _claimerRule, _rewardsRule, _newTotalRule)
	if err != nil {
		return nil, err
	}
	return &DelegateManagerClaimIterator{contract: _DelegateManager.contract, event: "Claim", logs: logs, sub: sub}, nil
}

// WatchClaim is a free log subscription operation binding the contract event 0x34fcbac0073d7c3d388e51312faf357774904998eeb8fca628b9e6f65ee1cbf7.
//
// Solidity: event Claim(address indexed _claimer, uint256 indexed _rewards, uint256 indexed _newTotal)
func (_DelegateManager *DelegateManagerFilterer) WatchClaim(opts *bind.WatchOpts, sink chan<- *DelegateManagerClaim, _claimer []common.Address, _rewards []*big.Int, _newTotal []*big.Int) (event.Subscription, error) {

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

	logs, sub, err := _DelegateManager.contract.WatchLogs(opts, "Claim", _claimerRule, _rewardsRule, _newTotalRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(DelegateManagerClaim)
				if err := _DelegateManager.contract.UnpackLog(event, "Claim", log); err != nil {
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
func (_DelegateManager *DelegateManagerFilterer) ParseClaim(log types.Log) (*DelegateManagerClaim, error) {
	event := new(DelegateManagerClaim)
	if err := _DelegateManager.contract.UnpackLog(event, "Claim", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// DelegateManagerClaimsManagerAddressUpdatedIterator is returned from FilterClaimsManagerAddressUpdated and is used to iterate over the raw logs and unpacked data for ClaimsManagerAddressUpdated events raised by the DelegateManager contract.
type DelegateManagerClaimsManagerAddressUpdatedIterator struct {
	Event *DelegateManagerClaimsManagerAddressUpdated // Event containing the contract specifics and raw log

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
func (it *DelegateManagerClaimsManagerAddressUpdatedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(DelegateManagerClaimsManagerAddressUpdated)
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
		it.Event = new(DelegateManagerClaimsManagerAddressUpdated)
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
func (it *DelegateManagerClaimsManagerAddressUpdatedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *DelegateManagerClaimsManagerAddressUpdatedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// DelegateManagerClaimsManagerAddressUpdated represents a ClaimsManagerAddressUpdated event raised by the DelegateManager contract.
type DelegateManagerClaimsManagerAddressUpdated struct {
	NewClaimsManagerAddress common.Address
	Raw                     types.Log // Blockchain specific contextual infos
}

// FilterClaimsManagerAddressUpdated is a free log retrieval operation binding the contract event 0x3b3679838ffd21f454712cf443ab98f11d36d5552da016314c5cbe364a10c243.
//
// Solidity: event ClaimsManagerAddressUpdated(address indexed _newClaimsManagerAddress)
func (_DelegateManager *DelegateManagerFilterer) FilterClaimsManagerAddressUpdated(opts *bind.FilterOpts, _newClaimsManagerAddress []common.Address) (*DelegateManagerClaimsManagerAddressUpdatedIterator, error) {

	var _newClaimsManagerAddressRule []interface{}
	for _, _newClaimsManagerAddressItem := range _newClaimsManagerAddress {
		_newClaimsManagerAddressRule = append(_newClaimsManagerAddressRule, _newClaimsManagerAddressItem)
	}

	logs, sub, err := _DelegateManager.contract.FilterLogs(opts, "ClaimsManagerAddressUpdated", _newClaimsManagerAddressRule)
	if err != nil {
		return nil, err
	}
	return &DelegateManagerClaimsManagerAddressUpdatedIterator{contract: _DelegateManager.contract, event: "ClaimsManagerAddressUpdated", logs: logs, sub: sub}, nil
}

// WatchClaimsManagerAddressUpdated is a free log subscription operation binding the contract event 0x3b3679838ffd21f454712cf443ab98f11d36d5552da016314c5cbe364a10c243.
//
// Solidity: event ClaimsManagerAddressUpdated(address indexed _newClaimsManagerAddress)
func (_DelegateManager *DelegateManagerFilterer) WatchClaimsManagerAddressUpdated(opts *bind.WatchOpts, sink chan<- *DelegateManagerClaimsManagerAddressUpdated, _newClaimsManagerAddress []common.Address) (event.Subscription, error) {

	var _newClaimsManagerAddressRule []interface{}
	for _, _newClaimsManagerAddressItem := range _newClaimsManagerAddress {
		_newClaimsManagerAddressRule = append(_newClaimsManagerAddressRule, _newClaimsManagerAddressItem)
	}

	logs, sub, err := _DelegateManager.contract.WatchLogs(opts, "ClaimsManagerAddressUpdated", _newClaimsManagerAddressRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(DelegateManagerClaimsManagerAddressUpdated)
				if err := _DelegateManager.contract.UnpackLog(event, "ClaimsManagerAddressUpdated", log); err != nil {
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
func (_DelegateManager *DelegateManagerFilterer) ParseClaimsManagerAddressUpdated(log types.Log) (*DelegateManagerClaimsManagerAddressUpdated, error) {
	event := new(DelegateManagerClaimsManagerAddressUpdated)
	if err := _DelegateManager.contract.UnpackLog(event, "ClaimsManagerAddressUpdated", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// DelegateManagerGovernanceAddressUpdatedIterator is returned from FilterGovernanceAddressUpdated and is used to iterate over the raw logs and unpacked data for GovernanceAddressUpdated events raised by the DelegateManager contract.
type DelegateManagerGovernanceAddressUpdatedIterator struct {
	Event *DelegateManagerGovernanceAddressUpdated // Event containing the contract specifics and raw log

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
func (it *DelegateManagerGovernanceAddressUpdatedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(DelegateManagerGovernanceAddressUpdated)
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
		it.Event = new(DelegateManagerGovernanceAddressUpdated)
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
func (it *DelegateManagerGovernanceAddressUpdatedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *DelegateManagerGovernanceAddressUpdatedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// DelegateManagerGovernanceAddressUpdated represents a GovernanceAddressUpdated event raised by the DelegateManager contract.
type DelegateManagerGovernanceAddressUpdated struct {
	NewGovernanceAddress common.Address
	Raw                  types.Log // Blockchain specific contextual infos
}

// FilterGovernanceAddressUpdated is a free log retrieval operation binding the contract event 0xd0e77a42021adb46a85dc0dbcdd75417f2042ed5c51474cb43a25ce0f1049a1e.
//
// Solidity: event GovernanceAddressUpdated(address indexed _newGovernanceAddress)
func (_DelegateManager *DelegateManagerFilterer) FilterGovernanceAddressUpdated(opts *bind.FilterOpts, _newGovernanceAddress []common.Address) (*DelegateManagerGovernanceAddressUpdatedIterator, error) {

	var _newGovernanceAddressRule []interface{}
	for _, _newGovernanceAddressItem := range _newGovernanceAddress {
		_newGovernanceAddressRule = append(_newGovernanceAddressRule, _newGovernanceAddressItem)
	}

	logs, sub, err := _DelegateManager.contract.FilterLogs(opts, "GovernanceAddressUpdated", _newGovernanceAddressRule)
	if err != nil {
		return nil, err
	}
	return &DelegateManagerGovernanceAddressUpdatedIterator{contract: _DelegateManager.contract, event: "GovernanceAddressUpdated", logs: logs, sub: sub}, nil
}

// WatchGovernanceAddressUpdated is a free log subscription operation binding the contract event 0xd0e77a42021adb46a85dc0dbcdd75417f2042ed5c51474cb43a25ce0f1049a1e.
//
// Solidity: event GovernanceAddressUpdated(address indexed _newGovernanceAddress)
func (_DelegateManager *DelegateManagerFilterer) WatchGovernanceAddressUpdated(opts *bind.WatchOpts, sink chan<- *DelegateManagerGovernanceAddressUpdated, _newGovernanceAddress []common.Address) (event.Subscription, error) {

	var _newGovernanceAddressRule []interface{}
	for _, _newGovernanceAddressItem := range _newGovernanceAddress {
		_newGovernanceAddressRule = append(_newGovernanceAddressRule, _newGovernanceAddressItem)
	}

	logs, sub, err := _DelegateManager.contract.WatchLogs(opts, "GovernanceAddressUpdated", _newGovernanceAddressRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(DelegateManagerGovernanceAddressUpdated)
				if err := _DelegateManager.contract.UnpackLog(event, "GovernanceAddressUpdated", log); err != nil {
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
func (_DelegateManager *DelegateManagerFilterer) ParseGovernanceAddressUpdated(log types.Log) (*DelegateManagerGovernanceAddressUpdated, error) {
	event := new(DelegateManagerGovernanceAddressUpdated)
	if err := _DelegateManager.contract.UnpackLog(event, "GovernanceAddressUpdated", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// DelegateManagerIncreaseDelegatedStakeIterator is returned from FilterIncreaseDelegatedStake and is used to iterate over the raw logs and unpacked data for IncreaseDelegatedStake events raised by the DelegateManager contract.
type DelegateManagerIncreaseDelegatedStakeIterator struct {
	Event *DelegateManagerIncreaseDelegatedStake // Event containing the contract specifics and raw log

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
func (it *DelegateManagerIncreaseDelegatedStakeIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(DelegateManagerIncreaseDelegatedStake)
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
		it.Event = new(DelegateManagerIncreaseDelegatedStake)
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
func (it *DelegateManagerIncreaseDelegatedStakeIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *DelegateManagerIncreaseDelegatedStakeIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// DelegateManagerIncreaseDelegatedStake represents a IncreaseDelegatedStake event raised by the DelegateManager contract.
type DelegateManagerIncreaseDelegatedStake struct {
	Delegator       common.Address
	ServiceProvider common.Address
	IncreaseAmount  *big.Int
	Raw             types.Log // Blockchain specific contextual infos
}

// FilterIncreaseDelegatedStake is a free log retrieval operation binding the contract event 0x82d701855f3ac4a098fc0249261c5e06d1050d23c8aa351fae8abefc2a464fda.
//
// Solidity: event IncreaseDelegatedStake(address indexed _delegator, address indexed _serviceProvider, uint256 indexed _increaseAmount)
func (_DelegateManager *DelegateManagerFilterer) FilterIncreaseDelegatedStake(opts *bind.FilterOpts, _delegator []common.Address, _serviceProvider []common.Address, _increaseAmount []*big.Int) (*DelegateManagerIncreaseDelegatedStakeIterator, error) {

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

	logs, sub, err := _DelegateManager.contract.FilterLogs(opts, "IncreaseDelegatedStake", _delegatorRule, _serviceProviderRule, _increaseAmountRule)
	if err != nil {
		return nil, err
	}
	return &DelegateManagerIncreaseDelegatedStakeIterator{contract: _DelegateManager.contract, event: "IncreaseDelegatedStake", logs: logs, sub: sub}, nil
}

// WatchIncreaseDelegatedStake is a free log subscription operation binding the contract event 0x82d701855f3ac4a098fc0249261c5e06d1050d23c8aa351fae8abefc2a464fda.
//
// Solidity: event IncreaseDelegatedStake(address indexed _delegator, address indexed _serviceProvider, uint256 indexed _increaseAmount)
func (_DelegateManager *DelegateManagerFilterer) WatchIncreaseDelegatedStake(opts *bind.WatchOpts, sink chan<- *DelegateManagerIncreaseDelegatedStake, _delegator []common.Address, _serviceProvider []common.Address, _increaseAmount []*big.Int) (event.Subscription, error) {

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

	logs, sub, err := _DelegateManager.contract.WatchLogs(opts, "IncreaseDelegatedStake", _delegatorRule, _serviceProviderRule, _increaseAmountRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(DelegateManagerIncreaseDelegatedStake)
				if err := _DelegateManager.contract.UnpackLog(event, "IncreaseDelegatedStake", log); err != nil {
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
func (_DelegateManager *DelegateManagerFilterer) ParseIncreaseDelegatedStake(log types.Log) (*DelegateManagerIncreaseDelegatedStake, error) {
	event := new(DelegateManagerIncreaseDelegatedStake)
	if err := _DelegateManager.contract.UnpackLog(event, "IncreaseDelegatedStake", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// DelegateManagerMaxDelegatorsUpdatedIterator is returned from FilterMaxDelegatorsUpdated and is used to iterate over the raw logs and unpacked data for MaxDelegatorsUpdated events raised by the DelegateManager contract.
type DelegateManagerMaxDelegatorsUpdatedIterator struct {
	Event *DelegateManagerMaxDelegatorsUpdated // Event containing the contract specifics and raw log

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
func (it *DelegateManagerMaxDelegatorsUpdatedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(DelegateManagerMaxDelegatorsUpdated)
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
		it.Event = new(DelegateManagerMaxDelegatorsUpdated)
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
func (it *DelegateManagerMaxDelegatorsUpdatedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *DelegateManagerMaxDelegatorsUpdatedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// DelegateManagerMaxDelegatorsUpdated represents a MaxDelegatorsUpdated event raised by the DelegateManager contract.
type DelegateManagerMaxDelegatorsUpdated struct {
	MaxDelegators *big.Int
	Raw           types.Log // Blockchain specific contextual infos
}

// FilterMaxDelegatorsUpdated is a free log retrieval operation binding the contract event 0x6ba19979a519727673bc99b911e17ce26c5b91bbf7471cfc082fea38eb2a4884.
//
// Solidity: event MaxDelegatorsUpdated(uint256 indexed _maxDelegators)
func (_DelegateManager *DelegateManagerFilterer) FilterMaxDelegatorsUpdated(opts *bind.FilterOpts, _maxDelegators []*big.Int) (*DelegateManagerMaxDelegatorsUpdatedIterator, error) {

	var _maxDelegatorsRule []interface{}
	for _, _maxDelegatorsItem := range _maxDelegators {
		_maxDelegatorsRule = append(_maxDelegatorsRule, _maxDelegatorsItem)
	}

	logs, sub, err := _DelegateManager.contract.FilterLogs(opts, "MaxDelegatorsUpdated", _maxDelegatorsRule)
	if err != nil {
		return nil, err
	}
	return &DelegateManagerMaxDelegatorsUpdatedIterator{contract: _DelegateManager.contract, event: "MaxDelegatorsUpdated", logs: logs, sub: sub}, nil
}

// WatchMaxDelegatorsUpdated is a free log subscription operation binding the contract event 0x6ba19979a519727673bc99b911e17ce26c5b91bbf7471cfc082fea38eb2a4884.
//
// Solidity: event MaxDelegatorsUpdated(uint256 indexed _maxDelegators)
func (_DelegateManager *DelegateManagerFilterer) WatchMaxDelegatorsUpdated(opts *bind.WatchOpts, sink chan<- *DelegateManagerMaxDelegatorsUpdated, _maxDelegators []*big.Int) (event.Subscription, error) {

	var _maxDelegatorsRule []interface{}
	for _, _maxDelegatorsItem := range _maxDelegators {
		_maxDelegatorsRule = append(_maxDelegatorsRule, _maxDelegatorsItem)
	}

	logs, sub, err := _DelegateManager.contract.WatchLogs(opts, "MaxDelegatorsUpdated", _maxDelegatorsRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(DelegateManagerMaxDelegatorsUpdated)
				if err := _DelegateManager.contract.UnpackLog(event, "MaxDelegatorsUpdated", log); err != nil {
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
func (_DelegateManager *DelegateManagerFilterer) ParseMaxDelegatorsUpdated(log types.Log) (*DelegateManagerMaxDelegatorsUpdated, error) {
	event := new(DelegateManagerMaxDelegatorsUpdated)
	if err := _DelegateManager.contract.UnpackLog(event, "MaxDelegatorsUpdated", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// DelegateManagerMinDelegationUpdatedIterator is returned from FilterMinDelegationUpdated and is used to iterate over the raw logs and unpacked data for MinDelegationUpdated events raised by the DelegateManager contract.
type DelegateManagerMinDelegationUpdatedIterator struct {
	Event *DelegateManagerMinDelegationUpdated // Event containing the contract specifics and raw log

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
func (it *DelegateManagerMinDelegationUpdatedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(DelegateManagerMinDelegationUpdated)
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
		it.Event = new(DelegateManagerMinDelegationUpdated)
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
func (it *DelegateManagerMinDelegationUpdatedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *DelegateManagerMinDelegationUpdatedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// DelegateManagerMinDelegationUpdated represents a MinDelegationUpdated event raised by the DelegateManager contract.
type DelegateManagerMinDelegationUpdated struct {
	MinDelegationAmount *big.Int
	Raw                 types.Log // Blockchain specific contextual infos
}

// FilterMinDelegationUpdated is a free log retrieval operation binding the contract event 0x2a565983434870f0302d93575c6ee07199767028d6f294c9d1d6a1cd0979f1e1.
//
// Solidity: event MinDelegationUpdated(uint256 indexed _minDelegationAmount)
func (_DelegateManager *DelegateManagerFilterer) FilterMinDelegationUpdated(opts *bind.FilterOpts, _minDelegationAmount []*big.Int) (*DelegateManagerMinDelegationUpdatedIterator, error) {

	var _minDelegationAmountRule []interface{}
	for _, _minDelegationAmountItem := range _minDelegationAmount {
		_minDelegationAmountRule = append(_minDelegationAmountRule, _minDelegationAmountItem)
	}

	logs, sub, err := _DelegateManager.contract.FilterLogs(opts, "MinDelegationUpdated", _minDelegationAmountRule)
	if err != nil {
		return nil, err
	}
	return &DelegateManagerMinDelegationUpdatedIterator{contract: _DelegateManager.contract, event: "MinDelegationUpdated", logs: logs, sub: sub}, nil
}

// WatchMinDelegationUpdated is a free log subscription operation binding the contract event 0x2a565983434870f0302d93575c6ee07199767028d6f294c9d1d6a1cd0979f1e1.
//
// Solidity: event MinDelegationUpdated(uint256 indexed _minDelegationAmount)
func (_DelegateManager *DelegateManagerFilterer) WatchMinDelegationUpdated(opts *bind.WatchOpts, sink chan<- *DelegateManagerMinDelegationUpdated, _minDelegationAmount []*big.Int) (event.Subscription, error) {

	var _minDelegationAmountRule []interface{}
	for _, _minDelegationAmountItem := range _minDelegationAmount {
		_minDelegationAmountRule = append(_minDelegationAmountRule, _minDelegationAmountItem)
	}

	logs, sub, err := _DelegateManager.contract.WatchLogs(opts, "MinDelegationUpdated", _minDelegationAmountRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(DelegateManagerMinDelegationUpdated)
				if err := _DelegateManager.contract.UnpackLog(event, "MinDelegationUpdated", log); err != nil {
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
func (_DelegateManager *DelegateManagerFilterer) ParseMinDelegationUpdated(log types.Log) (*DelegateManagerMinDelegationUpdated, error) {
	event := new(DelegateManagerMinDelegationUpdated)
	if err := _DelegateManager.contract.UnpackLog(event, "MinDelegationUpdated", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// DelegateManagerRemoveDelegatorEvalDurationUpdatedIterator is returned from FilterRemoveDelegatorEvalDurationUpdated and is used to iterate over the raw logs and unpacked data for RemoveDelegatorEvalDurationUpdated events raised by the DelegateManager contract.
type DelegateManagerRemoveDelegatorEvalDurationUpdatedIterator struct {
	Event *DelegateManagerRemoveDelegatorEvalDurationUpdated // Event containing the contract specifics and raw log

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
func (it *DelegateManagerRemoveDelegatorEvalDurationUpdatedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(DelegateManagerRemoveDelegatorEvalDurationUpdated)
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
		it.Event = new(DelegateManagerRemoveDelegatorEvalDurationUpdated)
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
func (it *DelegateManagerRemoveDelegatorEvalDurationUpdatedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *DelegateManagerRemoveDelegatorEvalDurationUpdatedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// DelegateManagerRemoveDelegatorEvalDurationUpdated represents a RemoveDelegatorEvalDurationUpdated event raised by the DelegateManager contract.
type DelegateManagerRemoveDelegatorEvalDurationUpdated struct {
	RemoveDelegatorEvalDuration *big.Int
	Raw                         types.Log // Blockchain specific contextual infos
}

// FilterRemoveDelegatorEvalDurationUpdated is a free log retrieval operation binding the contract event 0x10c34e4da809ce0e816d31562e6f5a3d38f913c470dd384ed0a73710281b23dd.
//
// Solidity: event RemoveDelegatorEvalDurationUpdated(uint256 indexed _removeDelegatorEvalDuration)
func (_DelegateManager *DelegateManagerFilterer) FilterRemoveDelegatorEvalDurationUpdated(opts *bind.FilterOpts, _removeDelegatorEvalDuration []*big.Int) (*DelegateManagerRemoveDelegatorEvalDurationUpdatedIterator, error) {

	var _removeDelegatorEvalDurationRule []interface{}
	for _, _removeDelegatorEvalDurationItem := range _removeDelegatorEvalDuration {
		_removeDelegatorEvalDurationRule = append(_removeDelegatorEvalDurationRule, _removeDelegatorEvalDurationItem)
	}

	logs, sub, err := _DelegateManager.contract.FilterLogs(opts, "RemoveDelegatorEvalDurationUpdated", _removeDelegatorEvalDurationRule)
	if err != nil {
		return nil, err
	}
	return &DelegateManagerRemoveDelegatorEvalDurationUpdatedIterator{contract: _DelegateManager.contract, event: "RemoveDelegatorEvalDurationUpdated", logs: logs, sub: sub}, nil
}

// WatchRemoveDelegatorEvalDurationUpdated is a free log subscription operation binding the contract event 0x10c34e4da809ce0e816d31562e6f5a3d38f913c470dd384ed0a73710281b23dd.
//
// Solidity: event RemoveDelegatorEvalDurationUpdated(uint256 indexed _removeDelegatorEvalDuration)
func (_DelegateManager *DelegateManagerFilterer) WatchRemoveDelegatorEvalDurationUpdated(opts *bind.WatchOpts, sink chan<- *DelegateManagerRemoveDelegatorEvalDurationUpdated, _removeDelegatorEvalDuration []*big.Int) (event.Subscription, error) {

	var _removeDelegatorEvalDurationRule []interface{}
	for _, _removeDelegatorEvalDurationItem := range _removeDelegatorEvalDuration {
		_removeDelegatorEvalDurationRule = append(_removeDelegatorEvalDurationRule, _removeDelegatorEvalDurationItem)
	}

	logs, sub, err := _DelegateManager.contract.WatchLogs(opts, "RemoveDelegatorEvalDurationUpdated", _removeDelegatorEvalDurationRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(DelegateManagerRemoveDelegatorEvalDurationUpdated)
				if err := _DelegateManager.contract.UnpackLog(event, "RemoveDelegatorEvalDurationUpdated", log); err != nil {
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
func (_DelegateManager *DelegateManagerFilterer) ParseRemoveDelegatorEvalDurationUpdated(log types.Log) (*DelegateManagerRemoveDelegatorEvalDurationUpdated, error) {
	event := new(DelegateManagerRemoveDelegatorEvalDurationUpdated)
	if err := _DelegateManager.contract.UnpackLog(event, "RemoveDelegatorEvalDurationUpdated", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// DelegateManagerRemoveDelegatorLockupDurationUpdatedIterator is returned from FilterRemoveDelegatorLockupDurationUpdated and is used to iterate over the raw logs and unpacked data for RemoveDelegatorLockupDurationUpdated events raised by the DelegateManager contract.
type DelegateManagerRemoveDelegatorLockupDurationUpdatedIterator struct {
	Event *DelegateManagerRemoveDelegatorLockupDurationUpdated // Event containing the contract specifics and raw log

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
func (it *DelegateManagerRemoveDelegatorLockupDurationUpdatedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(DelegateManagerRemoveDelegatorLockupDurationUpdated)
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
		it.Event = new(DelegateManagerRemoveDelegatorLockupDurationUpdated)
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
func (it *DelegateManagerRemoveDelegatorLockupDurationUpdatedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *DelegateManagerRemoveDelegatorLockupDurationUpdatedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// DelegateManagerRemoveDelegatorLockupDurationUpdated represents a RemoveDelegatorLockupDurationUpdated event raised by the DelegateManager contract.
type DelegateManagerRemoveDelegatorLockupDurationUpdated struct {
	RemoveDelegatorLockupDuration *big.Int
	Raw                           types.Log // Blockchain specific contextual infos
}

// FilterRemoveDelegatorLockupDurationUpdated is a free log retrieval operation binding the contract event 0x6e9686f24e1165005f49d9abb260eb40aed402da21db4894ebd3895a6519a454.
//
// Solidity: event RemoveDelegatorLockupDurationUpdated(uint256 indexed _removeDelegatorLockupDuration)
func (_DelegateManager *DelegateManagerFilterer) FilterRemoveDelegatorLockupDurationUpdated(opts *bind.FilterOpts, _removeDelegatorLockupDuration []*big.Int) (*DelegateManagerRemoveDelegatorLockupDurationUpdatedIterator, error) {

	var _removeDelegatorLockupDurationRule []interface{}
	for _, _removeDelegatorLockupDurationItem := range _removeDelegatorLockupDuration {
		_removeDelegatorLockupDurationRule = append(_removeDelegatorLockupDurationRule, _removeDelegatorLockupDurationItem)
	}

	logs, sub, err := _DelegateManager.contract.FilterLogs(opts, "RemoveDelegatorLockupDurationUpdated", _removeDelegatorLockupDurationRule)
	if err != nil {
		return nil, err
	}
	return &DelegateManagerRemoveDelegatorLockupDurationUpdatedIterator{contract: _DelegateManager.contract, event: "RemoveDelegatorLockupDurationUpdated", logs: logs, sub: sub}, nil
}

// WatchRemoveDelegatorLockupDurationUpdated is a free log subscription operation binding the contract event 0x6e9686f24e1165005f49d9abb260eb40aed402da21db4894ebd3895a6519a454.
//
// Solidity: event RemoveDelegatorLockupDurationUpdated(uint256 indexed _removeDelegatorLockupDuration)
func (_DelegateManager *DelegateManagerFilterer) WatchRemoveDelegatorLockupDurationUpdated(opts *bind.WatchOpts, sink chan<- *DelegateManagerRemoveDelegatorLockupDurationUpdated, _removeDelegatorLockupDuration []*big.Int) (event.Subscription, error) {

	var _removeDelegatorLockupDurationRule []interface{}
	for _, _removeDelegatorLockupDurationItem := range _removeDelegatorLockupDuration {
		_removeDelegatorLockupDurationRule = append(_removeDelegatorLockupDurationRule, _removeDelegatorLockupDurationItem)
	}

	logs, sub, err := _DelegateManager.contract.WatchLogs(opts, "RemoveDelegatorLockupDurationUpdated", _removeDelegatorLockupDurationRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(DelegateManagerRemoveDelegatorLockupDurationUpdated)
				if err := _DelegateManager.contract.UnpackLog(event, "RemoveDelegatorLockupDurationUpdated", log); err != nil {
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
func (_DelegateManager *DelegateManagerFilterer) ParseRemoveDelegatorLockupDurationUpdated(log types.Log) (*DelegateManagerRemoveDelegatorLockupDurationUpdated, error) {
	event := new(DelegateManagerRemoveDelegatorLockupDurationUpdated)
	if err := _DelegateManager.contract.UnpackLog(event, "RemoveDelegatorLockupDurationUpdated", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// DelegateManagerRemoveDelegatorRequestCancelledIterator is returned from FilterRemoveDelegatorRequestCancelled and is used to iterate over the raw logs and unpacked data for RemoveDelegatorRequestCancelled events raised by the DelegateManager contract.
type DelegateManagerRemoveDelegatorRequestCancelledIterator struct {
	Event *DelegateManagerRemoveDelegatorRequestCancelled // Event containing the contract specifics and raw log

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
func (it *DelegateManagerRemoveDelegatorRequestCancelledIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(DelegateManagerRemoveDelegatorRequestCancelled)
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
		it.Event = new(DelegateManagerRemoveDelegatorRequestCancelled)
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
func (it *DelegateManagerRemoveDelegatorRequestCancelledIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *DelegateManagerRemoveDelegatorRequestCancelledIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// DelegateManagerRemoveDelegatorRequestCancelled represents a RemoveDelegatorRequestCancelled event raised by the DelegateManager contract.
type DelegateManagerRemoveDelegatorRequestCancelled struct {
	ServiceProvider common.Address
	Delegator       common.Address
	Raw             types.Log // Blockchain specific contextual infos
}

// FilterRemoveDelegatorRequestCancelled is a free log retrieval operation binding the contract event 0xd7a1b9c3d30d51412b848777bffec951c371bf58a13788d70c12f534f82d4cb3.
//
// Solidity: event RemoveDelegatorRequestCancelled(address indexed _serviceProvider, address indexed _delegator)
func (_DelegateManager *DelegateManagerFilterer) FilterRemoveDelegatorRequestCancelled(opts *bind.FilterOpts, _serviceProvider []common.Address, _delegator []common.Address) (*DelegateManagerRemoveDelegatorRequestCancelledIterator, error) {

	var _serviceProviderRule []interface{}
	for _, _serviceProviderItem := range _serviceProvider {
		_serviceProviderRule = append(_serviceProviderRule, _serviceProviderItem)
	}
	var _delegatorRule []interface{}
	for _, _delegatorItem := range _delegator {
		_delegatorRule = append(_delegatorRule, _delegatorItem)
	}

	logs, sub, err := _DelegateManager.contract.FilterLogs(opts, "RemoveDelegatorRequestCancelled", _serviceProviderRule, _delegatorRule)
	if err != nil {
		return nil, err
	}
	return &DelegateManagerRemoveDelegatorRequestCancelledIterator{contract: _DelegateManager.contract, event: "RemoveDelegatorRequestCancelled", logs: logs, sub: sub}, nil
}

// WatchRemoveDelegatorRequestCancelled is a free log subscription operation binding the contract event 0xd7a1b9c3d30d51412b848777bffec951c371bf58a13788d70c12f534f82d4cb3.
//
// Solidity: event RemoveDelegatorRequestCancelled(address indexed _serviceProvider, address indexed _delegator)
func (_DelegateManager *DelegateManagerFilterer) WatchRemoveDelegatorRequestCancelled(opts *bind.WatchOpts, sink chan<- *DelegateManagerRemoveDelegatorRequestCancelled, _serviceProvider []common.Address, _delegator []common.Address) (event.Subscription, error) {

	var _serviceProviderRule []interface{}
	for _, _serviceProviderItem := range _serviceProvider {
		_serviceProviderRule = append(_serviceProviderRule, _serviceProviderItem)
	}
	var _delegatorRule []interface{}
	for _, _delegatorItem := range _delegator {
		_delegatorRule = append(_delegatorRule, _delegatorItem)
	}

	logs, sub, err := _DelegateManager.contract.WatchLogs(opts, "RemoveDelegatorRequestCancelled", _serviceProviderRule, _delegatorRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(DelegateManagerRemoveDelegatorRequestCancelled)
				if err := _DelegateManager.contract.UnpackLog(event, "RemoveDelegatorRequestCancelled", log); err != nil {
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
func (_DelegateManager *DelegateManagerFilterer) ParseRemoveDelegatorRequestCancelled(log types.Log) (*DelegateManagerRemoveDelegatorRequestCancelled, error) {
	event := new(DelegateManagerRemoveDelegatorRequestCancelled)
	if err := _DelegateManager.contract.UnpackLog(event, "RemoveDelegatorRequestCancelled", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// DelegateManagerRemoveDelegatorRequestEvaluatedIterator is returned from FilterRemoveDelegatorRequestEvaluated and is used to iterate over the raw logs and unpacked data for RemoveDelegatorRequestEvaluated events raised by the DelegateManager contract.
type DelegateManagerRemoveDelegatorRequestEvaluatedIterator struct {
	Event *DelegateManagerRemoveDelegatorRequestEvaluated // Event containing the contract specifics and raw log

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
func (it *DelegateManagerRemoveDelegatorRequestEvaluatedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(DelegateManagerRemoveDelegatorRequestEvaluated)
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
		it.Event = new(DelegateManagerRemoveDelegatorRequestEvaluated)
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
func (it *DelegateManagerRemoveDelegatorRequestEvaluatedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *DelegateManagerRemoveDelegatorRequestEvaluatedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// DelegateManagerRemoveDelegatorRequestEvaluated represents a RemoveDelegatorRequestEvaluated event raised by the DelegateManager contract.
type DelegateManagerRemoveDelegatorRequestEvaluated struct {
	ServiceProvider common.Address
	Delegator       common.Address
	UnstakedAmount  *big.Int
	Raw             types.Log // Blockchain specific contextual infos
}

// FilterRemoveDelegatorRequestEvaluated is a free log retrieval operation binding the contract event 0x912ca4f48e16ea4ec940ef9071c9cc3eb57f01c07e052b1f797caaade6504f8b.
//
// Solidity: event RemoveDelegatorRequestEvaluated(address indexed _serviceProvider, address indexed _delegator, uint256 indexed _unstakedAmount)
func (_DelegateManager *DelegateManagerFilterer) FilterRemoveDelegatorRequestEvaluated(opts *bind.FilterOpts, _serviceProvider []common.Address, _delegator []common.Address, _unstakedAmount []*big.Int) (*DelegateManagerRemoveDelegatorRequestEvaluatedIterator, error) {

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

	logs, sub, err := _DelegateManager.contract.FilterLogs(opts, "RemoveDelegatorRequestEvaluated", _serviceProviderRule, _delegatorRule, _unstakedAmountRule)
	if err != nil {
		return nil, err
	}
	return &DelegateManagerRemoveDelegatorRequestEvaluatedIterator{contract: _DelegateManager.contract, event: "RemoveDelegatorRequestEvaluated", logs: logs, sub: sub}, nil
}

// WatchRemoveDelegatorRequestEvaluated is a free log subscription operation binding the contract event 0x912ca4f48e16ea4ec940ef9071c9cc3eb57f01c07e052b1f797caaade6504f8b.
//
// Solidity: event RemoveDelegatorRequestEvaluated(address indexed _serviceProvider, address indexed _delegator, uint256 indexed _unstakedAmount)
func (_DelegateManager *DelegateManagerFilterer) WatchRemoveDelegatorRequestEvaluated(opts *bind.WatchOpts, sink chan<- *DelegateManagerRemoveDelegatorRequestEvaluated, _serviceProvider []common.Address, _delegator []common.Address, _unstakedAmount []*big.Int) (event.Subscription, error) {

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

	logs, sub, err := _DelegateManager.contract.WatchLogs(opts, "RemoveDelegatorRequestEvaluated", _serviceProviderRule, _delegatorRule, _unstakedAmountRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(DelegateManagerRemoveDelegatorRequestEvaluated)
				if err := _DelegateManager.contract.UnpackLog(event, "RemoveDelegatorRequestEvaluated", log); err != nil {
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
func (_DelegateManager *DelegateManagerFilterer) ParseRemoveDelegatorRequestEvaluated(log types.Log) (*DelegateManagerRemoveDelegatorRequestEvaluated, error) {
	event := new(DelegateManagerRemoveDelegatorRequestEvaluated)
	if err := _DelegateManager.contract.UnpackLog(event, "RemoveDelegatorRequestEvaluated", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// DelegateManagerRemoveDelegatorRequestedIterator is returned from FilterRemoveDelegatorRequested and is used to iterate over the raw logs and unpacked data for RemoveDelegatorRequested events raised by the DelegateManager contract.
type DelegateManagerRemoveDelegatorRequestedIterator struct {
	Event *DelegateManagerRemoveDelegatorRequested // Event containing the contract specifics and raw log

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
func (it *DelegateManagerRemoveDelegatorRequestedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(DelegateManagerRemoveDelegatorRequested)
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
		it.Event = new(DelegateManagerRemoveDelegatorRequested)
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
func (it *DelegateManagerRemoveDelegatorRequestedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *DelegateManagerRemoveDelegatorRequestedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// DelegateManagerRemoveDelegatorRequested represents a RemoveDelegatorRequested event raised by the DelegateManager contract.
type DelegateManagerRemoveDelegatorRequested struct {
	ServiceProvider   common.Address
	Delegator         common.Address
	LockupExpiryBlock *big.Int
	Raw               types.Log // Blockchain specific contextual infos
}

// FilterRemoveDelegatorRequested is a free log retrieval operation binding the contract event 0xd6f2f5867e98ef295f42626fa37ec5192436d80d6b552dc38c971b9ddbe16e10.
//
// Solidity: event RemoveDelegatorRequested(address indexed _serviceProvider, address indexed _delegator, uint256 indexed _lockupExpiryBlock)
func (_DelegateManager *DelegateManagerFilterer) FilterRemoveDelegatorRequested(opts *bind.FilterOpts, _serviceProvider []common.Address, _delegator []common.Address, _lockupExpiryBlock []*big.Int) (*DelegateManagerRemoveDelegatorRequestedIterator, error) {

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

	logs, sub, err := _DelegateManager.contract.FilterLogs(opts, "RemoveDelegatorRequested", _serviceProviderRule, _delegatorRule, _lockupExpiryBlockRule)
	if err != nil {
		return nil, err
	}
	return &DelegateManagerRemoveDelegatorRequestedIterator{contract: _DelegateManager.contract, event: "RemoveDelegatorRequested", logs: logs, sub: sub}, nil
}

// WatchRemoveDelegatorRequested is a free log subscription operation binding the contract event 0xd6f2f5867e98ef295f42626fa37ec5192436d80d6b552dc38c971b9ddbe16e10.
//
// Solidity: event RemoveDelegatorRequested(address indexed _serviceProvider, address indexed _delegator, uint256 indexed _lockupExpiryBlock)
func (_DelegateManager *DelegateManagerFilterer) WatchRemoveDelegatorRequested(opts *bind.WatchOpts, sink chan<- *DelegateManagerRemoveDelegatorRequested, _serviceProvider []common.Address, _delegator []common.Address, _lockupExpiryBlock []*big.Int) (event.Subscription, error) {

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

	logs, sub, err := _DelegateManager.contract.WatchLogs(opts, "RemoveDelegatorRequested", _serviceProviderRule, _delegatorRule, _lockupExpiryBlockRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(DelegateManagerRemoveDelegatorRequested)
				if err := _DelegateManager.contract.UnpackLog(event, "RemoveDelegatorRequested", log); err != nil {
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
func (_DelegateManager *DelegateManagerFilterer) ParseRemoveDelegatorRequested(log types.Log) (*DelegateManagerRemoveDelegatorRequested, error) {
	event := new(DelegateManagerRemoveDelegatorRequested)
	if err := _DelegateManager.contract.UnpackLog(event, "RemoveDelegatorRequested", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// DelegateManagerSPMinDelegationAmountUpdatedIterator is returned from FilterSPMinDelegationAmountUpdated and is used to iterate over the raw logs and unpacked data for SPMinDelegationAmountUpdated events raised by the DelegateManager contract.
type DelegateManagerSPMinDelegationAmountUpdatedIterator struct {
	Event *DelegateManagerSPMinDelegationAmountUpdated // Event containing the contract specifics and raw log

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
func (it *DelegateManagerSPMinDelegationAmountUpdatedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(DelegateManagerSPMinDelegationAmountUpdated)
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
		it.Event = new(DelegateManagerSPMinDelegationAmountUpdated)
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
func (it *DelegateManagerSPMinDelegationAmountUpdatedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *DelegateManagerSPMinDelegationAmountUpdatedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// DelegateManagerSPMinDelegationAmountUpdated represents a SPMinDelegationAmountUpdated event raised by the DelegateManager contract.
type DelegateManagerSPMinDelegationAmountUpdated struct {
	ServiceProvider       common.Address
	SpMinDelegationAmount *big.Int
	Raw                   types.Log // Blockchain specific contextual infos
}

// FilterSPMinDelegationAmountUpdated is a free log retrieval operation binding the contract event 0xb5cbea0eea08e03cbff1c1db26b3125d44b4dd567d36c988c01ca3f6e694aea3.
//
// Solidity: event SPMinDelegationAmountUpdated(address indexed _serviceProvider, uint256 indexed _spMinDelegationAmount)
func (_DelegateManager *DelegateManagerFilterer) FilterSPMinDelegationAmountUpdated(opts *bind.FilterOpts, _serviceProvider []common.Address, _spMinDelegationAmount []*big.Int) (*DelegateManagerSPMinDelegationAmountUpdatedIterator, error) {

	var _serviceProviderRule []interface{}
	for _, _serviceProviderItem := range _serviceProvider {
		_serviceProviderRule = append(_serviceProviderRule, _serviceProviderItem)
	}
	var _spMinDelegationAmountRule []interface{}
	for _, _spMinDelegationAmountItem := range _spMinDelegationAmount {
		_spMinDelegationAmountRule = append(_spMinDelegationAmountRule, _spMinDelegationAmountItem)
	}

	logs, sub, err := _DelegateManager.contract.FilterLogs(opts, "SPMinDelegationAmountUpdated", _serviceProviderRule, _spMinDelegationAmountRule)
	if err != nil {
		return nil, err
	}
	return &DelegateManagerSPMinDelegationAmountUpdatedIterator{contract: _DelegateManager.contract, event: "SPMinDelegationAmountUpdated", logs: logs, sub: sub}, nil
}

// WatchSPMinDelegationAmountUpdated is a free log subscription operation binding the contract event 0xb5cbea0eea08e03cbff1c1db26b3125d44b4dd567d36c988c01ca3f6e694aea3.
//
// Solidity: event SPMinDelegationAmountUpdated(address indexed _serviceProvider, uint256 indexed _spMinDelegationAmount)
func (_DelegateManager *DelegateManagerFilterer) WatchSPMinDelegationAmountUpdated(opts *bind.WatchOpts, sink chan<- *DelegateManagerSPMinDelegationAmountUpdated, _serviceProvider []common.Address, _spMinDelegationAmount []*big.Int) (event.Subscription, error) {

	var _serviceProviderRule []interface{}
	for _, _serviceProviderItem := range _serviceProvider {
		_serviceProviderRule = append(_serviceProviderRule, _serviceProviderItem)
	}
	var _spMinDelegationAmountRule []interface{}
	for _, _spMinDelegationAmountItem := range _spMinDelegationAmount {
		_spMinDelegationAmountRule = append(_spMinDelegationAmountRule, _spMinDelegationAmountItem)
	}

	logs, sub, err := _DelegateManager.contract.WatchLogs(opts, "SPMinDelegationAmountUpdated", _serviceProviderRule, _spMinDelegationAmountRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(DelegateManagerSPMinDelegationAmountUpdated)
				if err := _DelegateManager.contract.UnpackLog(event, "SPMinDelegationAmountUpdated", log); err != nil {
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
func (_DelegateManager *DelegateManagerFilterer) ParseSPMinDelegationAmountUpdated(log types.Log) (*DelegateManagerSPMinDelegationAmountUpdated, error) {
	event := new(DelegateManagerSPMinDelegationAmountUpdated)
	if err := _DelegateManager.contract.UnpackLog(event, "SPMinDelegationAmountUpdated", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// DelegateManagerServiceProviderFactoryAddressUpdatedIterator is returned from FilterServiceProviderFactoryAddressUpdated and is used to iterate over the raw logs and unpacked data for ServiceProviderFactoryAddressUpdated events raised by the DelegateManager contract.
type DelegateManagerServiceProviderFactoryAddressUpdatedIterator struct {
	Event *DelegateManagerServiceProviderFactoryAddressUpdated // Event containing the contract specifics and raw log

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
func (it *DelegateManagerServiceProviderFactoryAddressUpdatedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(DelegateManagerServiceProviderFactoryAddressUpdated)
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
		it.Event = new(DelegateManagerServiceProviderFactoryAddressUpdated)
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
func (it *DelegateManagerServiceProviderFactoryAddressUpdatedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *DelegateManagerServiceProviderFactoryAddressUpdatedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// DelegateManagerServiceProviderFactoryAddressUpdated represents a ServiceProviderFactoryAddressUpdated event raised by the DelegateManager contract.
type DelegateManagerServiceProviderFactoryAddressUpdated struct {
	NewServiceProviderFactoryAddress common.Address
	Raw                              types.Log // Blockchain specific contextual infos
}

// FilterServiceProviderFactoryAddressUpdated is a free log retrieval operation binding the contract event 0x373f84f0177a6c2e019f2e0e73c988359e56e111629a261c9bba5c968c383ed1.
//
// Solidity: event ServiceProviderFactoryAddressUpdated(address indexed _newServiceProviderFactoryAddress)
func (_DelegateManager *DelegateManagerFilterer) FilterServiceProviderFactoryAddressUpdated(opts *bind.FilterOpts, _newServiceProviderFactoryAddress []common.Address) (*DelegateManagerServiceProviderFactoryAddressUpdatedIterator, error) {

	var _newServiceProviderFactoryAddressRule []interface{}
	for _, _newServiceProviderFactoryAddressItem := range _newServiceProviderFactoryAddress {
		_newServiceProviderFactoryAddressRule = append(_newServiceProviderFactoryAddressRule, _newServiceProviderFactoryAddressItem)
	}

	logs, sub, err := _DelegateManager.contract.FilterLogs(opts, "ServiceProviderFactoryAddressUpdated", _newServiceProviderFactoryAddressRule)
	if err != nil {
		return nil, err
	}
	return &DelegateManagerServiceProviderFactoryAddressUpdatedIterator{contract: _DelegateManager.contract, event: "ServiceProviderFactoryAddressUpdated", logs: logs, sub: sub}, nil
}

// WatchServiceProviderFactoryAddressUpdated is a free log subscription operation binding the contract event 0x373f84f0177a6c2e019f2e0e73c988359e56e111629a261c9bba5c968c383ed1.
//
// Solidity: event ServiceProviderFactoryAddressUpdated(address indexed _newServiceProviderFactoryAddress)
func (_DelegateManager *DelegateManagerFilterer) WatchServiceProviderFactoryAddressUpdated(opts *bind.WatchOpts, sink chan<- *DelegateManagerServiceProviderFactoryAddressUpdated, _newServiceProviderFactoryAddress []common.Address) (event.Subscription, error) {

	var _newServiceProviderFactoryAddressRule []interface{}
	for _, _newServiceProviderFactoryAddressItem := range _newServiceProviderFactoryAddress {
		_newServiceProviderFactoryAddressRule = append(_newServiceProviderFactoryAddressRule, _newServiceProviderFactoryAddressItem)
	}

	logs, sub, err := _DelegateManager.contract.WatchLogs(opts, "ServiceProviderFactoryAddressUpdated", _newServiceProviderFactoryAddressRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(DelegateManagerServiceProviderFactoryAddressUpdated)
				if err := _DelegateManager.contract.UnpackLog(event, "ServiceProviderFactoryAddressUpdated", log); err != nil {
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
func (_DelegateManager *DelegateManagerFilterer) ParseServiceProviderFactoryAddressUpdated(log types.Log) (*DelegateManagerServiceProviderFactoryAddressUpdated, error) {
	event := new(DelegateManagerServiceProviderFactoryAddressUpdated)
	if err := _DelegateManager.contract.UnpackLog(event, "ServiceProviderFactoryAddressUpdated", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// DelegateManagerSlashIterator is returned from FilterSlash and is used to iterate over the raw logs and unpacked data for Slash events raised by the DelegateManager contract.
type DelegateManagerSlashIterator struct {
	Event *DelegateManagerSlash // Event containing the contract specifics and raw log

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
func (it *DelegateManagerSlashIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(DelegateManagerSlash)
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
		it.Event = new(DelegateManagerSlash)
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
func (it *DelegateManagerSlashIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *DelegateManagerSlashIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// DelegateManagerSlash represents a Slash event raised by the DelegateManager contract.
type DelegateManagerSlash struct {
	Target   common.Address
	Amount   *big.Int
	NewTotal *big.Int
	Raw      types.Log // Blockchain specific contextual infos
}

// FilterSlash is a free log retrieval operation binding the contract event 0xe05ad941535eea602efe44ddd7d96e5db6ad9a4865c360257aad8cf4c0a94469.
//
// Solidity: event Slash(address indexed _target, uint256 indexed _amount, uint256 indexed _newTotal)
func (_DelegateManager *DelegateManagerFilterer) FilterSlash(opts *bind.FilterOpts, _target []common.Address, _amount []*big.Int, _newTotal []*big.Int) (*DelegateManagerSlashIterator, error) {

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

	logs, sub, err := _DelegateManager.contract.FilterLogs(opts, "Slash", _targetRule, _amountRule, _newTotalRule)
	if err != nil {
		return nil, err
	}
	return &DelegateManagerSlashIterator{contract: _DelegateManager.contract, event: "Slash", logs: logs, sub: sub}, nil
}

// WatchSlash is a free log subscription operation binding the contract event 0xe05ad941535eea602efe44ddd7d96e5db6ad9a4865c360257aad8cf4c0a94469.
//
// Solidity: event Slash(address indexed _target, uint256 indexed _amount, uint256 indexed _newTotal)
func (_DelegateManager *DelegateManagerFilterer) WatchSlash(opts *bind.WatchOpts, sink chan<- *DelegateManagerSlash, _target []common.Address, _amount []*big.Int, _newTotal []*big.Int) (event.Subscription, error) {

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

	logs, sub, err := _DelegateManager.contract.WatchLogs(opts, "Slash", _targetRule, _amountRule, _newTotalRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(DelegateManagerSlash)
				if err := _DelegateManager.contract.UnpackLog(event, "Slash", log); err != nil {
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
func (_DelegateManager *DelegateManagerFilterer) ParseSlash(log types.Log) (*DelegateManagerSlash, error) {
	event := new(DelegateManagerSlash)
	if err := _DelegateManager.contract.UnpackLog(event, "Slash", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// DelegateManagerStakingAddressUpdatedIterator is returned from FilterStakingAddressUpdated and is used to iterate over the raw logs and unpacked data for StakingAddressUpdated events raised by the DelegateManager contract.
type DelegateManagerStakingAddressUpdatedIterator struct {
	Event *DelegateManagerStakingAddressUpdated // Event containing the contract specifics and raw log

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
func (it *DelegateManagerStakingAddressUpdatedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(DelegateManagerStakingAddressUpdated)
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
		it.Event = new(DelegateManagerStakingAddressUpdated)
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
func (it *DelegateManagerStakingAddressUpdatedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *DelegateManagerStakingAddressUpdatedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// DelegateManagerStakingAddressUpdated represents a StakingAddressUpdated event raised by the DelegateManager contract.
type DelegateManagerStakingAddressUpdated struct {
	NewStakingAddress common.Address
	Raw               types.Log // Blockchain specific contextual infos
}

// FilterStakingAddressUpdated is a free log retrieval operation binding the contract event 0x8ae96d8af35324a34b19e4f33e72d620b502f69595bb43870ab5fd7a7de78239.
//
// Solidity: event StakingAddressUpdated(address indexed _newStakingAddress)
func (_DelegateManager *DelegateManagerFilterer) FilterStakingAddressUpdated(opts *bind.FilterOpts, _newStakingAddress []common.Address) (*DelegateManagerStakingAddressUpdatedIterator, error) {

	var _newStakingAddressRule []interface{}
	for _, _newStakingAddressItem := range _newStakingAddress {
		_newStakingAddressRule = append(_newStakingAddressRule, _newStakingAddressItem)
	}

	logs, sub, err := _DelegateManager.contract.FilterLogs(opts, "StakingAddressUpdated", _newStakingAddressRule)
	if err != nil {
		return nil, err
	}
	return &DelegateManagerStakingAddressUpdatedIterator{contract: _DelegateManager.contract, event: "StakingAddressUpdated", logs: logs, sub: sub}, nil
}

// WatchStakingAddressUpdated is a free log subscription operation binding the contract event 0x8ae96d8af35324a34b19e4f33e72d620b502f69595bb43870ab5fd7a7de78239.
//
// Solidity: event StakingAddressUpdated(address indexed _newStakingAddress)
func (_DelegateManager *DelegateManagerFilterer) WatchStakingAddressUpdated(opts *bind.WatchOpts, sink chan<- *DelegateManagerStakingAddressUpdated, _newStakingAddress []common.Address) (event.Subscription, error) {

	var _newStakingAddressRule []interface{}
	for _, _newStakingAddressItem := range _newStakingAddress {
		_newStakingAddressRule = append(_newStakingAddressRule, _newStakingAddressItem)
	}

	logs, sub, err := _DelegateManager.contract.WatchLogs(opts, "StakingAddressUpdated", _newStakingAddressRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(DelegateManagerStakingAddressUpdated)
				if err := _DelegateManager.contract.UnpackLog(event, "StakingAddressUpdated", log); err != nil {
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
func (_DelegateManager *DelegateManagerFilterer) ParseStakingAddressUpdated(log types.Log) (*DelegateManagerStakingAddressUpdated, error) {
	event := new(DelegateManagerStakingAddressUpdated)
	if err := _DelegateManager.contract.UnpackLog(event, "StakingAddressUpdated", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// DelegateManagerUndelegateLockupDurationUpdatedIterator is returned from FilterUndelegateLockupDurationUpdated and is used to iterate over the raw logs and unpacked data for UndelegateLockupDurationUpdated events raised by the DelegateManager contract.
type DelegateManagerUndelegateLockupDurationUpdatedIterator struct {
	Event *DelegateManagerUndelegateLockupDurationUpdated // Event containing the contract specifics and raw log

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
func (it *DelegateManagerUndelegateLockupDurationUpdatedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(DelegateManagerUndelegateLockupDurationUpdated)
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
		it.Event = new(DelegateManagerUndelegateLockupDurationUpdated)
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
func (it *DelegateManagerUndelegateLockupDurationUpdatedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *DelegateManagerUndelegateLockupDurationUpdatedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// DelegateManagerUndelegateLockupDurationUpdated represents a UndelegateLockupDurationUpdated event raised by the DelegateManager contract.
type DelegateManagerUndelegateLockupDurationUpdated struct {
	UndelegateLockupDuration *big.Int
	Raw                      types.Log // Blockchain specific contextual infos
}

// FilterUndelegateLockupDurationUpdated is a free log retrieval operation binding the contract event 0xcb0491a1854ba445c5afa53dcbe6d6224e52d99cb73840cb58b0c5b79cd434bf.
//
// Solidity: event UndelegateLockupDurationUpdated(uint256 indexed _undelegateLockupDuration)
func (_DelegateManager *DelegateManagerFilterer) FilterUndelegateLockupDurationUpdated(opts *bind.FilterOpts, _undelegateLockupDuration []*big.Int) (*DelegateManagerUndelegateLockupDurationUpdatedIterator, error) {

	var _undelegateLockupDurationRule []interface{}
	for _, _undelegateLockupDurationItem := range _undelegateLockupDuration {
		_undelegateLockupDurationRule = append(_undelegateLockupDurationRule, _undelegateLockupDurationItem)
	}

	logs, sub, err := _DelegateManager.contract.FilterLogs(opts, "UndelegateLockupDurationUpdated", _undelegateLockupDurationRule)
	if err != nil {
		return nil, err
	}
	return &DelegateManagerUndelegateLockupDurationUpdatedIterator{contract: _DelegateManager.contract, event: "UndelegateLockupDurationUpdated", logs: logs, sub: sub}, nil
}

// WatchUndelegateLockupDurationUpdated is a free log subscription operation binding the contract event 0xcb0491a1854ba445c5afa53dcbe6d6224e52d99cb73840cb58b0c5b79cd434bf.
//
// Solidity: event UndelegateLockupDurationUpdated(uint256 indexed _undelegateLockupDuration)
func (_DelegateManager *DelegateManagerFilterer) WatchUndelegateLockupDurationUpdated(opts *bind.WatchOpts, sink chan<- *DelegateManagerUndelegateLockupDurationUpdated, _undelegateLockupDuration []*big.Int) (event.Subscription, error) {

	var _undelegateLockupDurationRule []interface{}
	for _, _undelegateLockupDurationItem := range _undelegateLockupDuration {
		_undelegateLockupDurationRule = append(_undelegateLockupDurationRule, _undelegateLockupDurationItem)
	}

	logs, sub, err := _DelegateManager.contract.WatchLogs(opts, "UndelegateLockupDurationUpdated", _undelegateLockupDurationRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(DelegateManagerUndelegateLockupDurationUpdated)
				if err := _DelegateManager.contract.UnpackLog(event, "UndelegateLockupDurationUpdated", log); err != nil {
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
func (_DelegateManager *DelegateManagerFilterer) ParseUndelegateLockupDurationUpdated(log types.Log) (*DelegateManagerUndelegateLockupDurationUpdated, error) {
	event := new(DelegateManagerUndelegateLockupDurationUpdated)
	if err := _DelegateManager.contract.UnpackLog(event, "UndelegateLockupDurationUpdated", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// DelegateManagerUndelegateStakeRequestCancelledIterator is returned from FilterUndelegateStakeRequestCancelled and is used to iterate over the raw logs and unpacked data for UndelegateStakeRequestCancelled events raised by the DelegateManager contract.
type DelegateManagerUndelegateStakeRequestCancelledIterator struct {
	Event *DelegateManagerUndelegateStakeRequestCancelled // Event containing the contract specifics and raw log

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
func (it *DelegateManagerUndelegateStakeRequestCancelledIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(DelegateManagerUndelegateStakeRequestCancelled)
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
		it.Event = new(DelegateManagerUndelegateStakeRequestCancelled)
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
func (it *DelegateManagerUndelegateStakeRequestCancelledIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *DelegateManagerUndelegateStakeRequestCancelledIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// DelegateManagerUndelegateStakeRequestCancelled represents a UndelegateStakeRequestCancelled event raised by the DelegateManager contract.
type DelegateManagerUndelegateStakeRequestCancelled struct {
	Delegator       common.Address
	ServiceProvider common.Address
	Amount          *big.Int
	Raw             types.Log // Blockchain specific contextual infos
}

// FilterUndelegateStakeRequestCancelled is a free log retrieval operation binding the contract event 0xdd2f922d72fb35f887498001c4c6bc61a53f40a51ad38c576e092bc7c6883523.
//
// Solidity: event UndelegateStakeRequestCancelled(address indexed _delegator, address indexed _serviceProvider, uint256 indexed _amount)
func (_DelegateManager *DelegateManagerFilterer) FilterUndelegateStakeRequestCancelled(opts *bind.FilterOpts, _delegator []common.Address, _serviceProvider []common.Address, _amount []*big.Int) (*DelegateManagerUndelegateStakeRequestCancelledIterator, error) {

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

	logs, sub, err := _DelegateManager.contract.FilterLogs(opts, "UndelegateStakeRequestCancelled", _delegatorRule, _serviceProviderRule, _amountRule)
	if err != nil {
		return nil, err
	}
	return &DelegateManagerUndelegateStakeRequestCancelledIterator{contract: _DelegateManager.contract, event: "UndelegateStakeRequestCancelled", logs: logs, sub: sub}, nil
}

// WatchUndelegateStakeRequestCancelled is a free log subscription operation binding the contract event 0xdd2f922d72fb35f887498001c4c6bc61a53f40a51ad38c576e092bc7c6883523.
//
// Solidity: event UndelegateStakeRequestCancelled(address indexed _delegator, address indexed _serviceProvider, uint256 indexed _amount)
func (_DelegateManager *DelegateManagerFilterer) WatchUndelegateStakeRequestCancelled(opts *bind.WatchOpts, sink chan<- *DelegateManagerUndelegateStakeRequestCancelled, _delegator []common.Address, _serviceProvider []common.Address, _amount []*big.Int) (event.Subscription, error) {

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

	logs, sub, err := _DelegateManager.contract.WatchLogs(opts, "UndelegateStakeRequestCancelled", _delegatorRule, _serviceProviderRule, _amountRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(DelegateManagerUndelegateStakeRequestCancelled)
				if err := _DelegateManager.contract.UnpackLog(event, "UndelegateStakeRequestCancelled", log); err != nil {
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
func (_DelegateManager *DelegateManagerFilterer) ParseUndelegateStakeRequestCancelled(log types.Log) (*DelegateManagerUndelegateStakeRequestCancelled, error) {
	event := new(DelegateManagerUndelegateStakeRequestCancelled)
	if err := _DelegateManager.contract.UnpackLog(event, "UndelegateStakeRequestCancelled", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// DelegateManagerUndelegateStakeRequestEvaluatedIterator is returned from FilterUndelegateStakeRequestEvaluated and is used to iterate over the raw logs and unpacked data for UndelegateStakeRequestEvaluated events raised by the DelegateManager contract.
type DelegateManagerUndelegateStakeRequestEvaluatedIterator struct {
	Event *DelegateManagerUndelegateStakeRequestEvaluated // Event containing the contract specifics and raw log

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
func (it *DelegateManagerUndelegateStakeRequestEvaluatedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(DelegateManagerUndelegateStakeRequestEvaluated)
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
		it.Event = new(DelegateManagerUndelegateStakeRequestEvaluated)
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
func (it *DelegateManagerUndelegateStakeRequestEvaluatedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *DelegateManagerUndelegateStakeRequestEvaluatedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// DelegateManagerUndelegateStakeRequestEvaluated represents a UndelegateStakeRequestEvaluated event raised by the DelegateManager contract.
type DelegateManagerUndelegateStakeRequestEvaluated struct {
	Delegator       common.Address
	ServiceProvider common.Address
	Amount          *big.Int
	Raw             types.Log // Blockchain specific contextual infos
}

// FilterUndelegateStakeRequestEvaluated is a free log retrieval operation binding the contract event 0xdf026d8db1c407002e7abde612fb40b6031db7aa35d4b3b699d07627f891e631.
//
// Solidity: event UndelegateStakeRequestEvaluated(address indexed _delegator, address indexed _serviceProvider, uint256 indexed _amount)
func (_DelegateManager *DelegateManagerFilterer) FilterUndelegateStakeRequestEvaluated(opts *bind.FilterOpts, _delegator []common.Address, _serviceProvider []common.Address, _amount []*big.Int) (*DelegateManagerUndelegateStakeRequestEvaluatedIterator, error) {

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

	logs, sub, err := _DelegateManager.contract.FilterLogs(opts, "UndelegateStakeRequestEvaluated", _delegatorRule, _serviceProviderRule, _amountRule)
	if err != nil {
		return nil, err
	}
	return &DelegateManagerUndelegateStakeRequestEvaluatedIterator{contract: _DelegateManager.contract, event: "UndelegateStakeRequestEvaluated", logs: logs, sub: sub}, nil
}

// WatchUndelegateStakeRequestEvaluated is a free log subscription operation binding the contract event 0xdf026d8db1c407002e7abde612fb40b6031db7aa35d4b3b699d07627f891e631.
//
// Solidity: event UndelegateStakeRequestEvaluated(address indexed _delegator, address indexed _serviceProvider, uint256 indexed _amount)
func (_DelegateManager *DelegateManagerFilterer) WatchUndelegateStakeRequestEvaluated(opts *bind.WatchOpts, sink chan<- *DelegateManagerUndelegateStakeRequestEvaluated, _delegator []common.Address, _serviceProvider []common.Address, _amount []*big.Int) (event.Subscription, error) {

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

	logs, sub, err := _DelegateManager.contract.WatchLogs(opts, "UndelegateStakeRequestEvaluated", _delegatorRule, _serviceProviderRule, _amountRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(DelegateManagerUndelegateStakeRequestEvaluated)
				if err := _DelegateManager.contract.UnpackLog(event, "UndelegateStakeRequestEvaluated", log); err != nil {
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
func (_DelegateManager *DelegateManagerFilterer) ParseUndelegateStakeRequestEvaluated(log types.Log) (*DelegateManagerUndelegateStakeRequestEvaluated, error) {
	event := new(DelegateManagerUndelegateStakeRequestEvaluated)
	if err := _DelegateManager.contract.UnpackLog(event, "UndelegateStakeRequestEvaluated", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// DelegateManagerUndelegateStakeRequestedIterator is returned from FilterUndelegateStakeRequested and is used to iterate over the raw logs and unpacked data for UndelegateStakeRequested events raised by the DelegateManager contract.
type DelegateManagerUndelegateStakeRequestedIterator struct {
	Event *DelegateManagerUndelegateStakeRequested // Event containing the contract specifics and raw log

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
func (it *DelegateManagerUndelegateStakeRequestedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(DelegateManagerUndelegateStakeRequested)
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
		it.Event = new(DelegateManagerUndelegateStakeRequested)
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
func (it *DelegateManagerUndelegateStakeRequestedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *DelegateManagerUndelegateStakeRequestedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// DelegateManagerUndelegateStakeRequested represents a UndelegateStakeRequested event raised by the DelegateManager contract.
type DelegateManagerUndelegateStakeRequested struct {
	Delegator         common.Address
	ServiceProvider   common.Address
	Amount            *big.Int
	LockupExpiryBlock *big.Int
	Raw               types.Log // Blockchain specific contextual infos
}

// FilterUndelegateStakeRequested is a free log retrieval operation binding the contract event 0x0c0ebdfe3f3ccdb3ad070f98a3fb9656a7b8781c299a5c0cd0f37e4d5a02556d.
//
// Solidity: event UndelegateStakeRequested(address indexed _delegator, address indexed _serviceProvider, uint256 indexed _amount, uint256 _lockupExpiryBlock)
func (_DelegateManager *DelegateManagerFilterer) FilterUndelegateStakeRequested(opts *bind.FilterOpts, _delegator []common.Address, _serviceProvider []common.Address, _amount []*big.Int) (*DelegateManagerUndelegateStakeRequestedIterator, error) {

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

	logs, sub, err := _DelegateManager.contract.FilterLogs(opts, "UndelegateStakeRequested", _delegatorRule, _serviceProviderRule, _amountRule)
	if err != nil {
		return nil, err
	}
	return &DelegateManagerUndelegateStakeRequestedIterator{contract: _DelegateManager.contract, event: "UndelegateStakeRequested", logs: logs, sub: sub}, nil
}

// WatchUndelegateStakeRequested is a free log subscription operation binding the contract event 0x0c0ebdfe3f3ccdb3ad070f98a3fb9656a7b8781c299a5c0cd0f37e4d5a02556d.
//
// Solidity: event UndelegateStakeRequested(address indexed _delegator, address indexed _serviceProvider, uint256 indexed _amount, uint256 _lockupExpiryBlock)
func (_DelegateManager *DelegateManagerFilterer) WatchUndelegateStakeRequested(opts *bind.WatchOpts, sink chan<- *DelegateManagerUndelegateStakeRequested, _delegator []common.Address, _serviceProvider []common.Address, _amount []*big.Int) (event.Subscription, error) {

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

	logs, sub, err := _DelegateManager.contract.WatchLogs(opts, "UndelegateStakeRequested", _delegatorRule, _serviceProviderRule, _amountRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(DelegateManagerUndelegateStakeRequested)
				if err := _DelegateManager.contract.UnpackLog(event, "UndelegateStakeRequested", log); err != nil {
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
func (_DelegateManager *DelegateManagerFilterer) ParseUndelegateStakeRequested(log types.Log) (*DelegateManagerUndelegateStakeRequested, error) {
	event := new(DelegateManagerUndelegateStakeRequested)
	if err := _DelegateManager.contract.UnpackLog(event, "UndelegateStakeRequested", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}
