pragma solidity ^0.5.0;

import "./interface/RegistryInterface.sol";
import "./registry/RegistryContract.sol";
import "./UserFactory.sol";

import "./SigningLogicInitializable.sol";


/** @title Contract for Audius user replica set management */
contract UserReplicaSetManager is SigningLogicInitializable, RegistryContract {
    // Reference to data contract registry
    RegistryInterface private registry = RegistryInterface(0);
    // User factory key used to confirm valid users during reconfig operations
    bytes32 private userFactoryRegistryKey;

    // Address permissioned to update user replica sets
    address userReplicaSetBootstrapAddress;

    // spID to ServiceProvider delegateOwnerWallet
    mapping (uint => address) spIdToContentNodeDelegateWallet;

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

    event AddOrUpdateContentNode(
        uint _newCnodeId,
        address _newCnodeDelegateOwnerWallet,
        uint[3] _proposerSpIds,
        address _proposer1Address,
        address _proposer2Address,
        address _proposer3Address
    );

    /* EIP-712 */
    bytes32 constant PROPOSE_ADD_UPDATE_CNODE_REQUEST_TYPEHASH = keccak256(
        "ProposeAddOrUpdateContentNode(uint newCnodeId,address newCnodeDelegateOwnerWallet,uint proposerSpId,bytes32 nonce)"
    );
    bytes32 constant UPDATE_REPLICA_SET_REQUEST_TYPEHASH = keccak256(
        "UpdateReplicaSet(uint userId,uint primary,bytes32 secondariesHash,uint oldPrimary,bytes32 oldSecondariesHash,bytes32 nonce)"
    );

    function initialize(
        address _registryAddress,
        bytes32 _userFactoryRegistryKey,
        address _userReplicaSetBootstrapAddress,
        uint[] memory _bootstrapSPIds,
        address[] memory _bootstrapNodeDelegateWallets,
        uint _networkId
    ) public initializer
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
        // Initialize base Signing Logic contract
        SigningLogicInitializable.initialize(
            "User Replica Set Manager",
            "1",
            _networkId
        );
    }

    // Chain of trust based authentication scheme
    // Nodes are required to have an identity in Audius L2 and this function enables
    //     known entities to register other known entities on L2 contracts.
    //  Multiple distinct parties must sign and submit as part of this request
    function addOrUpdateContentNode(
        uint _newCnodeId,
        address _newCnodeDelegateOwnerWallet,
        uint[3] calldata _proposerSpIds,
        bytes32[3] calldata _proposerNonces,
        bytes calldata _proposer1Sig,
        bytes calldata _proposer2Sig,
        bytes calldata _proposer3Sig
    ) external
    {
        // For every entry in spIds/Nonces/Sigs
        //  Recover signer using the signature for inner function (tmp is addOrUpdateCreatorNode)
        //  Confirm that the spId <-> recoveredSigner DOES exist and match what is stored on chain
        address proposer1Address = _recoverProposeAddOrUpdateContentNodeSignerAddress(
            _newCnodeId,
            _newCnodeDelegateOwnerWallet,
            _proposerSpIds[0],
            _proposerNonces[0],
            _proposer1Sig
        );
        address proposer2Address = _recoverProposeAddOrUpdateContentNodeSignerAddress(
            _newCnodeId,
            _newCnodeDelegateOwnerWallet,
            _proposerSpIds[1],
            _proposerNonces[1],
            _proposer2Sig
        );
        address proposer3Address = _recoverProposeAddOrUpdateContentNodeSignerAddress(
            _newCnodeId,
            _newCnodeDelegateOwnerWallet,
            _proposerSpIds[2],
            _proposerNonces[2],
            _proposer3Sig
        );
        _validateUpdateOperation(
            proposer1Address,
            proposer2Address,
            proposer3Address,
            _proposerSpIds
        );
        spIdToContentNodeDelegateWallet[_newCnodeId] = _newCnodeDelegateOwnerWallet;
        emit AddOrUpdateContentNode(
            _newCnodeId,
            _newCnodeDelegateOwnerWallet,
            _proposerSpIds,
            proposer1Address,
            proposer2Address,
            proposer3Address
        );
    }

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
            signer == spIdToContentNodeDelegateWallet[_oldPrimary] ||
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
        require(spIdToContentNodeDelegateWallet[_primary] != address(0x00), "Primary must exist");
        for (uint i = 0; i < _secondaries.length; i++) {
            require(
                spIdToContentNodeDelegateWallet[_secondaries[i]] != address(0x00),
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
        return spIdToContentNodeDelegateWallet[_spID];
    }

    // Get userReplicaSetBootstrapAddress
    function getUserReplicaSetBootstrapAddress() external view
    returns (address)
    {
        return userReplicaSetBootstrapAddress;
    }

    /* EIP712 - Signer recovery */
    function _recoverProposeAddOrUpdateContentNodeSignerAddress(
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
            if (signer == spIdToContentNodeDelegateWallet[_oldSecondaries[i]]) {
                secondarySenderFound = true;
                break;
            }
        }
        return secondarySenderFound;
    }

    // Update state given constructor arguments
    function _seedBootstrapNodes(
        uint[] memory _bootstrapSPIDs,
        address[] memory _bootstrapWallets
    ) internal
    {
        require(
            _bootstrapSPIDs.length == _bootstrapWallets.length,
            "Mismatched bootstrap array lengths"
        );
        for (uint i = 0; i < _bootstrapSPIDs.length; i++) {
            spIdToContentNodeDelegateWallet[_bootstrapSPIDs[i]] = _bootstrapWallets[i];
        }
        // TODO: Evaluate whether both of these are required...?
        bootstrapSPIds = _bootstrapSPIDs;
        bootstrapNodeDelegateWallets = _bootstrapWallets;
    }

    function _isBootstrapNode(uint _spID, address _spDelegateOwnerWallet)
    internal view returns (bool)
    {
        for (uint i = 0; i < bootstrapSPIds.length; i++) {
            if (bootstrapSPIds[i] == _spID &&
                bootstrapNodeDelegateWallets[i] == _spDelegateOwnerWallet
            ) {
                return true;
            }
        }
        return false;
    }

    function _validateUpdateOperation (
        address _proposer1Address,
        address _proposer2Address,
        address _proposer3Address,
        uint[3] memory _proposerSpIds
    ) internal view
    {
        // Require distinct proposer addresses
        require(
            (_proposer1Address != _proposer2Address) &&
            (_proposer1Address != _proposer3Address) &&
            (_proposer2Address != _proposer3Address),
            "Distinct proposers required"
        );
        // Confirm addresses and inputted spID values match expected values on chain
        require(
            spIdToContentNodeDelegateWallet[_proposerSpIds[0]] == _proposer1Address,
            "Invalid wallet provided for 1st proposer"
        );
        require(
            spIdToContentNodeDelegateWallet[_proposerSpIds[1]] == _proposer2Address,
            "Invalid wallet provided for 2nd proposer"
        );
        require(
            spIdToContentNodeDelegateWallet[_proposerSpIds[2]] == _proposer3Address,
            "Invalid wallet provided for 3rd proposer"
        );
    }
}
