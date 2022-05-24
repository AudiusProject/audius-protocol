pragma solidity ^0.5.0;

import "../ProofOfAudiusConsensus.sol";


contract TestProofOfAudiusConsensus is ProofOfAudiusConsensus {
    function testSetSystemAddress (address _systemAddress) external {
        systemAddress = _systemAddress;
    }
}