pragma solidity ^0.5.0;

import "../Staking.sol";


contract StakingUpgraded is Staking {
    function newFunction() public pure returns (uint) {
        return 5;
    }
}
