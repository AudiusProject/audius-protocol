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

// GovernanceMetaData contains all meta data concerning the Governance contract.
var GovernanceMetaData = &bind.MetaData{
	ABI: "[{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"uint256\",\"name\":\"_newExecutionDelay\",\"type\":\"uint256\"}],\"name\":\"ExecutionDelayUpdated\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"_targetContractAddress\",\"type\":\"address\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"_callValue\",\"type\":\"uint256\"},{\"indexed\":true,\"internalType\":\"string\",\"name\":\"_functionSignature\",\"type\":\"string\"},{\"indexed\":true,\"internalType\":\"bytes\",\"name\":\"_callData\",\"type\":\"bytes\"},{\"indexed\":false,\"internalType\":\"bytes\",\"name\":\"_returnData\",\"type\":\"bytes\"}],\"name\":\"GuardianTransactionExecuted\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"_newGuardianAddress\",\"type\":\"address\"}],\"name\":\"GuardianshipTransferred\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"uint256\",\"name\":\"_newMaxInProgressProposals\",\"type\":\"uint256\"}],\"name\":\"MaxInProgressProposalsUpdated\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"uint256\",\"name\":\"_proposalId\",\"type\":\"uint256\"},{\"indexed\":true,\"internalType\":\"enumGovernance.Outcome\",\"name\":\"_outcome\",\"type\":\"uint8\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"_voteMagnitudeYes\",\"type\":\"uint256\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"_voteMagnitudeNo\",\"type\":\"uint256\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"_numVotes\",\"type\":\"uint256\"}],\"name\":\"ProposalOutcomeEvaluated\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"uint256\",\"name\":\"_proposalId\",\"type\":\"uint256\"},{\"indexed\":true,\"internalType\":\"address\",\"name\":\"_proposer\",\"type\":\"address\"},{\"indexed\":false,\"internalType\":\"string\",\"name\":\"_name\",\"type\":\"string\"},{\"indexed\":false,\"internalType\":\"string\",\"name\":\"_description\",\"type\":\"string\"}],\"name\":\"ProposalSubmitted\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"uint256\",\"name\":\"_proposalId\",\"type\":\"uint256\"},{\"indexed\":true,\"internalType\":\"bool\",\"name\":\"_success\",\"type\":\"bool\"},{\"indexed\":false,\"internalType\":\"bytes\",\"name\":\"_returnData\",\"type\":\"bytes\"}],\"name\":\"ProposalTransactionExecuted\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"uint256\",\"name\":\"_proposalId\",\"type\":\"uint256\"}],\"name\":\"ProposalVetoed\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"uint256\",\"name\":\"_proposalId\",\"type\":\"uint256\"},{\"indexed\":true,\"internalType\":\"address\",\"name\":\"_voter\",\"type\":\"address\"},{\"indexed\":true,\"internalType\":\"enumGovernance.Vote\",\"name\":\"_vote\",\"type\":\"uint8\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"_voterStake\",\"type\":\"uint256\"}],\"name\":\"ProposalVoteSubmitted\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"uint256\",\"name\":\"_proposalId\",\"type\":\"uint256\"},{\"indexed\":true,\"internalType\":\"address\",\"name\":\"_voter\",\"type\":\"address\"},{\"indexed\":true,\"internalType\":\"enumGovernance.Vote\",\"name\":\"_vote\",\"type\":\"uint8\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"_voterStake\",\"type\":\"uint256\"},{\"indexed\":false,\"internalType\":\"enumGovernance.Vote\",\"name\":\"_previousVote\",\"type\":\"uint8\"}],\"name\":\"ProposalVoteUpdated\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"_newRegistryAddress\",\"type\":\"address\"}],\"name\":\"RegistryAddressUpdated\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"uint256\",\"name\":\"_newVotingPeriod\",\"type\":\"uint256\"}],\"name\":\"VotingPeriodUpdated\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"uint256\",\"name\":\"_newVotingQuorumPercent\",\"type\":\"uint256\"}],\"name\":\"VotingQuorumPercentUpdated\",\"type\":\"event\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"address\",\"name\":\"_registryAddress\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"_votingPeriod\",\"type\":\"uint256\"},{\"internalType\":\"uint256\",\"name\":\"_executionDelay\",\"type\":\"uint256\"},{\"internalType\":\"uint256\",\"name\":\"_votingQuorumPercent\",\"type\":\"uint256\"},{\"internalType\":\"uint16\",\"name\":\"_maxInProgressProposals\",\"type\":\"uint16\"},{\"internalType\":\"address\",\"name\":\"_guardianAddress\",\"type\":\"address\"}],\"name\":\"initialize\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[],\"name\":\"initialize\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"bytes32\",\"name\":\"_targetContractRegistryKey\",\"type\":\"bytes32\"},{\"internalType\":\"uint256\",\"name\":\"_callValue\",\"type\":\"uint256\"},{\"internalType\":\"string\",\"name\":\"_functionSignature\",\"type\":\"string\"},{\"internalType\":\"bytes\",\"name\":\"_callData\",\"type\":\"bytes\"},{\"internalType\":\"string\",\"name\":\"_name\",\"type\":\"string\"},{\"internalType\":\"string\",\"name\":\"_description\",\"type\":\"string\"}],\"name\":\"submitProposal\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"_proposalId\",\"type\":\"uint256\"},{\"internalType\":\"enumGovernance.Vote\",\"name\":\"_vote\",\"type\":\"uint8\"}],\"name\":\"submitVote\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"_proposalId\",\"type\":\"uint256\"},{\"internalType\":\"enumGovernance.Vote\",\"name\":\"_vote\",\"type\":\"uint8\"}],\"name\":\"updateVote\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"_proposalId\",\"type\":\"uint256\"}],\"name\":\"evaluateProposalOutcome\",\"outputs\":[{\"internalType\":\"enumGovernance.Outcome\",\"name\":\"\",\"type\":\"uint8\"}],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"_proposalId\",\"type\":\"uint256\"}],\"name\":\"vetoProposal\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"address\",\"name\":\"_stakingAddress\",\"type\":\"address\"}],\"name\":\"setStakingAddress\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"address\",\"name\":\"_serviceProviderFactoryAddress\",\"type\":\"address\"}],\"name\":\"setServiceProviderFactoryAddress\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"address\",\"name\":\"_delegateManagerAddress\",\"type\":\"address\"}],\"name\":\"setDelegateManagerAddress\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"_votingPeriod\",\"type\":\"uint256\"}],\"name\":\"setVotingPeriod\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"_votingQuorumPercent\",\"type\":\"uint256\"}],\"name\":\"setVotingQuorumPercent\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"address\",\"name\":\"_registryAddress\",\"type\":\"address\"}],\"name\":\"setRegistryAddress\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"uint16\",\"name\":\"_newMaxInProgressProposals\",\"type\":\"uint16\"}],\"name\":\"setMaxInProgressProposals\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"_newExecutionDelay\",\"type\":\"uint256\"}],\"name\":\"setExecutionDelay\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"bytes32\",\"name\":\"_targetContractRegistryKey\",\"type\":\"bytes32\"},{\"internalType\":\"uint256\",\"name\":\"_callValue\",\"type\":\"uint256\"},{\"internalType\":\"string\",\"name\":\"_functionSignature\",\"type\":\"string\"},{\"internalType\":\"bytes\",\"name\":\"_callData\",\"type\":\"bytes\"}],\"name\":\"guardianExecuteTransaction\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"address\",\"name\":\"_newGuardianAddress\",\"type\":\"address\"}],\"name\":\"transferGuardianship\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"_proposalId\",\"type\":\"uint256\"}],\"name\":\"getProposalById\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"proposalId\",\"type\":\"uint256\"},{\"internalType\":\"address\",\"name\":\"proposer\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"submissionBlockNumber\",\"type\":\"uint256\"},{\"internalType\":\"bytes32\",\"name\":\"targetContractRegistryKey\",\"type\":\"bytes32\"},{\"internalType\":\"address\",\"name\":\"targetContractAddress\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"callValue\",\"type\":\"uint256\"},{\"internalType\":\"string\",\"name\":\"functionSignature\",\"type\":\"string\"},{\"internalType\":\"bytes\",\"name\":\"callData\",\"type\":\"bytes\"},{\"internalType\":\"enumGovernance.Outcome\",\"name\":\"outcome\",\"type\":\"uint8\"},{\"internalType\":\"uint256\",\"name\":\"voteMagnitudeYes\",\"type\":\"uint256\"},{\"internalType\":\"uint256\",\"name\":\"voteMagnitudeNo\",\"type\":\"uint256\"},{\"internalType\":\"uint256\",\"name\":\"numVotes\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"_proposalId\",\"type\":\"uint256\"}],\"name\":\"getProposalTargetContractHash\",\"outputs\":[{\"internalType\":\"bytes32\",\"name\":\"\",\"type\":\"bytes32\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"_proposalId\",\"type\":\"uint256\"},{\"internalType\":\"address\",\"name\":\"_voter\",\"type\":\"address\"}],\"name\":\"getVoteInfoByProposalAndVoter\",\"outputs\":[{\"internalType\":\"enumGovernance.Vote\",\"name\":\"vote\",\"type\":\"uint8\"},{\"internalType\":\"uint256\",\"name\":\"voteMagnitude\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"getGuardianAddress\",\"outputs\":[{\"internalType\":\"address\",\"name\":\"\",\"type\":\"address\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"getStakingAddress\",\"outputs\":[{\"internalType\":\"address\",\"name\":\"\",\"type\":\"address\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"getServiceProviderFactoryAddress\",\"outputs\":[{\"internalType\":\"address\",\"name\":\"\",\"type\":\"address\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"getDelegateManagerAddress\",\"outputs\":[{\"internalType\":\"address\",\"name\":\"\",\"type\":\"address\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"getVotingPeriod\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"getVotingQuorumPercent\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"getRegistryAddress\",\"outputs\":[{\"internalType\":\"address\",\"name\":\"\",\"type\":\"address\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"isGovernanceAddress\",\"outputs\":[{\"internalType\":\"bool\",\"name\":\"\",\"type\":\"bool\"}],\"payable\":false,\"stateMutability\":\"pure\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"getMaxInProgressProposals\",\"outputs\":[{\"internalType\":\"uint16\",\"name\":\"\",\"type\":\"uint16\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"getExecutionDelay\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"getInProgressProposals\",\"outputs\":[{\"internalType\":\"uint256[]\",\"name\":\"\",\"type\":\"uint256[]\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"inProgressProposalsAreUpToDate\",\"outputs\":[{\"internalType\":\"bool\",\"name\":\"\",\"type\":\"bool\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"}]",
}

// GovernanceABI is the input ABI used to generate the binding from.
// Deprecated: Use GovernanceMetaData.ABI instead.
var GovernanceABI = GovernanceMetaData.ABI

// Governance is an auto generated Go binding around an Ethereum contract.
type Governance struct {
	GovernanceCaller     // Read-only binding to the contract
	GovernanceTransactor // Write-only binding to the contract
	GovernanceFilterer   // Log filterer for contract events
}

// GovernanceCaller is an auto generated read-only Go binding around an Ethereum contract.
type GovernanceCaller struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// GovernanceTransactor is an auto generated write-only Go binding around an Ethereum contract.
type GovernanceTransactor struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// GovernanceFilterer is an auto generated log filtering Go binding around an Ethereum contract events.
type GovernanceFilterer struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// GovernanceSession is an auto generated Go binding around an Ethereum contract,
// with pre-set call and transact options.
type GovernanceSession struct {
	Contract     *Governance       // Generic contract binding to set the session for
	CallOpts     bind.CallOpts     // Call options to use throughout this session
	TransactOpts bind.TransactOpts // Transaction auth options to use throughout this session
}

// GovernanceCallerSession is an auto generated read-only Go binding around an Ethereum contract,
// with pre-set call options.
type GovernanceCallerSession struct {
	Contract *GovernanceCaller // Generic contract caller binding to set the session for
	CallOpts bind.CallOpts     // Call options to use throughout this session
}

// GovernanceTransactorSession is an auto generated write-only Go binding around an Ethereum contract,
// with pre-set transact options.
type GovernanceTransactorSession struct {
	Contract     *GovernanceTransactor // Generic contract transactor binding to set the session for
	TransactOpts bind.TransactOpts     // Transaction auth options to use throughout this session
}

// GovernanceRaw is an auto generated low-level Go binding around an Ethereum contract.
type GovernanceRaw struct {
	Contract *Governance // Generic contract binding to access the raw methods on
}

// GovernanceCallerRaw is an auto generated low-level read-only Go binding around an Ethereum contract.
type GovernanceCallerRaw struct {
	Contract *GovernanceCaller // Generic read-only contract binding to access the raw methods on
}

// GovernanceTransactorRaw is an auto generated low-level write-only Go binding around an Ethereum contract.
type GovernanceTransactorRaw struct {
	Contract *GovernanceTransactor // Generic write-only contract binding to access the raw methods on
}

// NewGovernance creates a new instance of Governance, bound to a specific deployed contract.
func NewGovernance(address common.Address, backend bind.ContractBackend) (*Governance, error) {
	contract, err := bindGovernance(address, backend, backend, backend)
	if err != nil {
		return nil, err
	}
	return &Governance{GovernanceCaller: GovernanceCaller{contract: contract}, GovernanceTransactor: GovernanceTransactor{contract: contract}, GovernanceFilterer: GovernanceFilterer{contract: contract}}, nil
}

// NewGovernanceCaller creates a new read-only instance of Governance, bound to a specific deployed contract.
func NewGovernanceCaller(address common.Address, caller bind.ContractCaller) (*GovernanceCaller, error) {
	contract, err := bindGovernance(address, caller, nil, nil)
	if err != nil {
		return nil, err
	}
	return &GovernanceCaller{contract: contract}, nil
}

// NewGovernanceTransactor creates a new write-only instance of Governance, bound to a specific deployed contract.
func NewGovernanceTransactor(address common.Address, transactor bind.ContractTransactor) (*GovernanceTransactor, error) {
	contract, err := bindGovernance(address, nil, transactor, nil)
	if err != nil {
		return nil, err
	}
	return &GovernanceTransactor{contract: contract}, nil
}

