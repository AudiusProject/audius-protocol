pragma solidity ^0.5.0;

import "./interface/RegistryInterface.sol";
import "./registry/RegistryContract.sol";
import "./interface/UserFactoryInterface.sol";
import "./interface/TrackFactoryInterface.sol";
import "./interface/PlaylistFactoryInterface.sol";
import "./SigningLogic.sol";


/** @title Logic contract for Audius user library features including
* track saves and playlist/album saves */
contract UserLibraryFactory is RegistryContract, SigningLogic {

    RegistryInterface registry = RegistryInterface(0);
    bytes32 userFactoryRegistryKey;
    bytes32 trackFactoryRegistryKey;
    bytes32 playlistFactoryRegistryKey;

    event TrackSaveAdded(uint _userId, uint _trackId);
    event TrackSaveDeleted(uint _userId, uint _trackId);
    event PlaylistSaveAdded(uint _userId, uint _playlistId);
    event PlaylistSaveDeleted(uint _userId, uint _playlistId);

    /* EIP-712 saved signature generation / verification */
    bytes32 constant TRACK_SAVE_REQUEST_TYPEHASH = keccak256(
        "TrackSaveRequest(uint userId,uint trackId,bytes32 nonce)"
    );
    bytes32 constant DELETE_TRACK_SAVE_REQUEST_TYPEHASH = keccak256(
        "DeleteTrackSaveRequest(uint userId,uint trackId,bytes32 nonce)"
    );
    bytes32 constant PLAYLIST_SAVE_REQUEST_TYPEHASH = keccak256(
        "PlaylistSaveRequest(uint userId,uint playlistId,bytes32 nonce)"
    );
    bytes32 constant DELETE_PLAYLIST_SAVE_REQUEST_TYPEHASH = keccak256(
        "DeletePlaylistSaveRequest(uint userId,uint playlistId,bytes32 nonce)"
    );

    constructor(address _registryAddress,
        bytes32 _userFactoryRegistryKey,
        bytes32 _trackFactoryRegistryKey,
        bytes32 _playlistFactoryRegistryKey,
        uint _networkId
    ) SigningLogic("User Library Factory", "1", _networkId) public
    {
        require(
            _registryAddress != address(0x00) &&
            _userFactoryRegistryKey.length != 0 &&
            _trackFactoryRegistryKey.length != 0 &&
            _playlistFactoryRegistryKey.length != 0,
            "requires non-zero _registryAddress"
        );

        registry = RegistryInterface(_registryAddress);
        userFactoryRegistryKey = _userFactoryRegistryKey;
        trackFactoryRegistryKey = _trackFactoryRegistryKey;
        playlistFactoryRegistryKey = _playlistFactoryRegistryKey;
    }

    function addTrackSave(
        uint _userId,
        uint _trackId,
        bytes32 _requestNonce,
        bytes calldata _subjectSig
    ) external returns (bool status)
    {
        bytes32 signatureDigest = generateTrackSaveRequestSchemaHash(
            _userId, _trackId, _requestNonce
        );
        address signer = recoverSigner(signatureDigest, _subjectSig);
        burnSignatureDigest(signatureDigest, signer);
        UserFactoryInterface(
            registry.getContract(userFactoryRegistryKey)
        ).callerOwnsUser(signer, _userId);  // will revert if false

        bool trackExists = TrackFactoryInterface(
            registry.getContract(trackFactoryRegistryKey)
        ).trackExists(_trackId);
        require(trackExists == true, "must provide valid track ID");

        emit TrackSaveAdded(_userId, _trackId);
        return true;
    }

    function deleteTrackSave(
        uint _userId,
        uint _trackId,
        bytes32 _requestNonce,
        bytes calldata _subjectSig
    ) external returns (bool status)
    {
        bytes32 signatureDigest = generateDeleteTrackSaveRequestSchemaHash(
            _userId, _trackId, _requestNonce
        );
        address signer = recoverSigner(signatureDigest, _subjectSig);
        burnSignatureDigest(signatureDigest, signer);
        UserFactoryInterface(
            registry.getContract(userFactoryRegistryKey)
        ).callerOwnsUser(signer, _userId);  // will revert if false

        bool trackExists = TrackFactoryInterface(
            registry.getContract(trackFactoryRegistryKey)
        ).trackExists(_trackId);
        require(trackExists == true, "must provide valid track ID");

        emit TrackSaveDeleted(_userId, _trackId);
        return true;
    }

    function addPlaylistSave(
        uint _userId,
        uint _playlistId,
        bytes32 _requestNonce,
        bytes calldata _subjectSig
    ) external returns (bool status)
    {
        bytes32 signatureDigest = generatePlaylistSaveRequestSchemaHash(
            _userId, _playlistId, _requestNonce
        );
        address signer = recoverSigner(signatureDigest, _subjectSig);
        burnSignatureDigest(signatureDigest, signer);
        UserFactoryInterface(
            registry.getContract(userFactoryRegistryKey)
        ).callerOwnsUser(signer, _userId);  // will revert if false

        bool playlistExists = PlaylistFactoryInterface(
            registry.getContract(playlistFactoryRegistryKey)
        ).playlistExists(_playlistId);
        require(playlistExists == true, "must provide valid playlist ID");

        emit PlaylistSaveAdded(_userId, _playlistId);
        return true;
    }

    function deletePlaylistSave(
        uint _userId,
        uint _playlistId,
        bytes32 _requestNonce,
        bytes calldata _subjectSig
    ) external returns (bool status)
    {
        bytes32 signatureDigest = generateDeletePlaylistSaveRequestSchemaHash(
            _userId, _playlistId, _requestNonce
        );
        address signer = recoverSigner(signatureDigest, _subjectSig);
        burnSignatureDigest(signatureDigest, signer);
        UserFactoryInterface(
            registry.getContract(userFactoryRegistryKey)
        ).callerOwnsUser(signer, _userId);  // will revert if false

        bool playlistExists = PlaylistFactoryInterface(
            registry.getContract(playlistFactoryRegistryKey)
        ).playlistExists(_playlistId);
        require(playlistExists == true, "must provide valid playlist ID");

        emit PlaylistSaveDeleted(_userId, _playlistId);
        return true;
    }

    function generateDeletePlaylistSaveRequestSchemaHash(
        uint _userId,
        uint _playlistId,
        bytes32 _nonce
    ) internal view returns (bytes32)
    {
        return generateSchemaHash(
            keccak256(
                abi.encode(
                    DELETE_PLAYLIST_SAVE_REQUEST_TYPEHASH,
                    _userId,
                    _playlistId,
                    _nonce
                )
            )
        );
    }

    function generatePlaylistSaveRequestSchemaHash(
        uint _userId,
        uint _playlistId,
        bytes32 _nonce
    ) internal view returns (bytes32)
    {
        return generateSchemaHash(
            keccak256(
                abi.encode(
                    PLAYLIST_SAVE_REQUEST_TYPEHASH,
                    _userId,
                    _playlistId,
                    _nonce
                )
            )
        );
    }

    function generateDeleteTrackSaveRequestSchemaHash(
        uint _userId,
        uint _trackId,
        bytes32 _nonce
    ) internal view returns (bytes32)
    {
        return generateSchemaHash(
            keccak256(
                abi.encode(
                    DELETE_TRACK_SAVE_REQUEST_TYPEHASH,
                    _userId,
                    _trackId,
                    _nonce
                )
            )
        );
    }

    function generateTrackSaveRequestSchemaHash(
        uint _userId,
        uint _trackId,
        bytes32 _nonce
    ) internal view returns (bytes32)
    {
        return generateSchemaHash(
            keccak256(
                abi.encode(
                    TRACK_SAVE_REQUEST_TYPEHASH,
                    _userId,
                    _trackId,
                    _nonce
                )
            )
        );
    }
}
