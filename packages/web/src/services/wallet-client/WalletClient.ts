import BN from 'bn.js'

import { ID } from 'common/models/Identifiers'
import { BNWei, StringWei, WalletAddress } from 'common/models/Wallet'
import AudiusBackend from 'services/AudiusBackend'
import apiClient from 'services/audius-api-client/AudiusAPIClient'
import { stringWeiToBN } from 'utils/wallet'

// 0.001 Audio
export const MIN_TRANSFERRABLE_WEI = stringWeiToBN(
  '1000000000000000' as StringWei
)

const BN_ZERO = new BN('0') as BNWei

class WalletClient {
  init() {}

  async getCurrentBalance(bustCache = false): Promise<BNWei> {
    try {
      const balance = await AudiusBackend.getBalance(bustCache)
      return balance as BNWei
    } catch (err) {
      console.log(err)
      return BN_ZERO
    }
  }

  async getAssociatedWalletBalance(
    userID: ID,
    bustCache = false
  ): Promise<BNWei> {
    try {
      const associatedWallets = await apiClient.getAssociatedWallets({
        userID
      })
      if (associatedWallets === null) throw new Error('Unable to fetch wallets')
      const balances = await Promise.all(
        associatedWallets.wallets.map(wallet =>
          AudiusBackend.getAddressTotalStakedBalance(wallet, bustCache)
        )
      )

      const totalBalance = balances.reduce(
        (sum, walletBalance) => sum.add(walletBalance),
        new BN('0')
      )
      return totalBalance as BNWei
    } catch (err) {
      console.log(err)
      return BN_ZERO
    }
  }

  async getEthWalletBalances(
    wallets: string[],
    bustCache = false
  ): Promise<{ address: string; balance: BNWei }[]> {
    try {
      const balances: { address: string; balance: BNWei }[] = await Promise.all(
        wallets.map(async wallet => {
          const balance = await AudiusBackend.getAddressTotalStakedBalance(
            wallet,
            bustCache
          )
          return { address: wallet, balance: balance as BNWei }
        })
      )
      return balances
    } catch (err) {
      console.error(err)
      return []
    }
  }

  async getSolWalletBalances(
    wallets: string[]
  ): Promise<{ address: string; balance: BNWei }[]> {
    try {
      const balances: { address: string; balance: BNWei }[] = await Promise.all(
        wallets.map(async wallet => {
          const balance = await AudiusBackend.getAddressWAudioBalance(wallet)
          return { address: wallet, balance: balance as BNWei }
        })
      )
      return balances
    } catch (err) {
      console.error(err)
      return []
    }
  }

  async claim(): Promise<void> {
    try {
      await AudiusBackend.makeDistributionClaim()
    } catch (err) {
      console.error(err)
      throw err
    }
  }

  async sendTokens(address: WalletAddress, amount: BNWei): Promise<void> {
    if (amount.lt(MIN_TRANSFERRABLE_WEI)) {
      throw new Error('Insufficient Audio to transfer')
    }
    try {
      await AudiusBackend.sendTokens(address, amount)
    } catch (err) {
      console.error(err)
      throw err
    }
  }
}

const client = new WalletClient()

export default client
