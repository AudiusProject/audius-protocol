pragma solidity ^0.5.0;

import "./registry/RegistryContract.sol";
import "./ServiceTypeManager.sol";
import "../staking/ERCStaking.sol";
import "./interface/registry/RegistryInterface.sol";
import "./interface/ServiceProviderStorageInterface.sol";


contract ServiceProviderFactory is RegistryContract {
    RegistryInterface registry = RegistryInterface(0);
    bytes32 serviceProviderStorageRegistryKey;
    bytes32 stakingProxyOwnerKey;
    bytes32 delegateManagerKey;
    bytes32 governanceKey;
    bytes32 serviceTypeManagerKey;
    address deployerAddress;

    struct ServiceInstanceStakeRequirements {
        uint minStake;
        uint maxStake;
    }

    mapping(bytes32 => ServiceInstanceStakeRequirements) serviceTypeStakeRequirements;

    // Stores following entities
    // 1) Directly staked amount by SP, not including delegators
    // 2) % Cut of delegator tokens taken during reward
    // 3) Bool indicating whether this SP has met min/max requirements
    struct ServiceProviderDetails {
        uint deployerStake;
        uint deployerCut;
        bool validBounds;
    }

    // Mapping of service provider address to details
    mapping(address => ServiceProviderDetails) spDetails;

    // Minimum staked by service provider account deployer
    // Static regardless of total number of endpoints for a given account
    uint minDeployerStake;

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
      bytes32 _delegateManagerKey,
      bytes32 _governanceKey,
      bytes32 _serviceTypeManagerKey,
      bytes32 _serviceProviderStorageRegistryKey
    ) public
    {
        require(
            _registryAddress != address(0x00),
            "Requires non-zero _registryAddress"
        );
        deployerAddress = msg.sender;
        registry = RegistryInterface(_registryAddress);
        stakingProxyOwnerKey = _stakingProxyOwnerKey;
        delegateManagerKey = _delegateManagerKey;
        governanceKey = _governanceKey;
        serviceTypeManagerKey = _serviceTypeManagerKey;
        serviceProviderStorageRegistryKey = _serviceProviderStorageRegistryKey;

        // Configure direct minimum stake for deployer
        minDeployerStake = 5 * 10**uint256(DECIMALS);
    }

    function register(
        bytes32 _serviceType,
        string calldata _endpoint,
        uint256 _stakeAmount,
        address _delegateOwnerWallet
    ) external returns (uint spID)
    {
        require(
            ServiceTypeManager(
                registry.getContract(serviceTypeManagerKey)
            ).isValidServiceType(_serviceType),
            "Valid service type required");

        address owner = msg.sender;
        ERCStaking stakingContract = ERCStaking(
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
        spDetails[owner].deployerStake += _stakeAmount;

        // Confirm both aggregate account balance and directly staked amount are valid
        uint currentlyStakedForOwner = this.validateAccountStakeBalance(owner);
        validateAccountDeployerStake(owner);

        // Indicate this service provider is within bounds
        spDetails[owner].validBounds = true;

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
        bool unstaked = false;
        // owned by the user
        if (numberOfEndpoints == 1) {
            ERCStaking stakingContract = ERCStaking(
                registry.getContract(stakingProxyOwnerKey)
            );
            unstakeAmount = stakingContract.totalStakedFor(owner);
            stakingContract.unstakeFor(
                owner,
                unstakeAmount,
                empty
            );

            // Update deployer total
            spDetails[owner].deployerStake -= unstakeAmount;
            unstaked = true;
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

        // Confirm both aggregate account balance and directly staked amount are valid
        // Only if unstake operation has not occurred
        if (!unstaked) {
            this.validateAccountStakeBalance(owner);
            validateAccountDeployerStake(owner);
            // Indicate this service provider is within bounds
            spDetails[owner].validBounds = true;
        }

        return deregisteredID;
    }

    function increaseStake(uint256 _increaseStakeAmount) external returns (uint newTotalStake) {
        address owner = msg.sender;

        // Confirm owner has an endpoint
        uint numberOfEndpoints = ServiceProviderStorageInterface(
            registry.getContract(serviceProviderStorageRegistryKey)
        ).getNumberOfEndpointsFromAddress(owner);
        require(numberOfEndpoints > 0, "Registered endpoint required to increase stake");

        ERCStaking stakingContract = ERCStaking(
            registry.getContract(stakingProxyOwnerKey)
        );

        // Stake increased token amount for msg.sender
        stakingContract.stakeFor(owner, _increaseStakeAmount, empty);

        uint newStakeAmount = stakingContract.totalStakedFor(owner);

        // Update deployer total
        spDetails[owner].deployerStake += _increaseStakeAmount;

        // Confirm both aggregate account balance and directly staked amount are valid
        this.validateAccountStakeBalance(owner);
        validateAccountDeployerStake(owner);

        // Indicate this service provider is within bounds
        spDetails[owner].validBounds = true;

        emit UpdatedStakeAmount(
            owner,
            newStakeAmount
        );

        return newStakeAmount;
    }

    function decreaseStake(uint256 _decreaseStakeAmount) external returns (uint newTotalStake) {
        address owner = msg.sender;

        // Confirm owner has an endpoint
        uint numberOfEndpoints = ServiceProviderStorageInterface(
            registry.getContract(serviceProviderStorageRegistryKey)
        ).getNumberOfEndpointsFromAddress(owner);
        require(numberOfEndpoints > 0, "Registered endpoint required to decrease stake");

        ERCStaking stakingContract = ERCStaking(
            registry.getContract(stakingProxyOwnerKey)
        );

        uint currentStakeAmount = stakingContract.totalStakedFor(owner);

        // Prohibit decreasing stake to zero without deregistering all endpoints
        require(
            currentStakeAmount - _decreaseStakeAmount > 0,
            "Please deregister endpoints to remove all stake");

        // Decrease staked token amount for msg.sender
        stakingContract.unstakeFor(owner, _decreaseStakeAmount, empty);

        // Query current stake
        uint newStakeAmount = stakingContract.totalStakedFor(owner);

        // Update deployer total
        spDetails[owner].deployerStake -= _decreaseStakeAmount;

        // Confirm both aggregate account balance and directly staked amount are valid
        this.validateAccountStakeBalance(owner);
        validateAccountDeployerStake(owner);

        // Indicate this service provider is within bounds
        spDetails[owner].validBounds = true;

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
     */
    function updateServiceProviderStake(
        address _serviceProvider,
        uint _amount
     ) external
    {
        require(
            msg.sender == registry.getContract(delegateManagerKey),
            "updateServiceProviderStake - only callable by DelegateManager"
        );
        // Update SP tracked total
        spDetails[_serviceProvider].deployerStake = _amount;
        updateServiceProviderBoundStatus(_serviceProvider);
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
        spDetails[_serviceProvider].deployerCut = _cut;
    }

    /**
     * @notice Represents amount directly staked by service provider
     */
    function getServiceProviderStake(address _address)
    external view returns (uint stake)
    {
        return spDetails[_address].deployerStake;
    }

    /**
     * @notice Represents % taken by sp deployer of rewards
     */
    function getServiceProviderDeployerCut(address _address)
    external view returns (uint cut)
    {
        return spDetails[_address].deployerCut;
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

    function getMinDeployerStake()
    external view returns (uint min)
    {
        return minDeployerStake;
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

    /// @notice Calculate the stake for an account based on total number of registered services
    // TODO: Cache value
    function getAccountStakeBounds(address sp)
    external view returns (uint min, uint max)
    {
        uint minStake = 0;
        uint maxStake = 0;
        bytes32[] memory validServiceTypes = ServiceTypeManager(
            registry.getContract(serviceTypeManagerKey)
        ).getValidServiceTypes();
        uint validTypesLength = validServiceTypes.length;
        for (uint i = 0; i < validTypesLength; i++) {
            bytes32 serviceType = validServiceTypes[i];
            (uint typeMin, uint typeMax) = ServiceTypeManager(
                registry.getContract(serviceTypeManagerKey)
            ).getServiceTypeStakeInfo(serviceType);
            uint numberOfEndpoints = this.getServiceProviderIdsFromAddress(sp, serviceType).length;
            minStake += (typeMin * numberOfEndpoints);
            maxStake += (typeMax * numberOfEndpoints);
        }
        return (minStake, maxStake);
    }

    // @notice Returns status of service provider total stake and relation to bounds
    function isServiceProviderWithinBounds(address sp)
    external view returns (bool isValid)
    {
        return spDetails[sp].validBounds;
    }

    /// @notice Validate that the service provider is between the min and max stakes for all their registered services
    // Permission to 'this' contract or delegate manager
    function validateAccountStakeBalance(address sp)
    external view returns (uint stakedForOwner)
    {
        ERCStaking stakingContract = ERCStaking(
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

        return currentlyStakedForOwner;
    }

    /**
     * @notice Update service provider bound status
     */
    function updateServiceProviderBoundStatus(address _serviceProvider) internal {
        ERCStaking stakingContract = ERCStaking(
            registry.getContract(stakingProxyOwnerKey)
        );
        // Validate bounds for total stake
        uint totalSPStake = stakingContract.totalStakedFor(_serviceProvider);
        (uint minStake, uint maxStake) = this.getAccountStakeBounds(_serviceProvider);
        if (totalSPStake < minStake || totalSPStake > maxStake) {
            // Indicate this service provider is out of bounds
            spDetails[_serviceProvider].validBounds = false;
        } else {
            // Indicate this service provider is within bounds
            spDetails[_serviceProvider].validBounds = true;
        }
    }

    /// @notice Validate that the service provider deployer stake satisfies protocol minimum
    function validateAccountDeployerStake(address sp)
    internal view returns (uint deployerStake)
    {
        require(
            spDetails[sp].deployerStake >= minDeployerStake,
            "Direct stake restriction violated for this service provider");
        return spDetails[sp].deployerStake;
    }
}
