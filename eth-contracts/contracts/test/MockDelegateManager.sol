pragma solidity ^0.5.0;
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Mintable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "../service/registry/RegistryContract.sol";
import "../service/interface/registry/RegistryInterface.sol";
import "../service/ClaimFactory.sol";


// TEST ONLY MOCK CONTRACT
contract MockDelegateManager is RegistryContract {
    RegistryInterface registry = RegistryInterface(0);
    bytes32 claimFactoryKey;

    constructor(
      address _registryAddress,
      bytes32 _claimFactoryKey
    ) public {
        registry = RegistryInterface(_registryAddress);
        claimFactoryKey = _claimFactoryKey;
    }

    // Test only function
    function testProcessClaim(
        address _claimer,
        uint _totalLockedForSP
    ) external returns (uint newAccountTotal) {
        ClaimFactory claimFactory = ClaimFactory(
            registry.getContract(claimFactoryKey)
        );
        return claimFactory.processClaim(_claimer, _totalLockedForSP);
    }
}

