pragma solidity ^0.5.0;
import "./Staking.sol";
import "./registry/RegistryContract.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20Mintable.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20.sol";
import "./interface/RegistryInterface.sol";
import "./ServiceProviderFactory.sol";


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
    address private controllerAddress;
    bytes32 private stakingProxyOwnerKey;
    bytes32 private serviceProviderFactoryKey;
    bytes32 private delegateManagerKey;

    // Claim related configurations
    uint private fundingRoundBlockDiff;
    // uint private fundBlock;

    // TODO: Make this modifiable based on total staking pool?
    uint private fundingAmount;

    // Denotes current round
    uint private roundNumber;

    // Total claimed so far in round
    // uint private totalClaimedInRound;

    // Staking contract ref
    ERC20Mintable private audiusToken;

    // Struct representing round state
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
        address _registryAddress,
        address _controllerAddress,
        bytes32 _stakingProxyOwnerKey,
        bytes32 _serviceProviderFactoryKey,
        bytes32 _delegateManagerKey
    ) public initializer
    {
        tokenAddress = _tokenAddress;
        controllerAddress = _controllerAddress;
        stakingProxyOwnerKey = _stakingProxyOwnerKey;
        serviceProviderFactoryKey = _serviceProviderFactoryKey;
        delegateManagerKey = _delegateManagerKey;
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

    function getFundingRoundBlockDiff()
    external view returns (uint blockDiff)
    {
        return fundingRoundBlockDiff;
    }

    function getLastFundBlock()
    external view returns (uint lastFundBlock)
    {
        return currentRound.fundBlock;
    }

    function getFundsPerRound()
    external view returns (uint amount)
    {
        return fundingAmount;
    }

    function getTotalClaimedInRound()
    external view returns (uint claimedAmount)
    {
        return currentRound.totalClaimedInRound;
    }

    /// @dev - Start a new funding round
    //         Permissioned to stakers or contract deployer
    function initiateRound() external {
        _requireIsInitialized();
        bool senderStaked = Staking(
            registry.getContract(stakingProxyOwnerKey)
        ).totalStakedFor(msg.sender) > 0;

        require(
            senderStaked || (msg.sender == controllerAddress),
            "Round must be initiated from account with staked value or contract deployer"
        );
        require(
            block.number - currentRound.fundBlock > fundingRoundBlockDiff,
            "Required block difference not met"
        );

        currentRound = Round({
            fundBlock: block.number,
            fundingAmount: fundingAmount,
            totalClaimedInRound: 0
        });

        roundNumber += 1;

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
    ) external returns (uint newAccountTotal)
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

        ( , , , ,uint spMin, uint spMax) = ServiceProviderFactory(
            registry.getContract(serviceProviderFactoryKey)
        ).getServiceProviderDetails(_claimer);
        require(
            (totalStakedAtFundBlockForClaimer >= spMin),
            "Minimum stake bounds violated at fund block");
        require(
            (totalStakedAtFundBlockForClaimer <= spMax),
            "Maximum stake bounds violated at fund block");

        // Subtract total locked amount for SP from stake at fund block
        uint claimerTotalStake = totalStakedAtFundBlockForClaimer - _totalLockedForSP;
        uint totalStakedAtFundBlock = stakingContract.totalStakedAt(currentRound.fundBlock);

        // Calculate claimer rewards
        uint rewardsForClaimer = (
          claimerTotalStake.mul(fundingAmount)
        ).div(totalStakedAtFundBlock);

        require(
            audiusToken.mint(address(this), rewardsForClaimer),
            "New tokens must be minted");

        // Approve token transfer to staking contract address
        audiusToken.approve(stakingAddress, rewardsForClaimer);

        // Transfer rewards
        stakingContract.stakeRewards(rewardsForClaimer, _claimer);

        // Update round claim value
        currentRound.totalClaimedInRound += rewardsForClaimer;

        // Update round claim value
        uint newTotal = stakingContract.totalStakedFor(_claimer);

        emit ClaimProcessed(
            _claimer,
            rewardsForClaimer,
            totalStakedAtFundBlockForClaimer,
            newTotal
        );

        return newTotal;
    }

    function updateFundingAmount(uint _newAmount)
    external returns (uint newAmount)
    {
        require(
            msg.sender == controllerAddress,
            "UpdateFundingAmount only accessible from controllerAddress"
        );
        fundingAmount = _newAmount;
        return _newAmount;
    }

    function claimPending(address _sp) external view returns (bool pending) {
        uint lastClaimedForSP = Staking(
            registry.getContract(stakingProxyOwnerKey)
        ).lastClaimedFor(_sp);
        return (lastClaimedForSP < currentRound.fundBlock);
    }

    function updateFundingRoundBlockDiff(uint _newFundingRoundBlockDiff) external {
        require(
            msg.sender == controllerAddress,
            "Only accessible from controllerAddress"
        );
        fundingRoundBlockDiff = _newFundingRoundBlockDiff;
    }
}
