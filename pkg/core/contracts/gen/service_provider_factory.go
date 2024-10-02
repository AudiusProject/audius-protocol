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

// ServiceProviderFactoryMetaData contains all meta data concerning the ServiceProviderFactory contract.
var ServiceProviderFactoryMetaData = &bind.MetaData{
	ABI: "[{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"_newClaimsManagerAddress\",\"type\":\"address\"}],\"name\":\"ClaimsManagerAddressUpdated\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"uint256\",\"name\":\"_lockupDuration\",\"type\":\"uint256\"}],\"name\":\"DecreaseStakeLockupDurationUpdated\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"_owner\",\"type\":\"address\"},{\"indexed\":true,\"internalType\":\"uint256\",\"name\":\"_decreaseAmount\",\"type\":\"uint256\"},{\"indexed\":true,\"internalType\":\"uint256\",\"name\":\"_lockupExpiryBlock\",\"type\":\"uint256\"}],\"name\":\"DecreaseStakeRequestCancelled\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"_owner\",\"type\":\"address\"},{\"indexed\":true,\"internalType\":\"uint256\",\"name\":\"_decreaseAmount\",\"type\":\"uint256\"},{\"indexed\":true,\"internalType\":\"uint256\",\"name\":\"_newStakeAmount\",\"type\":\"uint256\"}],\"name\":\"DecreaseStakeRequestEvaluated\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"_owner\",\"type\":\"address\"},{\"indexed\":true,\"internalType\":\"uint256\",\"name\":\"_decreaseAmount\",\"type\":\"uint256\"},{\"indexed\":true,\"internalType\":\"uint256\",\"name\":\"_lockupExpiryBlock\",\"type\":\"uint256\"}],\"name\":\"DecreaseStakeRequested\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"_newDelegateManagerAddress\",\"type\":\"address\"}],\"name\":\"DelegateManagerAddressUpdated\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"_owner\",\"type\":\"address\"},{\"indexed\":true,\"internalType\":\"bytes32\",\"name\":\"_serviceType\",\"type\":\"bytes32\"},{\"indexed\":true,\"internalType\":\"uint256\",\"name\":\"_spID\",\"type\":\"uint256\"},{\"indexed\":false,\"internalType\":\"address\",\"name\":\"_updatedWallet\",\"type\":\"address\"}],\"name\":\"DelegateOwnerWalletUpdated\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"_owner\",\"type\":\"address\"},{\"indexed\":true,\"internalType\":\"uint256\",\"name\":\"_requestedCut\",\"type\":\"uint256\"},{\"indexed\":true,\"internalType\":\"uint256\",\"name\":\"_finalCut\",\"type\":\"uint256\"}],\"name\":\"DeployerCutUpdateRequestCancelled\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"_owner\",\"type\":\"address\"},{\"indexed\":true,\"internalType\":\"uint256\",\"name\":\"_updatedCut\",\"type\":\"uint256\"}],\"name\":\"DeployerCutUpdateRequestEvaluated\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"_owner\",\"type\":\"address\"},{\"indexed\":true,\"internalType\":\"uint256\",\"name\":\"_updatedCut\",\"type\":\"uint256\"},{\"indexed\":true,\"internalType\":\"uint256\",\"name\":\"_lockupExpiryBlock\",\"type\":\"uint256\"}],\"name\":\"DeployerCutUpdateRequested\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"uint256\",\"name\":\"_spID\",\"type\":\"uint256\"},{\"indexed\":true,\"internalType\":\"bytes32\",\"name\":\"_serviceType\",\"type\":\"bytes32\"},{\"indexed\":true,\"internalType\":\"address\",\"name\":\"_owner\",\"type\":\"address\"},{\"indexed\":false,\"internalType\":\"string\",\"name\":\"_endpoint\",\"type\":\"string\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"_unstakeAmount\",\"type\":\"uint256\"}],\"name\":\"DeregisteredServiceProvider\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"bytes32\",\"name\":\"_serviceType\",\"type\":\"bytes32\"},{\"indexed\":true,\"internalType\":\"address\",\"name\":\"_owner\",\"type\":\"address\"},{\"indexed\":false,\"internalType\":\"string\",\"name\":\"_oldEndpoint\",\"type\":\"string\"},{\"indexed\":false,\"internalType\":\"string\",\"name\":\"_newEndpoint\",\"type\":\"string\"},{\"indexed\":true,\"internalType\":\"uint256\",\"name\":\"_spID\",\"type\":\"uint256\"}],\"name\":\"EndpointUpdated\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"_newGovernanceAddress\",\"type\":\"address\"}],\"name\":\"GovernanceAddressUpdated\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"_owner\",\"type\":\"address\"},{\"indexed\":true,\"internalType\":\"uint256\",\"name\":\"_increaseAmount\",\"type\":\"uint256\"},{\"indexed\":true,\"internalType\":\"uint256\",\"name\":\"_newStakeAmount\",\"type\":\"uint256\"}],\"name\":\"IncreasedStake\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"uint256\",\"name\":\"_spID\",\"type\":\"uint256\"},{\"indexed\":true,\"internalType\":\"bytes32\",\"name\":\"_serviceType\",\"type\":\"bytes32\"},{\"indexed\":true,\"internalType\":\"address\",\"name\":\"_owner\",\"type\":\"address\"},{\"indexed\":false,\"internalType\":\"string\",\"name\":\"_endpoint\",\"type\":\"string\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"_stakeAmount\",\"type\":\"uint256\"}],\"name\":\"RegisteredServiceProvider\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"_newServiceTypeManagerAddress\",\"type\":\"address\"}],\"name\":\"ServiceTypeManagerAddressUpdated\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"_newStakingAddress\",\"type\":\"address\"}],\"name\":\"StakingAddressUpdated\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"uint256\",\"name\":\"_lockupDuration\",\"type\":\"uint256\"}],\"name\":\"UpdateDeployerCutLockupDurationUpdated\",\"type\":\"event\"},{\"constant\":false,\"inputs\":[],\"name\":\"initialize\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"address\",\"name\":\"_governanceAddress\",\"type\":\"address\"},{\"internalType\":\"address\",\"name\":\"_claimsManagerAddress\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"_decreaseStakeLockupDuration\",\"type\":\"uint256\"},{\"internalType\":\"uint256\",\"name\":\"_deployerCutLockupDuration\",\"type\":\"uint256\"}],\"name\":\"initialize\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"bytes32\",\"name\":\"_serviceType\",\"type\":\"bytes32\"},{\"internalType\":\"string\",\"name\":\"_endpoint\",\"type\":\"string\"},{\"internalType\":\"uint256\",\"name\":\"_stakeAmount\",\"type\":\"uint256\"},{\"internalType\":\"address\",\"name\":\"_delegateOwnerWallet\",\"type\":\"address\"}],\"name\":\"register\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"bytes32\",\"name\":\"_serviceType\",\"type\":\"bytes32\"},{\"internalType\":\"string\",\"name\":\"_endpoint\",\"type\":\"string\"}],\"name\":\"deregister\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"_increaseStakeAmount\",\"type\":\"uint256\"}],\"name\":\"increaseStake\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"_decreaseStakeAmount\",\"type\":\"uint256\"}],\"name\":\"requestDecreaseStake\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"address\",\"name\":\"_account\",\"type\":\"address\"}],\"name\":\"cancelDecreaseStakeRequest\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[],\"name\":\"decreaseStake\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"bytes32\",\"name\":\"_serviceType\",\"type\":\"bytes32\"},{\"internalType\":\"string\",\"name\":\"_endpoint\",\"type\":\"string\"},{\"internalType\":\"address\",\"name\":\"_updatedDelegateOwnerWallet\",\"type\":\"address\"}],\"name\":\"updateDelegateOwnerWallet\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"bytes32\",\"name\":\"_serviceType\",\"type\":\"bytes32\"},{\"internalType\":\"string\",\"name\":\"_oldEndpoint\",\"type\":\"string\"},{\"internalType\":\"string\",\"name\":\"_newEndpoint\",\"type\":\"string\"}],\"name\":\"updateEndpoint\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"address\",\"name\":\"_serviceProvider\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"_cut\",\"type\":\"uint256\"}],\"name\":\"requestUpdateDeployerCut\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"address\",\"name\":\"_serviceProvider\",\"type\":\"address\"}],\"name\":\"cancelUpdateDeployerCut\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"address\",\"name\":\"_serviceProvider\",\"type\":\"address\"}],\"name\":\"updateDeployerCut\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"address\",\"name\":\"_serviceProvider\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"_amount\",\"type\":\"uint256\"}],\"name\":\"updateServiceProviderStake\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"_duration\",\"type\":\"uint256\"}],\"name\":\"updateDecreaseStakeLockupDuration\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"_duration\",\"type\":\"uint256\"}],\"name\":\"updateDeployerCutLockupDuration\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"getServiceProviderDeployerCutBase\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"getDeployerCutLockupDuration\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[{\"internalType\":\"bytes32\",\"name\":\"_serviceType\",\"type\":\"bytes32\"}],\"name\":\"getTotalServiceTypeProviders\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[{\"internalType\":\"string\",\"name\":\"_endpoint\",\"type\":\"string\"}],\"name\":\"getServiceProviderIdFromEndpoint\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[{\"internalType\":\"address\",\"name\":\"_ownerAddress\",\"type\":\"address\"},{\"internalType\":\"bytes32\",\"name\":\"_serviceType\",\"type\":\"bytes32\"}],\"name\":\"getServiceProviderIdsFromAddress\",\"outputs\":[{\"internalType\":\"uint256[]\",\"name\":\"\",\"type\":\"uint256[]\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[{\"internalType\":\"bytes32\",\"name\":\"_serviceType\",\"type\":\"bytes32\"},{\"internalType\":\"uint256\",\"name\":\"_serviceId\",\"type\":\"uint256\"}],\"name\":\"getServiceEndpointInfo\",\"outputs\":[{\"internalType\":\"address\",\"name\":\"owner\",\"type\":\"address\"},{\"internalType\":\"string\",\"name\":\"endpoint\",\"type\":\"string\"},{\"internalType\":\"uint256\",\"name\":\"blockNumber\",\"type\":\"uint256\"},{\"internalType\":\"address\",\"name\":\"delegateOwnerWallet\",\"type\":\"address\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[{\"internalType\":\"address\",\"name\":\"_serviceProvider\",\"type\":\"address\"}],\"name\":\"getServiceProviderDetails\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"deployerStake\",\"type\":\"uint256\"},{\"internalType\":\"uint256\",\"name\":\"deployerCut\",\"type\":\"uint256\"},{\"internalType\":\"bool\",\"name\":\"validBounds\",\"type\":\"bool\"},{\"internalType\":\"uint256\",\"name\":\"numberOfEndpoints\",\"type\":\"uint256\"},{\"internalType\":\"uint256\",\"name\":\"minAccountStake\",\"type\":\"uint256\"},{\"internalType\":\"uint256\",\"name\":\"maxAccountStake\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[{\"internalType\":\"address\",\"name\":\"_serviceProvider\",\"type\":\"address\"}],\"name\":\"getPendingDecreaseStakeRequest\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"amount\",\"type\":\"uint256\"},{\"internalType\":\"uint256\",\"name\":\"lockupExpiryBlock\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[{\"internalType\":\"address\",\"name\":\"_serviceProvider\",\"type\":\"address\"}],\"name\":\"getPendingUpdateDeployerCutRequest\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"newDeployerCut\",\"type\":\"uint256\"},{\"internalType\":\"uint256\",\"name\":\"lockupExpiryBlock\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"getDecreaseStakeLockupDuration\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[{\"internalType\":\"address\",\"name\":\"_serviceProvider\",\"type\":\"address\"}],\"name\":\"validateAccountStakeBalance\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"getGovernanceAddress\",\"outputs\":[{\"internalType\":\"address\",\"name\":\"\",\"type\":\"address\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"getStakingAddress\",\"outputs\":[{\"internalType\":\"address\",\"name\":\"\",\"type\":\"address\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"getDelegateManagerAddress\",\"outputs\":[{\"internalType\":\"address\",\"name\":\"\",\"type\":\"address\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"getServiceTypeManagerAddress\",\"outputs\":[{\"internalType\":\"address\",\"name\":\"\",\"type\":\"address\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"getClaimsManagerAddress\",\"outputs\":[{\"internalType\":\"address\",\"name\":\"\",\"type\":\"address\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"address\",\"name\":\"_governanceAddress\",\"type\":\"address\"}],\"name\":\"setGovernanceAddress\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"address\",\"name\":\"_address\",\"type\":\"address\"}],\"name\":\"setStakingAddress\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"address\",\"name\":\"_address\",\"type\":\"address\"}],\"name\":\"setDelegateManagerAddress\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"address\",\"name\":\"_address\",\"type\":\"address\"}],\"name\":\"setServiceTypeManagerAddress\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"address\",\"name\":\"_address\",\"type\":\"address\"}],\"name\":\"setClaimsManagerAddress\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"}]",
}

// ServiceProviderFactoryABI is the input ABI used to generate the binding from.
// Deprecated: Use ServiceProviderFactoryMetaData.ABI instead.
var ServiceProviderFactoryABI = ServiceProviderFactoryMetaData.ABI

// ServiceProviderFactory is an auto generated Go binding around an Ethereum contract.
type ServiceProviderFactory struct {
	ServiceProviderFactoryCaller     // Read-only binding to the contract
	ServiceProviderFactoryTransactor // Write-only binding to the contract
	ServiceProviderFactoryFilterer   // Log filterer for contract events
}

// ServiceProviderFactoryCaller is an auto generated read-only Go binding around an Ethereum contract.
type ServiceProviderFactoryCaller struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// ServiceProviderFactoryTransactor is an auto generated write-only Go binding around an Ethereum contract.
type ServiceProviderFactoryTransactor struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// ServiceProviderFactoryFilterer is an auto generated log filtering Go binding around an Ethereum contract events.
type ServiceProviderFactoryFilterer struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// ServiceProviderFactorySession is an auto generated Go binding around an Ethereum contract,
// with pre-set call and transact options.
type ServiceProviderFactorySession struct {
	Contract     *ServiceProviderFactory // Generic contract binding to set the session for
	CallOpts     bind.CallOpts           // Call options to use throughout this session
	TransactOpts bind.TransactOpts       // Transaction auth options to use throughout this session
}

// ServiceProviderFactoryCallerSession is an auto generated read-only Go binding around an Ethereum contract,
// with pre-set call options.
type ServiceProviderFactoryCallerSession struct {
	Contract *ServiceProviderFactoryCaller // Generic contract caller binding to set the session for
	CallOpts bind.CallOpts                 // Call options to use throughout this session
}

// ServiceProviderFactoryTransactorSession is an auto generated write-only Go binding around an Ethereum contract,
// with pre-set transact options.
type ServiceProviderFactoryTransactorSession struct {
	Contract     *ServiceProviderFactoryTransactor // Generic contract transactor binding to set the session for
	TransactOpts bind.TransactOpts                 // Transaction auth options to use throughout this session
}

// ServiceProviderFactoryRaw is an auto generated low-level Go binding around an Ethereum contract.
type ServiceProviderFactoryRaw struct {
	Contract *ServiceProviderFactory // Generic contract binding to access the raw methods on
}

// ServiceProviderFactoryCallerRaw is an auto generated low-level read-only Go binding around an Ethereum contract.
type ServiceProviderFactoryCallerRaw struct {
	Contract *ServiceProviderFactoryCaller // Generic read-only contract binding to access the raw methods on
}

// ServiceProviderFactoryTransactorRaw is an auto generated low-level write-only Go binding around an Ethereum contract.
type ServiceProviderFactoryTransactorRaw struct {
	Contract *ServiceProviderFactoryTransactor // Generic write-only contract binding to access the raw methods on
}

// NewServiceProviderFactory creates a new instance of ServiceProviderFactory, bound to a specific deployed contract.
func NewServiceProviderFactory(address common.Address, backend bind.ContractBackend) (*ServiceProviderFactory, error) {
	contract, err := bindServiceProviderFactory(address, backend, backend, backend)
	if err != nil {
		return nil, err
	}
	return &ServiceProviderFactory{ServiceProviderFactoryCaller: ServiceProviderFactoryCaller{contract: contract}, ServiceProviderFactoryTransactor: ServiceProviderFactoryTransactor{contract: contract}, ServiceProviderFactoryFilterer: ServiceProviderFactoryFilterer{contract: contract}}, nil
}

// NewServiceProviderFactoryCaller creates a new read-only instance of ServiceProviderFactory, bound to a specific deployed contract.
func NewServiceProviderFactoryCaller(address common.Address, caller bind.ContractCaller) (*ServiceProviderFactoryCaller, error) {
	contract, err := bindServiceProviderFactory(address, caller, nil, nil)
	if err != nil {
		return nil, err
	}
	return &ServiceProviderFactoryCaller{contract: contract}, nil
}

// NewServiceProviderFactoryTransactor creates a new write-only instance of ServiceProviderFactory, bound to a specific deployed contract.
func NewServiceProviderFactoryTransactor(address common.Address, transactor bind.ContractTransactor) (*ServiceProviderFactoryTransactor, error) {
	contract, err := bindServiceProviderFactory(address, nil, transactor, nil)
	if err != nil {
		return nil, err
	}
	return &ServiceProviderFactoryTransactor{contract: contract}, nil
}

// NewServiceProviderFactoryFilterer creates a new log filterer instance of ServiceProviderFactory, bound to a specific deployed contract.
func NewServiceProviderFactoryFilterer(address common.Address, filterer bind.ContractFilterer) (*ServiceProviderFactoryFilterer, error) {
	contract, err := bindServiceProviderFactory(address, nil, nil, filterer)
	if err != nil {
		return nil, err
	}
	return &ServiceProviderFactoryFilterer{contract: contract}, nil
}

// bindServiceProviderFactory binds a generic wrapper to an already deployed contract.
func bindServiceProviderFactory(address common.Address, caller bind.ContractCaller, transactor bind.ContractTransactor, filterer bind.ContractFilterer) (*bind.BoundContract, error) {
	parsed, err := ServiceProviderFactoryMetaData.GetAbi()
	if err != nil {
		return nil, err
	}
	return bind.NewBoundContract(address, *parsed, caller, transactor, filterer), nil
}

// Call invokes the (constant) contract method with params as input values and
// sets the output to result. The result type might be a single field for simple
// returns, a slice of interfaces for anonymous returns and a struct for named
// returns.
func (_ServiceProviderFactory *ServiceProviderFactoryRaw) Call(opts *bind.CallOpts, result *[]interface{}, method string, params ...interface{}) error {
	return _ServiceProviderFactory.Contract.ServiceProviderFactoryCaller.contract.Call(opts, result, method, params...)
}

// Transfer initiates a plain transaction to move funds to the contract, calling
// its default method if one is available.
func (_ServiceProviderFactory *ServiceProviderFactoryRaw) Transfer(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _ServiceProviderFactory.Contract.ServiceProviderFactoryTransactor.contract.Transfer(opts)
}

// Transact invokes the (paid) contract method with params as input values.
func (_ServiceProviderFactory *ServiceProviderFactoryRaw) Transact(opts *bind.TransactOpts, method string, params ...interface{}) (*types.Transaction, error) {
	return _ServiceProviderFactory.Contract.ServiceProviderFactoryTransactor.contract.Transact(opts, method, params...)
}

// Call invokes the (constant) contract method with params as input values and
// sets the output to result. The result type might be a single field for simple
// returns, a slice of interfaces for anonymous returns and a struct for named
// returns.
func (_ServiceProviderFactory *ServiceProviderFactoryCallerRaw) Call(opts *bind.CallOpts, result *[]interface{}, method string, params ...interface{}) error {
	return _ServiceProviderFactory.Contract.contract.Call(opts, result, method, params...)
}

// Transfer initiates a plain transaction to move funds to the contract, calling
// its default method if one is available.
func (_ServiceProviderFactory *ServiceProviderFactoryTransactorRaw) Transfer(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _ServiceProviderFactory.Contract.contract.Transfer(opts)
}

// Transact invokes the (paid) contract method with params as input values.
func (_ServiceProviderFactory *ServiceProviderFactoryTransactorRaw) Transact(opts *bind.TransactOpts, method string, params ...interface{}) (*types.Transaction, error) {
	return _ServiceProviderFactory.Contract.contract.Transact(opts, method, params...)
}

// GetClaimsManagerAddress is a free data retrieval call binding the contract method 0x948e5426.
//
// Solidity: function getClaimsManagerAddress() view returns(address)
func (_ServiceProviderFactory *ServiceProviderFactoryCaller) GetClaimsManagerAddress(opts *bind.CallOpts) (common.Address, error) {
	var out []interface{}
	err := _ServiceProviderFactory.contract.Call(opts, &out, "getClaimsManagerAddress")

	if err != nil {
		return *new(common.Address), err
	}

	out0 := *abi.ConvertType(out[0], new(common.Address)).(*common.Address)

	return out0, err

}

