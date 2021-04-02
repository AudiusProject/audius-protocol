const Utils = require('../../utils')
const ContractClient = require('../contracts/ContractClient')

class ClaimsManagerClient extends ContractClient {
  /* ------- GETTERS ------- */

  // Get the duration of a funding round in blocks
  async getFundingRoundBlockDiff () {
    const method = await this.getMethod(
      'getFundingRoundBlockDiff'
    )
    const info = await method.call()
    return parseInt(info)
  }

  // Get the last block where a funding round was initiated
  async getLastFundedBlock () {
    const method = await this.getMethod(
      'getLastFundedBlock'
    )
    const info = await method.call()
    return parseInt(info)
  }

  // Get the amount funded per round in wei
  async getFundsPerRound () {
    const method = await this.getMethod(
      'getFundsPerRound'
    )
    const info = await method.call()
    return Utils.toBN(info)
  }

  // Get the total amount claimed in the current round
  async getTotalClaimedInRound () {
    const method = await this.getMethod(
      'getTotalClaimedInRound'
    )
    const info = await method.call()
    return Utils.toBN(info)
  }

  // Get the Governance address
  async getGovernanceAddress () {
    const method = await this.getMethod(
      'getGovernanceAddress'
    )
    const info = await method.call()
    return info
  }

  // Get the ServiceProviderFactory address
  async getServiceProviderFactoryAddress () {
    const method = await this.getMethod(
      'getServiceProviderFactoryAddress'
    )
    const info = await method.call()
    return info
  }

  // Get the DelegateManager address
  async getDelegateManagerAddress () {
    const method = await this.getMethod(
      'getDelegateManagerAddress'
    )
    const info = await method.call()
    return info
  }

  // Get the Staking address
  async getStakingAddress () {
    const method = await this.getMethod(
      'getStakingAddress'
    )
    const info = await method.call()
    return info
  }

  // Returns boolean indicating whether a claim is considered pending
  async claimPending (address) {
    const method = await this.getMethod(
      'claimPending',
      address
    )
    const info = await method.call()
    return info
  }

  // Returns boolean indicating whether a claim is considered pending
  async initiateRound (txRetries = 5) {
    const method = await this.getMethod(
      'initiateRound'
    )
    return this.web3Manager.sendTransaction(
      method,
      null,
      null,
      txRetries
    )
  }

  // Fetches the claim processed events
  async getClaimProcessedEvents ({
    claimer,
    queryStartBlock = 0
  }) {
    const contract = await this.getContract()
    let events = await contract.getPastEvents('ClaimProcessed', {
      fromBlock: queryStartBlock,
      filter: {
        _claimer: claimer
      }
    })
    return events.map(event => ({
      blockNumber: parseInt(event.blockNumber),
      claimer: event.returnValues._claimer,
      rewards: Utils.toBN(event.returnValues._rewards),
      oldTotal: Utils.toBN(event.returnValues._oldTotal),
      newTotal: Utils.toBN(event.returnValues._newTotal)
    }))
  }
}

module.exports = ClaimsManagerClient
