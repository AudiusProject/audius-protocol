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
  using SafeMath for uint256;
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
  mapping (address => address[]) spDelegates;

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
      _amount <= currentlyDelegatedToSP,
      'Cannot decrease greater than currently staked for this ServiceProvider');

    // Stake on behalf of target service provider 
    stakingContract.undelegateStakeFor(
      _target,
      delegator,
      _amount,
      empty);

    // Update amount staked from this delegator to targeted service provider
    delegateInfo[delegator][_target] -= _amount;

    // Update total delegated stake
    delegatorStakeTotal[delegator] -= _amount;

    // Remove from delegators list if no delegated stake remaining
    if (delegateInfo[delegator][_target] == 0) {
      bool foundDelegator;
      uint delegatorIndex;
      for (uint i = 0; i < spDelegates[_target].length; i++) {
        if (spDelegates[_target][i] == delegator) {
          foundDelegator = true;
          delegatorIndex = i;
        }
      }

      // Overwrite and shrink delegators list
      spDelegates[_target][delegatorIndex] = spDelegates[_target][spDelegates[_target].length - 1];
      spDelegates[_target].length--;
    }

    // Return new total
    return delegateInfo[delegator][_target];
  }

  function makeClaim() external {
    // address claimer = msg.sender;
    ServiceProviderFactory spFactory = ServiceProviderFactory(
        registry.getContract(serviceProviderFactoryKey)
    );

    // Amount stored in staking contract for owner
    uint totalBalanceInStaking = Staking(
        registry.getContract(stakingProxyOwnerKey)
    ).totalStakedFor(msg.sender);
    require(totalBalanceInStaking > 0, 'Stake required for claim');

    // Amount in sp factory for claimer
    uint totalBalanceInSPFactory = spFactory.getServiceProviderStake(msg.sender);
    require(totalBalanceInSPFactory > 0, 'Service Provider stake required');

    // Amount in delegate manager staked to service provider
    // TODO: Consider caching this value
    uint totalBalanceInDelegateManager = 0;
    for (uint i = 0; i < spDelegates[msg.sender].length; i++)
    {
      address delegator = spDelegates[msg.sender][i];
      uint delegateStakeToSP = delegateInfo[delegator][msg.sender]; 
      totalBalanceInDelegateManager += delegateStakeToSP;
    }

    uint totalBalanceOutsideStaking = totalBalanceInSPFactory + totalBalanceInDelegateManager;

    // Require claim availability
    require(totalBalanceInStaking > totalBalanceOutsideStaking, 'No stake available to claim');

    // Total rewards
    // Equal to (balance in staking) - ((balance in sp factory) + (balance in delegate manager))
    uint totalRewards = totalBalanceInStaking - totalBalanceOutsideStaking;

    uint deployerCut = spFactory.getServiceProviderDeployerCut(msg.sender);
    uint deployerCutBase = spFactory.getServiceProviderDeployerCutBase();
    uint spDeployerCutRewards = 0;

    // Traverse all delegates and calculate their rewards
    // As each delegate reward is calculated, increment SP cut reward accordingly
    for (uint i = 0; i < spDelegates[msg.sender].length; i++)
    {
      address delegator = spDelegates[msg.sender][i];
      uint delegateStakeToSP = delegateInfo[delegator][msg.sender]; 
      // Calculate rewards by ((delegateStakeToSP / totalBalanceOutsideStaking) * totalRewards)
      uint rewardsPriorToSPCut = (delegateStakeToSP.mul(totalRewards)).div(totalBalanceOutsideStaking); 
      // Multiply by deployer cut fraction to calculate reward for SP
      uint spDeployerCut = (rewardsPriorToSPCut.mul(deployerCut)).div(deployerCutBase);
      spDeployerCutRewards += spDeployerCut; 
      // Increase total delegate reward in DelegateManager
      // Subtract SP reward from rewards to calculate delegate reward
      // delegateReward = rewardsPriorToSPCut - spDeployerCut;
      delegateInfo[delegator][msg.sender] += (rewardsPriorToSPCut - spDeployerCut);
      delegatorStakeTotal[delegator] += (rewardsPriorToSPCut - spDeployerCut);
    }

    // TODO: Validate below with test cases
    uint spRewardShare = (totalBalanceInSPFactory.mul(totalRewards)).div(totalBalanceOutsideStaking);
    uint newSpBalance = totalBalanceInSPFactory + spRewardShare + spDeployerCutRewards;
    spFactory.updateServiceProviderStake(msg.sender, newSpBalance);
  }

  /**
   * @notice List of delegators for a given service provider
   */
  function getDelegatorsList(address _sp)
  external view returns (address[] memory dels) 
  {
    return spDelegates[_sp]; 
  }

  /**
   * @notice Total currently staked for a delegator, across service providers
   */
  function getTotalDelegatorStake(address _delegator)
  external view returns (uint amount) 
  {
    return delegatorStakeTotal[_delegator];  
  }

  function updateServiceProviderDelegatorsIfNecessary (
    address _delegator,
    address _serviceProvider
  ) internal returns (bool exists) {
    for (uint i = 0; i < spDelegates[_serviceProvider].length; i++) {
      if (spDelegates[_serviceProvider][i] == _delegator) {
        return true;
      }
    }
    // If not found, update list of delegates
    spDelegates[_serviceProvider].push(_delegator);
    return false;
  }
}

