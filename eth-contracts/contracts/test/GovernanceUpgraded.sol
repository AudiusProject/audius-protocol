pragma solidity ^0.5.0;

import "../Governance.sol";


contract GovernanceUpgraded is Governance {
    function newFunction() public pure returns (uint256) {
        return 5;
    }
}