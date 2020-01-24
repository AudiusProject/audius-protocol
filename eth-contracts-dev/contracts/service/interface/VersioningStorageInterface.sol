pragma solidity ^0.5.0;


/// @title The interface for contracts to interact with the Audius Version Storage contract
interface VersioningStorageInterface {

  function setServiceVersion(
    bytes32 _serviceType,
    bytes32 _serviceVersion
  ) external;

  function getVersion(
    bytes32 _serviceType,
    uint _versionIndex
  ) external view returns (bytes32 version);

  function getCurrentVersion(bytes32 _serviceType)
  external view returns (bytes32 version);

  function getNumberOfVersions(bytes32 _serviceType)
  external view returns (uint);
}
