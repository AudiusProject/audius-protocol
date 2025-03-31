import type { TypedData } from 'viem'

import { abi } from './abi'

export type AudiusTokenTypes = typeof AudiusToken.types
export class AudiusToken {
  public static readonly abi = abi

  public static readonly address =
    '0x18aAA7115705e8be94bfFEBDE57Af9BFc265B998' as const

  public static readonly types = {
    EIP712Domain: [
      { name: 'name', type: 'string' },
      { name: 'version', type: 'string' },
      { name: 'chainId', type: 'uint256' },
      { name: 'verifyingContract', type: 'address' }
    ],
    Permit: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'nonce', type: 'uint256' },
      { name: 'deadline', type: 'uint256' }
    ]
  } as const satisfies TypedData
}
