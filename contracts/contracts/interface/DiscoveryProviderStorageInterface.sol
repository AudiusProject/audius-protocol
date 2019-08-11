pragma solidity ^0.5.0;

/// @title The interface for contracts to interact with the Audius DiscoveryProviderStorage contract
interface DiscoveryProviderStorageInterface {
    function getDiscoveryProvider(uint _id) external view
        returns (address wallet, string memory endpoint);
    function getTotalNumberOfProviders() external view returns (uint total);
    function register(address _wallet, string calldata _endpoint) external returns (uint id);
}
