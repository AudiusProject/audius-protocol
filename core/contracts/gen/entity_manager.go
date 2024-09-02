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

// EntityManagerMetaData contains all meta data concerning the EntityManager contract.
var EntityManagerMetaData = &bind.MetaData{
	ABI: "[{\"anonymous\":false,\"inputs\":[{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"_userId\",\"type\":\"uint256\"},{\"indexed\":false,\"internalType\":\"address\",\"name\":\"_signer\",\"type\":\"address\"},{\"indexed\":false,\"internalType\":\"string\",\"name\":\"_entityType\",\"type\":\"string\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"_entityId\",\"type\":\"uint256\"},{\"indexed\":false,\"internalType\":\"string\",\"name\":\"_metadata\",\"type\":\"string\"},{\"indexed\":false,\"internalType\":\"string\",\"name\":\"_action\",\"type\":\"string\"}],\"name\":\"ManageEntity\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"_userId\",\"type\":\"uint256\"},{\"indexed\":false,\"internalType\":\"bool\",\"name\":\"_isVerified\",\"type\":\"bool\"}],\"name\":\"ManageIsVerified\",\"type\":\"event\"},{\"constant\":true,\"inputs\":[{\"internalType\":\"bytes32\",\"name\":\"\",\"type\":\"bytes32\"}],\"name\":\"usedSignatures\",\"outputs\":[{\"internalType\":\"bool\",\"name\":\"\",\"type\":\"bool\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"string\",\"name\":\"name\",\"type\":\"string\"},{\"internalType\":\"string\",\"name\":\"version\",\"type\":\"string\"},{\"internalType\":\"uint256\",\"name\":\"chainId\",\"type\":\"uint256\"}],\"name\":\"initialize\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"address\",\"name\":\"_verifierAddress\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"_networkId\",\"type\":\"uint256\"}],\"name\":\"initialize\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"_userId\",\"type\":\"uint256\"},{\"internalType\":\"string\",\"name\":\"_entityType\",\"type\":\"string\"},{\"internalType\":\"uint256\",\"name\":\"_entityId\",\"type\":\"uint256\"},{\"internalType\":\"string\",\"name\":\"_action\",\"type\":\"string\"},{\"internalType\":\"string\",\"name\":\"_metadata\",\"type\":\"string\"},{\"internalType\":\"bytes32\",\"name\":\"_nonce\",\"type\":\"bytes32\"},{\"internalType\":\"bytes\",\"name\":\"_subjectSig\",\"type\":\"bytes\"}],\"name\":\"manageEntity\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"_userId\",\"type\":\"uint256\"},{\"internalType\":\"bool\",\"name\":\"_isVerified\",\"type\":\"bool\"}],\"name\":\"manageIsVerified\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"}]",
}

// EntityManagerABI is the input ABI used to generate the binding from.
// Deprecated: Use EntityManagerMetaData.ABI instead.
var EntityManagerABI = EntityManagerMetaData.ABI

// EntityManager is an auto generated Go binding around an Ethereum contract.
type EntityManager struct {
	EntityManagerCaller     // Read-only binding to the contract
	EntityManagerTransactor // Write-only binding to the contract
	EntityManagerFilterer   // Log filterer for contract events
}

// EntityManagerCaller is an auto generated read-only Go binding around an Ethereum contract.
type EntityManagerCaller struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// EntityManagerTransactor is an auto generated write-only Go binding around an Ethereum contract.
type EntityManagerTransactor struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// EntityManagerFilterer is an auto generated log filtering Go binding around an Ethereum contract events.
type EntityManagerFilterer struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// EntityManagerSession is an auto generated Go binding around an Ethereum contract,
// with pre-set call and transact options.
type EntityManagerSession struct {
	Contract     *EntityManager    // Generic contract binding to set the session for
	CallOpts     bind.CallOpts     // Call options to use throughout this session
	TransactOpts bind.TransactOpts // Transaction auth options to use throughout this session
}

// EntityManagerCallerSession is an auto generated read-only Go binding around an Ethereum contract,
// with pre-set call options.
type EntityManagerCallerSession struct {
	Contract *EntityManagerCaller // Generic contract caller binding to set the session for
	CallOpts bind.CallOpts        // Call options to use throughout this session
}

// EntityManagerTransactorSession is an auto generated write-only Go binding around an Ethereum contract,
// with pre-set transact options.
type EntityManagerTransactorSession struct {
	Contract     *EntityManagerTransactor // Generic contract transactor binding to set the session for
	TransactOpts bind.TransactOpts        // Transaction auth options to use throughout this session
}

