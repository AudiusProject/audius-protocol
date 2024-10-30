import { LocalStorage } from '../local-storage'

import { HedgehogInstance } from './hedgehog'

export type GetWalletAddressesResult = {
  /** Wallet address of the current (acting-as) user. */
  accountWalletAddress: string
  /** Wallet address of the signed-in user */
  web3WalletAddress: string
}

export const createGetWalletAddresses = ({
  localStorage,
  hedgehogInstance
}: {
  localStorage: LocalStorage
  hedgehogInstance: HedgehogInstance
}): (() => Promise<GetWalletAddressesResult>) => {
  return async () => {
    const walletOverride = await localStorage.getAudiusUserWalletOverride()
    await hedgehogInstance.waitUntilReady()
    const hedgehogAddress = hedgehogInstance.wallet?.getAddressString()
    return {
      accountWalletAddress: walletOverride || hedgehogAddress || '',
      web3WalletAddress: hedgehogAddress || ''
    }
  }
}
