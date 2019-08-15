pragma solidity ^0.5.0;


import "./Staking.sol";


contract StakingTest is Staking {
    event TestEvent(string msg);

    function testFunction() external {
        emit TestEvent("Test proxy replacement working!");
    }
}
