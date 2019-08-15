pragma solidity ^0.5.0;

import "../../../service/registry/RegistryContract.sol";
import "./UpgradeabilityProxy.sol";


/**
 * @title OwnedUpgradeabilityProxy
 * @dev This contract combines an upgradeability proxy with basic authorization control functionalities
 */
contract OwnedUpgradeabilityProxy is UpgradeabilityProxy, RegistryContract {
    /**
    * @dev Event to show ownership has been transferred
    * @param previousOwner representing the address of the previous owner
    * @param newOwner representing the address of the new owner
    */
    event ProxyOwnershipTransferred(address previousOwner, address newOwner);

    // Storage position of the owner of the contract
    bytes32 private constant PROXY_OWNER_POSITION = keccak256("org.audius.proxy.owner");

    /**
    * @dev the constructor sets the original owner of the contract to the sender account.
    */
    constructor() public {
        setUpgradeabilityOwner(msg.sender);
    }

    /**
    * @dev Throws if called by any account other than the owner.
    */
    modifier onlyProxyOwner() {
        require(msg.sender == proxyOwner(), "Invalid caller");
        _;
    }

    /**
     * @dev Tells the address of the owner
     * @return the address of the owner
     */
    function proxyOwner() public view returns (address owner) {
        bytes32 position = PROXY_OWNER_POSITION;
        assembly {
          owner := sload(position)
        }
    }

    /**
     * @dev Allows the current owner to transfer control of the contract to a newOwner.
     * @param newOwner The address to transfer ownership to.
     */
    function transferProxyOwnership(address newOwner) public onlyProxyOwner {
        require(newOwner != address(0), "Invalid newOwnerAddress");
        emit ProxyOwnershipTransferred(proxyOwner(), newOwner);
        setUpgradeabilityOwner(newOwner);
    }

    /**
     * @dev Allows the proxy owner to upgrade the current version of the proxy.
     * @param implementation representing the address of the new implementation to be set.
     */
    function upgradeTo(address implementation) public onlyProxyOwner {
        _upgradeTo(implementation);
    }

    /**
     * @dev Allows the proxy owner to upgrade the current version of the proxy and call the new implementation
     * to initialize whatever is needed through a low level call.
     * @param implementation representing the address of the new implementation to be set.
     * @param data represents the msg.data to bet sent in the low level call. This parameter may include the function
     * signature of the implementation to be called with the needed payload
     */
    function upgradeToAndCall(address payable implementation, bytes memory data) public payable onlyProxyOwner {
        upgradeTo(implementation);
        // TODO: Figure out if returnData is useful before removing
        (bool success, ) = address(this).call.value(msg.value)(data); 
        require(success, "Expect successful value");
    }

    /**
     * @dev Sets the address of the owner
     */
    function setUpgradeabilityOwner(address newProxyOwner) internal {
        bytes32 position = PROXY_OWNER_POSITION;
        assembly {
          sstore(position, newProxyOwner)
        }
    }
}
