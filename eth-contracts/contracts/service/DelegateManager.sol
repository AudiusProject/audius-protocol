pragma solidity ^0.5.0;
import "../staking/Staking.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Mintable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "./registry/RegistryContract.sol";
import "./interface/registry/RegistryInterface.sol";

import "../staking/Staking.sol";
import "./ServiceProviderFactory.sol";


// WORKING CONTRACT
// Designed to manage delegation to staking contract
contract DelegateManager is RegistryContract {
    RegistryInterface registry = RegistryInterface(0);
  // standard - imitates relationship between Ether and Wei
  // uint8 private constant DECIMALS = 18;

  address tokenAddress;
  address stakingAddress;

  bytes32 stakingProxyOwnerKey; 
  bytes32 serviceProviderFactoryKey;

  // Staking contract ref
  ERC20Mintable internal audiusToken;

  // Service provider address -> list of delegators
  // TODO: Bounded list
  mapping (address => address[]) serviceProviderDelegates;

  // Total staked for a given delegator
  mapping (address => uint) delegatorStakeTotal;

  // Delegator stake by address delegated to
  // delegator -> (service provider -> delegatedStake)
  mapping (address => mapping(address => uint)) delegateInfo;

  // TODO: Evaluate whether this is necessary
  bytes empty;

  constructor(
    address _tokenAddress, 
    address _registryAddress,
    bytes32 _stakingProxyOwnerKey,
    bytes32 _serviceProviderFactoryKey
  ) public {
    tokenAddress = _tokenAddress;
    audiusToken = ERC20Mintable(tokenAddress);
    registry = RegistryInterface(_registryAddress);
    stakingProxyOwnerKey = _stakingProxyOwnerKey;
    serviceProviderFactoryKey = _serviceProviderFactoryKey;
  }

  function increaseDelegatedStake(
    address _target,
    uint _amount
  ) external returns (uint delegeatedAmountForSP)
  {
    // TODO: Require _target is a valid SP
    // TODO: Validate sp account total balance
    // TODO: Enforce min _amount?
    address delegator = msg.sender;
    Staking stakingContract = Staking(
        registry.getContract(stakingProxyOwnerKey)
    );

    // Stake on behalf of target service provider 
    stakingContract.delegateStakeFor(
      _target,
      delegator,
      _amount,
      empty);

    // Update list of delegators to SP if necessary
    // TODO: Any validation on returned value?
    updateServiceProviderDelegatorsIfNecessary(delegator, _target);

    // Update amount staked from this delegator to targeted service provider
    delegateInfo[delegator][_target] += _amount;

    // Update total delegated stake
    delegatorStakeTotal[delegator] += _amount;

    // Return new total
    return delegateInfo[delegator][_target];
  }

  function decreaseDelegatedStake(
    address _target,
    uint _amount
  ) external returns (uint delegateAmount) {
    address delegator = msg.sender;
    Staking stakingContract = Staking(
        registry.getContract(stakingProxyOwnerKey)
    );
    bool delegatorRecordExists = updateServiceProviderDelegatorsIfNecessary(delegator, _target);
    require(delegatorRecordExists, 'Delegator must exist to decrease stake');

    uint currentlyDelegatedToSP = delegateInfo[delegator][_target];
    require(
      _amount < currentlyDelegatedToSP,
      'Cannot decrease greater than currently staked for this ServiceProvider');

    // Stake on behalf of target service provider 
    stakingContract.unstakeFor(
      _target,
      _amount,
      empty);

    // Update amount staked from this delegator to targeted service provider
    delegateInfo[delegator][_target] -= _amount;

    // Update total delegated stake
    delegatorStakeTotal[delegator] -= _amount;

    // Return new total
    return delegateInfo[delegator][_target];
  }

  function makeClaim() external {
    address claimer = msg.sender;
    Staking stakingContract = Staking(
        registry.getContract(stakingProxyOwnerKey)
    );
    ServiceProviderFactory spFactory = ServiceProviderFactory(
        registry.getContract(serviceProviderFactoryKey)
    );

    // Amount stored in staking contract for owner
    uint totalBalanceInStaking = stakingContract.totalStakedFor(claimer);
    require(totalBalanceInStaking > 0, 'Stake required for claim');
    // Amount in sp factory for user
    uint totalBalanceInSPFactory = spFactory.getServiceProviderStake(claimer);
    require(totalBalanceInSPFactory > 0, 'Service Provider stake required');

    // Require claim availability
    require(totalBalanceInStaking > totalBalanceInSPFactory, 'No stake available to claim');

    uint totalRewards = totalBalanceInStaking - totalBalanceInSPFactory;

    // TODO: Distribute rewards cut to delegates, add more to 
    uint newSpBalance = totalBalanceInSPFactory + totalRewards;

    spFactory.updateServiceProviderStake(claimer, newSpBalance);
  }

  function updateServiceProviderDelegatorsIfNecessary (
    address _delegator,
    address _serviceProvider
  ) internal returns (bool exists) {
    for (uint i = 0; i < serviceProviderDelegates[_serviceProvider].length; i++) {
      if (serviceProviderDelegates[_serviceProvider][i] == _delegator) {
        return true;
      }
    }
    // If not found, update list of delegates
    serviceProviderDelegates[_serviceProvider].push(_delegator);
    return false;
  }
}

