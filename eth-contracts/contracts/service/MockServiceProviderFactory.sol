pragma solidity ^0.5.0;

import "./registry/RegistryContract.sol";


// Test contract used in claim factory scenarios
// Eliminates requirement for full SPFactory
contract MockServiceProviderFactory is RegistryContract {
    uint max;

    constructor() public
    {
        // Configure test max
        max = 100000000 * 10**uint256(18);
    }

    /// @notice Calculate the stake for an account based on total number of registered services
    function getAccountStakeBounds(address sp)
    external view returns (uint minStake, uint maxStake)
    {
        return (0, max);
    }
}
