pragma solidity >=0.4.24 <0.7.0;

import "@openzeppelin/upgrades/contracts/Initializable.sol";


/**
 * Wrapper around OpenZeppelin's Initializable contract.
 * Exposes initialized state management to ensure logic contract functions cannot be called before initialization.
 * This is needed because OZ's Initializable contract no longer exposes initialized state variable.
 * https://github.com/OpenZeppelin/openzeppelin-sdk/blob/v2.8.0/packages/lib/contracts/Initializable.sol
 */
contract InitializableV2 is Initializable {
    bool private isInitialized;

    string private constant ERROR_NOT_INITIALIZED = "INIT_NOT_INITIALIZED";
    string private constant ERROR_ALREADY_INITIALIZED = "ERROR_ALREADY_INITIALIZED";

    function initialize() public initializer {
        isInitialized = true;
    }

    function _requireIsInitialized() internal view {
        require(isInitialized == true, ERROR_NOT_INITIALIZED);
    }

    function _isInitialized() internal view returns (bool) {
        return isInitialized;
    }
}
