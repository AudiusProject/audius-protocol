pragma solidity ^0.5.0;
import "../staking/Staking.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Mintable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";

// WORKING CONTRACT
// Designed to automate claim funding, minting tokens as necessary
contract ClaimFactory {
  // standard - imitates relationship between Ether and Wei
  uint8 private constant DECIMALS = 18;

  address tokenAddress;
  address stakingAddress;

  // Claim related configurations
  uint claimBlockDiff = 10;
  uint lastClaimBlock = 0;

  // 100 AUD
  uint fundingAmount = 100 * 10**uint256(DECIMALS); 

  // Staking contract ref
  ERC20Mintable internal audiusToken;

  constructor(
    address _tokenAddress, 
    address _stakingAddress
  ) public {
    tokenAddress = _tokenAddress;
    stakingAddress = _stakingAddress;
    audiusToken = ERC20Mintable(tokenAddress);
    // Allow a claim to be funded initially by subtracting the configured difference
    lastClaimBlock = block.number - claimBlockDiff;
  }

  function getClaimBlockDifference() 
  external view returns (uint claimBlockDifference) {
    return (claimBlockDiff);
  }

  function getLastClaimedBlock()
  external view returns (uint lastClaimedBlock) {
    return (lastClaimBlock);
  }

  function getFundsPerClaim()
  external view returns (uint amount) {
    return (fundingAmount);
  }

  function initiateClaim() external {
    require(
      block.number - lastClaimBlock > claimBlockDiff,
      'Required block difference not met');

    bool minted = audiusToken.mint(address(this), fundingAmount);
    require(minted, 'New tokens must be minted');

    // Approve token transfer to staking contract address
    audiusToken.approve(stakingAddress, fundingAmount);

    // Fund staking contract with proceeds
    Staking stakingContract = Staking(stakingAddress);
    stakingContract.fundNewClaim(fundingAmount);

    // Increment by claim difference
    // Ensures funding of claims is repeatable given the right block difference
    lastClaimBlock = lastClaimBlock + claimBlockDiff;
  }
}
