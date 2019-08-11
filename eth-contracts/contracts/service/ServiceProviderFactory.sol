pragma solidity ^0.5.0;

import "./registry/RegistryContract.sol";
import "./interface/registry/RegistryInterface.sol";
import "./interface/ServiceProviderStorageInterface.sol";


contract ServiceProviderFactory is RegistryContract {
    RegistryInterface registry = RegistryInterface(0);
    bytes32 serviceProviderStorageRegistryKey;

    event RegisteredServiceProvider(
      uint _spID,
      bytes32 _serviceType,
      address _owner,
      string _endpoint
    );

    event DeregisteredServiceProvider(
      uint _spID,
      bytes32 _serviceType,
      address _owner,
      string _endpoint
    );

    constructor(
      address _registryAddress,
      bytes32 _serviceProviderStorageRegistryKey
    ) public
    {
        require(
            _registryAddress != address(0x00),
            "Requires non-zero _registryAddress"
        );
        registry = RegistryInterface(_registryAddress);
        serviceProviderStorageRegistryKey = _serviceProviderStorageRegistryKey;
    }

    function register(
        bytes32 _serviceType,
        string calldata _endpoint
    ) external returns (uint spID)
    {
        address owner = msg.sender;

        uint newServiceProviderID = ServiceProviderStorageInterface(
            registry.getContract(serviceProviderStorageRegistryKey)
        ).register(
            _serviceType,
            owner,
            _endpoint);

        emit RegisteredServiceProvider(
            newServiceProviderID,
            _serviceType,
            owner,
            _endpoint);

        return newServiceProviderID;
    }

    function deregister(
        bytes32 _serviceType,
        string calldata _endpoint
    ) external returns (uint deregisteredSpID)
    {
        address owner = msg.sender;

        uint deregisteredID = ServiceProviderStorageInterface(
            registry.getContract(serviceProviderStorageRegistryKey)
        ).deregister(
            _serviceType,
            owner,
            _endpoint);

        emit DeregisteredServiceProvider(
            deregisteredID,
            _serviceType,
            owner,
            _endpoint);

        return deregisteredID;
    }

    function getTotalServiceTypeProviders(bytes32 _serviceType)
    external view returns (uint numberOfProviders)
    {
        return ServiceProviderStorageInterface(
            registry.getContract(serviceProviderStorageRegistryKey)
        ).getTotalServiceTypeProviders(
            _serviceType
        );
    }

    function getServiceProviderInfo(bytes32 _serviceType, uint _serviceId)
    external view returns (address owner, string memory endpoint, uint blocknumber)
    {
        return ServiceProviderStorageInterface(
            registry.getContract(serviceProviderStorageRegistryKey)
        ).getServiceProviderInfo(
            _serviceType,
            _serviceId
        );
    }

    function getServiceProviderIdFromEndpoint(bytes32 _endpoint)
    external view returns (uint spID)
    {
        return ServiceProviderStorageInterface(
            registry.getContract(serviceProviderStorageRegistryKey)
        ).getServiceProviderIdFromEndpoint(_endpoint);
    }

    function getServiceProviderIdsFromAddress(address _ownerAddress, bytes32 _serviceType)
    external view returns (uint[] memory spIds)
    {
        return ServiceProviderStorageInterface(
            registry.getContract(serviceProviderStorageRegistryKey)
        ).getServiceProviderIdsFromAddress(
            _ownerAddress,
            _serviceType
        );
    }
}
