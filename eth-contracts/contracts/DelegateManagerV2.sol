pragma solidity ^0.5.0;

import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20Mintable.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20.sol";
/// @notice SafeMath imported via ServiceProviderFactory.sol
/// @notice Governance imported via Staking.sol

import "./Staking.sol";
import "./ServiceProviderFactory.sol";
import "./ClaimsManager.sol";


/**
 * Designed to manage delegation to staking contract
 */
contract DelegateManagerV2 is InitializableV2 {
    using SafeMath for uint256;

    string private constant ERROR_ONLY_GOVERNANCE = (
        "DelegateManager: Only callable by Governance contract"
    );
    string private constant ERROR_MINIMUM_DELEGATION = (
        "DelegateManager: Minimum delegation amount required"
    );
    string private constant ERROR_ONLY_SP_GOVERNANCE = (
        "DelegateManager: Only callable by target SP or governance"
    );
    string private constant ERROR_DELEGATOR_STAKE = (
        "DelegateManager: Delegator must be staked for SP"
    );

    address private governanceAddress;
    address private stakingAddress;
    address private serviceProviderFactoryAddress;
    address private claimsManagerAddress;

    /**
     * Period in  blocks an undelegate operation is delayed.
     * The undelegate operation speed bump is to prevent a delegator from
     *      attempting to remove their delegation in anticipation of a slash.
     * @notice Must be greater than governance votingPeriod + executionDelay
     */
    uint256 private undelegateLockupDuration;

    /// @notice Maximum number of delegators a single account can handle
    uint256 private maxDelegators;

    /// @notice Minimum amount of delegation allowed
    uint256 private minDelegationAmount;

    /**
     * Lockup duration for a remove delegator request.
     * The remove delegator speed bump is to prevent a service provider from maliciously
     *     removing a delegator prior to the evaluation of a proposal.
     * @notice Must be greater than governance votingPeriod + executionDelay
     */
    uint256 private removeDelegatorLockupDuration;

    /**
     * Evaluation period for a remove delegator request
     * @notice added to expiry block calculated for removeDelegatorLockupDuration
     */
    uint256 private removeDelegatorEvalDuration;

    // Staking contract ref
    ERC20Mintable private audiusToken;

    // Struct representing total delegated to SP and list of delegators
    struct ServiceProviderDelegateInfo {
        uint256 totalDelegatedStake;
        uint256 totalLockedUpStake;
        address[] delegators;
    }

    // Data structures for lockup during withdrawal
    struct UndelegateStakeRequest {
        address serviceProvider;
        uint256 amount;
        uint256 lockupExpiryBlock;
    }

    // Service provider address -> ServiceProviderDelegateInfo
    mapping (address => ServiceProviderDelegateInfo) private spDelegateInfo;

    // Delegator stake by address delegated to
    // delegator -> (service provider -> delegatedStake)
    mapping (address => mapping(address => uint256)) private delegateInfo;

    // Delegator stake total by address
    // delegator -> (totalDelegated)
    // Note - delegator properties are maintained in a mapping instead of struct
    // in order to facilitate extensibility in the future.
    mapping (address => uint256) private delegatorTotalStake;

    // Requester to pending undelegate request
    mapping (address => UndelegateStakeRequest) private undelegateRequests;

    // Pending remove delegator requests
    // service provider -> (delegator -> lockupExpiryBlock)
    mapping (address => mapping (address => uint256)) private removeDelegatorRequests;

    event IncreaseDelegatedStake(
        address indexed _delegator,
        address indexed _serviceProvider,
        uint256 indexed _increaseAmount
    );

    event UndelegateStakeRequested(
        address indexed _delegator,
        address indexed _serviceProvider,
        uint256 indexed _amount,
        uint256 _lockupExpiryBlock
    );

    event UndelegateStakeRequestCancelled(
        address indexed _delegator,
        address indexed _serviceProvider,
        uint256 indexed _amount
    );

    event UndelegateStakeRequestEvaluated(
        address indexed _delegator,
        address indexed _serviceProvider,
        uint256 indexed _amount
    );

    event Claim(
        address indexed _claimer,
        uint256 indexed _rewards,
        uint256 indexed _newTotal
    );

    event Slash(
        address indexed _target,
        uint256 indexed _amount,
        uint256 indexed _newTotal
    );

    event RemoveDelegatorRequested(
        address indexed _serviceProvider,
        address indexed _delegator,
        uint256 indexed _lockupExpiryBlock
    );

    event RemoveDelegatorRequestCancelled(
        address indexed _serviceProvider,
        address indexed _delegator
    );

    event RemoveDelegatorRequestEvaluated(
        address indexed _serviceProvider,
        address indexed _delegator,
        uint256 indexed _unstakedAmount
    );

    event MaxDelegatorsUpdated(uint256 indexed _maxDelegators);
    event MinDelegationUpdated(uint256 indexed _minDelegationAmount);
    event UndelegateLockupDurationUpdated(uint256 indexed _undelegateLockupDuration);
    event GovernanceAddressUpdated(address indexed _newGovernanceAddress);
    event StakingAddressUpdated(address indexed _newStakingAddress);
    event ServiceProviderFactoryAddressUpdated(address indexed _newServiceProviderFactoryAddress);
    event ClaimsManagerAddressUpdated(address indexed _newClaimsManagerAddress);
    event RemoveDelegatorLockupDurationUpdated(uint256 indexed _removeDelegatorLockupDuration);
    event RemoveDelegatorEvalDurationUpdated(uint256 indexed _removeDelegatorEvalDuration);

    // ========================================= New State Variables =========================================

    string private constant ERROR_ONLY_SP = (
        "DelegateManager: Only callable by valid SP"
    );

    // minDelegationAmount per service provider
    mapping (address => uint256) private spMinDelegationAmounts;

    event SPMinDelegationAmountUpdated(
        address indexed _serviceProvider,
        uint256 indexed _spMinDelegationAmount
    );

    // ========================================= Modifier Functions =========================================

    /**
     * @notice Function to initialize the contract
     * @dev stakingAddress must be initialized separately after Staking contract is deployed
     * @dev serviceProviderFactoryAddress must be initialized separately after ServiceProviderFactory contract is deployed
     * @dev claimsManagerAddress must be initialized separately after ClaimsManager contract is deployed
     * @param _tokenAddress - address of ERC20 token that will be claimed
     * @param _governanceAddress - Governance proxy address
     */
    function initialize (
        address _tokenAddress,
        address _governanceAddress,
        uint256 _undelegateLockupDuration
    ) public initializer
    {
        _updateGovernanceAddress(_governanceAddress);
        audiusToken = ERC20Mintable(_tokenAddress);
        maxDelegators = 175;
        // Default minimum delegation amount set to 100AUD
        minDelegationAmount = 100 * 10**uint256(18);
        InitializableV2.initialize();

        _updateUndelegateLockupDuration(_undelegateLockupDuration);

        // 1 week = 168hrs * 60 min/hr * 60 sec/min / ~13 sec/block = 46523 blocks
        _updateRemoveDelegatorLockupDuration(46523);

        // 24hr * 60min/hr * 60sec/min / ~13 sec/block = 6646 blocks
        removeDelegatorEvalDuration = 6646;
    }

    /**
     * @notice Allow a delegator to delegate stake to a service provider
     * @param _targetSP - address of service provider to delegate to
     * @param _amount - amount in wei to delegate
     * @return Updated total amount delegated to the service provider by delegator
     */
    function delegateStake(
        address _targetSP,
        uint256 _amount
    ) external returns (uint256)
    {
        _requireIsInitialized();
        _requireStakingAddressIsSet();
        _requireServiceProviderFactoryAddressIsSet();
        _requireClaimsManagerAddressIsSet();

        require(
            !_claimPending(_targetSP),
            "DelegateManager: Delegation not permitted for SP pending claim"
        );
        address delegator = msg.sender;
        Staking stakingContract = Staking(stakingAddress);

        // Stake on behalf of target service provider
        stakingContract.delegateStakeFor(
            _targetSP,
            delegator,
            _amount
        );

        // Update list of delegators to SP if necessary
        if (!_delegatorExistsForSP(delegator, _targetSP)) {
            // If not found, update list of delegates
            spDelegateInfo[_targetSP].delegators.push(delegator);
            require(
                spDelegateInfo[_targetSP].delegators.length <= maxDelegators,
                "DelegateManager: Maximum delegators exceeded"
            );
        }

        // Update following values in storage through helper
        // totalServiceProviderDelegatedStake = current sp total + new amount,
        // totalStakedForSpFromDelegator = current delegator total for sp + new amount,
        // totalDelegatorStake = current delegator total + new amount
        _updateDelegatorStake(
            delegator,
            _targetSP,
            spDelegateInfo[_targetSP].totalDelegatedStake.add(_amount),
            delegateInfo[delegator][_targetSP].add(_amount),
            delegatorTotalStake[delegator].add(_amount)
        );

        require(
            (delegateInfo[delegator][_targetSP] >= minDelegationAmount &&
             delegateInfo[delegator][_targetSP] >= spMinDelegationAmounts[_targetSP]
            ),
            ERROR_MINIMUM_DELEGATION
        );

        // Validate balance
        ServiceProviderFactory(
            serviceProviderFactoryAddress
        ).validateAccountStakeBalance(_targetSP);

        emit IncreaseDelegatedStake(
            delegator,
            _targetSP,
            _amount
        );

        // Return new total
        return delegateInfo[delegator][_targetSP];
    }

    /**
     * @notice Submit request for undelegation
     * @param _target - address of service provider to undelegate stake from
     * @param _amount - amount in wei to undelegate
     * @return Updated total amount delegated to the service provider by delegator
     */
    function requestUndelegateStake(
        address _target,
        uint256 _amount
    ) external returns (uint256)
    {
        _requireIsInitialized();
        _requireClaimsManagerAddressIsSet();

        require(
            _amount > 0,
            "DelegateManager: Requested undelegate stake amount must be greater than zero"
        );
        require(
            !_claimPending(_target),
            "DelegateManager: Undelegate request not permitted for SP pending claim"
        );
        address delegator = msg.sender;
        require(
            _delegatorExistsForSP(delegator, _target),
            ERROR_DELEGATOR_STAKE
        );

        // Confirm no pending delegation request
        require(
            !_undelegateRequestIsPending(delegator),
            "DelegateManager: No pending lockup expected"
        );

        // Ensure valid bounds
        uint256 currentlyDelegatedToSP = delegateInfo[delegator][_target];
        require(
            _amount <= currentlyDelegatedToSP,
            "DelegateManager: Cannot decrease greater than currently staked for this ServiceProvider"
        );

        // Submit updated request for sender, with target sp, undelegate amount, target expiry block
        uint256 lockupExpiryBlock = block.number.add(undelegateLockupDuration);
        _updateUndelegateStakeRequest(
            delegator,
            _target,
            _amount,
            lockupExpiryBlock
        );
        // Update total locked for this service provider, increasing by unstake amount
        _updateServiceProviderLockupAmount(
            _target,
            spDelegateInfo[_target].totalLockedUpStake.add(_amount)
        );

        emit UndelegateStakeRequested(delegator, _target, _amount, lockupExpiryBlock);
        return delegateInfo[delegator][_target].sub(_amount);
    }

    /**
     * @notice Cancel undelegation request
     */
    function cancelUndelegateStakeRequest() external {
        _requireIsInitialized();

        address delegator = msg.sender;
        // Confirm pending delegation request
        require(
            _undelegateRequestIsPending(delegator),
            "DelegateManager: Pending lockup expected"
        );
        uint256 unstakeAmount = undelegateRequests[delegator].amount;
        address unlockFundsSP = undelegateRequests[delegator].serviceProvider;
        // Update total locked for this service provider, decreasing by unstake amount
        _updateServiceProviderLockupAmount(
            unlockFundsSP,
            spDelegateInfo[unlockFundsSP].totalLockedUpStake.sub(unstakeAmount)
        );
        // Remove pending request
        _resetUndelegateStakeRequest(delegator);
        emit UndelegateStakeRequestCancelled(delegator, unlockFundsSP, unstakeAmount);
    }

    /**
     * @notice Finalize undelegation request and withdraw stake
     * @return New total amount currently staked after stake has been undelegated
     */
    function undelegateStake() external returns (uint256) {
        _requireIsInitialized();
        _requireStakingAddressIsSet();
        _requireServiceProviderFactoryAddressIsSet();
        _requireClaimsManagerAddressIsSet();

        address delegator = msg.sender;

        // Confirm pending delegation request
        require(
            _undelegateRequestIsPending(delegator),
            "DelegateManager: Pending lockup expected"
        );

        // Confirm lockup expiry has expired
        require(
            undelegateRequests[delegator].lockupExpiryBlock <= block.number,
            "DelegateManager: Lockup must be expired"
        );

        // Confirm no pending claim for this service provider
        require(
            !_claimPending(undelegateRequests[delegator].serviceProvider),
            "DelegateManager: Undelegate not permitted for SP pending claim"
        );

        address serviceProvider = undelegateRequests[delegator].serviceProvider;
        uint256 unstakeAmount = undelegateRequests[delegator].amount;

        // Unstake on behalf of target service provider
        Staking(stakingAddress).undelegateStakeFor(
            serviceProvider,
            delegator,
            unstakeAmount
        );

        // Update total delegated for SP
        // totalServiceProviderDelegatedStake - total amount delegated to service provider
        // totalStakedForSpFromDelegator - amount staked from this delegator to targeted service provider
        _updateDelegatorStake(
            delegator,
            serviceProvider,
            spDelegateInfo[serviceProvider].totalDelegatedStake.sub(unstakeAmount),
            delegateInfo[delegator][serviceProvider].sub(unstakeAmount),
            delegatorTotalStake[delegator].sub(unstakeAmount)
        );

        require(
            (
                delegateInfo[delegator][serviceProvider] >= minDelegationAmount &&
                delegateInfo[delegator][serviceProvider] >= spMinDelegationAmounts[serviceProvider]
            ) || delegateInfo[delegator][serviceProvider] == 0,
            ERROR_MINIMUM_DELEGATION
        );

        // Remove from delegators list if no delegated stake remaining
        if (delegateInfo[delegator][serviceProvider] == 0) {
            _removeFromDelegatorsList(serviceProvider, delegator);
        }

        // Update total locked for this service provider, decreasing by unstake amount
        _updateServiceProviderLockupAmount(
            serviceProvider,
            spDelegateInfo[serviceProvider].totalLockedUpStake.sub(unstakeAmount)
        );
        // Reset undelegate request
        _resetUndelegateStakeRequest(delegator);

        emit UndelegateStakeRequestEvaluated(
            delegator,
            serviceProvider,
            unstakeAmount
        );

        // Need to update service provider's `validBounds` flag
        //  Only way to do this is through `SPFactory.updateServiceProviderStake()`
        //  So we call it with the existing `spDeployerStake`
        (uint256 spDeployerStake,,,,,) = (
            ServiceProviderFactory(serviceProviderFactoryAddress).getServiceProviderDetails(serviceProvider)
        );
        ServiceProviderFactory(serviceProviderFactoryAddress).updateServiceProviderStake(
            serviceProvider, spDeployerStake
        );

        // Return new total
        return delegateInfo[delegator][serviceProvider];
    }

    /**
     * @notice Claim and distribute rewards to delegators and service provider as necessary
     * @param _serviceProvider - Provider for which rewards are being distributed
     * @dev Factors in service provider rewards from delegator and transfers deployer cut
     */
    function claimRewards(address _serviceProvider) external {
        _requireIsInitialized();
        _requireStakingAddressIsSet();
        _requireServiceProviderFactoryAddressIsSet();
        _requireClaimsManagerAddressIsSet();

        ServiceProviderFactory spFactory = ServiceProviderFactory(serviceProviderFactoryAddress);

        // Total rewards = (balance in staking) - ((balance in sp factory) + (balance in delegate manager))
        (
            uint256 totalBalanceInStaking,
            uint256 totalBalanceInSPFactory,
            uint256 totalActiveFunds,
            uint256 totalRewards,
            uint256 deployerCut
        ) = _validateClaimRewards(spFactory, _serviceProvider);

        // No-op if balance is already equivalent
        // This case can occur if no rewards due to bound violation or all stake is locked
        if (totalRewards == 0) {
            return;
        }

        uint256 totalDelegatedStakeIncrease = _distributeDelegateRewards(
            _serviceProvider,
            totalActiveFunds,
            totalRewards,
            deployerCut,
            spFactory.getServiceProviderDeployerCutBase()
        );

        // Update total delegated to this SP
        spDelegateInfo[_serviceProvider].totalDelegatedStake = (
            spDelegateInfo[_serviceProvider].totalDelegatedStake.add(totalDelegatedStakeIncrease)
        );

        // spRewardShare represents rewards directly allocated to service provider for their stake
        // Value is computed as the remainder of total minted rewards after distribution to
        // delegators, eliminating any potential for precision loss.
        uint256 spRewardShare = totalRewards.sub(totalDelegatedStakeIncrease);

        // Adding the newly calculated reward share to current balance
        uint256 newSPFactoryBalance = totalBalanceInSPFactory.add(spRewardShare);

        require(
            totalBalanceInStaking == newSPFactoryBalance.add(spDelegateInfo[_serviceProvider].totalDelegatedStake),
            "DelegateManager: claimRewards amount mismatch"
        );

        spFactory.updateServiceProviderStake(
            _serviceProvider,
            newSPFactoryBalance
        );
    }

    /**
     * @notice Reduce current stake amount
     * @dev Only callable by governance. Slashes service provider and delegators equally
     * @param _amount - amount in wei to slash
     * @param _slashAddress - address of service provider to slash
     */
    function slash(uint256 _amount, address _slashAddress)
    external
    {
        _requireIsInitialized();
        _requireStakingAddressIsSet();
        _requireServiceProviderFactoryAddressIsSet();

        require(msg.sender == governanceAddress, ERROR_ONLY_GOVERNANCE);

        Staking stakingContract = Staking(stakingAddress);
        ServiceProviderFactory spFactory = ServiceProviderFactory(serviceProviderFactoryAddress);

        // Amount stored in staking contract for owner
        uint256 totalBalanceInStakingPreSlash = stakingContract.totalStakedFor(_slashAddress);
        require(
            (totalBalanceInStakingPreSlash >= _amount),
            "DelegateManager: Cannot slash more than total currently staked"
        );

        // Cancel any withdrawal request for this service provider
        (uint256 spLockedStake,) = spFactory.getPendingDecreaseStakeRequest(_slashAddress);
        if (spLockedStake > 0) {
            spFactory.cancelDecreaseStakeRequest(_slashAddress);
        }

        // Amount in sp factory for slash target
        (uint256 totalBalanceInSPFactory,,,,,) = (
            spFactory.getServiceProviderDetails(_slashAddress)
        );
        require(
            totalBalanceInSPFactory > 0,
            "DelegateManager: Service Provider stake required"
        );

        // Decrease value in Staking contract
        // A value of zero slash will fail in staking, reverting this transaction
        stakingContract.slash(_amount, _slashAddress);
        uint256 totalBalanceInStakingAfterSlash = stakingContract.totalStakedFor(_slashAddress);

        // Emit slash event
        emit Slash(_slashAddress, _amount, totalBalanceInStakingAfterSlash);

        uint256 totalDelegatedStakeDecrease = 0;
        // For each delegator and deployer, recalculate new value
        // newStakeAmount = newStakeAmount * (oldStakeAmount / totalBalancePreSlash)
        for (uint256 i = 0; i < spDelegateInfo[_slashAddress].delegators.length; i++) {
            address delegator = spDelegateInfo[_slashAddress].delegators[i];
            uint256 preSlashDelegateStake = delegateInfo[delegator][_slashAddress];
            uint256 newDelegateStake = (
             totalBalanceInStakingAfterSlash.mul(preSlashDelegateStake)
            ).div(totalBalanceInStakingPreSlash);
            // slashAmountForDelegator = preSlashDelegateStake - newDelegateStake;
            delegateInfo[delegator][_slashAddress] = (
                delegateInfo[delegator][_slashAddress].sub(preSlashDelegateStake.sub(newDelegateStake))
            );
            // Update total stake for delegator
            _updateDelegatorTotalStake(
                delegator,
                delegatorTotalStake[delegator].sub(preSlashDelegateStake.sub(newDelegateStake))
            );
            // Update total decrease amount
            totalDelegatedStakeDecrease = (
                totalDelegatedStakeDecrease.add(preSlashDelegateStake.sub(newDelegateStake))
            );
            // Check for any locked up funds for this slashed delegator
            // Slash overrides any pending withdrawal requests
            if (undelegateRequests[delegator].amount != 0) {
                address unstakeSP = undelegateRequests[delegator].serviceProvider;
                uint256 unstakeAmount = undelegateRequests[delegator].amount;
                // Remove pending request
                _updateServiceProviderLockupAmount(
                    unstakeSP,
                    spDelegateInfo[unstakeSP].totalLockedUpStake.sub(unstakeAmount)
                );
                _resetUndelegateStakeRequest(delegator);
            }
        }

        // Update total delegated to this SP
        spDelegateInfo[_slashAddress].totalDelegatedStake = (
            spDelegateInfo[_slashAddress].totalDelegatedStake.sub(totalDelegatedStakeDecrease)
        );

        // Remaining decrease applied to service provider
        uint256 totalStakeDecrease = (
            totalBalanceInStakingPreSlash.sub(totalBalanceInStakingAfterSlash)
        );
        uint256 totalSPFactoryBalanceDecrease = (
            totalStakeDecrease.sub(totalDelegatedStakeDecrease)
        );
        spFactory.updateServiceProviderStake(
            _slashAddress,
            totalBalanceInSPFactory.sub(totalSPFactoryBalanceDecrease)
        );
    }

    /**
     * @notice Initiate forcible removal of a delegator
     * @param _serviceProvider - address of service provider
     * @param _delegator - address of delegator
     */
    function requestRemoveDelegator(address _serviceProvider, address _delegator) external {
        _requireIsInitialized();

        require(
            msg.sender == _serviceProvider || msg.sender == governanceAddress,
            ERROR_ONLY_SP_GOVERNANCE
        );

        require(
            removeDelegatorRequests[_serviceProvider][_delegator] == 0,
            "DelegateManager: Pending remove delegator request"
        );

        require(
            _delegatorExistsForSP(_delegator, _serviceProvider),
            ERROR_DELEGATOR_STAKE
        );

        // Update lockup
        removeDelegatorRequests[_serviceProvider][_delegator] = (
            block.number + removeDelegatorLockupDuration
        );

        emit RemoveDelegatorRequested(
            _serviceProvider,
            _delegator,
            removeDelegatorRequests[_serviceProvider][_delegator]
        );
    }

    /**
     * @notice Cancel pending removeDelegator request
     * @param _serviceProvider - address of service provider
     * @param _delegator - address of delegator
     */
    function cancelRemoveDelegatorRequest(address _serviceProvider, address _delegator) external {
        require(
            msg.sender == _serviceProvider || msg.sender == governanceAddress,
            ERROR_ONLY_SP_GOVERNANCE
        );
        require(
            removeDelegatorRequests[_serviceProvider][_delegator] != 0,
            "DelegateManager: No pending request"
        );
        // Reset lockup expiry
        removeDelegatorRequests[_serviceProvider][_delegator] = 0;
        emit RemoveDelegatorRequestCancelled(_serviceProvider, _delegator);
    }

    /**
     * @notice Evaluate removeDelegator request
     * @param _serviceProvider - address of service provider
     * @param _delegator - address of delegator
     * @return Updated total amount delegated to the service provider by delegator
     */
    function removeDelegator(address _serviceProvider, address _delegator) external {
        _requireIsInitialized();
        _requireStakingAddressIsSet();

        require(
            msg.sender == _serviceProvider || msg.sender == governanceAddress,
            ERROR_ONLY_SP_GOVERNANCE
        );

        require(
            removeDelegatorRequests[_serviceProvider][_delegator] != 0,
            "DelegateManager: No pending request"
        );

        // Enforce lockup expiry block
        require(
            block.number >= removeDelegatorRequests[_serviceProvider][_delegator],
            "DelegateManager: Lockup must be expired"
        );

        // Enforce evaluation window for request
        require(
            block.number < removeDelegatorRequests[_serviceProvider][_delegator] + removeDelegatorEvalDuration,
            "DelegateManager: RemoveDelegator evaluation window expired"
        );

        uint256 unstakeAmount = delegateInfo[_delegator][_serviceProvider];
        // Unstake on behalf of target service provider
        Staking(stakingAddress).undelegateStakeFor(
            _serviceProvider,
            _delegator,
            unstakeAmount
        );
        // Update total delegated for SP
        // totalServiceProviderDelegatedStake - total amount delegated to service provider
        // totalStakedForSpFromDelegator - amount staked from this delegator to targeted service provider
        _updateDelegatorStake(
            _delegator,
            _serviceProvider,
            spDelegateInfo[_serviceProvider].totalDelegatedStake.sub(unstakeAmount),
            delegateInfo[_delegator][_serviceProvider].sub(unstakeAmount),
            delegatorTotalStake[_delegator].sub(unstakeAmount)
        );

        if (
            _undelegateRequestIsPending(_delegator) &&
            undelegateRequests[_delegator].serviceProvider == _serviceProvider
        ) {
            // Remove pending request information
            _updateServiceProviderLockupAmount(
                _serviceProvider,
                spDelegateInfo[_serviceProvider].totalLockedUpStake.sub(undelegateRequests[_delegator].amount)
            );
            _resetUndelegateStakeRequest(_delegator);
        }

        // Remove from list of delegators
        _removeFromDelegatorsList(_serviceProvider, _delegator);

        // Reset lockup expiry
        removeDelegatorRequests[_serviceProvider][_delegator] = 0;
        emit RemoveDelegatorRequestEvaluated(_serviceProvider, _delegator, unstakeAmount);
    }

    /**
     * @notice SP can update their minDelegationAmount
     * @param _serviceProvider - address of service provider
     * @param _spMinDelegationAmount - new minDelegationAmount for SP
     * @notice does not enforce _spMinDelegationAmount >= minDelegationAmount since not necessary
     *      delegateStake() and undelegateStake() always take the max of both already
     */
    function updateSPMinDelegationAmount(
        address _serviceProvider,
        uint256 _spMinDelegationAmount
    ) external {
        _requireIsInitialized();

        require(msg.sender == _serviceProvider, ERROR_ONLY_SP);

        /**
         * Ensure _serviceProvider is a valid SP
         * No objective source of truth, closest heuristic is numEndpoints > 0
         */
        (,,, uint256 numEndpoints,,) = (
            ServiceProviderFactory(serviceProviderFactoryAddress)
            .getServiceProviderDetails(_serviceProvider)
        );
        require(numEndpoints > 0, "DelegateManager: Only callable by valid registered SP");

        spMinDelegationAmounts[_serviceProvider] = _spMinDelegationAmount;

        emit SPMinDelegationAmountUpdated(_serviceProvider, _spMinDelegationAmount);
    }

    /**
     * @notice Update duration for undelegate request lockup
     * @param _duration - new lockup duration
     */
    function updateUndelegateLockupDuration(uint256 _duration) external {
        _requireIsInitialized();

        require(msg.sender == governanceAddress, ERROR_ONLY_GOVERNANCE);

        _updateUndelegateLockupDuration(_duration);
        emit UndelegateLockupDurationUpdated(_duration);
    }

    /**
     * @notice Update maximum delegators allowed
     * @param _maxDelegators - new max delegators
     */
    function updateMaxDelegators(uint256 _maxDelegators) external {
        _requireIsInitialized();

        require(msg.sender == governanceAddress, ERROR_ONLY_GOVERNANCE);

        maxDelegators = _maxDelegators;
        emit MaxDelegatorsUpdated(_maxDelegators);
    }

    /**
     * @notice Update minimum delegation amount
     * @param _minDelegationAmount - min new min delegation amount
     */
    function updateMinDelegationAmount(uint256 _minDelegationAmount) external {
        _requireIsInitialized();

        require(msg.sender == governanceAddress, ERROR_ONLY_GOVERNANCE);

        minDelegationAmount = _minDelegationAmount;
        emit MinDelegationUpdated(_minDelegationAmount);
    }

    /**
     * @notice Update remove delegator lockup duration
     * @param _duration - new lockup duration
     */
    function updateRemoveDelegatorLockupDuration(uint256 _duration) external {
        _requireIsInitialized();

        require(msg.sender == governanceAddress, ERROR_ONLY_GOVERNANCE);

        _updateRemoveDelegatorLockupDuration(_duration);
        emit RemoveDelegatorLockupDurationUpdated(_duration);
    }

    /**
     * @notice Update remove delegator evaluation window duration
     * @param _duration - new window duration
     */
    function updateRemoveDelegatorEvalDuration(uint256 _duration) external {
        _requireIsInitialized();

        require(msg.sender == governanceAddress, ERROR_ONLY_GOVERNANCE);

        removeDelegatorEvalDuration = _duration;
        emit RemoveDelegatorEvalDurationUpdated(_duration);
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
        governanceAddress = _governanceAddress;
        emit GovernanceAddressUpdated(_governanceAddress);
    }

    /**
     * @notice Set the Staking address
     * @dev Only callable by Governance address
     * @param _stakingAddress - address for new Staking contract
     */
    function setStakingAddress(address _stakingAddress) external {
        _requireIsInitialized();

        require(msg.sender == governanceAddress, ERROR_ONLY_GOVERNANCE);
        stakingAddress = _stakingAddress;
        emit StakingAddressUpdated(_stakingAddress);
    }

    /**
     * @notice Set the ServiceProviderFactory address
     * @dev Only callable by Governance address
     * @param _spFactory - address for new ServiceProviderFactory contract
     */
    function setServiceProviderFactoryAddress(address _spFactory) external {
        _requireIsInitialized();

        require(msg.sender == governanceAddress, ERROR_ONLY_GOVERNANCE);
        serviceProviderFactoryAddress = _spFactory;
        emit ServiceProviderFactoryAddressUpdated(_spFactory);
    }

    /**
     * @notice Set the ClaimsManager address
     * @dev Only callable by Governance address
     * @param _claimsManagerAddress - address for new ClaimsManager contract
     */
    function setClaimsManagerAddress(address _claimsManagerAddress) external {
        _requireIsInitialized();

        require(msg.sender == governanceAddress, ERROR_ONLY_GOVERNANCE);
        claimsManagerAddress = _claimsManagerAddress;
        emit ClaimsManagerAddressUpdated(_claimsManagerAddress);
    }

    // ========================================= View Functions =========================================

    /**
     * @notice Get list of delegators for a given service provider
     * @param _sp - service provider address
     */
    function getDelegatorsList(address _sp)
    external view returns (address[] memory)
    {
        _requireIsInitialized();

        return spDelegateInfo[_sp].delegators;
    }

    /**
     * @notice Get total delegation from a given address
     * @param _delegator - delegator address
     */
    function getTotalDelegatorStake(address _delegator)
    external view returns (uint256)
    {
        _requireIsInitialized();

        return delegatorTotalStake[_delegator];
    }

    /// @notice Get total amount delegated to a service provider
    function getTotalDelegatedToServiceProvider(address _sp)
    external view returns (uint256)
    {
        _requireIsInitialized();

        return spDelegateInfo[_sp].totalDelegatedStake;
    }

    /// @notice Get total delegated stake locked up for a service provider
    function getTotalLockedDelegationForServiceProvider(address _sp)
    external view returns (uint256)
    {
        _requireIsInitialized();

        return spDelegateInfo[_sp].totalLockedUpStake;
    }

    /// @notice Get total currently staked for a delegator, for a given service provider
    function getDelegatorStakeForServiceProvider(address _delegator, address _serviceProvider)
    external view returns (uint256)
    {
        _requireIsInitialized();

        return delegateInfo[_delegator][_serviceProvider];
    }

    /**
     * @notice Get status of pending undelegate request for a given address
     * @param _delegator - address of the delegator
     */
    function getPendingUndelegateRequest(address _delegator)
    external view returns (address target, uint256 amount, uint256 lockupExpiryBlock)
    {
        _requireIsInitialized();

        UndelegateStakeRequest memory req = undelegateRequests[_delegator];
        return (req.serviceProvider, req.amount, req.lockupExpiryBlock);
    }

    /**
     * @notice Get status of pending remove delegator request for a given address
     * @param _serviceProvider - address of the service provider
     * @param _delegator - address of the delegator
     * @return - current lockup expiry block for remove delegator request
     */
    function getPendingRemoveDelegatorRequest(
        address _serviceProvider,
        address _delegator
    ) external view returns (uint256)
    {
        _requireIsInitialized();

        return removeDelegatorRequests[_serviceProvider][_delegator];
    }

    /**
     * @notice Get minDelegationAmount for given SP
     * @param _serviceProvider - address of the service provider
     * @return - minDelegationAmount for given SP
     */
    function getSPMinDelegationAmount(address _serviceProvider) external view returns (uint256) {
        return spMinDelegationAmounts[_serviceProvider];
    }

    /// @notice Get current undelegate lockup duration
    function getUndelegateLockupDuration()
    external view returns (uint256)
    {
        _requireIsInitialized();

        return undelegateLockupDuration;
    }

    /// @notice Current maximum delegators
    function getMaxDelegators()
    external view returns (uint256)
    {
        _requireIsInitialized();

        return maxDelegators;
    }

    /// @notice Get minimum delegation amount
    function getMinDelegationAmount()
    external view returns (uint256)
    {
        _requireIsInitialized();

        return minDelegationAmount;
    }

    /// @notice Get the duration for remove delegator request lockup
    function getRemoveDelegatorLockupDuration()
    external view returns (uint256)
    {
        _requireIsInitialized();

        return removeDelegatorLockupDuration;
    }

    /// @notice Get the duration for evaluation of remove delegator operations
    function getRemoveDelegatorEvalDuration()
    external view returns (uint256)
    {
        _requireIsInitialized();

        return removeDelegatorEvalDuration;
    }

    /// @notice Get the Governance address
    function getGovernanceAddress() external view returns (address) {
        _requireIsInitialized();

        return governanceAddress;
    }

    /// @notice Get the ServiceProviderFactory address
    function getServiceProviderFactoryAddress() external view returns (address) {
        _requireIsInitialized();

        return serviceProviderFactoryAddress;
    }

    /// @notice Get the ClaimsManager address
    function getClaimsManagerAddress() external view returns (address) {
        _requireIsInitialized();

        return claimsManagerAddress;
    }

    /// @notice Get the Staking address
    function getStakingAddress() external view returns (address)
    {
        _requireIsInitialized();

        return stakingAddress;
    }

    // ========================================= Internal functions =========================================

    /**
     * @notice Helper function for claimRewards to get balances from Staking contract
               and do validation
     * @param spFactory - reference to ServiceProviderFactory contract
     * @param _serviceProvider - address for which rewards are being claimed
     * @return (totalBalanceInStaking, totalBalanceInSPFactory, totalActiveFunds, spLockedStake, totalRewards, deployerCut)
     */
    function _validateClaimRewards(ServiceProviderFactory spFactory, address _serviceProvider)
    internal returns (
        uint256 totalBalanceInStaking,
        uint256 totalBalanceInSPFactory,
        uint256 totalActiveFunds,
        uint256 totalRewards,
        uint256 deployerCut
    )
    {
        // Account for any pending locked up stake for the service provider
        (uint256 spLockedStake,) = spFactory.getPendingDecreaseStakeRequest(_serviceProvider);
        uint256 totalLockedUpStake = (
            spDelegateInfo[_serviceProvider].totalLockedUpStake.add(spLockedStake)
        );

        // Process claim for msg.sender
        // Total locked parameter is equal to delegate locked up stake + service provider locked up stake
        uint256 mintedRewards = ClaimsManager(claimsManagerAddress).processClaim(
            _serviceProvider,
            totalLockedUpStake
        );

        // Amount stored in staking contract for owner
        totalBalanceInStaking = Staking(stakingAddress).totalStakedFor(_serviceProvider);

        // Amount in sp factory for claimer
        (
            totalBalanceInSPFactory,
            deployerCut,
            ,,,
        ) = spFactory.getServiceProviderDetails(_serviceProvider);
        // Require active stake to claim any rewards

        // Amount in delegate manager staked to service provider
        uint256 totalBalanceOutsideStaking = (
            totalBalanceInSPFactory.add(spDelegateInfo[_serviceProvider].totalDelegatedStake)
        );

        totalActiveFunds = totalBalanceOutsideStaking.sub(totalLockedUpStake);

        require(
            mintedRewards == totalBalanceInStaking.sub(totalBalanceOutsideStaking),
            "DelegateManager: Reward amount mismatch"
        );

        // Emit claim event
        emit Claim(_serviceProvider, totalRewards, totalBalanceInStaking);

        return (
            totalBalanceInStaking,
            totalBalanceInSPFactory,
            totalActiveFunds,
            mintedRewards,
            deployerCut
        );
    }

    /**
     * @notice Perform state updates when a delegate stake has changed
     * @param _delegator - address of delegator
     * @param _serviceProvider - address of service provider
     * @param _totalServiceProviderDelegatedStake - total delegated to this service provider
     * @param _totalStakedForSpFromDelegator - total delegated to this service provider by delegator
     * @param _totalDelegatorStake - total delegated from this delegator address
     */
    function _updateDelegatorStake(
        address _delegator,
        address _serviceProvider,
        uint256 _totalServiceProviderDelegatedStake,
        uint256 _totalStakedForSpFromDelegator,
        uint256 _totalDelegatorStake
    ) internal
    {
        // Update total delegated for SP
        spDelegateInfo[_serviceProvider].totalDelegatedStake = _totalServiceProviderDelegatedStake;

        // Update amount staked from this delegator to targeted service provider
        delegateInfo[_delegator][_serviceProvider] = _totalStakedForSpFromDelegator;

        // Update total delegated from this delegator
        _updateDelegatorTotalStake(_delegator, _totalDelegatorStake);
    }

    /**
     * @notice Reset pending undelegate stake request
     * @param _delegator - address of delegator
     */
    function _resetUndelegateStakeRequest(address _delegator) internal
    {
        _updateUndelegateStakeRequest(_delegator, address(0), 0, 0);
    }

    /**
     * @notice Perform updates when undelegate request state has changed
     * @param _delegator - address of delegator
     * @param _serviceProvider - address of service provider
     * @param _amount - amount being undelegated
     * @param _lockupExpiryBlock - block at which stake can be undelegated
     */
    function _updateUndelegateStakeRequest(
        address _delegator,
        address _serviceProvider,
        uint256 _amount,
        uint256 _lockupExpiryBlock
    ) internal
    {
        // Update lockup information
        undelegateRequests[_delegator] = UndelegateStakeRequest({
            lockupExpiryBlock: _lockupExpiryBlock,
            amount: _amount,
            serviceProvider: _serviceProvider
        });
    }

    /**
     * @notice Update total amount delegated from an address
     * @param _delegator - address of service provider
     * @param _amount - updated delegator total
     */
    function _updateDelegatorTotalStake(address _delegator, uint256 _amount) internal
    {
        delegatorTotalStake[_delegator] = _amount;
    }

    /**
     * @notice Update amount currently locked up for this service provider
     * @param _serviceProvider - address of service provider
     * @param _updatedLockupAmount - updated lock up amount
     */
    function _updateServiceProviderLockupAmount(
        address _serviceProvider,
        uint256 _updatedLockupAmount
    ) internal
    {
        spDelegateInfo[_serviceProvider].totalLockedUpStake = _updatedLockupAmount;
    }

    function _removeFromDelegatorsList(address _serviceProvider, address _delegator) internal
    {
        for (uint256 i = 0; i < spDelegateInfo[_serviceProvider].delegators.length; i++) {
            if (spDelegateInfo[_serviceProvider].delegators[i] == _delegator) {
                // Overwrite and shrink delegators list
                spDelegateInfo[_serviceProvider].delegators[i] = spDelegateInfo[_serviceProvider].delegators[spDelegateInfo[_serviceProvider].delegators.length - 1];
                spDelegateInfo[_serviceProvider].delegators.length--;
                break;
            }
        }
    }

    /**
     * @notice Helper function to distribute rewards to any delegators
     * @param _sp - service provider account tracked in staking
     * @param _totalActiveFunds - total funds minus any locked stake
     * @param _totalRewards - total rewaards generated in this round
     * @param _deployerCut - service provider cut of delegate rewards, defined as deployerCut / deployerCutBase
     * @param _deployerCutBase - denominator value for calculating service provider cut as a %
     * @return (totalBalanceInStaking, totalBalanceInSPFactory, totalBalanceOutsideStaking)
     */
    function _distributeDelegateRewards(
        address _sp,
        uint256 _totalActiveFunds,
        uint256 _totalRewards,
        uint256 _deployerCut,
        uint256 _deployerCutBase
    )
    internal returns (uint256 totalDelegatedStakeIncrease)
    {
        // Traverse all delegates and calculate their rewards
        // As each delegate reward is calculated, increment SP cut reward accordingly
        for (uint256 i = 0; i < spDelegateInfo[_sp].delegators.length; i++) {
            address delegator = spDelegateInfo[_sp].delegators[i];
            uint256 delegateStakeToSP = delegateInfo[delegator][_sp];

            // Subtract any locked up stake
            if (undelegateRequests[delegator].serviceProvider == _sp) {
                delegateStakeToSP = delegateStakeToSP.sub(undelegateRequests[delegator].amount);
            }

            // Calculate rewards by ((delegateStakeToSP / totalActiveFunds) * totalRewards)
            uint256 rewardsPriorToSPCut = (
              delegateStakeToSP.mul(_totalRewards)
            ).div(_totalActiveFunds);

            // Multiply by deployer cut fraction to calculate reward for SP
            // Operation constructed to perform all multiplication prior to division
            // uint256 spDeployerCut = (rewardsPriorToSPCut * deployerCut ) / (deployerCutBase);
            //                    = ((delegateStakeToSP * totalRewards) / totalActiveFunds) * deployerCut ) / (deployerCutBase);
            //                    = ((delegateStakeToSP * totalRewards * deployerCut) / totalActiveFunds ) / (deployerCutBase);
            //                    = (delegateStakeToSP * totalRewards * deployerCut) / (deployerCutBase * totalActiveFunds);
            uint256 spDeployerCut = (
                (delegateStakeToSP.mul(_totalRewards)).mul(_deployerCut)
            ).div(
                _totalActiveFunds.mul(_deployerCutBase)
            );
            // Increase total delegate reward in DelegateManager
            // Subtract SP reward from rewards to calculate delegate reward
            // delegateReward = rewardsPriorToSPCut - spDeployerCut;
            delegateInfo[delegator][_sp] = (
                delegateInfo[delegator][_sp].add(rewardsPriorToSPCut.sub(spDeployerCut))
            );

            // Update total for this delegator
            _updateDelegatorTotalStake(
                delegator,
                delegatorTotalStake[delegator].add(rewardsPriorToSPCut.sub(spDeployerCut))
            );

            totalDelegatedStakeIncrease = (
                totalDelegatedStakeIncrease.add(rewardsPriorToSPCut.sub(spDeployerCut))
            );
        }

        return (totalDelegatedStakeIncrease);
    }

    /**
     * @notice Set the governance address after confirming contract identity
     * @param _governanceAddress - Incoming governance address
     */
    function _updateGovernanceAddress(address _governanceAddress) internal {
        require(
            Governance(_governanceAddress).isGovernanceAddress() == true,
            "DelegateManager: _governanceAddress is not a valid governance contract"
        );
        governanceAddress = _governanceAddress;
    }

    /**
     * @notice Set the remove delegator lockup duration after validating against governance
     * @param _duration - Incoming remove delegator duration value
     */
    function _updateRemoveDelegatorLockupDuration(uint256 _duration) internal {
        Governance governance = Governance(governanceAddress);
        require(
            _duration > governance.getVotingPeriod() + governance.getExecutionDelay(),
            "DelegateManager: removeDelegatorLockupDuration duration must be greater than governance votingPeriod + executionDelay"
        );
        removeDelegatorLockupDuration = _duration;
    }

    /**
     * @notice Set the undelegate lockup duration after validating against governance
     * @param _duration - Incoming undelegate lockup duration value
     */
    function _updateUndelegateLockupDuration(uint256 _duration) internal {
        Governance governance = Governance(governanceAddress);
        require(
            _duration > governance.getVotingPeriod() + governance.getExecutionDelay(),
            "DelegateManager: undelegateLockupDuration duration must be greater than governance votingPeriod + executionDelay"
        );
        undelegateLockupDuration = _duration;
    }

    /**
     * @notice Returns if delegator has delegated to a service provider
     * @param _delegator - address of delegator
     * @param _serviceProvider - address of service provider
     * @return boolean indicating whether delegator exists for service provider
     */
    function _delegatorExistsForSP(
        address _delegator,
        address _serviceProvider
    ) internal view returns (bool)
    {
        for (uint256 i = 0; i < spDelegateInfo[_serviceProvider].delegators.length; i++) {
            if (spDelegateInfo[_serviceProvider].delegators[i] == _delegator) {
                return true;
            }
        }
        // Not found
        return false;
    }

    /**
     * @notice Determine if a claim is pending for this service provider
     * @param _sp - address of service provider
     * @return boolean indicating whether a claim is pending
     */
    function _claimPending(address _sp) internal view returns (bool) {
        ClaimsManager claimsManager = ClaimsManager(claimsManagerAddress);
        return claimsManager.claimPending(_sp);
    }

    /**
     * @notice Determine if a decrease request has been initiated
     * @param _delegator - address of delegator
     * @return boolean indicating whether a decrease request is pending
     */
    function _undelegateRequestIsPending(address _delegator) internal view returns (bool)
    {
        return (
            (undelegateRequests[_delegator].lockupExpiryBlock != 0) &&
            (undelegateRequests[_delegator].amount != 0) &&
            (undelegateRequests[_delegator].serviceProvider != address(0))
        );
    }

    // ========================================= Private Functions =========================================

    function _requireStakingAddressIsSet() private view {
        require(
            stakingAddress != address(0x00),
            "DelegateManager: stakingAddress is not set"
        );
    }

    function _requireServiceProviderFactoryAddressIsSet() private view {
        require(
            serviceProviderFactoryAddress != address(0x00),
            "DelegateManager: serviceProviderFactoryAddress is not set"
        );
    }

    function _requireClaimsManagerAddressIsSet() private view {
        require(
            claimsManagerAddress != address(0x00),
            "DelegateManager: claimsManagerAddress is not set"
        );
    }
}
