pragma solidity ^0.5.0;

import "./registry/RegistryContract.sol";
import "./interface/registry/RegistryInterface.sol";
import "./interface/VersioningStorageInterface.sol";


contract VersioningFactory is RegistryContract {

    RegistryInterface registry = RegistryInterface(0);
    bytes32 versioningStorageRegistryKey;

    address versionerAddress;
    bytes32 constant SET_SERVICE_VERSION = keccak256(
        "SetServiceVersionRequest(bytes32 serviceType,bytes32 serviceVersion,bytes32 nonce)"
    );

    event SetServiceVersion(bytes32 _serviceType, bytes32 _serviceVersion);

    constructor(
      address _registryAddress,
      bytes32 _versionStorageRegistryKey,
      address _versionerAddress
    ) public
    {
        require(
            _registryAddress != address(0x00),
            "Requires non-zero _registryAddress"
        );
        registry = RegistryInterface(_registryAddress);
        versioningStorageRegistryKey = _versionStorageRegistryKey;
        versionerAddress = _versionerAddress;
    }

    function setServiceVersion(
        bytes32 _serviceType,
        bytes32 _serviceVersion) external
    {
        require(
            versionerAddress == msg.sender,
            "Invalid signature for versioner"
        );

        uint numExistingVersions = VersioningStorageInterface(
            registry.getContract(versioningStorageRegistryKey)
        ).getNumberOfVersions(_serviceType);

        for (uint i = 0; i < numExistingVersions; i++) {
            bytes32 existingVersion = VersioningStorageInterface(
                registry.getContract(versioningStorageRegistryKey)
            ).getVersion(_serviceType, i);
            require(existingVersion != _serviceVersion, "Already registered");
        }

        VersioningStorageInterface(
            registry.getContract(versioningStorageRegistryKey)
        ).setServiceVersion(_serviceType, _serviceVersion);

        emit SetServiceVersion(_serviceType, _serviceVersion);
    }

    function getVersion(bytes32 _serviceType, uint _versionIndex)
    external view returns (bytes32 version)
    {
        return VersioningStorageInterface(
            registry.getContract(versioningStorageRegistryKey)
        ).getVersion(_serviceType, _versionIndex);
    }

    function getCurrentVersion(bytes32 _serviceType)
    external view returns (bytes32 currentVersion)
    {
        return VersioningStorageInterface(
            registry.getContract(versioningStorageRegistryKey)
        ).getCurrentVersion(_serviceType);
    }

    function getNumberOfVersions(bytes32 _serviceType)
    external view returns (uint)
    {
        return VersioningStorageInterface(
            registry.getContract(versioningStorageRegistryKey)
        ).getNumberOfVersions(_serviceType);
    }
}
