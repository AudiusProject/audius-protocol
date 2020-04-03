pragma solidity ^0.5.0;
import "../staking/Staking.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Mintable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "./registry/RegistryContract.sol";
import "./interface/registry/RegistryInterface.sol";

import "../staking/Staking.sol";
import "./ServiceProviderFactory.sol";
import "./ClaimFactory.sol";
// import "../staking/Checkpointing.sol";


// WORKING CONTRACT
// Designed to manage delegation to staking contract
contract DelegateManager is RegistryContract {
    using SafeMath for uint256;
    RegistryInterface registry = RegistryInterface(0);

    address tokenAddress;
    address stakingAddress;

    bytes32 stakingProxyOwnerKey;
    bytes32 serviceProviderFactoryKey;
    bytes32 claimFactoryKey;

    // Number of blocks an undelegate operation has to wait
    // TODO: Expose CRUD
    // TODO: Consider moving this value to Staking.sol as SPFactory may need as well 
    uint undelegateLockupDuration = 10;

    // Staking contract ref
    ERC20Mintable internal audiusToken;

    // Struct representing total delegated to SP and list of delegators
    // TODO: Bound list
    struct ServiceProviderDelegateInfo {
      uint totalDelegatedStake;
      uint totalLockedUpStake;
      address[] delegators;
      // TODO: Confirm if we need below to be checkpointed...?
      // checkpointing history for locked up stake
      // Checkpointing.History lockedUpStake;
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

    // TODO: Evaluate whether this is necessary
    bytes empty;

    event Test(
    uint256 test,
    string msg);

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

    constructor(
      address _tokenAddress,
      address _registryAddress,
      bytes32 _stakingProxyOwnerKey,
      bytes32 _serviceProviderFactoryKey,
      bytes32 _claimFactoryKey
    ) public {
        tokenAddress = _tokenAddress;
        audiusToken = ERC20Mintable(tokenAddress);
        registry = RegistryInterface(_registryAddress);
        stakingProxyOwnerKey = _stakingProxyOwnerKey;
        serviceProviderFactoryKey = _serviceProviderFactoryKey;
        claimFactoryKey = _claimFactoryKey;
    }

    function delegateStake(
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
            empty
        );

        emit IncreaseDelegatedStake(
            delegator,
            _target,
            _amount
        );

        // Update list of delegators to SP if necessary
        // TODO: Any validation on returned value?
        updateServiceProviderDelegatorsIfNecessary(delegator, _target);

        // Update total delegated for SP
        spDelegateInfo[_target].totalDelegatedStake += _amount;

        // Update amount staked from this delegator to targeted service provider
        delegateInfo[delegator][_target] += _amount;

        // Update total delegated stake
        delegatorStakeTotal[delegator] += _amount;

        // Return new total
        return delegateInfo[delegator][_target];
    }

    // Submit request for undelegation
    function requestUndelegateStake(
       address _target,
       uint _amount
    ) external returns (uint newDelegateAmount) 
    {
        address delegator = msg.sender;
        bool exists = delegatorExistsForSP(delegator, _target);
        require(exists, "Delegator must be staked for SP");

        // Confirm no pending delegation request
        require(undelegateRequests[delegator].lockupExpiryBlock == 0, "No pending lockup expiry allowed");
        require(undelegateRequests[delegator].amount == 0, "No pending lockup amount allowed");
        require(undelegateRequests[delegator].serviceProvider == address(0), "No pending lockup SP allowed");

        // Ensure valid bounds
        uint currentlyDelegatedToSP = delegateInfo[delegator][_target];
        require(
            _amount <= currentlyDelegatedToSP,
            "Cannot decrease greater than currently staked for this ServiceProvider");

        uint expiryBlock = block.number + undelegateLockupDuration;

        undelegateRequests[delegator] = UndelegateStakeRequest({
          lockupExpiryBlock: expiryBlock,
          amount: _amount,
          serviceProvider: _target
        }); 

        // Update total locked for this service provider
        spDelegateInfo[_target].totalLockedUpStake += _amount;

        return delegatorStakeTotal[delegator] - _amount;
    }

    // TODO: Cancel undelegation request from delegator

    // Finalize undelegation request
    function undelegateStake() external returns (uint newTotal) {
        address delegator = msg.sender;

        // Confirm pending delegation request
        require(undelegateRequests[delegator].lockupExpiryBlock != 0, "Pending lockup expiry expected");
        require(undelegateRequests[delegator].amount != 0, "Pending lockup amount expected");
        require(undelegateRequests[delegator].serviceProvider != address(0), "Pending lockup SP expected");

        // Confirm lockup expiry has expired
        require(undelegateRequests[delegator].lockupExpiryBlock <= block.number, "Lockup must be expired");

        address serviceProvider = undelegateRequests[delegator].serviceProvider;  
        uint unstakeAmount = undelegateRequests[delegator].amount; 

        bool exists = delegatorExistsForSP(delegator, serviceProvider);
        require(exists, "Delegator must be staked for SP");

        Staking stakingContract = Staking(
            registry.getContract(stakingProxyOwnerKey)
        );

        // Stake on behalf of target service provider
        stakingContract.undelegateStakeFor(
            serviceProvider,
            delegator,
            unstakeAmount,
            empty
        );

        // Update amount staked from this delegator to targeted service provider
        delegateInfo[delegator][serviceProvider] -= unstakeAmount;

        // Update total delegated stake
        delegatorStakeTotal[delegator] -= unstakeAmount;

        // Update total delegated for SP
        spDelegateInfo[serviceProvider].totalDelegatedStake -= unstakeAmount;

        // Update total locked for this service provider
        spDelegateInfo[serviceProvider].totalLockedUpStake -= unstakeAmount;

        // Remove from delegators list if no delegated stake remaining
        if (delegateInfo[delegator][serviceProvider] == 0) {
            bool foundDelegator;
            uint delegatorIndex;
            for (uint i = 0; i < spDelegateInfo[serviceProvider].delegators.length; i++) {
                if (spDelegateInfo[serviceProvider].delegators[i] == delegator) {
                    foundDelegator = true;
                    delegatorIndex = i;
                }
            }

            if (foundDelegator) {
                // Overwrite and shrink delegators list
                uint lastIndex = spDelegateInfo[serviceProvider].delegators.length - 1;
                spDelegateInfo[serviceProvider].delegators[delegatorIndex] = spDelegateInfo[serviceProvider].delegators[lastIndex];
                spDelegateInfo[serviceProvider].delegators.length--;
            }
        }

        // Reset lockup information
        undelegateRequests[delegator] = UndelegateStakeRequest({
          lockupExpiryBlock: 0,
          amount: 0,
          serviceProvider: address(0)
        });

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
        ClaimFactory claimFactory = ClaimFactory(
            registry.getContract(claimFactoryKey)
        );
        // Pass in locked amount for claimer
        uint totalLockedForClaimer = spDelegateInfo[msg.sender].totalLockedUpStake;
        // Process claim for msg.sender
        claimFactory.processClaim(msg.sender, totalLockedForClaimer);

        // address claimer = msg.sender;
        ServiceProviderFactory spFactory = ServiceProviderFactory(
            registry.getContract(serviceProviderFactoryKey)
        );

        // Amount stored in staking contract for owner
        uint totalBalanceInStaking = Staking(
            registry.getContract(stakingProxyOwnerKey)
        ).totalStakedFor(msg.sender);
        require(totalBalanceInStaking > 0, "Stake required for claim");

        // Amount in sp factory for claimer
        uint totalBalanceInSPFactory = spFactory.getServiceProviderStake(msg.sender);
        require(totalBalanceInSPFactory > 0, "Service Provider stake required");

        // Amount in delegate manager staked to service provider
        uint totalBalanceInDelegateManager = spDelegateInfo[msg.sender].totalDelegatedStake;
        uint totalBalanceOutsideStaking = 
          (totalBalanceInSPFactory + totalBalanceInDelegateManager);

        // Require claim availability
        require(totalBalanceInStaking > totalBalanceOutsideStaking, "No stake available to claim");

        // Total rewards
        // Equal to (balance in staking) - ((balance in sp factory) + (balance in delegate manager))
        uint totalRewards = totalBalanceInStaking - totalBalanceOutsideStaking;

        // Emit claim event
        emit Claim(msg.sender, totalRewards, totalBalanceInStaking);

        uint deployerCut = spFactory.getServiceProviderDeployerCut(msg.sender);
        uint deployerCutBase = spFactory.getServiceProviderDeployerCutBase();
        uint spDeployerCutRewards = 0;
        uint totalDelegatedStakeIncrease = 0;

        // Total valid funds used to calculate rewards distribution
        uint totalActiveFunds = totalBalanceOutsideStaking - totalLockedForClaimer;

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

        // TODO: Validate below with test cases
        uint spRewardShare = (
          totalBalanceInSPFactory.mul(totalRewards)
        ).div(totalActiveFunds);
        uint newSpBalance = totalBalanceInSPFactory + spRewardShare + spDeployerCutRewards;
        spFactory.updateServiceProviderStake(msg.sender, newSpBalance);
    }

    // TODO: Permission to governance contract only
    // TODO: Handle slash amount...
    function slash(uint _amount, address _slashAddress)
    external
    {
        Staking stakingContract = Staking(
            registry.getContract(stakingProxyOwnerKey)
        );

        ServiceProviderFactory spFactory = ServiceProviderFactory(
            registry.getContract(serviceProviderFactoryKey)
        );

        // Amount stored in staking contract for owner
        uint totalBalanceInStakingPreSlash = stakingContract.totalStakedFor(_slashAddress);
        require(totalBalanceInStakingPreSlash > 0, "Stake required prior to slash");
        require(
            totalBalanceInStakingPreSlash > _amount,
            "Cannot slash more than total currently staked");

        // Amount in sp factory for slash target
        uint totalBalanceInSPFactory = spFactory.getServiceProviderStake(_slashAddress);
        require(totalBalanceInSPFactory > 0, "Service Provider stake required");

        // Decrease value in Staking contract
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

    function updateServiceProviderDelegatorsIfNecessary (
        address _delegator,
        address _serviceProvider
    ) internal returns (bool exists)
    {
        bool delegatorFound = delegatorExistsForSP(_delegator, _serviceProvider);
        if (!delegatorFound) {
          // If not found, update list of delegates
          spDelegateInfo[_serviceProvider].delegators.push(_delegator);
        }
        return delegatorFound;
    }

    function claimPending(address _sp) internal view returns (bool pending) 
    {
        ClaimFactory claimFactory = ClaimFactory(
            registry.getContract(claimFactoryKey)
        );
        return claimFactory.claimPending(_sp);
    }
}

