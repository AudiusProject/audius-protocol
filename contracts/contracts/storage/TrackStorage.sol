pragma solidity ^0.5.0;

import "../registry/RegistryContract.sol";
import "../interface/RegistryInterface.sol";


/// @title The persistent storage for Audius Tracks
contract TrackStorage is RegistryContract {

    bytes32 constant CALLER_REGISTRY_KEY = "TrackFactory";

    RegistryInterface registry = RegistryInterface(0);

    /** @dev - Uniquely assigned trackId, incremented for each new assignment */
    uint trackId = 1;
    /** @dev - Track userIds, key = trackId */
    mapping(uint => uint) private trackOwnerIds;
    /** @dev - Track ipfsKeys, key = trackId */
    mapping(uint => Multihash) private trackMetadataMultihashes;

    constructor(address _registryAddress) public {
        require(
            _registryAddress != address(0x00),
            "Requires non-zero _registryAddress");
        registry = RegistryInterface(_registryAddress);
    }

    function getTrack(uint _trackId)
    external view onlyRegistrant(CALLER_REGISTRY_KEY) returns (
        uint trackOwnerId,
        bytes32 multihashDigest,
        uint8 multihashHashFn,
        uint8 multihashSize
    )
    {
        Multihash memory trackMultihash = trackMetadataMultihashes[_trackId];
        return (
            trackOwnerIds[_trackId],
            trackMultihash.digest,
            trackMultihash.hashFn,
            trackMultihash.size
        );
    }

    function addTrack(
        uint _trackOwnerId,
        bytes32 _multihashDigest,
        uint8 _multihashHashFn,
        uint8 _multihashSize
    ) external onlyRegistrant(CALLER_REGISTRY_KEY) returns (uint newTrackId)
    {
        trackOwnerIds[trackId] = _trackOwnerId;
        trackMetadataMultihashes[trackId] = Multihash({
            digest: _multihashDigest,
            hashFn: _multihashHashFn,
            size: _multihashSize
        });

        newTrackId = trackId;
        trackId += 1;
        require(trackId != newTrackId, "expected incremented trackId");

        return newTrackId;
    }

    function updateTrack(
        uint _trackId,
        uint _trackOwnerId,
        bytes32 _multihashDigest,
        uint8 _multihashHashFn,
        uint8 _multihashSize
    ) external onlyRegistrant(CALLER_REGISTRY_KEY) returns (bool updatePerformed)
    {
        updatePerformed = false;
        if (trackOwnerIds[_trackId] != _trackOwnerId) {
            trackOwnerIds[_trackId] = _trackOwnerId;
        }

        if (trackMetadataMultihashes[_trackId].digest != _multihashDigest) {
            trackMetadataMultihashes[_trackId].digest = _multihashDigest;
            updatePerformed = true;
        }

        if (trackMetadataMultihashes[_trackId].hashFn != _multihashHashFn) {
            trackMetadataMultihashes[_trackId].hashFn = _multihashHashFn;
            updatePerformed = true;
        }

        if (trackMetadataMultihashes[_trackId].size != _multihashSize) {
            trackMetadataMultihashes[_trackId].size = _multihashSize;
            updatePerformed = true;
        }

        return updatePerformed;
    }

    function trackExists(uint _id) external view onlyRegistrant(CALLER_REGISTRY_KEY)
    returns (bool exists)
    {
        require(_id > 0, "invalid track ID");
        return (trackOwnerIds[_id] != 0 && trackMetadataMultihashes[_id].digest != "");
    }

}
