import { audiusLibs, waitForLibsInit } from './libs'
import { audiusSdk } from './sdk/audius-sdk'

export const getUSDCUserBank = async (ethWallet?: string) => {
  const sdk = await audiusSdk()
  return await sdk.services.claimableTokensClient.deriveUserBank({
    ethWallet,
    mint: 'USDC'
  })
}
