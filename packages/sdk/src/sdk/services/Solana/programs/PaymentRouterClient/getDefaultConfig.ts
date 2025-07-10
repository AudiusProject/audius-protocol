import { PublicKey } from '@solana/web3.js'

import { SdkServicesConfig } from '../../../../config/types'

import { PaymentRouterClientConfigInternal } from './types'

export const getDefaultPaymentRouterClientConfig = (
  config: SdkServicesConfig
): PaymentRouterClientConfigInternal => ({
  programId: new PublicKey(config.solana.paymentRouterProgramAddress),
  mints: {
    USDC: new PublicKey(config.solana.usdcTokenMint),
    wAUDIO: new PublicKey(config.solana.wAudioTokenMint)
  }
})
