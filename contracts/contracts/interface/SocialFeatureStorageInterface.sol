pragma solidity ^0.5.0;


/// @title The interface for contracts to interact with the Audius Social Feature Storage contract
interface SocialFeatureStorageInterface {
  function addTrackRepost(
    uint _userId,
    uint _trackId) external;

  function deleteTrackRepost(
    uint _userId,
    uint _trackId) external;

  function userRepostedTrack(
    uint _userId,
    uint _trackId) external view returns (bool reposted);

  function addPlaylistRepost(
    uint _userId,
    uint _playlistId) external;

  function deletePlaylistRepost(
    uint _userId,
    uint _playlistId) external;

  function userRepostedPlaylist(
    uint _userId,
    uint _playlistId) external view returns (bool reposted);
}
