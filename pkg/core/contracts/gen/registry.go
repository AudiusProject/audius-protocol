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

// RegistryMetaData contains all meta data concerning the Registry contract.
var RegistryMetaData = &bind.MetaData{
	ABI: "[{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"bytes32\",\"name\":\"_name\",\"type\":\"bytes32\"},{\"indexed\":true,\"internalType\":\"address\",\"name\":\"_address\",\"type\":\"address\"}],\"name\":\"ContractAdded\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"bytes32\",\"name\":\"_name\",\"type\":\"bytes32\"},{\"indexed\":true,\"internalType\":\"address\",\"name\":\"_address\",\"type\":\"address\"}],\"name\":\"ContractRemoved\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"bytes32\",\"name\":\"_name\",\"type\":\"bytes32\"},{\"indexed\":true,\"internalType\":\"address\",\"name\":\"_oldAddress\",\"type\":\"address\"},{\"indexed\":true,\"internalType\":\"address\",\"name\":\"_newAddress\",\"type\":\"address\"}],\"name\":\"ContractUpgraded\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"previousOwner\",\"type\":\"address\"},{\"indexed\":true,\"internalType\":\"address\",\"name\":\"newOwner\",\"type\":\"address\"}],\"name\":\"OwnershipTransferred\",\"type\":\"event\"},{\"constant\":true,\"inputs\":[],\"name\":\"isOwner\",\"outputs\":[{\"internalType\":\"bool\",\"name\":\"\",\"type\":\"bool\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"owner\",\"outputs\":[{\"internalType\":\"address\",\"name\":\"\",\"type\":\"address\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[],\"name\":\"renounceOwnership\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"address\",\"name\":\"newOwner\",\"type\":\"address\"}],\"name\":\"transferOwnership\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[],\"name\":\"initialize\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"address\",\"name\":\"sender\",\"type\":\"address\"}],\"name\":\"initialize\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"bytes32\",\"name\":\"_name\",\"type\":\"bytes32\"},{\"internalType\":\"address\",\"name\":\"_address\",\"type\":\"address\"}],\"name\":\"addContract\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"bytes32\",\"name\":\"_name\",\"type\":\"bytes32\"}],\"name\":\"removeContract\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"bytes32\",\"name\":\"_name\",\"type\":\"bytes32\"},{\"internalType\":\"address\",\"name\":\"_newAddress\",\"type\":\"address\"}],\"name\":\"upgradeContract\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[{\"internalType\":\"bytes32\",\"name\":\"_name\",\"type\":\"bytes32\"},{\"internalType\":\"uint256\",\"name\":\"_version\",\"type\":\"uint256\"}],\"name\":\"getContract\",\"outputs\":[{\"internalType\":\"address\",\"name\":\"contractAddr\",\"type\":\"address\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[{\"internalType\":\"bytes32\",\"name\":\"_name\",\"type\":\"bytes32\"}],\"name\":\"getContract\",\"outputs\":[{\"internalType\":\"address\",\"name\":\"contractAddr\",\"type\":\"address\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[{\"internalType\":\"bytes32\",\"name\":\"_name\",\"type\":\"bytes32\"}],\"name\":\"getContractVersionCount\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"}]",
}

// RegistryABI is the input ABI used to generate the binding from.
// Deprecated: Use RegistryMetaData.ABI instead.
var RegistryABI = RegistryMetaData.ABI

// Registry is an auto generated Go binding around an Ethereum contract.
type Registry struct {
	RegistryCaller     // Read-only binding to the contract
	RegistryTransactor // Write-only binding to the contract
	RegistryFilterer   // Log filterer for contract events
}

// RegistryCaller is an auto generated read-only Go binding around an Ethereum contract.
type RegistryCaller struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// RegistryTransactor is an auto generated write-only Go binding around an Ethereum contract.
type RegistryTransactor struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// RegistryFilterer is an auto generated log filtering Go binding around an Ethereum contract events.
type RegistryFilterer struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// RegistrySession is an auto generated Go binding around an Ethereum contract,
// with pre-set call and transact options.
type RegistrySession struct {
	Contract     *Registry         // Generic contract binding to set the session for
	CallOpts     bind.CallOpts     // Call options to use throughout this session
	TransactOpts bind.TransactOpts // Transaction auth options to use throughout this session
}

// RegistryCallerSession is an auto generated read-only Go binding around an Ethereum contract,
// with pre-set call options.
type RegistryCallerSession struct {
	Contract *RegistryCaller // Generic contract caller binding to set the session for
	CallOpts bind.CallOpts   // Call options to use throughout this session
}