// GetClaimsManagerAddress is a free data retrieval call binding the contract method 0x948e5426.
//
// Solidity: function getClaimsManagerAddress() view returns(address)
func (_ServiceProviderFactory *ServiceProviderFactorySession) GetClaimsManagerAddress() (common.Address, error) {
	return _ServiceProviderFactory.Contract.GetClaimsManagerAddress(&_ServiceProviderFactory.CallOpts)
}

// GetClaimsManagerAddress is a free data retrieval call binding the contract method 0x948e5426.
//
// Solidity: function getClaimsManagerAddress() view returns(address)
func (_ServiceProviderFactory *ServiceProviderFactoryCallerSession) GetClaimsManagerAddress() (common.Address, error) {
	return _ServiceProviderFactory.Contract.GetClaimsManagerAddress(&_ServiceProviderFactory.CallOpts)
}

// GetDecreaseStakeLockupDuration is a free data retrieval call binding the contract method 0x2ef41dee.
//
// Solidity: function getDecreaseStakeLockupDuration() view returns(uint256)
func (_ServiceProviderFactory *ServiceProviderFactoryCaller) GetDecreaseStakeLockupDuration(opts *bind.CallOpts) (*big.Int, error) {
	var out []interface{}
	err := _ServiceProviderFactory.contract.Call(opts, &out, "getDecreaseStakeLockupDuration")

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

// GetDecreaseStakeLockupDuration is a free data retrieval call binding the contract method 0x2ef41dee.
//
// Solidity: function getDecreaseStakeLockupDuration() view returns(uint256)
func (_ServiceProviderFactory *ServiceProviderFactorySession) GetDecreaseStakeLockupDuration() (*big.Int, error) {
	return _ServiceProviderFactory.Contract.GetDecreaseStakeLockupDuration(&_ServiceProviderFactory.CallOpts)
}

// GetDecreaseStakeLockupDuration is a free data retrieval call binding the contract method 0x2ef41dee.
//
// Solidity: function getDecreaseStakeLockupDuration() view returns(uint256)
func (_ServiceProviderFactory *ServiceProviderFactoryCallerSession) GetDecreaseStakeLockupDuration() (*big.Int, error) {
	return _ServiceProviderFactory.Contract.GetDecreaseStakeLockupDuration(&_ServiceProviderFactory.CallOpts)
}

// GetDelegateManagerAddress is a free data retrieval call binding the contract method 0xd16543f6.
//
// Solidity: function getDelegateManagerAddress() view returns(address)
func (_ServiceProviderFactory *ServiceProviderFactoryCaller) GetDelegateManagerAddress(opts *bind.CallOpts) (common.Address, error) {
	var out []interface{}
	err := _ServiceProviderFactory.contract.Call(opts, &out, "getDelegateManagerAddress")

	if err != nil {
		return *new(common.Address), err
	}

	out0 := *abi.ConvertType(out[0], new(common.Address)).(*common.Address)

	return out0, err

}

// GetDelegateManagerAddress is a free data retrieval call binding the contract method 0xd16543f6.
//
// Solidity: function getDelegateManagerAddress() view returns(address)
func (_ServiceProviderFactory *ServiceProviderFactorySession) GetDelegateManagerAddress() (common.Address, error) {
	return _ServiceProviderFactory.Contract.GetDelegateManagerAddress(&_ServiceProviderFactory.CallOpts)
}

// GetDelegateManagerAddress is a free data retrieval call binding the contract method 0xd16543f6.
//
// Solidity: function getDelegateManagerAddress() view returns(address)
func (_ServiceProviderFactory *ServiceProviderFactoryCallerSession) GetDelegateManagerAddress() (common.Address, error) {
	return _ServiceProviderFactory.Contract.GetDelegateManagerAddress(&_ServiceProviderFactory.CallOpts)
}

// GetDeployerCutLockupDuration is a free data retrieval call binding the contract method 0xf277a224.
//
// Solidity: function getDeployerCutLockupDuration() view returns(uint256)
func (_ServiceProviderFactory *ServiceProviderFactoryCaller) GetDeployerCutLockupDuration(opts *bind.CallOpts) (*big.Int, error) {
	var out []interface{}
	err := _ServiceProviderFactory.contract.Call(opts, &out, "getDeployerCutLockupDuration")

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

// GetDeployerCutLockupDuration is a free data retrieval call binding the contract method 0xf277a224.
//
// Solidity: function getDeployerCutLockupDuration() view returns(uint256)
func (_ServiceProviderFactory *ServiceProviderFactorySession) GetDeployerCutLockupDuration() (*big.Int, error) {
	return _ServiceProviderFactory.Contract.GetDeployerCutLockupDuration(&_ServiceProviderFactory.CallOpts)
}

// GetDeployerCutLockupDuration is a free data retrieval call binding the contract method 0xf277a224.
//
// Solidity: function getDeployerCutLockupDuration() view returns(uint256)
func (_ServiceProviderFactory *ServiceProviderFactoryCallerSession) GetDeployerCutLockupDuration() (*big.Int, error) {
	return _ServiceProviderFactory.Contract.GetDeployerCutLockupDuration(&_ServiceProviderFactory.CallOpts)
}

// GetGovernanceAddress is a free data retrieval call binding the contract method 0x73252494.
//
// Solidity: function getGovernanceAddress() view returns(address)
func (_ServiceProviderFactory *ServiceProviderFactoryCaller) GetGovernanceAddress(opts *bind.CallOpts) (common.Address, error) {
	var out []interface{}
	err := _ServiceProviderFactory.contract.Call(opts, &out, "getGovernanceAddress")

	if err != nil {
		return *new(common.Address), err
	}

	out0 := *abi.ConvertType(out[0], new(common.Address)).(*common.Address)

	return out0, err

}

// GetGovernanceAddress is a free data retrieval call binding the contract method 0x73252494.
//
// Solidity: function getGovernanceAddress() view returns(address)
func (_ServiceProviderFactory *ServiceProviderFactorySession) GetGovernanceAddress() (common.Address, error) {
	return _ServiceProviderFactory.Contract.GetGovernanceAddress(&_ServiceProviderFactory.CallOpts)
}

// GetGovernanceAddress is a free data retrieval call binding the contract method 0x73252494.
//
// Solidity: function getGovernanceAddress() view returns(address)
func (_ServiceProviderFactory *ServiceProviderFactoryCallerSession) GetGovernanceAddress() (common.Address, error) {
	return _ServiceProviderFactory.Contract.GetGovernanceAddress(&_ServiceProviderFactory.CallOpts)
}

// GetPendingDecreaseStakeRequest is a free data retrieval call binding the contract method 0xff653c8a.
//
// Solidity: function getPendingDecreaseStakeRequest(address _serviceProvider) view returns(uint256 amount, uint256 lockupExpiryBlock)
func (_ServiceProviderFactory *ServiceProviderFactoryCaller) GetPendingDecreaseStakeRequest(opts *bind.CallOpts, _serviceProvider common.Address) (struct {
	Amount            *big.Int
	LockupExpiryBlock *big.Int
}, error) {
	var out []interface{}
	err := _ServiceProviderFactory.contract.Call(opts, &out, "getPendingDecreaseStakeRequest", _serviceProvider)

	outstruct := new(struct {
		Amount            *big.Int
		LockupExpiryBlock *big.Int
	})
	if err != nil {
		return *outstruct, err
	}

	outstruct.Amount = *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)
	outstruct.LockupExpiryBlock = *abi.ConvertType(out[1], new(*big.Int)).(**big.Int)

	return *outstruct, err

}

// GetPendingDecreaseStakeRequest is a free data retrieval call binding the contract method 0xff653c8a.
//
// Solidity: function getPendingDecreaseStakeRequest(address _serviceProvider) view returns(uint256 amount, uint256 lockupExpiryBlock)
func (_ServiceProviderFactory *ServiceProviderFactorySession) GetPendingDecreaseStakeRequest(_serviceProvider common.Address) (struct {
	Amount            *big.Int
	LockupExpiryBlock *big.Int
}, error) {
	return _ServiceProviderFactory.Contract.GetPendingDecreaseStakeRequest(&_ServiceProviderFactory.CallOpts, _serviceProvider)
}

// GetPendingDecreaseStakeRequest is a free data retrieval call binding the contract method 0xff653c8a.
//
// Solidity: function getPendingDecreaseStakeRequest(address _serviceProvider) view returns(uint256 amount, uint256 lockupExpiryBlock)
func (_ServiceProviderFactory *ServiceProviderFactoryCallerSession) GetPendingDecreaseStakeRequest(_serviceProvider common.Address) (struct {
	Amount            *big.Int
	LockupExpiryBlock *big.Int
}, error) {
	return _ServiceProviderFactory.Contract.GetPendingDecreaseStakeRequest(&_ServiceProviderFactory.CallOpts, _serviceProvider)
}

// GetPendingUpdateDeployerCutRequest is a free data retrieval call binding the contract method 0x7a5c13f1.
//
// Solidity: function getPendingUpdateDeployerCutRequest(address _serviceProvider) view returns(uint256 newDeployerCut, uint256 lockupExpiryBlock)
func (_ServiceProviderFactory *ServiceProviderFactoryCaller) GetPendingUpdateDeployerCutRequest(opts *bind.CallOpts, _serviceProvider common.Address) (struct {
	NewDeployerCut    *big.Int
	LockupExpiryBlock *big.Int
}, error) {
	var out []interface{}
	err := _ServiceProviderFactory.contract.Call(opts, &out, "getPendingUpdateDeployerCutRequest", _serviceProvider)

	outstruct := new(struct {
		NewDeployerCut    *big.Int
		LockupExpiryBlock *big.Int
	})
	if err != nil {
		return *outstruct, err
	}

	outstruct.NewDeployerCut = *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)
	outstruct.LockupExpiryBlock = *abi.ConvertType(out[1], new(*big.Int)).(**big.Int)

	return *outstruct, err

}

// GetPendingUpdateDeployerCutRequest is a free data retrieval call binding the contract method 0x7a5c13f1.
//
// Solidity: function getPendingUpdateDeployerCutRequest(address _serviceProvider) view returns(uint256 newDeployerCut, uint256 lockupExpiryBlock)
func (_ServiceProviderFactory *ServiceProviderFactorySession) GetPendingUpdateDeployerCutRequest(_serviceProvider common.Address) (struct {
	NewDeployerCut    *big.Int
	LockupExpiryBlock *big.Int
}, error) {
	return _ServiceProviderFactory.Contract.GetPendingUpdateDeployerCutRequest(&_ServiceProviderFactory.CallOpts, _serviceProvider)
}

// GetPendingUpdateDeployerCutRequest is a free data retrieval call binding the contract method 0x7a5c13f1.
//
// Solidity: function getPendingUpdateDeployerCutRequest(address _serviceProvider) view returns(uint256 newDeployerCut, uint256 lockupExpiryBlock)
func (_ServiceProviderFactory *ServiceProviderFactoryCallerSession) GetPendingUpdateDeployerCutRequest(_serviceProvider common.Address) (struct {
	NewDeployerCut    *big.Int
	LockupExpiryBlock *big.Int
}, error) {
	return _ServiceProviderFactory.Contract.GetPendingUpdateDeployerCutRequest(&_ServiceProviderFactory.CallOpts, _serviceProvider)
}

// GetServiceEndpointInfo is a free data retrieval call binding the contract method 0x748ea82c.
//
// Solidity: function getServiceEndpointInfo(bytes32 _serviceType, uint256 _serviceId) view returns(address owner, string endpoint, uint256 blockNumber, address delegateOwnerWallet)
func (_ServiceProviderFactory *ServiceProviderFactoryCaller) GetServiceEndpointInfo(opts *bind.CallOpts, _serviceType [32]byte, _serviceId *big.Int) (struct {
	Owner               common.Address
	Endpoint            string
	BlockNumber         *big.Int
	DelegateOwnerWallet common.Address
}, error) {
	var out []interface{}
	err := _ServiceProviderFactory.contract.Call(opts, &out, "getServiceEndpointInfo", _serviceType, _serviceId)

	outstruct := new(struct {
		Owner               common.Address
		Endpoint            string
		BlockNumber         *big.Int
		DelegateOwnerWallet common.Address
	})
	if err != nil {
		return *outstruct, err
	}

	outstruct.Owner = *abi.ConvertType(out[0], new(common.Address)).(*common.Address)
	outstruct.Endpoint = *abi.ConvertType(out[1], new(string)).(*string)
	outstruct.BlockNumber = *abi.ConvertType(out[2], new(*big.Int)).(**big.Int)
	outstruct.DelegateOwnerWallet = *abi.ConvertType(out[3], new(common.Address)).(*common.Address)

	return *outstruct, err

}

// GetServiceEndpointInfo is a free data retrieval call binding the contract method 0x748ea82c.
//
// Solidity: function getServiceEndpointInfo(bytes32 _serviceType, uint256 _serviceId) view returns(address owner, string endpoint, uint256 blockNumber, address delegateOwnerWallet)
func (_ServiceProviderFactory *ServiceProviderFactorySession) GetServiceEndpointInfo(_serviceType [32]byte, _serviceId *big.Int) (struct {
	Owner               common.Address
	Endpoint            string
	BlockNumber         *big.Int
	DelegateOwnerWallet common.Address
}, error) {
	return _ServiceProviderFactory.Contract.GetServiceEndpointInfo(&_ServiceProviderFactory.CallOpts, _serviceType, _serviceId)
}

// GetServiceEndpointInfo is a free data retrieval call binding the contract method 0x748ea82c.
//
// Solidity: function getServiceEndpointInfo(bytes32 _serviceType, uint256 _serviceId) view returns(address owner, string endpoint, uint256 blockNumber, address delegateOwnerWallet)
func (_ServiceProviderFactory *ServiceProviderFactoryCallerSession) GetServiceEndpointInfo(_serviceType [32]byte, _serviceId *big.Int) (struct {
	Owner               common.Address
	Endpoint            string
	BlockNumber         *big.Int
	DelegateOwnerWallet common.Address
}, error) {
	return _ServiceProviderFactory.Contract.GetServiceEndpointInfo(&_ServiceProviderFactory.CallOpts, _serviceType, _serviceId)
}

// GetServiceProviderDeployerCutBase is a free data retrieval call binding the contract method 0x6c75fdf3.
//
// Solidity: function getServiceProviderDeployerCutBase() view returns(uint256)
func (_ServiceProviderFactory *ServiceProviderFactoryCaller) GetServiceProviderDeployerCutBase(opts *bind.CallOpts) (*big.Int, error) {
	var out []interface{}
	err := _ServiceProviderFactory.contract.Call(opts, &out, "getServiceProviderDeployerCutBase")

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

// GetServiceProviderDeployerCutBase is a free data retrieval call binding the contract method 0x6c75fdf3.
//
// Solidity: function getServiceProviderDeployerCutBase() view returns(uint256)
func (_ServiceProviderFactory *ServiceProviderFactorySession) GetServiceProviderDeployerCutBase() (*big.Int, error) {
	return _ServiceProviderFactory.Contract.GetServiceProviderDeployerCutBase(&_ServiceProviderFactory.CallOpts)
}

// GetServiceProviderDeployerCutBase is a free data retrieval call binding the contract method 0x6c75fdf3.
//
// Solidity: function getServiceProviderDeployerCutBase() view returns(uint256)
func (_ServiceProviderFactory *ServiceProviderFactoryCallerSession) GetServiceProviderDeployerCutBase() (*big.Int, error) {
	return _ServiceProviderFactory.Contract.GetServiceProviderDeployerCutBase(&_ServiceProviderFactory.CallOpts)
}

// GetServiceProviderDetails is a free data retrieval call binding the contract method 0xf273e9a8.
//
// Solidity: function getServiceProviderDetails(address _serviceProvider) view returns(uint256 deployerStake, uint256 deployerCut, bool validBounds, uint256 numberOfEndpoints, uint256 minAccountStake, uint256 maxAccountStake)
func (_ServiceProviderFactory *ServiceProviderFactoryCaller) GetServiceProviderDetails(opts *bind.CallOpts, _serviceProvider common.Address) (struct {
	DeployerStake     *big.Int
	DeployerCut       *big.Int
	ValidBounds       bool
	NumberOfEndpoints *big.Int
	MinAccountStake   *big.Int
	MaxAccountStake   *big.Int
}, error) {
	var out []interface{}
	err := _ServiceProviderFactory.contract.Call(opts, &out, "getServiceProviderDetails", _serviceProvider)

	outstruct := new(struct {
		DeployerStake     *big.Int
		DeployerCut       *big.Int
		ValidBounds       bool
		NumberOfEndpoints *big.Int
		MinAccountStake   *big.Int
		MaxAccountStake   *big.Int
	})
	if err != nil {
		return *outstruct, err
	}

	outstruct.DeployerStake = *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)
	outstruct.DeployerCut = *abi.ConvertType(out[1], new(*big.Int)).(**big.Int)
	outstruct.ValidBounds = *abi.ConvertType(out[2], new(bool)).(*bool)
	outstruct.NumberOfEndpoints = *abi.ConvertType(out[3], new(*big.Int)).(**big.Int)
	outstruct.MinAccountStake = *abi.ConvertType(out[4], new(*big.Int)).(**big.Int)
	outstruct.MaxAccountStake = *abi.ConvertType(out[5], new(*big.Int)).(**big.Int)

	return *outstruct, err

}

// GetServiceProviderDetails is a free data retrieval call binding the contract method 0xf273e9a8.
//
// Solidity: function getServiceProviderDetails(address _serviceProvider) view returns(uint256 deployerStake, uint256 deployerCut, bool validBounds, uint256 numberOfEndpoints, uint256 minAccountStake, uint256 maxAccountStake)
func (_ServiceProviderFactory *ServiceProviderFactorySession) GetServiceProviderDetails(_serviceProvider common.Address) (struct {
	DeployerStake     *big.Int
	DeployerCut       *big.Int
	ValidBounds       bool
	NumberOfEndpoints *big.Int
	MinAccountStake   *big.Int
	MaxAccountStake   *big.Int
}, error) {
	return _ServiceProviderFactory.Contract.GetServiceProviderDetails(&_ServiceProviderFactory.CallOpts, _serviceProvider)
}

// GetServiceProviderDetails is a free data retrieval call binding the contract method 0xf273e9a8.
//
// Solidity: function getServiceProviderDetails(address _serviceProvider) view returns(uint256 deployerStake, uint256 deployerCut, bool validBounds, uint256 numberOfEndpoints, uint256 minAccountStake, uint256 maxAccountStake)
func (_ServiceProviderFactory *ServiceProviderFactoryCallerSession) GetServiceProviderDetails(_serviceProvider common.Address) (struct {
	DeployerStake     *big.Int
	DeployerCut       *big.Int
	ValidBounds       bool
	NumberOfEndpoints *big.Int
	MinAccountStake   *big.Int
	MaxAccountStake   *big.Int
}, error) {
	return _ServiceProviderFactory.Contract.GetServiceProviderDetails(&_ServiceProviderFactory.CallOpts, _serviceProvider)
}