// EntityManagerRaw is an auto generated low-level Go binding around an Ethereum contract.
type EntityManagerRaw struct {
	Contract *EntityManager // Generic contract binding to access the raw methods on
}

// EntityManagerCallerRaw is an auto generated low-level read-only Go binding around an Ethereum contract.
type EntityManagerCallerRaw struct {
	Contract *EntityManagerCaller // Generic read-only contract binding to access the raw methods on
}

// EntityManagerTransactorRaw is an auto generated low-level write-only Go binding around an Ethereum contract.
type EntityManagerTransactorRaw struct {
	Contract *EntityManagerTransactor // Generic write-only contract binding to access the raw methods on
}

// NewEntityManager creates a new instance of EntityManager, bound to a specific deployed contract.
func NewEntityManager(address common.Address, backend bind.ContractBackend) (*EntityManager, error) {
	contract, err := bindEntityManager(address, backend, backend, backend)
	if err != nil {
		return nil, err
	}
	return &EntityManager{EntityManagerCaller: EntityManagerCaller{contract: contract}, EntityManagerTransactor: EntityManagerTransactor{contract: contract}, EntityManagerFilterer: EntityManagerFilterer{contract: contract}}, nil
}

// NewEntityManagerCaller creates a new read-only instance of EntityManager, bound to a specific deployed contract.
func NewEntityManagerCaller(address common.Address, caller bind.ContractCaller) (*EntityManagerCaller, error) {
	contract, err := bindEntityManager(address, caller, nil, nil)
	if err != nil {
		return nil, err
	}
	return &EntityManagerCaller{contract: contract}, nil
}

// NewEntityManagerTransactor creates a new write-only instance of EntityManager, bound to a specific deployed contract.
func NewEntityManagerTransactor(address common.Address, transactor bind.ContractTransactor) (*EntityManagerTransactor, error) {
	contract, err := bindEntityManager(address, nil, transactor, nil)
	if err != nil {
		return nil, err
	}
	return &EntityManagerTransactor{contract: contract}, nil
}

// NewEntityManagerFilterer creates a new log filterer instance of EntityManager, bound to a specific deployed contract.
func NewEntityManagerFilterer(address common.Address, filterer bind.ContractFilterer) (*EntityManagerFilterer, error) {
	contract, err := bindEntityManager(address, nil, nil, filterer)
	if err != nil {
		return nil, err
	}
	return &EntityManagerFilterer{contract: contract}, nil
}

// bindEntityManager binds a generic wrapper to an already deployed contract.
func bindEntityManager(address common.Address, caller bind.ContractCaller, transactor bind.ContractTransactor, filterer bind.ContractFilterer) (*bind.BoundContract, error) {
	parsed, err := EntityManagerMetaData.GetAbi()
	if err != nil {
		return nil, err
	}
	return bind.NewBoundContract(address, *parsed, caller, transactor, filterer), nil
}

// Call invokes the (constant) contract method with params as input values and
// sets the output to result. The result type might be a single field for simple
// returns, a slice of interfaces for anonymous returns and a struct for named
// returns.
func (_EntityManager *EntityManagerRaw) Call(opts *bind.CallOpts, result *[]interface{}, method string, params ...interface{}) error {
	return _EntityManager.Contract.EntityManagerCaller.contract.Call(opts, result, method, params...)
}

// Transfer initiates a plain transaction to move funds to the contract, calling
// its default method if one is available.
func (_EntityManager *EntityManagerRaw) Transfer(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _EntityManager.Contract.EntityManagerTransactor.contract.Transfer(opts)
}

// Transact invokes the (paid) contract method with params as input values.
func (_EntityManager *EntityManagerRaw) Transact(opts *bind.TransactOpts, method string, params ...interface{}) (*types.Transaction, error) {
	return _EntityManager.Contract.EntityManagerTransactor.contract.Transact(opts, method, params...)
}

// Call invokes the (constant) contract method with params as input values and
// sets the output to result. The result type might be a single field for simple
// returns, a slice of interfaces for anonymous returns and a struct for named
// returns.
func (_EntityManager *EntityManagerCallerRaw) Call(opts *bind.CallOpts, result *[]interface{}, method string, params ...interface{}) error {
	return _EntityManager.Contract.contract.Call(opts, result, method, params...)
}

// Transfer initiates a plain transaction to move funds to the contract, calling
// its default method if one is available.
func (_EntityManager *EntityManagerTransactorRaw) Transfer(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _EntityManager.Contract.contract.Transfer(opts)
}

