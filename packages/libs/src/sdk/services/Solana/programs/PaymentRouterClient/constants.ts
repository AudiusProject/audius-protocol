import { PublicKey } from '@solana/web3.js'

import { PaymentRouterClientConfigInternal } from './types'

export const defaultPaymentRouterConfig: PaymentRouterClientConfigInternal = {
  programId: new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'), // TODO: CHANGE THIS
  rpcEndpoint: 'https://api.mainnet-beta.solana.com',
  mints: {}
}