// RegistryTransactorSession is an auto generated write-only Go binding around an Ethereum contract,
// with pre-set transact options.
type RegistryTransactorSession struct {
	Contract     *RegistryTransactor // Generic contract transactor binding to set the session for
	TransactOpts bind.TransactOpts   // Transaction auth options to use throughout this session
}

// RegistryRaw is an auto generated low-level Go binding around an Ethereum contract.
type RegistryRaw struct {
	Contract *Registry // Generic contract binding to access the raw methods on
}

// RegistryCallerRaw is an auto generated low-level read-only Go binding around an Ethereum contract.
type RegistryCallerRaw struct {
	Contract *RegistryCaller // Generic read-only contract binding to access the raw methods on
}

// RegistryTransactorRaw is an auto generated low-level write-only Go binding around an Ethereum contract.
type RegistryTransactorRaw struct {
	Contract *RegistryTransactor // Generic write-only contract binding to access the raw methods on
}

// NewRegistry creates a new instance of Registry, bound to a specific deployed contract.
func NewRegistry(address common.Address, backend bind.ContractBackend) (*Registry, error) {
	contract, err := bindRegistry(address, backend, backend, backend)
	if err != nil {
		return nil, err
	}
	return &Registry{RegistryCaller: RegistryCaller{contract: contract}, RegistryTransactor: RegistryTransactor{contract: contract}, RegistryFilterer: RegistryFilterer{contract: contract}}, nil
}

// NewRegistryCaller creates a new read-only instance of Registry, bound to a specific deployed contract.
func NewRegistryCaller(address common.Address, caller bind.ContractCaller) (*RegistryCaller, error) {
	contract, err := bindRegistry(address, caller, nil, nil)
	if err != nil {
		return nil, err
	}
	return &RegistryCaller{contract: contract}, nil
}

// NewRegistryTransactor creates a new write-only instance of Registry, bound to a specific deployed contract.
func NewRegistryTransactor(address common.Address, transactor bind.ContractTransactor) (*RegistryTransactor, error) {
	contract, err := bindRegistry(address, nil, transactor, nil)
	if err != nil {
		return nil, err
	}
	return &RegistryTransactor{contract: contract}, nil
}

// NewRegistryFilterer creates a new log filterer instance of Registry, bound to a specific deployed contract.
func NewRegistryFilterer(address common.Address, filterer bind.ContractFilterer) (*RegistryFilterer, error) {
	contract, err := bindRegistry(address, nil, nil, filterer)
	if err != nil {
		return nil, err
	}
	return &RegistryFilterer{contract: contract}, nil
}

// bindRegistry binds a generic wrapper to an already deployed contract.
func bindRegistry(address common.Address, caller bind.ContractCaller, transactor bind.ContractTransactor, filterer bind.ContractFilterer) (*bind.BoundContract, error) {
	parsed, err := RegistryMetaData.GetAbi()
	if err != nil {
		return nil, err
	}
	return bind.NewBoundContract(address, *parsed, caller, transactor, filterer), nil
}

// Call invokes the (constant) contract method with params as input values and
// sets the output to result. The result type might be a single field for simple
// returns, a slice of interfaces for anonymous returns and a struct for named
// returns.
func (_Registry *RegistryRaw) Call(opts *bind.CallOpts, result *[]interface{}, method string, params ...interface{}) error {
	return _Registry.Contract.RegistryCaller.contract.Call(opts, result, method, params...)
}

// Transfer initiates a plain transaction to move funds to the contract, calling
// its default method if one is available.
func (_Registry *RegistryRaw) Transfer(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _Registry.Contract.RegistryTransactor.contract.Transfer(opts)
}

// Transact invokes the (paid) contract method with params as input values.
func (_Registry *RegistryRaw) Transact(opts *bind.TransactOpts, method string, params ...interface{}) (*types.Transaction, error) {
	return _Registry.Contract.RegistryTransactor.contract.Transact(opts, method, params...)
}

// Call invokes the (constant) contract method with params as input values and
// sets the output to result. The result type might be a single field for simple
// returns, a slice of interfaces for anonymous returns and a struct for named
// returns.
func (_Registry *RegistryCallerRaw) Call(opts *bind.CallOpts, result *[]interface{}, method string, params ...interface{}) error {
	return _Registry.Contract.contract.Call(opts, result, method, params...)
}

// Transfer initiates a plain transaction to move funds to the contract, calling
// its default method if one is available.
func (_Registry *RegistryTransactorRaw) Transfer(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _Registry.Contract.contract.Transfer(opts)
}

