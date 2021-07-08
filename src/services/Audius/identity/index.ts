import { AudiusClient } from '../AudiusClient'

import BN from 'bn.js'
import { Address } from 'types'

export default class Identity {
  public aud: AudiusClient

  constructor(aud: AudiusClient) {
    this.aud = aud
  }

  // Retrieves the minimum delegation set in identity for a service provider
  async getMinimumDelegationAmount(
    serviceProviderWallet: Address
  ): Promise<BN | null> {
    try {
      const {
        minimumDelegationAmount
      } = await this.aud.libs.identityService.getMinimumDelegationAmount(
        serviceProviderWallet
      )

      if (!minimumDelegationAmount) return null

      const isNumeric = /^\d+$/.test(minimumDelegationAmount)
      if (!isNumeric) return null

      return new BN(minimumDelegationAmount)
    } catch (error) {
      return null
    }
  }

  // Sets the minimum delegation in identity for a service provider
  async updateMinimumDelegationAmount(amount: BN): Promise<boolean> {
    await this.aud.libs.Account.updateMinimumDelegationAmount(amount.toString())
    return true
  }

  async signData() {
    const unixTs = Math.round(new Date().getTime() / 1000) // current unix timestamp (sec)
    const data = `Click sign to authenticate with identity service: ${unixTs}`
    const signature = await this.aud.libs.Account.web3Manager.sign(data)
    return { data, signature }
  }
}
