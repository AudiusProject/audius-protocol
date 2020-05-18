pragma solidity ^0.5.0;

import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20Mintable.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20.sol";

import "./registry/RegistryContract.sol";
import "./interface/registry/RegistryInterface.sol";
import "../staking/Staking.sol";
import "./ServiceProviderFactory.sol";
import "./ClaimsManager.sol";


/**
 * Designed to manage delegation to staking contract
 * @notice - will call RegistryContract.initialize(), which calls Ownable.initialize()
 */
contract DelegateManager is RegistryContract {
    using SafeMath for uint256;
    RegistryInterface registry = RegistryInterface(0);

    address private tokenAddress;
    address private stakingAddress;

    bytes32 private stakingProxyOwnerKey;
    bytes32 private serviceProviderFactoryKey;
    bytes32 private claimsManagerKey;
    bytes32 private governanceKey;

    // Number of blocks an undelegate operation has to wait
    // TODO: Move this value to Staking.sol as SPFactory may need as well
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

    function initialize (
        address _tokenAddress,
        address _registryAddress,
        bytes32 _governanceKey,
        bytes32 _stakingProxyOwnerKey,
        bytes32 _serviceProviderFactoryKey,
        bytes32 _claimsManagerKey
    ) public initializer
    {
        tokenAddress = _tokenAddress;
        audiusToken = ERC20Mintable(tokenAddress);
        registry = RegistryInterface(_registryAddress);
        governanceKey = _governanceKey;
        stakingProxyOwnerKey = _stakingProxyOwnerKey;
        serviceProviderFactoryKey = _serviceProviderFactoryKey;
        claimsManagerKey = _claimsManagerKey;
        undelegateLockupDuration = 10;
        maxDelegators = 175;
        // Default minimum delegation amount set to 100AUD
        minDelegationAmount = 100 * 10**uint256(18);
        RegistryContract.initialize();
    }

    function delegateStake(
        address _targetSP,
        uint _amount
    ) external returns (uint delegatedAmount)
    {
        _requireIsInitialized();
        require(
            claimPending(_targetSP) == false,
            "Delegation not permitted for SP pending claim"
        );
        address delegator = msg.sender;
        Staking stakingContract = Staking(
            registry.getContract(stakingProxyOwnerKey)
        );

        // Stake on behalf of target service provider
        stakingContract.delegateStakeFor(
            _targetSP,
            delegator,
            _amount
        );

        // Update list of delegators to SP if necessary
        if (!delegatorExistsForSP(delegator, _targetSP)) {
            // If not found, update list of delegates
            spDelegateInfo[_targetSP].delegators.push(delegator);
            require(
                spDelegateInfo[_targetSP].delegators.length <= maxDelegators,
                "Maximum delegators exceeded"
            );
        }

        // Update total delegated for SP
        spDelegateInfo[_targetSP].totalDelegatedStake += _amount;

        // Update amount staked from this delegator to targeted service provider
        delegateInfo[delegator][_targetSP] += _amount;

        // Update total delegated stake
        delegatorStakeTotal[delegator] += _amount;

        require(
            delegatorStakeTotal[delegator] >= minDelegationAmount,
            "Minimum delegation amount"
        );

        // Validate balance
        ServiceProviderFactory(
            registry.getContract(serviceProviderFactoryKey)
        ).validateAccountStakeBalance(_targetSP);

        emit IncreaseDelegatedStake(
            delegator,
            _targetSP,
            _amount
        );

        // Return new total
        return delegateInfo[delegator][_targetSP];
    }

    // Submit request for undelegation
    function requestUndelegateStake(
        address _target,
        uint _amount
    ) external returns (uint newDelegateAmount)
    {
        _requireIsInitialized();
        require(
            claimPending(_target) == false,
            "Undelegate request not permitted for SP pending claim"
        );
        address delegator = msg.sender;
        require(delegatorExistsForSP(delegator, _target), "Delegator must be staked for SP");

        // Confirm no pending delegation request
        require(
            (undelegateRequests[delegator].lockupExpiryBlock == 0) &&
            (undelegateRequests[delegator].amount == 0) &&
            (undelegateRequests[delegator].serviceProvider == address(0)),
            "No pending lockup expected"
        );

        // Ensure valid bounds
        uint currentlyDelegatedToSP = delegateInfo[delegator][_target];
        require(
            _amount <= currentlyDelegatedToSP,
            "Cannot decrease greater than currently staked for this ServiceProvider");

        undelegateRequests[delegator] = UndelegateStakeRequest({
            lockupExpiryBlock: block.number + undelegateLockupDuration,
            amount: _amount,
            serviceProvider: _target
        });

        // Update total locked for this service provider
        spDelegateInfo[_target].totalLockedUpStake += _amount;

        return delegatorStakeTotal[delegator] - _amount;
    }

    // Cancel undelegation request
    function cancelUndelegateStake() external {
        _requireIsInitialized();
        address delegator = msg.sender;
        // Confirm pending delegation request
        require(
            (undelegateRequests[delegator].lockupExpiryBlock != 0) &&
            (undelegateRequests[delegator].amount != 0) &&
            (undelegateRequests[delegator].serviceProvider != address(0)),
            "Pending lockup expected"
        );
        // Remove pending request
        undelegateRequests[delegator] = UndelegateStakeRequest({
            lockupExpiryBlock: 0,
            amount: 0,
            serviceProvider: address(0)
        });
    }

    // Finalize undelegation request and withdraw stake
    function undelegateStake() external returns (uint newTotal) {
        _requireIsInitialized();
        address delegator = msg.sender;

        // Confirm pending delegation request
        require(
            (undelegateRequests[delegator].lockupExpiryBlock != 0) &&
            (undelegateRequests[delegator].amount != 0) &&
            (undelegateRequests[delegator].serviceProvider != address(0)),
            "Pending lockup expected"
        );

        // Confirm lockup expiry has expired
        require(
            undelegateRequests[delegator].lockupExpiryBlock <= block.number, "Lockup must be expired");

        // Confirm no pending claim for this service provider
        require(
            claimPending(undelegateRequests[delegator].serviceProvider) == false,
            "Undelegate not permitted for SP pending claim"
        );

        address serviceProvider = undelegateRequests[delegator].serviceProvider;
        uint unstakeAmount = undelegateRequests[delegator].amount;

        // Stake on behalf of target service provider
        Staking(
            registry.getContract(stakingProxyOwnerKey)
        ).undelegateStakeFor(
            serviceProvider,
            delegator,
            unstakeAmount
        );

        // Update amount staked from this delegator to targeted service provider
        delegateInfo[delegator][serviceProvider] -= unstakeAmount;

        // Update total delegated stake
        delegatorStakeTotal[delegator] -= unstakeAmount;
        require(
            (delegatorStakeTotal[delegator] >= minDelegationAmount ||
             delegatorStakeTotal[delegator] == 0),
            "Minimum delegation amount"
        );

        // Update total delegated for SP
        spDelegateInfo[serviceProvider].totalDelegatedStake -= unstakeAmount;

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
        spDelegateInfo[serviceProvider].totalLockedUpStake -= unstakeAmount;

        // Reset lockup information
        undelegateRequests[delegator] = UndelegateStakeRequest({
            lockupExpiryBlock: 0,
            amount: 0,
            serviceProvider: address(0)
        });

        // Validate balance
        ServiceProviderFactory(
            registry.getContract(serviceProviderFactoryKey)
        ).validateAccountStakeBalance(serviceProvider);

        emit DecreaseDelegatedStake(
            delegator,
            serviceProvider,
            unstakeAmount);

        // Return new total
        return delegateInfo[delegator][serviceProvider];
    }

    /*
      TODO: See if its worth splitting processClaim into a separate tx?
      Primary concern is around gas consumption...
      This tx ends up minting tokens, transferring to staking, and doing below updates
      Can be stress tested and split out if needed
    */
    // Distribute proceeds of reward
    function claimRewards() external {
        _requireIsInitialized();

        ServiceProviderFactory spFactory = ServiceProviderFactory(
            registry.getContract(serviceProviderFactoryKey)
        );

        // Confirm service provider is valid
        (,,bool withinBounds,,,) = spFactory.getServiceProviderDetails(msg.sender);
        require(withinBounds, "Service provider must be within bounds");

        // Process claim for msg.sender
        ClaimsManager(
            registry.getContract(claimsManagerKey)
        ).processClaim(
            msg.sender,
            spDelegateInfo[msg.sender].totalLockedUpStake
        );

        // Amount stored in staking contract for owner
        uint totalBalanceInStaking = Staking(
            registry.getContract(stakingProxyOwnerKey)
        ).totalStakedFor(msg.sender);
        require(totalBalanceInStaking > 0, "Stake required for claim");

        // Amount in sp factory for claimer
        (uint totalBalanceInSPFactory,,,,,) = spFactory.getServiceProviderDetails(msg.sender);
        require(totalBalanceInSPFactory > 0, "Service Provider stake required");

        // Amount in delegate manager staked to service provider
        uint totalBalanceOutsideStaking = (
            totalBalanceInSPFactory + spDelegateInfo[msg.sender].totalDelegatedStake
        );

        // Require claim availability
        require(totalBalanceInStaking > totalBalanceOutsideStaking, "No stake available to claim");

        // Total rewards
        // Equal to (balance in staking) - ((balance in sp factory) + (balance in delegate manager))
        uint totalRewards = totalBalanceInStaking - totalBalanceOutsideStaking;

        // Emit claim event
        emit Claim(msg.sender, totalRewards, totalBalanceInStaking);

        ( ,uint deployerCut, , , , ) = spFactory.getServiceProviderDetails(msg.sender);
        uint deployerCutBase = spFactory.getServiceProviderDeployerCutBase();
        uint spDeployerCutRewards = 0;
        uint totalDelegatedStakeIncrease = 0;

        // Total valid funds used to calculate rewards distribution
        uint totalActiveFunds = (
            totalBalanceOutsideStaking - spDelegateInfo[msg.sender].totalLockedUpStake
        );

        // Traverse all delegates and calculate their rewards
        // As each delegate reward is calculated, increment SP cut reward accordingly
        for (uint i = 0; i < spDelegateInfo[msg.sender].delegators.length; i++) {
            address delegator = spDelegateInfo[msg.sender].delegators[i];
            uint delegateStakeToSP = delegateInfo[delegator][msg.sender];

            // Subtract any locked up stake
            if (undelegateRequests[delegator].serviceProvider == msg.sender) {
                delegateStakeToSP = delegateStakeToSP - undelegateRequests[delegator].amount;
            }

            // Calculate rewards by ((delegateStakeToSP / totalBalanceOutsideStaking) * totalRewards)
            uint rewardsPriorToSPCut = (
              delegateStakeToSP.mul(totalRewards)
            ).div(totalActiveFunds);

            // Multiply by deployer cut fraction to calculate reward for SP
            uint spDeployerCut = (rewardsPriorToSPCut.mul(deployerCut)).div(deployerCutBase);
            spDeployerCutRewards += spDeployerCut;
            // Increase total delegate reward in DelegateManager
            // Subtract SP reward from rewards to calculate delegate reward
            // delegateReward = rewardsPriorToSPCut - spDeployerCut;
            delegateInfo[delegator][msg.sender] += (rewardsPriorToSPCut - spDeployerCut);
            delegatorStakeTotal[delegator] += (rewardsPriorToSPCut - spDeployerCut);
            totalDelegatedStakeIncrease += (rewardsPriorToSPCut - spDeployerCut);
        }

        // Update total delegated to this SP
        spDelegateInfo[msg.sender].totalDelegatedStake += totalDelegatedStakeIncrease;

        uint spRewardShare = (
          totalBalanceInSPFactory.mul(totalRewards)
        ).div(totalActiveFunds);
        /// newSpBalance = totalBalanceInSPFactory + spRewardShare + spDeployerCutRewards;
        spFactory.updateServiceProviderStake(
            msg.sender,
            totalBalanceInSPFactory + spRewardShare + spDeployerCutRewards
        );
    }

    function slash(uint _amount, address _slashAddress)
    external
    {
        _requireIsInitialized();
        require(
            msg.sender == registry.getContract(governanceKey),
            "Only callable from governance contract"
        );
        Staking stakingContract = Staking(
            registry.getContract(stakingProxyOwnerKey)
        );

        ServiceProviderFactory spFactory = ServiceProviderFactory(
            registry.getContract(serviceProviderFactoryKey)
        );

        // Amount stored in staking contract for owner
        uint totalBalanceInStakingPreSlash = stakingContract.totalStakedFor(_slashAddress);
        require(
            (totalBalanceInStakingPreSlash >= _amount),
            "Cannot slash more than total currently staked");

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
            uint slashAmountForDelegator = preSlashDelegateStake.sub(newDelegateStake);
            delegateInfo[delegator][_slashAddress] -= (slashAmountForDelegator);
            delegatorStakeTotal[delegator] -= (slashAmountForDelegator);
            // Update total decrease amount
            totalDelegatedStakeDecrease += slashAmountForDelegator;
            // Check for any locked up funds for this slashed delegator
            // Slash overrides any pending withdrawal requests
            if (undelegateRequests[delegator].amount != 0) {
                address unstakeSP = undelegateRequests[delegator].serviceProvider;
                uint unstakeAmount = undelegateRequests[delegator].amount;
                // Reset total locked up stake
                spDelegateInfo[unstakeSP].totalLockedUpStake -= unstakeAmount;
                // Remove pending request
                undelegateRequests[delegator] = UndelegateStakeRequest({
                    lockupExpiryBlock: 0,
                    amount: 0,
                    serviceProvider: address(0)
                });
            }
        }

        // Update total delegated to this SP
        spDelegateInfo[msg.sender].totalDelegatedStake -= totalDelegatedStakeDecrease;

        // Recalculate SP direct stake
        uint newSpBalance = (
          totalBalanceInStakingAfterSlash.mul(totalBalanceInSPFactory)
        ).div(totalBalanceInStakingPreSlash);
        spFactory.updateServiceProviderStake(_slashAddress, newSpBalance);
    }

    /**
     * @notice Update duration for undelegate request lockup
     */
    function updateUndelegateLockupDuration(uint _duration) external {
        _requireIsInitialized();
        require(
            msg.sender == registry.getContract(governanceKey),
            "Only callable from governance"
        );
        undelegateLockupDuration = _duration;
    }

    /**
     * @notice Update maximum delegators allowed
     */
    function updateMaxDelegators(uint _maxDelegators) external {
        _requireIsInitialized();
        require(
            msg.sender == registry.getContract(governanceKey),
            "Only callable from governance"
        );
        maxDelegators = _maxDelegators;
    }

    /**
     * @notice Update minimum delegation amount
     */
    function updateMinDelegationAmount(uint _minDelegationAmount) external {
        _requireIsInitialized();
        require(
            msg.sender == registry.getContract(governanceKey),
            "Only callable from governance"
        );
        minDelegationAmount = _minDelegationAmount;
    }

    /**
     * @notice List of delegators for a given service provider
     */
    function getDelegatorsList(address _sp)
    external view returns (address[] memory dels)
    {
        return spDelegateInfo[_sp].delegators;
    }

    /**
     * @notice Total delegated to a service provider
     */
    function getTotalDelegatedToServiceProvider(address _sp)
    external view returns (uint total)
    {
        return spDelegateInfo[_sp].totalDelegatedStake;
    }

    /**
     * @notice Total delegated stake locked up for a service provider
     */
    function getTotalLockedDelegationForServiceProvider(address _sp)
    external view returns (uint total)
    {
        return spDelegateInfo[_sp].totalLockedUpStake;
    }

    /**
     * @notice Total currently staked for a delegator, across service providers
     */
    function getTotalDelegatorStake(address _delegator)
    external view returns (uint amount)
    {
        return delegatorStakeTotal[_delegator];
    }

    /**
     * @notice Total currently staked for a delegator, for a given service provider
     */
    function getDelegatorStakeForServiceProvider(address _delegator, address _serviceProvider)
    external view returns (uint amount)
    {
        return delegateInfo[_delegator][_serviceProvider];
    }

    /**
     * @notice Get status of pending undelegate request
     */
    function getPendingUndelegateRequest(address _delegator)
    external view returns (address target, uint amount, uint lockupExpiryBlock)
    {
        UndelegateStakeRequest memory req = undelegateRequests[_delegator];
        return (req.serviceProvider, req.amount, req.lockupExpiryBlock);
    }

    /**
     * @notice Current undelegate lockup duration
     */
    function getUndelegateLockupDuration()
    external view returns (uint duration)
    {
        return undelegateLockupDuration;
    }

    /**
     * @notice Current maximum delegators
     */
    function getMaxDelegators()
    external view returns (uint numDelegators)
    {
        return maxDelegators;
    }

    /**
     * @notice Get minimum delegation amount
     */
    function getMinDelegationAmount()
    external view returns (uint minDelegation)
    {
        return minDelegationAmount;
    }

    function delegatorExistsForSP(
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

    function claimPending(address _sp) internal view returns (bool pending) {
        ClaimsManager claimsManager = ClaimsManager(
            registry.getContract(claimsManagerKey)
        );
        return claimsManager.claimPending(_sp);
    }
}

