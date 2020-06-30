pragma solidity ^0.5.0;

import "@openzeppelin/contracts-ethereum-package/contracts/ownership/Ownable.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";

import "../InitializableV2.sol";


/**
* @title Central hub for Audius protocol. It stores all contract addresses to facilitate
*   external access and enable version management.
*/
contract Registry is InitializableV2, Ownable {
    using SafeMath for uint;

    /**
     * @dev addressStorage mapping allows efficient lookup of current contract version
     *      addressStorageHistory maintains record of all contract versions
     */
    mapping(bytes32 => address) private addressStorage;
    mapping(bytes32 => address[]) private addressStorageHistory;

    event ContractAdded(bytes32 _name, address _address);
    event ContractRemoved(bytes32 _name, address _address);
    event ContractUpgraded(bytes32 _name, address _oldAddress, address _newAddress);

    function initialize() public initializer {
        /// @notice Ownable.initialize(address _sender) sets contract owner to _sender.
        Ownable.initialize(msg.sender);
        InitializableV2.initialize();
    }

    // ========================================= Setters =========================================

    /**
     * @notice addContract registers contract name to address mapping under given registry key
     * @param _name - registry key that will be used for lookups
     * @param _address - address of contract
     */
    function addContract(bytes32 _name, address _address) external onlyOwner {
        _requireIsInitialized();

        require(
            addressStorage[_name] == address(0x00),
            "Registry::addContract: Contract already registered with given name."
        );
        require(
            _address != address(0x00),
            "Registry::addContract: Cannot register zero address."
        );

        setAddress(_name, _address);

        emit ContractAdded(_name, _address);
    }

    /**
     * @notice removes contract address registered under given registry key
     * @param _name - registry key for lookup
     */
    function removeContract(bytes32 _name) external onlyOwner {
        _requireIsInitialized();

        address contractAddress = addressStorage[_name];
        require(
            contractAddress != address(0x00),
            "Registry::removeContract: Cannot remove - no contract registered with given _name."
        );

        setAddress(_name, address(0x00));

        emit ContractRemoved(_name, contractAddress);
    }

    /**
     * @notice replaces contract address registered under given key with provided address
     * @param _name - registry key for lookup
     * @param _newAddress - new contract address to register under given key
     */
    function upgradeContract(bytes32 _name, address _newAddress) external onlyOwner {
        _requireIsInitialized();

        address oldAddress = addressStorage[_name];
        require(
            oldAddress != address(0x00),
            "Registry::upgradeContract: Cannot upgrade - no contract registered with given _name."
        );

        setAddress(_name, _newAddress);

        emit ContractUpgraded(_name, oldAddress, _newAddress);
    }

    // ========================================= Getters =========================================

    /**
     * @notice returns contract address registered under given registry key
     * @param _name - registry key for lookup
     * @return contractAddr - address of contract registered under given registry key
     */
    function getContract(bytes32 _name) external view returns (address contractAddr) {
        _requireIsInitialized();
        
        return addressStorage[_name];
    }

    /// @notice overloaded getContract to return explicit version of contract
    function getContract(bytes32 _name, uint _version) external view
    returns (address contractAddr)
    {
        _requireIsInitialized();

        // array length for key implies version number
        require(
            _version <= addressStorageHistory[_name].length,
            "Registry::getContract: Index out of range _version."
        );
        return addressStorageHistory[_name][_version.sub(1)];
    }

    /**
     * @notice Returns the number of versions for a contract key
     * @param _name - registry key for lookup
     * @return number of contract versions
     */
    function getContractVersionCount(bytes32 _name) external view returns (uint) {
        _requireIsInitialized();
        
        return addressStorageHistory[_name].length;
    }

    // ========================================= Private functions =========================================

    /**
     * @param _key the key for the contract address
     * @param _value the contract address
     */
    function setAddress(bytes32 _key, address _value) private {
        // main map for cheap lookup
        addressStorage[_key] = _value;
        // keep track of contract address history
        addressStorageHistory[_key].push(_value);
    }

}
