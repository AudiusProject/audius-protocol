pragma solidity ^0.5.0;

import "@openzeppelin/upgrades/contracts/upgradeability/AdminUpgradeabilityProxy.sol";


/**
 * Wrapper around OpenZeppelin's AdminUpgradeabilityProxy contract.
 * Permissions proxy upgrade logic to Audius Governance contract.
 * https://github.com/OpenZeppelin/openzeppelin-sdk/blob/release/2.8/packages/lib/contracts/upgradeability/AdminUpgradeabilityProxy.sol
 */
contract AudiusAdminUpgradeabilityProxy is AdminUpgradeabilityProxy {
    address private governanceAddress;

    /**
     * @notice Sets governance address for future upgrades
     * @param _logic - address of underlying logic contract.
     *      Passed to AdminUpgradeabilityProxy constructor.
     * @param _proxyAdmin - address of proxy admin, but cedes upgrade control to _governanceAddress.
     *      Passed to AdminUpgradeabilityProxy constructor.
     * @param _data - data of function to be called on logic contract.
     *      Passed to AdminUpgradeabilityProxy constructor.
     * @param _governanceAddress - address of Audius governance contract, which has proxy upgrade control.
     */
    constructor(
      address _logic,
      address _proxyAdmin,
      bytes memory _data,
      address _governanceAddress
    )
    AdminUpgradeabilityProxy(_logic, _proxyAdmin, _data) public payable
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
            "Caller must be current proxy governance address"
        );
        super._upgradeTo(_newImplementation); //_upgradeTo(_newImplementation);
    }

    /**
     * @notice Upgrade the address of the logic contract for this proxy and invoke a function
     * @dev Wrapper on AdminUpgradeabilityProxy.upgradeToAndCall.
     *      Adds a check to ensure msg.sender is the Audius Governance contract.
     * @param _newImplementation - new address of logic contract that the proxy will point to
     * @param _data - data for the initial function
     */
    // solium-disable security/no-low-level-calls
    function upgradeToAndCall(address _newImplementation, bytes calldata _data) external payable {
        require(
            msg.sender == governanceAddress,
            "Caller must be current proxy governance address"
        );
        // this.upgradeToAndCall(_newImplementation, _callData);
        super._upgradeTo(_newImplementation);
        (bool success,) = _newImplementation.delegatecall(_data);
        require(success == true, "Failed to invoke provided function");
    }

    /// @notice Returns the Audius governance address
    function getAudiusGovernanceAddress() external view returns (address) {
        return governanceAddress;
    }

    /**
     * @notice Set the Audius Governance address
     * @dev Callable by admin if governance address not yet set, else by Governance
     * @param _governanceAddress - address of Governance contract
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
