pragma solidity ^0.5.0;
import "../service/registry/RegistryContract.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC20/SafeERC20.sol";
import "../staking/Staking.sol";


// TEST ONLY MOCK CONTRACT
// Forwards basic staking functions
contract MockStakingCaller is RegistryContract {
    using SafeERC20 for ERC20;
    Staking staking = Staking(0);
    ERC20 internal stakingToken;
    address stakingAddress;

    constructor(
      address _stakingAddress,
      address _tokenAddress
    ) public {
        stakingAddress = _stakingAddress;
        staking = Staking(_stakingAddress);
        stakingToken = ERC20(_tokenAddress);
    }

    // Test only function
    function testStakeRewards(
        uint _amount,
        address _staker
    ) external {
      // pull tokens into contract
      stakingToken.safeTransferFrom(msg.sender, address(this), _amount);
      // Approve transfer
      stakingToken.approve(stakingAddress, _amount);
      // Stake rewards
      staking.stakeRewards(_amount, _staker);
    }
}

