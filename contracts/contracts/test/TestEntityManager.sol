pragma solidity ^0.5.0;

import "../EntityManager.sol";


contract TestEntityManager is EntityManager {
    function newFunction() public pure returns (uint256) {
        return 5;
    }
}