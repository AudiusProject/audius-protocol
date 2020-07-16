pragma solidity ^0.5.0;

import "./InitializableV2.sol";
import "./Governance.sol";


contract ServiceTypeManager is InitializableV2 {
    address governanceAddress;

    string private constant ERROR_ONLY_GOVERNANCE = (
        "ServiceTypeManager: Only callable by Governance contract"
    );

    /**
     * @dev - mapping of serviceType - serviceTypeVersion
     * Example - "discovery-provider" - ["0.0.1", "0.0.2", ..., "currentVersion"]
     */
    mapping(bytes32 => bytes32[]) private serviceTypeVersions;

    /**
     * @dev - mapping of serviceType - < serviceTypeVersion, isValid >
     * Example - "discovery-provider" - <"0.0.1", true>
     */
    mapping(bytes32 => mapping(bytes32 => bool)) private serviceTypeVersionInfo;

    /// @dev List of valid service types
    bytes32[] private validServiceTypes;

    /// @dev Struct representing service type info
    struct ServiceTypeInfo {
        bool isValid;
        uint256 minStake;
        uint256 maxStake;
    }

    /// @dev mapping of service type info
    mapping(bytes32 => ServiceTypeInfo) private serviceTypeInfo;

    event SetServiceVersion(
        bytes32 indexed _serviceType,
        bytes32 indexed _serviceVersion
    );

    event ServiceTypeAdded(
        bytes32 indexed _serviceType,
        uint256 indexed _serviceTypeMin,
        uint256 indexed _serviceTypeMax
    );

    event ServiceTypeRemoved(bytes32 indexed _serviceType);

    /**
     * @notice Function to initialize the contract
     * @param _governanceAddress - Governance proxy address
     */
    function initialize(address _governanceAddress) public initializer
    {
        _updateGovernanceAddress(_governanceAddress);
        InitializableV2.initialize();
    }

    /// @notice Get the Governance address
    function getGovernanceAddress() external view returns (address) {
        _requireIsInitialized();

        return governanceAddress;
    }

    /**
     * @notice Set the Governance address
     * @dev Only callable by Governance address
     * @param _governanceAddress - address for new Governance contract
     */
    function setGovernanceAddress(address _governanceAddress) external {
        _requireIsInitialized();

        require(msg.sender == governanceAddress, ERROR_ONLY_GOVERNANCE);
        _updateGovernanceAddress(_governanceAddress);
    }

    // ========================================= Service Type Logic =========================================

    /**
     * @notice Add a new service type
     * @param _serviceType - type of service to add
     * @param _serviceTypeMin - minimum stake for service type
     * @param _serviceTypeMax - maximum stake for service type
     */
    function addServiceType(
        bytes32 _serviceType,
        uint256 _serviceTypeMin,
        uint256 _serviceTypeMax
    ) external
    {
        _requireIsInitialized();

        require(msg.sender == governanceAddress, ERROR_ONLY_GOVERNANCE);
        require(
            !this.serviceTypeIsValid(_serviceType),
            "ServiceTypeManager: Already known service type"
        );
        require(
            _serviceTypeMax > _serviceTypeMin,
            "ServiceTypeManager: Max stake must be non-zero and greater than min stake"
        );

        // Ensure serviceType cannot be re-added if it previously existed and was removed
        // stored maxStake > 0 means it was previously added and removed
        require(
            serviceTypeInfo[_serviceType].maxStake == 0,
            "ServiceTypeManager: Cannot re-add serviceType after it was removed."
        );

        validServiceTypes.push(_serviceType);
        serviceTypeInfo[_serviceType] = ServiceTypeInfo({
            isValid: true,
            minStake: _serviceTypeMin,
            maxStake: _serviceTypeMax
        });

        emit ServiceTypeAdded(_serviceType, _serviceTypeMin, _serviceTypeMax);
    }

    /**
     * @notice Remove an existing service type
     * @param _serviceType - name of service type to remove
     */
    function removeServiceType(bytes32 _serviceType) external {
        _requireIsInitialized();

        require(msg.sender == governanceAddress, ERROR_ONLY_GOVERNANCE);

        uint256 serviceIndex = 0;
        bool foundService = false;
        for (uint256 i = 0; i < validServiceTypes.length; i ++) {
            if (validServiceTypes[i] == _serviceType) {
                serviceIndex = i;
                foundService = true;
                break;
            }
        }
        require(foundService == true, "ServiceTypeManager: Invalid service type, not found");
        // Overwrite service index
        uint256 lastIndex = validServiceTypes.length - 1;
        validServiceTypes[serviceIndex] = validServiceTypes[lastIndex];
        validServiceTypes.length--;

        // Mark as invalid
        serviceTypeInfo[_serviceType].isValid = false;
        // Note - stake bounds are not reset so they can be checked to prevent serviceType from being re-added
        emit ServiceTypeRemoved(_serviceType);
    }

    /**
     * @notice Get isValid, min and max stake for a given service type
     * @param _serviceType - type of service
     * @return isValid, min and max stake for type
     */
    function getServiceTypeInfo(bytes32 _serviceType)
    external view returns (bool isValid, uint256 minStake, uint256 maxStake)
    {
        _requireIsInitialized();

        return (
            serviceTypeInfo[_serviceType].isValid,
            serviceTypeInfo[_serviceType].minStake,
            serviceTypeInfo[_serviceType].maxStake
        );
    }

    /**
     * @notice Get list of valid service types
     */
    function getValidServiceTypes()
    external view returns (bytes32[] memory)
    {
        _requireIsInitialized();

        return validServiceTypes;
    }

    /**
     * @notice Return indicating whether this is a valid service type
     */
    function serviceTypeIsValid(bytes32 _serviceType)
    external view returns (bool)
    {
        _requireIsInitialized();

        return serviceTypeInfo[_serviceType].isValid;
    }

    // ========================================= Service Version Logic =========================================

    /**
     * @notice Add new version for a serviceType
     * @param _serviceType - type of service
     * @param _serviceVersion - new version of service to add
     */
    function setServiceVersion(
        bytes32 _serviceType,
        bytes32 _serviceVersion
    ) external
    {
        _requireIsInitialized();

        require(msg.sender == governanceAddress, ERROR_ONLY_GOVERNANCE);
        require(this.serviceTypeIsValid(_serviceType), "ServiceTypeManager: Invalid service type");
        require(
            serviceTypeVersionInfo[_serviceType][_serviceVersion] == false,
            "ServiceTypeManager: Already registered"
        );

         // Update array of known versions for type
        serviceTypeVersions[_serviceType].push(_serviceVersion);

        // Update status for this specific service version
        serviceTypeVersionInfo[_serviceType][_serviceVersion] = true;

        emit SetServiceVersion(_serviceType, _serviceVersion);
    }

    /**
     * @notice Get a version for a service type given it's index
     * @param _serviceType - type of service
     * @param _versionIndex - index in list of service versions
     * @return bytes32 value for serviceVersion
     */
    function getVersion(bytes32 _serviceType, uint256 _versionIndex)
    external view returns (bytes32)
    {
        _requireIsInitialized();

        require(
            serviceTypeVersions[_serviceType].length > _versionIndex,
            "ServiceTypeManager: No registered version of serviceType"
        );
        return (serviceTypeVersions[_serviceType][_versionIndex]);
    }

    /**
     * @notice Get curent version for a service type
     * @param _serviceType - type of service
     * @return Returns current version of service
     */
    function getCurrentVersion(bytes32 _serviceType)
    external view returns (bytes32)
    {
        _requireIsInitialized();

        require(
            serviceTypeVersions[_serviceType].length >= 1,
            "ServiceTypeManager: No registered version of serviceType"
        );
        uint256 latestVersionIndex = serviceTypeVersions[_serviceType].length - 1;
        return (serviceTypeVersions[_serviceType][latestVersionIndex]);
    }

    /**
     * @notice Get total number of versions for a service type
     * @param _serviceType - type of service
     */
    function getNumberOfVersions(bytes32 _serviceType)
    external view returns (uint256)
    {
        _requireIsInitialized();

        return serviceTypeVersions[_serviceType].length;
    }

    /**
     * @notice Return boolean indicating whether given version is valid for given type
     * @param _serviceType - type of service
     * @param _serviceVersion - version of service to check
     */
    function serviceVersionIsValid(bytes32 _serviceType, bytes32 _serviceVersion)
    external view returns (bool)
    {
        _requireIsInitialized();

        return serviceTypeVersionInfo[_serviceType][_serviceVersion];
    }

    /**
     * @notice Set the governance address after confirming contract identity
     * @param _governanceAddress - Incoming governance address
     */
    function _updateGovernanceAddress(address _governanceAddress) internal {
        require(
            Governance(_governanceAddress).isGovernanceAddress() == true,
            "ServiceTypeManager: _governanceAddress is not a valid governance contract"
        );
        governanceAddress = _governanceAddress;
    }
}
