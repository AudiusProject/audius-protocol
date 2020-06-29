pragma solidity ^0.5.0;

import "../Staking.sol";


contract StakingUpgraded is Staking {
    function newFunction() public pure returns (uint256) {
        return 5;
    }
}
