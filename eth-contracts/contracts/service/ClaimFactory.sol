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
        fundBlock = block.number - fundRoundBlockDiff;
    }

    function getClaimBlockDifference()
    external view returns (uint claimBlockDifference)
    {
        return (fundRoundBlockDiff);
    }

    function getLastFundBlock()
    external view returns (uint lastFundBlock)
    {
        return (fundBlock);
    }

    function getFundsPerRound()
    external view returns (uint amount)
    {
        return (fundingAmount);
    }

    // Start a new funding round
    function initiateRound() external {
        require(
            block.number - fundBlock > fundRoundBlockDiff,
            "Required block difference not met");

        // TODO: Permission caller to contract deployer or governance contract
        fundBlock = block.number;

        totalClaimedInRound = 0;
    }

    // TODO: Name this function better
    function processClaim(address _claimer) external returns (uint newAccountTotal) {
        // TODO: Check account last claim block and confirm is before round initiated
        address stakingAddress = registry.getContract(stakingProxyOwnerKey);
        Staking stakingContract = Staking(stakingAddress);
        uint lastUserClaimBlock = stakingContract.lastClaimedFor(_claimer);
        require(lastUserClaimBlock <= fundBlock, 'Claim already processed for user');

        uint totalStakedAtFundBlockForClaimer = stakingContract.totalStakedForAt(_claimer, fundBlock);
        uint totalStakedAtFundBlock = stakingContract.totalStakedAt(fundBlock);
        uint rewardsForClaimer = (
          totalStakedAtFundBlockForClaimer.mul(fundingAmount)
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
        return stakingContract.totalStakedFor(_claimer);
    }
}
