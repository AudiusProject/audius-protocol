import type { Hash } from 'viem'

import type { audiusTokenTypes } from './constants'

export type PermitParams = {
  owner: Hash
  spender: Hash
  value: bigint
  deadline: bigint
  signature: `0x${string}`
}

export type AudiusTokenTypedData = typeof audiusTokenTypes
