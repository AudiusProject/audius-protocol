import { audiusSdk } from 'app/services/sdk/audius-sdk'

export const getUSDCUserBank = async (ethWallet?: string) => {
  const sdk = await audiusSdk()
  return await sdk.services.claimableTokensClient.deriveUserBank({
    ethWallet,
    mint: 'USDC'
  })
}
