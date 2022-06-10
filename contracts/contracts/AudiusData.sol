pragma solidity ^0.5.0;


import "./SigningLogicInitializable.sol";


/** @title Contract for Audius User Data management */
contract AudiusData is SigningLogicInitializable {

    /// @notice Address permissioned to verify users
    address verifierAddress;

    event ManageUser(
        uint _userId,
        address _signer,
        string _metadata,
        string _action
    );

    event ManageEntity(
        uint _userId,
        address _signer,
        string _entityType,
        uint _entityId,
        string _metadata,
        string _action
    );

    /// @notice EIP-712 Typehash definitions
    //          Used to validate identity with gasless transaction submission
    bytes32 constant MANAGE_USER_REQUEST_TYPEHASH = keccak256(
        "ManageUser(uint userId,string action,string metadata,bytes32 nonce)"
    );

    bytes32 constant MANAGE_ENTITY_REQUEST_TYPEHASH = keccak256(
        "ManageEntity(uint userId,string entityType,uint entityId,string action,string metadata,bytes32 nonce)"
    );

    function initialize(
        address _verifierAddress,
        uint _networkId
    ) public initializer
    {
        require(_verifierAddress != address(0x00), "");
        verifierAddress = _verifierAddress;
        SigningLogicInitializable.initialize(
            "Audius Data",
            "1",
            _networkId
        );
    }

    function manageUser(
        uint _userId,
        string calldata _action,
        string calldata _metadata,
        bytes32 _nonce,
        bytes calldata _subjectSig
    ) external
    {
       address signer = _recoverManageUserSignerAddress(
           _userId,
           _action,
           _metadata,
           _nonce,
           _subjectSig
        );
        emit ManageUser(_userId, signer, _metadata, _action);
    }

    function manageEntity(
        uint _userId,
        string calldata _entityType,
        uint _entityId,
        string calldata _action,
        string calldata _metadata,
        bytes32 _nonce,
        bytes calldata _subjectSig
    ) external {
        address signer = _recoverManageEntitySignerAddress(
            _userId,
            _entityType,
            _entityId,
            _metadata,
            _action,
            _nonce,
            _subjectSig
        );
        emit ManageEntity(_userId, signer, _entityType, _entityId, _metadata, _action);
    }

    function _recoverManageUserSignerAddress(
        uint _userId,
        string memory _action,
        string memory _metadata,
        bytes32 _nonce,
        bytes memory _subjectSig
    ) internal returns (address)
    {
        bytes32 signatureDigest = generateSchemaHash(
            keccak256(
                abi.encode(
                    MANAGE_USER_REQUEST_TYPEHASH,
                    _userId,
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