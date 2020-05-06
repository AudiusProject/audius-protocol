pragma solidity ^0.5.0;
import "../service/registry/RegistryContract.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/SafeERC20.sol";
import "../staking/Staking.sol";


// TEST ONLY MOCK CONTRACT
// Forwards basic staking functions
// Forwards ServiceProviderFactory functions as well
contract MockStakingCaller is RegistryContract {
    uint max;
    using SafeERC20 for ERC20;
    Staking staking = Staking(0);
    ERC20 internal stakingToken;
    address stakingAddress;

    function initialize(
        address _stakingAddress,
        address _tokenAddress
    ) public initializer {
        stakingAddress = _stakingAddress;
        staking = Staking(_stakingAddress);
        stakingToken = ERC20(_tokenAddress);
        // Configure test max
        max = 100000000 * 10**uint256(18);
        RegistryContract.initialize();
    }

    // Test only function
    function stakeRewards(
        uint _amount,
        address _staker
    ) external {
        requireIsInitialized();
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
        requireIsInitialized();
        staking.stakeFor(_accountAddress, _amount, _data);
    }

    // Test only function
    function unstakeFor(
        address _accountAddress,
        uint256 _amount,
        bytes calldata _data
    ) external {
        requireIsInitialized();
        staking.unstakeFor(_accountAddress, _amount, _data);
    }

    function slash(
        uint256 _amount,
        address _slashAddress
    ) external {
        requireIsInitialized();
        staking.slash(_amount, _slashAddress);
    }

    /// @notice Calculate the stake for an account based on total number of registered services
    function getServiceProviderDetails(address)
    external view returns (
        uint deployerStake,
        uint deployerCut,
        bool validBounds,
        uint numberOfEndpoints,
        uint minAccountStake,
        uint maxAccountStake)
    {
        return (0, 0, true, 0, 0, max);
    }
}

