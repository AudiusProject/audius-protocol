import {
  BNWei,
  StringWei,
  stringWeiToBN,
  WalletAddress
} from 'store/wallet/slice'
import AudiusBackend from 'services/AudiusBackend'
import BN from 'bn.js'

// 0.001 Audio
export const MIN_TRANSFERRABLE_WEI = stringWeiToBN(
  '1000000000000000' as StringWei
)

const BN_ZERO = new BN('0') as BNWei

class WalletClient {
  init() {}

  async getCurrentBalance(): Promise<BNWei> {
    try {
      const balance = await AudiusBackend.getBalance()
      return balance as BNWei
    } catch (err) {
      console.log(err)
      return BN_ZERO
    }
  }

  async getClaimableBalance(): Promise<BNWei> {
    try {
      const hasClaimed = await AudiusBackend.getHasClaimed()
      if (hasClaimed) return BN_ZERO
      const claimAmount = await AudiusBackend.getClaimDistributionAmount()
      if (claimAmount) return claimAmount as BNWei
      return BN_ZERO
    } catch (err) {
      console.log(err)
      return BN_ZERO
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
