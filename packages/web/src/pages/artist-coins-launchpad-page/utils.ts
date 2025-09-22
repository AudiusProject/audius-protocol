import { ConnectedWallet } from '@audius/common/api'
import { Chain } from '@audius/common/models'

/**
 * Gets the most recently added connected wallet
 */
export const getLatestConnectedWallet = (
  connectedWallets: ConnectedWallet[] | undefined
) => {
  return connectedWallets?.filter(
    (wallet: ConnectedWallet) => wallet.chain === Chain.Sol
  )?.[0]
}
