import { audiusSdk } from 'app/services/sdk/audius-sdk'

import { audiusLibs, waitForLibsInit } from './libs'

export const getUSDCUserBank = async (ethWallet?: string) => {
  const sdk = await audiusSdk()
  return await sdk.services.claimableTokensClient.deriveUserBank({
    ethWallet,
    mint: 'USDC'
  })
}
