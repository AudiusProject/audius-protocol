const ContractClient = require('../contracts/ContractClient')

class EthRewardsManagerClient extends ContractClient {
  /* ------- GETTERS ------- */

  // Get the token used by the contract
  async token () {
    const method = await this.getMethod('token')
    const info = await method.call()
    return info
  }

  // Get the Governance address
  async getGovernanceAddress () {
    const method = await this.getMethod('getGovernanceAddress')
    const info = await method.call()
    return info
  }

  // Get the recipient address
  async getRecipientAddress () {
    const method = await this.getMethod('getRecipientAddress')
    const info = await method.call()
    return info
  }

  // Get the anti abuse oracle addresses
  async getAntiAbuseOracleAddresses () {
    const method = await this.getMethod('getAntiAbuseOracleAddresses')
    const info = await method.call()
    return info
  }
}

module.exports = EthRewardsManagerClient
