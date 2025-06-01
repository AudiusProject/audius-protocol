pragma solidity ^0.5.0;

// Interfaces for interaction with Wormhole v2 TokenBridge

// Wormhole
// https://github.com/wormhole-foundation/wormhole/blob/bb342612d1eb0e824575a3f5dd2847dc1f220092/ethereum/contracts/interfaces/IWormhole.sol
interface WormholeInternal {
  function messageFee() external view returns (uint256);
}

// TokenBridge
// https://github.com/wormhole-foundation/wormhole/blob/bb342612d1eb0e824575a3f5dd2847dc1f220092/ethereum/contracts/bridge/interfaces/ITokenBridge.sol
interface Wormhole {
  function transferTokens(
    address token,
    uint256 amount,
    uint16 recipientChain,
    bytes32 recipient,
    uint256 arbiterFee,
    uint32 nonce
  ) external payable returns (uint64 sequence);

  function wormhole() external view returns (WormholeInternal);
}
