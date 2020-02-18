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
  external view returns (uint lastClaimedBlock, uint blocksPerClaim, uint fundingPerClaim) {
    return (lastClaimBlock, blocksPerClaim, fundingAmount);
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

  // Mint amount for claim factory address 
  function mint(uint amount) external returns (bool minted) {
    return audiusToken.mint(address(this), amount);
  }
}
