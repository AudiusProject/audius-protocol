pragma solidity ^0.5.0;
import "../service/registry/RegistryContract.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC20/SafeERC20.sol";
import "../staking/Staking.sol";


// TEST ONLY MOCK CONTRACT
// Forwards basic staking functions
contract MockStakingCaller is RegistryContract {
    uint max;
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

        // Configure test max
        max = 100000000 * 10**uint256(18);
    }

    // Test only function
    function stakeRewards(
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

    // Test only function
    function stakeFor(
      address _accountAddress,
      uint256 _amount,
      bytes calldata _data
    ) external {
      staking.stakeFor(_accountAddress, _amount, _data);
    }

    // Test only function
    function unstakeFor(
      address _accountAddress,
      uint256 _amount,
      bytes calldata _data
    ) external {
      staking.unstakeFor(_accountAddress, _amount, _data);
    }

    /// @notice Calculate the stake for an account based on total number of registered services
    function getAccountStakeBounds(address)
    external view returns (uint minStake, uint maxStake)
    {
        return (0, max);
    }
}

