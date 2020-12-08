pragma solidity ^0.5.0;

// Import contract artifact for use in migration and tests
import "@openzeppelin/upgrades/contracts/upgradeability/AdminUpgradeabilityProxy.sol";


// Audius L2 proxy implementation - follows OpenZeppelin standard
// https://github.com/OpenZeppelin/openzeppelin-sdk/blob/v2.8.0/packages/lib/contracts/upgradeability/AdminUpgradeabilityProxy.sol
// constructor - address _logic, address _admin, bytes memory _data
contract AudiusAdminUpgradeabilityProxy2 is AdminUpgradeabilityProxy {
    constructor(
        address _logic,
        address _admin,
        bytes memory _data
    )
    AdminUpgradeabilityProxy(_logic, _admin, _data) public payable {
    }
}