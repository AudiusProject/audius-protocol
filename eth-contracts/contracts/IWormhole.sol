pragma solidity ^0.5.0;

// Interface for interaction with Wormhole v2 TokenBridge
// https://github.com/certusone/wormhole/blob/7e2cf1f9818099c63c21d101afbfedb1903ee9ba/ethereum/contracts/bridge/Bridge.sol#L93
interface Wormhole {
    function transferTokens(
        address token,
        uint256 amount,
        uint16 recipientChain,
        bytes32 recipient,
        uint256 arbiterFee,
        uint32 nonce
    ) external;
}