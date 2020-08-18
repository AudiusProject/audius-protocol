pragma solidity ^0.5.0;
import "../InitializableV2.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/SafeERC20.sol";
import "../Staking.sol";
import "../AudiusAdminUpgradeabilityProxy.sol";


// TEST ONLY MOCK CONTRACT
// Forwards basic staking functions
// Forwards ServiceProviderFactory functions as well
contract MockStakingCaller is InitializableV2 {
    using SafeERC20 for ERC20;

    uint256 max;
    uint256 min;

    Staking staking = Staking(0);
    ERC20 internal stakingToken;
    address payable stakingAddress;

    bool withinBounds;

    function initialize(
        address payable _stakingAddress,
        address _tokenAddress
    ) public initializer {
        stakingAddress = _stakingAddress;
        staking = Staking(_stakingAddress);
        stakingToken = ERC20(_tokenAddress);
        // Configure test max = 1 million AUD
        max = 1000000 * 10**uint256(18);
        // Configure test min = 10 AUD
        min = 10 * 10**uint256(18);
        InitializableV2.initialize();
        withinBounds = true;
    }

    // Test only function
    function stakeRewards(
        uint256 _amount,
        address _staker
    ) external {
        _requireIsInitialized();

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
        uint256 _amount
    ) external {
        _requireIsInitialized();

        staking.stakeFor(_accountAddress, _amount);
    }

    // Test only function
    function unstakeFor(
        address _accountAddress,
        uint256 _amount
    ) external {
        _requireIsInitialized();

        staking.unstakeFor(_accountAddress, _amount);
    }

    function slash(
        uint256 _amount,
        address _slashAddress
    ) external {
        _requireIsInitialized();

        staking.slash(_amount, _slashAddress);
    }

    function updateBounds(bool _withinBounds) external {
        withinBounds = _withinBounds;
    }

    /// @notice Calculate the stake for an account based on total number of registered services
    function getServiceProviderDetails(address)
    external view returns (
        uint256 deployerStake,
        uint256 deployerCut,
        bool validBounds,
        uint256 numberOfEndpoints,
        uint256 minAccountStake,
        uint256 maxAccountStake)
    {
        _requireIsInitialized();

        return (0, 0, withinBounds, 1, min, max);
    }

    function isInitialized() external view returns (bool) {
        return _isInitialized();
    }

    function configurePermissions() external {
        _requireIsInitialized();

        staking.setClaimsManagerAddress(address(this));
        staking.setServiceProviderFactoryAddress(address(this));
        staking.setDelegateManagerAddress(address(this));
        staking.setGovernanceAddress(address(this));
    }

    /// Governance mock functions
    function upgradeStakingTo(address _newImplementation) external {
        _requireIsInitialized();

        return AudiusAdminUpgradeabilityProxy(stakingAddress).upgradeTo(_newImplementation);
    }

    function setStakingAudiusProxyAdminAddress(address _governanceAddress) external {
        _requireIsInitialized();

        return AudiusAdminUpgradeabilityProxy(
            stakingAddress
        ).setAudiusProxyAdminAddress(_governanceAddress);
    }

    /// @notice Used to check if is governance contract before setting governance address in other contracts
    function isGovernanceAddress() external pure returns (bool) {
        return true;
    }

    /// @notice Used to intentionally generate a function signature clash with AudiusAdminUpgradeabilityProxy
    ///         Returns current address instead of proxy admin address
    function getAudiusProxyAdminAddress() external view returns (address) {
        return address(this);
    }
}

