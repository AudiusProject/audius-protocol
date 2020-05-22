pragma solidity ^0.5.0;
import "./Staking.sol";
import "./registry/RegistryContract.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20Mintable.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20.sol";
import "./interface/RegistryInterface.sol";
import "./ServiceProviderFactory.sol";
/** SafeMath imported via ServiceProviderFactory.sol */


/**
 * Designed to automate claim funding, minting tokens as necessary
 * @notice - will call RegistryContract.constructor, which calls Ownable constructor
 */
contract ClaimsManager is RegistryContract {
    using SafeMath for uint256;

    // standard - imitates relationship between Ether and Wei
    uint8 private constant DECIMALS = 18;

    RegistryInterface private registry;

    address private tokenAddress;

    bytes32 private stakingProxyOwnerKey;
    bytes32 private serviceProviderFactoryKey;
    bytes32 private delegateManagerKey;
    bytes32 private governanceKey;

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

    /**
     * @notice Function to initialize the contract
     * @param _tokenAddress - address of ERC20 token that will be claimed
     * @param _registryAddress - address for registry proxy contract
     * @param _stakingProxyOwnerKey - registry key for Staking proxy
     * @param _serviceProviderFactoryKey - registry key for ServiceProvider proxy
     * @param _delegateManagerKey - registry key for DelegateManager proxy
     * @param _governanceKey - registry key for Governance
     */
    function initialize(
        address _tokenAddress,
        address _registryAddress,
        bytes32 _stakingProxyOwnerKey,
        bytes32 _serviceProviderFactoryKey,
        bytes32 _delegateManagerKey,
        bytes32 _governanceKey
    ) public initializer
    {
        tokenAddress = _tokenAddress;
        stakingProxyOwnerKey = _stakingProxyOwnerKey;
        serviceProviderFactoryKey = _serviceProviderFactoryKey;
        delegateManagerKey = _delegateManagerKey;
        governanceKey = _governanceKey;

        audiusToken = ERC20Mintable(tokenAddress);
        registry = RegistryInterface(_registryAddress);

        fundingRoundBlockDiff = 10;
        fundingAmount = 20 * 10**uint256(DECIMALS); // 20 AUDS = 20 * 10**uint256(DECIMALS)
        roundNumber = 0;

        currentRound = Round({
            fundBlock: 0,
            fundingAmount: 0,
            totalClaimedInRound: 0
        });

        RegistryContract.initialize();
    }

    /**
     * @notice Get the duration of a funding round in blocks
     */
    function getFundingRoundBlockDiff()
    external view returns (uint blockDiff)
    {
        return fundingRoundBlockDiff;
    }

    /**
     * @notice Get the last block where a funding round was initiated
     */
    function getLastFundBlock()
    external view returns (uint lastFundBlock)
    {
        return currentRound.fundBlock;
    }

    /**
     * @notice Get the amount funded per round in wei
     */
    function getFundsPerRound()
    external view returns (uint amount)
    {
        return fundingAmount;
    }

    /**
     * @notice Get the total amount claimed in the current round
     */
    function getTotalClaimedInRound()
    external view returns (uint claimedAmount)
    {
        return currentRound.totalClaimedInRound;
    }

    /**
     * @notice Start a new funding round
     * @dev Permissioned to be callable by stakers or governance contract
     */
    function initiateRound() external {
        _requireIsInitialized();

        bool senderStaked = Staking(
            registry.getContract(stakingProxyOwnerKey)
        ).totalStakedFor(msg.sender) > 0;
        require(
            senderStaked || (msg.sender == registry.getContract(governanceKey)),
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
     * @param _totalLockedForSP - amount of tokens locked up in DelegateManager
     */
    function processClaim(
        address _claimer,
        uint _totalLockedForSP
    ) external
    {
        _requireIsInitialized();
        require(
            msg.sender == registry.getContract(delegateManagerKey),
            "ProcessClaim only accessible to DelegateManager"
        );

        address stakingAddress = registry.getContract(stakingProxyOwnerKey);
        Staking stakingContract = Staking(stakingAddress);
        // Prevent duplicate claim
        uint lastUserClaimBlock = stakingContract.lastClaimedFor(_claimer);
        require(lastUserClaimBlock <= currentRound.fundBlock, "Claim already processed for user");
        uint totalStakedAtFundBlockForClaimer = stakingContract.totalStakedForAt(
            _claimer,
            currentRound.fundBlock);

        (,,bool withinBounds,,,) = ServiceProviderFactory(
            registry.getContract(serviceProviderFactoryKey)
        ).getServiceProviderDetails(_claimer);

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
     * @param _newAmount - new amount to fund per round in wei
     */
    function updateFundingAmount(uint _newAmount)
    external returns (uint newAmount)
    {
        require(
            msg.sender == registry.getContract(governanceKey),
            "Only callable by Governance contract"
        );
        fundingAmount = _newAmount;
        return _newAmount;
    }

    /**
     * @notice Returns boolean indicating whether a claim is considered pending
     * @dev Note that an address with no endpoints can never have a pending claim
     * @param _sp - address of the service provider to check
     * @return boolean - true if eligible for claim, false if not
     */
    function claimPending(address _sp) external view returns (bool pending) {
        uint lastClaimedForSP = Staking(
            registry.getContract(stakingProxyOwnerKey)
        ).lastClaimedFor(_sp);
        (,,,uint numEndpoints,,) = ServiceProviderFactory(
            registry.getContract(serviceProviderFactoryKey)
        ).getServiceProviderDetails(_sp);
        return (lastClaimedForSP < currentRound.fundBlock && numEndpoints > 0);
    }

    /**
     * @notice Modify minimum block difference between funding rounds
     * @param _newFundingRoundBlockDiff - new min block difference to set
     */
    function updateFundingRoundBlockDiff(uint _newFundingRoundBlockDiff) external {
        require(
            msg.sender == registry.getContract(governanceKey),
            "Only callable by Governance contract"
        );
        fundingRoundBlockDiff = _newFundingRoundBlockDiff;
    }
}
