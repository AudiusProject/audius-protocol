pragma solidity ^0.5.0;
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Mintable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "../service/registry/RegistryContract.sol";
import "../service/interface/registry/RegistryInterface.sol";
import "../service/DelegateManager.sol";


// TEST ONLY MOCK CONTRACT
contract MockGovernance is RegistryContract {
    RegistryInterface registry = RegistryInterface(0);
    bytes32 delegateManagerKey;

    constructor(
      address _registryAddress,
      bytes32 _delegateManagerKey
    ) public {
        registry = RegistryInterface(_registryAddress);
        delegateManagerKey = _delegateManagerKey;
    }

    // Test only function
    function testSlash(
        uint _amount,
        address _slashAddress
    ) external
    {
        DelegateManager delegateManager = DelegateManager(
            registry.getContract(delegateManagerKey)
        );
        delegateManager.slash(_amount, _slashAddress);
    }
}

