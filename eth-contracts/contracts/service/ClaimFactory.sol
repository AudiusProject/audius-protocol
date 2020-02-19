pragma solidity ^0.5.0;
import "../staking/Staking.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Mintable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";

// WORKING CONTRACT
// Designed to automate claim funding, and move
contract ClaimFactory {
  // standard - imitates relationship between Ether and Wei
  uint8 private constant DECIMALS = 18;

  address tokenAddress;
  address stakingAddress;

  // Claim related configurations
  uint claimBlockDiff = 10;
  uint lastClaimBlock = 0;

  // 100 AUD
  uint fundingAmount = 100 * 10*uint256(DECIMALS); 

  // Staking contract ref
  ERC20Mintable internal audiusToken;

  constructor(
    address _tokenAddress, 
    address _stakingAddress
  ) public {
    tokenAddress = _tokenAddress;
    stakingAddress = _stakingAddress;
    audiusToken = ERC20Mintable(tokenAddress);
  }

  function getStakingAddress() external view returns (address addr) {
    return tokenAddress;
  }

  function getClaimInformation() 
  external view returns (uint lastClaimedBlock, uint claimBlockDifference, uint fundingPerClaim) {
    return (lastClaimBlock, claimBlockDiff, fundingAmount);
  }

  // TODO: Figure out why this isn't working...
  function getClaimFactoryTokens()
  public view returns (uint tokens) {
    uint numTokens = audiusToken.balanceOf(address(this));
    return numTokens;
  }

  function getTotalSupply()
  external view returns (uint supply) {
    uint numTokens = audiusToken.totalSupply();
    return numTokens;
  }

  function initiateClaim() external {
    // TODO: Update
    // - Add function based on last recorded claim block
    // - Reject based on block diff
    // - Expose pending claim info
    require(
      block.number - lastClaimBlock > claimBlockDiff,
      'Required block difference not met');

    bool minted = audiusToken.mint(address(this), fundingAmount);
    require(minted, 'New tokens must be minted');

    // Approve token transfer
    audiusToken.approve(stakingAddress, fundingAmount);

    // Fund staking contract with proceeds
    Staking stakingContract = Staking(stakingAddress);
    stakingContract.fundNewClaim(fundingAmount);

    lastClaimBlock = block.number;
  }
}
