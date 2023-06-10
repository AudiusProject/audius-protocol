pragma solidity ^0.5.0;

import "../registry/RegistryContract.sol";
import "../interface/RegistryInterface.sol";


/**
 * @title The persistent storage for Audius social features
 *
 * @notice Repost actions are stored on-chain as they will involve payment,
 * while follow actions will not.
 */
contract SocialFeatureStorage is RegistryContract {

    bytes32 constant CALLER_REGISTRY_KEY = "SocialFeatureFactory";

    RegistryInterface registry = RegistryInterface(0);

    /**
     * @dev - Mapping of track repost contents
     * userId -> <trackId -> repostedTrack>
     */
    mapping(uint => mapping(uint => bool)) private userTrackReposts;

    /**
     * @dev - Mapping of playlist repost contents
     * userId -> <playlistId -> repostedPlaylist>
     */
    mapping(uint => mapping(uint => bool)) private userPlaylistReposts;

    constructor(address _registryAddress) public {
        require(
            _registryAddress != address(0x00),
            "Requires non-zero _registryAddress");
        registry = RegistryInterface(_registryAddress);
    }

    function addTrackRepost(
        uint _userId,
        uint _trackId
    ) external onlyRegistrant(CALLER_REGISTRY_KEY)
    {
        userTrackReposts[_userId][_trackId] = true;
    }

    function deleteTrackRepost(
        uint _userId,
        uint _trackId
    ) external onlyRegistrant(CALLER_REGISTRY_KEY)
    {
        userTrackReposts[_userId][_trackId] = false;
    }

    function userRepostedTrack(uint _userId, uint _trackId)
    external view onlyRegistrant(CALLER_REGISTRY_KEY) returns (bool)
    {
        return userTrackReposts[_userId][_trackId];
    }

    function addPlaylistRepost(
        uint _userId,
        uint _playlistId
    ) external onlyRegistrant(CALLER_REGISTRY_KEY)
    {
        userPlaylistReposts[_userId][_playlistId] = true;
    }

    function deletePlaylistRepost(
        uint _userId,
        uint _playlistId
    ) external onlyRegistrant(CALLER_REGISTRY_KEY)
    {
        userPlaylistReposts[_userId][_playlistId] = false;
    }

    function userRepostedPlaylist(uint _userId, uint _playlistId)
    external view onlyRegistrant(CALLER_REGISTRY_KEY) returns (bool)
    {
        return userPlaylistReposts[_userId][_playlistId];
    }
}
