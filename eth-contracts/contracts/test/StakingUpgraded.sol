pragma solidity ^0.5.0;

import "../Staking.sol";


contract StakingUpgraded is Staking {
    function newFunction() public view returns (uint) {
        _requireIsInitialized();

        return 5;
    }
}
