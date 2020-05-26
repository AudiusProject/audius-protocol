pragma solidity ^0.5.0;

import "@openzeppelin/upgrades/contracts/upgradeability/AdminUpgradeabilityProxy.sol";


/**
 * Wrapper around OpenZeppelin's AdminUpgradeabilityProxy contract.
 * Permissions proxy upgrade logic to Audius Governance contract.
 * https://github.com/OpenZeppelin/openzeppelin-sdk/blob/release/2.8/packages/lib/contracts/upgradeability/AdminUpgradeabilityProxy.sol
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
     * @notice Upgrade the address of the logic contract for this proxy
     * @dev Wrapper on AdminUpgradeabilityProxy._upgradeTo.
     *      Adds a check to ensure msg.sender is the Audius Governance contract.
     * @param _newImplementation - new address of logic contract that the proxy will point to
     */
    function upgradeTo(address _newImplementation) external {
        require(
            msg.sender == governanceAddress,
            "Caller must be proxy admin or proxy upgrader"
        );
        _upgradeTo(_newImplementation);
    }

    /**
     * @notice Returns the Audius governance address
     */
    function getAudiusGovernanceAddress() external view returns (address) {
        return governanceAddress;
    }

    /**
     * @notice Set the Audius Governance address
     * @dev Callable by admin if governance address not yet set, else by Governance
     * @param _governanceAddress  - address of Governance contract
     */
    function setAudiusGovernanceAddress(address _governanceAddress) external {
        require(
            msg.sender == governanceAddress ||
            (governanceAddress == address(0x0) && msg.sender == _admin()),
            "Caller must be proxy admin or proxy upgrader"
        );
        governanceAddress = _governanceAddress;
    }
}
