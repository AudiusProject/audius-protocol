pragma solidity ^0.5.0;

import "../registry/RegistryContract.sol";
import "../interface/RegistryInterface.sol";


/**
* Simple registryContract for test purposes
*/
contract TestContract is RegistryContract {

    RegistryInterface registry = RegistryInterface(0);

    uint public x = 1;

    constructor(address _registryAddress) public {
        require(
            _registryAddress != address(0x00),
            "Requires non-zero _registryAddress"
        );
        registry = RegistryInterface(_registryAddress);
    }

    function setX(uint _x) external {
        x = _x;
    }
}
