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

// ServiceTypeManagerMetaData contains all meta data concerning the ServiceTypeManager contract.
var ServiceTypeManagerMetaData = &bind.MetaData{
	ABI: "[{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"bytes32\",\"name\":\"_serviceType\",\"type\":\"bytes32\"},{\"indexed\":true,\"internalType\":\"uint256\",\"name\":\"_serviceTypeMin\",\"type\":\"uint256\"},{\"indexed\":true,\"internalType\":\"uint256\",\"name\":\"_serviceTypeMax\",\"type\":\"uint256\"}],\"name\":\"ServiceTypeAdded\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"bytes32\",\"name\":\"_serviceType\",\"type\":\"bytes32\"}],\"name\":\"ServiceTypeRemoved\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"bytes32\",\"name\":\"_serviceType\",\"type\":\"bytes32\"},{\"indexed\":true,\"internalType\":\"bytes32\",\"name\":\"_serviceVersion\",\"type\":\"bytes32\"}],\"name\":\"SetServiceVersion\",\"type\":\"event\"},{\"constant\":false,\"inputs\":[],\"name\":\"initialize\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"address\",\"name\":\"_governanceAddress\",\"type\":\"address\"}],\"name\":\"initialize\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"getGovernanceAddress\",\"outputs\":[{\"internalType\":\"address\",\"name\":\"\",\"type\":\"address\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"address\",\"name\":\"_governanceAddress\",\"type\":\"address\"}],\"name\":\"setGovernanceAddress\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"bytes32\",\"name\":\"_serviceType\",\"type\":\"bytes32\"},{\"internalType\":\"uint256\",\"name\":\"_serviceTypeMin\",\"type\":\"uint256\"},{\"internalType\":\"uint256\",\"name\":\"_serviceTypeMax\",\"type\":\"uint256\"}],\"name\":\"addServiceType\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"bytes32\",\"name\":\"_serviceType\",\"type\":\"bytes32\"}],\"name\":\"removeServiceType\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[{\"internalType\":\"bytes32\",\"name\":\"_serviceType\",\"type\":\"bytes32\"}],\"name\":\"getServiceTypeInfo\",\"outputs\":[{\"internalType\":\"bool\",\"name\":\"isValid\",\"type\":\"bool\"},{\"internalType\":\"uint256\",\"name\":\"minStake\",\"type\":\"uint256\"},{\"internalType\":\"uint256\",\"name\":\"maxStake\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"getValidServiceTypes\",\"outputs\":[{\"internalType\":\"bytes32[]\",\"name\":\"\",\"type\":\"bytes32[]\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[{\"internalType\":\"bytes32\",\"name\":\"_serviceType\",\"type\":\"bytes32\"}],\"name\":\"serviceTypeIsValid\",\"outputs\":[{\"internalType\":\"bool\",\"name\":\"\",\"type\":\"bool\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"bytes32\",\"name\":\"_serviceType\",\"type\":\"bytes32\"},{\"internalType\":\"bytes32\",\"name\":\"_serviceVersion\",\"type\":\"bytes32\"}],\"name\":\"setServiceVersion\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[{\"internalType\":\"bytes32\",\"name\":\"_serviceType\",\"type\":\"bytes32\"},{\"internalType\":\"uint256\",\"name\":\"_versionIndex\",\"type\":\"uint256\"}],\"name\":\"getVersion\",\"outputs\":[{\"internalType\":\"bytes32\",\"name\":\"\",\"type\":\"bytes32\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[{\"internalType\":\"bytes32\",\"name\":\"_serviceType\",\"type\":\"bytes32\"}],\"name\":\"getCurrentVersion\",\"outputs\":[{\"internalType\":\"bytes32\",\"name\":\"\",\"type\":\"bytes32\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[{\"internalType\":\"bytes32\",\"name\":\"_serviceType\",\"type\":\"bytes32\"}],\"name\":\"getNumberOfVersions\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[{\"internalType\":\"bytes32\",\"name\":\"_serviceType\",\"type\":\"bytes32\"},{\"internalType\":\"bytes32\",\"name\":\"_serviceVersion\",\"type\":\"bytes32\"}],\"name\":\"serviceVersionIsValid\",\"outputs\":[{\"internalType\":\"bool\",\"name\":\"\",\"type\":\"bool\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"}]",
}

// ServiceTypeManagerABI is the input ABI used to generate the binding from.
// Deprecated: Use ServiceTypeManagerMetaData.ABI instead.
var ServiceTypeManagerABI = ServiceTypeManagerMetaData.ABI

// ServiceTypeManager is an auto generated Go binding around an Ethereum contract.
type ServiceTypeManager struct {
	ServiceTypeManagerCaller     // Read-only binding to the contract
	ServiceTypeManagerTransactor // Write-only binding to the contract
	ServiceTypeManagerFilterer   // Log filterer for contract events
}

// ServiceTypeManagerCaller is an auto generated read-only Go binding around an Ethereum contract.
type ServiceTypeManagerCaller struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// ServiceTypeManagerTransactor is an auto generated write-only Go binding around an Ethereum contract.
type ServiceTypeManagerTransactor struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// ServiceTypeManagerFilterer is an auto generated log filtering Go binding around an Ethereum contract events.
type ServiceTypeManagerFilterer struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// ServiceTypeManagerSession is an auto generated Go binding around an Ethereum contract,
// with pre-set call and transact options.
type ServiceTypeManagerSession struct {
	Contract     *ServiceTypeManager // Generic contract binding to set the session for
	CallOpts     bind.CallOpts       // Call options to use throughout this session
	TransactOpts bind.TransactOpts   // Transaction auth options to use throughout this session
}

// ServiceTypeManagerCallerSession is an auto generated read-only Go binding around an Ethereum contract,
// with pre-set call options.
type ServiceTypeManagerCallerSession struct {
	Contract *ServiceTypeManagerCaller // Generic contract caller binding to set the session for
	CallOpts bind.CallOpts             // Call options to use throughout this session
}

