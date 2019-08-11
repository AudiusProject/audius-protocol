pragma solidity ^0.5.0;

/// @title - Interface for Audius DiscoveryProviderFactory contract
interface DiscoveryProviderFactoryInterface {
    function getDiscoveryProvider(uint _id) external view
        returns (address wallet, string memory endpoint);
    function getTotalNumberOfProviders() external view returns (uint total);
    function register(string calldata _endpoint) external returns (uint discProvId);
}
