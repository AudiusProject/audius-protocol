// Reference
// https://github.com/aragon/staking/blob/0840eac0929775e58dce87914aca2a49bf552c2c/contracts/ERCStaking.sol
pragma solidity ^0.5.0;

// Modified interface for ERC900: https://eips.ethereum.org/EIPS/eip-900
// Eliminates direct stake operations
interface StakingInterface {
    event Staked(address indexed user, uint256 amount, uint256 total);
    event Unstaked(address indexed user, uint256 amount, uint256 total);

    function stakeFor(address user, uint256 amount) external;
    function unstakeFor(address user, uint256 amount) external;

    function stakeRewards(uint256 amount, address stakerAccount) external;
    function delegateStakeFor(
        address accountAddress,
        address delegatorAddress,
        uint256 amount) external;
    function undelegateStakeFor(
        address accountAddress,
        address delegatorAddress,
        uint256 amount) external;
    function slash(uint256 amount, address slashAddress) external;


    function totalStakedFor(address addr) external view returns (uint256);
    function totalStaked() external view returns (uint256);
    function token() external view returns (address);

    function supportsHistory() external pure returns (bool);

    function lastStakedFor(address addr) external view returns (uint256);
    function totalStakedForAt(address addr, uint256 blockNumber) external view returns (uint256);
    function totalStakedAt(uint256 blockNumber) external view returns (uint256);
    function lastClaimedFor(address addr) external view returns (uint256);
}
