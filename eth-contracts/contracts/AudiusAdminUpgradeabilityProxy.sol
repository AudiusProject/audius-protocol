pragma solidity ^0.5.0;

import "@openzeppelin/upgrades/contracts/upgradeability/AdminUpgradeabilityProxy.sol";

import "./interface/RegistryInterface.sol";


/**
 * Wrapper around OpenZeppelin's AdminUpgradeabilityProxy contract.
 * Exposes state management for an additional controller address that allows logic contract to be upgraded by
 *    another contract. Controller contract must be registered in Audius registry.
 * https://github.com/OpenZeppelin/openzeppelin-sdk/blob/release/2.8/packages/lib/contracts/upgradeability/AdminUpgradeabilityProxy.sol
 *
 * @dev TODO - rename "controller" to "governance" for clarity
 */
contract AudiusAdminUpgradeabilityProxy is AdminUpgradeabilityProxy {
    RegistryInterface private audiusRegistry;
    bytes32 private controllerRegistryKey;

    constructor(
      address _logic,
      address _admin,
      bytes memory _data,
      address _registryAddress,
      bytes32 _controllerRegistryKey
    )
    AdminUpgradeabilityProxy(_logic, _admin, _data) public payable
    {
        audiusRegistry = RegistryInterface(_registryAddress);
        controllerRegistryKey = _controllerRegistryKey;
    }

    /**
     * Wrapper on AdminUpgradeabilityProxy._upgradeTo.
     * Adds a check to ensure msg.sender is admin or a registered controller contract.
     */
    function upgradeTo(address _newImplementation) external {
        require(
            msg.sender == audiusRegistry.getContract(controllerRegistryKey) || msg.sender == _admin(),
            "Caller must be proxy admin or proxy upgrader"
        );
        _upgradeTo(_newImplementation);
    }

    function getAudiusRegistry() external view returns (address) {
        return address(audiusRegistry);
    }

    function setAudiusRegistry(address _registryAddress) external ifAdmin {
        audiusRegistry = RegistryInterface(_registryAddress);
    }

    function getControllerRegistryKey() external view returns (bytes32) {
        return controllerRegistryKey;
    }

    function setControllerRegistryKey(bytes32 _controllerRegistryKey) external ifAdmin {
        require(
            audiusRegistry.getContract(_controllerRegistryKey) != address(0x00),
            "No contract registered for provided registry key"
        );
        controllerRegistryKey = _controllerRegistryKey;
    }
}
