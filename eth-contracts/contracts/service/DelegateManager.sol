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
}

