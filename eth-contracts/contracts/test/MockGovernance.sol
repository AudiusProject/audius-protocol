pragma solidity ^0.5.0;
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20Mintable.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20.sol";
import "../service/registry/RegistryContract.sol";
import "../service/interface/registry/RegistryInterface.sol";
import "../service/DelegateManager.sol";


// TEST ONLY MOCK CONTRACT
contract MockGovernance is RegistryContract {
    RegistryInterface registry = RegistryInterface(0);
    bytes32 delegateManagerKey;

    function initialize(
      address _registryAddress,
      bytes32 _delegateManagerKey
    ) public initializer {
        registry = RegistryInterface(_registryAddress);
        delegateManagerKey = _delegateManagerKey;

        RegistryContract.initialize();
    }

    // Test only function
    function testSlash(
        uint _amount,
        address _slashAddress
    ) external
    {
        requireIsInitialized();

        DelegateManager delegateManager = DelegateManager(
            registry.getContract(delegateManagerKey)
        );
        delegateManager.slash(_amount, _slashAddress);
    }

    // Test only function
    function updateUndelegateLockupDuration(uint _duration) external
    {
        requireIsInitialized();
        DelegateManager(
            registry.getContract(delegateManagerKey)
        ).updateUndelegateLockupDuration(_duration);
    }

    function updateMinDelegationAmount(uint _minDelegationAmount) external {
        requireIsInitialized();
        DelegateManager(
            registry.getContract(delegateManagerKey)
        ).updateMinDelegationAmount(_minDelegationAmount);
    }
    function updateMaxDelegators(uint _maxDelegators) external {
        requireIsInitialized();
        DelegateManager(
            registry.getContract(delegateManagerKey)
        ).updateMaxDelegators(_maxDelegators);
    }
}