// Transact invokes the (paid) contract method with params as input values.
func (_Registry *RegistryTransactorRaw) Transact(opts *bind.TransactOpts, method string, params ...interface{}) (*types.Transaction, error) {
	return _Registry.Contract.contract.Transact(opts, method, params...)
}

// GetContract is a free data retrieval call binding the contract method 0x96f27b29.
//
// Solidity: function getContract(bytes32 _name, uint256 _version) view returns(address contractAddr)
func (_Registry *RegistryCaller) GetContract(opts *bind.CallOpts, _name [32]byte, _version *big.Int) (common.Address, error) {
	var out []interface{}
	err := _Registry.contract.Call(opts, &out, "getContract", _name, _version)

	if err != nil {
		return *new(common.Address), err
	}

	out0 := *abi.ConvertType(out[0], new(common.Address)).(*common.Address)

	return out0, err

}

// GetContract is a free data retrieval call binding the contract method 0x96f27b29.
//
// Solidity: function getContract(bytes32 _name, uint256 _version) view returns(address contractAddr)
func (_Registry *RegistrySession) GetContract(_name [32]byte, _version *big.Int) (common.Address, error) {
	return _Registry.Contract.GetContract(&_Registry.CallOpts, _name, _version)
}

// GetContract is a free data retrieval call binding the contract method 0x96f27b29.
//
// Solidity: function getContract(bytes32 _name, uint256 _version) view returns(address contractAddr)
func (_Registry *RegistryCallerSession) GetContract(_name [32]byte, _version *big.Int) (common.Address, error) {
	return _Registry.Contract.GetContract(&_Registry.CallOpts, _name, _version)
}

// GetContract0 is a free data retrieval call binding the contract method 0xe16c7d98.
//
// Solidity: function getContract(bytes32 _name) view returns(address contractAddr)
func (_Registry *RegistryCaller) GetContract0(opts *bind.CallOpts, _name [32]byte) (common.Address, error) {
	var out []interface{}
	err := _Registry.contract.Call(opts, &out, "getContract0", _name)

	if err != nil {
		return *new(common.Address), err
	}

	out0 := *abi.ConvertType(out[0], new(common.Address)).(*common.Address)

	return out0, err

}

// GetContract0 is a free data retrieval call binding the contract method 0xe16c7d98.
//
// Solidity: function getContract(bytes32 _name) view returns(address contractAddr)
func (_Registry *RegistrySession) GetContract0(_name [32]byte) (common.Address, error) {
	return _Registry.Contract.GetContract0(&_Registry.CallOpts, _name)
}

// GetContract0 is a free data retrieval call binding the contract method 0xe16c7d98.
//
// Solidity: function getContract(bytes32 _name) view returns(address contractAddr)
func (_Registry *RegistryCallerSession) GetContract0(_name [32]byte) (common.Address, error) {
	return _Registry.Contract.GetContract0(&_Registry.CallOpts, _name)
}

