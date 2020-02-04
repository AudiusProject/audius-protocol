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
        address delegateOwnerWallet;
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
    mapping(address => mapping(bytes32 => uint[])) serviceProviderAddressToId;

    /** @dev - mapping of address -> number of service providers registered */
    /** @notice - stores the number of services registered by a provider */
    mapping(address => uint) serviceProviderAddressNumberOfEndpoints;

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
        string calldata _endpoint,
        address _delegateOwnerWallet
    ) external onlyRegistrant(CALLER_REGISTRY_KEY) returns (uint spId)
    {
        require (
            serviceProviderEndpointToId[keccak256(bytes(_endpoint))] == 0,
            "Endpoint already registered");

        uint assignedSpId = serviceProviderTypeIDs[_serviceType] + 1;
        serviceProviderTypeIDs[_serviceType] = assignedSpId;

        // Index spInfo
        serviceProviderInfo[_serviceType][assignedSpId] = ServiceProvider({
            owner: _owner,
            endpoint: _endpoint,
            blocknumber: block.number,
            delegateOwnerWallet: _delegateOwnerWallet
        });

        // Update endpoint mapping
        serviceProviderEndpointToId[keccak256(bytes(_endpoint))] = assignedSpId;

        // Update address mapping
        uint spTypeLength = serviceProviderAddressToId[_owner][_serviceType].length;
        bool idFound = false;
        for (uint i = 0; i < spTypeLength; i++) {
            if (serviceProviderAddressToId[_owner][_serviceType][i] == assignedSpId) {
                idFound = true;
            }
        }
        if (!idFound) {
            serviceProviderAddressToId[_owner][_serviceType].push(assignedSpId);
        }

        // Increment number of endpoints for this address
        serviceProviderAddressNumberOfEndpoints[_owner] += 1;

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

        // Reset id, update array
        uint spTypeLength = serviceProviderAddressToId[_owner][_serviceType].length;
        for (uint i = 0; i < spTypeLength; i ++) {
            if (serviceProviderAddressToId[_owner][_serviceType][i] == deregisteredID) {
                // Overwrite element to be deleted with last element in array
                serviceProviderAddressToId[_owner][_serviceType][i] = serviceProviderAddressToId[_owner][_serviceType][spTypeLength - 1];
                // Reduce array size, exit loop
                serviceProviderAddressToId[_owner][_serviceType].length--;
                break;
            }
        }

        // Decrement number of endpoints for this address
        serviceProviderAddressNumberOfEndpoints[_owner] -= 1;
        return (deregisteredID);
    }

    function updateDelegateOwnerWallet(
        address _ownerAddress,
        bytes32 _serviceType,
        string calldata _endpoint,
        address _updatedDelegateOwnerWallet
    ) external onlyRegistrant(CALLER_REGISTRY_KEY) returns (address)
    {
        uint spID = this.getServiceProviderIdFromEndpoint(_endpoint);

        require(
            serviceProviderInfo[_serviceType][spID].owner == _ownerAddress,
            "Invalid update operation, wrong owner");

        serviceProviderInfo[_serviceType][spID].delegateOwnerWallet = _updatedDelegateOwnerWallet;
    }

    function getTotalServiceTypeProviders(bytes32 _serviceType)
    external view returns (uint numberOfProviders)
    {
        return serviceProviderTypeIDs[_serviceType];
    }

    function getServiceProviderInfo(bytes32 _serviceType, uint _serviceId)
    external view returns (
      address owner,
      string memory endpoint,
      uint blocknumber,
      address delegateOwnerWallet)
    {
        ServiceProvider memory sp = serviceProviderInfo[_serviceType][_serviceId];
        return (sp.owner, sp.endpoint, sp.blocknumber, sp.delegateOwnerWallet);
    }

    function getServiceProviderIdFromEndpoint(string calldata _endpoint)
    external view returns (uint spID)
    {
        return serviceProviderEndpointToId[keccak256(bytes(_endpoint))];
    }

    function getServiceProviderIdsFromAddress(address _ownerAddress, bytes32 _serviceType)
    external view returns (uint[] memory spID)
    {
        return serviceProviderAddressToId[_ownerAddress][_serviceType];
    }

    function getNumberOfEndpointsFromAddress(address _ownerAddress)
    external view returns (uint numberOfEndpoints)
    {
        return serviceProviderAddressNumberOfEndpoints[_ownerAddress];
    }

    function getDelegateOwnerWallet(
        address _ownerAddress,
        bytes32 _serviceType,
        string calldata _endpoint
    ) external view returns (address)
    {
        uint spID = this.getServiceProviderIdFromEndpoint(_endpoint);
        (address owner, , , address delegateOwnerWallet) = this.getServiceProviderInfo(
            _serviceType,
            spID);
        require(
            owner == _ownerAddress,
            "Mismatched delegate owner wallet");
        return delegateOwnerWallet;
    }
}
