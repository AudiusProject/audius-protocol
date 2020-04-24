pragma solidity ^0.5.0;
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Mintable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "../service/registry/RegistryContract.sol";
import "../service/interface/registry/RegistryInterface.sol";
import "../service/ClaimsManager.sol";


// TEST ONLY MOCK CONTRACT
contract MockDelegateManager is RegistryContract {
    RegistryInterface registry = RegistryInterface(0);
    bytes32 claimsManagerProxyKey;

    constructor(
      address _registryAddress,
      bytes32 _claimsManagerProxyKey
    ) public {
        registry = RegistryInterface(_registryAddress);
        claimsManagerProxyKey = _claimsManagerProxyKey;
    }

    // Test only function
    function testProcessClaim(
        address _claimer,
        uint _totalLockedForSP
    ) external returns (uint newAccountTotal) {
        ClaimsManager claimsManager = ClaimsManager(
            registry.getContract(claimsManagerProxyKey)
        );
        return claimsManager.processClaim(_claimer, _totalLockedForSP);
    }
}

