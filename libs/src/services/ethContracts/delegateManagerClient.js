const Utils = require('../../utils')
const GovernedContractClient = require('../contracts/GovernedContractClient')
const DEFAULT_GAS_AMOUNT = 1000000

class DelegateManagerClient extends GovernedContractClient {
  constructor (
    ethWeb3Manager,
    contractABI,
    contractRegistryKey,
    getRegistryAddress,
    audiusTokenClient,
    stakingProxyClient,
    governanceClient
  ) {
    super(ethWeb3Manager, contractABI, contractRegistryKey, getRegistryAddress, governanceClient)
    this.audiusTokenClient = audiusTokenClient
    this.stakingProxyClient = stakingProxyClient
  }

  async delegateStake (targetSP, amount) {
    // Approve token transfer operation
    const contractAddress = await this.stakingProxyClient.getAddress()
    const tx0 = await this.audiusTokenClient.approve(
      contractAddress,
      amount)
    const method = await this.getMethod(
      'delegateStake',
      targetSP,
      amount
    )
    const tx = await this.web3Manager.sendTransaction(
      method,
      DEFAULT_GAS_AMOUNT
    )
    return {
      txReceipt: tx,
      tokenApproveReceipt: tx0,
      delegator: tx.events.IncreaseDelegatedStake.returnValues._delegator,
      serviceProvider: tx.events.IncreaseDelegatedStake.returnValues._serviceProvider,
      increaseAmount: Utils.toBN(tx.events.IncreaseDelegatedStake.returnValues._increaseAmount)
    }
  }

  /* Pass either delegator or serviceProvider filters */
  async getIncreaseDelegateStakeEvents ({
    delegator,
    serviceProvider,
    queryStartBlock = 0
  }) {
    const contract = await this.getContract()
    const filter = {}
    if (delegator) {
      filter._delegator = delegator
    } else {
      filter._serviceProvider = serviceProvider
    }
    let events = await contract.getPastEvents('IncreaseDelegatedStake', {
      fromBlock: queryStartBlock,
      filter
    })

    return events.map(event => ({
      blockNumber: parseInt(event.blockNumber),
      delegator: event.returnValues._delegator,
      increaseAmount: Utils.toBN(event.returnValues._increaseAmount),
      serviceProvider: event.returnValues._serviceProvider
    }))
  }

  async getDecreaseDelegateStakeEvents ({
    delegator,
    serviceProvider,
    queryStartBlock = 0
  }) {
    const contract = await this.getContract()
    const filter = {}
    if (delegator) {
      filter._delegator = delegator
    }
    if (serviceProvider) {
      filter._serviceProvider = serviceProvider
    }

    const events = await contract.getPastEvents('UndelegateStakeRequestEvaluated', {
      fromBlock: queryStartBlock,
      filter
    })
    return events.map(event => ({
      blockNumber: parseInt(event.blockNumber),
      delegator: event.returnValues._delegator,
      amount: Utils.toBN(event.returnValues._amount),
      serviceProvider: event.returnValues._serviceProvider
    }))
  }

  async getUndelegateStakeRequestedEvents ({
    delegator,
    serviceProvider,
    queryStartBlock = 0
  }) {
    const contract = await this.getContract()
    const filter = {}
    if (delegator) {
      filter._delegator = delegator
    }
    if (serviceProvider) {
      filter._serviceProvider = serviceProvider
    }

    const events = await contract.getPastEvents('UndelegateStakeRequested', {
      fromBlock: queryStartBlock,
      filter
    })

    return events.map(event => ({
      blockNumber: parseInt(event.blockNumber),
      lockupExpiryBlock: parseInt(event.returnValues._lockupExpiryBlock),
      delegator: event.returnValues._delegator,
      amount: Utils.toBN(event.returnValues._amount),
      serviceProvider: event.returnValues._serviceProvider
    }))
  }