// Transact invokes the (paid) contract method with params as input values.
func (_EntityManager *EntityManagerTransactorRaw) Transact(opts *bind.TransactOpts, method string, params ...interface{}) (*types.Transaction, error) {
	return _EntityManager.Contract.contract.Transact(opts, method, params...)
}

// UsedSignatures is a free data retrieval call binding the contract method 0xf978fd61.
//
// Solidity: function usedSignatures(bytes32 ) view returns(bool)
func (_EntityManager *EntityManagerCaller) UsedSignatures(opts *bind.CallOpts, arg0 [32]byte) (bool, error) {
	var out []interface{}
	err := _EntityManager.contract.Call(opts, &out, "usedSignatures", arg0)

	if err != nil {
		return *new(bool), err
	}

	out0 := *abi.ConvertType(out[0], new(bool)).(*bool)

	return out0, err

}

// UsedSignatures is a free data retrieval call binding the contract method 0xf978fd61.
//
// Solidity: function usedSignatures(bytes32 ) view returns(bool)
func (_EntityManager *EntityManagerSession) UsedSignatures(arg0 [32]byte) (bool, error) {
	return _EntityManager.Contract.UsedSignatures(&_EntityManager.CallOpts, arg0)
}

// UsedSignatures is a free data retrieval call binding the contract method 0xf978fd61.
//
// Solidity: function usedSignatures(bytes32 ) view returns(bool)
func (_EntityManager *EntityManagerCallerSession) UsedSignatures(arg0 [32]byte) (bool, error) {
	return _EntityManager.Contract.UsedSignatures(&_EntityManager.CallOpts, arg0)
}

// Initialize is a paid mutator transaction binding the contract method 0xb119490e.
//
// Solidity: function initialize(string name, string version, uint256 chainId) returns()
func (_EntityManager *EntityManagerTransactor) Initialize(opts *bind.TransactOpts, name string, version string, chainId *big.Int) (*types.Transaction, error) {
	return _EntityManager.contract.Transact(opts, "initialize", name, version, chainId)
}

// Initialize is a paid mutator transaction binding the contract method 0xb119490e.
//
// Solidity: function initialize(string name, string version, uint256 chainId) returns()
func (_EntityManager *EntityManagerSession) Initialize(name string, version string, chainId *big.Int) (*types.Transaction, error) {
	return _EntityManager.Contract.Initialize(&_EntityManager.TransactOpts, name, version, chainId)
}

// Initialize is a paid mutator transaction binding the contract method 0xb119490e.
//
// Solidity: function initialize(string name, string version, uint256 chainId) returns()
func (_EntityManager *EntityManagerTransactorSession) Initialize(name string, version string, chainId *big.Int) (*types.Transaction, error) {
	return _EntityManager.Contract.Initialize(&_EntityManager.TransactOpts, name, version, chainId)
}

// Initialize0 is a paid mutator transaction binding the contract method 0xcd6dc687.
//
// Solidity: function initialize(address _verifierAddress, uint256 _networkId) returns()
func (_EntityManager *EntityManagerTransactor) Initialize0(opts *bind.TransactOpts, _verifierAddress common.Address, _networkId *big.Int) (*types.Transaction, error) {
	return _EntityManager.contract.Transact(opts, "initialize0", _verifierAddress, _networkId)
}

// Initialize0 is a paid mutator transaction binding the contract method 0xcd6dc687.
//
// Solidity: function initialize(address _verifierAddress, uint256 _networkId) returns()
func (_EntityManager *EntityManagerSession) Initialize0(_verifierAddress common.Address, _networkId *big.Int) (*types.Transaction, error) {
	return _EntityManager.Contract.Initialize0(&_EntityManager.TransactOpts, _verifierAddress, _networkId)
}

// Initialize0 is a paid mutator transaction binding the contract method 0xcd6dc687.
//
// Solidity: function initialize(address _verifierAddress, uint256 _networkId) returns()
func (_EntityManager *EntityManagerTransactorSession) Initialize0(_verifierAddress common.Address, _networkId *big.Int) (*types.Transaction, error) {
	return _EntityManager.Contract.Initialize0(&_EntityManager.TransactOpts, _verifierAddress, _networkId)
}

