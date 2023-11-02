import { audiusLibs, waitForLibsInit } from './libs'

export const getUSDCUserBank = async (ethWallet?: string) => {
  await waitForLibsInit()
  return await audiusLibs?.solanaWeb3Manager?.deriveUserBank({
    ethAddress: ethWallet,
    mint: 'usdc'
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
