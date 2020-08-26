const GovernedContractClient = require('../contracts/GovernedContractClient')
const DEFAULT_GAS_AMOUNT = 200000

class DelegateManagerClient extends GovernedContractClient {
  async updateRemoveDelegatorLockupDuration (duration) {
    const method = await this.getGovernedMethod(
      'updateRemoveDelegatorLockupDuration',
      duration
    )
    return this.web3Manager.sendTransaction(
      method,
      DEFAULT_GAS_AMOUNT
    )
  }

  async updateUndelegateLockupDuration (duration) {
    const method = await this.getGovernedMethod(
      'updateUndelegateLockupDuration',
      duration
    )
    return this.web3Manager.sendTransaction(
      method,
      DEFAULT_GAS_AMOUNT
    )
  }
}

module.exports = DelegateManagerClient
