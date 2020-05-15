pragma solidity ^0.5.0;

import "../staking/Staking.sol";


contract StakingUpgraded is Staking {
    function newFunction() public pure returns (uint) {
        return 5;
    }
}
