pragma solidity ^0.5.0;

import "./interface/RegistryInterface.sol";
import "./registry/RegistryContract.sol";
import "./SigningLogic.sol";


/** @title Contract responsible for managing IPLD blacklist business logic */
contract IPLDBlacklistFactory is RegistryContract, SigningLogic {

    RegistryInterface registry = RegistryInterface(0);

    address verifierAddress;
    bytes32 constant ADD_IPLD_TO_BLACKLIST = keccak256(
        "AddIPLDToBlacklistRequest(bytes32 multihashDigest,bytes32 nonce)"
    );

    event AddIPLDToBlacklist(bytes32 _multihashDigest);

    constructor(
        address _registryAddress,
        uint _networkId,
        address _verifierAddress
    ) SigningLogic ("IPLD Blacklist Factory", "1", _networkId) public
    {
        require(
            _registryAddress != address(0x00),
            "requires non-zero _registryAddress"
        );
        registry = RegistryInterface(_registryAddress);
        verifierAddress = _verifierAddress;
    }

    function addIPLDToBlacklist(
        bytes32 _multihashDigest,
        bytes32 _nonce,
        bytes calldata _subjectSig
    ) external
    {
        bytes32 _signatureDigest = generateSchemaHash(
            keccak256(
                abi.encode(
                    ADD_IPLD_TO_BLACKLIST,
                    _multihashDigest,
                    _nonce
                )
            )
        );
        require(
            verifierAddress == recoverSigner(_signatureDigest, _subjectSig),
            "Invalid signature for verifier"
        );
        burnSignatureDigest(_signatureDigest, verifierAddress);

        emit AddIPLDToBlacklist(_multihashDigest);
    }
}
