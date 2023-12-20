import { PublicKey } from '@solana/web3.js'
import type { ClaimableTokensConfigInternal } from './types'

export const defaultClaimableTokensConfig: ClaimableTokensConfigInternal = {
  programId: new PublicKey('Ewkv3JahEFRKkcJmpoKB7pXbnUHwjAyXiwEo4ZY2rezQ'),
  rpcEndpoint: 'https://api.mainnet-beta.solana.com',
  mints: {
    wAUDIO: new PublicKey('9LzCMqDgTKYz9Drzqnpgee3SGa89up3a247ypMj2xrqM'),
    USDC: new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v')
  }
}
