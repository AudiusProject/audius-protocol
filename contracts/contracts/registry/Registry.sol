pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "../interface/RegistryContractInterface.sol";


/**
* @title Central hub for RegistryContracts that stores all contract addresses
*    and facilitates inter-contract communication
* @dev The registry acts as the central hub for all RegistryContracts.
*    It stores the addresses for all contracts so when one contract wants to
*    communicate with with another, it must go:
*      Calling Contract -> Registry -> Destination Contract
*    It also serves as a communication hub and a version manager that can
*    upgrade existing contracts and remove contracts
* @dev for simplicity, this is the only contract that does not have de-coupled storage
*/
contract Registry is Ownable {

    /**
     * @dev addressStorage mapping allows efficient lookup of current contract version
     *      addressStorageHistory maintains record of all contract versions
     */
    mapping(bytes32 => address) private addressStorage;
    mapping(bytes32 => address[]) private addressStorageHistory;

    event ContractAdded(bytes32 _name, address _address);
    event ContractRemoved(bytes32 _name, address _address);
    event ContractUpgraded(bytes32 _name, address _oldAddress, address _newAddress);

    /**
     * @dev addContract does two things:
     *      1.) registers the address of given RegistryContract in the registry
     *      2.) sets the registry address in given RegistryContract so only
     *          the registry can call functions on given contract
     */
    function addContract(bytes32 _name, address _address) external onlyOwner {
        require(
            addressStorage[_name] == address(0x00),
            "Requires that given _name does not already have non-zero registered contract address"
        );
        require(
            _address != address(0x00),
            "Requires non-zero _address"
        );
        RegistryContractInterface(_address).setRegistry(address(this));
        setAddress(_name, _address);
        emit ContractAdded(_name, _address);
    }

    /**
     * @notice returns contract address registered under given registry key
     * @param _name - registry key for lookup
     * @return contractAddr - address of contract registered under given registry key
     */
    function getContract(bytes32 _name) external view returns (address contractAddr) {
        return addressStorage[_name];
    }

    /** @notice overloaded getContract to return explicit version of contract */
    function getContract(bytes32 _name, uint _version) external view
    returns (address contractAddr)
    {
        // array length for key implies version number
        require(
            _version <= addressStorageHistory[_name].length,
            "Index out of range `_version`"
        );
        return addressStorageHistory[_name][_version - 1];
    }

    function getContractVersionCount(bytes32 _name) external view returns (uint) {
        return addressStorageHistory[_name].length;
    }

    /**
     * @notice removes contract address registered under given registry key
     * @param _name - registry key for lookup
     */
    function removeContract(bytes32 _name) external onlyOwner {
        address contractAddress = addressStorage[_name];
        require(
            contractAddress != address(0x00),
            "Requires that given _name already has non-zero registered contract address"
        );
        RegistryContractInterface(contractAddress).kill();
        setAddress(_name, address(0x00));
        emit ContractRemoved(_name, contractAddress);
    }

    /**
     * @notice replaces contract address registered under given key with provided address
     * @param _name - registry key for lookup
     * @param _newAddress - new contract address to register under given key
     */
    function upgradeContract(bytes32 _name, address _newAddress) external onlyOwner {
        address oldAddress = addressStorage[_name];
        require(
            oldAddress != address(0x00),
            "Requires given _name already has non-zero registered contract address"
        );
        RegistryContractInterface(oldAddress).kill();
        RegistryContractInterface(_newAddress).setRegistry(address(this));
        setAddress(_name, _newAddress);
        emit ContractUpgraded(_name, oldAddress, _newAddress);
    }

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