// NewGovernanceFilterer creates a new log filterer instance of Governance, bound to a specific deployed contract.
func NewGovernanceFilterer(address common.Address, filterer bind.ContractFilterer) (*GovernanceFilterer, error) {
	contract, err := bindGovernance(address, nil, nil, filterer)
	if err != nil {
		return nil, err
	}
	return &GovernanceFilterer{contract: contract}, nil
}

// bindGovernance binds a generic wrapper to an already deployed contract.
func bindGovernance(address common.Address, caller bind.ContractCaller, transactor bind.ContractTransactor, filterer bind.ContractFilterer) (*bind.BoundContract, error) {
	parsed, err := GovernanceMetaData.GetAbi()
	if err != nil {
		return nil, err
	}
	return bind.NewBoundContract(address, *parsed, caller, transactor, filterer), nil
}

// Call invokes the (constant) contract method with params as input values and
// sets the output to result. The result type might be a single field for simple
// returns, a slice of interfaces for anonymous returns and a struct for named
// returns.
func (_Governance *GovernanceRaw) Call(opts *bind.CallOpts, result *[]interface{}, method string, params ...interface{}) error {
	return _Governance.Contract.GovernanceCaller.contract.Call(opts, result, method, params...)
}

// Transfer initiates a plain transaction to move funds to the contract, calling
// its default method if one is available.
func (_Governance *GovernanceRaw) Transfer(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _Governance.Contract.GovernanceTransactor.contract.Transfer(opts)
}

// Transact invokes the (paid) contract method with params as input values.
func (_Governance *GovernanceRaw) Transact(opts *bind.TransactOpts, method string, params ...interface{}) (*types.Transaction, error) {
	return _Governance.Contract.GovernanceTransactor.contract.Transact(opts, method, params...)
}

// Call invokes the (constant) contract method with params as input values and
// sets the output to result. The result type might be a single field for simple
// returns, a slice of interfaces for anonymous returns and a struct for named
// returns.
func (_Governance *GovernanceCallerRaw) Call(opts *bind.CallOpts, result *[]interface{}, method string, params ...interface{}) error {
	return _Governance.Contract.contract.Call(opts, result, method, params...)
}

// Transfer initiates a plain transaction to move funds to the contract, calling
// its default method if one is available.
func (_Governance *GovernanceTransactorRaw) Transfer(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _Governance.Contract.contract.Transfer(opts)
}

// Transact invokes the (paid) contract method with params as input values.
func (_Governance *GovernanceTransactorRaw) Transact(opts *bind.TransactOpts, method string, params ...interface{}) (*types.Transaction, error) {
	return _Governance.Contract.contract.Transact(opts, method, params...)
}

// GetDelegateManagerAddress is a free data retrieval call binding the contract method 0xd16543f6.
//
// Solidity: function getDelegateManagerAddress() view returns(address)
func (_Governance *GovernanceCaller) GetDelegateManagerAddress(opts *bind.CallOpts) (common.Address, error) {
	var out []interface{}
	err := _Governance.contract.Call(opts, &out, "getDelegateManagerAddress")

	if err != nil {
		return *new(common.Address), err
	}

	out0 := *abi.ConvertType(out[0], new(common.Address)).(*common.Address)

	return out0, err

}

// GetDelegateManagerAddress is a free data retrieval call binding the contract method 0xd16543f6.
//
// Solidity: function getDelegateManagerAddress() view returns(address)
func (_Governance *GovernanceSession) GetDelegateManagerAddress() (common.Address, error) {
	return _Governance.Contract.GetDelegateManagerAddress(&_Governance.CallOpts)
}

// GetDelegateManagerAddress is a free data retrieval call binding the contract method 0xd16543f6.
//
// Solidity: function getDelegateManagerAddress() view returns(address)
func (_Governance *GovernanceCallerSession) GetDelegateManagerAddress() (common.Address, error) {
	return _Governance.Contract.GetDelegateManagerAddress(&_Governance.CallOpts)
}

