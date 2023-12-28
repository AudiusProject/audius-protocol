pragma solidity ^0.5.0;


import "./SigningLogicInitializable.sol";


/** @title Contract for Audius User Data management */
contract EntityManager is SigningLogicInitializable {

    /// @notice Address permissioned to verify users
    address verifierAddress;

    event ManageEntity(
        uint _userId,
        address _signer,
        string _entityType,
        uint _entityId,
        string _metadata,
        string _action
    );

    event ManageIsVerified(
        uint _userId,
        bool _isVerified
    );

    bytes32 constant MANAGE_ENTITY_REQUEST_TYPEHASH = keccak256(
        "ManageEntity(uint userId,string entityType,uint entityId,string action,string metadata,bytes32 nonce)"
    );

    function initialize(
        address _verifierAddress,
        uint _chainId
    ) public initializer
    {
        require(
            _verifierAddress != address(0x00),
            "Must provide verifier address"
        );
        verifierAddress = _verifierAddress;
        SigningLogicInitializable.initialize(
            "Entity Manager",
            "1",
            _chainId
        );
    }

    /// @notice Manage an entity (ex. User/Track/Playlist/Follow/Repost etc.)
    /// @param _userId User performing action
    /// @param _entityType Entity type being manipulated, ex. User/Track/Playlist
    /// @param _entityId Entity id being manipulated. For new entities, ID assignment will be handled by submitter
    /// @param _action Action being performed, ex. Create/Update/Delete
    /// @param _metadata Metadata associated with action
    /// @param _nonce Nonce used client side for signature generation
    /// @param _subjectSig Signed data used to recover operation signer
    function manageEntity(
        uint _userId,
        string calldata _entityType,
        uint _entityId,
        string calldata _action,
        string calldata _metadata,
        bytes32 _nonce,
        bytes calldata _subjectSig
    ) external
    {
        address signer = _recoverManageEntitySignerAddress(
            _userId,
            _entityType,
            _entityId,
            _metadata,
            _action,
            _nonce,
            _subjectSig
        );
        emit ManageEntity(
            _userId,
            signer,
            _entityType,
            _entityId,
            _metadata,
            _action
        );
    }

    /// @notice Manage user verified status
    /// @param _userId User status being modified
    /// @param _isVerified Boolean indicating verified status
    function manageIsVerified(
        uint _userId,
        bool _isVerified
    ) external
    {
        require(msg.sender == verifierAddress, "Invalid verifier");
        emit ManageIsVerified(_userId, _isVerified);
    }

    function _recoverManageEntitySignerAddress(
        uint _userId,
        string memory _entityType,
        uint _entityId,
        string memory _metadata,
        string memory _action,
        bytes32 _nonce,
        bytes memory _subjectSig
    ) internal returns (address)
    {
        bytes32 signatureDigest = generateSchemaHash(
            keccak256(
                abi.encode(
                    MANAGE_ENTITY_REQUEST_TYPEHASH,
                    _userId,
                    keccak256(bytes(_entityType)),
                    _entityId,
                    keccak256(bytes(_action)),
                    keccak256(bytes(_metadata)),
                    _nonce
                )
            )
        );
        address signer = recoverSigner(signatureDigest, _subjectSig);
        burnSignatureDigest(signatureDigest, signer);
        return signer;
    }
}