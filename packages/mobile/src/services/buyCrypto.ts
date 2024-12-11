import { audiusLibs, waitForLibsInit } from './libs'
import { audiusSdk } from './sdk/audius-sdk'

export const getUSDCUserBank = async (ethWallet?: string) => {
  const sdk = await audiusSdk()
  return await sdk.services.claimableTokensClient.deriveUserBank({
    ethWallet,
    mint: 'USDC'
  })
}

export const createStripeSession = async ({
  destinationWallet,
  amount,
  destinationCurrency
}: {
  destinationWallet: string
  amount: string
  destinationCurrency: 'sol' | 'usdc'
}) => {
  await waitForLibsInit()
  return await audiusLibs?.identityService?.createStripeSession({
    destinationWallet,
    amount,
    destinationCurrency
  })
}
