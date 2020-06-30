pragma solidity ^0.5.0;

import "../Governance.sol";


contract GovernanceUpgraded is Governance {
    function newFunction() public view returns (uint) {
        _requireIsInitialized();

        return 5;
    }
}