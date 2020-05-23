pragma solidity ^0.5.0;
import "./Staking.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20Mintable.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20.sol";
import "./ServiceProviderFactory.sol";
/** SafeMath imported via ServiceProviderFactory.sol */


/**
 * Designed to automate claim funding, minting tokens as necessary
 * @notice - will call RegistryContract.constructor, which calls Ownable constructor
 */
contract ClaimsManager is InitializableV2 {
    using SafeMath for uint256;

    // standard - imitates relationship between Ether and Wei
    uint8 private constant DECIMALS = 18;

    address private tokenAddress;
    address private governanceAddress;
    address private stakingAddress;
    address private serviceProviderFactoryAddress;
    address private delegateManagerAddress;

    // Claim related configurations
    uint private fundingRoundBlockDiff;

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
    Round currentRound;

    event RoundInitiated(
      uint _blockNumber,
      uint _roundNumber,
      uint _fundAmount
    );

    event ClaimProcessed(
      address _claimer,
      uint _rewards,
      uint _oldTotal,
      uint _newTotal
    );

    function initialize(
        address _tokenAddress,
        address _governanceAddress
    ) public initializer
    {
        tokenAddress = _tokenAddress;
        governanceAddress = _governanceAddress;

        audiusToken = ERC20Mintable(tokenAddress);

        fundingRoundBlockDiff = 10;
        fundingAmount = 20 * 10**uint256(DECIMALS); // 20 AUDS = 20 * 10**uint256(DECIMALS)
        roundNumber = 0;

        currentRound = Round({
            fundBlock: 0,
            fundingAmount: 0,
            totalClaimedInRound: 0
        });

        InitializableV2.initialize();
    }

    function getFundingRoundBlockDiff() external view returns (uint blockDiff)
    {
        return fundingRoundBlockDiff;
    }

    function getLastFundBlock() external view returns (uint lastFundBlock)
    {
        return currentRound.fundBlock;
    }

    function getFundsPerRound() external view returns (uint amount)
    {
        return fundingAmount;
    }

    function getTotalClaimedInRound() external view returns (uint claimedAmount)
    {
        return currentRound.totalClaimedInRound;
    }

    function getGovernanceAddress() external view returns (address addr) {
        return governanceAddress;
    }

    function getServiceProviderFactoryAddress() external view returns (address addr) {
        return serviceProviderFactoryAddress;
    }

    function getDelegateManagerAddress() external view returns (address addr) {
        return delegateManagerAddress;
    }

    function getStakingAddress() external view returns (address addr)
    {
        return stakingAddress;
    }

    function setGovernanceAddress(address _governanceAddress) external {
        require(msg.sender == governanceAddress, "Only governance");
        governanceAddress = _governanceAddress;
    }

    function setStakingAddress(address _address) external {
        require(msg.sender == governanceAddress, "Only callable by self");
        stakingAddress = _address;
    }

    function setServiceProviderFactoryAddress(address _spFactory) external {
        require(msg.sender == governanceAddress, "Only governance");
        serviceProviderFactoryAddress = _spFactory;
    }

    function setDelegateManagerAddress(address _delegateManager) external {
        require(msg.sender == governanceAddress, "Only governance");
        delegateManagerAddress = _delegateManager;
    }

    /// @dev - Start a new funding round
    //         Permissioned to stakers or contract deployer
    function initiateRound() external {
        _requireIsInitialized();

        bool senderStaked = Staking(stakingAddress).totalStakedFor(msg.sender) > 0;
        require(
            senderStaked || (msg.sender == governanceAddress),
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

    /// @dev - Callable by DelegateManager only
    ///        Mints new tokens and stakes on behalf of claimer
    function processClaim(
        address _claimer,
        uint _totalLockedForSP
    ) external
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
        if (withinBounds == false || rewardsForClaimer == 0) {
            stakingContract.updateClaimHistory(0, _claimer);
            return;
        }

        require(
            audiusToken.mint(address(this), rewardsForClaimer),
            "New tokens must be minted");

        // Approve token transfer to staking contract address
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
    }

    /**
     * @notice Modify funding amount per round
     */
    function updateFundingAmount(uint _newAmount)
    external returns (uint newAmount)
    {
        require(
            msg.sender == governanceAddress,
            "Only callable by Governance contract"
        );
        fundingAmount = _newAmount;
        return _newAmount;
    }

    /**
     * @notice Returns boolean indicating whether a claim is considered pending
     * Note that an address with no endpoints can never have a pending claim
     */
    function claimPending(address _sp) external view returns (bool pending) {
        uint lastClaimedForSP = Staking(stakingAddress).lastClaimedFor(_sp);
        (,,,uint numEndpoints,,) = (
            ServiceProviderFactory(serviceProviderFactoryAddress).getServiceProviderDetails(_sp)
        );
        return (lastClaimedForSP < currentRound.fundBlock && numEndpoints > 0);
    }

    /**
     * @notice Modify minimum block difference between funding rounds
     */
    function updateFundingRoundBlockDiff(uint _newFundingRoundBlockDiff) external {
        require(
            msg.sender == governanceAddress,
            "Only callable by Governance contract"
        );
        fundingRoundBlockDiff = _newFundingRoundBlockDiff;
    }
}
