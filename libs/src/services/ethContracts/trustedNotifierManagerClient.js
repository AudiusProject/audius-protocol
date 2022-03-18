const GovernedContractClient = require('../contracts/GovernedContractClient')

class TrustedNotifierManagerClient extends GovernedContractClient {
  /**
   * Register Trusted Notifier with specified fields (wallet, endpoint, email)
   * @notice Only callable by Governance contract
   * @notice All fields must be unique and non-falsey
   * @notice New Trusted Notifier is assigned an auto-incremented integer ID
   * @returns Newly assigned integer ID
   */
  async registerNotifier (wallet, endpoint, email, privateKey = null) {
    const method = await this.getGovernedMethod(
      'registerNotifier',
      wallet,
      endpoint,
      email
    )
    return this.web3Manager.sendTransaction(
      method,
      (await this.governanceClient.getAddress()),
      privateKey
    )
  }

  /**
   * Deregister Trusted Notifier associated with wallet
   * @notice Only callable by Governance contract or wallet
   * @returns ID of deregistered Trusted Notifier
   */
  async deregisterNotifier (wallet, privateKey = null) {
    const method = await this.getGovernedMethod(
      'deregisterNotifier',
      wallet
    )
    return this.web3Manager.sendTransaction(
      method,
      (await this.governanceClient.getAddress()),
      privateKey
    )
  }

  async getLatestNotifierID () {
    const method = await this.getMethod('getLatestNotifierID')
    const ID = await method.call()
    return parseInt(ID)
  }

  /**
   * Returns all TrustedNotifier info associated with ID
   * @returns {Object} { wallet, endpoint, email }
   */
  async getNotifierForID (ID) {
    const method = await this.getMethod('getNotifierForID', ID)
    const notifierInfo = await method.call()
    return {
      wallet: notifierInfo.wallet,
      endpoint: notifierInfo.endpoint.replace(/\/$/, ''),
      email: notifierInfo.email.replace(/\/$/, '')
    }
  }

  /**
   * Returns all TrustedNotifier info associated with wallet
   * @returns {Object} { ID, endpoint, email }
   */
  async getNotifierForWallet (wallet) {
    const method = await this.getMethod('getNotifierForWallet', wallet)
    const notifierInfo = await method.call()
    return {
      ID: notifierInfo.ID,
      endpoint: notifierInfo.endpoint.replace(/\/$/, ''),
      email: notifierInfo.email.replace(/\/$/, '')
    }
  }

  /**
   * Returns all TrustedNotifier info associated with endpoint
   * @returns {Object} { ID, wallet, email }
   */
  async getNotifierForEndpoint (endpoint) {
    const method = await this.getMethod('getNotifierForEndpoint', endpoint)
    const notifierInfo = await method.call()
    return {
      ID: notifierInfo.ID,
      wallet: notifierInfo.wallet,
      email: notifierInfo.email.replace(/\/$/, '')
    }
  }

  /**
   * Returns all TrustedNotifier info associated with email
   * @returns {Object} { ID, wallet, endpoint }
   */
  async getNotifierForEmail (email) {
    const method = await this.getMethod('getNotifierForEmail', email)
    const notifierInfo = await method.call()
    return {
      ID: notifierInfo.ID,
      wallet: notifierInfo.wallet,
      endpoint: notifierInfo.endpoint.replace(/\/$/, '')
    }
  }
}

module.exports = TrustedNotifierManagerClient