// ServiceTypeManagerTransactorSession is an auto generated write-only Go binding around an Ethereum contract,
// with pre-set transact options.
type ServiceTypeManagerTransactorSession struct {
	Contract     *ServiceTypeManagerTransactor // Generic contract transactor binding to set the session for
	TransactOpts bind.TransactOpts             // Transaction auth options to use throughout this session
}

// ServiceTypeManagerRaw is an auto generated low-level Go binding around an Ethereum contract.
type ServiceTypeManagerRaw struct {
	Contract *ServiceTypeManager // Generic contract binding to access the raw methods on
}

// ServiceTypeManagerCallerRaw is an auto generated low-level read-only Go binding around an Ethereum contract.
type ServiceTypeManagerCallerRaw struct {
	Contract *ServiceTypeManagerCaller // Generic read-only contract binding to access the raw methods on
}

// ServiceTypeManagerTransactorRaw is an auto generated low-level write-only Go binding around an Ethereum contract.
type ServiceTypeManagerTransactorRaw struct {
	Contract *ServiceTypeManagerTransactor // Generic write-only contract binding to access the raw methods on
}

// NewServiceTypeManager creates a new instance of ServiceTypeManager, bound to a specific deployed contract.
func NewServiceTypeManager(address common.Address, backend bind.ContractBackend) (*ServiceTypeManager, error) {
	contract, err := bindServiceTypeManager(address, backend, backend, backend)
	if err != nil {
		return nil, err
	}
	return &ServiceTypeManager{ServiceTypeManagerCaller: ServiceTypeManagerCaller{contract: contract}, ServiceTypeManagerTransactor: ServiceTypeManagerTransactor{contract: contract}, ServiceTypeManagerFilterer: ServiceTypeManagerFilterer{contract: contract}}, nil
}

// NewServiceTypeManagerCaller creates a new read-only instance of ServiceTypeManager, bound to a specific deployed contract.
func NewServiceTypeManagerCaller(address common.Address, caller bind.ContractCaller) (*ServiceTypeManagerCaller, error) {
	contract, err := bindServiceTypeManager(address, caller, nil, nil)
	if err != nil {
		return nil, err
	}
	return &ServiceTypeManagerCaller{contract: contract}, nil
}

// NewServiceTypeManagerTransactor creates a new write-only instance of ServiceTypeManager, bound to a specific deployed contract.
func NewServiceTypeManagerTransactor(address common.Address, transactor bind.ContractTransactor) (*ServiceTypeManagerTransactor, error) {
	contract, err := bindServiceTypeManager(address, nil, transactor, nil)
	if err != nil {
		return nil, err
	}
	return &ServiceTypeManagerTransactor{contract: contract}, nil
}

// NewServiceTypeManagerFilterer creates a new log filterer instance of ServiceTypeManager, bound to a specific deployed contract.
func NewServiceTypeManagerFilterer(address common.Address, filterer bind.ContractFilterer) (*ServiceTypeManagerFilterer, error) {
	contract, err := bindServiceTypeManager(address, nil, nil, filterer)
	if err != nil {
		return nil, err
	}
	return &ServiceTypeManagerFilterer{contract: contract}, nil
}

// bindServiceTypeManager binds a generic wrapper to an already deployed contract.
func bindServiceTypeManager(address common.Address, caller bind.ContractCaller, transactor bind.ContractTransactor, filterer bind.ContractFilterer) (*bind.BoundContract, error) {
	parsed, err := ServiceTypeManagerMetaData.GetAbi()
	if err != nil {
		return nil, err
	}
	return bind.NewBoundContract(address, *parsed, caller, transactor, filterer), nil
}

// Call invokes the (constant) contract method with params as input values and
// sets the output to result. The result type might be a single field for simple
// returns, a slice of interfaces for anonymous returns and a struct for named
// returns.
func (_ServiceTypeManager *ServiceTypeManagerRaw) Call(opts *bind.CallOpts, result *[]interface{}, method string, params ...interface{}) error {
	return _ServiceTypeManager.Contract.ServiceTypeManagerCaller.contract.Call(opts, result, method, params...)
}

// Transfer initiates a plain transaction to move funds to the contract, calling
// its default method if one is available.
func (_ServiceTypeManager *ServiceTypeManagerRaw) Transfer(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _ServiceTypeManager.Contract.ServiceTypeManagerTransactor.contract.Transfer(opts)
}

// Transact invokes the (paid) contract method with params as input values.
func (_ServiceTypeManager *ServiceTypeManagerRaw) Transact(opts *bind.TransactOpts, method string, params ...interface{}) (*types.Transaction, error) {
	return _ServiceTypeManager.Contract.ServiceTypeManagerTransactor.contract.Transact(opts, method, params...)
}

// Call invokes the (constant) contract method with params as input values and
// sets the output to result. The result type might be a single field for simple
// returns, a slice of interfaces for anonymous returns and a struct for named
// returns.
func (_ServiceTypeManager *ServiceTypeManagerCallerRaw) Call(opts *bind.CallOpts, result *[]interface{}, method string, params ...interface{}) error {
	return _ServiceTypeManager.Contract.contract.Call(opts, result, method, params...)
}

// Transfer initiates a plain transaction to move funds to the contract, calling
// its default method if one is available.
func (_ServiceTypeManager *ServiceTypeManagerTransactorRaw) Transfer(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _ServiceTypeManager.Contract.contract.Transfer(opts)
}

// Transact invokes the (paid) contract method with params as input values.
func (_ServiceTypeManager *ServiceTypeManagerTransactorRaw) Transact(opts *bind.TransactOpts, method string, params ...interface{}) (*types.Transaction, error) {
	return _ServiceTypeManager.Contract.contract.Transact(opts, method, params...)
}

