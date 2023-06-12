pragma solidity ^0.5.0;


/// @title The interface for contracts to interact with the Audius User Storage contract
interface UserStorageInterface {

  function addUser(
    address _wallet,
    bytes16 _handle,
    bytes16 _handleLower
  ) external returns (uint newUserId);

  function getUser(uint _id) external view returns (
    address wallet,
    bytes16 handle
  );

  function userExists(uint _id) external view returns (bool exists);

  function handleIsTaken(bytes16 _handle) external view returns (bool isTaken);
}
