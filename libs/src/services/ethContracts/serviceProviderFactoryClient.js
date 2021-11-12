const Utils = require('../../utils')
const GovernedContractClient = require('../contracts/GovernedContractClient')
const axios = require('axios')
const { range } = require('lodash')

let urlJoin = require('proper-url-join')
if (urlJoin && urlJoin.default) urlJoin = urlJoin.default

class ServiceProviderFactoryClient extends GovernedContractClient {
  constructor (
    ethWeb3Manager,
    contractABI,
    contractRegistryKey,
    getRegistryAddress,
    audiusTokenClient,
    stakingProxyClient,
    governanceClient,
    isDebug = false
  ) {
    super(ethWeb3Manager, contractABI, contractRegistryKey, getRegistryAddress, governanceClient)
    this.audiusTokenClient = audiusTokenClient
    this.stakingProxyClient = stakingProxyClient
    this.isDebug = isDebug
  }

  async registerWithDelegate (serviceType, endpoint, amount, delegateOwnerWallet) {
    const sanitizedEndpoint = endpoint.replace(/\/$/, '')

    if (!this.isDebug && !Utils.isFQDN(sanitizedEndpoint)) {
      throw new Error('Not a fully qualified domain name!')
    }
    if (!Number.isInteger(amount) && !Utils.isBN(amount)) {
      throw new Error('Invalid amount')
    }

    const requestUrl = urlJoin(sanitizedEndpoint, 'health_check')
    const axiosRequestObj = {
      url: requestUrl,
      method: 'get',
      timeout: 1000
    }
    const resp = await axios(axiosRequestObj)
    const endpointServiceType = resp.data.data.service

    if (serviceType !== endpointServiceType) {
      throw new Error('Attempting to register endpoint with mismatched service type')
    }

    // Approve token transfer operation
    const contractAddress = await this.stakingProxyClient.getAddress()
    const tx0 = await this.audiusTokenClient.approve(
      contractAddress,
      amount
    )

    // Register and stake
    const method = await this.getMethod('register',
      Utils.utf8ToHex(serviceType),
      sanitizedEndpoint,
      amount,
      delegateOwnerWallet)
    const tx = await this.web3Manager.sendTransaction(method, 1000000)
    return {
      txReceipt: tx,
      spID: parseInt(tx.events.RegisteredServiceProvider.returnValues._spID),
      serviceType: Utils.hexToUtf8(tx.events.RegisteredServiceProvider.returnValues._serviceType),
      owner: tx.events.RegisteredServiceProvider.returnValues._owner,
      endpoint: tx.events.RegisteredServiceProvider.returnValues._endpoint,
      tokenApproveReceipt: tx0
    }
  }

  async register (serviceType, endpoint, amount) {
    return this.registerWithDelegate(
      serviceType,
      endpoint,
      amount,
      this.web3Manager.getWalletAddress())
  }

  async getRegisteredServiceProviderEvents ({
    serviceType,
    owner,
    queryStartBlock = 0
  }) {
    const contract = await this.getContract()
    const filter = {}
    if (owner) {
      filter._owner = owner
    }
    if (serviceType) {
      filter._serviceType = serviceType
    }
    const events = await contract.getPastEvents('RegisteredServiceProvider', {
      fromBlock: queryStartBlock,
      filter
    })
    return events.map(event => ({
      blockNumber: parseInt(event.blockNumber),
      spID: parseInt(event.returnValues._spID),
      serviceType: Utils.hexToUtf8(event.returnValues._serviceType),
      owner: event.returnValues._owner,
      endpoint: event.returnValues._endpoint,
      stakeAmount: Utils.toBN(event.returnValues._stakeAmount)
    }))
  }

  async getDeregisteredServiceProviderEvents ({
    serviceType,
    owner,
    queryStartBlock = 0
  }) {
    const contract = await this.getContract()
    const filter = {}
    if (owner) {
      filter._owner = owner
    }
    if (serviceType) {
      filter._serviceType = serviceType
    }
    const events = await contract.getPastEvents('DeregisteredServiceProvider', {
      fromBlock: queryStartBlock,
      filter
    })
    return events.map(event => ({
      blockNumber: parseInt(event.blockNumber),
      spID: parseInt(event.returnValues._spID),
      serviceType: Utils.hexToUtf8(event.returnValues._serviceType),
      owner: event.returnValues._owner,
      endpoint: event.returnValues._endpoint,
      stakeAmount: Utils.toBN(event.returnValues._stakeAmount)
    }))
  }

