pragma solidity ^0.5.0;

import "./interface/UserFactoryInterface.sol";
import "./registry/RegistryContract.sol";
import "./interface/TrackStorageInterface.sol";
import "./interface/RegistryInterface.sol";
import "./SigningLogic.sol";


/** @title Contract responsible for managing track business logic */
contract TrackFactory is RegistryContract, SigningLogic {

    RegistryInterface registry = RegistryInterface(0);
    bytes32 userFactoryRegistryKey;
    bytes32 trackStorageRegistryKey;

    event NewTrack(
        uint _id,
        uint _trackOwnerId,
        bytes32 _multihashDigest,
        uint8 _multihashHashFn,
        uint8 _multihashSize
    );
    event UpdateTrack(
        uint _trackId,
        uint _trackOwnerId,
        bytes32 _multihashDigest,
        uint8 _multihashHashFn,
        uint8 _multihashSize
    );
    event TrackDeleted(uint _trackId);

    bytes32 constant ADD_TRACK_REQUEST_TYPEHASH = keccak256(
        "AddTrackRequest(uint trackOwnerId,bytes32 multihashDigest,uint8 multihashHashFn,uint8 multihashSize,bytes32 nonce)"
    );
    bytes32 constant UPDATE_TRACK_REQUEST_TYPEHASH = keccak256(
        "UpdateTrackRequest(uint trackId,uint trackOwnerId,bytes32 multihashDigest,uint8 multihashHashFn,uint8 multihashSize,bytes32 nonce)"
    );
    bytes32 constant DELETE_TRACK_REQUEST_TYPEHASH = keccak256(
        "DeleteTrackRequest(uint trackId,bytes32 nonce)"
    );

    /**
    * @notice Sets registry address and user factory and track storage keys
    */
    constructor(
        address _registryAddress,
        bytes32 _trackStorageRegistryKey,
        bytes32 _userFactoryRegistryKey,
        uint _networkId
    ) SigningLogic("Track Factory", "1", _networkId) public {
        require(
            _registryAddress != address(0x00) &&
            _trackStorageRegistryKey.length != 0 && _userFactoryRegistryKey.length != 0,
            "requires non-zero _registryAddress, non-empty _trackStorageRegistryKey, non-empty _userFactoryRegistryKey"
        );
        registry = RegistryInterface(_registryAddress);
        userFactoryRegistryKey = _userFactoryRegistryKey;
        trackStorageRegistryKey = _trackStorageRegistryKey;
    }

    function trackExists(uint _id) external view returns (bool exists) {
        return TrackStorageInterface(
            registry.getContract(trackStorageRegistryKey)
        ).trackExists(_id);
    }

    /**
    * @notice adds a new track to TrackStorage
    * @param _trackOwnerId - id of the track's owner from the UserFactory
    * @param _multihashDigest - metadata multihash digest
    * @param _multihashHashFn - hash function used to generate multihash
    * @param _multihashSize - size of digest
    * TODO(roneilr): stop saving multihash information to chain (wasteful of gas)
    */
    function addTrack(
        uint _trackOwnerId,
        bytes32 _multihashDigest,
        uint8 _multihashHashFn,
        uint8 _multihashSize,
        bytes32 _nonce,
        bytes calldata _subjectSig
    ) external returns (uint)
    {
        bytes32 signatureDigest = generateAddTrackRequestSchemaHash(
            _trackOwnerId,
            _multihashDigest,
            _multihashHashFn,
            _multihashSize,
            _nonce
        );
        address signer = recoverSigner(signatureDigest, _subjectSig);
        burnSignatureDigest(signatureDigest, signer);
        UserFactoryInterface(
            registry.getContract(userFactoryRegistryKey)
        ).callerOwnsUser(signer, _trackOwnerId);    // will revert if false

        uint trackId = TrackStorageInterface(
            registry.getContract(trackStorageRegistryKey)
        ).addTrack(_trackOwnerId, _multihashDigest, _multihashHashFn, _multihashSize);

        emit NewTrack(
            trackId,
            _trackOwnerId,
            _multihashDigest,
            _multihashHashFn,
            _multihashSize
        );
        return trackId;
    }

    /**
    * @notice Updates an existing track in TrackStorage
    * @param _trackId - id of track to update
    * @param _trackOwnerId - id of the track's creator from the CreatorFactory
    * @param _multihashDigest - metadata multihash digest
    * @param _multihashHashFn - hash function used to generate multihash
    * @param _multihashSize - size of digest
    */
    function updateTrack(
        uint _trackId,
        uint _trackOwnerId,
        bytes32 _multihashDigest,
        uint8 _multihashHashFn,
        uint8 _multihashSize,
        bytes32 _nonce,
        bytes calldata _subjectSig
    ) external returns (bool)
    {
        bytes32 signatureDigest = generateUpdateTrackRequestSchemaHash(
            _trackId,
            _trackOwnerId,
            _multihashDigest,
            _multihashHashFn,
            _multihashSize,
            _nonce
        );
        address signer = recoverSigner(signatureDigest, _subjectSig);
        burnSignatureDigest(signatureDigest, signer);
        this.callerOwnsTrack(signer, _trackId); // will revert if false

        bool trackUpdated = TrackStorageInterface(
            registry.getContract(trackStorageRegistryKey)
        ).updateTrack(
            _trackId,
            _trackOwnerId,
            _multihashDigest,
            _multihashHashFn,
            _multihashSize
        );

        emit UpdateTrack(
            _trackId,
            _trackOwnerId,
            _multihashDigest,
            _multihashHashFn,
            _multihashSize
        );
        return trackUpdated;
    }

    /**
    * @notice deletes existing track given its ID
    * @notice does not delete track from storage by design
    * @param _trackId - id of track to delete
    */
    function deleteTrack(
        uint _trackId,
        bytes32 _nonce,
        bytes calldata _subjectSig
    ) external returns (bool status)
    {
        bytes32 signatureDigest = generateDeleteTrackRequestSchemaHash(_trackId, _nonce);
        address signer = recoverSigner(signatureDigest, _subjectSig);
        burnSignatureDigest(signatureDigest, signer);
        this.callerOwnsTrack(signer, _trackId); // will revert if false

        emit TrackDeleted(_trackId);
        return true;
    }

    /** @notice ensures that calling address owns track; reverts if not */
    function callerOwnsTrack(address _caller, uint _trackId) external view {
        // get user id of track owner
        (uint trackOwnerId,,,) = TrackStorageInterface(
            registry.getContract(trackStorageRegistryKey)
        ).getTrack(_trackId);

        // confirm caller owns track owner
        UserFactoryInterface(
            registry.getContract(userFactoryRegistryKey)
        ).callerOwnsUser(_caller, trackOwnerId);    // will revert if false
    }

    /**
    * @notice returns the user and location of a track given its id
    * @param _id - id of the track
    */
    function getTrack(uint _id) external view returns (
        uint trackOwnerId, bytes32 multihashDigest, uint8 multihashHashFn, uint8 multihashSize)
    {
        return TrackStorageInterface(
            registry.getContract(trackStorageRegistryKey)
        ).getTrack(_id);
    }

    function generateAddTrackRequestSchemaHash(
        uint _trackOwnerId,
        bytes32 _multihashDigest,
        uint8 _multihashHashFn,
        uint8 _multihashSize,
        bytes32 _nonce
    ) internal view returns (bytes32)
    {
        return generateSchemaHash(
            keccak256(
                abi.encode(
                    ADD_TRACK_REQUEST_TYPEHASH,
                    _trackOwnerId,
                    _multihashDigest,
                    _multihashHashFn,
                    _multihashSize,
                    _nonce
                )
            )
        );
    }

    function generateUpdateTrackRequestSchemaHash(
        uint _trackId,
        uint _trackOwnerId,
        bytes32 _multihashDigest,
        uint8 _multihashHashFn,
        uint8 _multihashSize,
        bytes32 _nonce
    ) internal view returns (bytes32)
    {
        return generateSchemaHash(
            keccak256(
                abi.encode(
                    UPDATE_TRACK_REQUEST_TYPEHASH,
                    _trackId,
                    _trackOwnerId,
                    _multihashDigest,
                    _multihashHashFn,
                    _multihashSize,
                    _nonce
                )
            )
        );
    }

    function generateDeleteTrackRequestSchemaHash(
        uint _trackId,
        bytes32 _nonce
    ) internal view returns (bytes32)
    {
        return generateSchemaHash(
            keccak256(
                abi.encode(
                    DELETE_TRACK_REQUEST_TYPEHASH,
                    _trackId,
                    _nonce
                )
            )
        );
    }
}
