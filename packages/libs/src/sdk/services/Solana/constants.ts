import { PublicKey } from '@solana/web3.js'
import type { SolanaConfigInternal } from './types'

export const defaultSolanaConfig: SolanaConfigInternal = {
  rpcEndpoint: 'https://api.mainnet-beta.solana.com',
  mints: {
    wAUDIO: new PublicKey('9LzCMqDgTKYz9Drzqnpgee3SGa89up3a247ypMj2xrqM'),
    USDC: new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v')
  },
  programIds: {
    claimableTokens: new PublicKey(
      'Ewkv3JahEFRKkcJmpoKB7pXbnUHwjAyXiwEo4ZY2rezQ'
    ),
    rewardManager: new PublicKey(
      'DDZDcYdQFEMwcu2Mwo75yGFjJ1mUQyyXLWzhZLEVFcei'
    ),
    paymentRouter: new PublicKey('paytYpX3LPN98TAeen6bFFeraGSuWnomZmCXjAsoqPa'),
    trackListenCount: new PublicKey(
      '7K3UpbZViPnQDLn2DAM853B9J5GBxd1L1rLHy4KqSmWG'
    )
  }
}