  async getIncreasedStakeEvents ({
    owner,
    queryStartBlock = 0
  }) {
    const contract = await this.getContract()
    const events = await contract.getPastEvents('IncreasedStake', {
      fromBlock: queryStartBlock,
      filter: {
        _owner: owner
      }
    })
    return events.map(event => ({
      blockNumber: parseInt(event.blockNumber),
      owner: event.returnValues._owner,
      increaseAmount: Utils.toBN(event.returnValues._increaseAmount),
      newStakeAmount: Utils.toBN(event.returnValues._newStakeAmount)
    }))
  }

  async getDecreasedStakeEvaluatedEvents ({
    owner,
    queryStartBlock = 0
  }) {
    const contract = await this.getContract()
    const events = await contract.getPastEvents('DecreaseStakeRequestEvaluated', {
      fromBlock: queryStartBlock,
      filter: {
        _owner: owner
      }
    })
    return events.map(event => ({
      blockNumber: parseInt(event.blockNumber),
      owner: event.returnValues._owner,
      decreaseAmount: Utils.toBN(event.returnValues._decreaseAmount),
      newStakeAmount: Utils.toBN(event.returnValues._newStakeAmount)
    }))
  }

  async getDecreasedStakeRequestedEvents ({
    owner,
    queryStartBlock = 0
  }) {
    const contract = await this.getContract()
    const events = await contract.getPastEvents('DecreaseStakeRequested', {
      fromBlock: queryStartBlock,
      filter: {
        _owner: owner
      }
    })
    return events.map(event => ({
      blockNumber: parseInt(event.blockNumber),
      owner: event.returnValues._owner,
      decreaseAmount: Utils.toBN(event.returnValues._decreaseAmount),
      lockupExpiryBlock: parseInt(event.returnValues._lockupExpiryBlock)
    }))
  }

  async getDecreasedStakeCancelledEvents ({
    owner,
    queryStartBlock = 0
  }) {
    const contract = await this.getContract()
    const events = await contract.getPastEvents('DecreaseStakeRequestCancelled', {
      fromBlock: queryStartBlock,
      filter: {
        _owner: owner
      }
    })
    return events.map(event => ({
      blockNumber: parseInt(event.blockNumber),
      owner: event.returnValues._owner,
      decreaseAmount: Utils.toBN(event.returnValues._decreaseAmount),
      lockupExpiryBlock: parseInt(event.returnValues._lockupExpiryBlock)
    }))
  }

  // Get the deregistered service's most recent endpoint and delegate owner wallet
  async getDeregisteredService ({
    serviceType,
    spID,
    queryStartBlock = 0
  }) {
    const contract = await this.getContract()
    let service = { endpoint: '', delegateOwnerWallet: '' }
    let registerEvents = await contract.getPastEvents('RegisteredServiceProvider', {
      fromBlock: queryStartBlock,
      filter: {
        _spID: spID,
        _serviceType: Utils.utf8ToHex(serviceType)
      }
    })

    if (registerEvents.length > 0) {
      const { _endpoint, _owner } = registerEvents[registerEvents.length - 1].returnValues
      service.endpoint = _endpoint
      service.owner = _owner
    }

    let endpointUpdateEvents = await contract.getPastEvents('EndpointUpdated', {
      fromBlock: queryStartBlock,
      filter: {
        _spID: spID,
        _serviceType: Utils.utf8ToHex(serviceType)
      }
    })

    if (endpointUpdateEvents.length > 0) {
      const { _newEndpoint } = endpointUpdateEvents[endpointUpdateEvents.length - 1].returnValues
      service.endpoint = _newEndpoint
    }

    let walletEvents = await contract.getPastEvents('DelegateOwnerWalletUpdated', {
      fromBlock: queryStartBlock,
      filter: {
        _spID: spID,
        _serviceType: Utils.utf8ToHex(serviceType)
      }
    })

    if (walletEvents.length > 0) {
      const { _updatedWallet } = walletEvents[walletEvents.length - 1].returnValues
      service.delegateOwnerWallet = _updatedWallet
    }

    return service
  }

  async increaseStake (amount) {
    const contractAddress = await this.stakingProxyClient.getAddress()
    const tx0 = await this.audiusTokenClient.approve(
      contractAddress,
      amount
    )
    const method = await this.getMethod('increaseStake', amount)
    const tx = await this.web3Manager.sendTransaction(method, 1000000)
    return {
      txReceipt: tx,
      tokenApproveReceipt: tx0
    }
  }

