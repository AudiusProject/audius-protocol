pragma solidity ^0.5.0;

import "@openzeppelin/upgrades/contracts/upgradeability/UpgradeabilityProxy.sol";


/**
 * Wrapper around OpenZeppelin's UpgradeabilityProxy contract.
 * Permissions proxy upgrade logic to Audius Governance contract.
 * https://github.com/OpenZeppelin/openzeppelin-sdk/blob/release/2.8/packages/lib/contracts/upgradeability/AdminUpgradeabilityProxy.sol
 */
contract AudiusAdminUpgradeabilityProxy is UpgradeabilityProxy {
    address private governanceAddress;
    address private proxyAdmin;

    /**
     * @notice Sets admin address for future upgrades
     * @param _logic - address of underlying logic contract.
     *      Passed to UpgradeabilityProxy constructor.
     * @param _proxyAdmin - address of proxy admin
     *      Set to governance contract address for all non-governance contracts
     *      Governance is deployed and upgraded to have own address as admin
     * @param _data - data of function to be called on logic contract.
     *      Passed to UpgradeabilityProxy constructor.
     */
    constructor(
      address _logic,
      address _proxyAdmin,
      bytes memory _data
    )
    UpgradeabilityProxy(_logic, _data) public payable
    {
        proxyAdmin = _proxyAdmin;
    }

    /**
     * @notice Upgrade the address of the logic contract for this proxy
     * @dev Recreation of AdminUpgradeabilityProxy._upgradeTo.
     *      Adds a check to ensure msg.sender is the Audius Proxy Admin
     * @param _newImplementation - new address of logic contract that the proxy will point to
     */
    function upgradeTo(address _newImplementation) external {
        require(
            msg.sender == proxyAdmin,
            "Caller must be current proxy admin"
        );
        _upgradeTo(_newImplementation);
    }

    /// @notice Returns the Audius governance address
    function getAudiusProxyAdminAddress() external view returns (address) {
        return proxyAdmin;
    }

    /**
    * @return The address of the implementation.
    */
    function implementation() external view returns (address) {
        return _implementation();
    }

    /**
     * @notice Set the Audius Proxy Admin
     * @dev Only callable by current proxy admin address
     * @param _adminAddress - new admin address
     */
    function setAudiusProxyAdminAddress(address _adminAddress) external {
        require(
            msg.sender == proxyAdmin,
            "Caller must be proxy admin or proxy upgrader"
        );
        proxyAdmin = _adminAddress;
    }
}
