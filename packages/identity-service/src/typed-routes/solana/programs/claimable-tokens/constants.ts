import { PublicKey } from '@solana/web3.js'

export enum ClaimableTokenInstruction {
  Create = 0,
  Transfer = 1
}

export const CLAIMABLE_TOKEN_PROGRAM_ID = new PublicKey(
  'Ewkv3JahEFRKkcJmpoKB7pXbnUHwjAyXiwEo4ZY2rezQ'
)
