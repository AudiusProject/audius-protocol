pragma solidity ^0.5.0;

import "./registry/RegistryContract.sol";
import "../staking/Staking.sol";
import "./interface/registry/RegistryInterface.sol";
import "./interface/ServiceProviderStorageInterface.sol";

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";


contract ServiceProviderFactory is RegistryContract {
    RegistryInterface registry = RegistryInterface(0);
    bytes32 serviceProviderStorageRegistryKey;
    bytes32 stakingProxyOwnerKey;

    address instanceAddress;
    bytes empty;

    event RegisteredServiceProvider(
      uint _spID,
      bytes32 _serviceType,
      address _owner,
      string _endpoint,
      uint256 _stakeAmount
    );

    event DeregisteredServiceProvider(
      uint _spID,
      bytes32 _serviceType,
      address _owner,
      string _endpoint,
      uint256 _unstakeAmount
    );

    event UpdatedStakeAmount(
      address _owner,
      uint256 _stakeAmount
    );

    event Test(
      bytes32 test,
      string msg);
    event TestUint(
      uint test,
      string msg);

    constructor(
      address _registryAddress,
      bytes32 _stakingProxyOwnerKey,
      bytes32 _serviceProviderStorageRegistryKey
    ) public
    {
        require(
            _registryAddress != address(0x00),
            "Requires non-zero _registryAddress"
        );
        registry = RegistryInterface(_registryAddress);
        stakingProxyOwnerKey = _stakingProxyOwnerKey;
        serviceProviderStorageRegistryKey = _serviceProviderStorageRegistryKey;
    }

    function register(
        bytes32 _serviceType,
        string calldata _endpoint,
        uint256 _stakeAmount,
        address _delegateOwnerWallet
    ) external returns (uint spID)
    {
        address owner = msg.sender;

        // Stake token amount from msg.sender
        if (_stakeAmount > 0) {
          Staking(registry.getContract(stakingProxyOwnerKey)).stakeFor(owner, _stakeAmount, empty);
        }

        uint newServiceProviderID = ServiceProviderStorageInterface(
            registry.getContract(serviceProviderStorageRegistryKey)
        ).register(
            _serviceType,
            owner,
            _endpoint,
            _delegateOwnerWallet
        );

        uint minStakeAmount = Staking(
          registry.getContract(stakingProxyOwnerKey)
        ).getMinStakeAmount();
 
        uint currentlyStakedForOwner = Staking(
          registry.getContract(stakingProxyOwnerKey)
        ).totalStakedFor(owner);

        require(
          currentlyStakedForOwner >= minStakeAmount,
          'Minimum stake amount not met');

        emit RegisteredServiceProvider(
            newServiceProviderID,
            _serviceType,
            owner,
            _endpoint,
            currentlyStakedForOwner
        );

        return newServiceProviderID;
    }

    function deregister(
        bytes32 _serviceType,
        string calldata _endpoint
    ) external returns (uint deregisteredSpID)
    {
        address owner = msg.sender;

        uint numberOfEndpoints = ServiceProviderStorageInterface(
            registry.getContract(serviceProviderStorageRegistryKey)
        ).getNumberOfEndpointsFromAddress(owner); 

        // Unstake on deregistration if and only if this is the last service endpoint
        uint unstakeAmount = 0;
        // owned by the user
        if (numberOfEndpoints == 1) {
          unstakeAmount = Staking(
            registry.getContract(stakingProxyOwnerKey)
          ).totalStakedFor(owner);

          Staking(registry.getContract(stakingProxyOwnerKey)).unstakeFor(
            owner,
            unstakeAmount,
            empty
          );
        }

        (uint deregisteredID) = ServiceProviderStorageInterface(
            registry.getContract(serviceProviderStorageRegistryKey)
        ).deregister(
            _serviceType,
            owner,
            _endpoint);

        emit DeregisteredServiceProvider(
            deregisteredID,
            _serviceType,
            owner,
            _endpoint,
            unstakeAmount);

        return deregisteredID;
    }

    // TODO: Modify increase/decrease to be account based, NOT endpoint based
    function increaseStake(uint256 _increaseStakeAmount) external returns (uint newTotalStake)
    {
        address owner = msg.sender;

        // Confirm owner has an endpoint
        uint numberOfEndpoints = ServiceProviderStorageInterface(
            registry.getContract(serviceProviderStorageRegistryKey)
        ).getNumberOfEndpointsFromAddress(owner); 
        require(numberOfEndpoints > 0, 'Registered endpoint required to stake');

        // Stake increased token amount for msg.sender
        Staking(
            registry.getContract(stakingProxyOwnerKey)
        ).stakeFor(owner, _increaseStakeAmount, empty);
 
        uint newStakeAmount = Staking(
          registry.getContract(stakingProxyOwnerKey)
        ).totalStakedFor(owner);

        emit UpdatedStakeAmount(
            owner,
            newStakeAmount
        );

        return newStakeAmount;
    }

    function decreaseServiceStake(
        bytes32 _serviceType,
        string calldata _endpoint,
        uint256 _decreaseStakeAmount
    ) external returns (uint newTotalStake)
    {
        address owner = msg.sender;

        // Confirm correct owner for this endpoint
        uint updatedSpID = this.getServiceProviderIdFromEndpoint(_endpoint);
        require(updatedSpID != 0, "Increase stake - endpoint not registered");
        (address stgOwner, , ,) = this.getServiceProviderInfo(_serviceType, updatedSpID);
        require(stgOwner == owner, "Increase stake - incorrect owner");

        // Decrease staked token amount for msg.sender
        Staking(
            registry.getContract(stakingProxyOwnerKey)
        ).unstakeFor(owner, _decreaseStakeAmount, empty);

        // Query current stake
        uint newStakeAmount = Staking(
          registry.getContract(stakingProxyOwnerKey)
        ).totalStakedFor(owner);

        emit UpdatedStakeAmount(
            owner,
            newStakeAmount
        );

        return newStakeAmount;
    }

    function updateDelegateOwnerWallet(
      bytes32 _serviceType,
      string calldata _endpoint,
      address _updatedDelegateOwnerWallet
    ) external returns (address)
    {
        address owner = msg.sender;
        return ServiceProviderStorageInterface(
            registry.getContract(serviceProviderStorageRegistryKey)
        ).updateDelegateOwnerWallet(
            owner,
            _serviceType,
            _endpoint,
            _updatedDelegateOwnerWallet
        ); 
    }

    function getTotalServiceTypeProviders(bytes32 _serviceType)
    external view returns (uint numberOfProviders)
    {
        return ServiceProviderStorageInterface(
            registry.getContract(serviceProviderStorageRegistryKey)
        ).getTotalServiceTypeProviders(
            _serviceType
        );
    }

    function getServiceProviderInfo(bytes32 _serviceType, uint _serviceId)
    external view returns (address owner, string memory endpoint, uint blockNumber, address delegateOwnerWallet)
    {
        return ServiceProviderStorageInterface(
            registry.getContract(serviceProviderStorageRegistryKey)
        ).getServiceProviderInfo(
            _serviceType,
            _serviceId
        );
    }

    function getServiceProviderIdFromEndpoint(string calldata _endpoint)
    external view returns (uint spID)
    {
        return ServiceProviderStorageInterface(
            registry.getContract(serviceProviderStorageRegistryKey)
        ).getServiceProviderIdFromEndpoint(_endpoint);
    }

    function getServiceProviderIdsFromAddress(address _ownerAddress, bytes32 _serviceType)
    external view returns (uint[] memory spIds)
    {
        return ServiceProviderStorageInterface(
            registry.getContract(serviceProviderStorageRegistryKey)
        ).getServiceProviderIdsFromAddress(
            _ownerAddress,
            _serviceType
        );
    }

    function getDelegateOwnerWallet(bytes32 _serviceType, string calldata _endpoint) external view returns (address)
    {
      address owner = msg.sender;
      return ServiceProviderStorageInterface(
          registry.getContract(serviceProviderStorageRegistryKey)
      ).getDelegateOwnerWallet(
          owner,
          _serviceType,
          _endpoint
      ); 
    }
}
