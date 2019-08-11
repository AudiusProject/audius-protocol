pragma solidity ^0.5.0;


/// @title The interface for contracts to interact with the Audius Track contract
interface TrackFactoryInterface {
  function callerOwnsTrack(address _caller, uint _trackId) external view;

  function getTrack(uint _id) external view returns (
    uint trackOwnerId,
    bytes32 multihashDigest,
    uint8 multihashHashFn,
    uint8 multihashSize);

  function trackExists(uint _id) external view returns (bool exists);
}
