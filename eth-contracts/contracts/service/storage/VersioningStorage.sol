pragma solidity ^0.5.0;

import "../registry/RegistryContract.sol";
import "../interface/registry/RegistryInterface.sol";


/** @title The persistent storage for Audius Versioning */
contract VersioningStorage is RegistryContract {

    bytes32 constant CALLER_REGISTRY_KEY = "VersioningFactory";

    RegistryInterface registry = RegistryInterface(0);

    /**
      @dev - mapping of serviceType - serviceTypeVersion
      Example - "discovery-provider" - ["0.0.1", "0.0.2", ..., "currentVersion"]
    */
    mapping(bytes32 => bytes32[]) public serviceTypeVersions;

    constructor(address _registryAddress) public {
        require(
            _registryAddress != address(0x00),
            "Requires non-zero _registryAddress");
        registry = RegistryInterface(_registryAddress);
    }

    function setServiceVersion(
        bytes32 _serviceType,
        bytes32 _serviceVersion
    ) external onlyRegistrant(CALLER_REGISTRY_KEY)
    {
        serviceTypeVersions[_serviceType].push(_serviceVersion);
    }

    function getVersion(bytes32 _serviceType, uint _versionIndex)
    external view returns (bytes32 version)
    {
        require(
            serviceTypeVersions[_serviceType].length > _versionIndex,
            "No registered version of serviceType"
        );
        return (serviceTypeVersions[_serviceType][_versionIndex]);
    }

    function getCurrentVersion(bytes32 _serviceType)
    external view returns (bytes32 currentVersion)
    {
        require(
            serviceTypeVersions[_serviceType].length >= 1,
            "No registered version of serviceType"
        );
        uint latestVersionIndex = serviceTypeVersions[_serviceType].length - 1;
        return (serviceTypeVersions[_serviceType][latestVersionIndex]);
    }

    function getNumberOfVersions(bytes32 _serviceType)
    external view returns (uint)
    {
        return serviceTypeVersions[_serviceType].length;
    }
}
