pragma solidity ^0.5.0;

import "./interface/RegistryInterface.sol";
import "./registry/RegistryContract.sol";
import "./interface/UserFactoryInterface.sol";
import "./SigningLogic.sol";


/** @title Contract for Audius user replica sets */
contract UserReplicaSetManager is RegistryContract, SigningLogic {

    RegistryInterface private registry = RegistryInterface(0);
    bytes32 private userFactoryRegistryKey;
    address deployer;

    // spID to ServiceProvider delegateOwnerWallet
    mapping (uint => address) spIdToCreatorNode;

    // Struct used to represent replica sets
    struct ReplicaSet {
        uint primary;
        uint[] secondaries;
    }

    // Current userId to replica set
    mapping (uint => ReplicaSet) artistReplicaSets;

    constructor(
        address _registryAddress,
        bytes32 _userFactoryRegistryKey,
        uint _networkId
    ) SigningLogic("User Replica Set Manager", "1", _networkId) public
    {
        require(
            _registryAddress != address(0x00) &&
            _userFactoryRegistryKey.length != 0,
            "requires non-zero _registryAddress"
        );

        registry = RegistryInterface(_registryAddress);
        userFactoryRegistryKey = _userFactoryRegistryKey;
        deployer = msg.sender;
    }

    // Called from dataOwnerWallet value as msg.sender
    // TODO: Add signature for relay - signer must be the target delegateOwnerWallet for this replicaId
    function registerCreatorNode(uint _spID, address _delegateOwnerWallet) external {
        require(spIdToCreatorNode[_spID] == address(0x0), "No value permitted prior to setting spID");
        require(msg.sender == _delegateOwnerWallet || msg.sender == deployer, "Owner or deployer");
        spIdToCreatorNode[_spID] = _delegateOwnerWallet;
    }

    // WIP - Update model allowing existing nodes to register others
    // From chain of trust based authentication scheme
    // TODO: Add signature for relay - signer must be proposerWallet 
    function addCreatorNode(
        uint _newCnodeId,
        address _newCnodeDelegateOwnerWallet,
        uint _proposerSpId,
        address _proposerWallet
    ) external {
      require(msg.sender == _proposerWallet, "Invalid sender");
      require(spIdToCreatorNode[_proposerSpId] == _proposerWallet, "Mismatch proposer wallet for existing spID");
      require(spIdToCreatorNode[_proposerSpId] != address(0x00), "Unregistered sender spID");

      // TODO: Event
      spIdToCreatorNode[_newCnodeId] = _newCnodeDelegateOwnerWallet;
    }

    // Function used to permission updates to a given user's replica set 
    function updateReplicaSet(
        uint _userId,
        uint _primary,
        uint[] calldata _secondaries,
        uint _oldPrimary,
        uint[] calldata _oldSecondaries) external
      {
          // Caller's notion of existing primary must match regisered value on chain
          require(artistReplicaSets[_userId].primary == _oldPrimary,  "Invalid prior configuration"); 

          // Get user object from UserFactory
          UserFactoryInterface userFactory = UserFactoryInterface(registry.getContract(userFactoryRegistryKey));
          require(userFactory.userExists(_userId), "Valid user required");

          (address userWallet, ) = userFactory.getUser(_userId);

          // A valid updater can be one of the dataOwnerWallet, existing creator node, or contract deployer
          bool validUpdater = false;
          // TODO: Replace msg.sender below with recovered signature from _subjectSig object
          if (msg.sender == userWallet || msg.sender == spIdToCreatorNode[_oldPrimary] || msg.sender == deployer) {
              validUpdater = true;
          }
          // Caller's notion of secondary values must match registered value on chain
          // A secondary node can also be considered a valid updater
          for (uint i = 0; i < _oldSecondaries.length; i++) {
              require(
                  artistReplicaSets[_userId].secondaries[i] == _oldSecondaries[i],
                  "Invalid prior secondary configuration"
              );

              // A valid updater has been found
              if (msg.sender == spIdToCreatorNode[_oldSecondaries[i]]) {
                validUpdater = true;
              }
          }
          require(validUpdater == true, "Invalid update operation");

          // Perform replica set update
          artistReplicaSets[_userId] = ReplicaSet({
              primary: _primary,
              secondaries: _secondaries
          });

          // Confirm primary and every incoming secondary is valid
          require(spIdToCreatorNode[_primary] != address(0x00), "Primary must exist"); 
          for (uint i = 0; i < _secondaries.length; i++) {
              require(spIdToCreatorNode[_secondaries[i]] != address(0x00), "Secondary must exist");
          }
      }

      // Return an artist's current replica set
      function getArtistReplicaSet(uint _userId) external view
      returns (uint primary, uint[] memory secondaries)
      {
          return (
              artistReplicaSets[_userId].primary,
              artistReplicaSets[_userId].secondaries
          );
      }

      // Get wallet corresponding to creator node
      function getCreatorNodeWallet(uint _spID) external view
      returns (address wallet) 
      {
          return spIdToCreatorNode[_spID];
      }
}
