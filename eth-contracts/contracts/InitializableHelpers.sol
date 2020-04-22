pragma solidity >=0.4.24 <0.7.0;


/**
 * Adds isInitialized modifier to openzeppelin-sdk Initialized.sol contract.
 * This is needed because OZ's Initializable contract no longer exposes initialized state variable.
 * https://github.com/OpenZeppelin/openzeppelin-sdk/blob/v2.8.0/packages/lib/contracts/Initializable.sol
 */
contract InitializableHelpers {
    bool private initialized;

    string private constant ERROR_NOT_INITIALIZED = "INIT_NOT_INITIALIZED";
    string private constant ERROR_ALREADY_INITIALIZED = "ERROR_ALREADY_INITIALIZED";

    modifier isInitialized() {
        require(initialized == true, ERROR_NOT_INITIALIZED);
        _;
    }

    function setInitialized(bool isInitializedVal) internal {
        require(!initialized, ERROR_ALREADY_INITIALIZED);
        initialized = isInitializedVal;
    }

    function getInitialized() internal view returns (bool) {
        return initialized;
    }
}