// GetCurrentVersion is a free data retrieval call binding the contract method 0x7b41518f.
//
// Solidity: function getCurrentVersion(bytes32 _serviceType) view returns(bytes32)
func (_ServiceTypeManager *ServiceTypeManagerCaller) GetCurrentVersion(opts *bind.CallOpts, _serviceType [32]byte) ([32]byte, error) {
	var out []interface{}
	err := _ServiceTypeManager.contract.Call(opts, &out, "getCurrentVersion", _serviceType)

	if err != nil {
		return *new([32]byte), err
	}

	out0 := *abi.ConvertType(out[0], new([32]byte)).(*[32]byte)

	return out0, err

}

// GetCurrentVersion is a free data retrieval call binding the contract method 0x7b41518f.
//
// Solidity: function getCurrentVersion(bytes32 _serviceType) view returns(bytes32)
func (_ServiceTypeManager *ServiceTypeManagerSession) GetCurrentVersion(_serviceType [32]byte) ([32]byte, error) {
	return _ServiceTypeManager.Contract.GetCurrentVersion(&_ServiceTypeManager.CallOpts, _serviceType)
}

// GetCurrentVersion is a free data retrieval call binding the contract method 0x7b41518f.
//
// Solidity: function getCurrentVersion(bytes32 _serviceType) view returns(bytes32)
func (_ServiceTypeManager *ServiceTypeManagerCallerSession) GetCurrentVersion(_serviceType [32]byte) ([32]byte, error) {
	return _ServiceTypeManager.Contract.GetCurrentVersion(&_ServiceTypeManager.CallOpts, _serviceType)
}

// GetGovernanceAddress is a free data retrieval call binding the contract method 0x73252494.
//
// Solidity: function getGovernanceAddress() view returns(address)
func (_ServiceTypeManager *ServiceTypeManagerCaller) GetGovernanceAddress(opts *bind.CallOpts) (common.Address, error) {
	var out []interface{}
	err := _ServiceTypeManager.contract.Call(opts, &out, "getGovernanceAddress")

	if err != nil {
		return *new(common.Address), err
	}

	out0 := *abi.ConvertType(out[0], new(common.Address)).(*common.Address)

	return out0, err

}

// GetGovernanceAddress is a free data retrieval call binding the contract method 0x73252494.
//
// Solidity: function getGovernanceAddress() view returns(address)
func (_ServiceTypeManager *ServiceTypeManagerSession) GetGovernanceAddress() (common.Address, error) {
	return _ServiceTypeManager.Contract.GetGovernanceAddress(&_ServiceTypeManager.CallOpts)
}

// GetGovernanceAddress is a free data retrieval call binding the contract method 0x73252494.
//
// Solidity: function getGovernanceAddress() view returns(address)
func (_ServiceTypeManager *ServiceTypeManagerCallerSession) GetGovernanceAddress() (common.Address, error) {
	return _ServiceTypeManager.Contract.GetGovernanceAddress(&_ServiceTypeManager.CallOpts)
}