  /**
   * Makes a request to decrease stake
   * @param {BN} amount
   * @returns decrease stake lockup expiry block
   */
  async requestDecreaseStake (amount) {
    const requestDecreaseMethod = await this.getMethod('requestDecreaseStake', amount)
    await this.web3Manager.sendTransaction(
      requestDecreaseMethod,
      1000000
    )

    const account = this.web3Manager.getWalletAddress()
    const lockupExpiryBlock = await this.getLockupExpiry(account)
    return parseInt(lockupExpiryBlock)
  }

  /**
   * Gets the pending decrease stake request for a given account
   * @param {string} account wallet address to fetch for
   */
  async getPendingDecreaseStakeRequest (account) {
    const requestInfoMethod = await this.getMethod('getPendingDecreaseStakeRequest', account)
    const {
      amount,
      lockupExpiryBlock
    } = await requestInfoMethod.call()
    return {
      amount: Utils.toBN(amount),
      lockupExpiryBlock: parseInt(lockupExpiryBlock)
    }
  }

  /**
   * Gets the pending decrease stake lockup duration
   */
  async getDecreaseStakeLockupDuration () {
    const requestInfoMethod = await this.getMethod('getDecreaseStakeLockupDuration')
    const info = await requestInfoMethod.call()
    return parseInt(info)
  }

  /**
   * Gets the deployer cut lockup duration
   */
  async getDeployerCutLockupDuration () {
    const requestInfoMethod = await this.getMethod('getDeployerCutLockupDuration')
    const info = await requestInfoMethod.call()
    return parseInt(info)
  }

  /**
   * Cancels the pending decrease stake request
   * @param {string} account wallet address to cancel request for
   */
  async cancelDecreaseStakeRequest (account) {
    const requestCancelDecreaseMethod = await this.getMethod('cancelDecreaseStakeRequest', account)
    await this.web3Manager.sendTransaction(
      requestCancelDecreaseMethod,
      1000000
    )
  }

  /**
   * Fetches the pending decrease stake lockup expiry block for a user
   * @param {string} account wallet address to fetch for
   */
  async getLockupExpiry (account) {
    const { lockupExpiryBlock } = await this.getPendingDecreaseStakeRequest(account)
    return parseInt(lockupExpiryBlock)
  }

  async decreaseStake () {
    const method = await this.getMethod('decreaseStake')
    const tx = await this.web3Manager.sendTransaction(method, 1000000)

    return {
      txReceipt: tx
    }
  }

  /**
   * Deregisters a service
   * @param {string} serviceType
   * @param {string} endpoint
   */
  async deregister (serviceType, endpoint) {
    const method = await this.getMethod('deregister',
      Utils.utf8ToHex(serviceType),
      endpoint)
    const tx = await this.web3Manager.sendTransaction(method)
    return {
      txReceipt: tx,
      spID: parseInt(tx.events.DeregisteredServiceProvider.returnValues._spID),
      serviceType: Utils.hexToUtf8(tx.events.DeregisteredServiceProvider.returnValues._serviceType),
      owner: tx.events.DeregisteredServiceProvider.returnValues._owner,
      endpoint: tx.events.DeregisteredServiceProvider.returnValues._endpoint
    }
  }

  async getTotalServiceTypeProviders (serviceType) {
    const method = await this.getMethod('getTotalServiceTypeProviders',
      Utils.utf8ToHex(serviceType)
    )
    const count = await method.call()
    return parseInt(count)
  }

  async getServiceProviderIdFromEndpoint (endpoint) {
    const method = await this.getMethod('getServiceProviderIdFromEndpoint',
      (endpoint)
    )
    const info = await method.call()
    return parseInt(info)
  }

  // TODO: Remove this method after all consumers are using
  // `getServiceEndpointInfo` directly
  async getServiceProviderInfo (serviceType, serviceId) {
    return this.getServiceEndpointInfo(serviceType, serviceId)
  }

  async getServiceEndpointInfo (serviceType, serviceId) {
    const method = await this.getMethod('getServiceEndpointInfo',
      Utils.utf8ToHex(serviceType),
      serviceId
    )
    const info = await method.call()
    return {
      owner: info.owner,
      endpoint: info.endpoint.replace(/\/$/, ''),
      spID: parseInt(serviceId),
      type: serviceType,
      blockNumber: parseInt(info.blockNumber),
      delegateOwnerWallet: info.delegateOwnerWallet
    }
  }

  async getServiceProviderInfoFromEndpoint (endpoint) {
    const requestUrl = urlJoin(endpoint, 'health_check')
    const axiosRequestObj = {
      url: requestUrl,
      method: 'get',
      timeout: 1000
    }

    const resp = await axios(axiosRequestObj)
    const serviceType = resp.data.data.service

    const serviceProviderId = await this.getServiceProviderIdFromEndpoint(endpoint)
    const info = await this.getServiceEndpointInfo(serviceType, serviceProviderId)
    return info
  }

