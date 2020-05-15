pragma solidity ^0.5.0;

import "@openzeppelin/contracts-ethereum-package/contracts/ownership/Ownable.sol";

import "../../InitializableV2.sol";
import "../interface/registry/RegistryInterface.sol";


/**
 * @title Parent class to all contracts used to check that a contract is registerable
 * @notice RegistryContract is Ownable so the deployer can re-register it against new registries
 * @dev The Registry uses this to talk to all contracts that inherit from this contract.
 */
contract RegistryContract is InitializableV2, Ownable {

    struct Multihash {
        bytes32 digest;
        uint8 hashFn;
        uint8 size;
    }

    address payable internal registryAddress;

    function initialize() public initializer {
        InitializableV2.initialize();
        Ownable.initialize(msg.sender);
    }

    function setRegistry(address payable _registryAddress) external {
        _requireIsInitialized();
        require(
            registryAddress == address(0x00) ||
            registryAddress == msg.sender ||
            this.owner() == msg.sender,
            "Can only be called if registryAddress is empty, msg.sender or owner"
        );
        registryAddress = _registryAddress;
    }

    function kill() external {
        _requireIsInitialized();
        require(
            registryAddress != address(0x00),
            "RegistryContract::kill: Registry address has not yet been set."
        );
        require(
            msg.sender == registryAddress,
            "RegistryContract::kill: Only registry can kill."
        );
        selfdestruct(registryAddress);
    }
}