// GetNumberOfVersions is a free data retrieval call binding the contract method 0x73531e06.
//
// Solidity: function getNumberOfVersions(bytes32 _serviceType) view returns(uint256)
func (_ServiceTypeManager *ServiceTypeManagerCaller) GetNumberOfVersions(opts *bind.CallOpts, _serviceType [32]byte) (*big.Int, error) {
	var out []interface{}
	err := _ServiceTypeManager.contract.Call(opts, &out, "getNumberOfVersions", _serviceType)

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

// GetNumberOfVersions is a free data retrieval call binding the contract method 0x73531e06.
//
// Solidity: function getNumberOfVersions(bytes32 _serviceType) view returns(uint256)
func (_ServiceTypeManager *ServiceTypeManagerSession) GetNumberOfVersions(_serviceType [32]byte) (*big.Int, error) {
	return _ServiceTypeManager.Contract.GetNumberOfVersions(&_ServiceTypeManager.CallOpts, _serviceType)
}

// GetNumberOfVersions is a free data retrieval call binding the contract method 0x73531e06.
//
// Solidity: function getNumberOfVersions(bytes32 _serviceType) view returns(uint256)
func (_ServiceTypeManager *ServiceTypeManagerCallerSession) GetNumberOfVersions(_serviceType [32]byte) (*big.Int, error) {
	return _ServiceTypeManager.Contract.GetNumberOfVersions(&_ServiceTypeManager.CallOpts, _serviceType)
}

// GetServiceTypeInfo is a free data retrieval call binding the contract method 0x9be6acf6.
//
// Solidity: function getServiceTypeInfo(bytes32 _serviceType) view returns(bool isValid, uint256 minStake, uint256 maxStake)
func (_ServiceTypeManager *ServiceTypeManagerCaller) GetServiceTypeInfo(opts *bind.CallOpts, _serviceType [32]byte) (struct {
	IsValid  bool
	MinStake *big.Int
	MaxStake *big.Int
}, error) {
	var out []interface{}
	err := _ServiceTypeManager.contract.Call(opts, &out, "getServiceTypeInfo", _serviceType)

	outstruct := new(struct {
		IsValid  bool
		MinStake *big.Int
		MaxStake *big.Int
	})
	if err != nil {
		return *outstruct, err
	}

	outstruct.IsValid = *abi.ConvertType(out[0], new(bool)).(*bool)
	outstruct.MinStake = *abi.ConvertType(out[1], new(*big.Int)).(**big.Int)
	outstruct.MaxStake = *abi.ConvertType(out[2], new(*big.Int)).(**big.Int)

	return *outstruct, err

}

// GetServiceTypeInfo is a free data retrieval call binding the contract method 0x9be6acf6.
//
// Solidity: function getServiceTypeInfo(bytes32 _serviceType) view returns(bool isValid, uint256 minStake, uint256 maxStake)
func (_ServiceTypeManager *ServiceTypeManagerSession) GetServiceTypeInfo(_serviceType [32]byte) (struct {
	IsValid  bool
	MinStake *big.Int
	MaxStake *big.Int
}, error) {
	return _ServiceTypeManager.Contract.GetServiceTypeInfo(&_ServiceTypeManager.CallOpts, _serviceType)
}

// GetServiceTypeInfo is a free data retrieval call binding the contract method 0x9be6acf6.
//
// Solidity: function getServiceTypeInfo(bytes32 _serviceType) view returns(bool isValid, uint256 minStake, uint256 maxStake)
func (_ServiceTypeManager *ServiceTypeManagerCallerSession) GetServiceTypeInfo(_serviceType [32]byte) (struct {
	IsValid  bool
	MinStake *big.Int
	MaxStake *big.Int
}, error) {
	return _ServiceTypeManager.Contract.GetServiceTypeInfo(&_ServiceTypeManager.CallOpts, _serviceType)
}

// GetValidServiceTypes is a free data retrieval call binding the contract method 0x5a0100d7.
//
// Solidity: function getValidServiceTypes() view returns(bytes32[])
func (_ServiceTypeManager *ServiceTypeManagerCaller) GetValidServiceTypes(opts *bind.CallOpts) ([][32]byte, error) {
	var out []interface{}
	err := _ServiceTypeManager.contract.Call(opts, &out, "getValidServiceTypes")

	if err != nil {
		return *new([][32]byte), err
	}

	out0 := *abi.ConvertType(out[0], new([][32]byte)).(*[][32]byte)

	return out0, err

}

// GetValidServiceTypes is a free data retrieval call binding the contract method 0x5a0100d7.
//
// Solidity: function getValidServiceTypes() view returns(bytes32[])
func (_ServiceTypeManager *ServiceTypeManagerSession) GetValidServiceTypes() ([][32]byte, error) {
	return _ServiceTypeManager.Contract.GetValidServiceTypes(&_ServiceTypeManager.CallOpts)
}

// GetValidServiceTypes is a free data retrieval call binding the contract method 0x5a0100d7.
//
// Solidity: function getValidServiceTypes() view returns(bytes32[])
func (_ServiceTypeManager *ServiceTypeManagerCallerSession) GetValidServiceTypes() ([][32]byte, error) {
	return _ServiceTypeManager.Contract.GetValidServiceTypes(&_ServiceTypeManager.CallOpts)
}

// GetVersion is a free data retrieval call binding the contract method 0xaf904a06.
//
// Solidity: function getVersion(bytes32 _serviceType, uint256 _versionIndex) view returns(bytes32)
func (_ServiceTypeManager *ServiceTypeManagerCaller) GetVersion(opts *bind.CallOpts, _serviceType [32]byte, _versionIndex *big.Int) ([32]byte, error) {
	var out []interface{}
	err := _ServiceTypeManager.contract.Call(opts, &out, "getVersion", _serviceType, _versionIndex)

	if err != nil {
		return *new([32]byte), err
	}

	out0 := *abi.ConvertType(out[0], new([32]byte)).(*[32]byte)

	return out0, err

}

// GetVersion is a free data retrieval call binding the contract method 0xaf904a06.
//
// Solidity: function getVersion(bytes32 _serviceType, uint256 _versionIndex) view returns(bytes32)
func (_ServiceTypeManager *ServiceTypeManagerSession) GetVersion(_serviceType [32]byte, _versionIndex *big.Int) ([32]byte, error) {
	return _ServiceTypeManager.Contract.GetVersion(&_ServiceTypeManager.CallOpts, _serviceType, _versionIndex)
}

// GetVersion is a free data retrieval call binding the contract method 0xaf904a06.
//
// Solidity: function getVersion(bytes32 _serviceType, uint256 _versionIndex) view returns(bytes32)
func (_ServiceTypeManager *ServiceTypeManagerCallerSession) GetVersion(_serviceType [32]byte, _versionIndex *big.Int) ([32]byte, error) {
	return _ServiceTypeManager.Contract.GetVersion(&_ServiceTypeManager.CallOpts, _serviceType, _versionIndex)
}

// ServiceTypeIsValid is a free data retrieval call binding the contract method 0x9bf7734b.
//
// Solidity: function serviceTypeIsValid(bytes32 _serviceType) view returns(bool)
func (_ServiceTypeManager *ServiceTypeManagerCaller) ServiceTypeIsValid(opts *bind.CallOpts, _serviceType [32]byte) (bool, error) {
	var out []interface{}
	err := _ServiceTypeManager.contract.Call(opts, &out, "serviceTypeIsValid", _serviceType)

	if err != nil {
		return *new(bool), err
	}

	out0 := *abi.ConvertType(out[0], new(bool)).(*bool)

	return out0, err

}

// ServiceTypeIsValid is a free data retrieval call binding the contract method 0x9bf7734b.
//
// Solidity: function serviceTypeIsValid(bytes32 _serviceType) view returns(bool)
func (_ServiceTypeManager *ServiceTypeManagerSession) ServiceTypeIsValid(_serviceType [32]byte) (bool, error) {
	return _ServiceTypeManager.Contract.ServiceTypeIsValid(&_ServiceTypeManager.CallOpts, _serviceType)
}

// ServiceTypeIsValid is a free data retrieval call binding the contract method 0x9bf7734b.
//
// Solidity: function serviceTypeIsValid(bytes32 _serviceType) view returns(bool)
func (_ServiceTypeManager *ServiceTypeManagerCallerSession) ServiceTypeIsValid(_serviceType [32]byte) (bool, error) {
	return _ServiceTypeManager.Contract.ServiceTypeIsValid(&_ServiceTypeManager.CallOpts, _serviceType)
}

// ServiceVersionIsValid is a free data retrieval call binding the contract method 0xf00344a6.
//
// Solidity: function serviceVersionIsValid(bytes32 _serviceType, bytes32 _serviceVersion) view returns(bool)
func (_ServiceTypeManager *ServiceTypeManagerCaller) ServiceVersionIsValid(opts *bind.CallOpts, _serviceType [32]byte, _serviceVersion [32]byte) (bool, error) {
	var out []interface{}
	err := _ServiceTypeManager.contract.Call(opts, &out, "serviceVersionIsValid", _serviceType, _serviceVersion)

	if err != nil {
		return *new(bool), err
	}

	out0 := *abi.ConvertType(out[0], new(bool)).(*bool)

	return out0, err

}

// ServiceVersionIsValid is a free data retrieval call binding the contract method 0xf00344a6.
//
// Solidity: function serviceVersionIsValid(bytes32 _serviceType, bytes32 _serviceVersion) view returns(bool)
func (_ServiceTypeManager *ServiceTypeManagerSession) ServiceVersionIsValid(_serviceType [32]byte, _serviceVersion [32]byte) (bool, error) {
	return _ServiceTypeManager.Contract.ServiceVersionIsValid(&_ServiceTypeManager.CallOpts, _serviceType, _serviceVersion)
}

// ServiceVersionIsValid is a free data retrieval call binding the contract method 0xf00344a6.
//
// Solidity: function serviceVersionIsValid(bytes32 _serviceType, bytes32 _serviceVersion) view returns(bool)
func (_ServiceTypeManager *ServiceTypeManagerCallerSession) ServiceVersionIsValid(_serviceType [32]byte, _serviceVersion [32]byte) (bool, error) {
	return _ServiceTypeManager.Contract.ServiceVersionIsValid(&_ServiceTypeManager.CallOpts, _serviceType, _serviceVersion)
}

// AddServiceType is a paid mutator transaction binding the contract method 0xb04bee46.
//
// Solidity: function addServiceType(bytes32 _serviceType, uint256 _serviceTypeMin, uint256 _serviceTypeMax) returns()
func (_ServiceTypeManager *ServiceTypeManagerTransactor) AddServiceType(opts *bind.TransactOpts, _serviceType [32]byte, _serviceTypeMin *big.Int, _serviceTypeMax *big.Int) (*types.Transaction, error) {
	return _ServiceTypeManager.contract.Transact(opts, "addServiceType", _serviceType, _serviceTypeMin, _serviceTypeMax)
}

// AddServiceType is a paid mutator transaction binding the contract method 0xb04bee46.
//
// Solidity: function addServiceType(bytes32 _serviceType, uint256 _serviceTypeMin, uint256 _serviceTypeMax) returns()
func (_ServiceTypeManager *ServiceTypeManagerSession) AddServiceType(_serviceType [32]byte, _serviceTypeMin *big.Int, _serviceTypeMax *big.Int) (*types.Transaction, error) {
	return _ServiceTypeManager.Contract.AddServiceType(&_ServiceTypeManager.TransactOpts, _serviceType, _serviceTypeMin, _serviceTypeMax)
}

// AddServiceType is a paid mutator transaction binding the contract method 0xb04bee46.
//
// Solidity: function addServiceType(bytes32 _serviceType, uint256 _serviceTypeMin, uint256 _serviceTypeMax) returns()
func (_ServiceTypeManager *ServiceTypeManagerTransactorSession) AddServiceType(_serviceType [32]byte, _serviceTypeMin *big.Int, _serviceTypeMax *big.Int) (*types.Transaction, error) {
	return _ServiceTypeManager.Contract.AddServiceType(&_ServiceTypeManager.TransactOpts, _serviceType, _serviceTypeMin, _serviceTypeMax)
}

// Initialize is a paid mutator transaction binding the contract method 0x8129fc1c.
//
// Solidity: function initialize() returns()
func (_ServiceTypeManager *ServiceTypeManagerTransactor) Initialize(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _ServiceTypeManager.contract.Transact(opts, "initialize")
}

// Initialize is a paid mutator transaction binding the contract method 0x8129fc1c.
//
// Solidity: function initialize() returns()
func (_ServiceTypeManager *ServiceTypeManagerSession) Initialize() (*types.Transaction, error) {
	return _ServiceTypeManager.Contract.Initialize(&_ServiceTypeManager.TransactOpts)
}

// Initialize is a paid mutator transaction binding the contract method 0x8129fc1c.
//
// Solidity: function initialize() returns()
func (_ServiceTypeManager *ServiceTypeManagerTransactorSession) Initialize() (*types.Transaction, error) {
	return _ServiceTypeManager.Contract.Initialize(&_ServiceTypeManager.TransactOpts)
}

// Initialize0 is a paid mutator transaction binding the contract method 0xc4d66de8.
//
// Solidity: function initialize(address _governanceAddress) returns()
func (_ServiceTypeManager *ServiceTypeManagerTransactor) Initialize0(opts *bind.TransactOpts, _governanceAddress common.Address) (*types.Transaction, error) {
	return _ServiceTypeManager.contract.Transact(opts, "initialize0", _governanceAddress)
}

// Initialize0 is a paid mutator transaction binding the contract method 0xc4d66de8.
//
// Solidity: function initialize(address _governanceAddress) returns()
func (_ServiceTypeManager *ServiceTypeManagerSession) Initialize0(_governanceAddress common.Address) (*types.Transaction, error) {
	return _ServiceTypeManager.Contract.Initialize0(&_ServiceTypeManager.TransactOpts, _governanceAddress)
}

// Initialize0 is a paid mutator transaction binding the contract method 0xc4d66de8.
//
// Solidity: function initialize(address _governanceAddress) returns()
func (_ServiceTypeManager *ServiceTypeManagerTransactorSession) Initialize0(_governanceAddress common.Address) (*types.Transaction, error) {
	return _ServiceTypeManager.Contract.Initialize0(&_ServiceTypeManager.TransactOpts, _governanceAddress)
}

// RemoveServiceType is a paid mutator transaction binding the contract method 0x43d5ef36.
//
// Solidity: function removeServiceType(bytes32 _serviceType) returns()
func (_ServiceTypeManager *ServiceTypeManagerTransactor) RemoveServiceType(opts *bind.TransactOpts, _serviceType [32]byte) (*types.Transaction, error) {
	return _ServiceTypeManager.contract.Transact(opts, "removeServiceType", _serviceType)
}

// RemoveServiceType is a paid mutator transaction binding the contract method 0x43d5ef36.
//
// Solidity: function removeServiceType(bytes32 _serviceType) returns()
func (_ServiceTypeManager *ServiceTypeManagerSession) RemoveServiceType(_serviceType [32]byte) (*types.Transaction, error) {
	return _ServiceTypeManager.Contract.RemoveServiceType(&_ServiceTypeManager.TransactOpts, _serviceType)
}

// RemoveServiceType is a paid mutator transaction binding the contract method 0x43d5ef36.
//
// Solidity: function removeServiceType(bytes32 _serviceType) returns()
func (_ServiceTypeManager *ServiceTypeManagerTransactorSession) RemoveServiceType(_serviceType [32]byte) (*types.Transaction, error) {
	return _ServiceTypeManager.Contract.RemoveServiceType(&_ServiceTypeManager.TransactOpts, _serviceType)
}

// SetGovernanceAddress is a paid mutator transaction binding the contract method 0xcfc16254.
//
// Solidity: function setGovernanceAddress(address _governanceAddress) returns()
func (_ServiceTypeManager *ServiceTypeManagerTransactor) SetGovernanceAddress(opts *bind.TransactOpts, _governanceAddress common.Address) (*types.Transaction, error) {
	return _ServiceTypeManager.contract.Transact(opts, "setGovernanceAddress", _governanceAddress)
}

// SetGovernanceAddress is a paid mutator transaction binding the contract method 0xcfc16254.
//
// Solidity: function setGovernanceAddress(address _governanceAddress) returns()
func (_ServiceTypeManager *ServiceTypeManagerSession) SetGovernanceAddress(_governanceAddress common.Address) (*types.Transaction, error) {
	return _ServiceTypeManager.Contract.SetGovernanceAddress(&_ServiceTypeManager.TransactOpts, _governanceAddress)
}

// SetGovernanceAddress is a paid mutator transaction binding the contract method 0xcfc16254.
//
// Solidity: function setGovernanceAddress(address _governanceAddress) returns()
func (_ServiceTypeManager *ServiceTypeManagerTransactorSession) SetGovernanceAddress(_governanceAddress common.Address) (*types.Transaction, error) {
	return _ServiceTypeManager.Contract.SetGovernanceAddress(&_ServiceTypeManager.TransactOpts, _governanceAddress)
}

// SetServiceVersion is a paid mutator transaction binding the contract method 0x81ca9527.
//
// Solidity: function setServiceVersion(bytes32 _serviceType, bytes32 _serviceVersion) returns()
func (_ServiceTypeManager *ServiceTypeManagerTransactor) SetServiceVersion(opts *bind.TransactOpts, _serviceType [32]byte, _serviceVersion [32]byte) (*types.Transaction, error) {
	return _ServiceTypeManager.contract.Transact(opts, "setServiceVersion", _serviceType, _serviceVersion)
}

// SetServiceVersion is a paid mutator transaction binding the contract method 0x81ca9527.
//
// Solidity: function setServiceVersion(bytes32 _serviceType, bytes32 _serviceVersion) returns()
func (_ServiceTypeManager *ServiceTypeManagerSession) SetServiceVersion(_serviceType [32]byte, _serviceVersion [32]byte) (*types.Transaction, error) {
	return _ServiceTypeManager.Contract.SetServiceVersion(&_ServiceTypeManager.TransactOpts, _serviceType, _serviceVersion)
}

// SetServiceVersion is a paid mutator transaction binding the contract method 0x81ca9527.
//
// Solidity: function setServiceVersion(bytes32 _serviceType, bytes32 _serviceVersion) returns()
func (_ServiceTypeManager *ServiceTypeManagerTransactorSession) SetServiceVersion(_serviceType [32]byte, _serviceVersion [32]byte) (*types.Transaction, error) {
	return _ServiceTypeManager.Contract.SetServiceVersion(&_ServiceTypeManager.TransactOpts, _serviceType, _serviceVersion)
}

// ServiceTypeManagerServiceTypeAddedIterator is returned from FilterServiceTypeAdded and is used to iterate over the raw logs and unpacked data for ServiceTypeAdded events raised by the ServiceTypeManager contract.
type ServiceTypeManagerServiceTypeAddedIterator struct {
	Event *ServiceTypeManagerServiceTypeAdded // Event containing the contract specifics and raw log

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
func (it *ServiceTypeManagerServiceTypeAddedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(ServiceTypeManagerServiceTypeAdded)
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
		it.Event = new(ServiceTypeManagerServiceTypeAdded)
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
func (it *ServiceTypeManagerServiceTypeAddedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *ServiceTypeManagerServiceTypeAddedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// ServiceTypeManagerServiceTypeAdded represents a ServiceTypeAdded event raised by the ServiceTypeManager contract.
type ServiceTypeManagerServiceTypeAdded struct {
	ServiceType    [32]byte
	ServiceTypeMin *big.Int
	ServiceTypeMax *big.Int
	Raw            types.Log // Blockchain specific contextual infos
}

// FilterServiceTypeAdded is a free log retrieval operation binding the contract event 0x75901b141ca2dab69480ccbbc6780335a550ba02ea3f80c3b2b8ac30fd1d66dc.
//
// Solidity: event ServiceTypeAdded(bytes32 indexed _serviceType, uint256 indexed _serviceTypeMin, uint256 indexed _serviceTypeMax)
func (_ServiceTypeManager *ServiceTypeManagerFilterer) FilterServiceTypeAdded(opts *bind.FilterOpts, _serviceType [][32]byte, _serviceTypeMin []*big.Int, _serviceTypeMax []*big.Int) (*ServiceTypeManagerServiceTypeAddedIterator, error) {

	var _serviceTypeRule []interface{}
	for _, _serviceTypeItem := range _serviceType {
		_serviceTypeRule = append(_serviceTypeRule, _serviceTypeItem)
	}
	var _serviceTypeMinRule []interface{}
	for _, _serviceTypeMinItem := range _serviceTypeMin {
		_serviceTypeMinRule = append(_serviceTypeMinRule, _serviceTypeMinItem)
	}
	var _serviceTypeMaxRule []interface{}
	for _, _serviceTypeMaxItem := range _serviceTypeMax {
		_serviceTypeMaxRule = append(_serviceTypeMaxRule, _serviceTypeMaxItem)
	}

	logs, sub, err := _ServiceTypeManager.contract.FilterLogs(opts, "ServiceTypeAdded", _serviceTypeRule, _serviceTypeMinRule, _serviceTypeMaxRule)
	if err != nil {
		return nil, err
	}
	return &ServiceTypeManagerServiceTypeAddedIterator{contract: _ServiceTypeManager.contract, event: "ServiceTypeAdded", logs: logs, sub: sub}, nil
}

// WatchServiceTypeAdded is a free log subscription operation binding the contract event 0x75901b141ca2dab69480ccbbc6780335a550ba02ea3f80c3b2b8ac30fd1d66dc.
//
// Solidity: event ServiceTypeAdded(bytes32 indexed _serviceType, uint256 indexed _serviceTypeMin, uint256 indexed _serviceTypeMax)
func (_ServiceTypeManager *ServiceTypeManagerFilterer) WatchServiceTypeAdded(opts *bind.WatchOpts, sink chan<- *ServiceTypeManagerServiceTypeAdded, _serviceType [][32]byte, _serviceTypeMin []*big.Int, _serviceTypeMax []*big.Int) (event.Subscription, error) {

	var _serviceTypeRule []interface{}
	for _, _serviceTypeItem := range _serviceType {
		_serviceTypeRule = append(_serviceTypeRule, _serviceTypeItem)
	}
	var _serviceTypeMinRule []interface{}
	for _, _serviceTypeMinItem := range _serviceTypeMin {
		_serviceTypeMinRule = append(_serviceTypeMinRule, _serviceTypeMinItem)
	}
	var _serviceTypeMaxRule []interface{}
	for _, _serviceTypeMaxItem := range _serviceTypeMax {
		_serviceTypeMaxRule = append(_serviceTypeMaxRule, _serviceTypeMaxItem)
	}

	logs, sub, err := _ServiceTypeManager.contract.WatchLogs(opts, "ServiceTypeAdded", _serviceTypeRule, _serviceTypeMinRule, _serviceTypeMaxRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(ServiceTypeManagerServiceTypeAdded)
				if err := _ServiceTypeManager.contract.UnpackLog(event, "ServiceTypeAdded", log); err != nil {
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

// ParseServiceTypeAdded is a log parse operation binding the contract event 0x75901b141ca2dab69480ccbbc6780335a550ba02ea3f80c3b2b8ac30fd1d66dc.
//
// Solidity: event ServiceTypeAdded(bytes32 indexed _serviceType, uint256 indexed _serviceTypeMin, uint256 indexed _serviceTypeMax)
func (_ServiceTypeManager *ServiceTypeManagerFilterer) ParseServiceTypeAdded(log types.Log) (*ServiceTypeManagerServiceTypeAdded, error) {
	event := new(ServiceTypeManagerServiceTypeAdded)
	if err := _ServiceTypeManager.contract.UnpackLog(event, "ServiceTypeAdded", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// ServiceTypeManagerServiceTypeRemovedIterator is returned from FilterServiceTypeRemoved and is used to iterate over the raw logs and unpacked data for ServiceTypeRemoved events raised by the ServiceTypeManager contract.
type ServiceTypeManagerServiceTypeRemovedIterator struct {
	Event *ServiceTypeManagerServiceTypeRemoved // Event containing the contract specifics and raw log

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
func (it *ServiceTypeManagerServiceTypeRemovedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(ServiceTypeManagerServiceTypeRemoved)
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
		it.Event = new(ServiceTypeManagerServiceTypeRemoved)
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
func (it *ServiceTypeManagerServiceTypeRemovedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *ServiceTypeManagerServiceTypeRemovedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// ServiceTypeManagerServiceTypeRemoved represents a ServiceTypeRemoved event raised by the ServiceTypeManager contract.
type ServiceTypeManagerServiceTypeRemoved struct {
	ServiceType [32]byte
	Raw         types.Log // Blockchain specific contextual infos
}

// FilterServiceTypeRemoved is a free log retrieval operation binding the contract event 0xa338f0c10ee88c54c6f2c919cfd8c59aead74059e72db2c01b3b4b1a0b41514c.
//
// Solidity: event ServiceTypeRemoved(bytes32 indexed _serviceType)
func (_ServiceTypeManager *ServiceTypeManagerFilterer) FilterServiceTypeRemoved(opts *bind.FilterOpts, _serviceType [][32]byte) (*ServiceTypeManagerServiceTypeRemovedIterator, error) {

	var _serviceTypeRule []interface{}
	for _, _serviceTypeItem := range _serviceType {
		_serviceTypeRule = append(_serviceTypeRule, _serviceTypeItem)
	}

	logs, sub, err := _ServiceTypeManager.contract.FilterLogs(opts, "ServiceTypeRemoved", _serviceTypeRule)
	if err != nil {
		return nil, err
	}
	return &ServiceTypeManagerServiceTypeRemovedIterator{contract: _ServiceTypeManager.contract, event: "ServiceTypeRemoved", logs: logs, sub: sub}, nil
}

// WatchServiceTypeRemoved is a free log subscription operation binding the contract event 0xa338f0c10ee88c54c6f2c919cfd8c59aead74059e72db2c01b3b4b1a0b41514c.
//
// Solidity: event ServiceTypeRemoved(bytes32 indexed _serviceType)
func (_ServiceTypeManager *ServiceTypeManagerFilterer) WatchServiceTypeRemoved(opts *bind.WatchOpts, sink chan<- *ServiceTypeManagerServiceTypeRemoved, _serviceType [][32]byte) (event.Subscription, error) {

	var _serviceTypeRule []interface{}
	for _, _serviceTypeItem := range _serviceType {
		_serviceTypeRule = append(_serviceTypeRule, _serviceTypeItem)
	}

	logs, sub, err := _ServiceTypeManager.contract.WatchLogs(opts, "ServiceTypeRemoved", _serviceTypeRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(ServiceTypeManagerServiceTypeRemoved)
				if err := _ServiceTypeManager.contract.UnpackLog(event, "ServiceTypeRemoved", log); err != nil {
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

// ParseServiceTypeRemoved is a log parse operation binding the contract event 0xa338f0c10ee88c54c6f2c919cfd8c59aead74059e72db2c01b3b4b1a0b41514c.
//
// Solidity: event ServiceTypeRemoved(bytes32 indexed _serviceType)
func (_ServiceTypeManager *ServiceTypeManagerFilterer) ParseServiceTypeRemoved(log types.Log) (*ServiceTypeManagerServiceTypeRemoved, error) {
	event := new(ServiceTypeManagerServiceTypeRemoved)
	if err := _ServiceTypeManager.contract.UnpackLog(event, "ServiceTypeRemoved", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// ServiceTypeManagerSetServiceVersionIterator is returned from FilterSetServiceVersion and is used to iterate over the raw logs and unpacked data for SetServiceVersion events raised by the ServiceTypeManager contract.
type ServiceTypeManagerSetServiceVersionIterator struct {
	Event *ServiceTypeManagerSetServiceVersion // Event containing the contract specifics and raw log

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
func (it *ServiceTypeManagerSetServiceVersionIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(ServiceTypeManagerSetServiceVersion)
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
		it.Event = new(ServiceTypeManagerSetServiceVersion)
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
func (it *ServiceTypeManagerSetServiceVersionIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *ServiceTypeManagerSetServiceVersionIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// ServiceTypeManagerSetServiceVersion represents a SetServiceVersion event raised by the ServiceTypeManager contract.
type ServiceTypeManagerSetServiceVersion struct {
	ServiceType    [32]byte
	ServiceVersion [32]byte
	Raw            types.Log // Blockchain specific contextual infos
}

// FilterSetServiceVersion is a free log retrieval operation binding the contract event 0x4e7a43cd7eeaa502383fb22f02605cd2094b120455a217c6b6d6f6e6d22886aa.
//
// Solidity: event SetServiceVersion(bytes32 indexed _serviceType, bytes32 indexed _serviceVersion)
func (_ServiceTypeManager *ServiceTypeManagerFilterer) FilterSetServiceVersion(opts *bind.FilterOpts, _serviceType [][32]byte, _serviceVersion [][32]byte) (*ServiceTypeManagerSetServiceVersionIterator, error) {

	var _serviceTypeRule []interface{}
	for _, _serviceTypeItem := range _serviceType {
		_serviceTypeRule = append(_serviceTypeRule, _serviceTypeItem)
	}
	var _serviceVersionRule []interface{}
	for _, _serviceVersionItem := range _serviceVersion {
		_serviceVersionRule = append(_serviceVersionRule, _serviceVersionItem)
	}

	logs, sub, err := _ServiceTypeManager.contract.FilterLogs(opts, "SetServiceVersion", _serviceTypeRule, _serviceVersionRule)
	if err != nil {
		return nil, err
	}
	return &ServiceTypeManagerSetServiceVersionIterator{contract: _ServiceTypeManager.contract, event: "SetServiceVersion", logs: logs, sub: sub}, nil
}

// WatchSetServiceVersion is a free log subscription operation binding the contract event 0x4e7a43cd7eeaa502383fb22f02605cd2094b120455a217c6b6d6f6e6d22886aa.
//
// Solidity: event SetServiceVersion(bytes32 indexed _serviceType, bytes32 indexed _serviceVersion)
func (_ServiceTypeManager *ServiceTypeManagerFilterer) WatchSetServiceVersion(opts *bind.WatchOpts, sink chan<- *ServiceTypeManagerSetServiceVersion, _serviceType [][32]byte, _serviceVersion [][32]byte) (event.Subscription, error) {

	var _serviceTypeRule []interface{}
	for _, _serviceTypeItem := range _serviceType {
		_serviceTypeRule = append(_serviceTypeRule, _serviceTypeItem)
	}
	var _serviceVersionRule []interface{}
	for _, _serviceVersionItem := range _serviceVersion {
		_serviceVersionRule = append(_serviceVersionRule, _serviceVersionItem)
	}

	logs, sub, err := _ServiceTypeManager.contract.WatchLogs(opts, "SetServiceVersion", _serviceTypeRule, _serviceVersionRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(ServiceTypeManagerSetServiceVersion)
				if err := _ServiceTypeManager.contract.UnpackLog(event, "SetServiceVersion", log); err != nil {
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

// ParseSetServiceVersion is a log parse operation binding the contract event 0x4e7a43cd7eeaa502383fb22f02605cd2094b120455a217c6b6d6f6e6d22886aa.
//
// Solidity: event SetServiceVersion(bytes32 indexed _serviceType, bytes32 indexed _serviceVersion)
func (_ServiceTypeManager *ServiceTypeManagerFilterer) ParseSetServiceVersion(log types.Log) (*ServiceTypeManagerSetServiceVersion, error) {
	event := new(ServiceTypeManagerSetServiceVersion)
	if err := _ServiceTypeManager.contract.UnpackLog(event, "SetServiceVersion", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}
