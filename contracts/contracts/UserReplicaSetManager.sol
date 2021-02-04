pragma solidity ^0.5.0;

import "./interface/RegistryInterface.sol";
import "./registry/RegistryContract.sol";
import "./UserFactory.sol";

import "./SigningLogicInitializable.sol";


/** @title Contract for Audius user replica set management */
contract UserReplicaSetManager is SigningLogicInitializable, RegistryContract {
    /// @notice Reference to data contract registry
    RegistryInterface private registry = RegistryInterface(0);
    /// @notice User factory key used to confirm valid users during reconfig operations
    bytes32 private userFactoryRegistryKey;

    /// @notice Address permissioned to update user replica sets
    address userReplicaSetBootstrapAddress;

    /// @notice ServiceProvider ID to ServiceProvider delegateOwnerWallet,
    ///     reflecting registered values on Audius Ethereum L1 contracts
    mapping (uint => address) spIdToContentNodeDelegateWallet;

    /// @notice Struct used to represent replica sets
    //          Each uint represents the spID registered on eth-contracts
    struct ReplicaSet {
        uint primaryId;
        uint[] secondaryIds;
    }

    /// @notice Current uint userId to Replica Set
    mapping (uint => ReplicaSet) userReplicaSets;

    /// @notice Flag indicating whether bootstrap information has been configured
    bool seedComplete;

    /* Events */
    event UpdateReplicaSet(
        uint _userId,
        uint _primaryId,
        uint[] _secondaryIds
    );

    event AddOrUpdateContentNode(
        uint _cnodeSpId,
        address _cnodeDelegateOwnerWallet,
        uint[3] _proposerSpIds,
        address _proposer1Address,
        address _proposer2Address,
        address _proposer3Address
    );

    /// @notice EIP-712 Typehash definitions
    //          Used to validate identity with gasless transaction submission
    bytes32 constant PROPOSE_ADD_UPDATE_CNODE_REQUEST_TYPEHASH = keccak256(
        "ProposeAddOrUpdateContentNode(uint cnodeSpId,address cnodeDelegateOwnerWallet,uint proposerSpId,bytes32 nonce)"
    );
    bytes32 constant UPDATE_REPLICA_SET_REQUEST_TYPEHASH = keccak256(
        "UpdateReplicaSet(uint userId,uint primaryId,bytes32 secondaryIdsHash,uint oldPrimaryId,bytes32 oldSecondaryIdsHash,bytes32 nonce)"
    );

    function initialize(
        address _registryAddress,
        bytes32 _userFactoryRegistryKey,
        address _userReplicaSetBootstrapAddress,
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
        // Initialize base Signing Logic contract
        SigningLogicInitializable.initialize(
            "User Replica Set Manager",
            "1",
            _networkId
        );
        seedComplete = false;
    }

    /**
     * @notice Function used to initialize bootstrap nodes
     * Prior to this function, the contract is effectively disabled
     */
    function seedBootstrapNodes(
        uint[] calldata _bootstrapSPIds,
        address[] calldata _bootstrapNodeDelegateWallets
    ) external
    {
        require(
            msg.sender == userReplicaSetBootstrapAddress,
            "Only callable by userReplicaSetBootstrapAddress"
        );
        require(seedComplete == false, "Seed operation already completed");
        uint256[3] memory emptyProposerIds = [uint256(0), uint256(0), uint256(0)];
        require(
            _bootstrapSPIds.length == _bootstrapNodeDelegateWallets.length,
            "Mismatched bootstrap array lengths"
        );
        for (uint i = 0; i < _bootstrapSPIds.length; i++) {
            spIdToContentNodeDelegateWallet[_bootstrapSPIds[i]] = _bootstrapNodeDelegateWallets[i];
            emit AddOrUpdateContentNode(
                _bootstrapSPIds[i],
                _bootstrapNodeDelegateWallets[i],
                emptyProposerIds,
                address(0x00),
                address(0x00),
                address(0x00)
            );
        }
        seedComplete = true;
    }

    /**
     * @notice Chain of trust based authentication scheme
     *         Nodes are required to have an identity in Audius L2 and this function enables
     *         known entities to register other known entities on L2 contracts.
     *         By requiring 3 distinct proposers that are already known on-chain, 
     *         a single compromised wallet will not be able to arbitrarily add 
     *         content node mappings to this contract.
     * @dev Multiple distinct parties must sign and submit signatures as part of this request
     * @param _cnodeSpId - Incoming spID
     * @param _cnodeDelegateOwnerWallet - Incoming SP delegateOwnerWallet
     * @param _proposerSpIds - Array of 3 spIDs proposing new node
     * @param _proposerNonces - Array of 3 nonces, each index corresponding to _proposerSpIds
     * @param _proposer1Sig - Signature from first proposing node
     * @param _proposer2Sig - Signature from second proposing node
     * @param _proposer3Sig - Signature from third proposing node
     */
    function addOrUpdateContentNode(
        uint _cnodeSpId,
        address _cnodeDelegateOwnerWallet,
        uint[3] calldata _proposerSpIds,
        bytes32[3] calldata _proposerNonces,
        bytes calldata _proposer1Sig,
        bytes calldata _proposer2Sig,
        bytes calldata _proposer3Sig
    ) external
    {
        _requireSeed();
        // For every entry in spIds/Nonces/Sigs
        //  Recover signer using the signature for inner function (tmp is addOrUpdateCreatorNode)
        //  Confirm that the spId <-> recoveredSigner DOES exist and match what is stored on chain
        address proposer1Address = _recoverProposeAddOrUpdateContentNodeSignerAddress(
            _cnodeSpId,
            _cnodeDelegateOwnerWallet,
            _proposerSpIds[0],
            _proposerNonces[0],
            _proposer1Sig
        );
        address proposer2Address = _recoverProposeAddOrUpdateContentNodeSignerAddress(
            _cnodeSpId,
            _cnodeDelegateOwnerWallet,
            _proposerSpIds[1],
            _proposerNonces[1],
            _proposer2Sig
        );
        address proposer3Address = _recoverProposeAddOrUpdateContentNodeSignerAddress(
            _cnodeSpId,
            _cnodeDelegateOwnerWallet,
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
        spIdToContentNodeDelegateWallet[_cnodeSpId] = _cnodeDelegateOwnerWallet;
        emit AddOrUpdateContentNode(
            _cnodeSpId,
            _cnodeDelegateOwnerWallet,
            _proposerSpIds,
            proposer1Address,
            proposer2Address,
            proposer3Address
        );
    }

    /**
     * @notice Function used to perform updates to a given user's replica set
     *         A valid updater can either be the user's wallet, an old primary
     *         node, an old secondary node, or the replica set bootstrap address.
     *         By requiring an existing on-chain "old" replica or the user's wallet 
     *         directly, the contract can validate that the submitting entity is 
     *         known within the protocol. 
     * @param _userId - User for whom this update operation is being performed
     * @param _primaryId - Incoming primary for _userId
     * @param _secondaryIds - Incoming array of n secondary spIDs for _userId
     * @param _oldPrimaryId - Current primary on chain for _userId
     * @param _oldSecondaryIds - Current array of secondaries on chain for _userId
     * @param _requestNonce - Nonce generated by signer
     * @param _subjectSig - Signature generated by signer
     */
    function updateReplicaSet(
        uint _userId,
        uint _primaryId,
        uint[] calldata _secondaryIds,
        uint _oldPrimaryId,
        uint[] calldata _oldSecondaryIds,
        bytes32 _requestNonce,
        bytes calldata _subjectSig
    ) external
    {
        _requireSeed();
        address signer = _recoverUserReplicaSetRequestSignerAddress(
            _userId,
            _primaryId,
            _secondaryIds,
            _oldPrimaryId,
            _oldSecondaryIds,
            _requestNonce,
            _subjectSig
        );

        // A valid updater can be one of the following:
        //     - userWallet
        //     - user old primary node
        //     - user old secondary node
        //     - replica set bootstrap address
        bool validUpdater = false;
        // Get user object from UserFactory
        (address userWallet, ) = UserFactory(
            registry.getContract(userFactoryRegistryKey)
        ).getUser(_userId);
        require(userWallet != address(0x00), "Valid user required");

        // Valid updaters include userWallet (artist account), existing primary, existing secondary, or contract deployer
        if (signer == userWallet ||
            signer == spIdToContentNodeDelegateWallet[_oldPrimaryId] ||
            signer == userReplicaSetBootstrapAddress
           )
        {
            validUpdater = true;
        }

        // Caller's notion of existing primary must match registered value on chain
        require(
            userReplicaSets[_userId].primaryId == _oldPrimaryId,
            "Invalid prior primary configuration"
        );

        // Check if any of the old secondaries submitted this operation
        validUpdater = _compareUserSecondariesAndCheckSender(
            _userId,
            _oldSecondaryIds,
            signer,
            validUpdater
        );
        require(validUpdater == true, "Invalid update operation");

        // Confirm primary and every incoming secondary is valid
        require(spIdToContentNodeDelegateWallet[_primaryId] != address(0x00), "Primary must exist");
        for (uint i = 0; i < _secondaryIds.length; i++) {
            require(
                spIdToContentNodeDelegateWallet[_secondaryIds[i]] != address(0x00),
                "Secondary must exist"
            );
        }

        // Confirm no duplicate entries are present between
        // primary, secondaryIds[0] and secondaryIds[1]
        // Guaranteeing at least 3 replicas
        require(
            (_primaryId != _secondaryIds[0]) &&
            (_primaryId != _secondaryIds[1]) &&
            (_secondaryIds[0] != _secondaryIds[1]),
            "Distinct replica IDs expected for primary, secondary1, secondary2"
        );

        // Perform replica set update
        userReplicaSets[_userId] = ReplicaSet({
            primaryId: _primaryId,
            secondaryIds: _secondaryIds
        });

        emit UpdateReplicaSet(_userId, _primaryId, _secondaryIds);
    }

    /// @notice Update configured userReplicaSetBootstrapAddress
    ///         Only callable by currently configured address on chain
    ///         Allows special address to renounce ability
    function updateUserReplicaBootstrapAddress (
        address _newBootstrapAddress
    ) external
    {
        _requireSeed();
        require(
            msg.sender == userReplicaSetBootstrapAddress,
            "Invalid sender, expect current userReplicaSetBootstrapAddress"
        );
        userReplicaSetBootstrapAddress = _newBootstrapAddress;
    }

    /// @notice Return a users current replica set
    function getUserReplicaSet(uint _userId) external view
    returns (uint primaryId, uint[] memory secondaryIds)
    {
        return (
            userReplicaSets[_userId].primaryId,
            userReplicaSets[_userId].secondaryIds
        );
    }

    /// @notice Get wallet registered on chain corresponding to Content Node spID
    function getContentNodeWallet(uint _spID) external view
    returns (address wallet)
    {
        return spIdToContentNodeDelegateWallet[_spID];
    }

    /// @notice Get userReplicaSetBootstrapAddress
    function getUserReplicaSetBootstrapAddress() external view
    returns (address)
    {
        return userReplicaSetBootstrapAddress;
    }

    /// @notice Get seedComplete
    function getSeedComplete() external view
    returns (bool)
    {
        return seedComplete;

    }

    /* EIP712 - Signer recovery */
    function _recoverProposeAddOrUpdateContentNodeSignerAddress(
        uint _cnodeSpId,
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
                    _cnodeSpId,
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
        uint _primaryId,
        uint[] memory _secondaryIds,
        uint _oldPrimaryId,
        uint[] memory _oldSecondaryIds,
        bytes32 _nonce,
        bytes memory _subjectSig
    ) internal returns (address)
    {
        bytes32 signatureDigest = generateSchemaHash(
            keccak256(
                abi.encode(
                    UPDATE_REPLICA_SET_REQUEST_TYPEHASH,
                    _userId,
                    _primaryId,
                    keccak256(abi.encode(_secondaryIds)),
                    _oldPrimaryId,
                    keccak256(abi.encode(_oldSecondaryIds)),
                    _nonce
                )
            )
        );
        address signer = recoverSigner(signatureDigest, _subjectSig);
        burnSignatureDigest(signatureDigest, signer);
        return signer;
    }

    // Compare old secondaries submitted by function caller
    // and the value stored on the contract - note that the order
    // does matter when comparing secondary replicas
    function _compareUserSecondariesAndCheckSender(
        uint _userId,
        uint[] memory _oldSecondaryIds,
        address signer,
        bool senderFound
    ) internal view returns (bool)
    {
        // Caller's notion of secondary values must match registered value on chain
        // A secondary node can also be considered a valid updater
        require(
            _oldSecondaryIds.length == userReplicaSets[_userId].secondaryIds.length,
            "Invalid prior secondary configuration"
        );
        bool secondarySenderFound = senderFound;
        for (uint i = 0; i < _oldSecondaryIds.length; i++) {
            require(
                userReplicaSets[_userId].secondaryIds[i] == _oldSecondaryIds[i],
                "Invalid prior secondary configuration"
            );
            if (signer == spIdToContentNodeDelegateWallet[_oldSecondaryIds[i]]) {
                secondarySenderFound = true;
            }
        }
        return secondarySenderFound;
    }

    // Confirm sender is valid
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

    function _requireSeed () internal view {
        require(seedComplete == true, "Must be initialized");
    }
}
