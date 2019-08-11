pragma solidity ^0.5.0;


/// @title The interface for contracts to interact with the Audius Playlist contract
interface PlaylistFactoryInterface {
  function callerOwnsPlaylist(address _caller, uint _playlistId) external view;

  function playlistExists(uint _playlistId) external view returns (bool exists);
}
