pragma solidity ^0.5.0;

import "../InitializableV2.sol";


/** Simple test w/o storage */
contract TestContract is InitializableV2 {

    uint256 public x = 1;

    function initialize() public initializer {
        InitializableV2.initialize();
    }

    function setX(uint256 _x) external {
        _requireIsInitialized();

        x = _x;
    }
}