// ManageEntity is a paid mutator transaction binding the contract method 0xd622c72d.
//
// Solidity: function manageEntity(uint256 _userId, string _entityType, uint256 _entityId, string _action, string _metadata, bytes32 _nonce, bytes _subjectSig) returns()
func (_EntityManager *EntityManagerTransactor) ManageEntity(opts *bind.TransactOpts, _userId *big.Int, _entityType string, _entityId *big.Int, _action string, _metadata string, _nonce [32]byte, _subjectSig []byte) (*types.Transaction, error) {
	return _EntityManager.contract.Transact(opts, "manageEntity", _userId, _entityType, _entityId, _action, _metadata, _nonce, _subjectSig)
}

// ManageEntity is a paid mutator transaction binding the contract method 0xd622c72d.
//
// Solidity: function manageEntity(uint256 _userId, string _entityType, uint256 _entityId, string _action, string _metadata, bytes32 _nonce, bytes _subjectSig) returns()
func (_EntityManager *EntityManagerSession) ManageEntity(_userId *big.Int, _entityType string, _entityId *big.Int, _action string, _metadata string, _nonce [32]byte, _subjectSig []byte) (*types.Transaction, error) {
	return _EntityManager.Contract.ManageEntity(&_EntityManager.TransactOpts, _userId, _entityType, _entityId, _action, _metadata, _nonce, _subjectSig)
}

// ManageEntity is a paid mutator transaction binding the contract method 0xd622c72d.
//
// Solidity: function manageEntity(uint256 _userId, string _entityType, uint256 _entityId, string _action, string _metadata, bytes32 _nonce, bytes _subjectSig) returns()
func (_EntityManager *EntityManagerTransactorSession) ManageEntity(_userId *big.Int, _entityType string, _entityId *big.Int, _action string, _metadata string, _nonce [32]byte, _subjectSig []byte) (*types.Transaction, error) {
	return _EntityManager.Contract.ManageEntity(&_EntityManager.TransactOpts, _userId, _entityType, _entityId, _action, _metadata, _nonce, _subjectSig)
}

// ManageIsVerified is a paid mutator transaction binding the contract method 0x8009a3af.
//
// Solidity: function manageIsVerified(uint256 _userId, bool _isVerified) returns()
func (_EntityManager *EntityManagerTransactor) ManageIsVerified(opts *bind.TransactOpts, _userId *big.Int, _isVerified bool) (*types.Transaction, error) {
	return _EntityManager.contract.Transact(opts, "manageIsVerified", _userId, _isVerified)
}

// ManageIsVerified is a paid mutator transaction binding the contract method 0x8009a3af.
//
// Solidity: function manageIsVerified(uint256 _userId, bool _isVerified) returns()
func (_EntityManager *EntityManagerSession) ManageIsVerified(_userId *big.Int, _isVerified bool) (*types.Transaction, error) {
	return _EntityManager.Contract.ManageIsVerified(&_EntityManager.TransactOpts, _userId, _isVerified)
}

// ManageIsVerified is a paid mutator transaction binding the contract method 0x8009a3af.
//
// Solidity: function manageIsVerified(uint256 _userId, bool _isVerified) returns()
func (_EntityManager *EntityManagerTransactorSession) ManageIsVerified(_userId *big.Int, _isVerified bool) (*types.Transaction, error) {
	return _EntityManager.Contract.ManageIsVerified(&_EntityManager.TransactOpts, _userId, _isVerified)
}

