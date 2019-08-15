// Reference
// https://github.com/aragon/staking/blob/0840eac0929775e58dce87914aca2a49bf552c2c/contracts/ERCStaking.sol
pragma solidity ^0.5.0;

// Interface for ERC900: https://eips.ethereum.org/EIPS/eip-900
interface ERCStaking {
    event Staked(address indexed user, uint256 amount, uint256 total, bytes data);
    event Unstaked(address indexed user, uint256 amount, uint256 total, bytes data);

    function stake(uint256 amount, bytes calldata data) external;
    function stakeFor(address user, uint256 amount, bytes calldata data) external;
    function unstake(uint256 amount, bytes calldata data) external;

    function totalStakedFor(address addr) external view returns (uint256);
    function totalStaked() external view returns (uint256);
    function token() external view returns (address);

    function supportsHistory() external pure returns (bool);
}

interface ERCStakingHistory {
    function lastStakedFor(address addr) external view returns (uint256);
    function totalStakedForAt(address addr, uint256 blockNumber) external view returns (uint256);
    function totalStakedAt(uint256 blockNumber) external view returns (uint256);
}
