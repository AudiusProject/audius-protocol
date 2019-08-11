pragma solidity ^0.5.0;

import "../registry/RegistryContract.sol";
import "../interface/RegistryInterface.sol";
import "../interface/test/TestStorageInterface.sol";


/**
* Simple registryContract w/ decoupled storage feature for test purposes
*/
contract TestContractWithStorage is RegistryContract {

    RegistryInterface registry = RegistryInterface(0);
    address testStorageAddress = address(0x00);

    event NewData(bytes32 _key, bytes32 _val);

    constructor(address _registryAddress, bytes32 _testStorageRegistryKey) public {
        require(
            _registryAddress != address(0x00) &&
            _testStorageRegistryKey.length != 0,
            "Requires non-zero _registryAddress, non-empty _testStorageRegistryKey"
        );
        registry = RegistryInterface(_registryAddress);
        setStorageAddress(_testStorageRegistryKey);
    }

    function getData(bytes32 _key) external view returns (bytes32 val) {
        TestStorageInterface testStorage = TestStorageInterface(testStorageAddress);
        return testStorage.getData(_key);
    }

    function addData(bytes32 _key, bytes32 _val) public {
        TestStorageInterface testStorage = TestStorageInterface(testStorageAddress);
        testStorage.addData(_key, _val);
        emit NewData(_key, _val);
    }

    // TODO - onlyOwner
    function setStorageAddress(bytes32 _testStorageRegistryKey) internal {
        testStorageAddress = registry.getContract(_testStorageRegistryKey);
    }

}
