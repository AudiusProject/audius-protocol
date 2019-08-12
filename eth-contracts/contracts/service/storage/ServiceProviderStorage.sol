pragma solidity ^0.5.0;

import "../registry/RegistryContract.sol";
import "../interface/registry/RegistryInterface.sol";


/** @title - The persistent storage for Audius Service Providers */
contract ServiceProviderStorage is RegistryContract {

    /** Struct maintaining information about sp */
    struct ServiceProvider {
        address owner;
        string endpoint;
        uint blocknumber;
        address delegatePublicKey;
    }

    bytes32 constant CALLER_REGISTRY_KEY = "ServiceProviderFactory";

    RegistryInterface registry = RegistryInterface(0);

    /** @dev - Uniquely assigned serviceProvider ID, incremented for each service type */
    /** @notice - Keeps track of the total number of services registered regardless of
    whether some have been deregistered since */
    mapping(bytes32 => uint) serviceProviderTypeIDs;

    /** @dev - mapping of (serviceType -> (serviceInstanceId <-> serviceProviderInfo)) */
    /** @notice - stores the actual service provider data like endpoint and owner wallet
    with the ability lookup by service type and service id */
    mapping(bytes32 => mapping(uint => ServiceProvider)) serviceProviderInfo;

    /** @dev - mapping of keccak256(endpoint) to uint ID */
    /** @notice - used to check if a endpoint has already been registered and also lookup
    the id of an endpoint */
    mapping(bytes32 => uint) serviceProviderEndpointToId;

    /** @dev - mapping of address -> sp id array */
    /** @notice - stores all the services registered by a provider. for each address,
    provides the ability to lookup by service type and see all registered services */
    mapping(address => mapping(bytes32 => uint)) serviceProviderAddressToId;

    /** @dev - mapping of address -> number of service providers registered */
    /** @notice - stores the number of services registered by a provider, can never be >1 */
    mapping(address => uint) serviceProviderAddressNumberOfEndpoints;

    event TestStg(
      bytes32 test,
      string msg);


    constructor(address _registryAddress) public {
        require(
            _registryAddress != address(0x00),
            "Requires non-zero _registryAddress"
        );
        registry = RegistryInterface(_registryAddress);
    }

    function register(
        bytes32 _serviceType,
        address _owner,
        string calldata _endpoint
    ) external onlyRegistrant(CALLER_REGISTRY_KEY) returns (uint spId)
    {
        require (
            serviceProviderEndpointToId[keccak256(bytes(_endpoint))] == 0,
            "Endpoint already registered");

        require (
          serviceProviderAddressNumberOfEndpoints[_owner] == 0,
          "Account already has an endpoint registered");

        uint assignedSpId = serviceProviderTypeIDs[_serviceType] + 1;
        serviceProviderTypeIDs[_serviceType] = assignedSpId;

        // Index spInfo
        serviceProviderInfo[_serviceType][assignedSpId] = ServiceProvider({
            owner: _owner,
            endpoint: _endpoint,
            blocknumber: block.number,
            delegatePublicKey: _owner
        });

        // Update endpoint mapping
        serviceProviderEndpointToId[keccak256(bytes(_endpoint))] = assignedSpId;

        // Update address mapping
        serviceProviderAddressToId[_owner][_serviceType] = assignedSpId;

        // Update count mapping for this address to 1
        serviceProviderAddressNumberOfEndpoints[_owner] = 1;

        return assignedSpId;
    }

    function deregister(bytes32 _serviceType, address _owner, string calldata _endpoint)
    external onlyRegistrant(CALLER_REGISTRY_KEY) returns (uint deregisteredSpID)
    {
        require (
            serviceProviderEndpointToId[keccak256(bytes(_endpoint))] != 0,
            "Endpoint not registered");

        // Cache invalided service provider ID
        uint deregisteredID = serviceProviderEndpointToId[keccak256(bytes(_endpoint))];

        // Update endpoint mapping
        serviceProviderEndpointToId[keccak256(bytes(_endpoint))] = 0;

        require (
            serviceProviderInfo[_serviceType][deregisteredID].owner == _owner,
            "Invalid deregister operation");

        // Update info mapping
        delete serviceProviderInfo[_serviceType][deregisteredID];

        // Reset id
        serviceProviderAddressToId[_owner][_serviceType] = 0;

        // Update count mapping to 0
        serviceProviderAddressNumberOfEndpoints[_owner] = 0;

        return deregisteredID;
    }

    function getTotalServiceTypeProviders(bytes32 _serviceType)
    external view returns (uint numberOfProviders)
    {
        return serviceProviderTypeIDs[_serviceType];
    }

    function getServiceProviderInfo(bytes32 _serviceType, uint _serviceId)
    external view returns (address owner, string memory endpoint, uint blocknumber)
    {
        ServiceProvider memory sp = serviceProviderInfo[_serviceType][_serviceId];
        return (sp.owner, sp.endpoint, sp.blocknumber);
    }

    function getServiceProviderIdFromEndpoint(bytes32 _endpoint)
    external view returns (uint spID)
    {
        return serviceProviderEndpointToId[_endpoint];
    }

    function getServiceProviderIdFromAddress(address _ownerAddress, bytes32 _serviceType)
    external view returns (uint spID)
    {
        return serviceProviderAddressToId[_ownerAddress][_serviceType];
    }
}
