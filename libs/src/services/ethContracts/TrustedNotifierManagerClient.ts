import { GovernedContractClient } from '../contracts/GovernedContractClient'

export class TrustedNotifierManagerClient extends GovernedContractClient {
  /**
   * Register Trusted Notifier with specified fields (wallet, endpoint, email)
   * @notice Only callable by Governance contract
   * @notice All fields must be unique and non-falsey
   * @notice New Trusted Notifier is assigned an auto-incremented integer ID
   * @returns Newly assigned integer ID
   */
  async registerNotifier(
    wallet: string,
    endpoint: string,
    email: string,
    privateKey: string | null = null
  ) {
    const method = await this.getGovernedMethod(
      'registerNotifier',
      wallet,
      endpoint,
      email
    )
    return await this.web3Manager.sendTransaction(
      method,
      await this.governanceClient.getAddress(),
      privateKey
    )
  }

  /**
   * Deregister Trusted Notifier associated with wallet
   * @notice Only callable by Governance contract or wallet
   * @returns ID of deregistered Trusted Notifier
   */
  async deregisterNotifier(wallet: string, privateKey: string | null = null) {
    const method = await this.getGovernedMethod('deregisterNotifier', wallet)
    return await this.web3Manager.sendTransaction(
      method,
      await this.governanceClient.getAddress(),
      privateKey
    )
  }

  async getLatestNotifierID() {
    const method = await this.getMethod('getLatestNotifierID')
    const ID = await method.call()
    return parseInt(ID)
  }

  /**
   * Returns all TrustedNotifier info associated with ID
   */
  async getNotifierForID(ID: string) {
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
   */
  async getNotifierForWallet(wallet: string) {
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
   */
  async getNotifierForEndpoint(endpoint: string) {
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
   */
  async getNotifierForEmail(email: string) {
    const method = await this.getMethod('getNotifierForEmail', email)
    const notifierInfo = await method.call()
    return {
      ID: notifierInfo.ID,
      wallet: notifierInfo.wallet,
      endpoint: notifierInfo.endpoint.replace(/\/$/, '')
    }
  }
}
