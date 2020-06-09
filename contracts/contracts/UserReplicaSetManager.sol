pragma solidity ^0.5.0;

import "./interface/RegistryInterface.sol";
import "./registry/RegistryContract.sol";
import "./interface/UserFactoryInterface.sol";
import "./SigningLogic.sol";


/** @title Contract for Audius user replica sets */
contract UserReplicaSetManager is RegistryContract, SigningLogic {

    RegistryInterface private registry = RegistryInterface(0);
    bytes32 private userFactoryRegistryKey;

    // TODO: Permission to special address if necessary
    address deployer;

    // spID to ServiceProvider delegateOwnerWallet
    mapping (uint => address) spIdToCreatorNodeDelegateWallet;

    // Struct used to represent replica sets
    // Each uint reprsets the spID registered on eth-contracts
    struct ReplicaSet {
        uint primary;
        uint[] secondaries;
    }

    // Current uint userId to Replica Set
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
            "Requires non-zero _registryAddress"
        );

        registry = RegistryInterface(_registryAddress);
        userFactoryRegistryKey = _userFactoryRegistryKey;
        deployer = msg.sender;
    }

    // WIP - Update model allowing existing nodes to register others
    // From chain of trust based authentication scheme
    // TODO: Add signature for relay - signer must be proposerWallet 
    function updateCreatorNode(
        uint _newCnodeId,
        address _newCnodeDelegateOwnerWallet,
        uint _proposerSpId,
        address _proposerWallet
    ) external {
      require(msg.sender == _proposerWallet, "Invalid sender");
      // Requirements for non deployer address
      if (msg.sender != deployer) {
          require(spIdToCreatorNodeDelegateWallet[_proposerSpId] == _proposerWallet, "Mismatch proposer wallet for existing spID");
          require(spIdToCreatorNodeDelegateWallet[_proposerSpId] != address(0x00), "Unregistered sender spID");
      }

      // TODO: Event
      spIdToCreatorNodeDelegateWallet[_newCnodeId] = _newCnodeDelegateOwnerWallet;
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
          require(artistReplicaSets[_userId].primary == _oldPrimary,  "Invalid prior primary configuration"); 

          // Get user object from UserFactory
          UserFactoryInterface userFactory = UserFactoryInterface(registry.getContract(userFactoryRegistryKey));
          require(userFactory.userExists(_userId), "Valid user required");

          (address userWallet, ) = userFactory.getUser(_userId);

          // A valid updater can be one of the dataOwnerWallet, existing creator node, or contract deployer
          bool validUpdater = false;
          // TODO: Replace msg.sender below with recovered signature from _subjectSig object
          if (msg.sender == userWallet || msg.sender == spIdToCreatorNodeDelegateWallet[_oldPrimary] || msg.sender == deployer) {
              validUpdater = true;
          }
          // Caller's notion of secondary values must match registered value on chain
          // A secondary node can also be considered a valid updater
          require(_oldSecondaries.length == artistReplicaSets[_userId].secondaries.length, "Invalid prior secondary configuration");
          for (uint i = 0; i < _oldSecondaries.length; i++) {
              require(
                  artistReplicaSets[_userId].secondaries[i] == _oldSecondaries[i],
                  "Invalid prior secondary configuration"
              );

              // A valid updater has been found
              if (msg.sender == spIdToCreatorNodeDelegateWallet[_oldSecondaries[i]]) {
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
          require(spIdToCreatorNodeDelegateWallet[_primary] != address(0x00), "Primary must exist"); 
          for (uint i = 0; i < _secondaries.length; i++) {
              require(spIdToCreatorNodeDelegateWallet[_secondaries[i]] != address(0x00), "Secondary must exist");
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
          return spIdToCreatorNodeDelegateWallet[_spID];
      }
}
