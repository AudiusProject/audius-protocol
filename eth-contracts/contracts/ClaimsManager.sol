pragma solidity ^0.5.0;
import "./Staking.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20Mintable.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20.sol";
import "./ServiceProviderFactory.sol";
/// @notice SafeMath imported via ServiceProviderFactory.sol
/// @notice Governance imported via Staking.sol


/**
 * Designed to automate claim funding, minting tokens as necessary
 * @notice - will call InitializableV2 constructor
 */
contract ClaimsManager is InitializableV2 {
    using SafeMath for uint256;
    address private tokenAddress;
    address private governanceAddress;
    address private stakingAddress;
    address private serviceProviderFactoryAddress;
    address private delegateManagerAddress;

    // Claim related configurations
    /**
      * @notice - Minimum number of blocks between funding rounds
      *       604800 seconds / week
      *       Avg block time - 13s
      *       604800 / 13 = 46523.0769231 blocks
      */
    uint private fundingRoundBlockDiff;

    /**
      * @notice - Configures the current funding amount per round
      *  Weekly rounds, 7% PA inflation = 70,000,000 new tokens in first year
      *                                 = 70,000,000/365*7 (year is slightly more than a week)
      *                                 = 1342465.75342 new AUDS per week
      *                                 = 1342465753420000000000000 new wei units per week
      * @dev - Past a certain block height, this schedule will be updated
      *      - Logic determining schedule will be sourced from an external contract
      */
    uint private fundingAmount;

    // Denotes current round
    uint private roundNumber;

    // Staking contract ref
    ERC20Mintable private audiusToken;

    // Struct representing round state
    // 1) Block at which round was funded
    // 2) Total funded for this round
    // 3) Total claimed in round
    struct Round {
        uint fundBlock;
        uint fundingAmount;
        uint totalClaimedInRound;
    }

    // Current round information
    Round private currentRound;

    event RoundInitiated(
      uint indexed _blockNumber,
      uint indexed _roundNumber,
      uint indexed _fundAmount
    );

    event ClaimProcessed(
      address indexed _claimer,
      uint indexed _rewards,
      uint _oldTotal,
      uint indexed _newTotal
    );

    event FundingAmountUpdated(uint indexed _amount);
    event FundingRoundBlockDiffUpdated(uint indexed _blockDifference);
    event GovernanceAddressUpdated(address indexed _newGovernanceAddress);
    event StakingAddressUpdated(address indexed _newStakingAddress);
    event ServiceProviderFactoryAddressUpdated(address indexed _newServiceProviderFactoryAddress);
    event DelegateManagerAddressUpdated(address indexed _newDelegateManagerAddress);

    /**
     * @notice Function to initialize the contract
     * @param _tokenAddress - address of ERC20 token that will be claimed
     * @param _governanceAddress - address for Governance proxy contract
     */
    function initialize(
        address _tokenAddress,
        address _governanceAddress
    ) public initializer
    {
        tokenAddress = _tokenAddress;
        _updateGovernanceAddress(_governanceAddress);

        audiusToken = ERC20Mintable(tokenAddress);

        fundingRoundBlockDiff = 46523;
        fundingAmount = 1342465753420000000000000; // 1342465.75342 AUDS
        roundNumber = 0;

        currentRound = Round({
            fundBlock: 0,
            fundingAmount: 0,
            totalClaimedInRound: 0
        });

        InitializableV2.initialize();
    }

    /// @notice Get the duration of a funding round in blocks
    function getFundingRoundBlockDiff() external view returns (uint blockDiff)
    {
        _requireIsInitialized();

        return fundingRoundBlockDiff;
    }

    /// @notice Get the last block where a funding round was initiated
    function getLastFundBlock() external view returns (uint lastFundBlock)
    {
        _requireIsInitialized();

        return currentRound.fundBlock;
    }

    /// @notice Get the amount funded per round in wei
    function getFundsPerRound() external view returns (uint amount)
    {
        _requireIsInitialized();

        return fundingAmount;
    }

    /// @notice Get the total amount claimed in the current round
    function getTotalClaimedInRound() external view returns (uint claimedAmount)
    {
        _requireIsInitialized();

        return currentRound.totalClaimedInRound;
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

    /// @notice Get the DelegateManager address
    function getDelegateManagerAddress() external view returns (address addr) {
        _requireIsInitialized();

        return delegateManagerAddress;
    }

    /**
     * @notice Get the Staking address
     */
    function getStakingAddress() external view returns (address addr)
    {
        _requireIsInitialized();

        return stakingAddress;
    }

    /**
     * @notice Set the Governance address
     * @dev Only callable by Governance address
     * @param _governanceAddress - address for new Governance contract
     */
    function setGovernanceAddress(address _governanceAddress) external {
        _requireIsInitialized();

        require(msg.sender == governanceAddress, "Only callable by Governance contract");
        _updateGovernanceAddress(_governanceAddress);
        emit GovernanceAddressUpdated(_governanceAddress);
    }

    /**
     * @notice Set the Staking address
     * @dev Only callable by Governance address
     * @param _stakingAddress - address for new Staking contract
     */
    function setStakingAddress(address _stakingAddress) external {
        _requireIsInitialized();

        require(msg.sender == governanceAddress, "Only callable by Governance contract");
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

        require(msg.sender == governanceAddress, "Only callable by Governance contract");
        serviceProviderFactoryAddress = _spFactory;
        emit ServiceProviderFactoryAddressUpdated(_spFactory);
    }

    /**
     * @notice Set the DelegateManager address
     * @dev Only callable by Governance address
     * @param _delegateManager - address for new DelegateManager contract
     */
    function setDelegateManagerAddress(address _delegateManager) external {
        _requireIsInitialized();

        require(msg.sender == governanceAddress, "Only callable by Governance contract");
        delegateManagerAddress = _delegateManager;
        emit DelegateManagerAddressUpdated(_delegateManager);
    }

    /**
     * @notice Start a new funding round
     * @dev Permissioned to be callable by stakers or governance contract
     */
    function initiateRound() external {
        _requireIsInitialized();

        require(
            Staking(stakingAddress).isStaker(msg.sender) || (msg.sender == governanceAddress),
            "Only callable by staked account or Governance contract"
        );

        require(
            block.number.sub(currentRound.fundBlock) > fundingRoundBlockDiff,
            "Required block difference not met"
        );

        currentRound = Round({
            fundBlock: block.number,
            fundingAmount: fundingAmount,
            totalClaimedInRound: 0
        });

        roundNumber = roundNumber.add(1);

        emit RoundInitiated(
            currentRound.fundBlock,
            roundNumber,
            currentRound.fundingAmount
        );
    }

    /**
     * @notice Mints and stakes tokens on behalf of ServiceProvider + delegators
     * @dev Callable through DelegateManager by Service Provider
     * @param _claimer  - service provider address
     * @param _totalLockedForSP - amount of tokens locked up across DelegateManager + ServiceProvider
     */
    function processClaim(
        address _claimer,
        uint _totalLockedForSP
    ) external returns (uint mintedRewards)
    {
        _requireIsInitialized();
        require(
            msg.sender == delegateManagerAddress,
            "ProcessClaim only accessible to DelegateManager"
        );

        Staking stakingContract = Staking(stakingAddress);
        // Prevent duplicate claim
        uint lastUserClaimBlock = stakingContract.lastClaimedFor(_claimer);
        require(lastUserClaimBlock <= currentRound.fundBlock, "Claim already processed for user");
        uint totalStakedAtFundBlockForClaimer = stakingContract.totalStakedForAt(
            _claimer,
            currentRound.fundBlock);

        (,,bool withinBounds,,,) = (
            ServiceProviderFactory(serviceProviderFactoryAddress).getServiceProviderDetails(_claimer)
        );

        // Once they claim the zero reward amount, stake can be modified once again
        // Subtract total locked amount for SP from stake at fund block
        uint claimerTotalStake = totalStakedAtFundBlockForClaimer.sub(_totalLockedForSP);
        uint totalStakedAtFundBlock = stakingContract.totalStakedAt(currentRound.fundBlock);

        // Calculate claimer rewards
        uint rewardsForClaimer = (
          claimerTotalStake.mul(fundingAmount)
        ).div(totalStakedAtFundBlock);

        // For a claimer violating bounds, no new tokens are minted
        // Claim history is marked to zero and function is short-circuited
        // Total rewards can be zero if all stake is currently locked up
        if (!withinBounds || rewardsForClaimer == 0) {
            stakingContract.updateClaimHistory(0, _claimer);
            emit ClaimProcessed(
                _claimer,
                0,
                totalStakedAtFundBlockForClaimer,
                claimerTotalStake
            );
            return 0;
        }

        // ERC20Mintable always returns true
        audiusToken.mint(address(this), rewardsForClaimer);

        // ERC20 always returns true
        audiusToken.approve(stakingAddress, rewardsForClaimer);

        // Transfer rewards
        stakingContract.stakeRewards(rewardsForClaimer, _claimer);

        // Update round claim value
        currentRound.totalClaimedInRound = currentRound.totalClaimedInRound.add(rewardsForClaimer);

        // Update round claim value
        uint newTotal = stakingContract.totalStakedFor(_claimer);

        emit ClaimProcessed(
            _claimer,
            rewardsForClaimer,
            totalStakedAtFundBlockForClaimer,
            newTotal
        );

        return rewardsForClaimer;
    }

    /**
     * @notice Modify funding amount per round
     * @param _newAmount - new amount to fund per round in wei
     */
    function updateFundingAmount(uint _newAmount)
    external returns (uint newAmount)
    {
        _requireIsInitialized();

        require(
            msg.sender == governanceAddress,
            "Only callable by Governance contract"
        );
        fundingAmount = _newAmount;
        emit FundingAmountUpdated(_newAmount);
        return _newAmount;
    }

    /**
     * @notice Returns boolean indicating whether a claim is considered pending
     * @dev Note that an address with no endpoints can never have a pending claim
     * @param _sp - address of the service provider to check
     * @return boolean - true if eligible for claim, false if not
     */
    function claimPending(address _sp) external view returns (bool pending) {
        _requireIsInitialized();

        uint lastClaimedForSP = Staking(stakingAddress).lastClaimedFor(_sp);
        (,,,uint numEndpoints,,) = (
            ServiceProviderFactory(serviceProviderFactoryAddress).getServiceProviderDetails(_sp)
        );
        return (lastClaimedForSP < currentRound.fundBlock && numEndpoints > 0);
    }

    /**
     * @notice Modify minimum block difference between funding rounds
     * @param _newFundingRoundBlockDiff - new min block difference to set
     */
    function updateFundingRoundBlockDiff(uint _newFundingRoundBlockDiff) external {
        _requireIsInitialized();

        require(
            msg.sender == governanceAddress,
            "Only callable by Governance contract"
        );
        emit FundingRoundBlockDiffUpdated(_newFundingRoundBlockDiff);
        fundingRoundBlockDiff = _newFundingRoundBlockDiff;
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
}
