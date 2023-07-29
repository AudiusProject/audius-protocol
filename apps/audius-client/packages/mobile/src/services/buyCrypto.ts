import { audiusLibs, waitForLibsInit } from './libs'

export const getUSDCUserBank = async (ethWallet: string) => {
  await waitForLibsInit()
  return await audiusLibs?.solanaWeb3Manager?.deriveUserBank(ethWallet, 'usdc')
}

export const createStripeSession = async ({
  destinationWallet,
  amount
}: {
  destinationWallet: string
  amount: string
}) => {
  await waitForLibsInit()
  return await audiusLibs?.identityService?.createStripeSession({
    destinationWallet,
    amount
  })
}
