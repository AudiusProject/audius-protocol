pragma solidity ^0.5.0;

import "@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";
import "./registry/RegistryContract.sol";
import "./interface/RegistryInterface.sol";


/** NOTE - will call RegistryContract.constructor, which calls Ownable constructor */
contract ServiceTypeManager is RegistryContract {
    using SafeMath for uint;
    RegistryInterface registry;
    address private controllerAddress;
    bytes32 private governanceKey;

    /**
     * @dev - mapping of serviceType - serviceTypeVersion
     * Example - "discovery-provider" - ["0.0.1", "0.0.2", ..., "currentVersion"]
     */
    mapping(bytes32 => bytes32[]) public serviceTypeVersions;

    // @dev List of valid service types
    bytes32[] private validServiceTypes;

    // @dev Struct representing service type stake requirements
    struct ServiceTypeStakeRequirements {
        uint minStake;
        uint maxStake;
    }

    // @dev mapping of service type to registered requirements
    mapping(bytes32 => ServiceTypeStakeRequirements) serviceTypeStakeRequirements;

    event SetServiceVersion(bytes32 _serviceType, bytes32 _serviceVersion);
    event Test(string msg, bool value);
    event TestAddr(string msg, address addr);

    function initialize(
        address _registryAddress,
        address _controllerAddress,
        bytes32 _governanceKey
    ) public initializer
    {
        // TODO move to RegistryContract as modifier
        require(_registryAddress != address(0x00), "Requires non-zero _registryAddress");
        registry = RegistryInterface(_registryAddress);
        controllerAddress = _controllerAddress;
        governanceKey = _governanceKey;

        RegistryContract.initialize();
    }

    function setServiceVersion(
        bytes32 _serviceType,
        bytes32 _serviceVersion
    ) external
    {
        _requireIsInitialized();
        require(controllerAddress == msg.sender, "Invalid signature for controller");

        uint numExistingVersions = this.getNumberOfVersions(_serviceType);

        for (uint i = 0; i < numExistingVersions; i++) {
            bytes32 existingVersion = this.getVersion(_serviceType, i);
            require(existingVersion != _serviceVersion, "Already registered");
        }

        serviceTypeVersions[_serviceType].push(_serviceVersion);

        emit SetServiceVersion(_serviceType, _serviceVersion);
    }

    /// @notice Add a new service type
    function addServiceType(
        bytes32 _serviceType,
        uint _serviceTypeMin,
        uint _serviceTypeMax
    ) external
    {
        _requireIsInitialized();
        require(
            (msg.sender == controllerAddress || msg.sender == registry.getContract(governanceKey)),
            "Only controller or governance");
        require(!this.isValidServiceType(_serviceType), "Already known service type");
        validServiceTypes.push(_serviceType);
        serviceTypeStakeRequirements[_serviceType] = ServiceTypeStakeRequirements({
            minStake: _serviceTypeMin,
            maxStake: _serviceTypeMax
        });
    }

    /// @notice Remove an existing service type
    function removeServiceType(bytes32 _serviceType) external {
        _requireIsInitialized();
        require(
            msg.sender == controllerAddress || msg.sender == registry.getContract(governanceKey),
            "Only controller or governance");
        uint serviceIndex = 0;
        bool foundService = false;
        for (uint i = 0; i < validServiceTypes.length; i ++) {
            if (validServiceTypes[i] == _serviceType) {
                serviceIndex = i;
                foundService = true;
                break;
            }
        }
        require(foundService == true, "Invalid service type, not found");
        // Overwrite service index
        uint lastIndex = validServiceTypes.length - 1;
        validServiceTypes[serviceIndex] = validServiceTypes[lastIndex];
        validServiceTypes.length--;
        // Overwrite values
        serviceTypeStakeRequirements[_serviceType].minStake = 0;
        serviceTypeStakeRequirements[_serviceType].maxStake = 0;
    }

    /// @notice Update a service type
    function updateServiceType(
        bytes32 _serviceType,
        uint _serviceTypeMin,
        uint _serviceTypeMax
    ) external
    {
        _requireIsInitialized();
        require(
            msg.sender == controllerAddress || msg.sender == registry.getContract(governanceKey),
            "Only controller or governance");
        require(this.isValidServiceType(_serviceType), "Invalid service type");
        serviceTypeStakeRequirements[_serviceType].minStake = _serviceTypeMin;
        serviceTypeStakeRequirements[_serviceType].maxStake = _serviceTypeMax;
    }

    function getVersion(bytes32 _serviceType, uint _versionIndex)
    external view returns (bytes32 version)
    {
        require(
            serviceTypeVersions[_serviceType].length > _versionIndex,
            "No registered version of serviceType"
        );
        return (serviceTypeVersions[_serviceType][_versionIndex]);
    }

    function getCurrentVersion(bytes32 _serviceType)
    external view returns (bytes32 currentVersion)
    {
        require(
            serviceTypeVersions[_serviceType].length >= 1,
            "No registered version of serviceType"
        );
        uint latestVersionIndex = serviceTypeVersions[_serviceType].length - 1;
        return (serviceTypeVersions[_serviceType][latestVersionIndex]);
    }

    function getNumberOfVersions(bytes32 _serviceType)
    external view returns (uint)
    {
        return serviceTypeVersions[_serviceType].length;
    }

    /// @notice Get min and max stake for a given service type
    /// @return min/max stake for type
    function getServiceTypeStakeInfo(bytes32 _serviceType)
    external view returns (uint min, uint max)
    {
        return (
            serviceTypeStakeRequirements[_serviceType].minStake,
            serviceTypeStakeRequirements[_serviceType].maxStake
        );
    }

    /// @notice Get list of valid service types
    function getValidServiceTypes()
    external view returns (bytes32[] memory types)
    {
        return validServiceTypes;
    }

    /// @notice Return indicating whether this is a valid service type
    function isValidServiceType(bytes32 _serviceType)
    external view returns (bool isValid)
    {
        return serviceTypeStakeRequirements[_serviceType].maxStake > 0;
    }
}
