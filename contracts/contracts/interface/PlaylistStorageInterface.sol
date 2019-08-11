pragma solidity ^0.5.0;


/// @title The interface for contracts to interact with the Audius PlaylistStorage contract
interface PlaylistStorageInterface {
  function createPlaylist(
    uint _userId,
    bool _isAlbum,
    uint[] calldata _trackIds) external returns (uint newPlaylistId);

  function addPlaylistTrack(
    uint _playlistId,
    uint _addedTrackId) external;

  function deletePlaylistTrack(
    uint _playlistId,
    uint _deletedTrackId) external;

  function getPlaylistOwner(uint _playlistId) external view returns (uint playlistOwnerId);

  function isTrackInPlaylist(
    uint _playlistId,
    uint _trackId) external view returns (bool trackInPlaylist);

  function playlistExists(uint _playlistId) external view returns (bool exists);
}

