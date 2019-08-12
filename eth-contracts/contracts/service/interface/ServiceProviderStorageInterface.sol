pragma solidity ^0.5.0;


/// @title The interface for contracts to interact with the Audius Service Provider Storage Contract
interface ServiceProviderStorageInterface {

  function register(
    bytes32 _serviceType,
    address _owner,
    string calldata _endpoint
  ) external returns (uint);

  function deregister(
    bytes32 _serviceType,
    address _owner,
    string calldata _endpoint
  ) external returns (uint deregisteredSpID);

  function getServiceProviderInfo(
    bytes32 _serviceType,
    uint _serviceId
  ) external view returns (address owner, string memory endpoint, uint blocknumber);

  function getServiceProviderIdFromEndpoint(
    bytes32 _endpoint
  ) external view returns (uint);

  function getServiceProviderIdFromAddress(
    address _ownerAddress,
    bytes32 _serviceType
  ) external view returns (uint);

  function getTotalServiceTypeProviders(
    bytes32 _serviceType
  ) external view returns (uint);
}