  async getUndelegateStakeCancelledEvents ({
    delegator,
    serviceProvider,
    queryStartBlock = 0
  }) {
    const contract = await this.getContract()
    const filter = {}
    if (delegator) {
      filter._delegator = delegator
    }
    if (serviceProvider) {
      filter._serviceProvider = serviceProvider
    }

    const events = await contract.getPastEvents('UndelegateStakeRequestCancelled', {
      fromBlock: queryStartBlock,
      filter
    })

    return events.map(event => ({
      blockNumber: parseInt(event.blockNumber),
      delegator: event.returnValues._delegator,
      amount: Utils.toBN(event.returnValues._amount),
      serviceProvider: event.returnValues._serviceProvider
    }))
  }

  async getClaimEvents ({
    claimer,
    queryStartBlock = 0
  }) {
    const contract = await this.getContract()
    let events = await contract.getPastEvents('Claim', {
      fromBlock: queryStartBlock,
      filter: {
        _claimer: claimer
      }
    })
    return events.map(event => ({
      blockNumber: parseInt(event.blockNumber),
      claimer: event.returnValues._claimer,
      rewards: Utils.toBN(event.returnValues._rewards),
      newTotal: Utils.toBN(event.returnValues._newTotal)
    }))
  }

  async getSlashEvents ({
    target,
    queryStartBlock = 0
  }) {
    const contract = await this.getContract()
    let events = await contract.getPastEvents('Slash', {
      fromBlock: queryStartBlock,
      filter: {
        _target: target
      }
    })
    return events.map(event => ({
      blockNumber: parseInt(event.blockNumber),
      target: event.returnValues._target,
      amount: Utils.toBN(event.returnValues._amount),
      newTotal: Utils.toBN(event.returnValues._newTotal)
    }))
  }

  async getDelegatorRemovedEvents ({
    target,
    queryStartBlock = 0
  }) {
    const contract = await this.getContract()
    let events = await contract.getPastEvents('DelegatorRemoved', {
      fromBlock: queryStartBlock,
      filter: {
        _target: target
      }
    })
    return events.map(event => ({
      blockNumber: parseInt(event.blockNumber),
      serviceProvider: event.returnValues._serviceProvider,
      delegator: event.returnValues._delegator,
      unstakedAmount: Utils.toBN(event.returnValues._unstakedAmount)
    }))
  }

  async requestUndelegateStake (targetSP, amount) {
    const method = await this.getMethod(
      'requestUndelegateStake',
      targetSP,
      amount
    )
    return this.web3Manager.sendTransaction(
      method,
      DEFAULT_GAS_AMOUNT
    )
  }

  async cancelUndelegateStakeRequest () {
    const method = await this.getMethod(
      'cancelUndelegateStakeRequest'
    )
    return this.web3Manager.sendTransaction(
      method,
      DEFAULT_GAS_AMOUNT
    )
  }

  async undelegateStake () {
    const method = await this.getMethod(
      'undelegateStake'
    )

    const tx = await this.web3Manager.sendTransaction(
      method,
      DEFAULT_GAS_AMOUNT
    )

    return {
      txReceipt: tx,
      delegator: tx.events.UndelegateStakeRequestEvaluated.returnValues._delegator,
      serviceProvider: tx.events.UndelegateStakeRequestEvaluated.returnValues._serviceProvider,
      decreaseAmount: Utils.toBN(tx.events.UndelegateStakeRequestEvaluated.returnValues._amount)
    }
  }

  async claimRewards (serviceProvider, txRetries = 5) {
    const method = await this.getMethod(
      'claimRewards',
      serviceProvider
    )
    return this.web3Manager.sendTransaction(
      method,
      DEFAULT_GAS_AMOUNT,
      null,
      null,
      txRetries
    )
  }

  async requestRemoveDelegator (serviceProvider, delegator) {
    const method = await this.getMethod(
      'requestRemoveDelegator',
      serviceProvider,
      delegator
    )
    return this.web3Manager.sendTransaction(
      method,
      DEFAULT_GAS_AMOUNT
    )
  }

  async cancelRemoveDelegatorRequest (serviceProvider, delegator) {
    const method = await this.getMethod(
      'cancelRemoveDelegatorRequest',
      serviceProvider,
      delegator
    )
    return this.web3Manager.sendTransaction(
      method,
      DEFAULT_GAS_AMOUNT
    )
  }

