pragma solidity ^0.5.0;


/** @title The interface for contracts to interact with the Audius User contract */
interface UserFactoryInterface {
  function callerOwnsUser(address _caller, uint _userId) external view;

  function getUser(uint _id) external view returns (
    address wallet,
    bytes16 handle);

  function userExists(uint _id) external view returns (bool exists);
}
