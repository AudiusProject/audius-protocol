pragma solidity ^0.5.0;

import "./interface/RegistryInterface.sol";
import "./registry/RegistryContract.sol";
import "./interface/DiscoveryProviderStorageInterface.sol";


/** @title Contract responsible for managing discovery provider on-chain business logic */
contract DiscoveryProviderFactory is RegistryContract {

    RegistryInterface registry = RegistryInterface(0);
    bytes32 discoveryProviderStorageRegistryKey;

    event NewDiscoveryProvider(uint _id, address _wallet, string _endpoint);

    /** @notice - Sets registry address and discovery provider storage contract registry key */
    constructor(address _registryAddress, bytes32 _discoveryProviderStorageRegistryKey) public
    {
        require(
            _registryAddress != address(0x00) &&
            _discoveryProviderStorageRegistryKey.length != 0,
            "Requires non-zero _registryAddress and non-empty _discoveryProviderStorageRegistryKey"
        );
        registry = RegistryInterface(_registryAddress);
        discoveryProviderStorageRegistryKey = _discoveryProviderStorageRegistryKey;
    }

    /** @notice - returns registered discovery provider given its id */
    function getDiscoveryProvider(uint _id)
    external view returns (address wallet, string memory endpoint)
    {
        return DiscoveryProviderStorageInterface(
            registry.getContract(discoveryProviderStorageRegistryKey)
        ).getDiscoveryProvider(_id);
    }

    /** @notice - returns the total number of discProvIds currently on contract */
    function getTotalNumberOfProviders()
    external view returns (uint total)
    {
        return DiscoveryProviderStorageInterface(
            registry.getContract(discoveryProviderStorageRegistryKey)
        ).getTotalNumberOfProviders();
    }

    /** @notice - adds new discovery provider to DiscoveryProviderStorage */
    function register(string calldata _endpoint)
    external returns (uint discProvId)
    {
        discProvId = DiscoveryProviderStorageInterface(
            registry.getContract(discoveryProviderStorageRegistryKey)
        ).register(msg.sender, _endpoint);
        emit NewDiscoveryProvider(discProvId, msg.sender, _endpoint);
        return discProvId;
    }
}
