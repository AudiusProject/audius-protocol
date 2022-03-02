const GovernedContractClient = require('../contracts/GovernedContractClient')

class TrustedNotifierManagerClient extends GovernedContractClient {
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

  async getNotifierForID (ID) {
    const method = await this.getMethod('getNotifierForID', ID)
    const notifier = await method.call()
    return {
      wallet: notifier.wallet,
      endpoint: notifier.endpoint.replace(/\/$/, ''),
      email: notifier.email
    }
  }

  async getEndpointForWallet (wallet) {
    const method = await this.getMethod('getEndpointForWallet', wallet)
    const endpoint = await method.call()
    return endpoint.replace(/\/$/, '')
  }

  async getEmailForWallet (wallet) {
    const method = await this.getMethod('getEmailForWallet', wallet)
    const email = await method.call()
    return email
  }

  async getWalletForEndpoint (endpoint) {
    const method = await this.getMethod('getWalletForEndpoint', endpoint)
    const wallet = await method.call()
    return wallet
  }
}

module.exports = TrustedNotifierManagerClient
