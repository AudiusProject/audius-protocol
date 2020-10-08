pragma solidity ^0.5.0;
import "./Staking.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20Mintable.sol";
import "./ServiceProviderFactory.sol";
/// @notice ERC20 imported via Staking.sol
/// @notice SafeERC20 imported via Staking.sol
/// @notice Governance imported via Staking.sol
/// @notice SafeMath imported via ServiceProviderFactory.sol


/**
 * Designed to automate claim funding, minting tokens as necessary
 * @notice - will call InitializableV2 constructor
 */
contract ClaimsManager is InitializableV2 {
    using SafeMath for uint256;
    using SafeERC20 for ERC20;

    string private constant ERROR_ONLY_GOVERNANCE = (
        "ClaimsManager: Only callable by Governance contract"
    );

    address private governanceAddress;
    address private stakingAddress;
    address private serviceProviderFactoryAddress;
    address private delegateManagerAddress;

    /**
      * @notice - Minimum number of blocks between funding rounds
      *       604800 seconds / week
      *       Avg block time - 13s
      *       604800 / 13 = 46523.0769231 blocks
      */
    uint256 private fundingRoundBlockDiff;

    /**
      * @notice - Configures the current funding amount per round
      *  Weekly rounds, 7% PA inflation = 70,000,000 new tokens in first year
      *                                 = 70,000,000/365*7 (year is slightly more than a week)
      *                                 = 1342465.75342 new AUDS per week
      *                                 = 1342465753420000000000000 new wei units per week
      * @dev - Past a certain block height, this schedule will be updated
      *      - Logic determining schedule will be sourced from an external contract
      */
    uint256 private fundingAmount;

    // Denotes current round
    uint256 private roundNumber;

    // Staking contract ref
    ERC20Mintable private audiusToken;

    /// @dev - Address to which recurringCommunityFundingAmount is transferred at funding round start
    address private communityPoolAddress;

    /// @dev - Reward amount transferred to communityPoolAddress at funding round start
    uint256 private recurringCommunityFundingAmount;

    // Struct representing round state
    // 1) Block at which round was funded
    // 2) Total funded for this round
    // 3) Total claimed in round
    struct Round {
        uint256 fundedBlock;
        uint256 fundedAmount;
        uint256 totalClaimedInRound;
    }

    // Current round information
    Round private currentRound;

    event RoundInitiated(
      uint256 indexed _blockNumber,
      uint256 indexed _roundNumber,
      uint256 indexed _fundAmount
    );

    event ClaimProcessed(
      address indexed _claimer,
      uint256 indexed _rewards,
      uint256 _oldTotal,
      uint256 indexed _newTotal
    );

    event CommunityRewardsTransferred(
      address indexed _transferAddress,
      uint256 indexed _amount
    );

    event FundingAmountUpdated(uint256 indexed _amount);
    event FundingRoundBlockDiffUpdated(uint256 indexed _blockDifference);
    event GovernanceAddressUpdated(address indexed _newGovernanceAddress);
    event StakingAddressUpdated(address indexed _newStakingAddress);
    event ServiceProviderFactoryAddressUpdated(address indexed _newServiceProviderFactoryAddress);
    event DelegateManagerAddressUpdated(address indexed _newDelegateManagerAddress);
    event RecurringCommunityFundingAmountUpdated(uint256 indexed _amount);
    event CommunityPoolAddressUpdated(address indexed _newCommunityPoolAddress);

    /**
     * @notice Function to initialize the contract
     * @dev stakingAddress must be initialized separately after Staking contract is deployed
     * @dev serviceProviderFactoryAddress must be initialized separately after ServiceProviderFactory contract is deployed
     * @dev delegateManagerAddress must be initialized separately after DelegateManager contract is deployed
     * @param _tokenAddress - address of ERC20 token that will be claimed
     * @param _governanceAddress - address for Governance proxy contract
     */
    function initialize(
        address _tokenAddress,
        address _governanceAddress
    ) public initializer
    {
        _updateGovernanceAddress(_governanceAddress);

        audiusToken = ERC20Mintable(_tokenAddress);

        fundingRoundBlockDiff = 46523;
        fundingAmount = 1342465753420000000000000; // 1342465.75342 AUDS
        roundNumber = 0;

        currentRound = Round({
            fundedBlock: 0,
            fundedAmount: 0,
            totalClaimedInRound: 0
        });

        // Community pool funding amount and address initialized to zero
        recurringCommunityFundingAmount = 0;
        communityPoolAddress = address(0x0);

        InitializableV2.initialize();
    }

    /// @notice Get the duration of a funding round in blocks
    function getFundingRoundBlockDiff() external view returns (uint256)
    {
        _requireIsInitialized();

        return fundingRoundBlockDiff;
    }

    /// @notice Get the last block where a funding round was initiated
    function getLastFundedBlock() external view returns (uint256)
    {
        _requireIsInitialized();

        return currentRound.fundedBlock;
    }

    /// @notice Get the amount funded per round in wei
    function getFundsPerRound() external view returns (uint256)
    {
        _requireIsInitialized();

        return fundingAmount;
    }

    /// @notice Get the total amount claimed in the current round
    function getTotalClaimedInRound() external view returns (uint256)
    {
        _requireIsInitialized();

        return currentRound.totalClaimedInRound;
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

    /// @notice Get the DelegateManager address
    function getDelegateManagerAddress() external view returns (address) {
        _requireIsInitialized();

        return delegateManagerAddress;
    }

    /**
     * @notice Get the Staking address
     */
    function getStakingAddress() external view returns (address)
    {
        _requireIsInitialized();

        return stakingAddress;
    }

    /**
     * @notice Get the community pool address
     */
    function getCommunityPoolAddress() external view returns (address)
    {
        _requireIsInitialized();

        return communityPoolAddress;
    }

    /**
     * @notice Get the community funding amount
     */
    function getRecurringCommunityFundingAmount() external view returns (uint256)
    {
        _requireIsInitialized();

        return recurringCommunityFundingAmount;
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
     * @param _serviceProviderFactoryAddress - address for new ServiceProviderFactory contract
     */
    function setServiceProviderFactoryAddress(address _serviceProviderFactoryAddress) external {
        _requireIsInitialized();

        require(msg.sender == governanceAddress, ERROR_ONLY_GOVERNANCE);
        serviceProviderFactoryAddress = _serviceProviderFactoryAddress;
        emit ServiceProviderFactoryAddressUpdated(_serviceProviderFactoryAddress);
    }

    /**
     * @notice Set the DelegateManager address
     * @dev Only callable by Governance address
     * @param _delegateManagerAddress - address for new DelegateManager contract
     */
    function setDelegateManagerAddress(address _delegateManagerAddress) external {
        _requireIsInitialized();

        require(msg.sender == governanceAddress, ERROR_ONLY_GOVERNANCE);
        delegateManagerAddress = _delegateManagerAddress;
        emit DelegateManagerAddressUpdated(_delegateManagerAddress);
    }

    /**
     * @notice Start a new funding round
     * @dev Permissioned to be callable by stakers or governance contract
     */
    function initiateRound() external {
        _requireIsInitialized();
        _requireStakingAddressIsSet();

        require(
            block.number.sub(currentRound.fundedBlock) > fundingRoundBlockDiff,
            "ClaimsManager: Required block difference not met"
        );

        currentRound = Round({
            fundedBlock: block.number,
            fundedAmount: fundingAmount,
            totalClaimedInRound: 0
        });

        roundNumber = roundNumber.add(1);

        /*
         * Transfer community funding amount to community pool address, if set
         */
        if (recurringCommunityFundingAmount > 0 && communityPoolAddress != address(0x0)) {
            // ERC20Mintable always returns true
            audiusToken.mint(address(this), recurringCommunityFundingAmount);

            // Approve transfer to community pool address
            audiusToken.approve(communityPoolAddress, recurringCommunityFundingAmount);

            // Transfer to community pool address
            ERC20(address(audiusToken)).safeTransfer(communityPoolAddress, recurringCommunityFundingAmount);

            emit CommunityRewardsTransferred(communityPoolAddress, recurringCommunityFundingAmount);
        }

        emit RoundInitiated(
            currentRound.fundedBlock,
            roundNumber,
            currentRound.fundedAmount
        );
    }

    /**
     * @notice Mints and stakes tokens on behalf of ServiceProvider + delegators
     * @dev Callable through DelegateManager by Service Provider
     * @param _claimer  - service provider address
     * @param _totalLockedForSP - amount of tokens locked up across DelegateManager + ServiceProvider
     * @return minted rewards for this claimer
     */
    function processClaim(
        address _claimer,
        uint256 _totalLockedForSP
    ) external returns (uint256)
    {
        _requireIsInitialized();
        _requireStakingAddressIsSet();
        _requireDelegateManagerAddressIsSet();
        _requireServiceProviderFactoryAddressIsSet();

        require(
            msg.sender == delegateManagerAddress,
            "ClaimsManager: ProcessClaim only accessible to DelegateManager"
        );

        Staking stakingContract = Staking(stakingAddress);
        // Prevent duplicate claim
        uint256 lastUserClaimBlock = stakingContract.lastClaimedFor(_claimer);
        require(
            lastUserClaimBlock <= currentRound.fundedBlock,
            "ClaimsManager: Claim already processed for user"
        );
        uint256 totalStakedAtFundBlockForClaimer = stakingContract.totalStakedForAt(
            _claimer,
            currentRound.fundedBlock);

        (,,bool withinBounds,,,) = (
            ServiceProviderFactory(serviceProviderFactoryAddress).getServiceProviderDetails(_claimer)
        );

        // Once they claim the zero reward amount, stake can be modified once again
        // Subtract total locked amount for SP from stake at fund block
        uint256 totalActiveClaimerStake = totalStakedAtFundBlockForClaimer.sub(_totalLockedForSP);
        uint256 totalStakedAtFundBlock = stakingContract.totalStakedAt(currentRound.fundedBlock);

        // Calculate claimer rewards
        uint256 rewardsForClaimer = (
          totalActiveClaimerStake.mul(fundingAmount)
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
                totalActiveClaimerStake
            );
            return 0;
        }

        // ERC20Mintable always returns true
        audiusToken.mint(address(this), rewardsForClaimer);

        // Approve transfer to staking address for claimer rewards
        // ERC20 always returns true
        audiusToken.approve(stakingAddress, rewardsForClaimer);

        // Transfer rewards
        stakingContract.stakeRewards(rewardsForClaimer, _claimer);

        // Update round claim value
        currentRound.totalClaimedInRound = currentRound.totalClaimedInRound.add(rewardsForClaimer);

        // Update round claim value
        uint256 newTotal = stakingContract.totalStakedFor(_claimer);

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
    function updateFundingAmount(uint256 _newAmount) external
    {
        _requireIsInitialized();
        require(msg.sender == governanceAddress, ERROR_ONLY_GOVERNANCE);
        fundingAmount = _newAmount;
        emit FundingAmountUpdated(_newAmount);
    }

    /**
     * @notice Returns boolean indicating whether a claim is considered pending
     * @dev Note that an address with no endpoints can never have a pending claim
     * @param _sp - address of the service provider to check
     * @return true if eligible for claim, false if not
     */
    function claimPending(address _sp) external view returns (bool) {
        _requireIsInitialized();
        _requireStakingAddressIsSet();
        _requireServiceProviderFactoryAddressIsSet();

        uint256 lastClaimedForSP = Staking(stakingAddress).lastClaimedFor(_sp);
        (,,,uint256 numEndpoints,,) = (
            ServiceProviderFactory(serviceProviderFactoryAddress).getServiceProviderDetails(_sp)
        );
        return (lastClaimedForSP < currentRound.fundedBlock && numEndpoints > 0);
    }

    /**
     * @notice Modify minimum block difference between funding rounds
     * @param _newFundingRoundBlockDiff - new min block difference to set
     */
    function updateFundingRoundBlockDiff(uint256 _newFundingRoundBlockDiff) external {
        _requireIsInitialized();

        require(msg.sender == governanceAddress, ERROR_ONLY_GOVERNANCE);
        emit FundingRoundBlockDiffUpdated(_newFundingRoundBlockDiff);
        fundingRoundBlockDiff = _newFundingRoundBlockDiff;
    }

    /**
     * @notice Modify community funding amound for each round
     * @param _newRecurringCommunityFundingAmount - new reward amount transferred to
     *          communityPoolAddress at funding round start
     */
    function updateRecurringCommunityFundingAmount(
        uint256 _newRecurringCommunityFundingAmount
    ) external {
        _requireIsInitialized();

        require(msg.sender == governanceAddress, ERROR_ONLY_GOVERNANCE);
        recurringCommunityFundingAmount = _newRecurringCommunityFundingAmount;
        emit RecurringCommunityFundingAmountUpdated(_newRecurringCommunityFundingAmount);
    }

    /**
     * @notice Modify community pool address
     * @param _newCommunityPoolAddress - new address to which recurringCommunityFundingAmount
     *          is transferred at funding round start
     */
    function updateCommunityPoolAddress(address _newCommunityPoolAddress) external {
        _requireIsInitialized();

        require(msg.sender == governanceAddress, ERROR_ONLY_GOVERNANCE);
        communityPoolAddress = _newCommunityPoolAddress;
        emit CommunityPoolAddressUpdated(_newCommunityPoolAddress);
    }

    // ========================================= Private Functions =========================================

    /**
     * @notice Set the governance address after confirming contract identity
     * @param _governanceAddress - Incoming governance address
     */
    function _updateGovernanceAddress(address _governanceAddress) private {
        require(
            Governance(_governanceAddress).isGovernanceAddress() == true,
            "ClaimsManager: _governanceAddress is not a valid governance contract"
        );
        governanceAddress = _governanceAddress;
    }

    function _requireStakingAddressIsSet() private view {
        require(stakingAddress != address(0x00), "ClaimsManager: stakingAddress is not set");
    }

    function _requireDelegateManagerAddressIsSet() private view {
        require(
            delegateManagerAddress != address(0x00),
            "ClaimsManager: delegateManagerAddress is not set"
        );
    }

    function _requireServiceProviderFactoryAddressIsSet() private view {
        require(
            serviceProviderFactoryAddress != address(0x00),
            "ClaimsManager: serviceProviderFactoryAddress is not set"
        );
    }
}
