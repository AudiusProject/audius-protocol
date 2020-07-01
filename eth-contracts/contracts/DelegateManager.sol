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
contract DelegateManager is InitializableV2 {
    using SafeMath for uint256;

    address private governanceAddress;
    address private stakingAddress;
    address private serviceProviderFactoryAddress;
    address private claimsManagerAddress;

    /**
     * Number of blocks an undelegate operation has to wait
     * @notice must be >= Governance.votingPeriod
     */
    uint private undelegateLockupDuration;

    // Maximum number of delegators a single account can handle
    uint private maxDelegators;

    // Minimum amount of delegation allowed
    uint minDelegationAmount;

    // Staking contract ref
    ERC20Mintable internal audiusToken;

    // Struct representing total delegated to SP and list of delegators
    struct ServiceProviderDelegateInfo {
        uint totalDelegatedStake;
        uint totalLockedUpStake;
        address[] delegators;
    }

    // Data structures for lockup during withdrawal
    struct UndelegateStakeRequest {
        address serviceProvider;
        uint amount;
        uint lockupExpiryBlock;
    }

    // Service provider address -> ServiceProviderDelegateInfo
    mapping (address => ServiceProviderDelegateInfo) spDelegateInfo;

    // Delegator stake by address delegated to
    // delegator -> (service provider -> delegatedStake)
    mapping (address => mapping(address => uint)) delegateInfo;

    // Requester to pending undelegate request
    mapping (address => UndelegateStakeRequest) undelegateRequests;

    event IncreaseDelegatedStake(
      address _delegator,
      address _serviceProvider,
      uint _increaseAmount
    );

    event DecreaseDelegatedStake(
      address _delegator,
      address _serviceProvider,
      uint _decreaseAmount
    );

    event Claim(
      address _claimer,
      uint _rewards,
      uint newTotal
    );

    event Slash(
      address _target,
      uint _amount,
      uint _newTotal
    );

    event MaxDelegatorsUpdated(uint indexed _maxDelegators);
    event MinDelegationUpdated(uint indexed _minDelegationAmount);
    event UndelegateLockupDurationUpdated(uint indexed _undelegateLockupDuration);
    event GovernanceAddressUpdated(address indexed _newGovernanceAddress);
    event StakingAddressUpdated(address indexed _newStakingAddress);
    event ServiceProviderFactoryAddressUpdated(address indexed _newServiceProviderFactoryAddress);
    event ClaimsManagerAddressUpdated(address indexed _newClaimsManagerAddress);

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
        address _governanceAddress
    ) public initializer
    {
        _updateGovernanceAddress(_governanceAddress);
        audiusToken = ERC20Mintable(_tokenAddress);
        undelegateLockupDuration = 10;
        maxDelegators = 175;
        // Default minimum delegation amount set to 100AUD
        minDelegationAmount = 100 * 10**uint256(18);
        InitializableV2.initialize();
    }

    /**
     * @notice Allow a delegator to delegate stake to a service provider
     * @param _targetSP - address of service provider to delegate to
     * @param _amount - amount in wei to delegate
     * @return Updated total amount delegated to the service provider by delegator
     */
    function delegateStake(
        address _targetSP,
        uint _amount
    ) external returns (uint delegatedAmount)
    {
        _requireIsInitialized();
        _requireStakingAddressIsSet();
        _requireServiceProviderFactoryAddressIsSet();
        _requireClaimsManagerAddressIsSet();

        require(
            !_claimPending(_targetSP),
            "Delegation not permitted for SP pending claim"
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
                "Maximum delegators exceeded"
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
            delegateInfo[delegator][_targetSP].add(_amount)
        );

        require(
            delegateInfo[delegator][_targetSP] >= minDelegationAmount,
            "Minimum delegation amount"
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
        uint _amount
    ) external returns (uint newDelegateAmount)
    {
        _requireIsInitialized();
        _requireClaimsManagerAddressIsSet();

        require(
            _amount > 0,
            "Requested undelegate stake amount must be greater than zero"
        );
        require(
            !_claimPending(_target),
            "Undelegate request not permitted for SP pending claim"
        );
        address delegator = msg.sender;
        require(_delegatorExistsForSP(delegator, _target), "Delegator must be staked for SP");

        // Confirm no pending delegation request
        require(!_undelegateRequestIsPending(delegator), "No pending lockup expected");

        // Ensure valid bounds
        uint currentlyDelegatedToSP = delegateInfo[delegator][_target];
        require(
            _amount <= currentlyDelegatedToSP,
            "Cannot decrease greater than currently staked for this ServiceProvider");

        // Submit updated request for sender, with target sp, undelegate amount, target expiry block
        _updateUndelegateStakeRequest(
            delegator,
            _target,
            _amount,
            block.number.add(undelegateLockupDuration)
        );
        // Update total locked for this service provider, increasing by unstake amount
        _updateServiceProviderLockupAmount(
            _target,
            spDelegateInfo[_target].totalLockedUpStake.add(_amount)
        );

        return delegateInfo[delegator][_target].sub(_amount);
    }

    /**
     * @notice Cancel undelegation request
     */
    function cancelUndelegateStake() external {
        _requireIsInitialized();

        address delegator = msg.sender;
        // Confirm pending delegation request
        require(_undelegateRequestIsPending(delegator), "Pending lockup expected");
        uint unstakeAmount = undelegateRequests[delegator].amount;
        address unlockFundsSP = undelegateRequests[delegator].serviceProvider;
        // Update total locked for this service provider, decreasing by unstake amount
        _updateServiceProviderLockupAmount(
            unlockFundsSP,
            spDelegateInfo[unlockFundsSP].totalLockedUpStake.sub(unstakeAmount)
        );
        // Remove pending request
        _resetUndelegateStakeRequest(delegator);
    }

    /**
     * @notice Finalize undelegation request and withdraw stake
     * @return New total amount currently staked after stake has been undelegated
     */
    function undelegateStake() external returns (uint newTotal) {
        _requireIsInitialized();
        _requireStakingAddressIsSet();
        _requireServiceProviderFactoryAddressIsSet();
        _requireClaimsManagerAddressIsSet();

        address delegator = msg.sender;

        // Confirm pending delegation request
        require(_undelegateRequestIsPending(delegator), "Pending lockup expected");

        // Confirm lockup expiry has expired
        require(
            undelegateRequests[delegator].lockupExpiryBlock <= block.number, "Lockup must be expired");

        // Confirm no pending claim for this service provider
        require(
            !_claimPending(undelegateRequests[delegator].serviceProvider),
            "Undelegate not permitted for SP pending claim"
        );

        address serviceProvider = undelegateRequests[delegator].serviceProvider;
        uint unstakeAmount = undelegateRequests[delegator].amount;

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
            delegateInfo[delegator][serviceProvider].sub(unstakeAmount)
        );

        require(
            (delegateInfo[delegator][serviceProvider] >= minDelegationAmount ||
             delegateInfo[delegator][serviceProvider] == 0),
            "Minimum delegation amount"
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

        // Validate balance
        ServiceProviderFactory(
            serviceProviderFactoryAddress
        ).validateAccountStakeBalance(serviceProvider);

        emit DecreaseDelegatedStake(
            delegator,
            serviceProvider,
            unstakeAmount);

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

        (
            uint totalBalanceInStaking,
            uint totalBalanceInSPFactory,
            uint totalActiveFunds,
            uint spLockedStake,
            uint totalRewards
        ) = _validateClaimRewards(spFactory, _serviceProvider);

        // No-op if balance is already equivalent
        // This case can occur if no rewards due to bound violation or all stake is locked
        if (totalRewards == 0) {
            return;
        }

        // Total rewards
        // Equal to (balance in staking) - ((balance in sp factory) + (balance in delegate manager))

        // Emit claim event
        emit Claim(_serviceProvider, totalRewards, totalBalanceInStaking);

        ( ,uint deployerCut, , , , ) = spFactory.getServiceProviderDetails(_serviceProvider);
        uint deployerCutBase = spFactory.getServiceProviderDeployerCutBase();

        (
            uint totalDelegatedStakeIncrease,
            uint spDeployerCutRewards
        ) = _distributeDelegateRewards(
            _serviceProvider,
            totalActiveFunds,
            totalRewards,
            deployerCut,
            deployerCutBase
        );

        // Update total delegated to this SP
        spDelegateInfo[_serviceProvider].totalDelegatedStake = (
            spDelegateInfo[_serviceProvider].totalDelegatedStake.add(totalDelegatedStakeIncrease)
        );

        // Rewards directly allocated to service provider for their stake
        // Total active funds for direct deployer reward share
        /// totalActiveDeployerFunds = totalBalanceInSPFactory.sub(spLockedStake);
        uint spRewardShare = (
            (totalBalanceInSPFactory.sub(spLockedStake)).mul(totalRewards)
        ).div(totalActiveFunds);

        spFactory.updateServiceProviderStake(
            _serviceProvider,
            /// newSpBalance = totalBalanceInSPFactory + spRewardShare + spDeployerCutRewards;
            totalBalanceInSPFactory.add(spRewardShare.add(spDeployerCutRewards))
        );
    }

    /**
     * @notice Reduce current stake amount
     * @dev Only callable by governance. Slashes service provider and delegators equally
     * @param _amount - amount in wei to slash
     * @param _slashAddress - address of service provider to slash
     */
    function slash(uint _amount, address _slashAddress)
    external
    {
        _requireIsInitialized();
        _requireStakingAddressIsSet();
        _requireServiceProviderFactoryAddressIsSet();

        require(
            msg.sender == governanceAddress,
            "Only callable by Governance contract"
        );

        Staking stakingContract = Staking(stakingAddress);
        ServiceProviderFactory spFactory = ServiceProviderFactory(serviceProviderFactoryAddress);

        // Amount stored in staking contract for owner
        uint totalBalanceInStakingPreSlash = stakingContract.totalStakedFor(_slashAddress);
        require(
            (totalBalanceInStakingPreSlash >= _amount),
            "Cannot slash more than total currently staked");

        // Cancel any withdrawal request for this service provider
        (uint spLockedStake,) = spFactory.getPendingDecreaseStakeRequest(_slashAddress);
        if (spLockedStake > 0) {
            spFactory.cancelDecreaseStakeRequest(_slashAddress);
        }

        // Amount in sp factory for slash target
        (uint totalBalanceInSPFactory,,,,,) = spFactory.getServiceProviderDetails(_slashAddress);
        require(totalBalanceInSPFactory > 0, "Service Provider stake required");

        // Decrease value in Staking contract
        // A value of zero slash will fail in staking, reverting this transaction
        stakingContract.slash(_amount, _slashAddress);
        uint totalBalanceInStakingAfterSlash = stakingContract.totalStakedFor(_slashAddress);

        // Emit slash event
        emit Slash(_slashAddress, _amount, totalBalanceInStakingAfterSlash);

        uint totalDelegatedStakeDecrease = 0;
        // For each delegator and deployer, recalculate new value
        // newStakeAmount = newStakeAmount * (oldStakeAmount / totalBalancePreSlash)
        for (uint i = 0; i < spDelegateInfo[_slashAddress].delegators.length; i++) {
            address delegator = spDelegateInfo[_slashAddress].delegators[i];
            uint preSlashDelegateStake = delegateInfo[delegator][_slashAddress];
            uint newDelegateStake = (
             totalBalanceInStakingAfterSlash.mul(preSlashDelegateStake)
            ).div(totalBalanceInStakingPreSlash);
            // uint slashAmountForDelegator = preSlashDelegateStake.sub(newDelegateStake);
            delegateInfo[delegator][_slashAddress] = (
                delegateInfo[delegator][_slashAddress].sub(preSlashDelegateStake.sub(newDelegateStake))
            );
            // Update total decrease amount
            totalDelegatedStakeDecrease = (
                totalDelegatedStakeDecrease.add(preSlashDelegateStake.sub(newDelegateStake))
            );
            // Check for any locked up funds for this slashed delegator
            // Slash overrides any pending withdrawal requests
            if (undelegateRequests[delegator].amount != 0) {
                address unstakeSP = undelegateRequests[delegator].serviceProvider;
                uint unstakeAmount = undelegateRequests[delegator].amount;
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

        // Recalculate SP direct stake
        uint newSpBalance = (
          totalBalanceInStakingAfterSlash.mul(totalBalanceInSPFactory)
        ).div(totalBalanceInStakingPreSlash);
        spFactory.updateServiceProviderStake(_slashAddress, newSpBalance);
    }

    /**
     * @notice Allow a service provider to forcibly remove a delegator
     * @param _serviceProvider - address of service provider
     * @param _delegator - address of delegator
     * @return Updated total amount delegated to the service provider by delegator
     */
    function removeDelegator(address _serviceProvider, address _delegator) external {
        _requireIsInitialized();
        _requireStakingAddressIsSet();

        require(
            msg.sender == _serviceProvider || msg.sender == governanceAddress,
            "Only callable by target SP or governance"
        );
        uint unstakeAmount = delegateInfo[_delegator][_serviceProvider];
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
            delegateInfo[_delegator][_serviceProvider].sub(unstakeAmount)
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
    }

    /**
     * @notice Update duration for undelegate request lockup
     * @param _duration - new lockup duration
     */
    function updateUndelegateLockupDuration(uint _duration) external {
        _requireIsInitialized();

        require(
            msg.sender == governanceAddress,
            "Only callable by Governance contract"
        );

        undelegateLockupDuration = _duration;
        emit UndelegateLockupDurationUpdated(_duration);
    }

    /**
     * @notice Update maximum delegators allowed
     * @param _maxDelegators - new max delegators
     */
    function updateMaxDelegators(uint _maxDelegators) external {
        _requireIsInitialized();

        require(
            msg.sender == governanceAddress,
            "Only callable by Governance contract"
        );

        maxDelegators = _maxDelegators;
        emit MaxDelegatorsUpdated(_maxDelegators);
    }

    /**
     * @notice Update minimum delegation amount
     * @param _minDelegationAmount - min new min delegation amount
     */
    function updateMinDelegationAmount(uint _minDelegationAmount) external {
        _requireIsInitialized();

        require(
            msg.sender == governanceAddress,
            "Only callable by Governance contract"
        );

        minDelegationAmount = _minDelegationAmount;
        emit MinDelegationUpdated(_minDelegationAmount);
    }

    /**
     * @notice Set the Governance address
     * @dev Only callable by Governance address
     * @param _governanceAddress - address for new Governance contract
     */
    function setGovernanceAddress(address _governanceAddress) external {
        _requireIsInitialized();

        require(msg.sender == governanceAddress, "Only governance");
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

        require(msg.sender == governanceAddress, "Only governance");
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

        require(msg.sender == governanceAddress, "Only governance");
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

        require(msg.sender == governanceAddress, "Only governance");
        claimsManagerAddress = _claimsManagerAddress;
        emit ClaimsManagerAddressUpdated(_claimsManagerAddress);
    }

    // ========================================= View Functions =========================================

    /**
     * @notice Get list of delegators for a given service provider
     * @param _sp - service provider address
     */
    function getDelegatorsList(address _sp)
    external view returns (address[] memory dels)
    {
        _requireIsInitialized();

        return spDelegateInfo[_sp].delegators;
    }

    /// @notice Get total amount delegated to a service provider
    function getTotalDelegatedToServiceProvider(address _sp)
    external view returns (uint total)
    {
        _requireIsInitialized();

        return spDelegateInfo[_sp].totalDelegatedStake;
    }

    /// @notice Get total delegated stake locked up for a service provider
    function getTotalLockedDelegationForServiceProvider(address _sp)
    external view returns (uint total)
    {
        _requireIsInitialized();

        return spDelegateInfo[_sp].totalLockedUpStake;
    }

    /// @notice Get total currently staked for a delegator, for a given service provider
    function getDelegatorStakeForServiceProvider(address _delegator, address _serviceProvider)
    external view returns (uint amount)
    {
        _requireIsInitialized();

        return delegateInfo[_delegator][_serviceProvider];
    }

    /**
     * @notice Get status of pending undelegate request for a given address
     * @param _delegator - address of the delegator
     */
    function getPendingUndelegateRequest(address _delegator)
    external view returns (address target, uint amount, uint lockupExpiryBlock)
    {
        _requireIsInitialized();

        UndelegateStakeRequest memory req = undelegateRequests[_delegator];
        return (req.serviceProvider, req.amount, req.lockupExpiryBlock);
    }

    /// @notice Get current undelegate lockup duration
    function getUndelegateLockupDuration()
    external view returns (uint duration)
    {
        _requireIsInitialized();

        return undelegateLockupDuration;
    }

    /// @notice Current maximum delegators
    function getMaxDelegators()
    external view returns (uint numDelegators)
    {
        _requireIsInitialized();

        return maxDelegators;
    }

    /// @notice Get minimum delegation amount
    function getMinDelegationAmount()
    external view returns (uint minDelegation)
    {
        _requireIsInitialized();

        return minDelegationAmount;
    }

    /// @notice Get the Governance address
    function getGovernanceAddress() external view returns (address addr) {
        _requireIsInitialized();

        return governanceAddress;
    }

    /// @notice Get the ServiceProviderFactory address
    function getServiceProviderFactoryAddress() external view returns (address addr) {
        _requireIsInitialized();

        return serviceProviderFactoryAddress;
    }

    /// @notice Get the ClaimsManager address
    function getClaimsManagerAddress() external view returns (address addr) {
        _requireIsInitialized();

        return claimsManagerAddress;
    }

    /// @notice Get the Staking address
    function getStakingAddress() external view returns (address addr)
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
     * @return (totalBalanceInStaking, totalBalanceInSPFactory, totalActiveFunds, spLockedStake, totalRewards)
     */
    function _validateClaimRewards(ServiceProviderFactory spFactory, address _serviceProvider)
    internal returns (
        uint totalBalanceInStaking,
        uint totalBalanceInSPFactory,
        uint totalActiveFunds,
        uint spLockedStake,
        uint totalRewards
    )
    {
        // Account for any pending locked up stake for the service provider
        (spLockedStake,) = spFactory.getPendingDecreaseStakeRequest(_serviceProvider);
        uint totalLockedUpStake = (
            spDelegateInfo[_serviceProvider].totalLockedUpStake.add(spLockedStake)
        );

        // Process claim for msg.sender
        // Total locked parameter is equal to delegate locked up stake + service provider locked up stake
        uint mintedRewards = ClaimsManager(claimsManagerAddress).processClaim(
            _serviceProvider,
            totalLockedUpStake
        );

        // Amount stored in staking contract for owner
        totalBalanceInStaking = Staking(stakingAddress).totalStakedFor(_serviceProvider);
        require(totalBalanceInStaking > 0, "Stake required for claim");

        // Amount in sp factory for claimer
        (totalBalanceInSPFactory,,,,,) = spFactory.getServiceProviderDetails(_serviceProvider);
        // Require active stake to claim any rewards
        require(totalBalanceInSPFactory.sub(spLockedStake) > 0, "Service Provider stake required");

        // Amount in delegate manager staked to service provider
        uint totalBalanceOutsideStaking = (
            totalBalanceInSPFactory.add(spDelegateInfo[_serviceProvider].totalDelegatedStake)
        );

        totalActiveFunds = totalBalanceOutsideStaking.sub(totalLockedUpStake);

        require(
            mintedRewards == totalBalanceInStaking.sub(totalBalanceOutsideStaking),
            "Reward amount mismatch"
        );

        return (
            totalBalanceInStaking,
            totalBalanceInSPFactory,
            totalActiveFunds,
            spLockedStake,
            mintedRewards
        );
    }

    /**
     * @notice Perform state updates when a delegate stake has changed
     * @param _delegator - address of delegator
     * @param _serviceProvider - address of service provider
     * @param _totalServiceProviderDelegatedStake - total delegated to this service provider
     * @param _totalStakedForSpFromDelegator - total delegated to this service provider by delegator
     */
    function _updateDelegatorStake(
        address _delegator,
        address _serviceProvider,
        uint _totalServiceProviderDelegatedStake,
        uint _totalStakedForSpFromDelegator
    ) internal
    {
        // Update total delegated for SP
        spDelegateInfo[_serviceProvider].totalDelegatedStake = _totalServiceProviderDelegatedStake;

        // Update amount staked from this delegator to targeted service provider
        delegateInfo[_delegator][_serviceProvider] = _totalStakedForSpFromDelegator;
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
        uint _amount,
        uint _lockupExpiryBlock
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
     * @notice Update amount currently locked up for this service provider
     * @param _serviceProvider - address of service provider
     * @param _updatedLockupAmount - updated lock up amount
     */
    function _updateServiceProviderLockupAmount(
        address _serviceProvider,
        uint _updatedLockupAmount
    ) internal
    {
        spDelegateInfo[_serviceProvider].totalLockedUpStake = _updatedLockupAmount;
    }

    function _removeFromDelegatorsList(address _serviceProvider, address _delegator) internal
    {
        for (uint i = 0; i < spDelegateInfo[_serviceProvider].delegators.length; i++) {
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
        uint _totalActiveFunds,
        uint _totalRewards,
        uint _deployerCut,
        uint _deployerCutBase
    )
    internal returns (uint totalDelegatedStakeIncrease, uint spDeployerCutRewards)
    {
        // Traverse all delegates and calculate their rewards
        // As each delegate reward is calculated, increment SP cut reward accordingly
        for (uint i = 0; i < spDelegateInfo[_sp].delegators.length; i++) {
            address delegator = spDelegateInfo[_sp].delegators[i];
            uint delegateStakeToSP = delegateInfo[delegator][_sp];

            // Subtract any locked up stake
            if (undelegateRequests[delegator].serviceProvider == _sp) {
                delegateStakeToSP = delegateStakeToSP.sub(undelegateRequests[delegator].amount);
            }

            // Calculate rewards by ((delegateStakeToSP / totalActiveFunds) * totalRewards)
            uint rewardsPriorToSPCut = (
              delegateStakeToSP.mul(_totalRewards)
            ).div(_totalActiveFunds);

            // Multiply by deployer cut fraction to calculate reward for SP
            // Operation constructed to perform all multiplication prior to division
            // uint spDeployerCut = (rewardsPriorToSPCut * deployerCut ) / (deployerCutBase);
            //                    = ((delegateStakeToSP * totalRewards) / totalActiveFunds) * deployerCut ) / (deployerCutBase);
            //                    = ((delegateStakeToSP * totalRewards * deployerCut) / totalActiveFunds ) / (deployerCutBase);
            //                    = (delegateStakeToSP * totalRewards * deployerCut) / (deployerCutBase * totalActiveFunds);
            uint spDeployerCut = (
                (delegateStakeToSP.mul(_totalRewards)).mul(_deployerCut)
            ).div(
                _totalActiveFunds.mul(_deployerCutBase)
            );
            spDeployerCutRewards = spDeployerCutRewards.add(spDeployerCut);
            // Increase total delegate reward in DelegateManager
            // Subtract SP reward from rewards to calculate delegate reward
            // delegateReward = rewardsPriorToSPCut - spDeployerCut;
            delegateInfo[delegator][_sp] = (
                delegateInfo[delegator][_sp].add(rewardsPriorToSPCut.sub(spDeployerCut))
            );
            totalDelegatedStakeIncrease = (
                totalDelegatedStakeIncrease.add(rewardsPriorToSPCut.sub(spDeployerCut))
            );
        }

        return (totalDelegatedStakeIncrease, spDeployerCutRewards);
    }

    /**
     * @notice Set the governance address after confirming contract identity
     * @param _governanceAddress - Incoming governance address
     */
    function _updateGovernanceAddress(address _governanceAddress) internal {
        require(
            Governance(_governanceAddress).isGovernanceAddress() == true,
            "_governanceAddress is not a valid governance contract"
        );
        governanceAddress = _governanceAddress;
    }

    /**
     * @notice Returns if delegator has delegated to a service provider
     * @param _delegator - address of delegator
     * @param _serviceProvider - address of service provider
     */
    function _delegatorExistsForSP(
        address _delegator,
        address _serviceProvider
    ) internal view returns (bool exists)
    {
        for (uint i = 0; i < spDelegateInfo[_serviceProvider].delegators.length; i++) {
            if (spDelegateInfo[_serviceProvider].delegators[i] == _delegator) {
                return true;
            }
        }
        // Not found
        return false;
    }

    /**
     * @notice Boolean indicating whether a claim is pending for this service provider
     * @param _sp - address of service provider
     */
    function _claimPending(address _sp) internal view returns (bool pending) {
        ClaimsManager claimsManager = ClaimsManager(claimsManagerAddress);
        return claimsManager.claimPending(_sp);
    }

    /**
     * @notice Boolean indicating whether a decrease request has been initiated
     * @param _delegator - address of delegator
     */
    function _undelegateRequestIsPending(address _delegator) internal view returns (bool pending)
    {
        return (
            (undelegateRequests[_delegator].lockupExpiryBlock != 0) &&
            (undelegateRequests[_delegator].amount != 0) &&
            (undelegateRequests[_delegator].serviceProvider != address(0))
        );
    }

    // ========================================= Private Functions =========================================

    function _requireStakingAddressIsSet() private view {
        require(stakingAddress != address(0x00), "stakingAddress is not set");
    }

    function _requireServiceProviderFactoryAddressIsSet() private view {
        require(
            serviceProviderFactoryAddress != address(0x00),
            "serviceProviderFactoryAddress is not set"
        );
    }

    function _requireClaimsManagerAddressIsSet() private view {
        require(claimsManagerAddress != address(0x00), "claimsManagerAddress is not set");
    }
}