  async removeDelegator (serviceProvider, delegator) {
    const method = await this.getMethod(
      'removeDelegator',
      serviceProvider,
      delegator
    )
    const tx = await this.web3Manager.sendTransaction(
      method,
      DEFAULT_GAS_AMOUNT
    )
    return {
      txReceipt: tx,
      delegator: tx.events.RemoveDelegatorRequestEvaluated.returnValues._delegator,
      serviceProvider: tx.events.RemoveDelegatorRequestEvaluated.returnValues._serviceProvider,
      unstakedAmount: Utils.toBN(tx.events.RemoveDelegatorRequestEvaluated.returnValues._unstakedAmount)
    }
  }

  // ========================================= View Functions =========================================

  async getDelegatorsList (serviceProvider) {
    const method = await this.getMethod(
      'getDelegatorsList',
      serviceProvider
    )
    const info = await method.call()
    return info
  }

  async getTotalDelegatedToServiceProvider (serviceProvider) {
    const method = await this.getMethod(
      'getTotalDelegatedToServiceProvider',
      serviceProvider
    )
    const info = await method.call()
    return Utils.toBN(info)
  }

  async getTotalDelegatorStake (delegator) {
    const method = await this.getMethod(
      'getTotalDelegatorStake',
      delegator
    )
    const info = await method.call()
    return Utils.toBN(info)
  }

  async getTotalLockedDelegationForServiceProvider (serviceProvider) {
    const method = await this.getMethod(
      'getTotalLockedDelegationForServiceProvider',
      serviceProvider
    )
    const info = await method.call()
    return Utils.toBN(info)
  }

  async getDelegatorStakeForServiceProvider (delegator, serviceProvider) {
    const method = await this.getMethod(
      'getDelegatorStakeForServiceProvider',
      delegator,
      serviceProvider
    )
    const info = await method.call()
    return Utils.toBN(info)
  }

  async getPendingUndelegateRequest (delegator) {
    const method = await this.getMethod(
      'getPendingUndelegateRequest',
      delegator
    )
    const info = await method.call()
    return {
      amount: Utils.toBN(info.amount),
      lockupExpiryBlock: parseInt(info.lockupExpiryBlock),
      target: info.target
    }
  }

  async getPendingRemoveDelegatorRequest (serviceProvider, delegator) {
    const method = await this.getMethod(
      'getPendingRemoveDelegatorRequest',
      serviceProvider,
      delegator
    )
    const info = await method.call()
    return { lockupExpiryBlock: parseInt(info) }
  }

  async getUndelegateLockupDuration () {
    const method = await this.getMethod(
      'getUndelegateLockupDuration'
    )
    const info = await method.call()
    return parseInt(info)
  }

  async getMaxDelegators () {
    const method = await this.getMethod(
      'getMaxDelegators'
    )
    const info = await method.call()
    return parseInt(info)
  }

  async getMinDelegationAmount () {
    const method = await this.getMethod(
      'getMinDelegationAmount'
    )
    const info = await method.call()
    return Utils.toBN(info)
  }

  async getRemoveDelegatorLockupDuration () {
    const method = await this.getMethod(
      'getRemoveDelegatorLockupDuration'
    )
    const info = await method.call()
    return parseInt(info)
  }

  async getRemoveDelegatorEvalDuration () {
    const method = await this.getMethod(
      'getRemoveDelegatorEvalDuration'
    )
    const info = await method.call()
    return parseInt(info)
  }

  async getGovernanceAddress () {
    const method = await this.getMethod(
      'getGovernanceAddress'
    )
    const info = await method.call()
    return info
  }

  async getServiceProviderFactoryAddress () {
    const method = await this.getMethod(
      'getServiceProviderFactoryAddress'
    )
    const info = await method.call()
    return info
  }

  async getClaimsManagerAddress () {
    const method = await this.getMethod(
      'getClaimsManagerAddress'
    )
    const info = await method.call()
    return info
  }

  async getStakingAddress () {
    const method = await this.getMethod(
      'getStakingAddress'
    )
    const info = await method.call()
    return info
  }

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
