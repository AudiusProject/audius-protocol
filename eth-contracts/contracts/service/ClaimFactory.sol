pragma solidity ^0.5.0;
import "../staking/Staking.sol";
import "./registry/RegistryContract.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Mintable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "./interface/registry/RegistryInterface.sol";


// WORKING CONTRACT
// Designed to automate claim funding, minting tokens as necessary
contract ClaimFactory is RegistryContract {
    using SafeMath for uint256;
    RegistryInterface registry = RegistryInterface(0);
    // standard - imitates relationship between Ether and Wei
    uint8 private constant DECIMALS = 18;

    address tokenAddress;
    bytes32 stakingProxyOwnerKey;

    // Claim related configurations
    uint fundRoundBlockDiff = 10;
    uint fundBlock = 0;

    // 20 AUD
    // TODO: Make this modifiable based on total staking pool?
    uint fundingAmount = 20 * 10**uint256(DECIMALS); // 100 * 10**uint256(DECIMALS);

    // Denotes current round
    uint roundNumber = 0;

    // Total claimed so far in round
    uint totalClaimedInRound = 0;

    // Staking contract ref
    ERC20Mintable internal audiusToken;

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

    constructor(
      address _tokenAddress,
      address _registryAddress,
      bytes32 _stakingProxyOwnerKey
    ) public {
        tokenAddress = _tokenAddress;
        stakingProxyOwnerKey = _stakingProxyOwnerKey;
        audiusToken = ERC20Mintable(tokenAddress);
        registry = RegistryInterface(_registryAddress);
        // Allow a claim to be funded initially by subtracting the configured difference
        fundBlock = 0;
    }

    function getFundingRoundBlockDiff()
    external view returns (uint blockDiff)
    {
        return fundRoundBlockDiff;
    }

    function getLastFundBlock()
    external view returns (uint lastFundBlock)
    {
        return fundBlock;
    }

    function getFundsPerRound()
    external view returns (uint amount)
    {
        return fundingAmount;
    }

    function getTotalClaimedInRound()
    external view returns (uint claimedAmount)
    {
        return totalClaimedInRound;
    }

    // Start a new funding round
    // TODO: Permission caller to contract deployer or governance contract
    function initiateRound() external {
        require(
            block.number - fundBlock > fundRoundBlockDiff,
            "Required block difference not met");
        fundBlock = block.number;
        totalClaimedInRound = 0;
        roundNumber += 1;

        emit RoundInitiated(
            fundBlock,
            roundNumber,
            fundingAmount
        );
    }

    // TODO: Name this function better
    // TODO: Permission caller
    // TODO: Add parameter for locked funds, this will be subtracted in reards calculation
    function processClaim(
      address _claimer,
      uint _totalLockedForSP
    ) external returns (uint newAccountTotal) {
        address stakingAddress = registry.getContract(stakingProxyOwnerKey);
        Staking stakingContract = Staking(stakingAddress);
        // Prevent duplicate claim
        uint lastUserClaimBlock = stakingContract.lastClaimedFor(_claimer);
        require(lastUserClaimBlock <= fundBlock, "Claim already processed for user");
        uint totalStakedAtFundBlockForClaimer = stakingContract.totalStakedForAt(
            _claimer,
            fundBlock);

        // Subtract total locked amount for SP from stake at fund block
        uint claimerTotalStake = totalStakedAtFundBlockForClaimer - _totalLockedForSP;
        uint totalStakedAtFundBlock = stakingContract.totalStakedAt(fundBlock);

        // Calculate claimer rewards
        // TODO: Determine whether claimerTotalStake has to be adjusted by locked amount
        uint rewardsForClaimer = (
          claimerTotalStake.mul(fundingAmount)
        ).div(totalStakedAtFundBlock);

        bool minted = audiusToken.mint(address(this), rewardsForClaimer);
        require(minted, "New tokens must be minted");

        // Approve token transfer to staking contract address
        audiusToken.approve(stakingAddress, rewardsForClaimer);

        // Transfer rewards
        stakingContract.stakeRewards(rewardsForClaimer, _claimer);

        // Update round claim value
        totalClaimedInRound += rewardsForClaimer;

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

    function claimPending(address _sp) external view returns (bool pending) {
        address stakingAddress = registry.getContract(stakingProxyOwnerKey);
        Staking stakingContract = Staking(stakingAddress);
        uint lastClaimedForSP = stakingContract.lastClaimedFor(_sp);
        return (lastClaimedForSP < fundBlock);
    }
}
