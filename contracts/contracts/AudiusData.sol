pragma solidity ^0.5.0;


import "./SigningLogicInitializable.sol";


/** @title Contract for Audius user replica set management */
contract AudiusData is SigningLogicInitializable {

    /// @notice Address permissioned to verify users
    address verifierAddress;

    event ManageUser(
        uint _userId,
        address _signer,
        string _metadata,
        string _action
    );

    event Digest(bytes32 _eh);

    /// @notice EIP-712 Typehash definitions
    //          Used to validate identity with gasless transaction submission
    bytes32 MANAGE_USER_REQUEST_TYPEHASH = keccak256(
        "ManageUser(uint userId,string action,string metadata,bytes32 nonce)"
    );

    function initialize(
        address _verifierAddress,
        uint _networkId
    ) public initializer
    {
        require(_verifierAddress != address(0x00), "");
        verifierAddress = _verifierAddress;
        SigningLogicInitializable.initialize(
            "AudiusData",
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
        emit Digest(signatureDigest);
        address signer = recoverSigner(signatureDigest, _subjectSig);
        burnSignatureDigest(signatureDigest, signer);
        return signer;
    }
}