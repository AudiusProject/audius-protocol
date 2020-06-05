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

    // spID to ServiceProviderdelegate owner wallet
    mapping (uint => address) spIdToCreatorNode;

    // Struct used to represent replica sets
    struct ReplicaSet {
        uint primary;
        uint[] secondaries;
    }

    // Current artist wallet to replica set
    mapping (address => ReplicaSet) artistReplicaSets;

    // TODO: Capture deployer here
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
    function registerCreatorNode(uint _spID) external {
        spIdToCreatorNode[_spID] = msg.sender;
    }

    // Function used to permission updates to a given user's replica set 
    function updateReplicaSet(
        address _userWallet,
        uint _primary,
        uint[] calldata _secondaries,
        uint _oldPrimary,
        uint[] calldata _oldSecondaries) external
      {
          // Caller's notion of existing primary must match regisered value on chain
          require(artistReplicaSets[_userWallet].primary == _oldPrimary,  "Invalid prior configuration"); 

          // A valid updater can be one of the dataOwnerWallet, existing creator node, or contract deployer
          bool validUpdater = false;
          if (msg.sender == _userWallet || msg.sender == spIdToCreatorNode[_oldPrimary] || msg.sender == deployer) {
              validUpdater = true;
          }
          // Caller's notion of secondary values must match registered value on chain
          // A secondary node can also be considered a valid updater
          for (uint i = 0; i < _oldSecondaries.length; i++) {
              require(
                  artistReplicaSets[_userWallet].secondaries[i] == _oldSecondaries[i],
                  "Invalid prior secondary configuration"
              );

              // A valid updater has been found
              if (msg.sender == spIdToCreatorNode[_oldSecondaries[i]]) {
                validUpdater = true;
              }
          }
          require(validUpdater == true, "Invalid update operation");

          // Confirm primary and every incoming secondary is valid
          require(spIdToCreatorNode[_primary] != address(0x00), "Primary must exist"); 
          for (uint i = 0; i < _secondaries.length; i++) {
              require(spIdToCreatorNode[i] != address(0x00), "Secondary must exist");
          }

          // Perform replica set update
          artistReplicaSets[_userWallet] = ReplicaSet({
              primary: _primary,
              secondaries: _secondaries
          });
      }

      // Return an artist's current replica set
      function getArtistReplicaSet(address _userWallet) external view
      returns (uint primary, uint[] memory secondaries)
      {
          return (
              artistReplicaSets[_userWallet].primary,
              artistReplicaSets[_userWallet].secondaries
          );
      }
}