// GetExecutionDelay is a free data retrieval call binding the contract method 0x06288885.
//
// Solidity: function getExecutionDelay() view returns(uint256)
func (_Governance *GovernanceCaller) GetExecutionDelay(opts *bind.CallOpts) (*big.Int, error) {
	var out []interface{}
	err := _Governance.contract.Call(opts, &out, "getExecutionDelay")

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

// GetExecutionDelay is a free data retrieval call binding the contract method 0x06288885.
//
// Solidity: function getExecutionDelay() view returns(uint256)
func (_Governance *GovernanceSession) GetExecutionDelay() (*big.Int, error) {
	return _Governance.Contract.GetExecutionDelay(&_Governance.CallOpts)
}

// GetExecutionDelay is a free data retrieval call binding the contract method 0x06288885.
//
// Solidity: function getExecutionDelay() view returns(uint256)
func (_Governance *GovernanceCallerSession) GetExecutionDelay() (*big.Int, error) {
	return _Governance.Contract.GetExecutionDelay(&_Governance.CallOpts)
}

// GetGuardianAddress is a free data retrieval call binding the contract method 0x5c51bc73.
//
// Solidity: function getGuardianAddress() view returns(address)
func (_Governance *GovernanceCaller) GetGuardianAddress(opts *bind.CallOpts) (common.Address, error) {
	var out []interface{}
	err := _Governance.contract.Call(opts, &out, "getGuardianAddress")

	if err != nil {
		return *new(common.Address), err
	}

	out0 := *abi.ConvertType(out[0], new(common.Address)).(*common.Address)

	return out0, err

}

// GetGuardianAddress is a free data retrieval call binding the contract method 0x5c51bc73.
//
// Solidity: function getGuardianAddress() view returns(address)
func (_Governance *GovernanceSession) GetGuardianAddress() (common.Address, error) {
	return _Governance.Contract.GetGuardianAddress(&_Governance.CallOpts)
}

// GetGuardianAddress is a free data retrieval call binding the contract method 0x5c51bc73.
//
// Solidity: function getGuardianAddress() view returns(address)
func (_Governance *GovernanceCallerSession) GetGuardianAddress() (common.Address, error) {
	return _Governance.Contract.GetGuardianAddress(&_Governance.CallOpts)
}

// GetInProgressProposals is a free data retrieval call binding the contract method 0x98b93cb5.
//
// Solidity: function getInProgressProposals() view returns(uint256[])
func (_Governance *GovernanceCaller) GetInProgressProposals(opts *bind.CallOpts) ([]*big.Int, error) {
	var out []interface{}
	err := _Governance.contract.Call(opts, &out, "getInProgressProposals")

	if err != nil {
		return *new([]*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new([]*big.Int)).(*[]*big.Int)

	return out0, err

}

// GetInProgressProposals is a free data retrieval call binding the contract method 0x98b93cb5.
//
// Solidity: function getInProgressProposals() view returns(uint256[])
func (_Governance *GovernanceSession) GetInProgressProposals() ([]*big.Int, error) {
	return _Governance.Contract.GetInProgressProposals(&_Governance.CallOpts)
}

// GetInProgressProposals is a free data retrieval call binding the contract method 0x98b93cb5.
//
// Solidity: function getInProgressProposals() view returns(uint256[])
func (_Governance *GovernanceCallerSession) GetInProgressProposals() ([]*big.Int, error) {
	return _Governance.Contract.GetInProgressProposals(&_Governance.CallOpts)
}

// GetMaxInProgressProposals is a free data retrieval call binding the contract method 0x0b0543f9.
//
// Solidity: function getMaxInProgressProposals() view returns(uint16)
func (_Governance *GovernanceCaller) GetMaxInProgressProposals(opts *bind.CallOpts) (uint16, error) {
	var out []interface{}
	err := _Governance.contract.Call(opts, &out, "getMaxInProgressProposals")

	if err != nil {
		return *new(uint16), err
	}

	out0 := *abi.ConvertType(out[0], new(uint16)).(*uint16)

	return out0, err

}

// GetMaxInProgressProposals is a free data retrieval call binding the contract method 0x0b0543f9.
//
// Solidity: function getMaxInProgressProposals() view returns(uint16)
func (_Governance *GovernanceSession) GetMaxInProgressProposals() (uint16, error) {
	return _Governance.Contract.GetMaxInProgressProposals(&_Governance.CallOpts)
}

// GetMaxInProgressProposals is a free data retrieval call binding the contract method 0x0b0543f9.
//
// Solidity: function getMaxInProgressProposals() view returns(uint16)
func (_Governance *GovernanceCallerSession) GetMaxInProgressProposals() (uint16, error) {
	return _Governance.Contract.GetMaxInProgressProposals(&_Governance.CallOpts)
}

// GetProposalById is a free data retrieval call binding the contract method 0x3656de21.
//
// Solidity: function getProposalById(uint256 _proposalId) view returns(uint256 proposalId, address proposer, uint256 submissionBlockNumber, bytes32 targetContractRegistryKey, address targetContractAddress, uint256 callValue, string functionSignature, bytes callData, uint8 outcome, uint256 voteMagnitudeYes, uint256 voteMagnitudeNo, uint256 numVotes)
func (_Governance *GovernanceCaller) GetProposalById(opts *bind.CallOpts, _proposalId *big.Int) (struct {
	ProposalId                *big.Int
	Proposer                  common.Address
	SubmissionBlockNumber     *big.Int
	TargetContractRegistryKey [32]byte
	TargetContractAddress     common.Address
	CallValue                 *big.Int
	FunctionSignature         string
	CallData                  []byte
	Outcome                   uint8
	VoteMagnitudeYes          *big.Int
	VoteMagnitudeNo           *big.Int
	NumVotes                  *big.Int
}, error) {
	var out []interface{}
	err := _Governance.contract.Call(opts, &out, "getProposalById", _proposalId)

	outstruct := new(struct {
		ProposalId                *big.Int
		Proposer                  common.Address
		SubmissionBlockNumber     *big.Int
		TargetContractRegistryKey [32]byte
		TargetContractAddress     common.Address
		CallValue                 *big.Int
		FunctionSignature         string
		CallData                  []byte
		Outcome                   uint8
		VoteMagnitudeYes          *big.Int
		VoteMagnitudeNo           *big.Int
		NumVotes                  *big.Int
	})
	if err != nil {
		return *outstruct, err
	}

	outstruct.ProposalId = *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)
	outstruct.Proposer = *abi.ConvertType(out[1], new(common.Address)).(*common.Address)
	outstruct.SubmissionBlockNumber = *abi.ConvertType(out[2], new(*big.Int)).(**big.Int)
	outstruct.TargetContractRegistryKey = *abi.ConvertType(out[3], new([32]byte)).(*[32]byte)
	outstruct.TargetContractAddress = *abi.ConvertType(out[4], new(common.Address)).(*common.Address)
	outstruct.CallValue = *abi.ConvertType(out[5], new(*big.Int)).(**big.Int)
	outstruct.FunctionSignature = *abi.ConvertType(out[6], new(string)).(*string)
	outstruct.CallData = *abi.ConvertType(out[7], new([]byte)).(*[]byte)
	outstruct.Outcome = *abi.ConvertType(out[8], new(uint8)).(*uint8)
	outstruct.VoteMagnitudeYes = *abi.ConvertType(out[9], new(*big.Int)).(**big.Int)
	outstruct.VoteMagnitudeNo = *abi.ConvertType(out[10], new(*big.Int)).(**big.Int)
	outstruct.NumVotes = *abi.ConvertType(out[11], new(*big.Int)).(**big.Int)

	return *outstruct, err

}

// GetProposalById is a free data retrieval call binding the contract method 0x3656de21.
//
// Solidity: function getProposalById(uint256 _proposalId) view returns(uint256 proposalId, address proposer, uint256 submissionBlockNumber, bytes32 targetContractRegistryKey, address targetContractAddress, uint256 callValue, string functionSignature, bytes callData, uint8 outcome, uint256 voteMagnitudeYes, uint256 voteMagnitudeNo, uint256 numVotes)
func (_Governance *GovernanceSession) GetProposalById(_proposalId *big.Int) (struct {
	ProposalId                *big.Int
	Proposer                  common.Address
	SubmissionBlockNumber     *big.Int
	TargetContractRegistryKey [32]byte
	TargetContractAddress     common.Address
	CallValue                 *big.Int
	FunctionSignature         string
	CallData                  []byte
	Outcome                   uint8
	VoteMagnitudeYes          *big.Int
	VoteMagnitudeNo           *big.Int
	NumVotes                  *big.Int
}, error) {
	return _Governance.Contract.GetProposalById(&_Governance.CallOpts, _proposalId)
}

// GetProposalById is a free data retrieval call binding the contract method 0x3656de21.
//
// Solidity: function getProposalById(uint256 _proposalId) view returns(uint256 proposalId, address proposer, uint256 submissionBlockNumber, bytes32 targetContractRegistryKey, address targetContractAddress, uint256 callValue, string functionSignature, bytes callData, uint8 outcome, uint256 voteMagnitudeYes, uint256 voteMagnitudeNo, uint256 numVotes)
func (_Governance *GovernanceCallerSession) GetProposalById(_proposalId *big.Int) (struct {
	ProposalId                *big.Int
	Proposer                  common.Address
	SubmissionBlockNumber     *big.Int
	TargetContractRegistryKey [32]byte
	TargetContractAddress     common.Address
	CallValue                 *big.Int
	FunctionSignature         string
	CallData                  []byte
	Outcome                   uint8
	VoteMagnitudeYes          *big.Int
	VoteMagnitudeNo           *big.Int
	NumVotes                  *big.Int
}, error) {
	return _Governance.Contract.GetProposalById(&_Governance.CallOpts, _proposalId)
}

// GetProposalTargetContractHash is a free data retrieval call binding the contract method 0x8b657290.
//
// Solidity: function getProposalTargetContractHash(uint256 _proposalId) view returns(bytes32)
func (_Governance *GovernanceCaller) GetProposalTargetContractHash(opts *bind.CallOpts, _proposalId *big.Int) ([32]byte, error) {
	var out []interface{}
	err := _Governance.contract.Call(opts, &out, "getProposalTargetContractHash", _proposalId)

	if err != nil {
		return *new([32]byte), err
	}

	out0 := *abi.ConvertType(out[0], new([32]byte)).(*[32]byte)

	return out0, err

}

// GetProposalTargetContractHash is a free data retrieval call binding the contract method 0x8b657290.
//
// Solidity: function getProposalTargetContractHash(uint256 _proposalId) view returns(bytes32)
func (_Governance *GovernanceSession) GetProposalTargetContractHash(_proposalId *big.Int) ([32]byte, error) {
	return _Governance.Contract.GetProposalTargetContractHash(&_Governance.CallOpts, _proposalId)
}

// GetProposalTargetContractHash is a free data retrieval call binding the contract method 0x8b657290.
//
// Solidity: function getProposalTargetContractHash(uint256 _proposalId) view returns(bytes32)
func (_Governance *GovernanceCallerSession) GetProposalTargetContractHash(_proposalId *big.Int) ([32]byte, error) {
	return _Governance.Contract.GetProposalTargetContractHash(&_Governance.CallOpts, _proposalId)
}

// GetRegistryAddress is a free data retrieval call binding the contract method 0xf21de1e8.
//
// Solidity: function getRegistryAddress() view returns(address)
func (_Governance *GovernanceCaller) GetRegistryAddress(opts *bind.CallOpts) (common.Address, error) {
	var out []interface{}
	err := _Governance.contract.Call(opts, &out, "getRegistryAddress")

	if err != nil {
		return *new(common.Address), err
	}

	out0 := *abi.ConvertType(out[0], new(common.Address)).(*common.Address)

	return out0, err

}

// GetRegistryAddress is a free data retrieval call binding the contract method 0xf21de1e8.
//
// Solidity: function getRegistryAddress() view returns(address)
func (_Governance *GovernanceSession) GetRegistryAddress() (common.Address, error) {
	return _Governance.Contract.GetRegistryAddress(&_Governance.CallOpts)
}

// GetRegistryAddress is a free data retrieval call binding the contract method 0xf21de1e8.
//
// Solidity: function getRegistryAddress() view returns(address)
func (_Governance *GovernanceCallerSession) GetRegistryAddress() (common.Address, error) {
	return _Governance.Contract.GetRegistryAddress(&_Governance.CallOpts)
}

// GetServiceProviderFactoryAddress is a free data retrieval call binding the contract method 0x002ae74a.
//
// Solidity: function getServiceProviderFactoryAddress() view returns(address)
func (_Governance *GovernanceCaller) GetServiceProviderFactoryAddress(opts *bind.CallOpts) (common.Address, error) {
	var out []interface{}
	err := _Governance.contract.Call(opts, &out, "getServiceProviderFactoryAddress")

	if err != nil {
		return *new(common.Address), err
	}

	out0 := *abi.ConvertType(out[0], new(common.Address)).(*common.Address)

	return out0, err

}

// GetServiceProviderFactoryAddress is a free data retrieval call binding the contract method 0x002ae74a.
//
// Solidity: function getServiceProviderFactoryAddress() view returns(address)
func (_Governance *GovernanceSession) GetServiceProviderFactoryAddress() (common.Address, error) {
	return _Governance.Contract.GetServiceProviderFactoryAddress(&_Governance.CallOpts)
}

// GetServiceProviderFactoryAddress is a free data retrieval call binding the contract method 0x002ae74a.
//
// Solidity: function getServiceProviderFactoryAddress() view returns(address)
func (_Governance *GovernanceCallerSession) GetServiceProviderFactoryAddress() (common.Address, error) {
	return _Governance.Contract.GetServiceProviderFactoryAddress(&_Governance.CallOpts)
}

// GetStakingAddress is a free data retrieval call binding the contract method 0x0e9ed68b.
//
// Solidity: function getStakingAddress() view returns(address)
func (_Governance *GovernanceCaller) GetStakingAddress(opts *bind.CallOpts) (common.Address, error) {
	var out []interface{}
	err := _Governance.contract.Call(opts, &out, "getStakingAddress")

	if err != nil {
		return *new(common.Address), err
	}

	out0 := *abi.ConvertType(out[0], new(common.Address)).(*common.Address)

	return out0, err

}

// GetStakingAddress is a free data retrieval call binding the contract method 0x0e9ed68b.
//
// Solidity: function getStakingAddress() view returns(address)
func (_Governance *GovernanceSession) GetStakingAddress() (common.Address, error) {
	return _Governance.Contract.GetStakingAddress(&_Governance.CallOpts)
}

// GetStakingAddress is a free data retrieval call binding the contract method 0x0e9ed68b.
//
// Solidity: function getStakingAddress() view returns(address)
func (_Governance *GovernanceCallerSession) GetStakingAddress() (common.Address, error) {
	return _Governance.Contract.GetStakingAddress(&_Governance.CallOpts)
}

// GetVoteInfoByProposalAndVoter is a free data retrieval call binding the contract method 0x8aad517d.
//
// Solidity: function getVoteInfoByProposalAndVoter(uint256 _proposalId, address _voter) view returns(uint8 vote, uint256 voteMagnitude)
func (_Governance *GovernanceCaller) GetVoteInfoByProposalAndVoter(opts *bind.CallOpts, _proposalId *big.Int, _voter common.Address) (struct {
	Vote          uint8
	VoteMagnitude *big.Int
}, error) {
	var out []interface{}
	err := _Governance.contract.Call(opts, &out, "getVoteInfoByProposalAndVoter", _proposalId, _voter)

	outstruct := new(struct {
		Vote          uint8
		VoteMagnitude *big.Int
	})
	if err != nil {
		return *outstruct, err
	}

	outstruct.Vote = *abi.ConvertType(out[0], new(uint8)).(*uint8)
	outstruct.VoteMagnitude = *abi.ConvertType(out[1], new(*big.Int)).(**big.Int)

	return *outstruct, err

}

// GetVoteInfoByProposalAndVoter is a free data retrieval call binding the contract method 0x8aad517d.
//
// Solidity: function getVoteInfoByProposalAndVoter(uint256 _proposalId, address _voter) view returns(uint8 vote, uint256 voteMagnitude)
func (_Governance *GovernanceSession) GetVoteInfoByProposalAndVoter(_proposalId *big.Int, _voter common.Address) (struct {
	Vote          uint8
	VoteMagnitude *big.Int
}, error) {
	return _Governance.Contract.GetVoteInfoByProposalAndVoter(&_Governance.CallOpts, _proposalId, _voter)
}

// GetVoteInfoByProposalAndVoter is a free data retrieval call binding the contract method 0x8aad517d.
//
// Solidity: function getVoteInfoByProposalAndVoter(uint256 _proposalId, address _voter) view returns(uint8 vote, uint256 voteMagnitude)
func (_Governance *GovernanceCallerSession) GetVoteInfoByProposalAndVoter(_proposalId *big.Int, _voter common.Address) (struct {
	Vote          uint8
	VoteMagnitude *big.Int
}, error) {
	return _Governance.Contract.GetVoteInfoByProposalAndVoter(&_Governance.CallOpts, _proposalId, _voter)
}

// GetVotingPeriod is a free data retrieval call binding the contract method 0x3ecc6a43.
//
// Solidity: function getVotingPeriod() view returns(uint256)
func (_Governance *GovernanceCaller) GetVotingPeriod(opts *bind.CallOpts) (*big.Int, error) {
	var out []interface{}
	err := _Governance.contract.Call(opts, &out, "getVotingPeriod")

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

// GetVotingPeriod is a free data retrieval call binding the contract method 0x3ecc6a43.
//
// Solidity: function getVotingPeriod() view returns(uint256)
func (_Governance *GovernanceSession) GetVotingPeriod() (*big.Int, error) {
	return _Governance.Contract.GetVotingPeriod(&_Governance.CallOpts)
}

// GetVotingPeriod is a free data retrieval call binding the contract method 0x3ecc6a43.
//
// Solidity: function getVotingPeriod() view returns(uint256)
func (_Governance *GovernanceCallerSession) GetVotingPeriod() (*big.Int, error) {
	return _Governance.Contract.GetVotingPeriod(&_Governance.CallOpts)
}

// GetVotingQuorumPercent is a free data retrieval call binding the contract method 0x2b95acf3.
//
// Solidity: function getVotingQuorumPercent() view returns(uint256)
func (_Governance *GovernanceCaller) GetVotingQuorumPercent(opts *bind.CallOpts) (*big.Int, error) {
	var out []interface{}
	err := _Governance.contract.Call(opts, &out, "getVotingQuorumPercent")

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

// GetVotingQuorumPercent is a free data retrieval call binding the contract method 0x2b95acf3.
//
// Solidity: function getVotingQuorumPercent() view returns(uint256)
func (_Governance *GovernanceSession) GetVotingQuorumPercent() (*big.Int, error) {
	return _Governance.Contract.GetVotingQuorumPercent(&_Governance.CallOpts)
}

// GetVotingQuorumPercent is a free data retrieval call binding the contract method 0x2b95acf3.
//
// Solidity: function getVotingQuorumPercent() view returns(uint256)
func (_Governance *GovernanceCallerSession) GetVotingQuorumPercent() (*big.Int, error) {
	return _Governance.Contract.GetVotingQuorumPercent(&_Governance.CallOpts)
}

// InProgressProposalsAreUpToDate is a free data retrieval call binding the contract method 0xea7e6ffb.
//
// Solidity: function inProgressProposalsAreUpToDate() view returns(bool)
func (_Governance *GovernanceCaller) InProgressProposalsAreUpToDate(opts *bind.CallOpts) (bool, error) {
	var out []interface{}
	err := _Governance.contract.Call(opts, &out, "inProgressProposalsAreUpToDate")

	if err != nil {
		return *new(bool), err
	}

	out0 := *abi.ConvertType(out[0], new(bool)).(*bool)

	return out0, err

}

// InProgressProposalsAreUpToDate is a free data retrieval call binding the contract method 0xea7e6ffb.
//
// Solidity: function inProgressProposalsAreUpToDate() view returns(bool)
func (_Governance *GovernanceSession) InProgressProposalsAreUpToDate() (bool, error) {
	return _Governance.Contract.InProgressProposalsAreUpToDate(&_Governance.CallOpts)
}

// InProgressProposalsAreUpToDate is a free data retrieval call binding the contract method 0xea7e6ffb.
//
// Solidity: function inProgressProposalsAreUpToDate() view returns(bool)
func (_Governance *GovernanceCallerSession) InProgressProposalsAreUpToDate() (bool, error) {
	return _Governance.Contract.InProgressProposalsAreUpToDate(&_Governance.CallOpts)
}

// IsGovernanceAddress is a free data retrieval call binding the contract method 0x0ea77307.
//
// Solidity: function isGovernanceAddress() pure returns(bool)
func (_Governance *GovernanceCaller) IsGovernanceAddress(opts *bind.CallOpts) (bool, error) {
	var out []interface{}
	err := _Governance.contract.Call(opts, &out, "isGovernanceAddress")

	if err != nil {
		return *new(bool), err
	}

	out0 := *abi.ConvertType(out[0], new(bool)).(*bool)

	return out0, err

}

// IsGovernanceAddress is a free data retrieval call binding the contract method 0x0ea77307.
//
// Solidity: function isGovernanceAddress() pure returns(bool)
func (_Governance *GovernanceSession) IsGovernanceAddress() (bool, error) {
	return _Governance.Contract.IsGovernanceAddress(&_Governance.CallOpts)
}

// IsGovernanceAddress is a free data retrieval call binding the contract method 0x0ea77307.
//
// Solidity: function isGovernanceAddress() pure returns(bool)
func (_Governance *GovernanceCallerSession) IsGovernanceAddress() (bool, error) {
	return _Governance.Contract.IsGovernanceAddress(&_Governance.CallOpts)
}

// EvaluateProposalOutcome is a paid mutator transaction binding the contract method 0x7476f748.
//
// Solidity: function evaluateProposalOutcome(uint256 _proposalId) returns(uint8)
func (_Governance *GovernanceTransactor) EvaluateProposalOutcome(opts *bind.TransactOpts, _proposalId *big.Int) (*types.Transaction, error) {
	return _Governance.contract.Transact(opts, "evaluateProposalOutcome", _proposalId)
}

// EvaluateProposalOutcome is a paid mutator transaction binding the contract method 0x7476f748.
//
// Solidity: function evaluateProposalOutcome(uint256 _proposalId) returns(uint8)
func (_Governance *GovernanceSession) EvaluateProposalOutcome(_proposalId *big.Int) (*types.Transaction, error) {
	return _Governance.Contract.EvaluateProposalOutcome(&_Governance.TransactOpts, _proposalId)
}

// EvaluateProposalOutcome is a paid mutator transaction binding the contract method 0x7476f748.
//
// Solidity: function evaluateProposalOutcome(uint256 _proposalId) returns(uint8)
func (_Governance *GovernanceTransactorSession) EvaluateProposalOutcome(_proposalId *big.Int) (*types.Transaction, error) {
	return _Governance.Contract.EvaluateProposalOutcome(&_Governance.TransactOpts, _proposalId)
}

// GuardianExecuteTransaction is a paid mutator transaction binding the contract method 0xb4e12e2c.
//
// Solidity: function guardianExecuteTransaction(bytes32 _targetContractRegistryKey, uint256 _callValue, string _functionSignature, bytes _callData) returns()
func (_Governance *GovernanceTransactor) GuardianExecuteTransaction(opts *bind.TransactOpts, _targetContractRegistryKey [32]byte, _callValue *big.Int, _functionSignature string, _callData []byte) (*types.Transaction, error) {
	return _Governance.contract.Transact(opts, "guardianExecuteTransaction", _targetContractRegistryKey, _callValue, _functionSignature, _callData)
}

// GuardianExecuteTransaction is a paid mutator transaction binding the contract method 0xb4e12e2c.
//
// Solidity: function guardianExecuteTransaction(bytes32 _targetContractRegistryKey, uint256 _callValue, string _functionSignature, bytes _callData) returns()
func (_Governance *GovernanceSession) GuardianExecuteTransaction(_targetContractRegistryKey [32]byte, _callValue *big.Int, _functionSignature string, _callData []byte) (*types.Transaction, error) {
	return _Governance.Contract.GuardianExecuteTransaction(&_Governance.TransactOpts, _targetContractRegistryKey, _callValue, _functionSignature, _callData)
}

// GuardianExecuteTransaction is a paid mutator transaction binding the contract method 0xb4e12e2c.
//
// Solidity: function guardianExecuteTransaction(bytes32 _targetContractRegistryKey, uint256 _callValue, string _functionSignature, bytes _callData) returns()
func (_Governance *GovernanceTransactorSession) GuardianExecuteTransaction(_targetContractRegistryKey [32]byte, _callValue *big.Int, _functionSignature string, _callData []byte) (*types.Transaction, error) {
	return _Governance.Contract.GuardianExecuteTransaction(&_Governance.TransactOpts, _targetContractRegistryKey, _callValue, _functionSignature, _callData)
}

// Initialize is a paid mutator transaction binding the contract method 0x55c66ac1.
//
// Solidity: function initialize(address _registryAddress, uint256 _votingPeriod, uint256 _executionDelay, uint256 _votingQuorumPercent, uint16 _maxInProgressProposals, address _guardianAddress) returns()
func (_Governance *GovernanceTransactor) Initialize(opts *bind.TransactOpts, _registryAddress common.Address, _votingPeriod *big.Int, _executionDelay *big.Int, _votingQuorumPercent *big.Int, _maxInProgressProposals uint16, _guardianAddress common.Address) (*types.Transaction, error) {
	return _Governance.contract.Transact(opts, "initialize", _registryAddress, _votingPeriod, _executionDelay, _votingQuorumPercent, _maxInProgressProposals, _guardianAddress)
}

// Initialize is a paid mutator transaction binding the contract method 0x55c66ac1.
//
// Solidity: function initialize(address _registryAddress, uint256 _votingPeriod, uint256 _executionDelay, uint256 _votingQuorumPercent, uint16 _maxInProgressProposals, address _guardianAddress) returns()
func (_Governance *GovernanceSession) Initialize(_registryAddress common.Address, _votingPeriod *big.Int, _executionDelay *big.Int, _votingQuorumPercent *big.Int, _maxInProgressProposals uint16, _guardianAddress common.Address) (*types.Transaction, error) {
	return _Governance.Contract.Initialize(&_Governance.TransactOpts, _registryAddress, _votingPeriod, _executionDelay, _votingQuorumPercent, _maxInProgressProposals, _guardianAddress)
}

// Initialize is a paid mutator transaction binding the contract method 0x55c66ac1.
//
// Solidity: function initialize(address _registryAddress, uint256 _votingPeriod, uint256 _executionDelay, uint256 _votingQuorumPercent, uint16 _maxInProgressProposals, address _guardianAddress) returns()
func (_Governance *GovernanceTransactorSession) Initialize(_registryAddress common.Address, _votingPeriod *big.Int, _executionDelay *big.Int, _votingQuorumPercent *big.Int, _maxInProgressProposals uint16, _guardianAddress common.Address) (*types.Transaction, error) {
	return _Governance.Contract.Initialize(&_Governance.TransactOpts, _registryAddress, _votingPeriod, _executionDelay, _votingQuorumPercent, _maxInProgressProposals, _guardianAddress)
}

// Initialize0 is a paid mutator transaction binding the contract method 0x8129fc1c.
//
// Solidity: function initialize() returns()
func (_Governance *GovernanceTransactor) Initialize0(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _Governance.contract.Transact(opts, "initialize0")
}

// Initialize0 is a paid mutator transaction binding the contract method 0x8129fc1c.
//
// Solidity: function initialize() returns()
func (_Governance *GovernanceSession) Initialize0() (*types.Transaction, error) {
	return _Governance.Contract.Initialize0(&_Governance.TransactOpts)
}

// Initialize0 is a paid mutator transaction binding the contract method 0x8129fc1c.
//
// Solidity: function initialize() returns()
func (_Governance *GovernanceTransactorSession) Initialize0() (*types.Transaction, error) {
	return _Governance.Contract.Initialize0(&_Governance.TransactOpts)
}

// SetDelegateManagerAddress is a paid mutator transaction binding the contract method 0xea63d651.
//
// Solidity: function setDelegateManagerAddress(address _delegateManagerAddress) returns()
func (_Governance *GovernanceTransactor) SetDelegateManagerAddress(opts *bind.TransactOpts, _delegateManagerAddress common.Address) (*types.Transaction, error) {
	return _Governance.contract.Transact(opts, "setDelegateManagerAddress", _delegateManagerAddress)
}

// SetDelegateManagerAddress is a paid mutator transaction binding the contract method 0xea63d651.
//
// Solidity: function setDelegateManagerAddress(address _delegateManagerAddress) returns()
func (_Governance *GovernanceSession) SetDelegateManagerAddress(_delegateManagerAddress common.Address) (*types.Transaction, error) {
	return _Governance.Contract.SetDelegateManagerAddress(&_Governance.TransactOpts, _delegateManagerAddress)
}

// SetDelegateManagerAddress is a paid mutator transaction binding the contract method 0xea63d651.
//
// Solidity: function setDelegateManagerAddress(address _delegateManagerAddress) returns()
func (_Governance *GovernanceTransactorSession) SetDelegateManagerAddress(_delegateManagerAddress common.Address) (*types.Transaction, error) {
	return _Governance.Contract.SetDelegateManagerAddress(&_Governance.TransactOpts, _delegateManagerAddress)
}

// SetExecutionDelay is a paid mutator transaction binding the contract method 0xe4917d9f.
//
// Solidity: function setExecutionDelay(uint256 _newExecutionDelay) returns()
func (_Governance *GovernanceTransactor) SetExecutionDelay(opts *bind.TransactOpts, _newExecutionDelay *big.Int) (*types.Transaction, error) {
	return _Governance.contract.Transact(opts, "setExecutionDelay", _newExecutionDelay)
}

// SetExecutionDelay is a paid mutator transaction binding the contract method 0xe4917d9f.
//
// Solidity: function setExecutionDelay(uint256 _newExecutionDelay) returns()
func (_Governance *GovernanceSession) SetExecutionDelay(_newExecutionDelay *big.Int) (*types.Transaction, error) {
	return _Governance.Contract.SetExecutionDelay(&_Governance.TransactOpts, _newExecutionDelay)
}

// SetExecutionDelay is a paid mutator transaction binding the contract method 0xe4917d9f.
//
// Solidity: function setExecutionDelay(uint256 _newExecutionDelay) returns()
func (_Governance *GovernanceTransactorSession) SetExecutionDelay(_newExecutionDelay *big.Int) (*types.Transaction, error) {
	return _Governance.Contract.SetExecutionDelay(&_Governance.TransactOpts, _newExecutionDelay)
}

// SetMaxInProgressProposals is a paid mutator transaction binding the contract method 0xc47afb54.
//
// Solidity: function setMaxInProgressProposals(uint16 _newMaxInProgressProposals) returns()
func (_Governance *GovernanceTransactor) SetMaxInProgressProposals(opts *bind.TransactOpts, _newMaxInProgressProposals uint16) (*types.Transaction, error) {
	return _Governance.contract.Transact(opts, "setMaxInProgressProposals", _newMaxInProgressProposals)
}

// SetMaxInProgressProposals is a paid mutator transaction binding the contract method 0xc47afb54.
//
// Solidity: function setMaxInProgressProposals(uint16 _newMaxInProgressProposals) returns()
func (_Governance *GovernanceSession) SetMaxInProgressProposals(_newMaxInProgressProposals uint16) (*types.Transaction, error) {
	return _Governance.Contract.SetMaxInProgressProposals(&_Governance.TransactOpts, _newMaxInProgressProposals)
}

// SetMaxInProgressProposals is a paid mutator transaction binding the contract method 0xc47afb54.
//
// Solidity: function setMaxInProgressProposals(uint16 _newMaxInProgressProposals) returns()
func (_Governance *GovernanceTransactorSession) SetMaxInProgressProposals(_newMaxInProgressProposals uint16) (*types.Transaction, error) {
	return _Governance.Contract.SetMaxInProgressProposals(&_Governance.TransactOpts, _newMaxInProgressProposals)
}

// SetRegistryAddress is a paid mutator transaction binding the contract method 0xab7b4993.
//
// Solidity: function setRegistryAddress(address _registryAddress) returns()
func (_Governance *GovernanceTransactor) SetRegistryAddress(opts *bind.TransactOpts, _registryAddress common.Address) (*types.Transaction, error) {
	return _Governance.contract.Transact(opts, "setRegistryAddress", _registryAddress)
}

// SetRegistryAddress is a paid mutator transaction binding the contract method 0xab7b4993.
//
// Solidity: function setRegistryAddress(address _registryAddress) returns()
func (_Governance *GovernanceSession) SetRegistryAddress(_registryAddress common.Address) (*types.Transaction, error) {
	return _Governance.Contract.SetRegistryAddress(&_Governance.TransactOpts, _registryAddress)
}

// SetRegistryAddress is a paid mutator transaction binding the contract method 0xab7b4993.
//
// Solidity: function setRegistryAddress(address _registryAddress) returns()
func (_Governance *GovernanceTransactorSession) SetRegistryAddress(_registryAddress common.Address) (*types.Transaction, error) {
	return _Governance.Contract.SetRegistryAddress(&_Governance.TransactOpts, _registryAddress)
}

// SetServiceProviderFactoryAddress is a paid mutator transaction binding the contract method 0x201ae9db.
//
// Solidity: function setServiceProviderFactoryAddress(address _serviceProviderFactoryAddress) returns()
func (_Governance *GovernanceTransactor) SetServiceProviderFactoryAddress(opts *bind.TransactOpts, _serviceProviderFactoryAddress common.Address) (*types.Transaction, error) {
	return _Governance.contract.Transact(opts, "setServiceProviderFactoryAddress", _serviceProviderFactoryAddress)
}

// SetServiceProviderFactoryAddress is a paid mutator transaction binding the contract method 0x201ae9db.
//
// Solidity: function setServiceProviderFactoryAddress(address _serviceProviderFactoryAddress) returns()
func (_Governance *GovernanceSession) SetServiceProviderFactoryAddress(_serviceProviderFactoryAddress common.Address) (*types.Transaction, error) {
	return _Governance.Contract.SetServiceProviderFactoryAddress(&_Governance.TransactOpts, _serviceProviderFactoryAddress)
}

// SetServiceProviderFactoryAddress is a paid mutator transaction binding the contract method 0x201ae9db.
//
// Solidity: function setServiceProviderFactoryAddress(address _serviceProviderFactoryAddress) returns()
func (_Governance *GovernanceTransactorSession) SetServiceProviderFactoryAddress(_serviceProviderFactoryAddress common.Address) (*types.Transaction, error) {
	return _Governance.Contract.SetServiceProviderFactoryAddress(&_Governance.TransactOpts, _serviceProviderFactoryAddress)
}

// SetStakingAddress is a paid mutator transaction binding the contract method 0xf4e0d9ac.
//
// Solidity: function setStakingAddress(address _stakingAddress) returns()
func (_Governance *GovernanceTransactor) SetStakingAddress(opts *bind.TransactOpts, _stakingAddress common.Address) (*types.Transaction, error) {
	return _Governance.contract.Transact(opts, "setStakingAddress", _stakingAddress)
}

// SetStakingAddress is a paid mutator transaction binding the contract method 0xf4e0d9ac.
//
// Solidity: function setStakingAddress(address _stakingAddress) returns()
func (_Governance *GovernanceSession) SetStakingAddress(_stakingAddress common.Address) (*types.Transaction, error) {
	return _Governance.Contract.SetStakingAddress(&_Governance.TransactOpts, _stakingAddress)
}

// SetStakingAddress is a paid mutator transaction binding the contract method 0xf4e0d9ac.
//
// Solidity: function setStakingAddress(address _stakingAddress) returns()
func (_Governance *GovernanceTransactorSession) SetStakingAddress(_stakingAddress common.Address) (*types.Transaction, error) {
	return _Governance.Contract.SetStakingAddress(&_Governance.TransactOpts, _stakingAddress)
}

// SetVotingPeriod is a paid mutator transaction binding the contract method 0xea0217cf.
//
// Solidity: function setVotingPeriod(uint256 _votingPeriod) returns()
func (_Governance *GovernanceTransactor) SetVotingPeriod(opts *bind.TransactOpts, _votingPeriod *big.Int) (*types.Transaction, error) {
	return _Governance.contract.Transact(opts, "setVotingPeriod", _votingPeriod)
}

// SetVotingPeriod is a paid mutator transaction binding the contract method 0xea0217cf.
//
// Solidity: function setVotingPeriod(uint256 _votingPeriod) returns()
func (_Governance *GovernanceSession) SetVotingPeriod(_votingPeriod *big.Int) (*types.Transaction, error) {
	return _Governance.Contract.SetVotingPeriod(&_Governance.TransactOpts, _votingPeriod)
}

// SetVotingPeriod is a paid mutator transaction binding the contract method 0xea0217cf.
//
// Solidity: function setVotingPeriod(uint256 _votingPeriod) returns()
func (_Governance *GovernanceTransactorSession) SetVotingPeriod(_votingPeriod *big.Int) (*types.Transaction, error) {
	return _Governance.Contract.SetVotingPeriod(&_Governance.TransactOpts, _votingPeriod)
}

// SetVotingQuorumPercent is a paid mutator transaction binding the contract method 0x8aeda86b.
//
// Solidity: function setVotingQuorumPercent(uint256 _votingQuorumPercent) returns()
func (_Governance *GovernanceTransactor) SetVotingQuorumPercent(opts *bind.TransactOpts, _votingQuorumPercent *big.Int) (*types.Transaction, error) {
	return _Governance.contract.Transact(opts, "setVotingQuorumPercent", _votingQuorumPercent)
}

// SetVotingQuorumPercent is a paid mutator transaction binding the contract method 0x8aeda86b.
//
// Solidity: function setVotingQuorumPercent(uint256 _votingQuorumPercent) returns()
func (_Governance *GovernanceSession) SetVotingQuorumPercent(_votingQuorumPercent *big.Int) (*types.Transaction, error) {
	return _Governance.Contract.SetVotingQuorumPercent(&_Governance.TransactOpts, _votingQuorumPercent)
}

// SetVotingQuorumPercent is a paid mutator transaction binding the contract method 0x8aeda86b.
//
// Solidity: function setVotingQuorumPercent(uint256 _votingQuorumPercent) returns()
func (_Governance *GovernanceTransactorSession) SetVotingQuorumPercent(_votingQuorumPercent *big.Int) (*types.Transaction, error) {
	return _Governance.Contract.SetVotingQuorumPercent(&_Governance.TransactOpts, _votingQuorumPercent)
}

// SubmitProposal is a paid mutator transaction binding the contract method 0x9fa0bc94.
//
// Solidity: function submitProposal(bytes32 _targetContractRegistryKey, uint256 _callValue, string _functionSignature, bytes _callData, string _name, string _description) returns(uint256)
func (_Governance *GovernanceTransactor) SubmitProposal(opts *bind.TransactOpts, _targetContractRegistryKey [32]byte, _callValue *big.Int, _functionSignature string, _callData []byte, _name string, _description string) (*types.Transaction, error) {
	return _Governance.contract.Transact(opts, "submitProposal", _targetContractRegistryKey, _callValue, _functionSignature, _callData, _name, _description)
}

// SubmitProposal is a paid mutator transaction binding the contract method 0x9fa0bc94.
//
// Solidity: function submitProposal(bytes32 _targetContractRegistryKey, uint256 _callValue, string _functionSignature, bytes _callData, string _name, string _description) returns(uint256)
func (_Governance *GovernanceSession) SubmitProposal(_targetContractRegistryKey [32]byte, _callValue *big.Int, _functionSignature string, _callData []byte, _name string, _description string) (*types.Transaction, error) {
	return _Governance.Contract.SubmitProposal(&_Governance.TransactOpts, _targetContractRegistryKey, _callValue, _functionSignature, _callData, _name, _description)
}

// SubmitProposal is a paid mutator transaction binding the contract method 0x9fa0bc94.
//
// Solidity: function submitProposal(bytes32 _targetContractRegistryKey, uint256 _callValue, string _functionSignature, bytes _callData, string _name, string _description) returns(uint256)
func (_Governance *GovernanceTransactorSession) SubmitProposal(_targetContractRegistryKey [32]byte, _callValue *big.Int, _functionSignature string, _callData []byte, _name string, _description string) (*types.Transaction, error) {
	return _Governance.Contract.SubmitProposal(&_Governance.TransactOpts, _targetContractRegistryKey, _callValue, _functionSignature, _callData, _name, _description)
}

// SubmitVote is a paid mutator transaction binding the contract method 0x99653fbe.
//
// Solidity: function submitVote(uint256 _proposalId, uint8 _vote) returns()
func (_Governance *GovernanceTransactor) SubmitVote(opts *bind.TransactOpts, _proposalId *big.Int, _vote uint8) (*types.Transaction, error) {
	return _Governance.contract.Transact(opts, "submitVote", _proposalId, _vote)
}

// SubmitVote is a paid mutator transaction binding the contract method 0x99653fbe.
//
// Solidity: function submitVote(uint256 _proposalId, uint8 _vote) returns()
func (_Governance *GovernanceSession) SubmitVote(_proposalId *big.Int, _vote uint8) (*types.Transaction, error) {
	return _Governance.Contract.SubmitVote(&_Governance.TransactOpts, _proposalId, _vote)
}

// SubmitVote is a paid mutator transaction binding the contract method 0x99653fbe.
//
// Solidity: function submitVote(uint256 _proposalId, uint8 _vote) returns()
func (_Governance *GovernanceTransactorSession) SubmitVote(_proposalId *big.Int, _vote uint8) (*types.Transaction, error) {
	return _Governance.Contract.SubmitVote(&_Governance.TransactOpts, _proposalId, _vote)
}

// TransferGuardianship is a paid mutator transaction binding the contract method 0x9cef4240.
//
// Solidity: function transferGuardianship(address _newGuardianAddress) returns()
func (_Governance *GovernanceTransactor) TransferGuardianship(opts *bind.TransactOpts, _newGuardianAddress common.Address) (*types.Transaction, error) {
	return _Governance.contract.Transact(opts, "transferGuardianship", _newGuardianAddress)
}

// TransferGuardianship is a paid mutator transaction binding the contract method 0x9cef4240.
//
// Solidity: function transferGuardianship(address _newGuardianAddress) returns()
func (_Governance *GovernanceSession) TransferGuardianship(_newGuardianAddress common.Address) (*types.Transaction, error) {
	return _Governance.Contract.TransferGuardianship(&_Governance.TransactOpts, _newGuardianAddress)
}

// TransferGuardianship is a paid mutator transaction binding the contract method 0x9cef4240.
//
// Solidity: function transferGuardianship(address _newGuardianAddress) returns()
func (_Governance *GovernanceTransactorSession) TransferGuardianship(_newGuardianAddress common.Address) (*types.Transaction, error) {
	return _Governance.Contract.TransferGuardianship(&_Governance.TransactOpts, _newGuardianAddress)
}

// UpdateVote is a paid mutator transaction binding the contract method 0x6ec9e644.
//
// Solidity: function updateVote(uint256 _proposalId, uint8 _vote) returns()
func (_Governance *GovernanceTransactor) UpdateVote(opts *bind.TransactOpts, _proposalId *big.Int, _vote uint8) (*types.Transaction, error) {
	return _Governance.contract.Transact(opts, "updateVote", _proposalId, _vote)
}

// UpdateVote is a paid mutator transaction binding the contract method 0x6ec9e644.
//
// Solidity: function updateVote(uint256 _proposalId, uint8 _vote) returns()
func (_Governance *GovernanceSession) UpdateVote(_proposalId *big.Int, _vote uint8) (*types.Transaction, error) {
	return _Governance.Contract.UpdateVote(&_Governance.TransactOpts, _proposalId, _vote)
}

// UpdateVote is a paid mutator transaction binding the contract method 0x6ec9e644.
//
// Solidity: function updateVote(uint256 _proposalId, uint8 _vote) returns()
func (_Governance *GovernanceTransactorSession) UpdateVote(_proposalId *big.Int, _vote uint8) (*types.Transaction, error) {
	return _Governance.Contract.UpdateVote(&_Governance.TransactOpts, _proposalId, _vote)
}

// VetoProposal is a paid mutator transaction binding the contract method 0x6f65108c.
//
// Solidity: function vetoProposal(uint256 _proposalId) returns()
func (_Governance *GovernanceTransactor) VetoProposal(opts *bind.TransactOpts, _proposalId *big.Int) (*types.Transaction, error) {
	return _Governance.contract.Transact(opts, "vetoProposal", _proposalId)
}

// VetoProposal is a paid mutator transaction binding the contract method 0x6f65108c.
//
// Solidity: function vetoProposal(uint256 _proposalId) returns()
func (_Governance *GovernanceSession) VetoProposal(_proposalId *big.Int) (*types.Transaction, error) {
	return _Governance.Contract.VetoProposal(&_Governance.TransactOpts, _proposalId)
}

// VetoProposal is a paid mutator transaction binding the contract method 0x6f65108c.
//
// Solidity: function vetoProposal(uint256 _proposalId) returns()
func (_Governance *GovernanceTransactorSession) VetoProposal(_proposalId *big.Int) (*types.Transaction, error) {
	return _Governance.Contract.VetoProposal(&_Governance.TransactOpts, _proposalId)
}

// GovernanceExecutionDelayUpdatedIterator is returned from FilterExecutionDelayUpdated and is used to iterate over the raw logs and unpacked data for ExecutionDelayUpdated events raised by the Governance contract.
type GovernanceExecutionDelayUpdatedIterator struct {
	Event *GovernanceExecutionDelayUpdated // Event containing the contract specifics and raw log

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
func (it *GovernanceExecutionDelayUpdatedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(GovernanceExecutionDelayUpdated)
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
		it.Event = new(GovernanceExecutionDelayUpdated)
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
func (it *GovernanceExecutionDelayUpdatedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *GovernanceExecutionDelayUpdatedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// GovernanceExecutionDelayUpdated represents a ExecutionDelayUpdated event raised by the Governance contract.
type GovernanceExecutionDelayUpdated struct {
	NewExecutionDelay *big.Int
	Raw               types.Log // Blockchain specific contextual infos
}

// FilterExecutionDelayUpdated is a free log retrieval operation binding the contract event 0x04aa79a5e8a5e68218f378c9b9ecf136054085d35534faf89462199fb969d1c6.
//
// Solidity: event ExecutionDelayUpdated(uint256 indexed _newExecutionDelay)
func (_Governance *GovernanceFilterer) FilterExecutionDelayUpdated(opts *bind.FilterOpts, _newExecutionDelay []*big.Int) (*GovernanceExecutionDelayUpdatedIterator, error) {

	var _newExecutionDelayRule []interface{}
	for _, _newExecutionDelayItem := range _newExecutionDelay {
		_newExecutionDelayRule = append(_newExecutionDelayRule, _newExecutionDelayItem)
	}

	logs, sub, err := _Governance.contract.FilterLogs(opts, "ExecutionDelayUpdated", _newExecutionDelayRule)
	if err != nil {
		return nil, err
	}
	return &GovernanceExecutionDelayUpdatedIterator{contract: _Governance.contract, event: "ExecutionDelayUpdated", logs: logs, sub: sub}, nil
}

// WatchExecutionDelayUpdated is a free log subscription operation binding the contract event 0x04aa79a5e8a5e68218f378c9b9ecf136054085d35534faf89462199fb969d1c6.
//
// Solidity: event ExecutionDelayUpdated(uint256 indexed _newExecutionDelay)
func (_Governance *GovernanceFilterer) WatchExecutionDelayUpdated(opts *bind.WatchOpts, sink chan<- *GovernanceExecutionDelayUpdated, _newExecutionDelay []*big.Int) (event.Subscription, error) {

	var _newExecutionDelayRule []interface{}
	for _, _newExecutionDelayItem := range _newExecutionDelay {
		_newExecutionDelayRule = append(_newExecutionDelayRule, _newExecutionDelayItem)
	}

	logs, sub, err := _Governance.contract.WatchLogs(opts, "ExecutionDelayUpdated", _newExecutionDelayRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(GovernanceExecutionDelayUpdated)
				if err := _Governance.contract.UnpackLog(event, "ExecutionDelayUpdated", log); err != nil {
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

// ParseExecutionDelayUpdated is a log parse operation binding the contract event 0x04aa79a5e8a5e68218f378c9b9ecf136054085d35534faf89462199fb969d1c6.
//
// Solidity: event ExecutionDelayUpdated(uint256 indexed _newExecutionDelay)
func (_Governance *GovernanceFilterer) ParseExecutionDelayUpdated(log types.Log) (*GovernanceExecutionDelayUpdated, error) {
	event := new(GovernanceExecutionDelayUpdated)
	if err := _Governance.contract.UnpackLog(event, "ExecutionDelayUpdated", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// GovernanceGuardianTransactionExecutedIterator is returned from FilterGuardianTransactionExecuted and is used to iterate over the raw logs and unpacked data for GuardianTransactionExecuted events raised by the Governance contract.
type GovernanceGuardianTransactionExecutedIterator struct {
	Event *GovernanceGuardianTransactionExecuted // Event containing the contract specifics and raw log

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
func (it *GovernanceGuardianTransactionExecutedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(GovernanceGuardianTransactionExecuted)
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
		it.Event = new(GovernanceGuardianTransactionExecuted)
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
func (it *GovernanceGuardianTransactionExecutedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *GovernanceGuardianTransactionExecutedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// GovernanceGuardianTransactionExecuted represents a GuardianTransactionExecuted event raised by the Governance contract.
type GovernanceGuardianTransactionExecuted struct {
	TargetContractAddress common.Address
	CallValue             *big.Int
	FunctionSignature     common.Hash
	CallData              common.Hash
	ReturnData            []byte
	Raw                   types.Log // Blockchain specific contextual infos
}

// FilterGuardianTransactionExecuted is a free log retrieval operation binding the contract event 0x1ed1b90f960f5def1ae3c55d9fe576389498fe6a1e2e44659f7f08f74f4f21ce.
//
// Solidity: event GuardianTransactionExecuted(address indexed _targetContractAddress, uint256 _callValue, string indexed _functionSignature, bytes indexed _callData, bytes _returnData)
func (_Governance *GovernanceFilterer) FilterGuardianTransactionExecuted(opts *bind.FilterOpts, _targetContractAddress []common.Address, _functionSignature []string, _callData [][]byte) (*GovernanceGuardianTransactionExecutedIterator, error) {

	var _targetContractAddressRule []interface{}
	for _, _targetContractAddressItem := range _targetContractAddress {
		_targetContractAddressRule = append(_targetContractAddressRule, _targetContractAddressItem)
	}

	var _functionSignatureRule []interface{}
	for _, _functionSignatureItem := range _functionSignature {
		_functionSignatureRule = append(_functionSignatureRule, _functionSignatureItem)
	}
	var _callDataRule []interface{}
	for _, _callDataItem := range _callData {
		_callDataRule = append(_callDataRule, _callDataItem)
	}

	logs, sub, err := _Governance.contract.FilterLogs(opts, "GuardianTransactionExecuted", _targetContractAddressRule, _functionSignatureRule, _callDataRule)
	if err != nil {
		return nil, err
	}
	return &GovernanceGuardianTransactionExecutedIterator{contract: _Governance.contract, event: "GuardianTransactionExecuted", logs: logs, sub: sub}, nil
}

// WatchGuardianTransactionExecuted is a free log subscription operation binding the contract event 0x1ed1b90f960f5def1ae3c55d9fe576389498fe6a1e2e44659f7f08f74f4f21ce.
//
// Solidity: event GuardianTransactionExecuted(address indexed _targetContractAddress, uint256 _callValue, string indexed _functionSignature, bytes indexed _callData, bytes _returnData)
func (_Governance *GovernanceFilterer) WatchGuardianTransactionExecuted(opts *bind.WatchOpts, sink chan<- *GovernanceGuardianTransactionExecuted, _targetContractAddress []common.Address, _functionSignature []string, _callData [][]byte) (event.Subscription, error) {

	var _targetContractAddressRule []interface{}
	for _, _targetContractAddressItem := range _targetContractAddress {
		_targetContractAddressRule = append(_targetContractAddressRule, _targetContractAddressItem)
	}

	var _functionSignatureRule []interface{}
	for _, _functionSignatureItem := range _functionSignature {
		_functionSignatureRule = append(_functionSignatureRule, _functionSignatureItem)
	}
	var _callDataRule []interface{}
	for _, _callDataItem := range _callData {
		_callDataRule = append(_callDataRule, _callDataItem)
	}

	logs, sub, err := _Governance.contract.WatchLogs(opts, "GuardianTransactionExecuted", _targetContractAddressRule, _functionSignatureRule, _callDataRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(GovernanceGuardianTransactionExecuted)
				if err := _Governance.contract.UnpackLog(event, "GuardianTransactionExecuted", log); err != nil {
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

// ParseGuardianTransactionExecuted is a log parse operation binding the contract event 0x1ed1b90f960f5def1ae3c55d9fe576389498fe6a1e2e44659f7f08f74f4f21ce.
//
// Solidity: event GuardianTransactionExecuted(address indexed _targetContractAddress, uint256 _callValue, string indexed _functionSignature, bytes indexed _callData, bytes _returnData)
func (_Governance *GovernanceFilterer) ParseGuardianTransactionExecuted(log types.Log) (*GovernanceGuardianTransactionExecuted, error) {
	event := new(GovernanceGuardianTransactionExecuted)
	if err := _Governance.contract.UnpackLog(event, "GuardianTransactionExecuted", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// GovernanceGuardianshipTransferredIterator is returned from FilterGuardianshipTransferred and is used to iterate over the raw logs and unpacked data for GuardianshipTransferred events raised by the Governance contract.
type GovernanceGuardianshipTransferredIterator struct {
	Event *GovernanceGuardianshipTransferred // Event containing the contract specifics and raw log

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
func (it *GovernanceGuardianshipTransferredIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(GovernanceGuardianshipTransferred)
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
		it.Event = new(GovernanceGuardianshipTransferred)
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
func (it *GovernanceGuardianshipTransferredIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *GovernanceGuardianshipTransferredIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// GovernanceGuardianshipTransferred represents a GuardianshipTransferred event raised by the Governance contract.
type GovernanceGuardianshipTransferred struct {
	NewGuardianAddress common.Address
	Raw                types.Log // Blockchain specific contextual infos
}

// FilterGuardianshipTransferred is a free log retrieval operation binding the contract event 0x83791e7c241cba88803a090fb286396572e88ebaea51be583bd10f82356ac416.
//
// Solidity: event GuardianshipTransferred(address indexed _newGuardianAddress)
func (_Governance *GovernanceFilterer) FilterGuardianshipTransferred(opts *bind.FilterOpts, _newGuardianAddress []common.Address) (*GovernanceGuardianshipTransferredIterator, error) {

	var _newGuardianAddressRule []interface{}
	for _, _newGuardianAddressItem := range _newGuardianAddress {
		_newGuardianAddressRule = append(_newGuardianAddressRule, _newGuardianAddressItem)
	}

	logs, sub, err := _Governance.contract.FilterLogs(opts, "GuardianshipTransferred", _newGuardianAddressRule)
	if err != nil {
		return nil, err
	}
	return &GovernanceGuardianshipTransferredIterator{contract: _Governance.contract, event: "GuardianshipTransferred", logs: logs, sub: sub}, nil
}

// WatchGuardianshipTransferred is a free log subscription operation binding the contract event 0x83791e7c241cba88803a090fb286396572e88ebaea51be583bd10f82356ac416.
//
// Solidity: event GuardianshipTransferred(address indexed _newGuardianAddress)
func (_Governance *GovernanceFilterer) WatchGuardianshipTransferred(opts *bind.WatchOpts, sink chan<- *GovernanceGuardianshipTransferred, _newGuardianAddress []common.Address) (event.Subscription, error) {

	var _newGuardianAddressRule []interface{}
	for _, _newGuardianAddressItem := range _newGuardianAddress {
		_newGuardianAddressRule = append(_newGuardianAddressRule, _newGuardianAddressItem)
	}

	logs, sub, err := _Governance.contract.WatchLogs(opts, "GuardianshipTransferred", _newGuardianAddressRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(GovernanceGuardianshipTransferred)
				if err := _Governance.contract.UnpackLog(event, "GuardianshipTransferred", log); err != nil {
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

// ParseGuardianshipTransferred is a log parse operation binding the contract event 0x83791e7c241cba88803a090fb286396572e88ebaea51be583bd10f82356ac416.
//
// Solidity: event GuardianshipTransferred(address indexed _newGuardianAddress)
func (_Governance *GovernanceFilterer) ParseGuardianshipTransferred(log types.Log) (*GovernanceGuardianshipTransferred, error) {
	event := new(GovernanceGuardianshipTransferred)
	if err := _Governance.contract.UnpackLog(event, "GuardianshipTransferred", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// GovernanceMaxInProgressProposalsUpdatedIterator is returned from FilterMaxInProgressProposalsUpdated and is used to iterate over the raw logs and unpacked data for MaxInProgressProposalsUpdated events raised by the Governance contract.
type GovernanceMaxInProgressProposalsUpdatedIterator struct {
	Event *GovernanceMaxInProgressProposalsUpdated // Event containing the contract specifics and raw log

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
func (it *GovernanceMaxInProgressProposalsUpdatedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(GovernanceMaxInProgressProposalsUpdated)
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
		it.Event = new(GovernanceMaxInProgressProposalsUpdated)
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
func (it *GovernanceMaxInProgressProposalsUpdatedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *GovernanceMaxInProgressProposalsUpdatedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// GovernanceMaxInProgressProposalsUpdated represents a MaxInProgressProposalsUpdated event raised by the Governance contract.
type GovernanceMaxInProgressProposalsUpdated struct {
	NewMaxInProgressProposals *big.Int
	Raw                       types.Log // Blockchain specific contextual infos
}

// FilterMaxInProgressProposalsUpdated is a free log retrieval operation binding the contract event 0x79913f9e27696795126259d88dbe46a5e074cd2602541360f5311a5755c42150.
//
// Solidity: event MaxInProgressProposalsUpdated(uint256 indexed _newMaxInProgressProposals)
func (_Governance *GovernanceFilterer) FilterMaxInProgressProposalsUpdated(opts *bind.FilterOpts, _newMaxInProgressProposals []*big.Int) (*GovernanceMaxInProgressProposalsUpdatedIterator, error) {

	var _newMaxInProgressProposalsRule []interface{}
	for _, _newMaxInProgressProposalsItem := range _newMaxInProgressProposals {
		_newMaxInProgressProposalsRule = append(_newMaxInProgressProposalsRule, _newMaxInProgressProposalsItem)
	}

	logs, sub, err := _Governance.contract.FilterLogs(opts, "MaxInProgressProposalsUpdated", _newMaxInProgressProposalsRule)
	if err != nil {
		return nil, err
	}
	return &GovernanceMaxInProgressProposalsUpdatedIterator{contract: _Governance.contract, event: "MaxInProgressProposalsUpdated", logs: logs, sub: sub}, nil
}

// WatchMaxInProgressProposalsUpdated is a free log subscription operation binding the contract event 0x79913f9e27696795126259d88dbe46a5e074cd2602541360f5311a5755c42150.
//
// Solidity: event MaxInProgressProposalsUpdated(uint256 indexed _newMaxInProgressProposals)
func (_Governance *GovernanceFilterer) WatchMaxInProgressProposalsUpdated(opts *bind.WatchOpts, sink chan<- *GovernanceMaxInProgressProposalsUpdated, _newMaxInProgressProposals []*big.Int) (event.Subscription, error) {

	var _newMaxInProgressProposalsRule []interface{}
	for _, _newMaxInProgressProposalsItem := range _newMaxInProgressProposals {
		_newMaxInProgressProposalsRule = append(_newMaxInProgressProposalsRule, _newMaxInProgressProposalsItem)
	}

	logs, sub, err := _Governance.contract.WatchLogs(opts, "MaxInProgressProposalsUpdated", _newMaxInProgressProposalsRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(GovernanceMaxInProgressProposalsUpdated)
				if err := _Governance.contract.UnpackLog(event, "MaxInProgressProposalsUpdated", log); err != nil {
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

// ParseMaxInProgressProposalsUpdated is a log parse operation binding the contract event 0x79913f9e27696795126259d88dbe46a5e074cd2602541360f5311a5755c42150.
//
// Solidity: event MaxInProgressProposalsUpdated(uint256 indexed _newMaxInProgressProposals)
func (_Governance *GovernanceFilterer) ParseMaxInProgressProposalsUpdated(log types.Log) (*GovernanceMaxInProgressProposalsUpdated, error) {
	event := new(GovernanceMaxInProgressProposalsUpdated)
	if err := _Governance.contract.UnpackLog(event, "MaxInProgressProposalsUpdated", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// GovernanceProposalOutcomeEvaluatedIterator is returned from FilterProposalOutcomeEvaluated and is used to iterate over the raw logs and unpacked data for ProposalOutcomeEvaluated events raised by the Governance contract.
type GovernanceProposalOutcomeEvaluatedIterator struct {
	Event *GovernanceProposalOutcomeEvaluated // Event containing the contract specifics and raw log

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
func (it *GovernanceProposalOutcomeEvaluatedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(GovernanceProposalOutcomeEvaluated)
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
		it.Event = new(GovernanceProposalOutcomeEvaluated)
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
func (it *GovernanceProposalOutcomeEvaluatedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *GovernanceProposalOutcomeEvaluatedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// GovernanceProposalOutcomeEvaluated represents a ProposalOutcomeEvaluated event raised by the Governance contract.
type GovernanceProposalOutcomeEvaluated struct {
	ProposalId       *big.Int
	Outcome          uint8
	VoteMagnitudeYes *big.Int
	VoteMagnitudeNo  *big.Int
	NumVotes         *big.Int
	Raw              types.Log // Blockchain specific contextual infos
}

// FilterProposalOutcomeEvaluated is a free log retrieval operation binding the contract event 0xb5c05f2b4df457fb2a62ca282c87338fa901f0b7de530321f507d59859cc11cf.
//
// Solidity: event ProposalOutcomeEvaluated(uint256 indexed _proposalId, uint8 indexed _outcome, uint256 _voteMagnitudeYes, uint256 _voteMagnitudeNo, uint256 _numVotes)
func (_Governance *GovernanceFilterer) FilterProposalOutcomeEvaluated(opts *bind.FilterOpts, _proposalId []*big.Int, _outcome []uint8) (*GovernanceProposalOutcomeEvaluatedIterator, error) {

	var _proposalIdRule []interface{}
	for _, _proposalIdItem := range _proposalId {
		_proposalIdRule = append(_proposalIdRule, _proposalIdItem)
	}
	var _outcomeRule []interface{}
	for _, _outcomeItem := range _outcome {
		_outcomeRule = append(_outcomeRule, _outcomeItem)
	}

	logs, sub, err := _Governance.contract.FilterLogs(opts, "ProposalOutcomeEvaluated", _proposalIdRule, _outcomeRule)
	if err != nil {
		return nil, err
	}
	return &GovernanceProposalOutcomeEvaluatedIterator{contract: _Governance.contract, event: "ProposalOutcomeEvaluated", logs: logs, sub: sub}, nil
}

// WatchProposalOutcomeEvaluated is a free log subscription operation binding the contract event 0xb5c05f2b4df457fb2a62ca282c87338fa901f0b7de530321f507d59859cc11cf.
//
// Solidity: event ProposalOutcomeEvaluated(uint256 indexed _proposalId, uint8 indexed _outcome, uint256 _voteMagnitudeYes, uint256 _voteMagnitudeNo, uint256 _numVotes)
func (_Governance *GovernanceFilterer) WatchProposalOutcomeEvaluated(opts *bind.WatchOpts, sink chan<- *GovernanceProposalOutcomeEvaluated, _proposalId []*big.Int, _outcome []uint8) (event.Subscription, error) {

	var _proposalIdRule []interface{}
	for _, _proposalIdItem := range _proposalId {
		_proposalIdRule = append(_proposalIdRule, _proposalIdItem)
	}
	var _outcomeRule []interface{}
	for _, _outcomeItem := range _outcome {
		_outcomeRule = append(_outcomeRule, _outcomeItem)
	}

	logs, sub, err := _Governance.contract.WatchLogs(opts, "ProposalOutcomeEvaluated", _proposalIdRule, _outcomeRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(GovernanceProposalOutcomeEvaluated)
				if err := _Governance.contract.UnpackLog(event, "ProposalOutcomeEvaluated", log); err != nil {
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

// ParseProposalOutcomeEvaluated is a log parse operation binding the contract event 0xb5c05f2b4df457fb2a62ca282c87338fa901f0b7de530321f507d59859cc11cf.
//
// Solidity: event ProposalOutcomeEvaluated(uint256 indexed _proposalId, uint8 indexed _outcome, uint256 _voteMagnitudeYes, uint256 _voteMagnitudeNo, uint256 _numVotes)
func (_Governance *GovernanceFilterer) ParseProposalOutcomeEvaluated(log types.Log) (*GovernanceProposalOutcomeEvaluated, error) {
	event := new(GovernanceProposalOutcomeEvaluated)
	if err := _Governance.contract.UnpackLog(event, "ProposalOutcomeEvaluated", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// GovernanceProposalSubmittedIterator is returned from FilterProposalSubmitted and is used to iterate over the raw logs and unpacked data for ProposalSubmitted events raised by the Governance contract.
type GovernanceProposalSubmittedIterator struct {
	Event *GovernanceProposalSubmitted // Event containing the contract specifics and raw log

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
func (it *GovernanceProposalSubmittedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(GovernanceProposalSubmitted)
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
		it.Event = new(GovernanceProposalSubmitted)
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
func (it *GovernanceProposalSubmittedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *GovernanceProposalSubmittedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// GovernanceProposalSubmitted represents a ProposalSubmitted event raised by the Governance contract.
type GovernanceProposalSubmitted struct {
	ProposalId  *big.Int
	Proposer    common.Address
	Name        string
	Description string
	Raw         types.Log // Blockchain specific contextual infos
}

// FilterProposalSubmitted is a free log retrieval operation binding the contract event 0x7edc618964f595eb3f96e87d2c01643484aa8490797eb47bd46680d0ad4c7f72.
//
// Solidity: event ProposalSubmitted(uint256 indexed _proposalId, address indexed _proposer, string _name, string _description)
func (_Governance *GovernanceFilterer) FilterProposalSubmitted(opts *bind.FilterOpts, _proposalId []*big.Int, _proposer []common.Address) (*GovernanceProposalSubmittedIterator, error) {

	var _proposalIdRule []interface{}
	for _, _proposalIdItem := range _proposalId {
		_proposalIdRule = append(_proposalIdRule, _proposalIdItem)
	}
	var _proposerRule []interface{}
	for _, _proposerItem := range _proposer {
		_proposerRule = append(_proposerRule, _proposerItem)
	}

	logs, sub, err := _Governance.contract.FilterLogs(opts, "ProposalSubmitted", _proposalIdRule, _proposerRule)
	if err != nil {
		return nil, err
	}
	return &GovernanceProposalSubmittedIterator{contract: _Governance.contract, event: "ProposalSubmitted", logs: logs, sub: sub}, nil
}

// WatchProposalSubmitted is a free log subscription operation binding the contract event 0x7edc618964f595eb3f96e87d2c01643484aa8490797eb47bd46680d0ad4c7f72.
//
// Solidity: event ProposalSubmitted(uint256 indexed _proposalId, address indexed _proposer, string _name, string _description)
func (_Governance *GovernanceFilterer) WatchProposalSubmitted(opts *bind.WatchOpts, sink chan<- *GovernanceProposalSubmitted, _proposalId []*big.Int, _proposer []common.Address) (event.Subscription, error) {

	var _proposalIdRule []interface{}
	for _, _proposalIdItem := range _proposalId {
		_proposalIdRule = append(_proposalIdRule, _proposalIdItem)
	}
	var _proposerRule []interface{}
	for _, _proposerItem := range _proposer {
		_proposerRule = append(_proposerRule, _proposerItem)
	}

	logs, sub, err := _Governance.contract.WatchLogs(opts, "ProposalSubmitted", _proposalIdRule, _proposerRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(GovernanceProposalSubmitted)
				if err := _Governance.contract.UnpackLog(event, "ProposalSubmitted", log); err != nil {
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

// ParseProposalSubmitted is a log parse operation binding the contract event 0x7edc618964f595eb3f96e87d2c01643484aa8490797eb47bd46680d0ad4c7f72.
//
// Solidity: event ProposalSubmitted(uint256 indexed _proposalId, address indexed _proposer, string _name, string _description)
func (_Governance *GovernanceFilterer) ParseProposalSubmitted(log types.Log) (*GovernanceProposalSubmitted, error) {
	event := new(GovernanceProposalSubmitted)
	if err := _Governance.contract.UnpackLog(event, "ProposalSubmitted", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// GovernanceProposalTransactionExecutedIterator is returned from FilterProposalTransactionExecuted and is used to iterate over the raw logs and unpacked data for ProposalTransactionExecuted events raised by the Governance contract.
type GovernanceProposalTransactionExecutedIterator struct {
	Event *GovernanceProposalTransactionExecuted // Event containing the contract specifics and raw log

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
func (it *GovernanceProposalTransactionExecutedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(GovernanceProposalTransactionExecuted)
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
		it.Event = new(GovernanceProposalTransactionExecuted)
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
func (it *GovernanceProposalTransactionExecutedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *GovernanceProposalTransactionExecutedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// GovernanceProposalTransactionExecuted represents a ProposalTransactionExecuted event raised by the Governance contract.
type GovernanceProposalTransactionExecuted struct {
	ProposalId *big.Int
	Success    bool
	ReturnData []byte
	Raw        types.Log // Blockchain specific contextual infos
}

// FilterProposalTransactionExecuted is a free log retrieval operation binding the contract event 0xa85727613e00cfd4688ad13995391ed4b4cd9e493bcb978393d8fddeec804dbd.
//
// Solidity: event ProposalTransactionExecuted(uint256 indexed _proposalId, bool indexed _success, bytes _returnData)
func (_Governance *GovernanceFilterer) FilterProposalTransactionExecuted(opts *bind.FilterOpts, _proposalId []*big.Int, _success []bool) (*GovernanceProposalTransactionExecutedIterator, error) {

	var _proposalIdRule []interface{}
	for _, _proposalIdItem := range _proposalId {
		_proposalIdRule = append(_proposalIdRule, _proposalIdItem)
	}
	var _successRule []interface{}
	for _, _successItem := range _success {
		_successRule = append(_successRule, _successItem)
	}

	logs, sub, err := _Governance.contract.FilterLogs(opts, "ProposalTransactionExecuted", _proposalIdRule, _successRule)
	if err != nil {
		return nil, err
	}
	return &GovernanceProposalTransactionExecutedIterator{contract: _Governance.contract, event: "ProposalTransactionExecuted", logs: logs, sub: sub}, nil
}

// WatchProposalTransactionExecuted is a free log subscription operation binding the contract event 0xa85727613e00cfd4688ad13995391ed4b4cd9e493bcb978393d8fddeec804dbd.
//
// Solidity: event ProposalTransactionExecuted(uint256 indexed _proposalId, bool indexed _success, bytes _returnData)
func (_Governance *GovernanceFilterer) WatchProposalTransactionExecuted(opts *bind.WatchOpts, sink chan<- *GovernanceProposalTransactionExecuted, _proposalId []*big.Int, _success []bool) (event.Subscription, error) {

	var _proposalIdRule []interface{}
	for _, _proposalIdItem := range _proposalId {
		_proposalIdRule = append(_proposalIdRule, _proposalIdItem)
	}
	var _successRule []interface{}
	for _, _successItem := range _success {
		_successRule = append(_successRule, _successItem)
	}

	logs, sub, err := _Governance.contract.WatchLogs(opts, "ProposalTransactionExecuted", _proposalIdRule, _successRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(GovernanceProposalTransactionExecuted)
				if err := _Governance.contract.UnpackLog(event, "ProposalTransactionExecuted", log); err != nil {
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

// ParseProposalTransactionExecuted is a log parse operation binding the contract event 0xa85727613e00cfd4688ad13995391ed4b4cd9e493bcb978393d8fddeec804dbd.
//
// Solidity: event ProposalTransactionExecuted(uint256 indexed _proposalId, bool indexed _success, bytes _returnData)
func (_Governance *GovernanceFilterer) ParseProposalTransactionExecuted(log types.Log) (*GovernanceProposalTransactionExecuted, error) {
	event := new(GovernanceProposalTransactionExecuted)
	if err := _Governance.contract.UnpackLog(event, "ProposalTransactionExecuted", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// GovernanceProposalVetoedIterator is returned from FilterProposalVetoed and is used to iterate over the raw logs and unpacked data for ProposalVetoed events raised by the Governance contract.
type GovernanceProposalVetoedIterator struct {
	Event *GovernanceProposalVetoed // Event containing the contract specifics and raw log

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
func (it *GovernanceProposalVetoedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(GovernanceProposalVetoed)
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
		it.Event = new(GovernanceProposalVetoed)
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
func (it *GovernanceProposalVetoedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *GovernanceProposalVetoedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// GovernanceProposalVetoed represents a ProposalVetoed event raised by the Governance contract.
type GovernanceProposalVetoed struct {
	ProposalId *big.Int
	Raw        types.Log // Blockchain specific contextual infos
}

// FilterProposalVetoed is a free log retrieval operation binding the contract event 0xde0cea2a3a0097cc3d981d40c375407760e85bc9c5e69aea449ac3885f8615c6.
//
// Solidity: event ProposalVetoed(uint256 indexed _proposalId)
func (_Governance *GovernanceFilterer) FilterProposalVetoed(opts *bind.FilterOpts, _proposalId []*big.Int) (*GovernanceProposalVetoedIterator, error) {

	var _proposalIdRule []interface{}
	for _, _proposalIdItem := range _proposalId {
		_proposalIdRule = append(_proposalIdRule, _proposalIdItem)
	}

	logs, sub, err := _Governance.contract.FilterLogs(opts, "ProposalVetoed", _proposalIdRule)
	if err != nil {
		return nil, err
	}
	return &GovernanceProposalVetoedIterator{contract: _Governance.contract, event: "ProposalVetoed", logs: logs, sub: sub}, nil
}

// WatchProposalVetoed is a free log subscription operation binding the contract event 0xde0cea2a3a0097cc3d981d40c375407760e85bc9c5e69aea449ac3885f8615c6.
//
// Solidity: event ProposalVetoed(uint256 indexed _proposalId)
func (_Governance *GovernanceFilterer) WatchProposalVetoed(opts *bind.WatchOpts, sink chan<- *GovernanceProposalVetoed, _proposalId []*big.Int) (event.Subscription, error) {

	var _proposalIdRule []interface{}
	for _, _proposalIdItem := range _proposalId {
		_proposalIdRule = append(_proposalIdRule, _proposalIdItem)
	}

	logs, sub, err := _Governance.contract.WatchLogs(opts, "ProposalVetoed", _proposalIdRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(GovernanceProposalVetoed)
				if err := _Governance.contract.UnpackLog(event, "ProposalVetoed", log); err != nil {
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

// ParseProposalVetoed is a log parse operation binding the contract event 0xde0cea2a3a0097cc3d981d40c375407760e85bc9c5e69aea449ac3885f8615c6.
//
// Solidity: event ProposalVetoed(uint256 indexed _proposalId)
func (_Governance *GovernanceFilterer) ParseProposalVetoed(log types.Log) (*GovernanceProposalVetoed, error) {
	event := new(GovernanceProposalVetoed)
	if err := _Governance.contract.UnpackLog(event, "ProposalVetoed", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// GovernanceProposalVoteSubmittedIterator is returned from FilterProposalVoteSubmitted and is used to iterate over the raw logs and unpacked data for ProposalVoteSubmitted events raised by the Governance contract.
type GovernanceProposalVoteSubmittedIterator struct {
	Event *GovernanceProposalVoteSubmitted // Event containing the contract specifics and raw log

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
func (it *GovernanceProposalVoteSubmittedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(GovernanceProposalVoteSubmitted)
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
		it.Event = new(GovernanceProposalVoteSubmitted)
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
func (it *GovernanceProposalVoteSubmittedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *GovernanceProposalVoteSubmittedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// GovernanceProposalVoteSubmitted represents a ProposalVoteSubmitted event raised by the Governance contract.
type GovernanceProposalVoteSubmitted struct {
	ProposalId *big.Int
	Voter      common.Address
	Vote       uint8
	VoterStake *big.Int
	Raw        types.Log // Blockchain specific contextual infos
}

// FilterProposalVoteSubmitted is a free log retrieval operation binding the contract event 0xf3f11b6b0f2367aeeec3a6b96f9528d1b57165334563e1d7083be608cdb64a54.
//
// Solidity: event ProposalVoteSubmitted(uint256 indexed _proposalId, address indexed _voter, uint8 indexed _vote, uint256 _voterStake)
func (_Governance *GovernanceFilterer) FilterProposalVoteSubmitted(opts *bind.FilterOpts, _proposalId []*big.Int, _voter []common.Address, _vote []uint8) (*GovernanceProposalVoteSubmittedIterator, error) {

	var _proposalIdRule []interface{}
	for _, _proposalIdItem := range _proposalId {
		_proposalIdRule = append(_proposalIdRule, _proposalIdItem)
	}
	var _voterRule []interface{}
	for _, _voterItem := range _voter {
		_voterRule = append(_voterRule, _voterItem)
	}
	var _voteRule []interface{}
	for _, _voteItem := range _vote {
		_voteRule = append(_voteRule, _voteItem)
	}

	logs, sub, err := _Governance.contract.FilterLogs(opts, "ProposalVoteSubmitted", _proposalIdRule, _voterRule, _voteRule)
	if err != nil {
		return nil, err
	}
	return &GovernanceProposalVoteSubmittedIterator{contract: _Governance.contract, event: "ProposalVoteSubmitted", logs: logs, sub: sub}, nil
}

// WatchProposalVoteSubmitted is a free log subscription operation binding the contract event 0xf3f11b6b0f2367aeeec3a6b96f9528d1b57165334563e1d7083be608cdb64a54.
//
// Solidity: event ProposalVoteSubmitted(uint256 indexed _proposalId, address indexed _voter, uint8 indexed _vote, uint256 _voterStake)
func (_Governance *GovernanceFilterer) WatchProposalVoteSubmitted(opts *bind.WatchOpts, sink chan<- *GovernanceProposalVoteSubmitted, _proposalId []*big.Int, _voter []common.Address, _vote []uint8) (event.Subscription, error) {

	var _proposalIdRule []interface{}
	for _, _proposalIdItem := range _proposalId {
		_proposalIdRule = append(_proposalIdRule, _proposalIdItem)
	}
	var _voterRule []interface{}
	for _, _voterItem := range _voter {
		_voterRule = append(_voterRule, _voterItem)
	}
	var _voteRule []interface{}
	for _, _voteItem := range _vote {
		_voteRule = append(_voteRule, _voteItem)
	}

	logs, sub, err := _Governance.contract.WatchLogs(opts, "ProposalVoteSubmitted", _proposalIdRule, _voterRule, _voteRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(GovernanceProposalVoteSubmitted)
				if err := _Governance.contract.UnpackLog(event, "ProposalVoteSubmitted", log); err != nil {
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

// ParseProposalVoteSubmitted is a log parse operation binding the contract event 0xf3f11b6b0f2367aeeec3a6b96f9528d1b57165334563e1d7083be608cdb64a54.
//
// Solidity: event ProposalVoteSubmitted(uint256 indexed _proposalId, address indexed _voter, uint8 indexed _vote, uint256 _voterStake)
func (_Governance *GovernanceFilterer) ParseProposalVoteSubmitted(log types.Log) (*GovernanceProposalVoteSubmitted, error) {
	event := new(GovernanceProposalVoteSubmitted)
	if err := _Governance.contract.UnpackLog(event, "ProposalVoteSubmitted", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// GovernanceProposalVoteUpdatedIterator is returned from FilterProposalVoteUpdated and is used to iterate over the raw logs and unpacked data for ProposalVoteUpdated events raised by the Governance contract.
type GovernanceProposalVoteUpdatedIterator struct {
	Event *GovernanceProposalVoteUpdated // Event containing the contract specifics and raw log

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
func (it *GovernanceProposalVoteUpdatedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(GovernanceProposalVoteUpdated)
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
		it.Event = new(GovernanceProposalVoteUpdated)
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
func (it *GovernanceProposalVoteUpdatedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *GovernanceProposalVoteUpdatedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// GovernanceProposalVoteUpdated represents a ProposalVoteUpdated event raised by the Governance contract.
type GovernanceProposalVoteUpdated struct {
	ProposalId   *big.Int
	Voter        common.Address
	Vote         uint8
	VoterStake   *big.Int
	PreviousVote uint8
	Raw          types.Log // Blockchain specific contextual infos
}

// FilterProposalVoteUpdated is a free log retrieval operation binding the contract event 0xce17252ae577424288e3ad071d9d5e757aeb4cdfaa1877449a20b54951474a3a.
//
// Solidity: event ProposalVoteUpdated(uint256 indexed _proposalId, address indexed _voter, uint8 indexed _vote, uint256 _voterStake, uint8 _previousVote)
func (_Governance *GovernanceFilterer) FilterProposalVoteUpdated(opts *bind.FilterOpts, _proposalId []*big.Int, _voter []common.Address, _vote []uint8) (*GovernanceProposalVoteUpdatedIterator, error) {

	var _proposalIdRule []interface{}
	for _, _proposalIdItem := range _proposalId {
		_proposalIdRule = append(_proposalIdRule, _proposalIdItem)
	}
	var _voterRule []interface{}
	for _, _voterItem := range _voter {
		_voterRule = append(_voterRule, _voterItem)
	}
	var _voteRule []interface{}
	for _, _voteItem := range _vote {
		_voteRule = append(_voteRule, _voteItem)
	}

	logs, sub, err := _Governance.contract.FilterLogs(opts, "ProposalVoteUpdated", _proposalIdRule, _voterRule, _voteRule)
	if err != nil {
		return nil, err
	}
	return &GovernanceProposalVoteUpdatedIterator{contract: _Governance.contract, event: "ProposalVoteUpdated", logs: logs, sub: sub}, nil
}

// WatchProposalVoteUpdated is a free log subscription operation binding the contract event 0xce17252ae577424288e3ad071d9d5e757aeb4cdfaa1877449a20b54951474a3a.
//
// Solidity: event ProposalVoteUpdated(uint256 indexed _proposalId, address indexed _voter, uint8 indexed _vote, uint256 _voterStake, uint8 _previousVote)
func (_Governance *GovernanceFilterer) WatchProposalVoteUpdated(opts *bind.WatchOpts, sink chan<- *GovernanceProposalVoteUpdated, _proposalId []*big.Int, _voter []common.Address, _vote []uint8) (event.Subscription, error) {

	var _proposalIdRule []interface{}
	for _, _proposalIdItem := range _proposalId {
		_proposalIdRule = append(_proposalIdRule, _proposalIdItem)
	}
	var _voterRule []interface{}
	for _, _voterItem := range _voter {
		_voterRule = append(_voterRule, _voterItem)
	}
	var _voteRule []interface{}
	for _, _voteItem := range _vote {
		_voteRule = append(_voteRule, _voteItem)
	}

	logs, sub, err := _Governance.contract.WatchLogs(opts, "ProposalVoteUpdated", _proposalIdRule, _voterRule, _voteRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(GovernanceProposalVoteUpdated)
				if err := _Governance.contract.UnpackLog(event, "ProposalVoteUpdated", log); err != nil {
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

// ParseProposalVoteUpdated is a log parse operation binding the contract event 0xce17252ae577424288e3ad071d9d5e757aeb4cdfaa1877449a20b54951474a3a.
//
// Solidity: event ProposalVoteUpdated(uint256 indexed _proposalId, address indexed _voter, uint8 indexed _vote, uint256 _voterStake, uint8 _previousVote)
func (_Governance *GovernanceFilterer) ParseProposalVoteUpdated(log types.Log) (*GovernanceProposalVoteUpdated, error) {
	event := new(GovernanceProposalVoteUpdated)
	if err := _Governance.contract.UnpackLog(event, "ProposalVoteUpdated", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// GovernanceRegistryAddressUpdatedIterator is returned from FilterRegistryAddressUpdated and is used to iterate over the raw logs and unpacked data for RegistryAddressUpdated events raised by the Governance contract.
type GovernanceRegistryAddressUpdatedIterator struct {
	Event *GovernanceRegistryAddressUpdated // Event containing the contract specifics and raw log

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
func (it *GovernanceRegistryAddressUpdatedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(GovernanceRegistryAddressUpdated)
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
		it.Event = new(GovernanceRegistryAddressUpdated)
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
func (it *GovernanceRegistryAddressUpdatedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *GovernanceRegistryAddressUpdatedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// GovernanceRegistryAddressUpdated represents a RegistryAddressUpdated event raised by the Governance contract.
type GovernanceRegistryAddressUpdated struct {
	NewRegistryAddress common.Address
	Raw                types.Log // Blockchain specific contextual infos
}

// FilterRegistryAddressUpdated is a free log retrieval operation binding the contract event 0xc533a624c353ec88e315b162298e52e2b02aa03d5fb5afdbf13445a26f1d10c7.
//
// Solidity: event RegistryAddressUpdated(address indexed _newRegistryAddress)
func (_Governance *GovernanceFilterer) FilterRegistryAddressUpdated(opts *bind.FilterOpts, _newRegistryAddress []common.Address) (*GovernanceRegistryAddressUpdatedIterator, error) {

	var _newRegistryAddressRule []interface{}
	for _, _newRegistryAddressItem := range _newRegistryAddress {
		_newRegistryAddressRule = append(_newRegistryAddressRule, _newRegistryAddressItem)
	}

	logs, sub, err := _Governance.contract.FilterLogs(opts, "RegistryAddressUpdated", _newRegistryAddressRule)
	if err != nil {
		return nil, err
	}
	return &GovernanceRegistryAddressUpdatedIterator{contract: _Governance.contract, event: "RegistryAddressUpdated", logs: logs, sub: sub}, nil
}

// WatchRegistryAddressUpdated is a free log subscription operation binding the contract event 0xc533a624c353ec88e315b162298e52e2b02aa03d5fb5afdbf13445a26f1d10c7.
//
// Solidity: event RegistryAddressUpdated(address indexed _newRegistryAddress)
func (_Governance *GovernanceFilterer) WatchRegistryAddressUpdated(opts *bind.WatchOpts, sink chan<- *GovernanceRegistryAddressUpdated, _newRegistryAddress []common.Address) (event.Subscription, error) {

	var _newRegistryAddressRule []interface{}
	for _, _newRegistryAddressItem := range _newRegistryAddress {
		_newRegistryAddressRule = append(_newRegistryAddressRule, _newRegistryAddressItem)
	}

	logs, sub, err := _Governance.contract.WatchLogs(opts, "RegistryAddressUpdated", _newRegistryAddressRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(GovernanceRegistryAddressUpdated)
				if err := _Governance.contract.UnpackLog(event, "RegistryAddressUpdated", log); err != nil {
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

// ParseRegistryAddressUpdated is a log parse operation binding the contract event 0xc533a624c353ec88e315b162298e52e2b02aa03d5fb5afdbf13445a26f1d10c7.
//
// Solidity: event RegistryAddressUpdated(address indexed _newRegistryAddress)
func (_Governance *GovernanceFilterer) ParseRegistryAddressUpdated(log types.Log) (*GovernanceRegistryAddressUpdated, error) {
	event := new(GovernanceRegistryAddressUpdated)
	if err := _Governance.contract.UnpackLog(event, "RegistryAddressUpdated", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// GovernanceVotingPeriodUpdatedIterator is returned from FilterVotingPeriodUpdated and is used to iterate over the raw logs and unpacked data for VotingPeriodUpdated events raised by the Governance contract.
type GovernanceVotingPeriodUpdatedIterator struct {
	Event *GovernanceVotingPeriodUpdated // Event containing the contract specifics and raw log

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
func (it *GovernanceVotingPeriodUpdatedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(GovernanceVotingPeriodUpdated)
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
		it.Event = new(GovernanceVotingPeriodUpdated)
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
func (it *GovernanceVotingPeriodUpdatedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *GovernanceVotingPeriodUpdatedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// GovernanceVotingPeriodUpdated represents a VotingPeriodUpdated event raised by the Governance contract.
type GovernanceVotingPeriodUpdated struct {
	NewVotingPeriod *big.Int
	Raw             types.Log // Blockchain specific contextual infos
}

// FilterVotingPeriodUpdated is a free log retrieval operation binding the contract event 0x651c77f42613a075437aa794c44471e3abc3a661956a67aaee165bb7396974aa.
//
// Solidity: event VotingPeriodUpdated(uint256 indexed _newVotingPeriod)
func (_Governance *GovernanceFilterer) FilterVotingPeriodUpdated(opts *bind.FilterOpts, _newVotingPeriod []*big.Int) (*GovernanceVotingPeriodUpdatedIterator, error) {

	var _newVotingPeriodRule []interface{}
	for _, _newVotingPeriodItem := range _newVotingPeriod {
		_newVotingPeriodRule = append(_newVotingPeriodRule, _newVotingPeriodItem)
	}

	logs, sub, err := _Governance.contract.FilterLogs(opts, "VotingPeriodUpdated", _newVotingPeriodRule)
	if err != nil {
		return nil, err
	}
	return &GovernanceVotingPeriodUpdatedIterator{contract: _Governance.contract, event: "VotingPeriodUpdated", logs: logs, sub: sub}, nil
}

// WatchVotingPeriodUpdated is a free log subscription operation binding the contract event 0x651c77f42613a075437aa794c44471e3abc3a661956a67aaee165bb7396974aa.
//
// Solidity: event VotingPeriodUpdated(uint256 indexed _newVotingPeriod)
func (_Governance *GovernanceFilterer) WatchVotingPeriodUpdated(opts *bind.WatchOpts, sink chan<- *GovernanceVotingPeriodUpdated, _newVotingPeriod []*big.Int) (event.Subscription, error) {

	var _newVotingPeriodRule []interface{}
	for _, _newVotingPeriodItem := range _newVotingPeriod {
		_newVotingPeriodRule = append(_newVotingPeriodRule, _newVotingPeriodItem)
	}

	logs, sub, err := _Governance.contract.WatchLogs(opts, "VotingPeriodUpdated", _newVotingPeriodRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(GovernanceVotingPeriodUpdated)
				if err := _Governance.contract.UnpackLog(event, "VotingPeriodUpdated", log); err != nil {
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

// ParseVotingPeriodUpdated is a log parse operation binding the contract event 0x651c77f42613a075437aa794c44471e3abc3a661956a67aaee165bb7396974aa.
//
// Solidity: event VotingPeriodUpdated(uint256 indexed _newVotingPeriod)
func (_Governance *GovernanceFilterer) ParseVotingPeriodUpdated(log types.Log) (*GovernanceVotingPeriodUpdated, error) {
	event := new(GovernanceVotingPeriodUpdated)
	if err := _Governance.contract.UnpackLog(event, "VotingPeriodUpdated", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// GovernanceVotingQuorumPercentUpdatedIterator is returned from FilterVotingQuorumPercentUpdated and is used to iterate over the raw logs and unpacked data for VotingQuorumPercentUpdated events raised by the Governance contract.
type GovernanceVotingQuorumPercentUpdatedIterator struct {
	Event *GovernanceVotingQuorumPercentUpdated // Event containing the contract specifics and raw log

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
func (it *GovernanceVotingQuorumPercentUpdatedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(GovernanceVotingQuorumPercentUpdated)
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
		it.Event = new(GovernanceVotingQuorumPercentUpdated)
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
func (it *GovernanceVotingQuorumPercentUpdatedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *GovernanceVotingQuorumPercentUpdatedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// GovernanceVotingQuorumPercentUpdated represents a VotingQuorumPercentUpdated event raised by the Governance contract.
type GovernanceVotingQuorumPercentUpdated struct {
	NewVotingQuorumPercent *big.Int
	Raw                    types.Log // Blockchain specific contextual infos
}

// FilterVotingQuorumPercentUpdated is a free log retrieval operation binding the contract event 0xdff2dad820b0b9218ba7ff3552dda2e644f04c9933b9c6e6e30db59568056d76.
//
// Solidity: event VotingQuorumPercentUpdated(uint256 indexed _newVotingQuorumPercent)
func (_Governance *GovernanceFilterer) FilterVotingQuorumPercentUpdated(opts *bind.FilterOpts, _newVotingQuorumPercent []*big.Int) (*GovernanceVotingQuorumPercentUpdatedIterator, error) {

	var _newVotingQuorumPercentRule []interface{}
	for _, _newVotingQuorumPercentItem := range _newVotingQuorumPercent {
		_newVotingQuorumPercentRule = append(_newVotingQuorumPercentRule, _newVotingQuorumPercentItem)
	}

	logs, sub, err := _Governance.contract.FilterLogs(opts, "VotingQuorumPercentUpdated", _newVotingQuorumPercentRule)
	if err != nil {
		return nil, err
	}
	return &GovernanceVotingQuorumPercentUpdatedIterator{contract: _Governance.contract, event: "VotingQuorumPercentUpdated", logs: logs, sub: sub}, nil
}

// WatchVotingQuorumPercentUpdated is a free log subscription operation binding the contract event 0xdff2dad820b0b9218ba7ff3552dda2e644f04c9933b9c6e6e30db59568056d76.
//
// Solidity: event VotingQuorumPercentUpdated(uint256 indexed _newVotingQuorumPercent)
func (_Governance *GovernanceFilterer) WatchVotingQuorumPercentUpdated(opts *bind.WatchOpts, sink chan<- *GovernanceVotingQuorumPercentUpdated, _newVotingQuorumPercent []*big.Int) (event.Subscription, error) {

	var _newVotingQuorumPercentRule []interface{}
	for _, _newVotingQuorumPercentItem := range _newVotingQuorumPercent {
		_newVotingQuorumPercentRule = append(_newVotingQuorumPercentRule, _newVotingQuorumPercentItem)
	}

	logs, sub, err := _Governance.contract.WatchLogs(opts, "VotingQuorumPercentUpdated", _newVotingQuorumPercentRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(GovernanceVotingQuorumPercentUpdated)
				if err := _Governance.contract.UnpackLog(event, "VotingQuorumPercentUpdated", log); err != nil {
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

// ParseVotingQuorumPercentUpdated is a log parse operation binding the contract event 0xdff2dad820b0b9218ba7ff3552dda2e644f04c9933b9c6e6e30db59568056d76.
//
// Solidity: event VotingQuorumPercentUpdated(uint256 indexed _newVotingQuorumPercent)
func (_Governance *GovernanceFilterer) ParseVotingQuorumPercentUpdated(log types.Log) (*GovernanceVotingQuorumPercentUpdated, error) {
	event := new(GovernanceVotingQuorumPercentUpdated)
	if err := _Governance.contract.UnpackLog(event, "VotingQuorumPercentUpdated", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}
