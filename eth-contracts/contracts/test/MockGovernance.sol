pragma solidity ^0.5.0;
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20Mintable.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20.sol";
import "../service/registry/RegistryContract.sol";
import "../service/interface/registry/RegistryInterface.sol";
import "../service/DelegateManager.sol";
import "../service/ServiceProviderFactory.sol";


// TEST ONLY MOCK CONTRACT
contract MockGovernance is RegistryContract {
    RegistryInterface registry = RegistryInterface(0);
    bytes32 delegateManagerKey;
    bytes32 serviceProviderFactoryKey;

    function initialize(
        address _registryAddress,
        bytes32 _delegateManagerKey,
        bytes32 _serviceProviderFactoryKey
    ) public initializer {
        registry = RegistryInterface(_registryAddress);
        delegateManagerKey = _delegateManagerKey;
        serviceProviderFactoryKey = _serviceProviderFactoryKey;
        RegistryContract.initialize();
    }

    // Test only function
    function testSlash(
        uint _amount,
        address _slashAddress
    ) external
    {
        _requireIsInitialized();

        DelegateManager delegateManager = DelegateManager(
            registry.getContract(delegateManagerKey)
        );
        delegateManager.slash(_amount, _slashAddress);
    }

    // Test only function
    function updateUndelegateLockupDuration(uint _duration) external
    {
        _requireIsInitialized();
        DelegateManager(
            registry.getContract(delegateManagerKey)
        ).updateUndelegateLockupDuration(_duration);
    }

    function updateMinDelegationAmount(uint _minDelegationAmount) external {
        _requireIsInitialized();
        DelegateManager(
            registry.getContract(delegateManagerKey)
        ).updateMinDelegationAmount(_minDelegationAmount);
    }

    function updateMaxDelegators(uint _maxDelegators) external {
        _requireIsInitialized();
        DelegateManager(
            registry.getContract(delegateManagerKey)
        ).updateMaxDelegators(_maxDelegators);
    }

    /// @notice Update service provider lockup duration
    function updateDecreaseStakeLockupDuration(uint _duration) external {
        _requireIsInitialized();
        ServiceProviderFactory(
            registry.getContract(serviceProviderFactoryKey)
        ).updateDecreaseStakeLockupDuration(_duration);
    }
}

