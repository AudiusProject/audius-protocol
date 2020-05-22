pragma solidity ^0.5.0;

import "@openzeppelin/upgrades/contracts/upgradeability/AdminUpgradeabilityProxy.sol";


/**
 * Wrapper around OpenZeppelin's AdminUpgradeabilityProxy contract.
 * Exposes state management for an additional controller address that allows logic contract to be upgraded by
 *    another contract. Controller contract must be registered in Audius registry.
 * https://github.com/OpenZeppelin/openzeppelin-sdk/blob/release/2.8/packages/lib/contracts/upgradeability/AdminUpgradeabilityProxy.sol
 *
 * @dev TODO - rename "controller" to "governance" for clarity
 */
contract AudiusAdminUpgradeabilityProxy is AdminUpgradeabilityProxy {
    address governanceAddress;

    constructor(
      address _logic,
      address _admin,
      bytes memory _data,
      address _governanceAddress
    )
    AdminUpgradeabilityProxy(_logic, _admin, _data) public payable
    { 
        governanceAddress = _governanceAddress;
    }

    /**
     * Wrapper on AdminUpgradeabilityProxy._upgradeTo.
     * Adds a check to ensure msg.sender is admin or a registered controller contract.
     */
    function upgradeTo(address _newImplementation) external {
        require(
            msg.sender == governanceAddress,
            "Caller must be proxy admin or proxy upgrader"
        );
        _upgradeTo(_newImplementation);
    }

    function getAudiusGovernanceAddress() external view returns (address) {
        return governanceAddress;
    }

    function setAudiusGovernanceAddress(address _governanceAddress) external {
        require(
            msg.sender == governanceAddress ||
            (governanceAddress == address(0x0) && msg.sender == _admin()),
            "Caller must be proxy admin or proxy upgrader"
        );
        governanceAddress = _governanceAddress;
    }
}
