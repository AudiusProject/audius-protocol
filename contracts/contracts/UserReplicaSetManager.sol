pragma solidity ^0.5.0;

import "./interface/RegistryInterface.sol";
import "./registry/RegistryContract.sol";
import "./UserFactory.sol";
import "./SigningLogic.sol";


/** @title Contract for Audius user replica set management */
contract UserReplicaSetManager is RegistryContract, SigningLogic {
    // Reference to data contract registry
    RegistryInterface private registry = RegistryInterface(0);
    // User factory key used to confirm valid users during reconfig operations
    bytes32 private userFactoryRegistryKey;

    // Address permissioned to update user replica sets
    address userReplicaSetBootstrapAddress;

    // spID to ServiceProvider delegateOwnerWallet
    mapping (uint => address) spIdToCreatorNodeDelegateWallet;

    // Struct used to represent replica sets
    // Each uint reprsets the spID registered on eth-contracts
    struct ReplicaSet {
        uint primary;
        uint[] secondaries;
    }

    // Consider frontrunning of spIDs
    uint[] bootstrapSPIds;
    // TODO: Do we even need this second array? We just need ONE
    address[] bootstrapNodeDelegateWallets;

    // Current uint userId to Replica Set
    mapping (uint => ReplicaSet) userReplicaSets;

    /* Events */
    event UpdateReplicaSet(
        uint _userId,
        uint _primary,
        uint[] _secondaries
    );

    event AddOrUpdateCreatorNode(
        uint _newCnodeId,
        address _newCnodeDelegateOwnerWallet,
        uint[3] proposerSpIds
    );

    event TestEvent(address _testAddress);

    /* EIP-712 */
    bytes32 constant PROPOSE_ADD_UPDATE_CNODE_REQUEST_TYPEHASH = keccak256(
        "ProposeAddOrUpdateCreatorNode(uint newCnodeId,address newCnodeDelegateOwnerWallet,uint proposerSpId,bytes32 nonce)"
    );
    bytes32 constant UPDATE_REPLICA_SET_REQUEST_TYPEHASH = keccak256(
        "UpdateReplicaSet(uint userId,uint primary,bytes32 secondariesHash,uint oldPrimary,bytes32 oldSecondariesHash,bytes32 nonce)"
    );

    constructor(
        address _registryAddress,
        bytes32 _userFactoryRegistryKey,
        address _userReplicaSetBootstrapAddress,
        uint[] memory _bootstrapSPIds,
        address[] memory _bootstrapNodeDelegateWallets,
        uint _networkId
    ) SigningLogic("User Replica Set Manager", "1", _networkId) public
    {
        require(
            _registryAddress != address(0x00) &&
            _userFactoryRegistryKey.length != 0,
            "Requires non-zero _registryAddress and registryKey"
        );
        registry = RegistryInterface(_registryAddress);
        userFactoryRegistryKey = _userFactoryRegistryKey;
        userReplicaSetBootstrapAddress = _userReplicaSetBootstrapAddress;
        _seedBootstrapNodes(_bootstrapSPIds, _bootstrapNodeDelegateWallets);
    }

    // Chain of trust based authentication scheme
    // Nodes are required to have an identity in Audius L2 and this function enables
    //     known entities to register other known entities on L2 contracts.
    //  Multiple parties must sign and submit as part of this request
    //         - Enforce distinct signers for each entry
    // TODO: Evaluate whether this function is necessary at all?
    //      All we need is the TYPEHASH to match in order to recover any given signature. come to this after dev work

    // This is the TRUE state change
    function addOrUpdateContentNode(
        uint _newCnodeId,
        address _newCnodeDelegateOwnerWallet,
        uint[3] calldata _proposerSpIds,
        bytes32[3] calldata _proposerNonces,
        bytes calldata _proposer1Sig,
        bytes calldata _proposer2Sig,
        bytes calldata _proposer3Sig
    ) external {
        // For every entry in spIds/Nonces/Sigs
        //  Recover signer using the signature for inner function (tmp is addOrUpdateCreatorNode)
        //  Confirm that the spId <-> recoveredSigner DOES exist and match what is stored on chain
        address proposer1Address = _recoverProposeAddOrUpdateCreatorNodeRequestSignerAddress(
            _newCnodeId,
            _newCnodeDelegateOwnerWallet,
            _proposerSpIds[0],
            _proposerNonces[0],
            _proposer1Sig
        );
        emit TestEvent(proposer1Address);
        address proposer2Address = _recoverProposeAddOrUpdateCreatorNodeRequestSignerAddress(
            _newCnodeId,
            _newCnodeDelegateOwnerWallet,
            _proposerSpIds[1],
            _proposerNonces[1],
            _proposer2Sig
        );
        emit TestEvent(proposer2Address);
        address proposer3Address = _recoverProposeAddOrUpdateCreatorNodeRequestSignerAddress(
            _newCnodeId,
            _newCnodeDelegateOwnerWallet,
            _proposerSpIds[2],
            _proposerNonces[2],
            _proposer3Sig
        );
        emit TestEvent(proposer3Address);
        _validateUpdateOperation(
            proposer1Address,
            proposer2Address,
            proposer3Address,
            _proposerSpIds
        );
        spIdToCreatorNodeDelegateWallet[_newCnodeId] = _newCnodeDelegateOwnerWallet;
        emit AddOrUpdateCreatorNode(_newCnodeId, _newCnodeDelegateOwnerWallet, _proposerSpIds);
    }

    // TODO: Revisit delete logic - how to remove an spID <-> wallet combo entirely
    //       Is there any actual downside to orphaning old spID <-> wallets?
    //       Proposal: eliminate update ability from 'addOrUpdateCreatorNode' and limit to valid entities?

    // Function used to permission updates to a given user's replica set
    function updateReplicaSet(
        uint _userId,
        uint _primary,
        uint[] calldata _secondaries,
        uint _oldPrimary,
        uint[] calldata _oldSecondaries,
        bytes32 _requestNonce,
        bytes calldata _subjectSig
    ) external
    {
        address signer = _recoverUserReplicaSetRequestSignerAddress(
            _userId,
            _primary,
            _secondaries,
            _oldPrimary,
            _oldSecondaries,
            _requestNonce,
            _subjectSig
        );

        /*
            A valid updater can be one of the following:
                - userWallet
                - user old primary node
                - user old secondary node
                - replica set bootstrap address
        */
        bool validUpdater = false;
        // Get user object from UserFactory
        (address userWallet, ) = UserFactory(
            registry.getContract(userFactoryRegistryKey)
        ).getUser(_userId);
        require(userWallet != address(0x00), "Valid user required");

        // Valid updaters include userWallet (artist account), existing primary, existing secondary, or contract deployer
        if (signer == userWallet ||
            signer == spIdToCreatorNodeDelegateWallet[_oldPrimary] ||
            signer == userReplicaSetBootstrapAddress
           )
        {
            validUpdater = true;
        }

        // Caller's notion of existing primary must match regisered value on chain
        require(
            userReplicaSets[_userId].primary == _oldPrimary,
            "Invalid prior primary configuration"
        );

        // Check if any of the old secondaries submitted this operation
        validUpdater = _compareUserSecondariesAndCheckSender(
            _userId,
            _oldSecondaries,
            signer,
            validUpdater
        );
        require(validUpdater == true, "Invalid update operation");

        // Confirm primary and every incoming secondary is valid
        require(spIdToCreatorNodeDelegateWallet[_primary] != address(0x00), "Primary must exist");
        for (uint i = 0; i < _secondaries.length; i++) {
            require(
                spIdToCreatorNodeDelegateWallet[_secondaries[i]] != address(0x00),
                "Secondary must exist"
            );
        }

        // Perform replica set update
        userReplicaSets[_userId] = ReplicaSet({
            primary: _primary,
            secondaries: _secondaries
        });

        emit UpdateReplicaSet(_userId, _primary, _secondaries);
    }

    function getBootstrapServiceProviderIDs () external view
    returns (uint[] memory)
    {
        return bootstrapSPIds;
    }

    function getBootstrapServiceProviderDelegateWallets () external view
    returns (address[] memory)
    {
        return bootstrapNodeDelegateWallets;
    }

    // Return a users current replica set
    function getUserReplicaSet(uint _userId) external view
    returns (uint primary, uint[] memory secondaries)
    {
        return (
            userReplicaSets[_userId].primary,
            userReplicaSets[_userId].secondaries
        );
    }

    // Get wallet corresponding to creator node
    function getContentNodeWallet(uint _spID) external view
    returns (address wallet)
    {
        return spIdToCreatorNodeDelegateWallet[_spID];
    }

    // Get userReplicaSetBootstrapAddress
    function getUserReplicaSetBootstrapAddress() external view
    returns (address)
    {
        return userReplicaSetBootstrapAddress;
    }

    /* EIP712 - Signer recovery */
    function _recoverProposeAddOrUpdateCreatorNodeRequestSignerAddress(
        uint _cnodeId,
        address _cnodeWallet,
        uint _proposerId,
        bytes32 _nonce,
        bytes memory _subjectSig
    ) internal returns (address)
    {
        bytes32 signatureDigest = generateSchemaHash(
            keccak256(
                abi.encode(
                    PROPOSE_ADD_UPDATE_CNODE_REQUEST_TYPEHASH,
                    _cnodeId,
                    _cnodeWallet,
                    _proposerId,
                    _nonce
                )
            )
        );
        address signer = recoverSigner(signatureDigest, _subjectSig);
        burnSignatureDigest(signatureDigest, signer);
        return signer;
    }

    function _recoverUserReplicaSetRequestSignerAddress(
        uint _userId,
        uint _primary,
        uint[] memory _secondaries,
        uint _oldPrimary,
        uint[] memory _oldSecondaries,
        bytes32 _nonce,
        bytes memory _subjectSig
    ) internal returns (address)
    {
        bytes32 signatureDigest = generateSchemaHash(
            keccak256(
                abi.encode(
                    UPDATE_REPLICA_SET_REQUEST_TYPEHASH,
                    _userId,
                    _primary,
                    keccak256(abi.encode(_secondaries)),
                    _oldPrimary,
                    keccak256(abi.encode(_oldSecondaries)),
                    _nonce
                )
            )
        );
        address signer = recoverSigner(signatureDigest, _subjectSig);
        burnSignatureDigest(signatureDigest, signer);
        return signer;
    }

    function _compareUserSecondariesAndCheckSender(
        uint _userId,
        uint[] memory _oldSecondaries,
        address signer,
        bool senderFound
    ) internal view returns (bool)
    {
        // Caller's notion of secondary values must match registered value on chain
        // A secondary node can also be considered a valid updater
        require(
            _oldSecondaries.length == userReplicaSets[_userId].secondaries.length,
            "Invalid prior secondary configuration"
        );
        bool secondarySenderFound = senderFound;
        for (uint i = 0; i < _oldSecondaries.length; i++) {
            require(
                userReplicaSets[_userId].secondaries[i] == _oldSecondaries[i],
                "Invalid prior secondary configuration"
            );
            if (signer == spIdToCreatorNodeDelegateWallet[_oldSecondaries[i]]) {
                secondarySenderFound = true;
                // TODO: Break out of loop here?
            }
        }
        return secondarySenderFound;
    }

    // Update state given constructor arguments
    function _seedBootstrapNodes(
        uint[] memory _bootstrapSPIDs,
        address[] memory _bootstrapDelegateOwnerWallets
    ) internal
    {
        require(_bootstrapSPIDs.length == _bootstrapDelegateOwnerWallets.length, "Mismatched bootstrap array lengths");
        for (uint i = 0; i < _bootstrapSPIDs.length; i++) {
            spIdToCreatorNodeDelegateWallet[_bootstrapSPIDs[i]] = _bootstrapDelegateOwnerWallets[i];
        }
        // TODO: Evaluate whether both of these are required...?
        bootstrapSPIds = _bootstrapSPIDs;
        bootstrapNodeDelegateWallets = _bootstrapDelegateOwnerWallets;
    }

    function _isBootstrapNode(uint _spID, address _spDelegateOwnerWallet)
    internal view returns (bool)
    {
        for (uint i = 0; i < bootstrapSPIds.length; i++) {
            if (bootstrapSPIds[i] == _spID && bootstrapNodeDelegateWallets[i] == _spDelegateOwnerWallet) {
                return true;
            }
        }
        return false;
    }

    function _validateUpdateOperation (
        address _submitterAddress,
        address _proposer1Address,
        address _proposer2Address,
        uint[3] memory _proposerSpIds
    ) internal view {
        // Require distinct proposer addresses
        require(
            (_submitterAddress != _proposer1Address) &&
            (_submitterAddress != _proposer2Address) &&
            (_proposer1Address != _proposer2Address),
            "Distinct proposers required"
        );
        // Confirm addresses and inputted spID values match expected values on chain
        require(
            spIdToCreatorNodeDelegateWallet[_proposerSpIds[0]] == _submitterAddress,
            "Invalid wallet provided for submitter"
        );
        require(
            spIdToCreatorNodeDelegateWallet[_proposerSpIds[1]] == _proposer1Address,
            "Invalid wallet provided for 1st proposer"
        );
        require(
            spIdToCreatorNodeDelegateWallet[_proposerSpIds[2]] == _proposer2Address,
            "Invalid wallet provided for 2nd proposer"
        );
    }
}
