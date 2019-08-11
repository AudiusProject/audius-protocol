pragma solidity ^0.5.0;

import "../../registry/RegistryContract.sol";
import "../../interface/RegistryInterface.sol";


contract TestStorage is RegistryContract {

    RegistryInterface registry = RegistryInterface(0);

    mapping(bytes32 => bytes32) private data;

    constructor(address _registryAddress) public {
        require(
            _registryAddress != address(0x00),
            "Requires non-zero _registryAddress"
        );
        registry = RegistryInterface(_registryAddress);
    }

    function getData(bytes32 _key) external view returns (bytes32 val) {
        return data[_key];
    }

    function addData(bytes32 _key, bytes32 _val) external {
        data[_key] = _val;
    }
}
