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

    // START Temporary data structures
    bytes32[] validServiceTypes;

    struct ServiceInstanceStakeRequirements {
        uint minStake;
        uint maxStake;
    }

    mapping(bytes32 => ServiceInstanceStakeRequirements) serviceTypeStakeRequirements;

    // Maps directly staked amount by SP, not including delegators
    mapping(address => uint) spDeployerStake;

    // % Cut of delegator tokens assigned to sp deployer
    mapping(address => uint) spDeployerCut;

    // Bool indicating whether this SP has met the min/max stake requirements
    mapping(address => bool) spValidBounds;
    // END Temporary data structures

    bytes empty;

    // standard - imitates relationship between Ether and Wei
    uint8 private constant DECIMALS = 18;

    // denominator for deployer cut calculations
    // user values are intended to be x/DEPLOYER_CUT_BASE
    uint private constant DEPLOYER_CUT_BASE = 100;

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

    event UpdateEndpoint(
        bytes32 _serviceType,
        address _owner,
        string _oldEndpoint,
        string _newEndpoint,
        uint spId
    );

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

        // Hardcoded values for development.
        // Note that all token mins/maxes are in AudWEI not actual AUD
        // discovery-provider, 0x646973636f766572792d70726f7669646572
        // creator-node 0x63726561746f722d6e6f6465
        bytes32 discoveryProvider = hex"646973636f766572792d70726f7669646572";
        bytes32 creatorNode = hex"63726561746f722d6e6f6465";
        validServiceTypes.push(discoveryProvider);
        validServiceTypes.push(creatorNode);

        // All min/max values are in AUD and require conversion
        // discovery-provider, MIN=5 AUD   MAX=10,000,000 AUD
        // creator-node,       MIN=10 AUD  MAX=10,000,000 AUD
        serviceTypeStakeRequirements[discoveryProvider] = ServiceInstanceStakeRequirements({
            minStake: 5 * 10**uint256(DECIMALS),
            maxStake: 10000000 * 10**uint256(DECIMALS)
        });
        serviceTypeStakeRequirements[creatorNode] = ServiceInstanceStakeRequirements({
            minStake: 10 * 10**uint256(DECIMALS),
            maxStake: 10000000 * 10**uint256(DECIMALS)
        });
    }

    function register(
        bytes32 _serviceType,
        string calldata _endpoint,
        uint256 _stakeAmount,
        address _delegateOwnerWallet
    ) external returns (uint spID)
    {
        require(
            this.isValidServiceType(_serviceType),
            "Valid service type required");

        address owner = msg.sender;
        Staking stakingContract = Staking(
            registry.getContract(stakingProxyOwnerKey)
        );

        // Stake token amount from msg.sender
        if (_stakeAmount > 0) {
            stakingContract.stakeFor(owner, _stakeAmount, empty);
        }

        uint newServiceProviderID = ServiceProviderStorageInterface(
            registry.getContract(serviceProviderStorageRegistryKey)
        ).register(
            _serviceType,
            owner,
            _endpoint,
            _delegateOwnerWallet
        );

        // Update deployer total
        spDeployerStake[owner] += _stakeAmount;

        uint currentlyStakedForOwner = validateAccountStakeBalance(owner);

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

            // Update deployer total
            spDeployerStake[owner] -= unstakeAmount;
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

        validateAccountStakeBalance(owner);

        return deregisteredID;
    }

    function increaseStake(uint256 _increaseStakeAmount) external returns (uint newTotalStake) {
        address owner = msg.sender;

        // Confirm owner has an endpoint
        uint numberOfEndpoints = ServiceProviderStorageInterface(
            registry.getContract(serviceProviderStorageRegistryKey)
        ).getNumberOfEndpointsFromAddress(owner);
        require(numberOfEndpoints > 0, "Registered endpoint required to increase stake");

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

        validateAccountStakeBalance(owner);

        // Update deployer total
        spDeployerStake[owner] += _increaseStakeAmount;

        return newStakeAmount;
    }

    function decreaseStake(uint256 _decreaseStakeAmount) external returns (uint newTotalStake) {
        address owner = msg.sender;

        // Confirm owner has an endpoint
        uint numberOfEndpoints = ServiceProviderStorageInterface(
            registry.getContract(serviceProviderStorageRegistryKey)
        ).getNumberOfEndpointsFromAddress(owner);
        require(numberOfEndpoints > 0, "Registered endpoint required to decrease stake");

        uint currentStakeAmount = Staking(
            registry.getContract(stakingProxyOwnerKey)
        ).totalStakedFor(owner);

        // Prohibit decreasing stake to zero without deregistering all endpoints
        require(
            currentStakeAmount - _decreaseStakeAmount > 0,
            "Please deregister endpoints to remove all stake");

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

        validateAccountStakeBalance(owner);

        // Update deployer total
        spDeployerStake[owner] -= _decreaseStakeAmount;

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

    function updateEndpoint(
        bytes32 _serviceType,
        string calldata _oldEndpoint,
        string calldata _newEndpoint
    ) external returns (uint spID)
    {
        address owner = msg.sender;
        uint spId = ServiceProviderStorageInterface(
            registry.getContract(serviceProviderStorageRegistryKey)
        ).updateEndpoint(owner, _serviceType, _oldEndpoint, _newEndpoint);
        emit UpdateEndpoint(
            _serviceType,
            owner,
            _oldEndpoint,
            _newEndpoint,
            spId
        );
        return spId;
    }

  /**
   * @notice Update service provider balance
   * TODO: Permission to only delegatemanager
   */
    function updateServiceProviderStake(
        address _serviceProvider,
        uint _amount
     ) external
    {
        // Validate bounds
        (uint minStake, uint maxStake) = this.getAccountStakeBounds(_serviceProvider);
        if (_amount < minStake || _amount > maxStake) {
          // Indicate this service provider is out of bounds
          spValidBounds[_serviceProvider] = false;
        }

        // Update SP tracked total
        spDeployerStake[_serviceProvider] = _amount;
    }

  /**
   * @notice Update service provider cut
   * SPs will interact with this value as a percent, value translation done client side
   */
    function updateServiceProviderCut(
        address _serviceProvider,
        uint _cut
    ) external
    {
        require(
            msg.sender == _serviceProvider,
            "Service Provider cut update operation restricted to deployer");

        require(
            _cut <= DEPLOYER_CUT_BASE,
            "Service Provider cut cannot exceed base value");
        spDeployerCut[_serviceProvider] = _cut;
    }

  /**
   * @notice Represents amount directly staked by service provider
   */
    function getServiceProviderStake(address _address)
    external view returns (uint stake)
    {
        return spDeployerStake[_address];
    }

  /**
   * @notice Represents % taken by sp deployer of rewards
   */
    function getServiceProviderDeployerCut(address _address)
    external view returns (uint cut)
    {
        return spDeployerCut[_address];
    }

  /**
   * @notice Denominator for deployer cut calculations
   */
    function getServiceProviderDeployerCutBase()
    external pure returns (uint base)
    {
        return DEPLOYER_CUT_BASE;
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

    function getDelegateOwnerWallet(
        bytes32 _serviceType,
        string calldata _endpoint
    ) external view returns (address)
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

    function isValidServiceType(bytes32 _serviceType)
    external view returns (bool isValid)
    {
        for (uint i = 0; i < validServiceTypes.length; i ++) {
            if (validServiceTypes[i] == _serviceType) {
                return true;
            }
        }
        return false;
    }

    function getValidServiceTypes()
    external view returns (bytes32[] memory types)
    {
        return validServiceTypes;
    }

    /// @notice Get min and max stake for a given service type
    /// @return min/max stake for type
    function getServiceStakeInfo(bytes32 _serviceType)
    external view returns (uint min, uint max)
    {
        return (
            serviceTypeStakeRequirements[_serviceType].minStake, serviceTypeStakeRequirements[_serviceType].maxStake
        );
    }

    /// @notice Calculate the stake for an account based on total number of registered services
    // TODO: Cache value
    function getAccountStakeBounds(address sp)
    external view returns (uint min, uint max)
    {
        uint minStake = 0;
        uint maxStake = 0;
        uint validTypesLength = validServiceTypes.length;
        for (uint i = 0; i < validTypesLength; i++) {
            bytes32 serviceType = validServiceTypes[i];
            (uint typeMin, uint typeMax) = this.getServiceStakeInfo(serviceType);
            uint numberOfEndpoints = this.getServiceProviderIdsFromAddress(sp, serviceType).length;
            minStake += (typeMin * numberOfEndpoints);
            maxStake += (typeMax * numberOfEndpoints);
        }
        return (minStake, maxStake);
    }

    function isServiceProviderWithinBounds(address sp) 
    external view returns (bool isValid)
    {
        return spValidBounds[sp];
    }

    /// @notice Validate that the service provider is between the min and max stakes for all their registered services
    function validateAccountStakeBalance(address sp)
    internal returns (uint stakedForOwner)
    {
        Staking stakingContract = Staking(
            registry.getContract(stakingProxyOwnerKey)
        );
        uint currentlyStakedForOwner = stakingContract.totalStakedFor(sp);
        (uint minStakeAmount, uint maxStakeAmount) = this.getAccountStakeBounds(sp);

        require(
            currentlyStakedForOwner >= minStakeAmount,
            "Minimum stake threshold exceeded");

        require(
            currentlyStakedForOwner <= maxStakeAmount,
            "Maximum stake amount exceeded");

        // Indicate this service provider is within bounds
        spValidBounds[sp] = true;

        return currentlyStakedForOwner;
    }
}
