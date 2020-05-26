pragma solidity ^0.5.0;

import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20Mintable.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20.sol";
/// @notice SafeMath imported via ServiceProviderFactory.sol

import "./Staking.sol";
import "./ServiceProviderFactory.sol";
import "./ClaimsManager.sol";


/**
 * Designed to manage delegation to staking contract
 */
contract DelegateManager is InitializableV2 {
    using SafeMath for uint256;

    address private tokenAddress;
    address private governanceAddress;
    address private stakingAddress;
    address private serviceProviderFactoryAddress;
    address private claimsManagerAddress;

    /**
     * Number of blocks an undelegate operation has to wait
     * TODO: Move this value to Staking.sol as SPFactory may need as well
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
    // TODO: Bound list
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

    // Total staked for a given delegator
    mapping (address => uint) delegatorStakeTotal;

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

    /**
     * @notice Function to initialize the contract
     * @param _tokenAddress - address of ERC20 token that will be claimed
     * @param _governanceAddress - Governance proxy address
     */
    function initialize (
        address _tokenAddress,
        address _governanceAddress
    ) public initializer
    {
        tokenAddress = _tokenAddress;
        governanceAddress = _governanceAddress;
        audiusToken = ERC20Mintable(tokenAddress);
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

        // Update total delegated for SP
        spDelegateInfo[_targetSP].totalDelegatedStake = (
            spDelegateInfo[_targetSP].totalDelegatedStake.add(_amount)
        );

        // Update amount staked from this delegator to targeted service provider
        delegateInfo[delegator][_targetSP] = delegateInfo[delegator][_targetSP].add(_amount);

        // Update total delegated stake
        delegatorStakeTotal[delegator] = delegatorStakeTotal[delegator].add(_amount);

        require(
            delegatorStakeTotal[delegator] >= minDelegationAmount,
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

        undelegateRequests[delegator] = UndelegateStakeRequest({
            lockupExpiryBlock: block.number.add(undelegateLockupDuration),
            amount: _amount,
            serviceProvider: _target
        });

        // Update total locked for this service provider
        spDelegateInfo[_target].totalLockedUpStake = (
            spDelegateInfo[_target].totalLockedUpStake.add(_amount)
        );

        return delegatorStakeTotal[delegator].sub(_amount);
    }

    /**
     * @notice Cancel undelegation request
     */
    function cancelUndelegateStake() external {
        _requireIsInitialized();
        address delegator = msg.sender;
        // Confirm pending delegation request
        require(_undelegateRequestIsPending(delegator), "Pending lockup expected");
        // Remove pending request
        undelegateRequests[delegator] = UndelegateStakeRequest({
            lockupExpiryBlock: 0,
            amount: 0,
            serviceProvider: address(0)
        });
    }

    /**
     * @notice Finalize undelegation request and withdraw stake
     * @return New total amount currently staked after stake has been undelegated
     */
    function undelegateStake() external returns (uint newTotal) {
        _requireIsInitialized();
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

        // Stake on behalf of target service provider
        Staking(stakingAddress).undelegateStakeFor(
            serviceProvider,
            delegator,
            unstakeAmount
        );

        // Update amount staked from this delegator to targeted service provider
        delegateInfo[delegator][serviceProvider] = (
            delegateInfo[delegator][serviceProvider].sub(unstakeAmount)
        );

        // Update total delegated stake
        delegatorStakeTotal[delegator] = delegatorStakeTotal[delegator].sub(unstakeAmount);
        require(
            (delegatorStakeTotal[delegator] >= minDelegationAmount ||
             delegatorStakeTotal[delegator] == 0),
            "Minimum delegation amount"
        );

        // Update total delegated for SP
        spDelegateInfo[serviceProvider].totalDelegatedStake = (
            spDelegateInfo[serviceProvider].totalDelegatedStake.sub(unstakeAmount)
        );

        // Remove from delegators list if no delegated stake remaining
        if (delegateInfo[delegator][serviceProvider] == 0) {
            for (uint i = 0; i < spDelegateInfo[serviceProvider].delegators.length; i++) {
                if (spDelegateInfo[serviceProvider].delegators[i] == delegator) {
                    // Overwrite and shrink delegators list
                    spDelegateInfo[serviceProvider].delegators[i] = spDelegateInfo[serviceProvider].delegators[spDelegateInfo[serviceProvider].delegators.length - 1];
                    spDelegateInfo[serviceProvider].delegators.length--;
                    break;
                }
            }
        }

        // Update total locked for this service provider
        spDelegateInfo[serviceProvider].totalLockedUpStake = (
            spDelegateInfo[serviceProvider].totalLockedUpStake.sub(unstakeAmount)
        );

        // Reset lockup information
        undelegateRequests[delegator] = UndelegateStakeRequest({
            lockupExpiryBlock: 0,
            amount: 0,
            serviceProvider: address(0)
        });

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
     * @dev Only callable by service provider. msg.sender is passed into processClaim
     * @dev Also factors in service provider rewards from delegator and transfers deployer cut
     */
    function claimRewards() external {
        _requireIsInitialized();
        require(
            serviceProviderFactoryAddress != address(0x00),
            "serviceProviderFactoryAddress not set"
        );
        require(claimsManagerAddress != address(0x00), "claimsManagerAddress not set");
        require(stakingAddress != address(0x00), "stakingAddress not set");

        ServiceProviderFactory spFactory = ServiceProviderFactory(serviceProviderFactoryAddress);

        (
            uint totalBalanceInStaking,
            uint totalBalanceInSPFactory,
            uint totalBalanceOutsideStaking
        ) = _validateClaimRewards(spFactory);

        // No-op if balance is already equivalent
        // This case can occur if no rewards due to bound violation or all stake is locked
        if (totalBalanceInStaking == totalBalanceOutsideStaking) {
            return;
        }

        // Total rewards
        // Equal to (balance in staking) - ((balance in sp factory) + (balance in delegate manager))
        uint totalRewards = totalBalanceInStaking.sub(totalBalanceOutsideStaking);

        // Emit claim event
        emit Claim(msg.sender, totalRewards, totalBalanceInStaking);

        ( ,uint deployerCut, , , , ) = spFactory.getServiceProviderDetails(msg.sender);
        uint deployerCutBase = spFactory.getServiceProviderDeployerCutBase();
        uint spDeployerCutRewards = 0;
        uint totalDelegatedStakeIncrease = 0;

        // Total valid funds used to calculate rewards distribution
        uint totalActiveFunds = (
            totalBalanceOutsideStaking.sub(spDelegateInfo[msg.sender].totalLockedUpStake)
        );

        // Traverse all delegates and calculate their rewards
        // As each delegate reward is calculated, increment SP cut reward accordingly
        for (uint i = 0; i < spDelegateInfo[msg.sender].delegators.length; i++) {
            address delegator = spDelegateInfo[msg.sender].delegators[i];
            uint delegateStakeToSP = delegateInfo[delegator][msg.sender];

            // Subtract any locked up stake
            if (undelegateRequests[delegator].serviceProvider == msg.sender) {
                delegateStakeToSP = delegateStakeToSP.sub(undelegateRequests[delegator].amount);
            }

            // Calculate rewards by ((delegateStakeToSP / totalActiveFunds) * totalRewards)
            uint rewardsPriorToSPCut = (
              delegateStakeToSP.mul(totalRewards)
            ).div(totalActiveFunds);

            // Multiply by deployer cut fraction to calculate reward for SP
            // Operation constructed to perform all multiplication prior to division
            // uint spDeployerCut = (rewardsPriorToSPCut * deployerCut ) / (deployerCutBase);
            //                    = ((delegateStakeToSP * totalRewards) / totalActiveFunds) * deployerCut ) / (deployerCutBase);
            //                    = ((delegateStakeToSP * totalRewards * deployerCut) / totalActiveFunds ) / (deployerCutBase);
            //                    = (delegateStakeToSP * totalRewards * deployerCut) / (deployerCutBase * totalActiveFunds);
            uint spDeployerCut = (
                (delegateStakeToSP.mul(totalRewards)).mul(deployerCut)
            ).div(
                totalActiveFunds.mul(deployerCutBase)
            );
            spDeployerCutRewards = spDeployerCutRewards.add(spDeployerCut);
            // Increase total delegate reward in DelegateManager
            // Subtract SP reward from rewards to calculate delegate reward
            // delegateReward = rewardsPriorToSPCut - spDeployerCut;
            delegateInfo[delegator][msg.sender] = (
                delegateInfo[delegator][msg.sender].add(rewardsPriorToSPCut.sub(spDeployerCut))
            );
            delegatorStakeTotal[delegator] = (
                delegatorStakeTotal[delegator].add(rewardsPriorToSPCut.sub(spDeployerCut))
            );
            totalDelegatedStakeIncrease = (
                totalDelegatedStakeIncrease.add(rewardsPriorToSPCut.sub(spDeployerCut))
            );
        }

        // Update total delegated to this SP
        spDelegateInfo[msg.sender].totalDelegatedStake = (
            spDelegateInfo[msg.sender].totalDelegatedStake.add(totalDelegatedStakeIncrease)
        );

        // Rewards directly allocated to service provider for their stake
        uint spRewardShare = (
          totalBalanceInSPFactory.mul(totalRewards)
        ).div(totalActiveFunds);

        spFactory.updateServiceProviderStake(
            msg.sender,
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
            delegatorStakeTotal[delegator] = (
                delegatorStakeTotal[delegator].sub(preSlashDelegateStake.sub(newDelegateStake))
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
                // Reset total locked up stake
                spDelegateInfo[unstakeSP].totalLockedUpStake = (
                    spDelegateInfo[unstakeSP].totalLockedUpStake.sub(unstakeAmount)
                );
                // Remove pending request
                undelegateRequests[delegator] = UndelegateStakeRequest({
                    lockupExpiryBlock: 0,
                    amount: 0,
                    serviceProvider: address(0)
                });
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
    }

    /**
     * @notice Set the Governance address
     * @dev Only callable by Governance address
     * @param _governanceAddress - address for new Governance contract
     */
    function setGovernanceAddress(address _governanceAddress) external {
        require(msg.sender == governanceAddress, "Only governance");
        governanceAddress = _governanceAddress;
    }

    /**
     * @notice Set the Staking address
     * @dev Only callable by Governance address
     * @param _address - address for new Staking contract
     */
    function setStakingAddress(address _address) external {
        require(msg.sender == governanceAddress, "Only governance");
        stakingAddress = _address;
    }

    /**
     * @notice Set the ServiceProviderFactory address
     * @dev Only callable by Governance address
     * @param _spFactory - address for new ServiceProviderFactory contract
     */
    function setServiceProviderFactoryAddress(address _spFactory) external {
        require(msg.sender == governanceAddress, "Only governance");
        serviceProviderFactoryAddress = _spFactory;
    }

    /**
     * @notice Set the ClaimsManager address
     * @dev Only callable by Governance address
     * @param _claimsManagerAddress - address for new ClaimsManager contract
     */
    function setClaimsManagerAddress(address _claimsManagerAddress) external {
        require(msg.sender == governanceAddress, "Only governance");
        claimsManagerAddress = _claimsManagerAddress;
    }

    // ========================================= View Functions =========================================

    /**
     * @notice Get list of delegators for a given service provider
     * @param _sp - service provider address
     */
    function getDelegatorsList(address _sp)
    external view returns (address[] memory dels)
    {
        return spDelegateInfo[_sp].delegators;
    }

    /// @notice Get total amount delegated to a service provider
    function getTotalDelegatedToServiceProvider(address _sp)
    external view returns (uint total)
    {
        return spDelegateInfo[_sp].totalDelegatedStake;
    }

    /// @notice Get total delegated stake locked up for a service provider
    function getTotalLockedDelegationForServiceProvider(address _sp)
    external view returns (uint total)
    {
        return spDelegateInfo[_sp].totalLockedUpStake;
    }

    /// @notice Get total currently staked for a delegator, across service providers
    function getTotalDelegatorStake(address _delegator)
    external view returns (uint amount)
    {
        return delegatorStakeTotal[_delegator];
    }

    /// @notice Get total currently staked for a delegator, for a given service provider
    function getDelegatorStakeForServiceProvider(address _delegator, address _serviceProvider)
    external view returns (uint amount)
    {
        return delegateInfo[_delegator][_serviceProvider];
    }

    /**
     * @notice Get status of pending undelegate request for a given address
     * @param _delegator - address of the delegator
     */
    function getPendingUndelegateRequest(address _delegator)
    external view returns (address target, uint amount, uint lockupExpiryBlock)
    {
        UndelegateStakeRequest memory req = undelegateRequests[_delegator];
        return (req.serviceProvider, req.amount, req.lockupExpiryBlock);
    }

    /// @notice Get current undelegate lockup duration
    function getUndelegateLockupDuration()
    external view returns (uint duration)
    {
        return undelegateLockupDuration;
    }

    /// @notice Current maximum delegators
    function getMaxDelegators()
    external view returns (uint numDelegators)
    {
        return maxDelegators;
    }

    /// @notice Get minimum delegation amount
    function getMinDelegationAmount()
    external view returns (uint minDelegation)
    {
        return minDelegationAmount;
    }

    /// @notice Get the Governance address
    function getGovernanceAddress() external view returns (address addr) {
        return governanceAddress;
    }

    /// @notice Get the ServiceProviderFactory address
    function getServiceProviderFactoryAddress() external view returns (address addr) {
        return serviceProviderFactoryAddress;
    }

    /// @notice Get the ClaimsManager address
    function getClaimsManagerAddress() external view returns (address addr) {
        return claimsManagerAddress;
    }

    /// @notice Get the Staking address
    function getStakingAddress() external view returns (address addr)
    {
        return stakingAddress;
    }

    // ========================================= Internal functions =========================================

    /**
     * @notice Helper function for claimRewards to get balances from Staking contract
               and do validation
     * @param spFactory - reference to ServiceProviderFactory contract
     * @return (totalBalanceInStaking, totalBalanceInSPFactory, totalBalanceOutsideStaking)
     */
    function _validateClaimRewards(ServiceProviderFactory spFactory)
    internal returns (uint totalBalanceInStaking, uint totalBalanceInSPFactory, uint totalBalanceOutsideStaking)
        {

        // Account for any pending locked up stake for the service provider
        (uint spLockedStake,) = spFactory.getPendingDecreaseStakeRequest(msg.sender);

        // Process claim for msg.sender
        // Total locked parameter is equal to delegate locked up stake + service provider locked up stake
        ClaimsManager(claimsManagerAddress).processClaim(
            msg.sender,
            (spDelegateInfo[msg.sender].totalLockedUpStake.add(spLockedStake))
        );

        // Amount stored in staking contract for owner
        uint _totalBalanceInStaking = Staking(stakingAddress).totalStakedFor(msg.sender);
        require(_totalBalanceInStaking > 0, "Stake required for claim");

        // Amount in sp factory for claimer
        (uint _totalBalanceInSPFactory,,,,,) = spFactory.getServiceProviderDetails(msg.sender);

        // Decrease total balance by any locked up stake
        _totalBalanceInSPFactory = _totalBalanceInSPFactory.sub(spLockedStake);

        // Require active stake to claim any rewards
        require(_totalBalanceInSPFactory > 0, "Service Provider stake required");

        // Amount in delegate manager staked to service provider
        uint _totalBalanceOutsideStaking = (
            _totalBalanceInSPFactory.add(spDelegateInfo[msg.sender].totalDelegatedStake)
        );

        return (_totalBalanceInStaking, _totalBalanceInSPFactory, _totalBalanceOutsideStaking);
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
}

