pragma solidity ^0.5.0;

import "../registry/RegistryContract.sol";
import "../interface/RegistryInterface.sol";


/** @title - The persistent storage for Audius Discovery Providers
*  @dev - TODO - needs to be converted to proper eternal dumb storage
*/
contract DiscoveryProviderStorage is RegistryContract {

    bytes32 constant CALLER_REGISTRY_KEY = "DiscoveryProviderFactory";

    RegistryInterface registry = RegistryInterface(0);

    /** @dev - Uniquely assigned discProvId, incremented for each new assignment */
    uint discProvId = 1;
    /** @dev - mapping of discProvIds => wallets */
    mapping(uint => address) public discProvWallets;
    /** @dev - mapping of discProvIds => endpoints */
    mapping(uint => string) public discProvEndpoints;

    constructor(address _registryAddress) public {
        require(
            _registryAddress != address(0x00),
            "Requires non-zero _registryAddress"
        );
        registry = RegistryInterface(_registryAddress);
    }

    function getDiscoveryProvider(uint _id)
    external view onlyRegistrant(CALLER_REGISTRY_KEY)
    returns (address wallet, string memory endpoint)
    {
        return (discProvWallets[_id], discProvEndpoints[_id]);
    }

    /** @notice - returns the total number of discProvIds currently on contract */
    function getTotalNumberOfProviders()
    external view onlyRegistrant(CALLER_REGISTRY_KEY)
    returns (uint total)
    {
        return (discProvId - 1);
    }

    /** @dev - adds new discovery provider fields to storage, returns id of registered discprov */
    function register(address _wallet, string calldata _endpoint)
    external onlyRegistrant(CALLER_REGISTRY_KEY) returns (uint id)
    {
        discProvWallets[discProvId] = _wallet;
        discProvEndpoints[discProvId] = _endpoint;
        discProvId += 1;
        return (discProvId - 1);
    }

}
