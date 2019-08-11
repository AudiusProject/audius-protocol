pragma solidity ^0.5.0;


/// @title The interface for contracts to interact with the Audius TrackStorage contract
interface TrackStorageInterface {
  function getTrack(uint _trackId) external view returns (
    uint trackOwnerId,
    bytes32 multihashDigest,
    uint8 multihashHashFn,
    uint8 multihashSize);

  function addTrack(
    uint _trackOwnerId,
    bytes32 _multihashDigest,
    uint8 _multihashHashFn,
    uint8 _multihashSize) external returns (uint newTrackId);

  function updateTrack(
    uint _trackId,
    uint _trackOwnerId,
    bytes32 _multihashDigest,
    uint8 _multihashHashFn,
    uint8 _multihashSize) external returns (bool updatePerformed);

  function trackExists(uint _id) external view returns (bool exists);

}
