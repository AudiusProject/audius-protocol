import { PublicKey } from '@solana/web3.js'

import { PaymentRouterClientConfigInternal } from './types'

export const defaultPaymentRouterConfig: PaymentRouterClientConfigInternal = {
  programId: new PublicKey('paytYpX3LPN98TAeen6bFFeraGSuWnomZmCXjAsoqPa'),
  rpcEndpoint: 'https://api.mainnet-beta.solana.com',
  mints: {
    USDC: new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'),
    wAUDIO: new PublicKey('9LzCMqDgTKYz9Drzqnpgee3SGa89up3a247ypMj2xrqM')
  }
}
