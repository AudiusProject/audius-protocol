pragma solidity ^0.5.0;

import "@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";
import "./ServiceTypeManager.sol";
import "./ClaimsManager.sol";
import "./Staking.sol";
/// @notice Governance imported via Staking.sol


contract ServiceProviderFactory is InitializableV2 {
    using SafeMath for uint256;

    /// @dev - denominator for deployer cut calculations
    /// @dev - user values are intended to be x/DEPLOYER_CUT_BASE
    uint256 private constant DEPLOYER_CUT_BASE = 100;

    string private constant ERROR_ONLY_GOVERNANCE = (
        "ServiceProviderFactory: Only callable by Governance contract"
    );
    string private constant ERROR_ONLY_SP_GOVERNANCE = (
        "ServiceProviderFactory: Only callable by Service Provider or Governance"
    );

    address private stakingAddress;
    address private delegateManagerAddress;
    address private governanceAddress;
    address private serviceTypeManagerAddress;
    address private claimsManagerAddress;

    /// @notice Period in blocks that a decrease stake operation is delayed.
    ///         Must be greater than governance votingPeriod + executionDelay in order to
    ///         prevent pre-emptive withdrawal in anticipation of a slash proposal
    uint256 private decreaseStakeLockupDuration;

    /// @notice Period in blocks that an update deployer cut operation is delayed.
    ///         Must be greater than funding round block diff in order
    ///         to prevent manipulation around a funding round
    uint256 private deployerCutLockupDuration;

    /// @dev - Stores following entities
    ///        1) Directly staked amount by SP, not including delegators
    ///        2) % Cut of delegator tokens taken during reward
    ///        3) Bool indicating whether this SP has met min/max requirements
    ///        4) Number of endpoints registered by SP
    ///        5) Minimum deployer stake for this service provider
    ///        6) Maximum total stake for this account
    struct ServiceProviderDetails {
        uint256 deployerStake;
        uint256 deployerCut;
        bool validBounds;
        uint256 numberOfEndpoints;
        uint256 minAccountStake;
        uint256 maxAccountStake;
    }

    /// @dev - Data structure for time delay during withdrawal
    struct DecreaseStakeRequest {
        uint256 decreaseAmount;
        uint256 lockupExpiryBlock;
    }

    /// @dev - Data structure for time delay during deployer cut update
    struct UpdateDeployerCutRequest {
        uint256 newDeployerCut;
        uint256 lockupExpiryBlock;
    }

    /// @dev - Struct maintaining information about sp
    /// @dev - blocknumber is block.number when endpoint registered
    struct ServiceEndpoint {
        address owner;
        string endpoint;
        uint256 blocknumber;
        address delegateOwnerWallet;
    }

    /// @dev - Mapping of service provider address to details
    mapping(address => ServiceProviderDetails) private spDetails;

    /// @dev - Uniquely assigned serviceProvider ID, incremented for each service type
    /// @notice - Keeps track of the total number of services registered regardless of
    ///           whether some have been deregistered since
    mapping(bytes32 => uint256) private serviceProviderTypeIDs;

    /// @dev - mapping of (serviceType -> (serviceInstanceId <-> serviceProviderInfo))
    /// @notice - stores the actual service provider data like endpoint and owner wallet
    ///           with the ability lookup by service type and service id */
    mapping(bytes32 => mapping(uint256 => ServiceEndpoint)) private serviceProviderInfo;

    /// @dev - mapping of keccak256(endpoint) to uint256 ID
    /// @notice - used to check if a endpoint has already been registered and also lookup
    /// the id of an endpoint
    mapping(bytes32 => uint256) private serviceProviderEndpointToId;

    /// @dev - mapping of address -> sp id array */
    /// @notice - stores all the services registered by a provider. for each address,
    /// provides the ability to lookup by service type and see all registered services
    mapping(address => mapping(bytes32 => uint256[])) private serviceProviderAddressToId;

    /// @dev - Mapping of service provider -> decrease stake request
    mapping(address => DecreaseStakeRequest) private decreaseStakeRequests;

    /// @dev - Mapping of service provider -> update deployer cut requests
    mapping(address => UpdateDeployerCutRequest) private updateDeployerCutRequests;

    event RegisteredServiceProvider(
      uint256 indexed _spID,
      bytes32 indexed _serviceType,
      address indexed _owner,
      string _endpoint,
      uint256 _stakeAmount
    );

    event DeregisteredServiceProvider(
      uint256 indexed _spID,
      bytes32 indexed _serviceType,
      address indexed _owner,
      string _endpoint,
      uint256 _unstakeAmount
    );

    event IncreasedStake(
      address indexed _owner,
      uint256 indexed _increaseAmount,
      uint256 indexed _newStakeAmount
    );

    event DecreaseStakeRequested(
      address indexed _owner,
      uint256 indexed _decreaseAmount,
      uint256 indexed _lockupExpiryBlock
    );

    event DecreaseStakeRequestCancelled(
      address indexed _owner,
      uint256 indexed _decreaseAmount,
      uint256 indexed _lockupExpiryBlock
    );

    event DecreaseStakeRequestEvaluated(
      address indexed _owner,
      uint256 indexed _decreaseAmount,
      uint256 indexed _newStakeAmount
    );

    event EndpointUpdated(
      bytes32 indexed _serviceType,
      address indexed _owner,
      string _oldEndpoint,
      string _newEndpoint,
      uint256 indexed _spID
    );

    event DelegateOwnerWalletUpdated(
      address indexed _owner,
      bytes32 indexed _serviceType,
      uint256 indexed _spID,
      address _updatedWallet
    );

    event DeployerCutUpdateRequested(
      address indexed _owner,
      uint256 indexed _updatedCut,
      uint256 indexed _lockupExpiryBlock
    );

    event DeployerCutUpdateRequestCancelled(
      address indexed _owner,
      uint256 indexed _requestedCut,
      uint256 indexed _finalCut
    );

    event DeployerCutUpdateRequestEvaluated(
      address indexed _owner,
      uint256 indexed _updatedCut
    );

    event DecreaseStakeLockupDurationUpdated(uint256 indexed _lockupDuration);
    event UpdateDeployerCutLockupDurationUpdated(uint256 indexed _lockupDuration);
    event GovernanceAddressUpdated(address indexed _newGovernanceAddress);
    event StakingAddressUpdated(address indexed _newStakingAddress);
    event ClaimsManagerAddressUpdated(address indexed _newClaimsManagerAddress);
    event DelegateManagerAddressUpdated(address indexed _newDelegateManagerAddress);
    event ServiceTypeManagerAddressUpdated(address indexed _newServiceTypeManagerAddress);

    /**
     * @notice Function to initialize the contract
     * @dev stakingAddress must be initialized separately after Staking contract is deployed
     * @dev delegateManagerAddress must be initialized separately after DelegateManager contract is deployed
     * @dev serviceTypeManagerAddress must be initialized separately after ServiceTypeManager contract is deployed
     * @dev claimsManagerAddress must be initialized separately after ClaimsManager contract is deployed
     * @param _governanceAddress - Governance proxy address
     */
    function initialize (
        address _governanceAddress,
        address _claimsManagerAddress,
        uint256 _decreaseStakeLockupDuration,
        uint256 _deployerCutLockupDuration
    ) public initializer
    {
        _updateGovernanceAddress(_governanceAddress);
        claimsManagerAddress = _claimsManagerAddress;
        _updateDecreaseStakeLockupDuration(_decreaseStakeLockupDuration);
        _updateDeployerCutLockupDuration(_deployerCutLockupDuration);
        InitializableV2.initialize();
    }

    /**
     * @notice Register a new endpoint to the account of msg.sender
     * @dev Transfers stake from service provider into staking pool
     * @param _serviceType - type of service to register, must be valid in ServiceTypeManager
     * @param _endpoint - url of the service to register - url of the service to register
     * @param _stakeAmount - amount to stake, must be within bounds in ServiceTypeManager
     * @param _delegateOwnerWallet - wallet to delegate some permissions for some basic management properties
     * @return New service provider ID for this endpoint
     */
    function register(
        bytes32 _serviceType,
        string calldata _endpoint,
        uint256 _stakeAmount,
        address _delegateOwnerWallet
    ) external returns (uint256)
    {
        _requireIsInitialized();
        _requireStakingAddressIsSet();
        _requireServiceTypeManagerAddressIsSet();
        _requireClaimsManagerAddressIsSet();

        require(
            ServiceTypeManager(serviceTypeManagerAddress).serviceTypeIsValid(_serviceType),
            "ServiceProviderFactory: Valid service type required");

        // Stake token amount from msg.sender
        if (_stakeAmount > 0) {
            require(
                !_claimPending(msg.sender),
                "ServiceProviderFactory: No pending claim expected"
            );
            Staking(stakingAddress).stakeFor(msg.sender, _stakeAmount);
        }

        require (
            serviceProviderEndpointToId[keccak256(bytes(_endpoint))] == 0,
            "ServiceProviderFactory: Endpoint already registered");

        uint256 newServiceProviderID = serviceProviderTypeIDs[_serviceType].add(1);
        serviceProviderTypeIDs[_serviceType] = newServiceProviderID;

        // Index spInfo
        serviceProviderInfo[_serviceType][newServiceProviderID] = ServiceEndpoint({
            owner: msg.sender,
            endpoint: _endpoint,
            blocknumber: block.number,
            delegateOwnerWallet: _delegateOwnerWallet
        });

        // Update endpoint mapping
        serviceProviderEndpointToId[keccak256(bytes(_endpoint))] = newServiceProviderID;

        // Update (address -> type -> ids[])
        serviceProviderAddressToId[msg.sender][_serviceType].push(newServiceProviderID);

        // Increment number of endpoints for this address
        spDetails[msg.sender].numberOfEndpoints = spDetails[msg.sender].numberOfEndpoints.add(1);

        // Update deployer total
        spDetails[msg.sender].deployerStake = (
            spDetails[msg.sender].deployerStake.add(_stakeAmount)
        );

        // Update min and max totals for this service provider
        (, uint256 typeMin, uint256 typeMax) = ServiceTypeManager(
            serviceTypeManagerAddress
        ).getServiceTypeInfo(_serviceType);
        spDetails[msg.sender].minAccountStake = spDetails[msg.sender].minAccountStake.add(typeMin);
        spDetails[msg.sender].maxAccountStake = spDetails[msg.sender].maxAccountStake.add(typeMax);

        // Confirm both aggregate account balance and directly staked amount are valid
        this.validateAccountStakeBalance(msg.sender);
        uint256 currentlyStakedForOwner = Staking(stakingAddress).totalStakedFor(msg.sender);


        // Indicate this service provider is within bounds
        spDetails[msg.sender].validBounds = true;

        emit RegisteredServiceProvider(
            newServiceProviderID,
            _serviceType,
            msg.sender,
            _endpoint,
            currentlyStakedForOwner
        );

        return newServiceProviderID;
    }

    /**
     * @notice Deregister an endpoint from the account of msg.sender
     * @dev Unstakes all tokens for service provider if this is the last endpoint
     * @param _serviceType - type of service to deregister
     * @param _endpoint - endpoint to deregister
     * @return spId of the service that was deregistered
     */
    function deregister(
        bytes32 _serviceType,
        string calldata _endpoint
    ) external returns (uint256)
    {
        _requireIsInitialized();
        _requireStakingAddressIsSet();
        _requireServiceTypeManagerAddressIsSet();

        // Unstake on deregistration if and only if this is the last service endpoint
        uint256 unstakeAmount = 0;
        bool unstaked = false;
        // owned by the service provider
        if (spDetails[msg.sender].numberOfEndpoints == 1) {
            unstakeAmount = spDetails[msg.sender].deployerStake;

            // Submit request to decrease stake, overriding any pending request
            decreaseStakeRequests[msg.sender] = DecreaseStakeRequest({
                decreaseAmount: unstakeAmount,
                lockupExpiryBlock: block.number.add(decreaseStakeLockupDuration)
            });

            unstaked = true;
        }

        require (
            serviceProviderEndpointToId[keccak256(bytes(_endpoint))] != 0,
            "ServiceProviderFactory: Endpoint not registered");

        // Cache invalided service provider ID
        uint256 deregisteredID = serviceProviderEndpointToId[keccak256(bytes(_endpoint))];

        // Update endpoint mapping
        serviceProviderEndpointToId[keccak256(bytes(_endpoint))] = 0;

        require(
            keccak256(bytes(serviceProviderInfo[_serviceType][deregisteredID].endpoint)) == keccak256(bytes(_endpoint)),
            "ServiceProviderFactory: Invalid endpoint for service type");

        require (
            serviceProviderInfo[_serviceType][deregisteredID].owner == msg.sender,
            "ServiceProviderFactory: Only callable by endpoint owner");

        // Update info mapping
        delete serviceProviderInfo[_serviceType][deregisteredID];
        // Reset id, update array
        uint256 spTypeLength = serviceProviderAddressToId[msg.sender][_serviceType].length;
        for (uint256 i = 0; i < spTypeLength; i ++) {
            if (serviceProviderAddressToId[msg.sender][_serviceType][i] == deregisteredID) {
                // Overwrite element to be deleted with last element in array
                serviceProviderAddressToId[msg.sender][_serviceType][i] = serviceProviderAddressToId[msg.sender][_serviceType][spTypeLength - 1];
                // Reduce array size, exit loop
                serviceProviderAddressToId[msg.sender][_serviceType].length--;
                // Confirm this ID has been found for the service provider
                break;
            }
        }

        // Decrement number of endpoints for this address
        spDetails[msg.sender].numberOfEndpoints -= 1;

        // Update min and max totals for this service provider
        (, uint256 typeMin, uint256 typeMax) = ServiceTypeManager(
            serviceTypeManagerAddress
        ).getServiceTypeInfo(_serviceType);
        spDetails[msg.sender].minAccountStake = spDetails[msg.sender].minAccountStake.sub(typeMin);
        spDetails[msg.sender].maxAccountStake = spDetails[msg.sender].maxAccountStake.sub(typeMax);

        emit DeregisteredServiceProvider(
            deregisteredID,
            _serviceType,
            msg.sender,
            _endpoint,
            unstakeAmount);

        // Confirm both aggregate account balance and directly staked amount are valid
        // Only if unstake operation has not occurred
        if (!unstaked) {
            this.validateAccountStakeBalance(msg.sender);
            // Indicate this service provider is within bounds
            spDetails[msg.sender].validBounds = true;
        }

        return deregisteredID;
    }

    /**
     * @notice Increase stake for service provider
     * @param _increaseStakeAmount - amount to increase staked amount by
     * @return New total stake for service provider
     */
    function increaseStake(
        uint256 _increaseStakeAmount
    ) external returns (uint256)
    {
        _requireIsInitialized();
        _requireStakingAddressIsSet();
        _requireClaimsManagerAddressIsSet();

        // Confirm owner has an endpoint
        require(
            spDetails[msg.sender].numberOfEndpoints > 0,
            "ServiceProviderFactory: Registered endpoint required to increase stake"
        );
        require(
            !_claimPending(msg.sender),
            "ServiceProviderFactory: No claim expected to be pending prior to stake transfer"
        );

        Staking stakingContract = Staking(
            stakingAddress
        );

        // Stake increased token amount for msg.sender
        stakingContract.stakeFor(msg.sender, _increaseStakeAmount);

        uint256 newStakeAmount = stakingContract.totalStakedFor(msg.sender);

        // Update deployer total
        spDetails[msg.sender].deployerStake = (
            spDetails[msg.sender].deployerStake.add(_increaseStakeAmount)
        );

        // Confirm both aggregate account balance and directly staked amount are valid
        this.validateAccountStakeBalance(msg.sender);

        // Indicate this service provider is within bounds
        spDetails[msg.sender].validBounds = true;

        emit IncreasedStake(
            msg.sender,
            _increaseStakeAmount,
            newStakeAmount
        );

        return newStakeAmount;
    }

    /**
     * @notice Request to decrease stake. This sets a lockup for decreaseStakeLockupDuration after
               which the actual decreaseStake can be called
     * @dev Decreasing stake is only processed if a service provider is within valid bounds
     * @param _decreaseStakeAmount - amount to decrease stake by in wei
     * @return New total stake amount after the lockup
     */
    function requestDecreaseStake(uint256 _decreaseStakeAmount)
    external returns (uint256)
    {
        _requireIsInitialized();
        _requireStakingAddressIsSet();
        _requireClaimsManagerAddressIsSet();

        require(
            _decreaseStakeAmount > 0,
            "ServiceProviderFactory: Requested stake decrease amount must be greater than zero"
        );
        require(
            !_claimPending(msg.sender),
            "ServiceProviderFactory: No claim expected to be pending prior to stake transfer"
        );

        Staking stakingContract = Staking(
            stakingAddress
        );

        uint256 currentStakeAmount = stakingContract.totalStakedFor(msg.sender);

        // Prohibit decreasing stake to invalid bounds
        _validateBalanceInternal(msg.sender, (currentStakeAmount.sub(_decreaseStakeAmount)));

        uint256 expiryBlock = block.number.add(decreaseStakeLockupDuration);
        decreaseStakeRequests[msg.sender] = DecreaseStakeRequest({
            decreaseAmount: _decreaseStakeAmount,
            lockupExpiryBlock: expiryBlock
        });

        emit DecreaseStakeRequested(msg.sender, _decreaseStakeAmount, expiryBlock);
        return currentStakeAmount.sub(_decreaseStakeAmount);
    }

    /**
     * @notice Cancel a decrease stake request during the lockup
     * @dev Either called by the service provider via DelegateManager or governance
            during a slash action
     * @param _account - address of service provider
     */
    function cancelDecreaseStakeRequest(address _account) external
    {
        _requireIsInitialized();
        _requireDelegateManagerAddressIsSet();

        require(
            msg.sender == _account || msg.sender == delegateManagerAddress,
            "ServiceProviderFactory: Only owner or DelegateManager"
        );
        require(
            _decreaseRequestIsPending(_account),
            "ServiceProviderFactory: Decrease stake request must be pending"
        );

        DecreaseStakeRequest memory cancelledRequest = decreaseStakeRequests[_account];

        // Clear decrease stake request
        decreaseStakeRequests[_account] = DecreaseStakeRequest({
            decreaseAmount: 0,
            lockupExpiryBlock: 0
        });

        emit DecreaseStakeRequestCancelled(
            _account,
            cancelledRequest.decreaseAmount,
            cancelledRequest.lockupExpiryBlock
        );
    }

    /**
     * @notice Called by user to decrease a stake after waiting the appropriate lockup period.
     * @return New total stake after decrease
     */
    function decreaseStake() external returns (uint256)
    {
        _requireIsInitialized();
        _requireStakingAddressIsSet();

        require(
            _decreaseRequestIsPending(msg.sender),
            "ServiceProviderFactory: Decrease stake request must be pending"
        );
        require(
            decreaseStakeRequests[msg.sender].lockupExpiryBlock <= block.number,
            "ServiceProviderFactory: Lockup must be expired"
        );

        Staking stakingContract = Staking(
            stakingAddress
        );

        uint256 decreaseAmount = decreaseStakeRequests[msg.sender].decreaseAmount;
        // Decrease staked token amount for msg.sender
        stakingContract.unstakeFor(msg.sender, decreaseAmount);

        // Query current stake
        uint256 newStakeAmount = stakingContract.totalStakedFor(msg.sender);

        // Update deployer total
        spDetails[msg.sender].deployerStake = (
            spDetails[msg.sender].deployerStake.sub(decreaseAmount)
        );

        // Confirm both aggregate account balance and directly staked amount are valid
        // During registration this validation is bypassed since no endpoints remain
        if (spDetails[msg.sender].numberOfEndpoints > 0) {
            this.validateAccountStakeBalance(msg.sender);
        }

        // Indicate this service provider is within bounds
        spDetails[msg.sender].validBounds = true;

        // Clear decrease stake request
        delete decreaseStakeRequests[msg.sender];

        emit DecreaseStakeRequestEvaluated(msg.sender, decreaseAmount, newStakeAmount);
        return newStakeAmount;
    }

    /**
     * @notice Update delegate owner wallet for a given endpoint
     * @param _serviceType - type of service to register, must be valid in ServiceTypeManager
     * @param _endpoint - url of the service to register - url of the service to register
     * @param _updatedDelegateOwnerWallet - address of new delegate wallet
     */
    function updateDelegateOwnerWallet(
        bytes32 _serviceType,
        string calldata _endpoint,
        address _updatedDelegateOwnerWallet
    ) external
    {
        _requireIsInitialized();

        uint256 spID = this.getServiceProviderIdFromEndpoint(_endpoint);

        require(
            serviceProviderInfo[_serviceType][spID].owner == msg.sender,
            "ServiceProviderFactory: Invalid update operation, wrong owner"
        );

        serviceProviderInfo[_serviceType][spID].delegateOwnerWallet = _updatedDelegateOwnerWallet;
        emit DelegateOwnerWalletUpdated(
            msg.sender,
            _serviceType,
            spID,
            _updatedDelegateOwnerWallet
        );
    }

    /**
     * @notice Update the endpoint for a given service
     * @param _serviceType - type of service to register, must be valid in ServiceTypeManager
     * @param _oldEndpoint - old endpoint currently registered
     * @param _newEndpoint - new endpoint to replace old endpoint
     * @return ID of updated service provider
     */
    function updateEndpoint(
        bytes32 _serviceType,
        string calldata _oldEndpoint,
        string calldata _newEndpoint
    ) external returns (uint256)
    {
        _requireIsInitialized();

        uint256 spId = this.getServiceProviderIdFromEndpoint(_oldEndpoint);
        require (
            spId != 0,
            "ServiceProviderFactory: Could not find service provider with that endpoint"
        );

        ServiceEndpoint memory serviceEndpoint = serviceProviderInfo[_serviceType][spId];

        require(
            serviceEndpoint.owner == msg.sender,
            "ServiceProviderFactory: Invalid update endpoint operation, wrong owner"
        );
        require(
            keccak256(bytes(serviceEndpoint.endpoint)) == keccak256(bytes(_oldEndpoint)),
            "ServiceProviderFactory: Old endpoint doesn't match what's registered for the service provider"
        );

        // invalidate old endpoint
        serviceProviderEndpointToId[keccak256(bytes(serviceEndpoint.endpoint))] = 0;

        // update to new endpoint
        serviceEndpoint.endpoint = _newEndpoint;
        serviceProviderInfo[_serviceType][spId] = serviceEndpoint;
        serviceProviderEndpointToId[keccak256(bytes(_newEndpoint))] = spId;

        emit EndpointUpdated(_serviceType, msg.sender, _oldEndpoint, _newEndpoint, spId);
        return spId;
    }

    /**
     * @notice Update the deployer cut for a given service provider
     * @param _serviceProvider - address of service provider
     * @param _cut - new value for deployer cut
     */
    function requestUpdateDeployerCut(address _serviceProvider, uint256 _cut) external
    {
        _requireIsInitialized();

        require(
            msg.sender == _serviceProvider || msg.sender == governanceAddress,
            ERROR_ONLY_SP_GOVERNANCE
        );

        require(
            (updateDeployerCutRequests[_serviceProvider].lockupExpiryBlock == 0) &&
            (updateDeployerCutRequests[_serviceProvider].newDeployerCut == 0),
            "ServiceProviderFactory: Update deployer cut operation pending"
        );

        require(
            _cut <= DEPLOYER_CUT_BASE,
            "ServiceProviderFactory: Service Provider cut cannot exceed base value"
        );

        uint256 expiryBlock = block.number + deployerCutLockupDuration;
        updateDeployerCutRequests[_serviceProvider] = UpdateDeployerCutRequest({
            lockupExpiryBlock: expiryBlock,
            newDeployerCut: _cut
        });

        emit DeployerCutUpdateRequested(_serviceProvider, _cut, expiryBlock);
    }

    /**
     * @notice Cancel a pending request to update deployer cut
     * @param _serviceProvider - address of service provider
     */
    function cancelUpdateDeployerCut(address _serviceProvider) external
    {
        _requireIsInitialized();
        _requirePendingDeployerCutOperation(_serviceProvider);

        require(
            msg.sender == _serviceProvider || msg.sender == governanceAddress,
            ERROR_ONLY_SP_GOVERNANCE
        );

        UpdateDeployerCutRequest memory cancelledRequest = (
            updateDeployerCutRequests[_serviceProvider]
        );

        // Zero out request information
        delete updateDeployerCutRequests[_serviceProvider];
        emit DeployerCutUpdateRequestCancelled(
            _serviceProvider,
            cancelledRequest.newDeployerCut,
            spDetails[_serviceProvider].deployerCut
        );
    }

    /**
     * @notice Evalue request to update service provider cut of claims
     * @notice Update service provider cut as % of delegate claim, divided by the deployerCutBase.
     * @dev SPs will interact with this value as a percent, value translation done client side
       @dev A value of 5 dictates a 5% cut, with ( 5 / 100 ) * delegateReward going to an SP from each delegator each round.
     */
    function updateDeployerCut(address _serviceProvider) external
    {
        _requireIsInitialized();
        _requirePendingDeployerCutOperation(_serviceProvider);

        require(
            msg.sender == _serviceProvider || msg.sender == governanceAddress,
            ERROR_ONLY_SP_GOVERNANCE
        );

        require(
            updateDeployerCutRequests[_serviceProvider].lockupExpiryBlock <= block.number,
            "ServiceProviderFactory: Lockup must be expired"
        );

        spDetails[_serviceProvider].deployerCut = (
            updateDeployerCutRequests[_serviceProvider].newDeployerCut
        );

        // Zero out request information
        delete updateDeployerCutRequests[_serviceProvider];

        emit DeployerCutUpdateRequestEvaluated(
            _serviceProvider,
            spDetails[_serviceProvider].deployerCut
        );
    }

    /**
     * @notice Update service provider balance
     * @dev Called by DelegateManager by functions modifying entire stake like claim and slash
     * @param _serviceProvider - address of service provider
     * @param _amount - new amount of direct state for service provider
     */
    function updateServiceProviderStake(
        address _serviceProvider,
        uint256 _amount
     ) external
    {
        _requireIsInitialized();
        _requireStakingAddressIsSet();
        _requireDelegateManagerAddressIsSet();

        require(
            msg.sender == delegateManagerAddress,
            "ServiceProviderFactory: only callable by DelegateManager"
        );
        // Update SP tracked total
        spDetails[_serviceProvider].deployerStake = _amount;
        _updateServiceProviderBoundStatus(_serviceProvider);
    }

    /// @notice Update service provider lockup duration
    function updateDecreaseStakeLockupDuration(uint256 _duration) external {
        _requireIsInitialized();

        require(
            msg.sender == governanceAddress,
            ERROR_ONLY_GOVERNANCE
        );

        _updateDecreaseStakeLockupDuration(_duration);
        emit DecreaseStakeLockupDurationUpdated(_duration);
    }

    /// @notice Update service provider lockup duration
    function updateDeployerCutLockupDuration(uint256 _duration) external {
        _requireIsInitialized();

        require(
            msg.sender == governanceAddress,
            ERROR_ONLY_GOVERNANCE
        );

        _updateDeployerCutLockupDuration(_duration);
        emit UpdateDeployerCutLockupDurationUpdated(_duration);
    }

    /// @notice Get denominator for deployer cut calculations
    function getServiceProviderDeployerCutBase()
    external view returns (uint256)
    {
        _requireIsInitialized();

        return DEPLOYER_CUT_BASE;
    }

    /// @notice Get current deployer cut update lockup duration
    function getDeployerCutLockupDuration()
    external view returns (uint256)
    {
        _requireIsInitialized();

        return deployerCutLockupDuration;
    }

    /// @notice Get total number of service providers for a given serviceType
    function getTotalServiceTypeProviders(bytes32 _serviceType)
    external view returns (uint256)
    {
        _requireIsInitialized();

        return serviceProviderTypeIDs[_serviceType];
    }

    /// @notice Get service provider id for an endpoint
    function getServiceProviderIdFromEndpoint(string calldata _endpoint)
    external view returns (uint256)
    {
        _requireIsInitialized();

        return serviceProviderEndpointToId[keccak256(bytes(_endpoint))];
    }

    /**
     * @notice Get service provider ids for a given service provider and service type
     * @return List of service ids of that type for a service provider
     */
    function getServiceProviderIdsFromAddress(address _ownerAddress, bytes32 _serviceType)
    external view returns (uint256[] memory)
    {
        _requireIsInitialized();

        return serviceProviderAddressToId[_ownerAddress][_serviceType];
    }

    /**
     * @notice Get information about a service endpoint given its service id
     * @param _serviceType - type of service, must be a valid service from ServiceTypeManager
     * @param _serviceId - id of service
     */
    function getServiceEndpointInfo(bytes32 _serviceType, uint256 _serviceId)
    external view returns (address owner, string memory endpoint, uint256 blockNumber, address delegateOwnerWallet)
    {
        _requireIsInitialized();

        ServiceEndpoint memory serviceEndpoint = serviceProviderInfo[_serviceType][_serviceId];
        return (
            serviceEndpoint.owner,
            serviceEndpoint.endpoint,
            serviceEndpoint.blocknumber,
            serviceEndpoint.delegateOwnerWallet
        );
    }

    /**
     * @notice Get information about a service provider given their address
     * @param _serviceProvider - address of service provider
     */
    function getServiceProviderDetails(address _serviceProvider)
    external view returns (
        uint256 deployerStake,
        uint256 deployerCut,
        bool validBounds,
        uint256 numberOfEndpoints,
        uint256 minAccountStake,
        uint256 maxAccountStake)
    {
        _requireIsInitialized();

        return (
            spDetails[_serviceProvider].deployerStake,
            spDetails[_serviceProvider].deployerCut,
            spDetails[_serviceProvider].validBounds,
            spDetails[_serviceProvider].numberOfEndpoints,
            spDetails[_serviceProvider].minAccountStake,
            spDetails[_serviceProvider].maxAccountStake
        );
    }

    /**
     * @notice Get information about pending decrease stake requests for service provider
     * @param _serviceProvider - address of service provider
     */
    function getPendingDecreaseStakeRequest(address _serviceProvider)
    external view returns (uint256 amount, uint256 lockupExpiryBlock)
    {
        _requireIsInitialized();

        return (
            decreaseStakeRequests[_serviceProvider].decreaseAmount,
            decreaseStakeRequests[_serviceProvider].lockupExpiryBlock
        );
    }

    /**
     * @notice Get information about pending decrease stake requests for service provider
     * @param _serviceProvider - address of service provider
     */
    function getPendingUpdateDeployerCutRequest(address _serviceProvider)
    external view returns (uint256 newDeployerCut, uint256 lockupExpiryBlock)
    {
        _requireIsInitialized();

        return (
            updateDeployerCutRequests[_serviceProvider].newDeployerCut,
            updateDeployerCutRequests[_serviceProvider].lockupExpiryBlock
        );
    }

    /// @notice Get current unstake lockup duration
    function getDecreaseStakeLockupDuration()
    external view returns (uint256)
    {
        _requireIsInitialized();

        return decreaseStakeLockupDuration;
    }

    /**
     * @notice Validate that the total service provider balance is between the min and max stakes
               for all their registered services and validate  direct stake for sp is above minimum
     * @param _serviceProvider - address of service provider
     */
    function validateAccountStakeBalance(address _serviceProvider)
    external view
    {
        _requireIsInitialized();
        _requireStakingAddressIsSet();

        _validateBalanceInternal(
            _serviceProvider,
            Staking(stakingAddress).totalStakedFor(_serviceProvider)
        );
    }

    /// @notice Get the Governance address
    function getGovernanceAddress() external view returns (address) {
        _requireIsInitialized();

        return governanceAddress;
    }

    /// @notice Get the Staking address
    function getStakingAddress() external view returns (address) {
        _requireIsInitialized();

        return stakingAddress;
    }

    /// @notice Get the DelegateManager address
    function getDelegateManagerAddress() external view returns (address) {
        _requireIsInitialized();

        return delegateManagerAddress;
    }

    /// @notice Get the ServiceTypeManager address
    function getServiceTypeManagerAddress() external view returns (address) {
        _requireIsInitialized();

        return serviceTypeManagerAddress;
    }

    /// @notice Get the ClaimsManager address
    function getClaimsManagerAddress() external view returns (address) {
        _requireIsInitialized();

        return claimsManagerAddress;
    }

    /**
     * @notice Set the Governance address
     * @dev Only callable by Governance address
     * @param _governanceAddress - address for new Governance contract
     */
    function setGovernanceAddress(address _governanceAddress) external {
        _requireIsInitialized();

        require(msg.sender == governanceAddress, ERROR_ONLY_GOVERNANCE);
        _updateGovernanceAddress(_governanceAddress);
        emit GovernanceAddressUpdated(_governanceAddress);
    }

    /**
     * @notice Set the Staking address
     * @dev Only callable by Governance address
     * @param _address - address for new Staking contract
     */
    function setStakingAddress(address _address) external {
        _requireIsInitialized();

        require(msg.sender == governanceAddress, ERROR_ONLY_GOVERNANCE);
        stakingAddress = _address;
        emit StakingAddressUpdated(_address);
    }

    /**
     * @notice Set the DelegateManager address
     * @dev Only callable by Governance address
     * @param _address - address for new DelegateManager contract
     */
    function setDelegateManagerAddress(address _address) external {
        _requireIsInitialized();

        require(msg.sender == governanceAddress, ERROR_ONLY_GOVERNANCE);
        delegateManagerAddress = _address;
        emit DelegateManagerAddressUpdated(_address);
    }

    /**
     * @notice Set the ServiceTypeManager address
     * @dev Only callable by Governance address
     * @param _address - address for new ServiceTypeManager contract
     */
    function setServiceTypeManagerAddress(address _address) external {
        _requireIsInitialized();

        require(msg.sender == governanceAddress, ERROR_ONLY_GOVERNANCE);
        serviceTypeManagerAddress = _address;
        emit ServiceTypeManagerAddressUpdated(_address);
    }

    /**
     * @notice Set the ClaimsManager address
     * @dev Only callable by Governance address
     * @param _address - address for new ClaimsManager contract
     */
    function setClaimsManagerAddress(address _address) external {
        _requireIsInitialized();

        require(msg.sender == governanceAddress, ERROR_ONLY_GOVERNANCE);
        claimsManagerAddress = _address;
        emit ClaimsManagerAddressUpdated(_address);
    }

    // ========================================= Internal Functions =========================================

    /**
     * @notice Update status in spDetails if the bounds for a service provider is valid
     */
    function _updateServiceProviderBoundStatus(address _serviceProvider) internal {
        // Validate bounds for total stake
        uint256 totalSPStake = Staking(stakingAddress).totalStakedFor(_serviceProvider);
        if (totalSPStake < spDetails[_serviceProvider].minAccountStake ||
            totalSPStake > spDetails[_serviceProvider].maxAccountStake) {
            // Indicate this service provider is out of bounds
            spDetails[_serviceProvider].validBounds = false;
        } else {
            // Indicate this service provider is within bounds
            spDetails[_serviceProvider].validBounds = true;
        }
    }

    /**
     * @notice Set the governance address after confirming contract identity
     * @param _governanceAddress - Incoming governance address
     */
    function _updateGovernanceAddress(address _governanceAddress) internal {
        require(
            Governance(_governanceAddress).isGovernanceAddress() == true,
            "ServiceProviderFactory: _governanceAddress is not a valid governance contract"
        );
        governanceAddress = _governanceAddress;
    }

    /**
     * @notice Set the deployer cut lockup duration
     * @param _duration - incoming duration
     */
    function _updateDeployerCutLockupDuration(uint256 _duration) internal
    {
        require(
            ClaimsManager(claimsManagerAddress).getFundingRoundBlockDiff() < _duration,
            "ServiceProviderFactory: Incoming duration must be greater than funding round block diff"
        );
        deployerCutLockupDuration = _duration;
    }

    /**
     * @notice Set the decrease stake lockup duration
     * @param _duration - incoming duration
     */
    function _updateDecreaseStakeLockupDuration(uint256 _duration) internal
    {
        Governance governance = Governance(governanceAddress);
        require(
            _duration > governance.getVotingPeriod() + governance.getExecutionDelay(),
            "ServiceProviderFactory: decreaseStakeLockupDuration duration must be greater than governance votingPeriod + executionDelay"
        );
        decreaseStakeLockupDuration = _duration;
    }

    /**
     * @notice Compare a given amount input against valid min and max bounds for service provider
     * @param _serviceProvider - address of service provider
     * @param _amount - amount in wei to compare
     */
    function _validateBalanceInternal(address _serviceProvider, uint256 _amount) internal view
    {
        require(
            _amount <= spDetails[_serviceProvider].maxAccountStake,
            "ServiceProviderFactory: Maximum stake amount exceeded"
        );
        require(
            spDetails[_serviceProvider].deployerStake >= spDetails[_serviceProvider].minAccountStake,
            "ServiceProviderFactory: Minimum stake requirement not met"
        );
    }

    /**
     * @notice Get whether a decrease request has been initiated for service provider
     * @param _serviceProvider - address of service provider
     * return Boolean of whether decrease request has been initiated
     */
    function _decreaseRequestIsPending(address _serviceProvider)
    internal view returns (bool)
    {
        return (
            (decreaseStakeRequests[_serviceProvider].lockupExpiryBlock > 0) &&
            (decreaseStakeRequests[_serviceProvider].decreaseAmount > 0)
        );
    }

    /**
     * @notice Boolean indicating whether a claim is pending for this service provider
     */
     /**
     * @notice Get whether a claim is pending for this service provider
     * @param _serviceProvider - address of service provider
     * return Boolean of whether claim is pending
     */
    function _claimPending(address _serviceProvider) internal view returns (bool) {
        return ClaimsManager(claimsManagerAddress).claimPending(_serviceProvider);
    }

    // ========================================= Private Functions =========================================
    function _requirePendingDeployerCutOperation (address _serviceProvider) private view {
        require(
            (updateDeployerCutRequests[_serviceProvider].lockupExpiryBlock != 0),
            "ServiceProviderFactory: No update deployer cut operation pending"
        );
    }

    function _requireStakingAddressIsSet() private view {
        require(
            stakingAddress != address(0x00),
            "ServiceProviderFactory: stakingAddress is not set"
        );
    }

    function _requireDelegateManagerAddressIsSet() private view {
        require(
            delegateManagerAddress != address(0x00),
            "ServiceProviderFactory: delegateManagerAddress is not set"
        );
    }

    function _requireServiceTypeManagerAddressIsSet() private view {
        require(
            serviceTypeManagerAddress != address(0x00),
            "ServiceProviderFactory: serviceTypeManagerAddress is not set"
        );
    }

    function _requireClaimsManagerAddressIsSet() private view {
        require(
            claimsManagerAddress != address(0x00),
            "ServiceProviderFactory: claimsManagerAddress is not set"
        );
    }
}