// EntityManagerManageEntityIterator is returned from FilterManageEntity and is used to iterate over the raw logs and unpacked data for ManageEntity events raised by the EntityManager contract.
type EntityManagerManageEntityIterator struct {
	Event *EntityManagerManageEntity // Event containing the contract specifics and raw log

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
func (it *EntityManagerManageEntityIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(EntityManagerManageEntity)
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
		it.Event = new(EntityManagerManageEntity)
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
func (it *EntityManagerManageEntityIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *EntityManagerManageEntityIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// EntityManagerManageEntity represents a ManageEntity event raised by the EntityManager contract.
type EntityManagerManageEntity struct {
	UserId     *big.Int
	Signer     common.Address
	EntityType string
	EntityId   *big.Int
	Metadata   string
	Action     string
	Raw        types.Log // Blockchain specific contextual infos
}

// FilterManageEntity is a free log retrieval operation binding the contract event 0x772d62d21cc8467a14127f11ab2c094d32e5b521433cefba5a7312fc464d88b4.
//
// Solidity: event ManageEntity(uint256 _userId, address _signer, string _entityType, uint256 _entityId, string _metadata, string _action)
func (_EntityManager *EntityManagerFilterer) FilterManageEntity(opts *bind.FilterOpts) (*EntityManagerManageEntityIterator, error) {

	logs, sub, err := _EntityManager.contract.FilterLogs(opts, "ManageEntity")
	if err != nil {
		return nil, err
	}
	return &EntityManagerManageEntityIterator{contract: _EntityManager.contract, event: "ManageEntity", logs: logs, sub: sub}, nil
}

// WatchManageEntity is a free log subscription operation binding the contract event 0x772d62d21cc8467a14127f11ab2c094d32e5b521433cefba5a7312fc464d88b4.
//
// Solidity: event ManageEntity(uint256 _userId, address _signer, string _entityType, uint256 _entityId, string _metadata, string _action)
func (_EntityManager *EntityManagerFilterer) WatchManageEntity(opts *bind.WatchOpts, sink chan<- *EntityManagerManageEntity) (event.Subscription, error) {

	logs, sub, err := _EntityManager.contract.WatchLogs(opts, "ManageEntity")
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(EntityManagerManageEntity)
				if err := _EntityManager.contract.UnpackLog(event, "ManageEntity", log); err != nil {
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

// ParseManageEntity is a log parse operation binding the contract event 0x772d62d21cc8467a14127f11ab2c094d32e5b521433cefba5a7312fc464d88b4.
//
// Solidity: event ManageEntity(uint256 _userId, address _signer, string _entityType, uint256 _entityId, string _metadata, string _action)
func (_EntityManager *EntityManagerFilterer) ParseManageEntity(log types.Log) (*EntityManagerManageEntity, error) {
	event := new(EntityManagerManageEntity)
	if err := _EntityManager.contract.UnpackLog(event, "ManageEntity", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// EntityManagerManageIsVerifiedIterator is returned from FilterManageIsVerified and is used to iterate over the raw logs and unpacked data for ManageIsVerified events raised by the EntityManager contract.
type EntityManagerManageIsVerifiedIterator struct {
	Event *EntityManagerManageIsVerified // Event containing the contract specifics and raw log

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
func (it *EntityManagerManageIsVerifiedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(EntityManagerManageIsVerified)
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
		it.Event = new(EntityManagerManageIsVerified)
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
func (it *EntityManagerManageIsVerifiedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *EntityManagerManageIsVerifiedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// EntityManagerManageIsVerified represents a ManageIsVerified event raised by the EntityManager contract.
type EntityManagerManageIsVerified struct {
	UserId     *big.Int
	IsVerified bool
	Raw        types.Log // Blockchain specific contextual infos
}

// FilterManageIsVerified is a free log retrieval operation binding the contract event 0xfb248912b777b85e53adcf3feae8ccabfc321b7e6d8eeefb0faaaee4af0b6770.
//
// Solidity: event ManageIsVerified(uint256 _userId, bool _isVerified)
func (_EntityManager *EntityManagerFilterer) FilterManageIsVerified(opts *bind.FilterOpts) (*EntityManagerManageIsVerifiedIterator, error) {

	logs, sub, err := _EntityManager.contract.FilterLogs(opts, "ManageIsVerified")
	if err != nil {
		return nil, err
	}
	return &EntityManagerManageIsVerifiedIterator{contract: _EntityManager.contract, event: "ManageIsVerified", logs: logs, sub: sub}, nil
}

// WatchManageIsVerified is a free log subscription operation binding the contract event 0xfb248912b777b85e53adcf3feae8ccabfc321b7e6d8eeefb0faaaee4af0b6770.
//
// Solidity: event ManageIsVerified(uint256 _userId, bool _isVerified)
func (_EntityManager *EntityManagerFilterer) WatchManageIsVerified(opts *bind.WatchOpts, sink chan<- *EntityManagerManageIsVerified) (event.Subscription, error) {

	logs, sub, err := _EntityManager.contract.WatchLogs(opts, "ManageIsVerified")
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(EntityManagerManageIsVerified)
				if err := _EntityManager.contract.UnpackLog(event, "ManageIsVerified", log); err != nil {
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

// ParseManageIsVerified is a log parse operation binding the contract event 0xfb248912b777b85e53adcf3feae8ccabfc321b7e6d8eeefb0faaaee4af0b6770.
//
// Solidity: event ManageIsVerified(uint256 _userId, bool _isVerified)
func (_EntityManager *EntityManagerFilterer) ParseManageIsVerified(log types.Log) (*EntityManagerManageIsVerified, error) {
	event := new(EntityManagerManageIsVerified)
	if err := _EntityManager.contract.UnpackLog(event, "ManageIsVerified", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}