// GetContractVersionCount is a free data retrieval call binding the contract method 0xefa6bc43.
//
// Solidity: function getContractVersionCount(bytes32 _name) view returns(uint256)
func (_Registry *RegistryCaller) GetContractVersionCount(opts *bind.CallOpts, _name [32]byte) (*big.Int, error) {
	var out []interface{}
	err := _Registry.contract.Call(opts, &out, "getContractVersionCount", _name)

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

// GetContractVersionCount is a free data retrieval call binding the contract method 0xefa6bc43.
//
// Solidity: function getContractVersionCount(bytes32 _name) view returns(uint256)
func (_Registry *RegistrySession) GetContractVersionCount(_name [32]byte) (*big.Int, error) {
	return _Registry.Contract.GetContractVersionCount(&_Registry.CallOpts, _name)
}

// GetContractVersionCount is a free data retrieval call binding the contract method 0xefa6bc43.
//
// Solidity: function getContractVersionCount(bytes32 _name) view returns(uint256)
func (_Registry *RegistryCallerSession) GetContractVersionCount(_name [32]byte) (*big.Int, error) {
	return _Registry.Contract.GetContractVersionCount(&_Registry.CallOpts, _name)
}

// IsOwner is a free data retrieval call binding the contract method 0x8f32d59b.
//
// Solidity: function isOwner() view returns(bool)
func (_Registry *RegistryCaller) IsOwner(opts *bind.CallOpts) (bool, error) {
	var out []interface{}
	err := _Registry.contract.Call(opts, &out, "isOwner")

	if err != nil {
		return *new(bool), err
	}

	out0 := *abi.ConvertType(out[0], new(bool)).(*bool)

	return out0, err

}

// IsOwner is a free data retrieval call binding the contract method 0x8f32d59b.
//
// Solidity: function isOwner() view returns(bool)
func (_Registry *RegistrySession) IsOwner() (bool, error) {
	return _Registry.Contract.IsOwner(&_Registry.CallOpts)
}

// IsOwner is a free data retrieval call binding the contract method 0x8f32d59b.
//
// Solidity: function isOwner() view returns(bool)
func (_Registry *RegistryCallerSession) IsOwner() (bool, error) {
	return _Registry.Contract.IsOwner(&_Registry.CallOpts)
}

// Owner is a free data retrieval call binding the contract method 0x8da5cb5b.
//
// Solidity: function owner() view returns(address)
func (_Registry *RegistryCaller) Owner(opts *bind.CallOpts) (common.Address, error) {
	var out []interface{}
	err := _Registry.contract.Call(opts, &out, "owner")

	if err != nil {
		return *new(common.Address), err
	}

	out0 := *abi.ConvertType(out[0], new(common.Address)).(*common.Address)

	return out0, err

}

// Owner is a free data retrieval call binding the contract method 0x8da5cb5b.
//
// Solidity: function owner() view returns(address)
func (_Registry *RegistrySession) Owner() (common.Address, error) {
	return _Registry.Contract.Owner(&_Registry.CallOpts)
}

// Owner is a free data retrieval call binding the contract method 0x8da5cb5b.
//
// Solidity: function owner() view returns(address)
func (_Registry *RegistryCallerSession) Owner() (common.Address, error) {
	return _Registry.Contract.Owner(&_Registry.CallOpts)
}

// AddContract is a paid mutator transaction binding the contract method 0x5188f996.
//
// Solidity: function addContract(bytes32 _name, address _address) returns()
func (_Registry *RegistryTransactor) AddContract(opts *bind.TransactOpts, _name [32]byte, _address common.Address) (*types.Transaction, error) {
	return _Registry.contract.Transact(opts, "addContract", _name, _address)
}

// AddContract is a paid mutator transaction binding the contract method 0x5188f996.
//
// Solidity: function addContract(bytes32 _name, address _address) returns()
func (_Registry *RegistrySession) AddContract(_name [32]byte, _address common.Address) (*types.Transaction, error) {
	return _Registry.Contract.AddContract(&_Registry.TransactOpts, _name, _address)
}

// AddContract is a paid mutator transaction binding the contract method 0x5188f996.
//
// Solidity: function addContract(bytes32 _name, address _address) returns()
func (_Registry *RegistryTransactorSession) AddContract(_name [32]byte, _address common.Address) (*types.Transaction, error) {
	return _Registry.Contract.AddContract(&_Registry.TransactOpts, _name, _address)
}

// Initialize is a paid mutator transaction binding the contract method 0x8129fc1c.
//
// Solidity: function initialize() returns()
func (_Registry *RegistryTransactor) Initialize(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _Registry.contract.Transact(opts, "initialize")
}

// Initialize is a paid mutator transaction binding the contract method 0x8129fc1c.
//
// Solidity: function initialize() returns()
func (_Registry *RegistrySession) Initialize() (*types.Transaction, error) {
	return _Registry.Contract.Initialize(&_Registry.TransactOpts)
}

// Initialize is a paid mutator transaction binding the contract method 0x8129fc1c.
//
// Solidity: function initialize() returns()
func (_Registry *RegistryTransactorSession) Initialize() (*types.Transaction, error) {
	return _Registry.Contract.Initialize(&_Registry.TransactOpts)
}

// Initialize0 is a paid mutator transaction binding the contract method 0xc4d66de8.
//
// Solidity: function initialize(address sender) returns()
func (_Registry *RegistryTransactor) Initialize0(opts *bind.TransactOpts, sender common.Address) (*types.Transaction, error) {
	return _Registry.contract.Transact(opts, "initialize0", sender)
}

// Initialize0 is a paid mutator transaction binding the contract method 0xc4d66de8.
//
// Solidity: function initialize(address sender) returns()
func (_Registry *RegistrySession) Initialize0(sender common.Address) (*types.Transaction, error) {
	return _Registry.Contract.Initialize0(&_Registry.TransactOpts, sender)
}

// Initialize0 is a paid mutator transaction binding the contract method 0xc4d66de8.
//
// Solidity: function initialize(address sender) returns()
func (_Registry *RegistryTransactorSession) Initialize0(sender common.Address) (*types.Transaction, error) {
	return _Registry.Contract.Initialize0(&_Registry.TransactOpts, sender)
}

// RemoveContract is a paid mutator transaction binding the contract method 0xa43e04d8.
//
// Solidity: function removeContract(bytes32 _name) returns()
func (_Registry *RegistryTransactor) RemoveContract(opts *bind.TransactOpts, _name [32]byte) (*types.Transaction, error) {
	return _Registry.contract.Transact(opts, "removeContract", _name)
}

// RemoveContract is a paid mutator transaction binding the contract method 0xa43e04d8.
//
// Solidity: function removeContract(bytes32 _name) returns()
func (_Registry *RegistrySession) RemoveContract(_name [32]byte) (*types.Transaction, error) {
	return _Registry.Contract.RemoveContract(&_Registry.TransactOpts, _name)
}

// RemoveContract is a paid mutator transaction binding the contract method 0xa43e04d8.
//
// Solidity: function removeContract(bytes32 _name) returns()
func (_Registry *RegistryTransactorSession) RemoveContract(_name [32]byte) (*types.Transaction, error) {
	return _Registry.Contract.RemoveContract(&_Registry.TransactOpts, _name)
}

// RenounceOwnership is a paid mutator transaction binding the contract method 0x715018a6.
//
// Solidity: function renounceOwnership() returns()
func (_Registry *RegistryTransactor) RenounceOwnership(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _Registry.contract.Transact(opts, "renounceOwnership")
}

// RenounceOwnership is a paid mutator transaction binding the contract method 0x715018a6.
//
// Solidity: function renounceOwnership() returns()
func (_Registry *RegistrySession) RenounceOwnership() (*types.Transaction, error) {
	return _Registry.Contract.RenounceOwnership(&_Registry.TransactOpts)
}

// RenounceOwnership is a paid mutator transaction binding the contract method 0x715018a6.
//
// Solidity: function renounceOwnership() returns()
func (_Registry *RegistryTransactorSession) RenounceOwnership() (*types.Transaction, error) {
	return _Registry.Contract.RenounceOwnership(&_Registry.TransactOpts)
}

// TransferOwnership is a paid mutator transaction binding the contract method 0xf2fde38b.
//
// Solidity: function transferOwnership(address newOwner) returns()
func (_Registry *RegistryTransactor) TransferOwnership(opts *bind.TransactOpts, newOwner common.Address) (*types.Transaction, error) {
	return _Registry.contract.Transact(opts, "transferOwnership", newOwner)
}

// TransferOwnership is a paid mutator transaction binding the contract method 0xf2fde38b.
//
// Solidity: function transferOwnership(address newOwner) returns()
func (_Registry *RegistrySession) TransferOwnership(newOwner common.Address) (*types.Transaction, error) {
	return _Registry.Contract.TransferOwnership(&_Registry.TransactOpts, newOwner)
}

// TransferOwnership is a paid mutator transaction binding the contract method 0xf2fde38b.
//
// Solidity: function transferOwnership(address newOwner) returns()
func (_Registry *RegistryTransactorSession) TransferOwnership(newOwner common.Address) (*types.Transaction, error) {
	return _Registry.Contract.TransferOwnership(&_Registry.TransactOpts, newOwner)
}

// UpgradeContract is a paid mutator transaction binding the contract method 0x9c44d17a.
//
// Solidity: function upgradeContract(bytes32 _name, address _newAddress) returns()
func (_Registry *RegistryTransactor) UpgradeContract(opts *bind.TransactOpts, _name [32]byte, _newAddress common.Address) (*types.Transaction, error) {
	return _Registry.contract.Transact(opts, "upgradeContract", _name, _newAddress)
}

// UpgradeContract is a paid mutator transaction binding the contract method 0x9c44d17a.
//
// Solidity: function upgradeContract(bytes32 _name, address _newAddress) returns()
func (_Registry *RegistrySession) UpgradeContract(_name [32]byte, _newAddress common.Address) (*types.Transaction, error) {
	return _Registry.Contract.UpgradeContract(&_Registry.TransactOpts, _name, _newAddress)
}

// UpgradeContract is a paid mutator transaction binding the contract method 0x9c44d17a.
//
// Solidity: function upgradeContract(bytes32 _name, address _newAddress) returns()
func (_Registry *RegistryTransactorSession) UpgradeContract(_name [32]byte, _newAddress common.Address) (*types.Transaction, error) {
	return _Registry.Contract.UpgradeContract(&_Registry.TransactOpts, _name, _newAddress)
}

// RegistryContractAddedIterator is returned from FilterContractAdded and is used to iterate over the raw logs and unpacked data for ContractAdded events raised by the Registry contract.
type RegistryContractAddedIterator struct {
	Event *RegistryContractAdded // Event containing the contract specifics and raw log

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
func (it *RegistryContractAddedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(RegistryContractAdded)
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
		it.Event = new(RegistryContractAdded)
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
func (it *RegistryContractAddedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *RegistryContractAddedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// RegistryContractAdded represents a ContractAdded event raised by the Registry contract.
type RegistryContractAdded struct {
	Name    [32]byte
	Address common.Address
	Raw     types.Log // Blockchain specific contextual infos
}

// FilterContractAdded is a free log retrieval operation binding the contract event 0x643cefa5894755d9e02f78cb384977d4ee3a06c8394b062a290e19176e9c69de.
//
// Solidity: event ContractAdded(bytes32 indexed _name, address indexed _address)
func (_Registry *RegistryFilterer) FilterContractAdded(opts *bind.FilterOpts, _name [][32]byte, _address []common.Address) (*RegistryContractAddedIterator, error) {

	var _nameRule []interface{}
	for _, _nameItem := range _name {
		_nameRule = append(_nameRule, _nameItem)
	}
	var _addressRule []interface{}
	for _, _addressItem := range _address {
		_addressRule = append(_addressRule, _addressItem)
	}

	logs, sub, err := _Registry.contract.FilterLogs(opts, "ContractAdded", _nameRule, _addressRule)
	if err != nil {
		return nil, err
	}
	return &RegistryContractAddedIterator{contract: _Registry.contract, event: "ContractAdded", logs: logs, sub: sub}, nil
}

// WatchContractAdded is a free log subscription operation binding the contract event 0x643cefa5894755d9e02f78cb384977d4ee3a06c8394b062a290e19176e9c69de.
//
// Solidity: event ContractAdded(bytes32 indexed _name, address indexed _address)
func (_Registry *RegistryFilterer) WatchContractAdded(opts *bind.WatchOpts, sink chan<- *RegistryContractAdded, _name [][32]byte, _address []common.Address) (event.Subscription, error) {

	var _nameRule []interface{}
	for _, _nameItem := range _name {
		_nameRule = append(_nameRule, _nameItem)
	}
	var _addressRule []interface{}
	for _, _addressItem := range _address {
		_addressRule = append(_addressRule, _addressItem)
	}

	logs, sub, err := _Registry.contract.WatchLogs(opts, "ContractAdded", _nameRule, _addressRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(RegistryContractAdded)
				if err := _Registry.contract.UnpackLog(event, "ContractAdded", log); err != nil {
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

// ParseContractAdded is a log parse operation binding the contract event 0x643cefa5894755d9e02f78cb384977d4ee3a06c8394b062a290e19176e9c69de.
//
// Solidity: event ContractAdded(bytes32 indexed _name, address indexed _address)
func (_Registry *RegistryFilterer) ParseContractAdded(log types.Log) (*RegistryContractAdded, error) {
	event := new(RegistryContractAdded)
	if err := _Registry.contract.UnpackLog(event, "ContractAdded", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// RegistryContractRemovedIterator is returned from FilterContractRemoved and is used to iterate over the raw logs and unpacked data for ContractRemoved events raised by the Registry contract.
type RegistryContractRemovedIterator struct {
	Event *RegistryContractRemoved // Event containing the contract specifics and raw log

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
func (it *RegistryContractRemovedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(RegistryContractRemoved)
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
		it.Event = new(RegistryContractRemoved)
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
func (it *RegistryContractRemovedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *RegistryContractRemovedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// RegistryContractRemoved represents a ContractRemoved event raised by the Registry contract.
type RegistryContractRemoved struct {
	Name    [32]byte
	Address common.Address
	Raw     types.Log // Blockchain specific contextual infos
}

// FilterContractRemoved is a free log retrieval operation binding the contract event 0x266f45300baf5abcdb8653dcec68c843b20fb984df2fae4cd1e3fecaf4619952.
//
// Solidity: event ContractRemoved(bytes32 indexed _name, address indexed _address)
func (_Registry *RegistryFilterer) FilterContractRemoved(opts *bind.FilterOpts, _name [][32]byte, _address []common.Address) (*RegistryContractRemovedIterator, error) {

	var _nameRule []interface{}
	for _, _nameItem := range _name {
		_nameRule = append(_nameRule, _nameItem)
	}
	var _addressRule []interface{}
	for _, _addressItem := range _address {
		_addressRule = append(_addressRule, _addressItem)
	}

	logs, sub, err := _Registry.contract.FilterLogs(opts, "ContractRemoved", _nameRule, _addressRule)
	if err != nil {
		return nil, err
	}
	return &RegistryContractRemovedIterator{contract: _Registry.contract, event: "ContractRemoved", logs: logs, sub: sub}, nil
}

// WatchContractRemoved is a free log subscription operation binding the contract event 0x266f45300baf5abcdb8653dcec68c843b20fb984df2fae4cd1e3fecaf4619952.
//
// Solidity: event ContractRemoved(bytes32 indexed _name, address indexed _address)
func (_Registry *RegistryFilterer) WatchContractRemoved(opts *bind.WatchOpts, sink chan<- *RegistryContractRemoved, _name [][32]byte, _address []common.Address) (event.Subscription, error) {

	var _nameRule []interface{}
	for _, _nameItem := range _name {
		_nameRule = append(_nameRule, _nameItem)
	}
	var _addressRule []interface{}
	for _, _addressItem := range _address {
		_addressRule = append(_addressRule, _addressItem)
	}

	logs, sub, err := _Registry.contract.WatchLogs(opts, "ContractRemoved", _nameRule, _addressRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(RegistryContractRemoved)
				if err := _Registry.contract.UnpackLog(event, "ContractRemoved", log); err != nil {
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

// ParseContractRemoved is a log parse operation binding the contract event 0x266f45300baf5abcdb8653dcec68c843b20fb984df2fae4cd1e3fecaf4619952.
//
// Solidity: event ContractRemoved(bytes32 indexed _name, address indexed _address)
func (_Registry *RegistryFilterer) ParseContractRemoved(log types.Log) (*RegistryContractRemoved, error) {
	event := new(RegistryContractRemoved)
	if err := _Registry.contract.UnpackLog(event, "ContractRemoved", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// RegistryContractUpgradedIterator is returned from FilterContractUpgraded and is used to iterate over the raw logs and unpacked data for ContractUpgraded events raised by the Registry contract.
type RegistryContractUpgradedIterator struct {
	Event *RegistryContractUpgraded // Event containing the contract specifics and raw log

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
func (it *RegistryContractUpgradedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(RegistryContractUpgraded)
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
		it.Event = new(RegistryContractUpgraded)
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
func (it *RegistryContractUpgradedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *RegistryContractUpgradedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// RegistryContractUpgraded represents a ContractUpgraded event raised by the Registry contract.
type RegistryContractUpgraded struct {
	Name       [32]byte
	OldAddress common.Address
	NewAddress common.Address
	Raw        types.Log // Blockchain specific contextual infos
}

// FilterContractUpgraded is a free log retrieval operation binding the contract event 0x8b3c9342e23b53b74b0f760c251b1b6b5553d1c3d23239357405f70d5fe43d55.
//
// Solidity: event ContractUpgraded(bytes32 indexed _name, address indexed _oldAddress, address indexed _newAddress)
func (_Registry *RegistryFilterer) FilterContractUpgraded(opts *bind.FilterOpts, _name [][32]byte, _oldAddress []common.Address, _newAddress []common.Address) (*RegistryContractUpgradedIterator, error) {

	var _nameRule []interface{}
	for _, _nameItem := range _name {
		_nameRule = append(_nameRule, _nameItem)
	}
	var _oldAddressRule []interface{}
	for _, _oldAddressItem := range _oldAddress {
		_oldAddressRule = append(_oldAddressRule, _oldAddressItem)
	}
	var _newAddressRule []interface{}
	for _, _newAddressItem := range _newAddress {
		_newAddressRule = append(_newAddressRule, _newAddressItem)
	}

	logs, sub, err := _Registry.contract.FilterLogs(opts, "ContractUpgraded", _nameRule, _oldAddressRule, _newAddressRule)
	if err != nil {
		return nil, err
	}
	return &RegistryContractUpgradedIterator{contract: _Registry.contract, event: "ContractUpgraded", logs: logs, sub: sub}, nil
}

// WatchContractUpgraded is a free log subscription operation binding the contract event 0x8b3c9342e23b53b74b0f760c251b1b6b5553d1c3d23239357405f70d5fe43d55.
//
// Solidity: event ContractUpgraded(bytes32 indexed _name, address indexed _oldAddress, address indexed _newAddress)
func (_Registry *RegistryFilterer) WatchContractUpgraded(opts *bind.WatchOpts, sink chan<- *RegistryContractUpgraded, _name [][32]byte, _oldAddress []common.Address, _newAddress []common.Address) (event.Subscription, error) {

	var _nameRule []interface{}
	for _, _nameItem := range _name {
		_nameRule = append(_nameRule, _nameItem)
	}
	var _oldAddressRule []interface{}
	for _, _oldAddressItem := range _oldAddress {
		_oldAddressRule = append(_oldAddressRule, _oldAddressItem)
	}
	var _newAddressRule []interface{}
	for _, _newAddressItem := range _newAddress {
		_newAddressRule = append(_newAddressRule, _newAddressItem)
	}

	logs, sub, err := _Registry.contract.WatchLogs(opts, "ContractUpgraded", _nameRule, _oldAddressRule, _newAddressRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(RegistryContractUpgraded)
				if err := _Registry.contract.UnpackLog(event, "ContractUpgraded", log); err != nil {
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

// ParseContractUpgraded is a log parse operation binding the contract event 0x8b3c9342e23b53b74b0f760c251b1b6b5553d1c3d23239357405f70d5fe43d55.
//
// Solidity: event ContractUpgraded(bytes32 indexed _name, address indexed _oldAddress, address indexed _newAddress)
func (_Registry *RegistryFilterer) ParseContractUpgraded(log types.Log) (*RegistryContractUpgraded, error) {
	event := new(RegistryContractUpgraded)
	if err := _Registry.contract.UnpackLog(event, "ContractUpgraded", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// RegistryOwnershipTransferredIterator is returned from FilterOwnershipTransferred and is used to iterate over the raw logs and unpacked data for OwnershipTransferred events raised by the Registry contract.
type RegistryOwnershipTransferredIterator struct {
	Event *RegistryOwnershipTransferred // Event containing the contract specifics and raw log

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
func (it *RegistryOwnershipTransferredIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(RegistryOwnershipTransferred)
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
		it.Event = new(RegistryOwnershipTransferred)
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
func (it *RegistryOwnershipTransferredIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *RegistryOwnershipTransferredIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// RegistryOwnershipTransferred represents a OwnershipTransferred event raised by the Registry contract.
type RegistryOwnershipTransferred struct {
	PreviousOwner common.Address
	NewOwner      common.Address
	Raw           types.Log // Blockchain specific contextual infos
}

// FilterOwnershipTransferred is a free log retrieval operation binding the contract event 0x8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e0.
//
// Solidity: event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)
func (_Registry *RegistryFilterer) FilterOwnershipTransferred(opts *bind.FilterOpts, previousOwner []common.Address, newOwner []common.Address) (*RegistryOwnershipTransferredIterator, error) {

	var previousOwnerRule []interface{}
	for _, previousOwnerItem := range previousOwner {
		previousOwnerRule = append(previousOwnerRule, previousOwnerItem)
	}
	var newOwnerRule []interface{}
	for _, newOwnerItem := range newOwner {
		newOwnerRule = append(newOwnerRule, newOwnerItem)
	}

	logs, sub, err := _Registry.contract.FilterLogs(opts, "OwnershipTransferred", previousOwnerRule, newOwnerRule)
	if err != nil {
		return nil, err
	}
	return &RegistryOwnershipTransferredIterator{contract: _Registry.contract, event: "OwnershipTransferred", logs: logs, sub: sub}, nil
}

// WatchOwnershipTransferred is a free log subscription operation binding the contract event 0x8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e0.
//
// Solidity: event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)
func (_Registry *RegistryFilterer) WatchOwnershipTransferred(opts *bind.WatchOpts, sink chan<- *RegistryOwnershipTransferred, previousOwner []common.Address, newOwner []common.Address) (event.Subscription, error) {

	var previousOwnerRule []interface{}
	for _, previousOwnerItem := range previousOwner {
		previousOwnerRule = append(previousOwnerRule, previousOwnerItem)
	}
	var newOwnerRule []interface{}
	for _, newOwnerItem := range newOwner {
		newOwnerRule = append(newOwnerRule, newOwnerItem)
	}

	logs, sub, err := _Registry.contract.WatchLogs(opts, "OwnershipTransferred", previousOwnerRule, newOwnerRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(RegistryOwnershipTransferred)
				if err := _Registry.contract.UnpackLog(event, "OwnershipTransferred", log); err != nil {
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

// ParseOwnershipTransferred is a log parse operation binding the contract event 0x8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e0.
//
// Solidity: event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)
func (_Registry *RegistryFilterer) ParseOwnershipTransferred(log types.Log) (*RegistryOwnershipTransferred, error) {
	event := new(RegistryOwnershipTransferred)
	if err := _Registry.contract.UnpackLog(event, "OwnershipTransferred", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}
