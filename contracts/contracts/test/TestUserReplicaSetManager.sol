pragma solidity ^0.5.0;

import "../UserReplicaSetManager.sol";


contract TestUserReplicaSetManager is UserReplicaSetManager {
    function newFunction() public pure returns (uint256) {
        return 5;
    }
}