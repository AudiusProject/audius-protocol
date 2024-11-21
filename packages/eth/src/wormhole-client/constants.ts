import type { TypedData } from 'viem'

export const WORMHOLE_CLIENT_CONTRACT_ADDRESS =
  '0x6E7a1F7339bbB62b23D44797b63e4258d283E095'

export const wormholeClientTypes = {
  EIP712Domain: [
    { name: 'name', type: 'string' },
    { name: 'version', type: 'string' },
    { name: 'chainId', type: 'uint256' },
    { name: 'verifyingContract', type: 'address' }
  ],
  TransferTokens: [
    { name: 'from', type: 'address' },
    { name: 'amount', type: 'uint256' },
    { name: 'recipientChain', type: 'uint16' },
    { name: 'recipient', type: 'bytes32' },
    { name: 'arbiterFee', type: 'uint256' },
    { name: 'nonce', type: 'uint32' },
    { name: 'deadline', type: 'uint256' }
  ]
} as const satisfies TypedData