// GetServiceProviderIdFromEndpoint is a free data retrieval call binding the contract method 0xf9b37ed3.
//
// Solidity: function getServiceProviderIdFromEndpoint(string _endpoint) view returns(uint256)
func (_ServiceProviderFactory *ServiceProviderFactoryCaller) GetServiceProviderIdFromEndpoint(opts *bind.CallOpts, _endpoint string) (*big.Int, error) {
	var out []interface{}
	err := _ServiceProviderFactory.contract.Call(opts, &out, "getServiceProviderIdFromEndpoint", _endpoint)

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

// GetServiceProviderIdFromEndpoint is a free data retrieval call binding the contract method 0xf9b37ed3.
//
// Solidity: function getServiceProviderIdFromEndpoint(string _endpoint) view returns(uint256)
func (_ServiceProviderFactory *ServiceProviderFactorySession) GetServiceProviderIdFromEndpoint(_endpoint string) (*big.Int, error) {
	return _ServiceProviderFactory.Contract.GetServiceProviderIdFromEndpoint(&_ServiceProviderFactory.CallOpts, _endpoint)
}

// GetServiceProviderIdFromEndpoint is a free data retrieval call binding the contract method 0xf9b37ed3.
//
// Solidity: function getServiceProviderIdFromEndpoint(string _endpoint) view returns(uint256)
func (_ServiceProviderFactory *ServiceProviderFactoryCallerSession) GetServiceProviderIdFromEndpoint(_endpoint string) (*big.Int, error) {
	return _ServiceProviderFactory.Contract.GetServiceProviderIdFromEndpoint(&_ServiceProviderFactory.CallOpts, _endpoint)
}

// GetServiceProviderIdsFromAddress is a free data retrieval call binding the contract method 0x2bec8e16.
//
// Solidity: function getServiceProviderIdsFromAddress(address _ownerAddress, bytes32 _serviceType) view returns(uint256[])
func (_ServiceProviderFactory *ServiceProviderFactoryCaller) GetServiceProviderIdsFromAddress(opts *bind.CallOpts, _ownerAddress common.Address, _serviceType [32]byte) ([]*big.Int, error) {
	var out []interface{}
	err := _ServiceProviderFactory.contract.Call(opts, &out, "getServiceProviderIdsFromAddress", _ownerAddress, _serviceType)

	if err != nil {
		return *new([]*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new([]*big.Int)).(*[]*big.Int)

	return out0, err

}

// GetServiceProviderIdsFromAddress is a free data retrieval call binding the contract method 0x2bec8e16.
//
// Solidity: function getServiceProviderIdsFromAddress(address _ownerAddress, bytes32 _serviceType) view returns(uint256[])
func (_ServiceProviderFactory *ServiceProviderFactorySession) GetServiceProviderIdsFromAddress(_ownerAddress common.Address, _serviceType [32]byte) ([]*big.Int, error) {
	return _ServiceProviderFactory.Contract.GetServiceProviderIdsFromAddress(&_ServiceProviderFactory.CallOpts, _ownerAddress, _serviceType)
}

// GetServiceProviderIdsFromAddress is a free data retrieval call binding the contract method 0x2bec8e16.
//
// Solidity: function getServiceProviderIdsFromAddress(address _ownerAddress, bytes32 _serviceType) view returns(uint256[])
func (_ServiceProviderFactory *ServiceProviderFactoryCallerSession) GetServiceProviderIdsFromAddress(_ownerAddress common.Address, _serviceType [32]byte) ([]*big.Int, error) {
	return _ServiceProviderFactory.Contract.GetServiceProviderIdsFromAddress(&_ServiceProviderFactory.CallOpts, _ownerAddress, _serviceType)
}

// GetServiceTypeManagerAddress is a free data retrieval call binding the contract method 0xb4fa14de.
//
// Solidity: function getServiceTypeManagerAddress() view returns(address)
func (_ServiceProviderFactory *ServiceProviderFactoryCaller) GetServiceTypeManagerAddress(opts *bind.CallOpts) (common.Address, error) {
	var out []interface{}
	err := _ServiceProviderFactory.contract.Call(opts, &out, "getServiceTypeManagerAddress")

	if err != nil {
		return *new(common.Address), err
	}

	out0 := *abi.ConvertType(out[0], new(common.Address)).(*common.Address)

	return out0, err

}

// GetServiceTypeManagerAddress is a free data retrieval call binding the contract method 0xb4fa14de.
//
// Solidity: function getServiceTypeManagerAddress() view returns(address)
func (_ServiceProviderFactory *ServiceProviderFactorySession) GetServiceTypeManagerAddress() (common.Address, error) {
	return _ServiceProviderFactory.Contract.GetServiceTypeManagerAddress(&_ServiceProviderFactory.CallOpts)
}

// GetServiceTypeManagerAddress is a free data retrieval call binding the contract method 0xb4fa14de.
//
// Solidity: function getServiceTypeManagerAddress() view returns(address)
func (_ServiceProviderFactory *ServiceProviderFactoryCallerSession) GetServiceTypeManagerAddress() (common.Address, error) {
	return _ServiceProviderFactory.Contract.GetServiceTypeManagerAddress(&_ServiceProviderFactory.CallOpts)
}

// GetStakingAddress is a free data retrieval call binding the contract method 0x0e9ed68b.
//
// Solidity: function getStakingAddress() view returns(address)
func (_ServiceProviderFactory *ServiceProviderFactoryCaller) GetStakingAddress(opts *bind.CallOpts) (common.Address, error) {
	var out []interface{}
	err := _ServiceProviderFactory.contract.Call(opts, &out, "getStakingAddress")

	if err != nil {
		return *new(common.Address), err
	}

	out0 := *abi.ConvertType(out[0], new(common.Address)).(*common.Address)

	return out0, err

}

// GetStakingAddress is a free data retrieval call binding the contract method 0x0e9ed68b.
//
// Solidity: function getStakingAddress() view returns(address)
func (_ServiceProviderFactory *ServiceProviderFactorySession) GetStakingAddress() (common.Address, error) {
	return _ServiceProviderFactory.Contract.GetStakingAddress(&_ServiceProviderFactory.CallOpts)
}

// GetStakingAddress is a free data retrieval call binding the contract method 0x0e9ed68b.
//
// Solidity: function getStakingAddress() view returns(address)
func (_ServiceProviderFactory *ServiceProviderFactoryCallerSession) GetStakingAddress() (common.Address, error) {
	return _ServiceProviderFactory.Contract.GetStakingAddress(&_ServiceProviderFactory.CallOpts)
}

// GetTotalServiceTypeProviders is a free data retrieval call binding the contract method 0x623fa631.
//
// Solidity: function getTotalServiceTypeProviders(bytes32 _serviceType) view returns(uint256)
func (_ServiceProviderFactory *ServiceProviderFactoryCaller) GetTotalServiceTypeProviders(opts *bind.CallOpts, _serviceType [32]byte) (*big.Int, error) {
	var out []interface{}
	err := _ServiceProviderFactory.contract.Call(opts, &out, "getTotalServiceTypeProviders", _serviceType)

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

// GetTotalServiceTypeProviders is a free data retrieval call binding the contract method 0x623fa631.
//
// Solidity: function getTotalServiceTypeProviders(bytes32 _serviceType) view returns(uint256)
func (_ServiceProviderFactory *ServiceProviderFactorySession) GetTotalServiceTypeProviders(_serviceType [32]byte) (*big.Int, error) {
	return _ServiceProviderFactory.Contract.GetTotalServiceTypeProviders(&_ServiceProviderFactory.CallOpts, _serviceType)
}

// GetTotalServiceTypeProviders is a free data retrieval call binding the contract method 0x623fa631.
//
// Solidity: function getTotalServiceTypeProviders(bytes32 _serviceType) view returns(uint256)
func (_ServiceProviderFactory *ServiceProviderFactoryCallerSession) GetTotalServiceTypeProviders(_serviceType [32]byte) (*big.Int, error) {
	return _ServiceProviderFactory.Contract.GetTotalServiceTypeProviders(&_ServiceProviderFactory.CallOpts, _serviceType)
}

// ValidateAccountStakeBalance is a free data retrieval call binding the contract method 0xe8de38c0.
//
// Solidity: function validateAccountStakeBalance(address _serviceProvider) view returns()
func (_ServiceProviderFactory *ServiceProviderFactoryCaller) ValidateAccountStakeBalance(opts *bind.CallOpts, _serviceProvider common.Address) error {
	var out []interface{}
	err := _ServiceProviderFactory.contract.Call(opts, &out, "validateAccountStakeBalance", _serviceProvider)

	if err != nil {
		return err
	}

	return err

}

// ValidateAccountStakeBalance is a free data retrieval call binding the contract method 0xe8de38c0.
//
// Solidity: function validateAccountStakeBalance(address _serviceProvider) view returns()
func (_ServiceProviderFactory *ServiceProviderFactorySession) ValidateAccountStakeBalance(_serviceProvider common.Address) error {
	return _ServiceProviderFactory.Contract.ValidateAccountStakeBalance(&_ServiceProviderFactory.CallOpts, _serviceProvider)
}

// ValidateAccountStakeBalance is a free data retrieval call binding the contract method 0xe8de38c0.
//
// Solidity: function validateAccountStakeBalance(address _serviceProvider) view returns()
func (_ServiceProviderFactory *ServiceProviderFactoryCallerSession) ValidateAccountStakeBalance(_serviceProvider common.Address) error {
	return _ServiceProviderFactory.Contract.ValidateAccountStakeBalance(&_ServiceProviderFactory.CallOpts, _serviceProvider)
}

// CancelDecreaseStakeRequest is a paid mutator transaction binding the contract method 0x54350cee.
//
// Solidity: function cancelDecreaseStakeRequest(address _account) returns()
func (_ServiceProviderFactory *ServiceProviderFactoryTransactor) CancelDecreaseStakeRequest(opts *bind.TransactOpts, _account common.Address) (*types.Transaction, error) {
	return _ServiceProviderFactory.contract.Transact(opts, "cancelDecreaseStakeRequest", _account)
}

// CancelDecreaseStakeRequest is a paid mutator transaction binding the contract method 0x54350cee.
//
// Solidity: function cancelDecreaseStakeRequest(address _account) returns()
func (_ServiceProviderFactory *ServiceProviderFactorySession) CancelDecreaseStakeRequest(_account common.Address) (*types.Transaction, error) {
	return _ServiceProviderFactory.Contract.CancelDecreaseStakeRequest(&_ServiceProviderFactory.TransactOpts, _account)
}

// CancelDecreaseStakeRequest is a paid mutator transaction binding the contract method 0x54350cee.
//
// Solidity: function cancelDecreaseStakeRequest(address _account) returns()
func (_ServiceProviderFactory *ServiceProviderFactoryTransactorSession) CancelDecreaseStakeRequest(_account common.Address) (*types.Transaction, error) {
	return _ServiceProviderFactory.Contract.CancelDecreaseStakeRequest(&_ServiceProviderFactory.TransactOpts, _account)
}

// CancelUpdateDeployerCut is a paid mutator transaction binding the contract method 0xd5ecac02.
//
// Solidity: function cancelUpdateDeployerCut(address _serviceProvider) returns()
func (_ServiceProviderFactory *ServiceProviderFactoryTransactor) CancelUpdateDeployerCut(opts *bind.TransactOpts, _serviceProvider common.Address) (*types.Transaction, error) {
	return _ServiceProviderFactory.contract.Transact(opts, "cancelUpdateDeployerCut", _serviceProvider)
}

// CancelUpdateDeployerCut is a paid mutator transaction binding the contract method 0xd5ecac02.
//
// Solidity: function cancelUpdateDeployerCut(address _serviceProvider) returns()
func (_ServiceProviderFactory *ServiceProviderFactorySession) CancelUpdateDeployerCut(_serviceProvider common.Address) (*types.Transaction, error) {
	return _ServiceProviderFactory.Contract.CancelUpdateDeployerCut(&_ServiceProviderFactory.TransactOpts, _serviceProvider)
}

// CancelUpdateDeployerCut is a paid mutator transaction binding the contract method 0xd5ecac02.
//
// Solidity: function cancelUpdateDeployerCut(address _serviceProvider) returns()
func (_ServiceProviderFactory *ServiceProviderFactoryTransactorSession) CancelUpdateDeployerCut(_serviceProvider common.Address) (*types.Transaction, error) {
	return _ServiceProviderFactory.Contract.CancelUpdateDeployerCut(&_ServiceProviderFactory.TransactOpts, _serviceProvider)
}

// DecreaseStake is a paid mutator transaction binding the contract method 0x41cdc60c.
//
// Solidity: function decreaseStake() returns(uint256)
func (_ServiceProviderFactory *ServiceProviderFactoryTransactor) DecreaseStake(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _ServiceProviderFactory.contract.Transact(opts, "decreaseStake")
}

// DecreaseStake is a paid mutator transaction binding the contract method 0x41cdc60c.
//
// Solidity: function decreaseStake() returns(uint256)
func (_ServiceProviderFactory *ServiceProviderFactorySession) DecreaseStake() (*types.Transaction, error) {
	return _ServiceProviderFactory.Contract.DecreaseStake(&_ServiceProviderFactory.TransactOpts)
}

// DecreaseStake is a paid mutator transaction binding the contract method 0x41cdc60c.
//
// Solidity: function decreaseStake() returns(uint256)
func (_ServiceProviderFactory *ServiceProviderFactoryTransactorSession) DecreaseStake() (*types.Transaction, error) {
	return _ServiceProviderFactory.Contract.DecreaseStake(&_ServiceProviderFactory.TransactOpts)
}

// Deregister is a paid mutator transaction binding the contract method 0xeb3c972a.
//
// Solidity: function deregister(bytes32 _serviceType, string _endpoint) returns(uint256)
func (_ServiceProviderFactory *ServiceProviderFactoryTransactor) Deregister(opts *bind.TransactOpts, _serviceType [32]byte, _endpoint string) (*types.Transaction, error) {
	return _ServiceProviderFactory.contract.Transact(opts, "deregister", _serviceType, _endpoint)
}

// Deregister is a paid mutator transaction binding the contract method 0xeb3c972a.
//
// Solidity: function deregister(bytes32 _serviceType, string _endpoint) returns(uint256)
func (_ServiceProviderFactory *ServiceProviderFactorySession) Deregister(_serviceType [32]byte, _endpoint string) (*types.Transaction, error) {
	return _ServiceProviderFactory.Contract.Deregister(&_ServiceProviderFactory.TransactOpts, _serviceType, _endpoint)
}

// Deregister is a paid mutator transaction binding the contract method 0xeb3c972a.
//
// Solidity: function deregister(bytes32 _serviceType, string _endpoint) returns(uint256)
func (_ServiceProviderFactory *ServiceProviderFactoryTransactorSession) Deregister(_serviceType [32]byte, _endpoint string) (*types.Transaction, error) {
	return _ServiceProviderFactory.Contract.Deregister(&_ServiceProviderFactory.TransactOpts, _serviceType, _endpoint)
}

// IncreaseStake is a paid mutator transaction binding the contract method 0xeedad66b.
//
// Solidity: function increaseStake(uint256 _increaseStakeAmount) returns(uint256)
func (_ServiceProviderFactory *ServiceProviderFactoryTransactor) IncreaseStake(opts *bind.TransactOpts, _increaseStakeAmount *big.Int) (*types.Transaction, error) {
	return _ServiceProviderFactory.contract.Transact(opts, "increaseStake", _increaseStakeAmount)
}

// IncreaseStake is a paid mutator transaction binding the contract method 0xeedad66b.
//
// Solidity: function increaseStake(uint256 _increaseStakeAmount) returns(uint256)
func (_ServiceProviderFactory *ServiceProviderFactorySession) IncreaseStake(_increaseStakeAmount *big.Int) (*types.Transaction, error) {
	return _ServiceProviderFactory.Contract.IncreaseStake(&_ServiceProviderFactory.TransactOpts, _increaseStakeAmount)
}

// IncreaseStake is a paid mutator transaction binding the contract method 0xeedad66b.
//
// Solidity: function increaseStake(uint256 _increaseStakeAmount) returns(uint256)
func (_ServiceProviderFactory *ServiceProviderFactoryTransactorSession) IncreaseStake(_increaseStakeAmount *big.Int) (*types.Transaction, error) {
	return _ServiceProviderFactory.Contract.IncreaseStake(&_ServiceProviderFactory.TransactOpts, _increaseStakeAmount)
}

// Initialize is a paid mutator transaction binding the contract method 0x8129fc1c.
//
// Solidity: function initialize() returns()
func (_ServiceProviderFactory *ServiceProviderFactoryTransactor) Initialize(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _ServiceProviderFactory.contract.Transact(opts, "initialize")
}

// Initialize is a paid mutator transaction binding the contract method 0x8129fc1c.
//
// Solidity: function initialize() returns()
func (_ServiceProviderFactory *ServiceProviderFactorySession) Initialize() (*types.Transaction, error) {
	return _ServiceProviderFactory.Contract.Initialize(&_ServiceProviderFactory.TransactOpts)
}

// Initialize is a paid mutator transaction binding the contract method 0x8129fc1c.
//
// Solidity: function initialize() returns()
func (_ServiceProviderFactory *ServiceProviderFactoryTransactorSession) Initialize() (*types.Transaction, error) {
	return _ServiceProviderFactory.Contract.Initialize(&_ServiceProviderFactory.TransactOpts)
}

// Initialize0 is a paid mutator transaction binding the contract method 0xeb990c59.
//
// Solidity: function initialize(address _governanceAddress, address _claimsManagerAddress, uint256 _decreaseStakeLockupDuration, uint256 _deployerCutLockupDuration) returns()
func (_ServiceProviderFactory *ServiceProviderFactoryTransactor) Initialize0(opts *bind.TransactOpts, _governanceAddress common.Address, _claimsManagerAddress common.Address, _decreaseStakeLockupDuration *big.Int, _deployerCutLockupDuration *big.Int) (*types.Transaction, error) {
	return _ServiceProviderFactory.contract.Transact(opts, "initialize0", _governanceAddress, _claimsManagerAddress, _decreaseStakeLockupDuration, _deployerCutLockupDuration)
}

// Initialize0 is a paid mutator transaction binding the contract method 0xeb990c59.
//
// Solidity: function initialize(address _governanceAddress, address _claimsManagerAddress, uint256 _decreaseStakeLockupDuration, uint256 _deployerCutLockupDuration) returns()
func (_ServiceProviderFactory *ServiceProviderFactorySession) Initialize0(_governanceAddress common.Address, _claimsManagerAddress common.Address, _decreaseStakeLockupDuration *big.Int, _deployerCutLockupDuration *big.Int) (*types.Transaction, error) {
	return _ServiceProviderFactory.Contract.Initialize0(&_ServiceProviderFactory.TransactOpts, _governanceAddress, _claimsManagerAddress, _decreaseStakeLockupDuration, _deployerCutLockupDuration)
}

// Initialize0 is a paid mutator transaction binding the contract method 0xeb990c59.
//
// Solidity: function initialize(address _governanceAddress, address _claimsManagerAddress, uint256 _decreaseStakeLockupDuration, uint256 _deployerCutLockupDuration) returns()
func (_ServiceProviderFactory *ServiceProviderFactoryTransactorSession) Initialize0(_governanceAddress common.Address, _claimsManagerAddress common.Address, _decreaseStakeLockupDuration *big.Int, _deployerCutLockupDuration *big.Int) (*types.Transaction, error) {
	return _ServiceProviderFactory.Contract.Initialize0(&_ServiceProviderFactory.TransactOpts, _governanceAddress, _claimsManagerAddress, _decreaseStakeLockupDuration, _deployerCutLockupDuration)
}

// Register is a paid mutator transaction binding the contract method 0x4fe84c09.
//
// Solidity: function register(bytes32 _serviceType, string _endpoint, uint256 _stakeAmount, address _delegateOwnerWallet) returns(uint256)
func (_ServiceProviderFactory *ServiceProviderFactoryTransactor) Register(opts *bind.TransactOpts, _serviceType [32]byte, _endpoint string, _stakeAmount *big.Int, _delegateOwnerWallet common.Address) (*types.Transaction, error) {
	return _ServiceProviderFactory.contract.Transact(opts, "register", _serviceType, _endpoint, _stakeAmount, _delegateOwnerWallet)
}

// Register is a paid mutator transaction binding the contract method 0x4fe84c09.
//
// Solidity: function register(bytes32 _serviceType, string _endpoint, uint256 _stakeAmount, address _delegateOwnerWallet) returns(uint256)
func (_ServiceProviderFactory *ServiceProviderFactorySession) Register(_serviceType [32]byte, _endpoint string, _stakeAmount *big.Int, _delegateOwnerWallet common.Address) (*types.Transaction, error) {
	return _ServiceProviderFactory.Contract.Register(&_ServiceProviderFactory.TransactOpts, _serviceType, _endpoint, _stakeAmount, _delegateOwnerWallet)
}

// Register is a paid mutator transaction binding the contract method 0x4fe84c09.
//
// Solidity: function register(bytes32 _serviceType, string _endpoint, uint256 _stakeAmount, address _delegateOwnerWallet) returns(uint256)
func (_ServiceProviderFactory *ServiceProviderFactoryTransactorSession) Register(_serviceType [32]byte, _endpoint string, _stakeAmount *big.Int, _delegateOwnerWallet common.Address) (*types.Transaction, error) {
	return _ServiceProviderFactory.Contract.Register(&_ServiceProviderFactory.TransactOpts, _serviceType, _endpoint, _stakeAmount, _delegateOwnerWallet)
}

// RequestDecreaseStake is a paid mutator transaction binding the contract method 0xe2995f8d.
//
// Solidity: function requestDecreaseStake(uint256 _decreaseStakeAmount) returns(uint256)
func (_ServiceProviderFactory *ServiceProviderFactoryTransactor) RequestDecreaseStake(opts *bind.TransactOpts, _decreaseStakeAmount *big.Int) (*types.Transaction, error) {
	return _ServiceProviderFactory.contract.Transact(opts, "requestDecreaseStake", _decreaseStakeAmount)
}

// RequestDecreaseStake is a paid mutator transaction binding the contract method 0xe2995f8d.
//
// Solidity: function requestDecreaseStake(uint256 _decreaseStakeAmount) returns(uint256)
func (_ServiceProviderFactory *ServiceProviderFactorySession) RequestDecreaseStake(_decreaseStakeAmount *big.Int) (*types.Transaction, error) {
	return _ServiceProviderFactory.Contract.RequestDecreaseStake(&_ServiceProviderFactory.TransactOpts, _decreaseStakeAmount)
}

// RequestDecreaseStake is a paid mutator transaction binding the contract method 0xe2995f8d.
//
// Solidity: function requestDecreaseStake(uint256 _decreaseStakeAmount) returns(uint256)
func (_ServiceProviderFactory *ServiceProviderFactoryTransactorSession) RequestDecreaseStake(_decreaseStakeAmount *big.Int) (*types.Transaction, error) {
	return _ServiceProviderFactory.Contract.RequestDecreaseStake(&_ServiceProviderFactory.TransactOpts, _decreaseStakeAmount)
}

// RequestUpdateDeployerCut is a paid mutator transaction binding the contract method 0x25246ab6.
//
// Solidity: function requestUpdateDeployerCut(address _serviceProvider, uint256 _cut) returns()
func (_ServiceProviderFactory *ServiceProviderFactoryTransactor) RequestUpdateDeployerCut(opts *bind.TransactOpts, _serviceProvider common.Address, _cut *big.Int) (*types.Transaction, error) {
	return _ServiceProviderFactory.contract.Transact(opts, "requestUpdateDeployerCut", _serviceProvider, _cut)
}

// RequestUpdateDeployerCut is a paid mutator transaction binding the contract method 0x25246ab6.
//
// Solidity: function requestUpdateDeployerCut(address _serviceProvider, uint256 _cut) returns()
func (_ServiceProviderFactory *ServiceProviderFactorySession) RequestUpdateDeployerCut(_serviceProvider common.Address, _cut *big.Int) (*types.Transaction, error) {
	return _ServiceProviderFactory.Contract.RequestUpdateDeployerCut(&_ServiceProviderFactory.TransactOpts, _serviceProvider, _cut)
}

// RequestUpdateDeployerCut is a paid mutator transaction binding the contract method 0x25246ab6.
//
// Solidity: function requestUpdateDeployerCut(address _serviceProvider, uint256 _cut) returns()
func (_ServiceProviderFactory *ServiceProviderFactoryTransactorSession) RequestUpdateDeployerCut(_serviceProvider common.Address, _cut *big.Int) (*types.Transaction, error) {
	return _ServiceProviderFactory.Contract.RequestUpdateDeployerCut(&_ServiceProviderFactory.TransactOpts, _serviceProvider, _cut)
}

// SetClaimsManagerAddress is a paid mutator transaction binding the contract method 0xaa70d236.
//
// Solidity: function setClaimsManagerAddress(address _address) returns()
func (_ServiceProviderFactory *ServiceProviderFactoryTransactor) SetClaimsManagerAddress(opts *bind.TransactOpts, _address common.Address) (*types.Transaction, error) {
	return _ServiceProviderFactory.contract.Transact(opts, "setClaimsManagerAddress", _address)
}

// SetClaimsManagerAddress is a paid mutator transaction binding the contract method 0xaa70d236.
//
// Solidity: function setClaimsManagerAddress(address _address) returns()
func (_ServiceProviderFactory *ServiceProviderFactorySession) SetClaimsManagerAddress(_address common.Address) (*types.Transaction, error) {
	return _ServiceProviderFactory.Contract.SetClaimsManagerAddress(&_ServiceProviderFactory.TransactOpts, _address)
}

// SetClaimsManagerAddress is a paid mutator transaction binding the contract method 0xaa70d236.
//
// Solidity: function setClaimsManagerAddress(address _address) returns()
func (_ServiceProviderFactory *ServiceProviderFactoryTransactorSession) SetClaimsManagerAddress(_address common.Address) (*types.Transaction, error) {
	return _ServiceProviderFactory.Contract.SetClaimsManagerAddress(&_ServiceProviderFactory.TransactOpts, _address)
}

// SetDelegateManagerAddress is a paid mutator transaction binding the contract method 0xea63d651.
//
// Solidity: function setDelegateManagerAddress(address _address) returns()
func (_ServiceProviderFactory *ServiceProviderFactoryTransactor) SetDelegateManagerAddress(opts *bind.TransactOpts, _address common.Address) (*types.Transaction, error) {
	return _ServiceProviderFactory.contract.Transact(opts, "setDelegateManagerAddress", _address)
}

// SetDelegateManagerAddress is a paid mutator transaction binding the contract method 0xea63d651.
//
// Solidity: function setDelegateManagerAddress(address _address) returns()
func (_ServiceProviderFactory *ServiceProviderFactorySession) SetDelegateManagerAddress(_address common.Address) (*types.Transaction, error) {
	return _ServiceProviderFactory.Contract.SetDelegateManagerAddress(&_ServiceProviderFactory.TransactOpts, _address)
}

// SetDelegateManagerAddress is a paid mutator transaction binding the contract method 0xea63d651.
//
// Solidity: function setDelegateManagerAddress(address _address) returns()
func (_ServiceProviderFactory *ServiceProviderFactoryTransactorSession) SetDelegateManagerAddress(_address common.Address) (*types.Transaction, error) {
	return _ServiceProviderFactory.Contract.SetDelegateManagerAddress(&_ServiceProviderFactory.TransactOpts, _address)
}

// SetGovernanceAddress is a paid mutator transaction binding the contract method 0xcfc16254.
//
// Solidity: function setGovernanceAddress(address _governanceAddress) returns()
func (_ServiceProviderFactory *ServiceProviderFactoryTransactor) SetGovernanceAddress(opts *bind.TransactOpts, _governanceAddress common.Address) (*types.Transaction, error) {
	return _ServiceProviderFactory.contract.Transact(opts, "setGovernanceAddress", _governanceAddress)
}

// SetGovernanceAddress is a paid mutator transaction binding the contract method 0xcfc16254.
//
// Solidity: function setGovernanceAddress(address _governanceAddress) returns()
func (_ServiceProviderFactory *ServiceProviderFactorySession) SetGovernanceAddress(_governanceAddress common.Address) (*types.Transaction, error) {
	return _ServiceProviderFactory.Contract.SetGovernanceAddress(&_ServiceProviderFactory.TransactOpts, _governanceAddress)
}

// SetGovernanceAddress is a paid mutator transaction binding the contract method 0xcfc16254.
//
// Solidity: function setGovernanceAddress(address _governanceAddress) returns()
func (_ServiceProviderFactory *ServiceProviderFactoryTransactorSession) SetGovernanceAddress(_governanceAddress common.Address) (*types.Transaction, error) {
	return _ServiceProviderFactory.Contract.SetGovernanceAddress(&_ServiceProviderFactory.TransactOpts, _governanceAddress)
}

// SetServiceTypeManagerAddress is a paid mutator transaction binding the contract method 0xa1c24ceb.
//
// Solidity: function setServiceTypeManagerAddress(address _address) returns()
func (_ServiceProviderFactory *ServiceProviderFactoryTransactor) SetServiceTypeManagerAddress(opts *bind.TransactOpts, _address common.Address) (*types.Transaction, error) {
	return _ServiceProviderFactory.contract.Transact(opts, "setServiceTypeManagerAddress", _address)
}

// SetServiceTypeManagerAddress is a paid mutator transaction binding the contract method 0xa1c24ceb.
//
// Solidity: function setServiceTypeManagerAddress(address _address) returns()
func (_ServiceProviderFactory *ServiceProviderFactorySession) SetServiceTypeManagerAddress(_address common.Address) (*types.Transaction, error) {
	return _ServiceProviderFactory.Contract.SetServiceTypeManagerAddress(&_ServiceProviderFactory.TransactOpts, _address)
}

// SetServiceTypeManagerAddress is a paid mutator transaction binding the contract method 0xa1c24ceb.
//
// Solidity: function setServiceTypeManagerAddress(address _address) returns()
func (_ServiceProviderFactory *ServiceProviderFactoryTransactorSession) SetServiceTypeManagerAddress(_address common.Address) (*types.Transaction, error) {
	return _ServiceProviderFactory.Contract.SetServiceTypeManagerAddress(&_ServiceProviderFactory.TransactOpts, _address)
}

// SetStakingAddress is a paid mutator transaction binding the contract method 0xf4e0d9ac.
//
// Solidity: function setStakingAddress(address _address) returns()
func (_ServiceProviderFactory *ServiceProviderFactoryTransactor) SetStakingAddress(opts *bind.TransactOpts, _address common.Address) (*types.Transaction, error) {
	return _ServiceProviderFactory.contract.Transact(opts, "setStakingAddress", _address)
}

// SetStakingAddress is a paid mutator transaction binding the contract method 0xf4e0d9ac.
//
// Solidity: function setStakingAddress(address _address) returns()
func (_ServiceProviderFactory *ServiceProviderFactorySession) SetStakingAddress(_address common.Address) (*types.Transaction, error) {
	return _ServiceProviderFactory.Contract.SetStakingAddress(&_ServiceProviderFactory.TransactOpts, _address)
}

// SetStakingAddress is a paid mutator transaction binding the contract method 0xf4e0d9ac.
//
// Solidity: function setStakingAddress(address _address) returns()
func (_ServiceProviderFactory *ServiceProviderFactoryTransactorSession) SetStakingAddress(_address common.Address) (*types.Transaction, error) {
	return _ServiceProviderFactory.Contract.SetStakingAddress(&_ServiceProviderFactory.TransactOpts, _address)
}

// UpdateDecreaseStakeLockupDuration is a paid mutator transaction binding the contract method 0x693410c5.
//
// Solidity: function updateDecreaseStakeLockupDuration(uint256 _duration) returns()
func (_ServiceProviderFactory *ServiceProviderFactoryTransactor) UpdateDecreaseStakeLockupDuration(opts *bind.TransactOpts, _duration *big.Int) (*types.Transaction, error) {
	return _ServiceProviderFactory.contract.Transact(opts, "updateDecreaseStakeLockupDuration", _duration)
}

// UpdateDecreaseStakeLockupDuration is a paid mutator transaction binding the contract method 0x693410c5.
//
// Solidity: function updateDecreaseStakeLockupDuration(uint256 _duration) returns()
func (_ServiceProviderFactory *ServiceProviderFactorySession) UpdateDecreaseStakeLockupDuration(_duration *big.Int) (*types.Transaction, error) {
	return _ServiceProviderFactory.Contract.UpdateDecreaseStakeLockupDuration(&_ServiceProviderFactory.TransactOpts, _duration)
}

// UpdateDecreaseStakeLockupDuration is a paid mutator transaction binding the contract method 0x693410c5.
//
// Solidity: function updateDecreaseStakeLockupDuration(uint256 _duration) returns()
func (_ServiceProviderFactory *ServiceProviderFactoryTransactorSession) UpdateDecreaseStakeLockupDuration(_duration *big.Int) (*types.Transaction, error) {
	return _ServiceProviderFactory.Contract.UpdateDecreaseStakeLockupDuration(&_ServiceProviderFactory.TransactOpts, _duration)
}

// UpdateDelegateOwnerWallet is a paid mutator transaction binding the contract method 0xf615a11a.
//
// Solidity: function updateDelegateOwnerWallet(bytes32 _serviceType, string _endpoint, address _updatedDelegateOwnerWallet) returns()
func (_ServiceProviderFactory *ServiceProviderFactoryTransactor) UpdateDelegateOwnerWallet(opts *bind.TransactOpts, _serviceType [32]byte, _endpoint string, _updatedDelegateOwnerWallet common.Address) (*types.Transaction, error) {
	return _ServiceProviderFactory.contract.Transact(opts, "updateDelegateOwnerWallet", _serviceType, _endpoint, _updatedDelegateOwnerWallet)
}

// UpdateDelegateOwnerWallet is a paid mutator transaction binding the contract method 0xf615a11a.
//
// Solidity: function updateDelegateOwnerWallet(bytes32 _serviceType, string _endpoint, address _updatedDelegateOwnerWallet) returns()
func (_ServiceProviderFactory *ServiceProviderFactorySession) UpdateDelegateOwnerWallet(_serviceType [32]byte, _endpoint string, _updatedDelegateOwnerWallet common.Address) (*types.Transaction, error) {
	return _ServiceProviderFactory.Contract.UpdateDelegateOwnerWallet(&_ServiceProviderFactory.TransactOpts, _serviceType, _endpoint, _updatedDelegateOwnerWallet)
}

// UpdateDelegateOwnerWallet is a paid mutator transaction binding the contract method 0xf615a11a.
//
// Solidity: function updateDelegateOwnerWallet(bytes32 _serviceType, string _endpoint, address _updatedDelegateOwnerWallet) returns()
func (_ServiceProviderFactory *ServiceProviderFactoryTransactorSession) UpdateDelegateOwnerWallet(_serviceType [32]byte, _endpoint string, _updatedDelegateOwnerWallet common.Address) (*types.Transaction, error) {
	return _ServiceProviderFactory.Contract.UpdateDelegateOwnerWallet(&_ServiceProviderFactory.TransactOpts, _serviceType, _endpoint, _updatedDelegateOwnerWallet)
}

// UpdateDeployerCut is a paid mutator transaction binding the contract method 0xfda5f201.
//
// Solidity: function updateDeployerCut(address _serviceProvider) returns()
func (_ServiceProviderFactory *ServiceProviderFactoryTransactor) UpdateDeployerCut(opts *bind.TransactOpts, _serviceProvider common.Address) (*types.Transaction, error) {
	return _ServiceProviderFactory.contract.Transact(opts, "updateDeployerCut", _serviceProvider)
}

// UpdateDeployerCut is a paid mutator transaction binding the contract method 0xfda5f201.
//
// Solidity: function updateDeployerCut(address _serviceProvider) returns()
func (_ServiceProviderFactory *ServiceProviderFactorySession) UpdateDeployerCut(_serviceProvider common.Address) (*types.Transaction, error) {
	return _ServiceProviderFactory.Contract.UpdateDeployerCut(&_ServiceProviderFactory.TransactOpts, _serviceProvider)
}

// UpdateDeployerCut is a paid mutator transaction binding the contract method 0xfda5f201.
//
// Solidity: function updateDeployerCut(address _serviceProvider) returns()
func (_ServiceProviderFactory *ServiceProviderFactoryTransactorSession) UpdateDeployerCut(_serviceProvider common.Address) (*types.Transaction, error) {
	return _ServiceProviderFactory.Contract.UpdateDeployerCut(&_ServiceProviderFactory.TransactOpts, _serviceProvider)
}

// UpdateDeployerCutLockupDuration is a paid mutator transaction binding the contract method 0x1a7c96fe.
//
// Solidity: function updateDeployerCutLockupDuration(uint256 _duration) returns()
func (_ServiceProviderFactory *ServiceProviderFactoryTransactor) UpdateDeployerCutLockupDuration(opts *bind.TransactOpts, _duration *big.Int) (*types.Transaction, error) {
	return _ServiceProviderFactory.contract.Transact(opts, "updateDeployerCutLockupDuration", _duration)
}

// UpdateDeployerCutLockupDuration is a paid mutator transaction binding the contract method 0x1a7c96fe.
//
// Solidity: function updateDeployerCutLockupDuration(uint256 _duration) returns()
func (_ServiceProviderFactory *ServiceProviderFactorySession) UpdateDeployerCutLockupDuration(_duration *big.Int) (*types.Transaction, error) {
	return _ServiceProviderFactory.Contract.UpdateDeployerCutLockupDuration(&_ServiceProviderFactory.TransactOpts, _duration)
}

// UpdateDeployerCutLockupDuration is a paid mutator transaction binding the contract method 0x1a7c96fe.
//
// Solidity: function updateDeployerCutLockupDuration(uint256 _duration) returns()
func (_ServiceProviderFactory *ServiceProviderFactoryTransactorSession) UpdateDeployerCutLockupDuration(_duration *big.Int) (*types.Transaction, error) {
	return _ServiceProviderFactory.Contract.UpdateDeployerCutLockupDuration(&_ServiceProviderFactory.TransactOpts, _duration)
}

// UpdateEndpoint is a paid mutator transaction binding the contract method 0x0fcb34b4.
//
// Solidity: function updateEndpoint(bytes32 _serviceType, string _oldEndpoint, string _newEndpoint) returns(uint256)
func (_ServiceProviderFactory *ServiceProviderFactoryTransactor) UpdateEndpoint(opts *bind.TransactOpts, _serviceType [32]byte, _oldEndpoint string, _newEndpoint string) (*types.Transaction, error) {
	return _ServiceProviderFactory.contract.Transact(opts, "updateEndpoint", _serviceType, _oldEndpoint, _newEndpoint)
}

// UpdateEndpoint is a paid mutator transaction binding the contract method 0x0fcb34b4.
//
// Solidity: function updateEndpoint(bytes32 _serviceType, string _oldEndpoint, string _newEndpoint) returns(uint256)
func (_ServiceProviderFactory *ServiceProviderFactorySession) UpdateEndpoint(_serviceType [32]byte, _oldEndpoint string, _newEndpoint string) (*types.Transaction, error) {
	return _ServiceProviderFactory.Contract.UpdateEndpoint(&_ServiceProviderFactory.TransactOpts, _serviceType, _oldEndpoint, _newEndpoint)
}

// UpdateEndpoint is a paid mutator transaction binding the contract method 0x0fcb34b4.
//
// Solidity: function updateEndpoint(bytes32 _serviceType, string _oldEndpoint, string _newEndpoint) returns(uint256)
func (_ServiceProviderFactory *ServiceProviderFactoryTransactorSession) UpdateEndpoint(_serviceType [32]byte, _oldEndpoint string, _newEndpoint string) (*types.Transaction, error) {
	return _ServiceProviderFactory.Contract.UpdateEndpoint(&_ServiceProviderFactory.TransactOpts, _serviceType, _oldEndpoint, _newEndpoint)
}

// UpdateServiceProviderStake is a paid mutator transaction binding the contract method 0xb90bc852.
//
// Solidity: function updateServiceProviderStake(address _serviceProvider, uint256 _amount) returns()
func (_ServiceProviderFactory *ServiceProviderFactoryTransactor) UpdateServiceProviderStake(opts *bind.TransactOpts, _serviceProvider common.Address, _amount *big.Int) (*types.Transaction, error) {
	return _ServiceProviderFactory.contract.Transact(opts, "updateServiceProviderStake", _serviceProvider, _amount)
}

// UpdateServiceProviderStake is a paid mutator transaction binding the contract method 0xb90bc852.
//
// Solidity: function updateServiceProviderStake(address _serviceProvider, uint256 _amount) returns()
func (_ServiceProviderFactory *ServiceProviderFactorySession) UpdateServiceProviderStake(_serviceProvider common.Address, _amount *big.Int) (*types.Transaction, error) {
	return _ServiceProviderFactory.Contract.UpdateServiceProviderStake(&_ServiceProviderFactory.TransactOpts, _serviceProvider, _amount)
}

// UpdateServiceProviderStake is a paid mutator transaction binding the contract method 0xb90bc852.
//
// Solidity: function updateServiceProviderStake(address _serviceProvider, uint256 _amount) returns()
func (_ServiceProviderFactory *ServiceProviderFactoryTransactorSession) UpdateServiceProviderStake(_serviceProvider common.Address, _amount *big.Int) (*types.Transaction, error) {
	return _ServiceProviderFactory.Contract.UpdateServiceProviderStake(&_ServiceProviderFactory.TransactOpts, _serviceProvider, _amount)
}

// ServiceProviderFactoryClaimsManagerAddressUpdatedIterator is returned from FilterClaimsManagerAddressUpdated and is used to iterate over the raw logs and unpacked data for ClaimsManagerAddressUpdated events raised by the ServiceProviderFactory contract.
type ServiceProviderFactoryClaimsManagerAddressUpdatedIterator struct {
	Event *ServiceProviderFactoryClaimsManagerAddressUpdated // Event containing the contract specifics and raw log

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
func (it *ServiceProviderFactoryClaimsManagerAddressUpdatedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(ServiceProviderFactoryClaimsManagerAddressUpdated)
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
		it.Event = new(ServiceProviderFactoryClaimsManagerAddressUpdated)
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
func (it *ServiceProviderFactoryClaimsManagerAddressUpdatedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *ServiceProviderFactoryClaimsManagerAddressUpdatedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// ServiceProviderFactoryClaimsManagerAddressUpdated represents a ClaimsManagerAddressUpdated event raised by the ServiceProviderFactory contract.
type ServiceProviderFactoryClaimsManagerAddressUpdated struct {
	NewClaimsManagerAddress common.Address
	Raw                     types.Log // Blockchain specific contextual infos
}

// FilterClaimsManagerAddressUpdated is a free log retrieval operation binding the contract event 0x3b3679838ffd21f454712cf443ab98f11d36d5552da016314c5cbe364a10c243.
//
// Solidity: event ClaimsManagerAddressUpdated(address indexed _newClaimsManagerAddress)
func (_ServiceProviderFactory *ServiceProviderFactoryFilterer) FilterClaimsManagerAddressUpdated(opts *bind.FilterOpts, _newClaimsManagerAddress []common.Address) (*ServiceProviderFactoryClaimsManagerAddressUpdatedIterator, error) {

	var _newClaimsManagerAddressRule []interface{}
	for _, _newClaimsManagerAddressItem := range _newClaimsManagerAddress {
		_newClaimsManagerAddressRule = append(_newClaimsManagerAddressRule, _newClaimsManagerAddressItem)
	}

	logs, sub, err := _ServiceProviderFactory.contract.FilterLogs(opts, "ClaimsManagerAddressUpdated", _newClaimsManagerAddressRule)
	if err != nil {
		return nil, err
	}
	return &ServiceProviderFactoryClaimsManagerAddressUpdatedIterator{contract: _ServiceProviderFactory.contract, event: "ClaimsManagerAddressUpdated", logs: logs, sub: sub}, nil
}

// WatchClaimsManagerAddressUpdated is a free log subscription operation binding the contract event 0x3b3679838ffd21f454712cf443ab98f11d36d5552da016314c5cbe364a10c243.
//
// Solidity: event ClaimsManagerAddressUpdated(address indexed _newClaimsManagerAddress)
func (_ServiceProviderFactory *ServiceProviderFactoryFilterer) WatchClaimsManagerAddressUpdated(opts *bind.WatchOpts, sink chan<- *ServiceProviderFactoryClaimsManagerAddressUpdated, _newClaimsManagerAddress []common.Address) (event.Subscription, error) {

	var _newClaimsManagerAddressRule []interface{}
	for _, _newClaimsManagerAddressItem := range _newClaimsManagerAddress {
		_newClaimsManagerAddressRule = append(_newClaimsManagerAddressRule, _newClaimsManagerAddressItem)
	}

	logs, sub, err := _ServiceProviderFactory.contract.WatchLogs(opts, "ClaimsManagerAddressUpdated", _newClaimsManagerAddressRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(ServiceProviderFactoryClaimsManagerAddressUpdated)
				if err := _ServiceProviderFactory.contract.UnpackLog(event, "ClaimsManagerAddressUpdated", log); err != nil {
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
func (_ServiceProviderFactory *ServiceProviderFactoryFilterer) ParseClaimsManagerAddressUpdated(log types.Log) (*ServiceProviderFactoryClaimsManagerAddressUpdated, error) {
	event := new(ServiceProviderFactoryClaimsManagerAddressUpdated)
	if err := _ServiceProviderFactory.contract.UnpackLog(event, "ClaimsManagerAddressUpdated", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// ServiceProviderFactoryDecreaseStakeLockupDurationUpdatedIterator is returned from FilterDecreaseStakeLockupDurationUpdated and is used to iterate over the raw logs and unpacked data for DecreaseStakeLockupDurationUpdated events raised by the ServiceProviderFactory contract.
type ServiceProviderFactoryDecreaseStakeLockupDurationUpdatedIterator struct {
	Event *ServiceProviderFactoryDecreaseStakeLockupDurationUpdated // Event containing the contract specifics and raw log

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
func (it *ServiceProviderFactoryDecreaseStakeLockupDurationUpdatedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(ServiceProviderFactoryDecreaseStakeLockupDurationUpdated)
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
		it.Event = new(ServiceProviderFactoryDecreaseStakeLockupDurationUpdated)
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
func (it *ServiceProviderFactoryDecreaseStakeLockupDurationUpdatedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *ServiceProviderFactoryDecreaseStakeLockupDurationUpdatedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// ServiceProviderFactoryDecreaseStakeLockupDurationUpdated represents a DecreaseStakeLockupDurationUpdated event raised by the ServiceProviderFactory contract.
type ServiceProviderFactoryDecreaseStakeLockupDurationUpdated struct {
	LockupDuration *big.Int
	Raw            types.Log // Blockchain specific contextual infos
}

// FilterDecreaseStakeLockupDurationUpdated is a free log retrieval operation binding the contract event 0xdc3fafbbdb1a933aec8f5bf13e91717daef615f7489a2d3ea7cddab94a39cab7.
//
// Solidity: event DecreaseStakeLockupDurationUpdated(uint256 indexed _lockupDuration)
func (_ServiceProviderFactory *ServiceProviderFactoryFilterer) FilterDecreaseStakeLockupDurationUpdated(opts *bind.FilterOpts, _lockupDuration []*big.Int) (*ServiceProviderFactoryDecreaseStakeLockupDurationUpdatedIterator, error) {

	var _lockupDurationRule []interface{}
	for _, _lockupDurationItem := range _lockupDuration {
		_lockupDurationRule = append(_lockupDurationRule, _lockupDurationItem)
	}

	logs, sub, err := _ServiceProviderFactory.contract.FilterLogs(opts, "DecreaseStakeLockupDurationUpdated", _lockupDurationRule)
	if err != nil {
		return nil, err
	}
	return &ServiceProviderFactoryDecreaseStakeLockupDurationUpdatedIterator{contract: _ServiceProviderFactory.contract, event: "DecreaseStakeLockupDurationUpdated", logs: logs, sub: sub}, nil
}

// WatchDecreaseStakeLockupDurationUpdated is a free log subscription operation binding the contract event 0xdc3fafbbdb1a933aec8f5bf13e91717daef615f7489a2d3ea7cddab94a39cab7.
//
// Solidity: event DecreaseStakeLockupDurationUpdated(uint256 indexed _lockupDuration)
func (_ServiceProviderFactory *ServiceProviderFactoryFilterer) WatchDecreaseStakeLockupDurationUpdated(opts *bind.WatchOpts, sink chan<- *ServiceProviderFactoryDecreaseStakeLockupDurationUpdated, _lockupDuration []*big.Int) (event.Subscription, error) {

	var _lockupDurationRule []interface{}
	for _, _lockupDurationItem := range _lockupDuration {
		_lockupDurationRule = append(_lockupDurationRule, _lockupDurationItem)
	}

	logs, sub, err := _ServiceProviderFactory.contract.WatchLogs(opts, "DecreaseStakeLockupDurationUpdated", _lockupDurationRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(ServiceProviderFactoryDecreaseStakeLockupDurationUpdated)
				if err := _ServiceProviderFactory.contract.UnpackLog(event, "DecreaseStakeLockupDurationUpdated", log); err != nil {
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

// ParseDecreaseStakeLockupDurationUpdated is a log parse operation binding the contract event 0xdc3fafbbdb1a933aec8f5bf13e91717daef615f7489a2d3ea7cddab94a39cab7.
//
// Solidity: event DecreaseStakeLockupDurationUpdated(uint256 indexed _lockupDuration)
func (_ServiceProviderFactory *ServiceProviderFactoryFilterer) ParseDecreaseStakeLockupDurationUpdated(log types.Log) (*ServiceProviderFactoryDecreaseStakeLockupDurationUpdated, error) {
	event := new(ServiceProviderFactoryDecreaseStakeLockupDurationUpdated)
	if err := _ServiceProviderFactory.contract.UnpackLog(event, "DecreaseStakeLockupDurationUpdated", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// ServiceProviderFactoryDecreaseStakeRequestCancelledIterator is returned from FilterDecreaseStakeRequestCancelled and is used to iterate over the raw logs and unpacked data for DecreaseStakeRequestCancelled events raised by the ServiceProviderFactory contract.
type ServiceProviderFactoryDecreaseStakeRequestCancelledIterator struct {
	Event *ServiceProviderFactoryDecreaseStakeRequestCancelled // Event containing the contract specifics and raw log

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
func (it *ServiceProviderFactoryDecreaseStakeRequestCancelledIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(ServiceProviderFactoryDecreaseStakeRequestCancelled)
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
		it.Event = new(ServiceProviderFactoryDecreaseStakeRequestCancelled)
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
func (it *ServiceProviderFactoryDecreaseStakeRequestCancelledIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *ServiceProviderFactoryDecreaseStakeRequestCancelledIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// ServiceProviderFactoryDecreaseStakeRequestCancelled represents a DecreaseStakeRequestCancelled event raised by the ServiceProviderFactory contract.
type ServiceProviderFactoryDecreaseStakeRequestCancelled struct {
	Owner             common.Address
	DecreaseAmount    *big.Int
	LockupExpiryBlock *big.Int
	Raw               types.Log // Blockchain specific contextual infos
}

// FilterDecreaseStakeRequestCancelled is a free log retrieval operation binding the contract event 0xd2527e9dd387f680eb86b6449b3e79d6b26070ca004f2f228a81cc65a8b84523.
//
// Solidity: event DecreaseStakeRequestCancelled(address indexed _owner, uint256 indexed _decreaseAmount, uint256 indexed _lockupExpiryBlock)
func (_ServiceProviderFactory *ServiceProviderFactoryFilterer) FilterDecreaseStakeRequestCancelled(opts *bind.FilterOpts, _owner []common.Address, _decreaseAmount []*big.Int, _lockupExpiryBlock []*big.Int) (*ServiceProviderFactoryDecreaseStakeRequestCancelledIterator, error) {

	var _ownerRule []interface{}
	for _, _ownerItem := range _owner {
		_ownerRule = append(_ownerRule, _ownerItem)
	}
	var _decreaseAmountRule []interface{}
	for _, _decreaseAmountItem := range _decreaseAmount {
		_decreaseAmountRule = append(_decreaseAmountRule, _decreaseAmountItem)
	}
	var _lockupExpiryBlockRule []interface{}
	for _, _lockupExpiryBlockItem := range _lockupExpiryBlock {
		_lockupExpiryBlockRule = append(_lockupExpiryBlockRule, _lockupExpiryBlockItem)
	}

	logs, sub, err := _ServiceProviderFactory.contract.FilterLogs(opts, "DecreaseStakeRequestCancelled", _ownerRule, _decreaseAmountRule, _lockupExpiryBlockRule)
	if err != nil {
		return nil, err
	}
	return &ServiceProviderFactoryDecreaseStakeRequestCancelledIterator{contract: _ServiceProviderFactory.contract, event: "DecreaseStakeRequestCancelled", logs: logs, sub: sub}, nil
}

// WatchDecreaseStakeRequestCancelled is a free log subscription operation binding the contract event 0xd2527e9dd387f680eb86b6449b3e79d6b26070ca004f2f228a81cc65a8b84523.
//
// Solidity: event DecreaseStakeRequestCancelled(address indexed _owner, uint256 indexed _decreaseAmount, uint256 indexed _lockupExpiryBlock)
func (_ServiceProviderFactory *ServiceProviderFactoryFilterer) WatchDecreaseStakeRequestCancelled(opts *bind.WatchOpts, sink chan<- *ServiceProviderFactoryDecreaseStakeRequestCancelled, _owner []common.Address, _decreaseAmount []*big.Int, _lockupExpiryBlock []*big.Int) (event.Subscription, error) {

	var _ownerRule []interface{}
	for _, _ownerItem := range _owner {
		_ownerRule = append(_ownerRule, _ownerItem)
	}
	var _decreaseAmountRule []interface{}
	for _, _decreaseAmountItem := range _decreaseAmount {
		_decreaseAmountRule = append(_decreaseAmountRule, _decreaseAmountItem)
	}
	var _lockupExpiryBlockRule []interface{}
	for _, _lockupExpiryBlockItem := range _lockupExpiryBlock {
		_lockupExpiryBlockRule = append(_lockupExpiryBlockRule, _lockupExpiryBlockItem)
	}

	logs, sub, err := _ServiceProviderFactory.contract.WatchLogs(opts, "DecreaseStakeRequestCancelled", _ownerRule, _decreaseAmountRule, _lockupExpiryBlockRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(ServiceProviderFactoryDecreaseStakeRequestCancelled)
				if err := _ServiceProviderFactory.contract.UnpackLog(event, "DecreaseStakeRequestCancelled", log); err != nil {
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

// ParseDecreaseStakeRequestCancelled is a log parse operation binding the contract event 0xd2527e9dd387f680eb86b6449b3e79d6b26070ca004f2f228a81cc65a8b84523.
//
// Solidity: event DecreaseStakeRequestCancelled(address indexed _owner, uint256 indexed _decreaseAmount, uint256 indexed _lockupExpiryBlock)
func (_ServiceProviderFactory *ServiceProviderFactoryFilterer) ParseDecreaseStakeRequestCancelled(log types.Log) (*ServiceProviderFactoryDecreaseStakeRequestCancelled, error) {
	event := new(ServiceProviderFactoryDecreaseStakeRequestCancelled)
	if err := _ServiceProviderFactory.contract.UnpackLog(event, "DecreaseStakeRequestCancelled", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// ServiceProviderFactoryDecreaseStakeRequestEvaluatedIterator is returned from FilterDecreaseStakeRequestEvaluated and is used to iterate over the raw logs and unpacked data for DecreaseStakeRequestEvaluated events raised by the ServiceProviderFactory contract.
type ServiceProviderFactoryDecreaseStakeRequestEvaluatedIterator struct {
	Event *ServiceProviderFactoryDecreaseStakeRequestEvaluated // Event containing the contract specifics and raw log

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
func (it *ServiceProviderFactoryDecreaseStakeRequestEvaluatedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(ServiceProviderFactoryDecreaseStakeRequestEvaluated)
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
		it.Event = new(ServiceProviderFactoryDecreaseStakeRequestEvaluated)
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
func (it *ServiceProviderFactoryDecreaseStakeRequestEvaluatedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *ServiceProviderFactoryDecreaseStakeRequestEvaluatedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// ServiceProviderFactoryDecreaseStakeRequestEvaluated represents a DecreaseStakeRequestEvaluated event raised by the ServiceProviderFactory contract.
type ServiceProviderFactoryDecreaseStakeRequestEvaluated struct {
	Owner          common.Address
	DecreaseAmount *big.Int
	NewStakeAmount *big.Int
	Raw            types.Log // Blockchain specific contextual infos
}

// FilterDecreaseStakeRequestEvaluated is a free log retrieval operation binding the contract event 0x4fa1898c33227e9e35023440f0fa23fcb2dbf6d8a31c3b0f975c302e7f806bfa.
//
// Solidity: event DecreaseStakeRequestEvaluated(address indexed _owner, uint256 indexed _decreaseAmount, uint256 indexed _newStakeAmount)
func (_ServiceProviderFactory *ServiceProviderFactoryFilterer) FilterDecreaseStakeRequestEvaluated(opts *bind.FilterOpts, _owner []common.Address, _decreaseAmount []*big.Int, _newStakeAmount []*big.Int) (*ServiceProviderFactoryDecreaseStakeRequestEvaluatedIterator, error) {

	var _ownerRule []interface{}
	for _, _ownerItem := range _owner {
		_ownerRule = append(_ownerRule, _ownerItem)
	}
	var _decreaseAmountRule []interface{}
	for _, _decreaseAmountItem := range _decreaseAmount {
		_decreaseAmountRule = append(_decreaseAmountRule, _decreaseAmountItem)
	}
	var _newStakeAmountRule []interface{}
	for _, _newStakeAmountItem := range _newStakeAmount {
		_newStakeAmountRule = append(_newStakeAmountRule, _newStakeAmountItem)
	}

	logs, sub, err := _ServiceProviderFactory.contract.FilterLogs(opts, "DecreaseStakeRequestEvaluated", _ownerRule, _decreaseAmountRule, _newStakeAmountRule)
	if err != nil {
		return nil, err
	}
	return &ServiceProviderFactoryDecreaseStakeRequestEvaluatedIterator{contract: _ServiceProviderFactory.contract, event: "DecreaseStakeRequestEvaluated", logs: logs, sub: sub}, nil
}

// WatchDecreaseStakeRequestEvaluated is a free log subscription operation binding the contract event 0x4fa1898c33227e9e35023440f0fa23fcb2dbf6d8a31c3b0f975c302e7f806bfa.
//
// Solidity: event DecreaseStakeRequestEvaluated(address indexed _owner, uint256 indexed _decreaseAmount, uint256 indexed _newStakeAmount)
func (_ServiceProviderFactory *ServiceProviderFactoryFilterer) WatchDecreaseStakeRequestEvaluated(opts *bind.WatchOpts, sink chan<- *ServiceProviderFactoryDecreaseStakeRequestEvaluated, _owner []common.Address, _decreaseAmount []*big.Int, _newStakeAmount []*big.Int) (event.Subscription, error) {

	var _ownerRule []interface{}
	for _, _ownerItem := range _owner {
		_ownerRule = append(_ownerRule, _ownerItem)
	}
	var _decreaseAmountRule []interface{}
	for _, _decreaseAmountItem := range _decreaseAmount {
		_decreaseAmountRule = append(_decreaseAmountRule, _decreaseAmountItem)
	}
	var _newStakeAmountRule []interface{}
	for _, _newStakeAmountItem := range _newStakeAmount {
		_newStakeAmountRule = append(_newStakeAmountRule, _newStakeAmountItem)
	}

	logs, sub, err := _ServiceProviderFactory.contract.WatchLogs(opts, "DecreaseStakeRequestEvaluated", _ownerRule, _decreaseAmountRule, _newStakeAmountRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(ServiceProviderFactoryDecreaseStakeRequestEvaluated)
				if err := _ServiceProviderFactory.contract.UnpackLog(event, "DecreaseStakeRequestEvaluated", log); err != nil {
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

// ParseDecreaseStakeRequestEvaluated is a log parse operation binding the contract event 0x4fa1898c33227e9e35023440f0fa23fcb2dbf6d8a31c3b0f975c302e7f806bfa.
//
// Solidity: event DecreaseStakeRequestEvaluated(address indexed _owner, uint256 indexed _decreaseAmount, uint256 indexed _newStakeAmount)
func (_ServiceProviderFactory *ServiceProviderFactoryFilterer) ParseDecreaseStakeRequestEvaluated(log types.Log) (*ServiceProviderFactoryDecreaseStakeRequestEvaluated, error) {
	event := new(ServiceProviderFactoryDecreaseStakeRequestEvaluated)
	if err := _ServiceProviderFactory.contract.UnpackLog(event, "DecreaseStakeRequestEvaluated", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// ServiceProviderFactoryDecreaseStakeRequestedIterator is returned from FilterDecreaseStakeRequested and is used to iterate over the raw logs and unpacked data for DecreaseStakeRequested events raised by the ServiceProviderFactory contract.
type ServiceProviderFactoryDecreaseStakeRequestedIterator struct {
	Event *ServiceProviderFactoryDecreaseStakeRequested // Event containing the contract specifics and raw log

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
func (it *ServiceProviderFactoryDecreaseStakeRequestedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(ServiceProviderFactoryDecreaseStakeRequested)
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
		it.Event = new(ServiceProviderFactoryDecreaseStakeRequested)
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
func (it *ServiceProviderFactoryDecreaseStakeRequestedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *ServiceProviderFactoryDecreaseStakeRequestedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// ServiceProviderFactoryDecreaseStakeRequested represents a DecreaseStakeRequested event raised by the ServiceProviderFactory contract.
type ServiceProviderFactoryDecreaseStakeRequested struct {
	Owner             common.Address
	DecreaseAmount    *big.Int
	LockupExpiryBlock *big.Int
	Raw               types.Log // Blockchain specific contextual infos
}

// FilterDecreaseStakeRequested is a free log retrieval operation binding the contract event 0x4416674e7d3d1bce767895146914b4d2efe964ac8e226c625738a058627903a2.
//
// Solidity: event DecreaseStakeRequested(address indexed _owner, uint256 indexed _decreaseAmount, uint256 indexed _lockupExpiryBlock)
func (_ServiceProviderFactory *ServiceProviderFactoryFilterer) FilterDecreaseStakeRequested(opts *bind.FilterOpts, _owner []common.Address, _decreaseAmount []*big.Int, _lockupExpiryBlock []*big.Int) (*ServiceProviderFactoryDecreaseStakeRequestedIterator, error) {

	var _ownerRule []interface{}
	for _, _ownerItem := range _owner {
		_ownerRule = append(_ownerRule, _ownerItem)
	}
	var _decreaseAmountRule []interface{}
	for _, _decreaseAmountItem := range _decreaseAmount {
		_decreaseAmountRule = append(_decreaseAmountRule, _decreaseAmountItem)
	}
	var _lockupExpiryBlockRule []interface{}
	for _, _lockupExpiryBlockItem := range _lockupExpiryBlock {
		_lockupExpiryBlockRule = append(_lockupExpiryBlockRule, _lockupExpiryBlockItem)
	}

	logs, sub, err := _ServiceProviderFactory.contract.FilterLogs(opts, "DecreaseStakeRequested", _ownerRule, _decreaseAmountRule, _lockupExpiryBlockRule)
	if err != nil {
		return nil, err
	}
	return &ServiceProviderFactoryDecreaseStakeRequestedIterator{contract: _ServiceProviderFactory.contract, event: "DecreaseStakeRequested", logs: logs, sub: sub}, nil
}

// WatchDecreaseStakeRequested is a free log subscription operation binding the contract event 0x4416674e7d3d1bce767895146914b4d2efe964ac8e226c625738a058627903a2.
//
// Solidity: event DecreaseStakeRequested(address indexed _owner, uint256 indexed _decreaseAmount, uint256 indexed _lockupExpiryBlock)
func (_ServiceProviderFactory *ServiceProviderFactoryFilterer) WatchDecreaseStakeRequested(opts *bind.WatchOpts, sink chan<- *ServiceProviderFactoryDecreaseStakeRequested, _owner []common.Address, _decreaseAmount []*big.Int, _lockupExpiryBlock []*big.Int) (event.Subscription, error) {

	var _ownerRule []interface{}
	for _, _ownerItem := range _owner {
		_ownerRule = append(_ownerRule, _ownerItem)
	}
	var _decreaseAmountRule []interface{}
	for _, _decreaseAmountItem := range _decreaseAmount {
		_decreaseAmountRule = append(_decreaseAmountRule, _decreaseAmountItem)
	}
	var _lockupExpiryBlockRule []interface{}
	for _, _lockupExpiryBlockItem := range _lockupExpiryBlock {
		_lockupExpiryBlockRule = append(_lockupExpiryBlockRule, _lockupExpiryBlockItem)
	}

	logs, sub, err := _ServiceProviderFactory.contract.WatchLogs(opts, "DecreaseStakeRequested", _ownerRule, _decreaseAmountRule, _lockupExpiryBlockRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(ServiceProviderFactoryDecreaseStakeRequested)
				if err := _ServiceProviderFactory.contract.UnpackLog(event, "DecreaseStakeRequested", log); err != nil {
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

// ParseDecreaseStakeRequested is a log parse operation binding the contract event 0x4416674e7d3d1bce767895146914b4d2efe964ac8e226c625738a058627903a2.
//
// Solidity: event DecreaseStakeRequested(address indexed _owner, uint256 indexed _decreaseAmount, uint256 indexed _lockupExpiryBlock)
func (_ServiceProviderFactory *ServiceProviderFactoryFilterer) ParseDecreaseStakeRequested(log types.Log) (*ServiceProviderFactoryDecreaseStakeRequested, error) {
	event := new(ServiceProviderFactoryDecreaseStakeRequested)
	if err := _ServiceProviderFactory.contract.UnpackLog(event, "DecreaseStakeRequested", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// ServiceProviderFactoryDelegateManagerAddressUpdatedIterator is returned from FilterDelegateManagerAddressUpdated and is used to iterate over the raw logs and unpacked data for DelegateManagerAddressUpdated events raised by the ServiceProviderFactory contract.
type ServiceProviderFactoryDelegateManagerAddressUpdatedIterator struct {
	Event *ServiceProviderFactoryDelegateManagerAddressUpdated // Event containing the contract specifics and raw log

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
func (it *ServiceProviderFactoryDelegateManagerAddressUpdatedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(ServiceProviderFactoryDelegateManagerAddressUpdated)
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
		it.Event = new(ServiceProviderFactoryDelegateManagerAddressUpdated)
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
func (it *ServiceProviderFactoryDelegateManagerAddressUpdatedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *ServiceProviderFactoryDelegateManagerAddressUpdatedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// ServiceProviderFactoryDelegateManagerAddressUpdated represents a DelegateManagerAddressUpdated event raised by the ServiceProviderFactory contract.
type ServiceProviderFactoryDelegateManagerAddressUpdated struct {
	NewDelegateManagerAddress common.Address
	Raw                       types.Log // Blockchain specific contextual infos
}

// FilterDelegateManagerAddressUpdated is a free log retrieval operation binding the contract event 0xc6f2f93d680d907c15617652a0861512922e68a2c4c4821732a8aa324ec541ea.
//
// Solidity: event DelegateManagerAddressUpdated(address indexed _newDelegateManagerAddress)
func (_ServiceProviderFactory *ServiceProviderFactoryFilterer) FilterDelegateManagerAddressUpdated(opts *bind.FilterOpts, _newDelegateManagerAddress []common.Address) (*ServiceProviderFactoryDelegateManagerAddressUpdatedIterator, error) {

	var _newDelegateManagerAddressRule []interface{}
	for _, _newDelegateManagerAddressItem := range _newDelegateManagerAddress {
		_newDelegateManagerAddressRule = append(_newDelegateManagerAddressRule, _newDelegateManagerAddressItem)
	}

	logs, sub, err := _ServiceProviderFactory.contract.FilterLogs(opts, "DelegateManagerAddressUpdated", _newDelegateManagerAddressRule)
	if err != nil {
		return nil, err
	}
	return &ServiceProviderFactoryDelegateManagerAddressUpdatedIterator{contract: _ServiceProviderFactory.contract, event: "DelegateManagerAddressUpdated", logs: logs, sub: sub}, nil
}

// WatchDelegateManagerAddressUpdated is a free log subscription operation binding the contract event 0xc6f2f93d680d907c15617652a0861512922e68a2c4c4821732a8aa324ec541ea.
//
// Solidity: event DelegateManagerAddressUpdated(address indexed _newDelegateManagerAddress)
func (_ServiceProviderFactory *ServiceProviderFactoryFilterer) WatchDelegateManagerAddressUpdated(opts *bind.WatchOpts, sink chan<- *ServiceProviderFactoryDelegateManagerAddressUpdated, _newDelegateManagerAddress []common.Address) (event.Subscription, error) {

	var _newDelegateManagerAddressRule []interface{}
	for _, _newDelegateManagerAddressItem := range _newDelegateManagerAddress {
		_newDelegateManagerAddressRule = append(_newDelegateManagerAddressRule, _newDelegateManagerAddressItem)
	}

	logs, sub, err := _ServiceProviderFactory.contract.WatchLogs(opts, "DelegateManagerAddressUpdated", _newDelegateManagerAddressRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(ServiceProviderFactoryDelegateManagerAddressUpdated)
				if err := _ServiceProviderFactory.contract.UnpackLog(event, "DelegateManagerAddressUpdated", log); err != nil {
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
func (_ServiceProviderFactory *ServiceProviderFactoryFilterer) ParseDelegateManagerAddressUpdated(log types.Log) (*ServiceProviderFactoryDelegateManagerAddressUpdated, error) {
	event := new(ServiceProviderFactoryDelegateManagerAddressUpdated)
	if err := _ServiceProviderFactory.contract.UnpackLog(event, "DelegateManagerAddressUpdated", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// ServiceProviderFactoryDelegateOwnerWalletUpdatedIterator is returned from FilterDelegateOwnerWalletUpdated and is used to iterate over the raw logs and unpacked data for DelegateOwnerWalletUpdated events raised by the ServiceProviderFactory contract.
type ServiceProviderFactoryDelegateOwnerWalletUpdatedIterator struct {
	Event *ServiceProviderFactoryDelegateOwnerWalletUpdated // Event containing the contract specifics and raw log

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
func (it *ServiceProviderFactoryDelegateOwnerWalletUpdatedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(ServiceProviderFactoryDelegateOwnerWalletUpdated)
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
		it.Event = new(ServiceProviderFactoryDelegateOwnerWalletUpdated)
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
func (it *ServiceProviderFactoryDelegateOwnerWalletUpdatedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *ServiceProviderFactoryDelegateOwnerWalletUpdatedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// ServiceProviderFactoryDelegateOwnerWalletUpdated represents a DelegateOwnerWalletUpdated event raised by the ServiceProviderFactory contract.
type ServiceProviderFactoryDelegateOwnerWalletUpdated struct {
	Owner         common.Address
	ServiceType   [32]byte
	SpID          *big.Int
	UpdatedWallet common.Address
	Raw           types.Log // Blockchain specific contextual infos
}

// FilterDelegateOwnerWalletUpdated is a free log retrieval operation binding the contract event 0xf7a7e9c74ac4e66767d51e4dff726cfb05a9a41710b2287ec56a6ca314dc82c0.
//
// Solidity: event DelegateOwnerWalletUpdated(address indexed _owner, bytes32 indexed _serviceType, uint256 indexed _spID, address _updatedWallet)
func (_ServiceProviderFactory *ServiceProviderFactoryFilterer) FilterDelegateOwnerWalletUpdated(opts *bind.FilterOpts, _owner []common.Address, _serviceType [][32]byte, _spID []*big.Int) (*ServiceProviderFactoryDelegateOwnerWalletUpdatedIterator, error) {

	var _ownerRule []interface{}
	for _, _ownerItem := range _owner {
		_ownerRule = append(_ownerRule, _ownerItem)
	}
	var _serviceTypeRule []interface{}
	for _, _serviceTypeItem := range _serviceType {
		_serviceTypeRule = append(_serviceTypeRule, _serviceTypeItem)
	}
	var _spIDRule []interface{}
	for _, _spIDItem := range _spID {
		_spIDRule = append(_spIDRule, _spIDItem)
	}

	logs, sub, err := _ServiceProviderFactory.contract.FilterLogs(opts, "DelegateOwnerWalletUpdated", _ownerRule, _serviceTypeRule, _spIDRule)
	if err != nil {
		return nil, err
	}
	return &ServiceProviderFactoryDelegateOwnerWalletUpdatedIterator{contract: _ServiceProviderFactory.contract, event: "DelegateOwnerWalletUpdated", logs: logs, sub: sub}, nil
}

// WatchDelegateOwnerWalletUpdated is a free log subscription operation binding the contract event 0xf7a7e9c74ac4e66767d51e4dff726cfb05a9a41710b2287ec56a6ca314dc82c0.
//
// Solidity: event DelegateOwnerWalletUpdated(address indexed _owner, bytes32 indexed _serviceType, uint256 indexed _spID, address _updatedWallet)
func (_ServiceProviderFactory *ServiceProviderFactoryFilterer) WatchDelegateOwnerWalletUpdated(opts *bind.WatchOpts, sink chan<- *ServiceProviderFactoryDelegateOwnerWalletUpdated, _owner []common.Address, _serviceType [][32]byte, _spID []*big.Int) (event.Subscription, error) {

	var _ownerRule []interface{}
	for _, _ownerItem := range _owner {
		_ownerRule = append(_ownerRule, _ownerItem)
	}
	var _serviceTypeRule []interface{}
	for _, _serviceTypeItem := range _serviceType {
		_serviceTypeRule = append(_serviceTypeRule, _serviceTypeItem)
	}
	var _spIDRule []interface{}
	for _, _spIDItem := range _spID {
		_spIDRule = append(_spIDRule, _spIDItem)
	}

	logs, sub, err := _ServiceProviderFactory.contract.WatchLogs(opts, "DelegateOwnerWalletUpdated", _ownerRule, _serviceTypeRule, _spIDRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(ServiceProviderFactoryDelegateOwnerWalletUpdated)
				if err := _ServiceProviderFactory.contract.UnpackLog(event, "DelegateOwnerWalletUpdated", log); err != nil {
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

// ParseDelegateOwnerWalletUpdated is a log parse operation binding the contract event 0xf7a7e9c74ac4e66767d51e4dff726cfb05a9a41710b2287ec56a6ca314dc82c0.
//
// Solidity: event DelegateOwnerWalletUpdated(address indexed _owner, bytes32 indexed _serviceType, uint256 indexed _spID, address _updatedWallet)
func (_ServiceProviderFactory *ServiceProviderFactoryFilterer) ParseDelegateOwnerWalletUpdated(log types.Log) (*ServiceProviderFactoryDelegateOwnerWalletUpdated, error) {
	event := new(ServiceProviderFactoryDelegateOwnerWalletUpdated)
	if err := _ServiceProviderFactory.contract.UnpackLog(event, "DelegateOwnerWalletUpdated", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// ServiceProviderFactoryDeployerCutUpdateRequestCancelledIterator is returned from FilterDeployerCutUpdateRequestCancelled and is used to iterate over the raw logs and unpacked data for DeployerCutUpdateRequestCancelled events raised by the ServiceProviderFactory contract.
type ServiceProviderFactoryDeployerCutUpdateRequestCancelledIterator struct {
	Event *ServiceProviderFactoryDeployerCutUpdateRequestCancelled // Event containing the contract specifics and raw log

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
func (it *ServiceProviderFactoryDeployerCutUpdateRequestCancelledIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(ServiceProviderFactoryDeployerCutUpdateRequestCancelled)
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
		it.Event = new(ServiceProviderFactoryDeployerCutUpdateRequestCancelled)
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
func (it *ServiceProviderFactoryDeployerCutUpdateRequestCancelledIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *ServiceProviderFactoryDeployerCutUpdateRequestCancelledIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// ServiceProviderFactoryDeployerCutUpdateRequestCancelled represents a DeployerCutUpdateRequestCancelled event raised by the ServiceProviderFactory contract.
type ServiceProviderFactoryDeployerCutUpdateRequestCancelled struct {
	Owner        common.Address
	RequestedCut *big.Int
	FinalCut     *big.Int
	Raw          types.Log // Blockchain specific contextual infos
}

// FilterDeployerCutUpdateRequestCancelled is a free log retrieval operation binding the contract event 0x13d9b8f24ffbc23445a81a777df068844fc14f5e3e6f4d0933644a2fb815c988.
//
// Solidity: event DeployerCutUpdateRequestCancelled(address indexed _owner, uint256 indexed _requestedCut, uint256 indexed _finalCut)
func (_ServiceProviderFactory *ServiceProviderFactoryFilterer) FilterDeployerCutUpdateRequestCancelled(opts *bind.FilterOpts, _owner []common.Address, _requestedCut []*big.Int, _finalCut []*big.Int) (*ServiceProviderFactoryDeployerCutUpdateRequestCancelledIterator, error) {

	var _ownerRule []interface{}
	for _, _ownerItem := range _owner {
		_ownerRule = append(_ownerRule, _ownerItem)
	}
	var _requestedCutRule []interface{}
	for _, _requestedCutItem := range _requestedCut {
		_requestedCutRule = append(_requestedCutRule, _requestedCutItem)
	}
	var _finalCutRule []interface{}
	for _, _finalCutItem := range _finalCut {
		_finalCutRule = append(_finalCutRule, _finalCutItem)
	}

	logs, sub, err := _ServiceProviderFactory.contract.FilterLogs(opts, "DeployerCutUpdateRequestCancelled", _ownerRule, _requestedCutRule, _finalCutRule)
	if err != nil {
		return nil, err
	}
	return &ServiceProviderFactoryDeployerCutUpdateRequestCancelledIterator{contract: _ServiceProviderFactory.contract, event: "DeployerCutUpdateRequestCancelled", logs: logs, sub: sub}, nil
}

// WatchDeployerCutUpdateRequestCancelled is a free log subscription operation binding the contract event 0x13d9b8f24ffbc23445a81a777df068844fc14f5e3e6f4d0933644a2fb815c988.
//
// Solidity: event DeployerCutUpdateRequestCancelled(address indexed _owner, uint256 indexed _requestedCut, uint256 indexed _finalCut)
func (_ServiceProviderFactory *ServiceProviderFactoryFilterer) WatchDeployerCutUpdateRequestCancelled(opts *bind.WatchOpts, sink chan<- *ServiceProviderFactoryDeployerCutUpdateRequestCancelled, _owner []common.Address, _requestedCut []*big.Int, _finalCut []*big.Int) (event.Subscription, error) {

	var _ownerRule []interface{}
	for _, _ownerItem := range _owner {
		_ownerRule = append(_ownerRule, _ownerItem)
	}
	var _requestedCutRule []interface{}
	for _, _requestedCutItem := range _requestedCut {
		_requestedCutRule = append(_requestedCutRule, _requestedCutItem)
	}
	var _finalCutRule []interface{}
	for _, _finalCutItem := range _finalCut {
		_finalCutRule = append(_finalCutRule, _finalCutItem)
	}

	logs, sub, err := _ServiceProviderFactory.contract.WatchLogs(opts, "DeployerCutUpdateRequestCancelled", _ownerRule, _requestedCutRule, _finalCutRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(ServiceProviderFactoryDeployerCutUpdateRequestCancelled)
				if err := _ServiceProviderFactory.contract.UnpackLog(event, "DeployerCutUpdateRequestCancelled", log); err != nil {
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

// ParseDeployerCutUpdateRequestCancelled is a log parse operation binding the contract event 0x13d9b8f24ffbc23445a81a777df068844fc14f5e3e6f4d0933644a2fb815c988.
//
// Solidity: event DeployerCutUpdateRequestCancelled(address indexed _owner, uint256 indexed _requestedCut, uint256 indexed _finalCut)
func (_ServiceProviderFactory *ServiceProviderFactoryFilterer) ParseDeployerCutUpdateRequestCancelled(log types.Log) (*ServiceProviderFactoryDeployerCutUpdateRequestCancelled, error) {
	event := new(ServiceProviderFactoryDeployerCutUpdateRequestCancelled)
	if err := _ServiceProviderFactory.contract.UnpackLog(event, "DeployerCutUpdateRequestCancelled", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// ServiceProviderFactoryDeployerCutUpdateRequestEvaluatedIterator is returned from FilterDeployerCutUpdateRequestEvaluated and is used to iterate over the raw logs and unpacked data for DeployerCutUpdateRequestEvaluated events raised by the ServiceProviderFactory contract.
type ServiceProviderFactoryDeployerCutUpdateRequestEvaluatedIterator struct {
	Event *ServiceProviderFactoryDeployerCutUpdateRequestEvaluated // Event containing the contract specifics and raw log

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
func (it *ServiceProviderFactoryDeployerCutUpdateRequestEvaluatedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(ServiceProviderFactoryDeployerCutUpdateRequestEvaluated)
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
		it.Event = new(ServiceProviderFactoryDeployerCutUpdateRequestEvaluated)
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
func (it *ServiceProviderFactoryDeployerCutUpdateRequestEvaluatedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *ServiceProviderFactoryDeployerCutUpdateRequestEvaluatedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// ServiceProviderFactoryDeployerCutUpdateRequestEvaluated represents a DeployerCutUpdateRequestEvaluated event raised by the ServiceProviderFactory contract.
type ServiceProviderFactoryDeployerCutUpdateRequestEvaluated struct {
	Owner      common.Address
	UpdatedCut *big.Int
	Raw        types.Log // Blockchain specific contextual infos
}

// FilterDeployerCutUpdateRequestEvaluated is a free log retrieval operation binding the contract event 0xf935666edb102c30bbfdd70149a3f000dca0deaacf126388ddcef0a8daea0854.
//
// Solidity: event DeployerCutUpdateRequestEvaluated(address indexed _owner, uint256 indexed _updatedCut)
func (_ServiceProviderFactory *ServiceProviderFactoryFilterer) FilterDeployerCutUpdateRequestEvaluated(opts *bind.FilterOpts, _owner []common.Address, _updatedCut []*big.Int) (*ServiceProviderFactoryDeployerCutUpdateRequestEvaluatedIterator, error) {

	var _ownerRule []interface{}
	for _, _ownerItem := range _owner {
		_ownerRule = append(_ownerRule, _ownerItem)
	}
	var _updatedCutRule []interface{}
	for _, _updatedCutItem := range _updatedCut {
		_updatedCutRule = append(_updatedCutRule, _updatedCutItem)
	}

	logs, sub, err := _ServiceProviderFactory.contract.FilterLogs(opts, "DeployerCutUpdateRequestEvaluated", _ownerRule, _updatedCutRule)
	if err != nil {
		return nil, err
	}
	return &ServiceProviderFactoryDeployerCutUpdateRequestEvaluatedIterator{contract: _ServiceProviderFactory.contract, event: "DeployerCutUpdateRequestEvaluated", logs: logs, sub: sub}, nil
}

// WatchDeployerCutUpdateRequestEvaluated is a free log subscription operation binding the contract event 0xf935666edb102c30bbfdd70149a3f000dca0deaacf126388ddcef0a8daea0854.
//
// Solidity: event DeployerCutUpdateRequestEvaluated(address indexed _owner, uint256 indexed _updatedCut)
func (_ServiceProviderFactory *ServiceProviderFactoryFilterer) WatchDeployerCutUpdateRequestEvaluated(opts *bind.WatchOpts, sink chan<- *ServiceProviderFactoryDeployerCutUpdateRequestEvaluated, _owner []common.Address, _updatedCut []*big.Int) (event.Subscription, error) {

	var _ownerRule []interface{}
	for _, _ownerItem := range _owner {
		_ownerRule = append(_ownerRule, _ownerItem)
	}
	var _updatedCutRule []interface{}
	for _, _updatedCutItem := range _updatedCut {
		_updatedCutRule = append(_updatedCutRule, _updatedCutItem)
	}

	logs, sub, err := _ServiceProviderFactory.contract.WatchLogs(opts, "DeployerCutUpdateRequestEvaluated", _ownerRule, _updatedCutRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(ServiceProviderFactoryDeployerCutUpdateRequestEvaluated)
				if err := _ServiceProviderFactory.contract.UnpackLog(event, "DeployerCutUpdateRequestEvaluated", log); err != nil {
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

// ParseDeployerCutUpdateRequestEvaluated is a log parse operation binding the contract event 0xf935666edb102c30bbfdd70149a3f000dca0deaacf126388ddcef0a8daea0854.
//
// Solidity: event DeployerCutUpdateRequestEvaluated(address indexed _owner, uint256 indexed _updatedCut)
func (_ServiceProviderFactory *ServiceProviderFactoryFilterer) ParseDeployerCutUpdateRequestEvaluated(log types.Log) (*ServiceProviderFactoryDeployerCutUpdateRequestEvaluated, error) {
	event := new(ServiceProviderFactoryDeployerCutUpdateRequestEvaluated)
	if err := _ServiceProviderFactory.contract.UnpackLog(event, "DeployerCutUpdateRequestEvaluated", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// ServiceProviderFactoryDeployerCutUpdateRequestedIterator is returned from FilterDeployerCutUpdateRequested and is used to iterate over the raw logs and unpacked data for DeployerCutUpdateRequested events raised by the ServiceProviderFactory contract.
type ServiceProviderFactoryDeployerCutUpdateRequestedIterator struct {
	Event *ServiceProviderFactoryDeployerCutUpdateRequested // Event containing the contract specifics and raw log

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
func (it *ServiceProviderFactoryDeployerCutUpdateRequestedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(ServiceProviderFactoryDeployerCutUpdateRequested)
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
		it.Event = new(ServiceProviderFactoryDeployerCutUpdateRequested)
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
func (it *ServiceProviderFactoryDeployerCutUpdateRequestedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *ServiceProviderFactoryDeployerCutUpdateRequestedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// ServiceProviderFactoryDeployerCutUpdateRequested represents a DeployerCutUpdateRequested event raised by the ServiceProviderFactory contract.
type ServiceProviderFactoryDeployerCutUpdateRequested struct {
	Owner             common.Address
	UpdatedCut        *big.Int
	LockupExpiryBlock *big.Int
	Raw               types.Log // Blockchain specific contextual infos
}

// FilterDeployerCutUpdateRequested is a free log retrieval operation binding the contract event 0xb4a78f19d28347c475e23b6b1cd903845fe48733cc9fda8e1c47241e71271848.
//
// Solidity: event DeployerCutUpdateRequested(address indexed _owner, uint256 indexed _updatedCut, uint256 indexed _lockupExpiryBlock)
func (_ServiceProviderFactory *ServiceProviderFactoryFilterer) FilterDeployerCutUpdateRequested(opts *bind.FilterOpts, _owner []common.Address, _updatedCut []*big.Int, _lockupExpiryBlock []*big.Int) (*ServiceProviderFactoryDeployerCutUpdateRequestedIterator, error) {

	var _ownerRule []interface{}
	for _, _ownerItem := range _owner {
		_ownerRule = append(_ownerRule, _ownerItem)
	}
	var _updatedCutRule []interface{}
	for _, _updatedCutItem := range _updatedCut {
		_updatedCutRule = append(_updatedCutRule, _updatedCutItem)
	}
	var _lockupExpiryBlockRule []interface{}
	for _, _lockupExpiryBlockItem := range _lockupExpiryBlock {
		_lockupExpiryBlockRule = append(_lockupExpiryBlockRule, _lockupExpiryBlockItem)
	}

	logs, sub, err := _ServiceProviderFactory.contract.FilterLogs(opts, "DeployerCutUpdateRequested", _ownerRule, _updatedCutRule, _lockupExpiryBlockRule)
	if err != nil {
		return nil, err
	}
	return &ServiceProviderFactoryDeployerCutUpdateRequestedIterator{contract: _ServiceProviderFactory.contract, event: "DeployerCutUpdateRequested", logs: logs, sub: sub}, nil
}

// WatchDeployerCutUpdateRequested is a free log subscription operation binding the contract event 0xb4a78f19d28347c475e23b6b1cd903845fe48733cc9fda8e1c47241e71271848.
//
// Solidity: event DeployerCutUpdateRequested(address indexed _owner, uint256 indexed _updatedCut, uint256 indexed _lockupExpiryBlock)
func (_ServiceProviderFactory *ServiceProviderFactoryFilterer) WatchDeployerCutUpdateRequested(opts *bind.WatchOpts, sink chan<- *ServiceProviderFactoryDeployerCutUpdateRequested, _owner []common.Address, _updatedCut []*big.Int, _lockupExpiryBlock []*big.Int) (event.Subscription, error) {

	var _ownerRule []interface{}
	for _, _ownerItem := range _owner {
		_ownerRule = append(_ownerRule, _ownerItem)
	}
	var _updatedCutRule []interface{}
	for _, _updatedCutItem := range _updatedCut {
		_updatedCutRule = append(_updatedCutRule, _updatedCutItem)
	}
	var _lockupExpiryBlockRule []interface{}
	for _, _lockupExpiryBlockItem := range _lockupExpiryBlock {
		_lockupExpiryBlockRule = append(_lockupExpiryBlockRule, _lockupExpiryBlockItem)
	}

	logs, sub, err := _ServiceProviderFactory.contract.WatchLogs(opts, "DeployerCutUpdateRequested", _ownerRule, _updatedCutRule, _lockupExpiryBlockRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(ServiceProviderFactoryDeployerCutUpdateRequested)
				if err := _ServiceProviderFactory.contract.UnpackLog(event, "DeployerCutUpdateRequested", log); err != nil {
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

// ParseDeployerCutUpdateRequested is a log parse operation binding the contract event 0xb4a78f19d28347c475e23b6b1cd903845fe48733cc9fda8e1c47241e71271848.
//
// Solidity: event DeployerCutUpdateRequested(address indexed _owner, uint256 indexed _updatedCut, uint256 indexed _lockupExpiryBlock)
func (_ServiceProviderFactory *ServiceProviderFactoryFilterer) ParseDeployerCutUpdateRequested(log types.Log) (*ServiceProviderFactoryDeployerCutUpdateRequested, error) {
	event := new(ServiceProviderFactoryDeployerCutUpdateRequested)
	if err := _ServiceProviderFactory.contract.UnpackLog(event, "DeployerCutUpdateRequested", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// ServiceProviderFactoryDeregisteredServiceProviderIterator is returned from FilterDeregisteredServiceProvider and is used to iterate over the raw logs and unpacked data for DeregisteredServiceProvider events raised by the ServiceProviderFactory contract.
type ServiceProviderFactoryDeregisteredServiceProviderIterator struct {
	Event *ServiceProviderFactoryDeregisteredServiceProvider // Event containing the contract specifics and raw log

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
func (it *ServiceProviderFactoryDeregisteredServiceProviderIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(ServiceProviderFactoryDeregisteredServiceProvider)
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
		it.Event = new(ServiceProviderFactoryDeregisteredServiceProvider)
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
func (it *ServiceProviderFactoryDeregisteredServiceProviderIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *ServiceProviderFactoryDeregisteredServiceProviderIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// ServiceProviderFactoryDeregisteredServiceProvider represents a DeregisteredServiceProvider event raised by the ServiceProviderFactory contract.
type ServiceProviderFactoryDeregisteredServiceProvider struct {
	SpID          *big.Int
	ServiceType   [32]byte
	Owner         common.Address
	Endpoint      string
	UnstakeAmount *big.Int
	Raw           types.Log // Blockchain specific contextual infos
}

// FilterDeregisteredServiceProvider is a free log retrieval operation binding the contract event 0x4b8bf251858c5cb19e132cd9a354e12ccae21f47bf38534fd03b2708c0fba5a4.
//
// Solidity: event DeregisteredServiceProvider(uint256 indexed _spID, bytes32 indexed _serviceType, address indexed _owner, string _endpoint, uint256 _unstakeAmount)
func (_ServiceProviderFactory *ServiceProviderFactoryFilterer) FilterDeregisteredServiceProvider(opts *bind.FilterOpts, _spID []*big.Int, _serviceType [][32]byte, _owner []common.Address) (*ServiceProviderFactoryDeregisteredServiceProviderIterator, error) {

	var _spIDRule []interface{}
	for _, _spIDItem := range _spID {
		_spIDRule = append(_spIDRule, _spIDItem)
	}
	var _serviceTypeRule []interface{}
	for _, _serviceTypeItem := range _serviceType {
		_serviceTypeRule = append(_serviceTypeRule, _serviceTypeItem)
	}
	var _ownerRule []interface{}
	for _, _ownerItem := range _owner {
		_ownerRule = append(_ownerRule, _ownerItem)
	}

	logs, sub, err := _ServiceProviderFactory.contract.FilterLogs(opts, "DeregisteredServiceProvider", _spIDRule, _serviceTypeRule, _ownerRule)
	if err != nil {
		return nil, err
	}
	return &ServiceProviderFactoryDeregisteredServiceProviderIterator{contract: _ServiceProviderFactory.contract, event: "DeregisteredServiceProvider", logs: logs, sub: sub}, nil
}

// WatchDeregisteredServiceProvider is a free log subscription operation binding the contract event 0x4b8bf251858c5cb19e132cd9a354e12ccae21f47bf38534fd03b2708c0fba5a4.
//
// Solidity: event DeregisteredServiceProvider(uint256 indexed _spID, bytes32 indexed _serviceType, address indexed _owner, string _endpoint, uint256 _unstakeAmount)
func (_ServiceProviderFactory *ServiceProviderFactoryFilterer) WatchDeregisteredServiceProvider(opts *bind.WatchOpts, sink chan<- *ServiceProviderFactoryDeregisteredServiceProvider, _spID []*big.Int, _serviceType [][32]byte, _owner []common.Address) (event.Subscription, error) {

	var _spIDRule []interface{}
	for _, _spIDItem := range _spID {
		_spIDRule = append(_spIDRule, _spIDItem)
	}
	var _serviceTypeRule []interface{}
	for _, _serviceTypeItem := range _serviceType {
		_serviceTypeRule = append(_serviceTypeRule, _serviceTypeItem)
	}
	var _ownerRule []interface{}
	for _, _ownerItem := range _owner {
		_ownerRule = append(_ownerRule, _ownerItem)
	}

	logs, sub, err := _ServiceProviderFactory.contract.WatchLogs(opts, "DeregisteredServiceProvider", _spIDRule, _serviceTypeRule, _ownerRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(ServiceProviderFactoryDeregisteredServiceProvider)
				if err := _ServiceProviderFactory.contract.UnpackLog(event, "DeregisteredServiceProvider", log); err != nil {
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

// ParseDeregisteredServiceProvider is a log parse operation binding the contract event 0x4b8bf251858c5cb19e132cd9a354e12ccae21f47bf38534fd03b2708c0fba5a4.
//
// Solidity: event DeregisteredServiceProvider(uint256 indexed _spID, bytes32 indexed _serviceType, address indexed _owner, string _endpoint, uint256 _unstakeAmount)
func (_ServiceProviderFactory *ServiceProviderFactoryFilterer) ParseDeregisteredServiceProvider(log types.Log) (*ServiceProviderFactoryDeregisteredServiceProvider, error) {
	event := new(ServiceProviderFactoryDeregisteredServiceProvider)
	if err := _ServiceProviderFactory.contract.UnpackLog(event, "DeregisteredServiceProvider", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// ServiceProviderFactoryEndpointUpdatedIterator is returned from FilterEndpointUpdated and is used to iterate over the raw logs and unpacked data for EndpointUpdated events raised by the ServiceProviderFactory contract.
type ServiceProviderFactoryEndpointUpdatedIterator struct {
	Event *ServiceProviderFactoryEndpointUpdated // Event containing the contract specifics and raw log

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
func (it *ServiceProviderFactoryEndpointUpdatedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(ServiceProviderFactoryEndpointUpdated)
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
		it.Event = new(ServiceProviderFactoryEndpointUpdated)
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
func (it *ServiceProviderFactoryEndpointUpdatedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *ServiceProviderFactoryEndpointUpdatedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// ServiceProviderFactoryEndpointUpdated represents a EndpointUpdated event raised by the ServiceProviderFactory contract.
type ServiceProviderFactoryEndpointUpdated struct {
	ServiceType [32]byte
	Owner       common.Address
	OldEndpoint string
	NewEndpoint string
	SpID        *big.Int
	Raw         types.Log // Blockchain specific contextual infos
}

// FilterEndpointUpdated is a free log retrieval operation binding the contract event 0x7533010434d2066fea01bb712667c69a370a5c6c20813690fa6ddbc1f9fc059f.
//
// Solidity: event EndpointUpdated(bytes32 indexed _serviceType, address indexed _owner, string _oldEndpoint, string _newEndpoint, uint256 indexed _spID)
func (_ServiceProviderFactory *ServiceProviderFactoryFilterer) FilterEndpointUpdated(opts *bind.FilterOpts, _serviceType [][32]byte, _owner []common.Address, _spID []*big.Int) (*ServiceProviderFactoryEndpointUpdatedIterator, error) {

	var _serviceTypeRule []interface{}
	for _, _serviceTypeItem := range _serviceType {
		_serviceTypeRule = append(_serviceTypeRule, _serviceTypeItem)
	}
	var _ownerRule []interface{}
	for _, _ownerItem := range _owner {
		_ownerRule = append(_ownerRule, _ownerItem)
	}

	var _spIDRule []interface{}
	for _, _spIDItem := range _spID {
		_spIDRule = append(_spIDRule, _spIDItem)
	}

	logs, sub, err := _ServiceProviderFactory.contract.FilterLogs(opts, "EndpointUpdated", _serviceTypeRule, _ownerRule, _spIDRule)
	if err != nil {
		return nil, err
	}
	return &ServiceProviderFactoryEndpointUpdatedIterator{contract: _ServiceProviderFactory.contract, event: "EndpointUpdated", logs: logs, sub: sub}, nil
}

// WatchEndpointUpdated is a free log subscription operation binding the contract event 0x7533010434d2066fea01bb712667c69a370a5c6c20813690fa6ddbc1f9fc059f.
//
// Solidity: event EndpointUpdated(bytes32 indexed _serviceType, address indexed _owner, string _oldEndpoint, string _newEndpoint, uint256 indexed _spID)
func (_ServiceProviderFactory *ServiceProviderFactoryFilterer) WatchEndpointUpdated(opts *bind.WatchOpts, sink chan<- *ServiceProviderFactoryEndpointUpdated, _serviceType [][32]byte, _owner []common.Address, _spID []*big.Int) (event.Subscription, error) {

	var _serviceTypeRule []interface{}
	for _, _serviceTypeItem := range _serviceType {
		_serviceTypeRule = append(_serviceTypeRule, _serviceTypeItem)
	}
	var _ownerRule []interface{}
	for _, _ownerItem := range _owner {
		_ownerRule = append(_ownerRule, _ownerItem)
	}

	var _spIDRule []interface{}
	for _, _spIDItem := range _spID {
		_spIDRule = append(_spIDRule, _spIDItem)
	}

	logs, sub, err := _ServiceProviderFactory.contract.WatchLogs(opts, "EndpointUpdated", _serviceTypeRule, _ownerRule, _spIDRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(ServiceProviderFactoryEndpointUpdated)
				if err := _ServiceProviderFactory.contract.UnpackLog(event, "EndpointUpdated", log); err != nil {
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

// ParseEndpointUpdated is a log parse operation binding the contract event 0x7533010434d2066fea01bb712667c69a370a5c6c20813690fa6ddbc1f9fc059f.
//
// Solidity: event EndpointUpdated(bytes32 indexed _serviceType, address indexed _owner, string _oldEndpoint, string _newEndpoint, uint256 indexed _spID)
func (_ServiceProviderFactory *ServiceProviderFactoryFilterer) ParseEndpointUpdated(log types.Log) (*ServiceProviderFactoryEndpointUpdated, error) {
	event := new(ServiceProviderFactoryEndpointUpdated)
	if err := _ServiceProviderFactory.contract.UnpackLog(event, "EndpointUpdated", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// ServiceProviderFactoryGovernanceAddressUpdatedIterator is returned from FilterGovernanceAddressUpdated and is used to iterate over the raw logs and unpacked data for GovernanceAddressUpdated events raised by the ServiceProviderFactory contract.
type ServiceProviderFactoryGovernanceAddressUpdatedIterator struct {
	Event *ServiceProviderFactoryGovernanceAddressUpdated // Event containing the contract specifics and raw log

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
func (it *ServiceProviderFactoryGovernanceAddressUpdatedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(ServiceProviderFactoryGovernanceAddressUpdated)
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
		it.Event = new(ServiceProviderFactoryGovernanceAddressUpdated)
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
func (it *ServiceProviderFactoryGovernanceAddressUpdatedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *ServiceProviderFactoryGovernanceAddressUpdatedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// ServiceProviderFactoryGovernanceAddressUpdated represents a GovernanceAddressUpdated event raised by the ServiceProviderFactory contract.
type ServiceProviderFactoryGovernanceAddressUpdated struct {
	NewGovernanceAddress common.Address
	Raw                  types.Log // Blockchain specific contextual infos
}

// FilterGovernanceAddressUpdated is a free log retrieval operation binding the contract event 0xd0e77a42021adb46a85dc0dbcdd75417f2042ed5c51474cb43a25ce0f1049a1e.
//
// Solidity: event GovernanceAddressUpdated(address indexed _newGovernanceAddress)
func (_ServiceProviderFactory *ServiceProviderFactoryFilterer) FilterGovernanceAddressUpdated(opts *bind.FilterOpts, _newGovernanceAddress []common.Address) (*ServiceProviderFactoryGovernanceAddressUpdatedIterator, error) {

	var _newGovernanceAddressRule []interface{}
	for _, _newGovernanceAddressItem := range _newGovernanceAddress {
		_newGovernanceAddressRule = append(_newGovernanceAddressRule, _newGovernanceAddressItem)
	}

	logs, sub, err := _ServiceProviderFactory.contract.FilterLogs(opts, "GovernanceAddressUpdated", _newGovernanceAddressRule)
	if err != nil {
		return nil, err
	}
	return &ServiceProviderFactoryGovernanceAddressUpdatedIterator{contract: _ServiceProviderFactory.contract, event: "GovernanceAddressUpdated", logs: logs, sub: sub}, nil
}

// WatchGovernanceAddressUpdated is a free log subscription operation binding the contract event 0xd0e77a42021adb46a85dc0dbcdd75417f2042ed5c51474cb43a25ce0f1049a1e.
//
// Solidity: event GovernanceAddressUpdated(address indexed _newGovernanceAddress)
func (_ServiceProviderFactory *ServiceProviderFactoryFilterer) WatchGovernanceAddressUpdated(opts *bind.WatchOpts, sink chan<- *ServiceProviderFactoryGovernanceAddressUpdated, _newGovernanceAddress []common.Address) (event.Subscription, error) {

	var _newGovernanceAddressRule []interface{}
	for _, _newGovernanceAddressItem := range _newGovernanceAddress {
		_newGovernanceAddressRule = append(_newGovernanceAddressRule, _newGovernanceAddressItem)
	}

	logs, sub, err := _ServiceProviderFactory.contract.WatchLogs(opts, "GovernanceAddressUpdated", _newGovernanceAddressRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(ServiceProviderFactoryGovernanceAddressUpdated)
				if err := _ServiceProviderFactory.contract.UnpackLog(event, "GovernanceAddressUpdated", log); err != nil {
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
func (_ServiceProviderFactory *ServiceProviderFactoryFilterer) ParseGovernanceAddressUpdated(log types.Log) (*ServiceProviderFactoryGovernanceAddressUpdated, error) {
	event := new(ServiceProviderFactoryGovernanceAddressUpdated)
	if err := _ServiceProviderFactory.contract.UnpackLog(event, "GovernanceAddressUpdated", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// ServiceProviderFactoryIncreasedStakeIterator is returned from FilterIncreasedStake and is used to iterate over the raw logs and unpacked data for IncreasedStake events raised by the ServiceProviderFactory contract.
type ServiceProviderFactoryIncreasedStakeIterator struct {
	Event *ServiceProviderFactoryIncreasedStake // Event containing the contract specifics and raw log

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
func (it *ServiceProviderFactoryIncreasedStakeIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(ServiceProviderFactoryIncreasedStake)
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
		it.Event = new(ServiceProviderFactoryIncreasedStake)
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
func (it *ServiceProviderFactoryIncreasedStakeIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *ServiceProviderFactoryIncreasedStakeIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// ServiceProviderFactoryIncreasedStake represents a IncreasedStake event raised by the ServiceProviderFactory contract.
type ServiceProviderFactoryIncreasedStake struct {
	Owner          common.Address
	IncreaseAmount *big.Int
	NewStakeAmount *big.Int
	Raw            types.Log // Blockchain specific contextual infos
}

// FilterIncreasedStake is a free log retrieval operation binding the contract event 0x6eb0fb3dc7f27147f8688c17c909de0e4f661c9a7349ae9166a6cce7aeeee5df.
//
// Solidity: event IncreasedStake(address indexed _owner, uint256 indexed _increaseAmount, uint256 indexed _newStakeAmount)
func (_ServiceProviderFactory *ServiceProviderFactoryFilterer) FilterIncreasedStake(opts *bind.FilterOpts, _owner []common.Address, _increaseAmount []*big.Int, _newStakeAmount []*big.Int) (*ServiceProviderFactoryIncreasedStakeIterator, error) {

	var _ownerRule []interface{}
	for _, _ownerItem := range _owner {
		_ownerRule = append(_ownerRule, _ownerItem)
	}
	var _increaseAmountRule []interface{}
	for _, _increaseAmountItem := range _increaseAmount {
		_increaseAmountRule = append(_increaseAmountRule, _increaseAmountItem)
	}
	var _newStakeAmountRule []interface{}
	for _, _newStakeAmountItem := range _newStakeAmount {
		_newStakeAmountRule = append(_newStakeAmountRule, _newStakeAmountItem)
	}

	logs, sub, err := _ServiceProviderFactory.contract.FilterLogs(opts, "IncreasedStake", _ownerRule, _increaseAmountRule, _newStakeAmountRule)
	if err != nil {
		return nil, err
	}
	return &ServiceProviderFactoryIncreasedStakeIterator{contract: _ServiceProviderFactory.contract, event: "IncreasedStake", logs: logs, sub: sub}, nil
}

// WatchIncreasedStake is a free log subscription operation binding the contract event 0x6eb0fb3dc7f27147f8688c17c909de0e4f661c9a7349ae9166a6cce7aeeee5df.
//
// Solidity: event IncreasedStake(address indexed _owner, uint256 indexed _increaseAmount, uint256 indexed _newStakeAmount)
func (_ServiceProviderFactory *ServiceProviderFactoryFilterer) WatchIncreasedStake(opts *bind.WatchOpts, sink chan<- *ServiceProviderFactoryIncreasedStake, _owner []common.Address, _increaseAmount []*big.Int, _newStakeAmount []*big.Int) (event.Subscription, error) {

	var _ownerRule []interface{}
	for _, _ownerItem := range _owner {
		_ownerRule = append(_ownerRule, _ownerItem)
	}
	var _increaseAmountRule []interface{}
	for _, _increaseAmountItem := range _increaseAmount {
		_increaseAmountRule = append(_increaseAmountRule, _increaseAmountItem)
	}
	var _newStakeAmountRule []interface{}
	for _, _newStakeAmountItem := range _newStakeAmount {
		_newStakeAmountRule = append(_newStakeAmountRule, _newStakeAmountItem)
	}

	logs, sub, err := _ServiceProviderFactory.contract.WatchLogs(opts, "IncreasedStake", _ownerRule, _increaseAmountRule, _newStakeAmountRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(ServiceProviderFactoryIncreasedStake)
				if err := _ServiceProviderFactory.contract.UnpackLog(event, "IncreasedStake", log); err != nil {
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

// ParseIncreasedStake is a log parse operation binding the contract event 0x6eb0fb3dc7f27147f8688c17c909de0e4f661c9a7349ae9166a6cce7aeeee5df.
//
// Solidity: event IncreasedStake(address indexed _owner, uint256 indexed _increaseAmount, uint256 indexed _newStakeAmount)
func (_ServiceProviderFactory *ServiceProviderFactoryFilterer) ParseIncreasedStake(log types.Log) (*ServiceProviderFactoryIncreasedStake, error) {
	event := new(ServiceProviderFactoryIncreasedStake)
	if err := _ServiceProviderFactory.contract.UnpackLog(event, "IncreasedStake", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// ServiceProviderFactoryRegisteredServiceProviderIterator is returned from FilterRegisteredServiceProvider and is used to iterate over the raw logs and unpacked data for RegisteredServiceProvider events raised by the ServiceProviderFactory contract.
type ServiceProviderFactoryRegisteredServiceProviderIterator struct {
	Event *ServiceProviderFactoryRegisteredServiceProvider // Event containing the contract specifics and raw log

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
func (it *ServiceProviderFactoryRegisteredServiceProviderIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(ServiceProviderFactoryRegisteredServiceProvider)
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
		it.Event = new(ServiceProviderFactoryRegisteredServiceProvider)
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
func (it *ServiceProviderFactoryRegisteredServiceProviderIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *ServiceProviderFactoryRegisteredServiceProviderIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// ServiceProviderFactoryRegisteredServiceProvider represents a RegisteredServiceProvider event raised by the ServiceProviderFactory contract.
type ServiceProviderFactoryRegisteredServiceProvider struct {
	SpID        *big.Int
	ServiceType [32]byte
	Owner       common.Address
	Endpoint    string
	StakeAmount *big.Int
	Raw         types.Log // Blockchain specific contextual infos
}

// FilterRegisteredServiceProvider is a free log retrieval operation binding the contract event 0xda2823651979534b78c11c1fd32e8a90ecd0f8f98a8648a8f78fb12d01765c6d.
//
// Solidity: event RegisteredServiceProvider(uint256 indexed _spID, bytes32 indexed _serviceType, address indexed _owner, string _endpoint, uint256 _stakeAmount)
func (_ServiceProviderFactory *ServiceProviderFactoryFilterer) FilterRegisteredServiceProvider(opts *bind.FilterOpts, _spID []*big.Int, _serviceType [][32]byte, _owner []common.Address) (*ServiceProviderFactoryRegisteredServiceProviderIterator, error) {

	var _spIDRule []interface{}
	for _, _spIDItem := range _spID {
		_spIDRule = append(_spIDRule, _spIDItem)
	}
	var _serviceTypeRule []interface{}
	for _, _serviceTypeItem := range _serviceType {
		_serviceTypeRule = append(_serviceTypeRule, _serviceTypeItem)
	}
	var _ownerRule []interface{}
	for _, _ownerItem := range _owner {
		_ownerRule = append(_ownerRule, _ownerItem)
	}

	logs, sub, err := _ServiceProviderFactory.contract.FilterLogs(opts, "RegisteredServiceProvider", _spIDRule, _serviceTypeRule, _ownerRule)
	if err != nil {
		return nil, err
	}
	return &ServiceProviderFactoryRegisteredServiceProviderIterator{contract: _ServiceProviderFactory.contract, event: "RegisteredServiceProvider", logs: logs, sub: sub}, nil
}

// WatchRegisteredServiceProvider is a free log subscription operation binding the contract event 0xda2823651979534b78c11c1fd32e8a90ecd0f8f98a8648a8f78fb12d01765c6d.
//
// Solidity: event RegisteredServiceProvider(uint256 indexed _spID, bytes32 indexed _serviceType, address indexed _owner, string _endpoint, uint256 _stakeAmount)
func (_ServiceProviderFactory *ServiceProviderFactoryFilterer) WatchRegisteredServiceProvider(opts *bind.WatchOpts, sink chan<- *ServiceProviderFactoryRegisteredServiceProvider, _spID []*big.Int, _serviceType [][32]byte, _owner []common.Address) (event.Subscription, error) {

	var _spIDRule []interface{}
	for _, _spIDItem := range _spID {
		_spIDRule = append(_spIDRule, _spIDItem)
	}
	var _serviceTypeRule []interface{}
	for _, _serviceTypeItem := range _serviceType {
		_serviceTypeRule = append(_serviceTypeRule, _serviceTypeItem)
	}
	var _ownerRule []interface{}
	for _, _ownerItem := range _owner {
		_ownerRule = append(_ownerRule, _ownerItem)
	}

	logs, sub, err := _ServiceProviderFactory.contract.WatchLogs(opts, "RegisteredServiceProvider", _spIDRule, _serviceTypeRule, _ownerRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(ServiceProviderFactoryRegisteredServiceProvider)
				if err := _ServiceProviderFactory.contract.UnpackLog(event, "RegisteredServiceProvider", log); err != nil {
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

// ParseRegisteredServiceProvider is a log parse operation binding the contract event 0xda2823651979534b78c11c1fd32e8a90ecd0f8f98a8648a8f78fb12d01765c6d.
//
// Solidity: event RegisteredServiceProvider(uint256 indexed _spID, bytes32 indexed _serviceType, address indexed _owner, string _endpoint, uint256 _stakeAmount)
func (_ServiceProviderFactory *ServiceProviderFactoryFilterer) ParseRegisteredServiceProvider(log types.Log) (*ServiceProviderFactoryRegisteredServiceProvider, error) {
	event := new(ServiceProviderFactoryRegisteredServiceProvider)
	if err := _ServiceProviderFactory.contract.UnpackLog(event, "RegisteredServiceProvider", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// ServiceProviderFactoryServiceTypeManagerAddressUpdatedIterator is returned from FilterServiceTypeManagerAddressUpdated and is used to iterate over the raw logs and unpacked data for ServiceTypeManagerAddressUpdated events raised by the ServiceProviderFactory contract.
type ServiceProviderFactoryServiceTypeManagerAddressUpdatedIterator struct {
	Event *ServiceProviderFactoryServiceTypeManagerAddressUpdated // Event containing the contract specifics and raw log

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
func (it *ServiceProviderFactoryServiceTypeManagerAddressUpdatedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(ServiceProviderFactoryServiceTypeManagerAddressUpdated)
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
		it.Event = new(ServiceProviderFactoryServiceTypeManagerAddressUpdated)
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
func (it *ServiceProviderFactoryServiceTypeManagerAddressUpdatedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *ServiceProviderFactoryServiceTypeManagerAddressUpdatedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// ServiceProviderFactoryServiceTypeManagerAddressUpdated represents a ServiceTypeManagerAddressUpdated event raised by the ServiceProviderFactory contract.
type ServiceProviderFactoryServiceTypeManagerAddressUpdated struct {
	NewServiceTypeManagerAddress common.Address
	Raw                          types.Log // Blockchain specific contextual infos
}

// FilterServiceTypeManagerAddressUpdated is a free log retrieval operation binding the contract event 0x974dd22d9c68e24879e45eea1873ba5c4cc1957464d5e7c29a41a3c2418bb10c.
//
// Solidity: event ServiceTypeManagerAddressUpdated(address indexed _newServiceTypeManagerAddress)
func (_ServiceProviderFactory *ServiceProviderFactoryFilterer) FilterServiceTypeManagerAddressUpdated(opts *bind.FilterOpts, _newServiceTypeManagerAddress []common.Address) (*ServiceProviderFactoryServiceTypeManagerAddressUpdatedIterator, error) {

	var _newServiceTypeManagerAddressRule []interface{}
	for _, _newServiceTypeManagerAddressItem := range _newServiceTypeManagerAddress {
		_newServiceTypeManagerAddressRule = append(_newServiceTypeManagerAddressRule, _newServiceTypeManagerAddressItem)
	}

	logs, sub, err := _ServiceProviderFactory.contract.FilterLogs(opts, "ServiceTypeManagerAddressUpdated", _newServiceTypeManagerAddressRule)
	if err != nil {
		return nil, err
	}
	return &ServiceProviderFactoryServiceTypeManagerAddressUpdatedIterator{contract: _ServiceProviderFactory.contract, event: "ServiceTypeManagerAddressUpdated", logs: logs, sub: sub}, nil
}

// WatchServiceTypeManagerAddressUpdated is a free log subscription operation binding the contract event 0x974dd22d9c68e24879e45eea1873ba5c4cc1957464d5e7c29a41a3c2418bb10c.
//
// Solidity: event ServiceTypeManagerAddressUpdated(address indexed _newServiceTypeManagerAddress)
func (_ServiceProviderFactory *ServiceProviderFactoryFilterer) WatchServiceTypeManagerAddressUpdated(opts *bind.WatchOpts, sink chan<- *ServiceProviderFactoryServiceTypeManagerAddressUpdated, _newServiceTypeManagerAddress []common.Address) (event.Subscription, error) {

	var _newServiceTypeManagerAddressRule []interface{}
	for _, _newServiceTypeManagerAddressItem := range _newServiceTypeManagerAddress {
		_newServiceTypeManagerAddressRule = append(_newServiceTypeManagerAddressRule, _newServiceTypeManagerAddressItem)
	}

	logs, sub, err := _ServiceProviderFactory.contract.WatchLogs(opts, "ServiceTypeManagerAddressUpdated", _newServiceTypeManagerAddressRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(ServiceProviderFactoryServiceTypeManagerAddressUpdated)
				if err := _ServiceProviderFactory.contract.UnpackLog(event, "ServiceTypeManagerAddressUpdated", log); err != nil {
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

// ParseServiceTypeManagerAddressUpdated is a log parse operation binding the contract event 0x974dd22d9c68e24879e45eea1873ba5c4cc1957464d5e7c29a41a3c2418bb10c.
//
// Solidity: event ServiceTypeManagerAddressUpdated(address indexed _newServiceTypeManagerAddress)
func (_ServiceProviderFactory *ServiceProviderFactoryFilterer) ParseServiceTypeManagerAddressUpdated(log types.Log) (*ServiceProviderFactoryServiceTypeManagerAddressUpdated, error) {
	event := new(ServiceProviderFactoryServiceTypeManagerAddressUpdated)
	if err := _ServiceProviderFactory.contract.UnpackLog(event, "ServiceTypeManagerAddressUpdated", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// ServiceProviderFactoryStakingAddressUpdatedIterator is returned from FilterStakingAddressUpdated and is used to iterate over the raw logs and unpacked data for StakingAddressUpdated events raised by the ServiceProviderFactory contract.
type ServiceProviderFactoryStakingAddressUpdatedIterator struct {
	Event *ServiceProviderFactoryStakingAddressUpdated // Event containing the contract specifics and raw log

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
func (it *ServiceProviderFactoryStakingAddressUpdatedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(ServiceProviderFactoryStakingAddressUpdated)
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
		it.Event = new(ServiceProviderFactoryStakingAddressUpdated)
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
func (it *ServiceProviderFactoryStakingAddressUpdatedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *ServiceProviderFactoryStakingAddressUpdatedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// ServiceProviderFactoryStakingAddressUpdated represents a StakingAddressUpdated event raised by the ServiceProviderFactory contract.
type ServiceProviderFactoryStakingAddressUpdated struct {
	NewStakingAddress common.Address
	Raw               types.Log // Blockchain specific contextual infos
}

// FilterStakingAddressUpdated is a free log retrieval operation binding the contract event 0x8ae96d8af35324a34b19e4f33e72d620b502f69595bb43870ab5fd7a7de78239.
//
// Solidity: event StakingAddressUpdated(address indexed _newStakingAddress)
func (_ServiceProviderFactory *ServiceProviderFactoryFilterer) FilterStakingAddressUpdated(opts *bind.FilterOpts, _newStakingAddress []common.Address) (*ServiceProviderFactoryStakingAddressUpdatedIterator, error) {

	var _newStakingAddressRule []interface{}
	for _, _newStakingAddressItem := range _newStakingAddress {
		_newStakingAddressRule = append(_newStakingAddressRule, _newStakingAddressItem)
	}

	logs, sub, err := _ServiceProviderFactory.contract.FilterLogs(opts, "StakingAddressUpdated", _newStakingAddressRule)
	if err != nil {
		return nil, err
	}
	return &ServiceProviderFactoryStakingAddressUpdatedIterator{contract: _ServiceProviderFactory.contract, event: "StakingAddressUpdated", logs: logs, sub: sub}, nil
}

// WatchStakingAddressUpdated is a free log subscription operation binding the contract event 0x8ae96d8af35324a34b19e4f33e72d620b502f69595bb43870ab5fd7a7de78239.
//
// Solidity: event StakingAddressUpdated(address indexed _newStakingAddress)
func (_ServiceProviderFactory *ServiceProviderFactoryFilterer) WatchStakingAddressUpdated(opts *bind.WatchOpts, sink chan<- *ServiceProviderFactoryStakingAddressUpdated, _newStakingAddress []common.Address) (event.Subscription, error) {

	var _newStakingAddressRule []interface{}
	for _, _newStakingAddressItem := range _newStakingAddress {
		_newStakingAddressRule = append(_newStakingAddressRule, _newStakingAddressItem)
	}

	logs, sub, err := _ServiceProviderFactory.contract.WatchLogs(opts, "StakingAddressUpdated", _newStakingAddressRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(ServiceProviderFactoryStakingAddressUpdated)
				if err := _ServiceProviderFactory.contract.UnpackLog(event, "StakingAddressUpdated", log); err != nil {
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
func (_ServiceProviderFactory *ServiceProviderFactoryFilterer) ParseStakingAddressUpdated(log types.Log) (*ServiceProviderFactoryStakingAddressUpdated, error) {
	event := new(ServiceProviderFactoryStakingAddressUpdated)
	if err := _ServiceProviderFactory.contract.UnpackLog(event, "StakingAddressUpdated", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// ServiceProviderFactoryUpdateDeployerCutLockupDurationUpdatedIterator is returned from FilterUpdateDeployerCutLockupDurationUpdated and is used to iterate over the raw logs and unpacked data for UpdateDeployerCutLockupDurationUpdated events raised by the ServiceProviderFactory contract.
type ServiceProviderFactoryUpdateDeployerCutLockupDurationUpdatedIterator struct {
	Event *ServiceProviderFactoryUpdateDeployerCutLockupDurationUpdated // Event containing the contract specifics and raw log

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
func (it *ServiceProviderFactoryUpdateDeployerCutLockupDurationUpdatedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(ServiceProviderFactoryUpdateDeployerCutLockupDurationUpdated)
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
		it.Event = new(ServiceProviderFactoryUpdateDeployerCutLockupDurationUpdated)
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
func (it *ServiceProviderFactoryUpdateDeployerCutLockupDurationUpdatedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *ServiceProviderFactoryUpdateDeployerCutLockupDurationUpdatedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// ServiceProviderFactoryUpdateDeployerCutLockupDurationUpdated represents a UpdateDeployerCutLockupDurationUpdated event raised by the ServiceProviderFactory contract.
type ServiceProviderFactoryUpdateDeployerCutLockupDurationUpdated struct {
	LockupDuration *big.Int
	Raw            types.Log // Blockchain specific contextual infos
}

// FilterUpdateDeployerCutLockupDurationUpdated is a free log retrieval operation binding the contract event 0x3934b310f24fb67bc4b421ffbf8e2c81d939002aa0f323d20477bb98cf538147.
//
// Solidity: event UpdateDeployerCutLockupDurationUpdated(uint256 indexed _lockupDuration)
func (_ServiceProviderFactory *ServiceProviderFactoryFilterer) FilterUpdateDeployerCutLockupDurationUpdated(opts *bind.FilterOpts, _lockupDuration []*big.Int) (*ServiceProviderFactoryUpdateDeployerCutLockupDurationUpdatedIterator, error) {

	var _lockupDurationRule []interface{}
	for _, _lockupDurationItem := range _lockupDuration {
		_lockupDurationRule = append(_lockupDurationRule, _lockupDurationItem)
	}

	logs, sub, err := _ServiceProviderFactory.contract.FilterLogs(opts, "UpdateDeployerCutLockupDurationUpdated", _lockupDurationRule)
	if err != nil {
		return nil, err
	}
	return &ServiceProviderFactoryUpdateDeployerCutLockupDurationUpdatedIterator{contract: _ServiceProviderFactory.contract, event: "UpdateDeployerCutLockupDurationUpdated", logs: logs, sub: sub}, nil
}

// WatchUpdateDeployerCutLockupDurationUpdated is a free log subscription operation binding the contract event 0x3934b310f24fb67bc4b421ffbf8e2c81d939002aa0f323d20477bb98cf538147.
//
// Solidity: event UpdateDeployerCutLockupDurationUpdated(uint256 indexed _lockupDuration)
func (_ServiceProviderFactory *ServiceProviderFactoryFilterer) WatchUpdateDeployerCutLockupDurationUpdated(opts *bind.WatchOpts, sink chan<- *ServiceProviderFactoryUpdateDeployerCutLockupDurationUpdated, _lockupDuration []*big.Int) (event.Subscription, error) {

	var _lockupDurationRule []interface{}
	for _, _lockupDurationItem := range _lockupDuration {
		_lockupDurationRule = append(_lockupDurationRule, _lockupDurationItem)
	}

	logs, sub, err := _ServiceProviderFactory.contract.WatchLogs(opts, "UpdateDeployerCutLockupDurationUpdated", _lockupDurationRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(ServiceProviderFactoryUpdateDeployerCutLockupDurationUpdated)
				if err := _ServiceProviderFactory.contract.UnpackLog(event, "UpdateDeployerCutLockupDurationUpdated", log); err != nil {
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

// ParseUpdateDeployerCutLockupDurationUpdated is a log parse operation binding the contract event 0x3934b310f24fb67bc4b421ffbf8e2c81d939002aa0f323d20477bb98cf538147.
//
// Solidity: event UpdateDeployerCutLockupDurationUpdated(uint256 indexed _lockupDuration)
func (_ServiceProviderFactory *ServiceProviderFactoryFilterer) ParseUpdateDeployerCutLockupDurationUpdated(log types.Log) (*ServiceProviderFactoryUpdateDeployerCutLockupDurationUpdated, error) {
	event := new(ServiceProviderFactoryUpdateDeployerCutLockupDurationUpdated)
	if err := _ServiceProviderFactory.contract.UnpackLog(event, "UpdateDeployerCutLockupDurationUpdated", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}
