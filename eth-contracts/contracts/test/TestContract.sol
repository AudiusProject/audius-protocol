pragma solidity ^0.5.0;

import "../service/registry/RegistryContract.sol";
import "../service/interface/registry/RegistryInterface.sol";


/** Simple test RegistryContract w/o storage */
contract TestContract is RegistryContract {

    RegistryInterface registry = RegistryInterface(0);

    uint public x = 1;

    function initialize(address _registryAddress) public initializer {
        require(
            _registryAddress != address(0x00),
            "Requires non-zero _registryAddress"
        );
        registry = RegistryInterface(_registryAddress);

        RegistryContract.initialize();
    }

    function setX(uint _x) external {
        _requireIsInitialized();

        x = _x;
    }
}
