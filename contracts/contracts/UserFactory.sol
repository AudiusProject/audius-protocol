pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "./interface/RegistryInterface.sol";
import "./registry/RegistryContract.sol";
import "./interface/UserStorageInterface.sol";
import "./SigningLogic.sol";


/** @title Contract responsible for managing user business logic */
contract UserFactory is RegistryContract, SigningLogic {

    RegistryInterface registry = RegistryInterface(0);
    bytes32 userStorageRegistryKey;
    address verifierAddress;

    event AddUser(uint _userId, bytes16 _handle, address _wallet);
    event UpdateMultihash(uint _userId, bytes32 _multihashDigest);
    event UpdateName(uint _userId, bytes32 _name);
    event UpdateLocation(uint _userId, bytes32 _location);
    event UpdateBio(uint _userId, string _bio);
    event UpdateProfilePhoto(uint _userId, bytes32 _profilePhotoDigest);
    event UpdateCoverPhoto(uint _userId, bytes32 _coverPhotoDigest);
    event UpdateIsCreator(uint _userId, bool _isCreator);
    event UpdateIsVerified(uint _userId, bool _isVerified);
    event UpdateCreatorNodeEndpoint(uint _userId, string _creatorNodeEndpoint);

    bytes32 constant ADD_USER_REQUEST_TYPEHASH = keccak256(
        "AddUserRequest(bytes16 handle,bytes32 nonce)"
    );
    bytes32 constant UPDATE_USER_MULTIHASH_REQUEST_TYPEHASH = keccak256(
        "UpdateUserMultihashRequest(uint userId,bytes32 newValue,bytes32 nonce)"
    );
    bytes32 constant UPDATE_USER_NAME_REQUEST_TYPEHASH = keccak256(
        "UpdateUserNameRequest(uint userId,bytes32 newValue,bytes32 nonce)"
    );
    bytes32 constant UPDATE_USER_LOCATION_REQUEST_TYPEHASH = keccak256(
        "UpdateUserLocationRequest(uint userId,bytes32 newValue,bytes32 nonce)"
    );
    bytes32 constant UPDATE_USER_BIO_REQUEST_TYPEHASH = keccak256(
        "UpdateUserBioRequest(uint userId,string newValue,bytes32 nonce)"
    );
    bytes32 constant UPDATE_USER_PROFILE_PHOTO_REQUEST_TYPEHASH = keccak256(
        "UpdateUserProfilePhotoRequest(uint userId,bytes32 newValue,bytes32 nonce)"
    );
    bytes32 constant UPDATE_USER_COVER_PHOTO_REQUEST_TYPEHASH = keccak256(
        "UpdateUserCoverPhotoRequest(uint userId,bytes32 newValue,bytes32 nonce)"
    );
    bytes32 constant UPDATE_USER_CREATOR_REQUEST_TYPEHASH = keccak256(
        "UpdateUserCreatorRequest(uint userId,bool newValue,bytes32 nonce)"
    );
    bytes32 constant UPDATE_USER_VERIFIED_REQUEST_TYPEHASH = keccak256(
        "UpdateUserVerifiedRequest(uint userId,bool newValue,bytes32 nonce)"
    );
    bytes32 constant UPDATE_USER_CREATOR_NODE_REQUEST_TYPEHASH = keccak256(
        "UpdateUserCreatorNodeRequest(uint userId,string newValue,bytes32 nonce)"
    );

    constructor(
        address _registryAddress,
        bytes32 _userStorageRegistryKey,
        uint _networkId,
        address _verifierAddress
    ) SigningLogic("User Factory", "1", _networkId) public
    {
        require(
            _registryAddress != address(0x00) &&
            _userStorageRegistryKey.length != 0,
            "requires non-zero _registryAddress, non-empty _userStorageRegistryKey"
        );
        registry = RegistryInterface(_registryAddress);
        userStorageRegistryKey = _userStorageRegistryKey;
        verifierAddress = _verifierAddress;
    }

    /** @notice ensures that calling address owns user; reverts if not */
    function callerOwnsUser(address _callerAddress, uint _userId) external view {
        address ownerAddress;
        (ownerAddress,) = UserStorageInterface(
            registry.getContract(userStorageRegistryKey)
        ).getUser(_userId);
        require(_callerAddress == ownerAddress, "Caller does not own userId");
    }

    function getUser(uint _id) external view returns (address wallet, bytes16 handle) {
        return UserStorageInterface(
            registry.getContract(userStorageRegistryKey)
        ).getUser(_id);
    }

    /**
     * @notice this should be only function that accepts owner address,
     *  to prevent creation of dead user from an invalid signature
     */
    function addUser(
        address _owner,
        bytes16 _handle,
        bytes32 _nonce,
        bytes calldata _subjectSig
    ) external returns (uint)
    {
        bytes32 _signatureDigest = generateAddUserRequestSchemaHash(_handle, _nonce);
        require(
            _owner == recoverSigner(_signatureDigest, _subjectSig),
            "Invalid signature for given user"
        );
        burnSignatureDigest(_signatureDigest, _owner);

        // ensure handle is valid and available
        bytes16 handleLower = toLower(_handle);
        require(handleIsTaken(handleLower) == false, "Handle is already taken");

        uint userId = UserStorageInterface(
            registry.getContract(userStorageRegistryKey)
        ).addUser(_owner, _handle, handleLower);

        emit AddUser(userId, _handle, _owner);

        return userId;
    }

    function updateMultihash(
        uint _userId,
        bytes32 _multihashDigest,
        bytes32 _nonce,
        bytes calldata _subjectSig
    ) external
    {
        bytes32 _signatureDigest = generateUpdateUserBytes32RequestSchemaHash(
            UPDATE_USER_MULTIHASH_REQUEST_TYPEHASH,
            _userId,
            _multihashDigest,
            _nonce
        );
        address signer = recoverSigner(_signatureDigest, _subjectSig);
        burnSignatureDigest(_signatureDigest, signer);
        this.callerOwnsUser(signer, _userId);   // will revert if false

        emit UpdateMultihash(_userId, _multihashDigest);
    }

    function updateName(
        uint _userId,
        bytes32 _name,
        bytes32 _nonce,
        bytes calldata _subjectSig
    ) external
    {
        bytes32 _signatureDigest = generateUpdateUserBytes32RequestSchemaHash(
            UPDATE_USER_NAME_REQUEST_TYPEHASH,
            _userId,
            _name,
            _nonce
        );
        address signer = recoverSigner(_signatureDigest, _subjectSig);
        burnSignatureDigest(_signatureDigest, signer);
        this.callerOwnsUser(signer, _userId);   // will revert if false

        emit UpdateName(_userId, _name);
    }

    function updateLocation(
        uint _userId,
        bytes32 _location,
        bytes32 _nonce,
        bytes calldata _subjectSig
    ) external
    {
        bytes32 _signatureDigest = generateUpdateUserBytes32RequestSchemaHash(
            UPDATE_USER_LOCATION_REQUEST_TYPEHASH,
            _userId,
            _location,
            _nonce
        );
        address signer = recoverSigner(_signatureDigest, _subjectSig);
        burnSignatureDigest(_signatureDigest, signer);
        this.callerOwnsUser(signer, _userId);   // will revert if false

        emit UpdateLocation(_userId, _location);
    }

    function updateBio(
        uint _userId,
        string calldata _bio,
        bytes32 _nonce,
        bytes calldata _subjectSig
    ) external
    {
        bytes32 _signatureDigest = generateUpdateUserStringRequestSchemaHash(
            UPDATE_USER_BIO_REQUEST_TYPEHASH,
            _userId,
            _bio,
            _nonce
        );
        address signer = recoverSigner(_signatureDigest, _subjectSig);
        burnSignatureDigest(_signatureDigest, signer);
        this.callerOwnsUser(signer, _userId);   // will revert if false

        emit UpdateBio(_userId, _bio);
    }

    function updateProfilePhoto(
        uint _userId,
        bytes32 _profilePhotoDigest,
        bytes32 _nonce,
        bytes calldata _subjectSig
    ) external
    {
        bytes32 _signatureDigest = generateUpdateUserBytes32RequestSchemaHash(
            UPDATE_USER_PROFILE_PHOTO_REQUEST_TYPEHASH,
            _userId,
            _profilePhotoDigest,
            _nonce
        );
        address signer = recoverSigner(_signatureDigest, _subjectSig);
        burnSignatureDigest(_signatureDigest, signer);
        this.callerOwnsUser(signer, _userId);   // will revert if false

        emit UpdateProfilePhoto(_userId, _profilePhotoDigest);
    }

    function updateCoverPhoto(
        uint _userId,
        bytes32 _coverPhotoDigest,
        bytes32 _nonce,
        bytes calldata _subjectSig
    ) external
    {
        bytes32 _signatureDigest = generateUpdateUserBytes32RequestSchemaHash(
            UPDATE_USER_COVER_PHOTO_REQUEST_TYPEHASH,
            _userId,
            _coverPhotoDigest,
            _nonce
        );
        address signer = recoverSigner(_signatureDigest, _subjectSig);
        burnSignatureDigest(_signatureDigest, signer);
        this.callerOwnsUser(signer, _userId);   // will revert if false

        emit UpdateCoverPhoto(_userId, _coverPhotoDigest);
    }

    function updateIsCreator(
        uint _userId,
        bool _isCreator,
        bytes32 _nonce,
        bytes calldata _subjectSig
    ) external
    {
        bytes32 _signatureDigest = generateUpdateUserBoolRequestSchemaHash(
            UPDATE_USER_CREATOR_REQUEST_TYPEHASH,
            _userId,
            _isCreator,
            _nonce
        );
        address signer = recoverSigner(_signatureDigest, _subjectSig);
        burnSignatureDigest(_signatureDigest, signer);
        this.callerOwnsUser(signer, _userId);   // will revert if false

        emit UpdateIsCreator(_userId, _isCreator);
    }

    /** @notice this function is only callable from verifier address defined at UserFactory construction */
    function updateIsVerified(
        uint _userId,
        bool _isVerified,
        bytes32 _nonce,
        bytes calldata _subjectSig
    ) external
    {
        bytes32 _signatureDigest = generateUpdateUserBoolRequestSchemaHash(
            UPDATE_USER_VERIFIED_REQUEST_TYPEHASH,
            _userId,
            _isVerified,
            _nonce
        );
        address recoveredVerifierAddress = recoverSigner(_signatureDigest, _subjectSig);
        burnSignatureDigest(_signatureDigest, recoveredVerifierAddress);
        require(verifierAddress == recoveredVerifierAddress, "Invalid signature for verifier");

        emit UpdateIsVerified(_userId, _isVerified);
    }

    function updateCreatorNodeEndpoint(
        uint _userId,
        string calldata _creatorNodeEndpoint,
        bytes32 _nonce,
        bytes calldata _subjectSig
    ) external
    {
        bytes32 _signatureDigest = generateUpdateUserStringRequestSchemaHash(
            UPDATE_USER_CREATOR_NODE_REQUEST_TYPEHASH,
            _userId,
            _creatorNodeEndpoint,
            _nonce
        );
        address signer = recoverSigner(_signatureDigest, _subjectSig);
        burnSignatureDigest(_signatureDigest, signer);
        this.callerOwnsUser(signer, _userId);   // will revert if false

        emit UpdateCreatorNodeEndpoint(_userId, _creatorNodeEndpoint);
    }

    /** @notice returns true if handle is valid and not already taken, false otherwise */
    function handleIsValid(bytes16 _handle) external view returns (bool isValid) {
        bytes16 handleLower = toLower(_handle);
        bool handleIsTaken = UserStorageInterface(
            registry.getContract(userStorageRegistryKey)
        ).handleIsTaken(handleLower);
        return (handleIsTaken == false);
    }

    /** @notice returns true if user exists for id, false otherwise */
    function userExists(uint _id) external view returns (bool exists) {
        return UserStorageInterface(
            registry.getContract(userStorageRegistryKey)
        ).userExists(_id);
    }

    /** @notice returns true if lowercased handle is already taken, false otherwise */
    function handleIsTaken(bytes16 _handleLower) internal view returns (bool exists) {
        return UserStorageInterface(
            registry.getContract(userStorageRegistryKey)
        ).handleIsTaken(_handleLower);
    }

    /**
     * @notice returns lowercased input string if possible, errors if invalid char found
     * @param _str {bytes16} bytestring to be lowercased
     * @return {bytes16 | revert} bytestring of lowercased argument
     * @dev based on: https://gist.github.com/ottodevs/c43d0a8b4b891ac2da675f825b1d1dbf
     */
    function toLower(bytes16 _str) internal pure returns (bytes16 output) {
        bytes memory bStr = bytes16ToBytes(_str);
        bytes memory bLower = bytes(bStr);

        for (uint i = 0; i < bStr.length; i++) {
            uint8 char = uint8(bStr[i]);

            // short circuit at null char, since that means all input chars
            //      have been processed; remainder is padding
            if (char == 0x00) {
                break;
            }

            // ensure each char in handle is valid
            require(handleCharIsValid(char), "invalid character found in handle");

            // check if char is uppercase
            if ((char >= uint8(65)) && (char <= uint8(90))) {
                // convert char to lowercase
                bLower[i] = bytes1(char + uint8(32));
            } else {
                bLower[i] = bStr[i];
            }
        }
        bytes16 out = bytesToBytes16(bLower);
        return out;
    }

    function bytes16ToBytes(bytes16 _input) internal pure returns (bytes memory output) {
        bytes memory b = new bytes(16);
        for (uint i = 0; i < b.length; i++) {
            b[i] = _input[i];
        }
        return b;
    }

    /**
     * @dev based on https://github.com/GNSPS/solidity-bytes-utils/blob/master/contracts/BytesLib.sol#L348
     *  and https://github.com/pouladzade/Seriality/blob/master/src/BytesToTypes.sol#L64
     */
    function bytesToBytes16(bytes memory _input) internal pure returns (bytes16 output) {
        bytes16 temp;
        assembly {
            temp := mload(add(_input, 32))
        }
        return temp;
    }

    /**
     * @notice returns true if char is valid, else false
     * @notice valid = alphanumeric or underscore (a-z, A-Z, 0-9, _)
     */
    function handleCharIsValid(uint8 char) internal pure returns (bool isValid) {
        return (
            (char >= 0x30 && char <= 0x39) ||   // 0-9
            (char >= 0x41 && char <= 0x5A) ||   // A-Z
            (char == 0x5F) ||                   // _
            (char >= 0x61 && char <= 0x7A)      // a-z
        );
    }

    function generateAddUserRequestSchemaHash(bytes16 _handle, bytes32 _nonce)
    internal view returns (bytes32)
    {
        return generateSchemaHash(
            keccak256(
                abi.encode(
                    ADD_USER_REQUEST_TYPEHASH,
                    _handle,
                    _nonce
                )
            )
        );
    }

    /* update ops */
    function generateUpdateUserBytes32RequestSchemaHash(
        bytes32 _typehash,
        uint _userId,
        bytes32 _newValue,
        bytes32 _nonce
    ) internal view returns (bytes32)
    {
        return generateSchemaHash(
            keccak256(
                abi.encode(
                    _typehash,
                    _userId,
                    _newValue,
                    _nonce
                )
            )
        );
    }

    function generateUpdateUserStringRequestSchemaHash(
        bytes32 _typehash,
        uint _userId,
        string memory _newValue,
        bytes32 _nonce
    ) internal view returns (bytes32)
    {
        return generateSchemaHash(
            keccak256(
                abi.encode(
                    _typehash,
                    _userId,
                    keccak256(bytes(_newValue)),
                    _nonce
                )
            )
        );
    }

    function generateUpdateUserBoolRequestSchemaHash(
        bytes32 _typehash,
        uint _userId,
        bool _newValue,
        bytes32 _nonce
    ) internal view returns (bytes32)
    {
        return generateSchemaHash(
            keccak256(
                abi.encode(
                    _typehash,
                    _userId,
                    _newValue,
                    _nonce
                )
            )
        );
    }
}