  async getServiceProviderIdsFromAddress (ownerAddress, serviceType) {
    const method = await this.getMethod('getServiceProviderIdsFromAddress',
      ownerAddress,
      Utils.utf8ToHex(serviceType)
    )
    const info = await method.call()
    return info.map(id => parseInt(id))
  }

  async getServiceProviderIdFromAddress (ownerAddress, serviceType) {
    const infos = await this.getServiceProviderIdsFromAddress(ownerAddress, serviceType)
    return infos[0]
  }

  async getServiceEndpointInfoFromAddress (ownerAddress, serviceType) {
    const spId = await this.getServiceProviderIdFromAddress(ownerAddress, serviceType)

    // cast this as an array for backwards compatibility because everything expects an array
    const spInfo = [await this.getServiceEndpointInfo(serviceType, spId)]
    return spInfo
  }

  /**
   * Returns all service providers of requested `serviceType`
   * Returns array of objects with schema { blockNumber, delegateOwnerWallet, endpoint, owner, spID, type }
   */
  async getServiceProviderList (serviceType) {
    const numberOfProviders = await this.getTotalServiceTypeProviders(serviceType)

    const providerList = await Promise.all(
      range(1, numberOfProviders + 1).map(i =>
        this.getServiceEndpointInfo(serviceType, i)
      )
    )
    return providerList.filter(provider => provider.endpoint !== '')
  }

  async updateDecreaseStakeLockupDuration (duration) {
    const method = await this.getGovernedMethod(
      'updateDecreaseStakeLockupDuration',
      duration
    )
    return this.web3Manager.sendTransaction(
      method
    )
  }

  async getServiceProviderDetails (serviceProviderAddress) {
    const method = await this.getMethod(
      'getServiceProviderDetails',
      serviceProviderAddress
    )
    const info = await method.call()
    return {
      deployerCut: parseInt(info.deployerCut),
      deployerStake: Utils.toBN(info.deployerStake),
      maxAccountStake: Utils.toBN(info.maxAccountStake),
      minAccountStake: Utils.toBN(info.minAccountStake),
      numberOfEndpoints: parseInt(info.numberOfEndpoints),
      validBounds: info.validBounds
    }
  }

  async updateDelegateOwnerWallet (serviceType, endpoint, updatedDelegateOwnerWallet) {
    const method = await this.getMethod(
      'updateDelegateOwnerWallet',
      Utils.utf8ToHex(serviceType),
      endpoint,
      updatedDelegateOwnerWallet
    )

    const tx = await this.web3Manager.sendTransaction(method)
    return tx
  }

  async updateEndpoint (serviceType, oldEndpoint, newEndpoint) {
    const method = await this.getMethod(
      'updateEndpoint',
      Utils.utf8ToHex(serviceType),
      oldEndpoint,
      newEndpoint
    )
    const tx = await this.web3Manager.sendTransaction(method)
    return tx
  }

  async requestUpdateDeployerCut (ownerAddress, deployerCut) {
    const method = await this.getMethod(
      'requestUpdateDeployerCut',
      ownerAddress,
      deployerCut
    )
    const tx = await this.web3Manager.sendTransaction(method)
    return tx
  }

  async getPendingUpdateDeployerCutRequest (ownerAddress) {
    const method = await this.getMethod(
      'getPendingUpdateDeployerCutRequest',
      ownerAddress
    )
    const { lockupExpiryBlock, newDeployerCut } = await method.call()
    return { lockupExpiryBlock: parseInt(lockupExpiryBlock), newDeployerCut: parseInt(newDeployerCut) }
  }

  async cancelUpdateDeployerCut (ownerAddress) {
    const method = await this.getMethod(
      'cancelUpdateDeployerCut',
      ownerAddress
    )
    const tx = await this.web3Manager.sendTransaction(method)
    return tx
  }

  async updateDeployerCut (ownerAddress) {
    const method = await this.getMethod(
      'updateDeployerCut',
      ownerAddress
    )
    const tx = await this.web3Manager.sendTransaction(method)
    return tx
  }

  async updateServiceProviderStake (ownerAddress, newAmount) {
    const method = await this.getMethod(
      'updateServiceProviderStake',
      ownerAddress,
      newAmount
    )
    const tx = await this.web3Manager.sendTransaction(method)
    return tx
  }
}

module.exports = ServiceProviderFactoryClient
