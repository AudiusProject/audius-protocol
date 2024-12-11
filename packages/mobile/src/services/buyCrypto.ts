import { audiusLibs, waitForLibsInit } from './libs'

export const getUSDCUserBank = async (ethWallet?: string) => {
  await waitForLibsInit()
  return await audiusLibs?.solanaWeb3Manager?.deriveUserBank({
    ethAddress: ethWallet,
    mint: 'usdc'
  })
}
