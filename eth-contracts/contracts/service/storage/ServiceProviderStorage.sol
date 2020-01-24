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
    /** @notice - stores the number of services registered by a provider, can never be >1 */
    mapping(address => uint) serviceProviderAddressNumberOfEndpoints;

    /** @dev - mapping of delegateOwnerWallet -> address */
    /** @notice - stores the current user of a delegate owner wallet, these cannot be duplicated
    between registrants */
   // TODO: Revisit if this still works as expected, we MIGHT have to an endpoint instead as the value
   // mapping(address => address) delegateOwnerWalletToServiceProvider;

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
        string calldata _endpoint,
        address _delegateOwnerWallet
    ) external onlyRegistrant(CALLER_REGISTRY_KEY) returns (uint spId)
    {
        require (
            serviceProviderEndpointToId[keccak256(bytes(_endpoint))] == 0,
            "Endpoint already registered");

            /*
        require (
          serviceProviderAddressNumberOfEndpoints[_owner] == 0,
          "Account already has an endpoint registered");
          */

        /*require (
          delegateOwnerWalletToServiceProvider[_delegateOwnerWallet] == address(0x0),
          "Registering account is a delegate wallet");
          */

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
        // serviceProviderAddressToId[_owner][_serviceType] = assignedSpId;
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

        // Update count mapping for this address to 1
        serviceProviderAddressNumberOfEndpoints[_owner] = 1;

        // Update delegate owner wallet mapping
        // delegateOwnerWalletToServiceProvider[_delegateOwnerWallet] = _owner;

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

        address delegateOwner = serviceProviderInfo[_serviceType][deregisteredID].delegateOwnerWallet; 

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

        // Update count mapping to 0
        serviceProviderAddressNumberOfEndpoints[_owner] = 0;

        // Update delegate owner wallet mapping
        // delegateOwnerWalletToServiceProvider[delegateOwner] = address(0x0);

        return deregisteredID;
    }

    function updateDelegateOwnerWallet(
      address _ownerAddress,
      bytes32 _serviceType,
      string calldata _endpoint,
      address _updatedDelegateOwnerWallet
    ) external returns (address) 
    {
      // uint spID = this.getServiceProviderIdFromAddress(_ownerAddress, _serviceType);
      uint spID = this.getServiceProviderIdFromEndpoint(_endpoint);
      address oldDelegateWallet = serviceProviderInfo[_serviceType][spID].delegateOwnerWallet;

      require(
        serviceProviderInfo[_serviceType][spID].owner == _ownerAddress,
        "Invalid update operation, wrong owner");

      serviceProviderInfo[_serviceType][spID].delegateOwnerWallet = _updatedDelegateOwnerWallet;

      // Invalidate existing mapping
      // delegateOwnerWalletToServiceProvider[oldDelegateWallet] = address(0x0);

      // Update mapping
      // delegateOwnerWalletToServiceProvider[_updatedDelegateOwnerWallet] = _ownerAddress; 
    }

    function getTotalServiceTypeProviders(bytes32 _serviceType)
    external view returns (uint numberOfProviders)
    {
        return serviceProviderTypeIDs[_serviceType];
    }

    function getServiceProviderInfo(bytes32 _serviceType, uint _serviceId)
    external view returns (address owner, string memory endpoint, uint blocknumber, address delegateOwnerWallet)
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
    
    function getDelegateOwnerWallet(
      address _ownerAddress,
      bytes32 _serviceType,
      string calldata _endpoint
    ) external view returns (address)
    {
      uint spID = this.getServiceProviderIdFromEndpoint(_endpoint);
      (address owner, , , address delegateOwnerWallet) = this.getServiceProviderInfo(_serviceType, spID);
      require(
        owner == _ownerAddress,
        "Mismatched delegate owner wallet");
      return delegateOwnerWallet;
    }
}
