const Utils = require('../../utils')
const ContractClient = require('../contracts/ContractClient')
const axios = require('axios')
const { range } = require('lodash')

let urlJoin = require('proper-url-join')
if (urlJoin && urlJoin.default) urlJoin = urlJoin.default

class ServiceProviderFactoryClient extends ContractClient {
  constructor (
    ethWeb3Manager,
    contractABI,
    contractRegistryKey,
    getRegistryAddress,
    audiusTokenClient,
    stakingProxyClient,
    isDebug = false
  ) {
    super(ethWeb3Manager, contractABI, contractRegistryKey, getRegistryAddress)
    this.audiusTokenClient = audiusTokenClient
    this.stakingProxyClient = stakingProxyClient
    this.isDebug = isDebug
  }

  async registerWithDelegate (serviceType, endpoint, amount, delegateOwnerWallet) {
    if (!this.isDebug && !Utils.isFQDN(endpoint)) {
      throw new Error('Not a fully qualified domain name!')
    }
    if (!Number.isInteger(amount) && !Utils.isBN(amount)) {
      throw new Error('Invalid amount')
    }

    let requestUrl = urlJoin(endpoint, 'health_check')
    let axiosRequestObj = {
      url: requestUrl,
      method: 'get',
      timeout: 1000
    }
    const resp = await axios(axiosRequestObj)
    let endpointServiceType
    try {
      endpointServiceType = resp.data.data.service
    } catch (e) {
      endpointServiceType = resp.data.service
    }

    if (serviceType !== endpointServiceType) {
      throw new Error('Attempting to register endpoint with mismatched service type')
    }

    // Approve token transfer operation
    const contractAddress = await this.stakingProxyClient.getAddress()
    let tx0 = await this.audiusTokenClient.approve(
      contractAddress,
      amount)

    // Register and stake
    let method = await this.getMethod('register',
      Utils.utf8ToHex(serviceType),
      endpoint,
      amount,
      delegateOwnerWallet)
    let tx = await this.web3Manager.sendTransaction(method, 1000000)
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

  async increaseStake (amount) {
    const contractAddress = await this.stakingProxyClient.getAddress()
    let tx0 = await this.audiusTokenClient.approve(
      contractAddress,
      amount)
    let method = await this.getMethod('increaseStake', amount)
    let tx = await this.web3Manager.sendTransaction(method, 1000000)
    return {
      txReceipt: tx,
      tokenApproveReceipt: tx0
    }
  }

  async decreaseStake (amount) {
    let method = await this.getMethod('decreaseStake', amount)
    let tx = await this.web3Manager.sendTransaction(method, 1000000)
    return {
      txReceipt: tx
    }
  }

  async deregister (serviceType, endpoint) {
    // TODO: Review whether the below validation is necessary...
    // When testing locally, an ngrok endpoint that disappeared was registered
    // Since owner validation is already performed, this should NOT be necessary
    // let requestUrl = urlJoin(endpoint, 'version')
    /*
    let axiosRequestObj = {
      url: requestUrl,
      method: 'get',
      timeout: 1000
    }
    const resp = await axios(axiosRequestObj)
    const endpointServiceType = resp.data.service
    if (serviceType !== endpointServiceType) {
      throw new Error('Attempting to deregister endpoint with mismatched service type')
    }
    */

    let method = await this.getMethod('deregister',
      Utils.utf8ToHex(serviceType),
      endpoint)
    let tx = await this.web3Manager.sendTransaction(method)
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
    return method.call()
  }

  async getServiceProviderIdFromEndpoint (endpoint) {
    const method = await this.getMethod('getServiceProviderIdFromEndpoint',
      (endpoint)
    )
    let info = await method.call()
    return info
  }

  async getServiceEndpointInfo (serviceType, serviceId) {
    const method = await this.getMethod('getServiceEndpointInfo',
      Utils.utf8ToHex(serviceType),
      serviceId
    )
    let info = await method.call()
    return {
      owner: info.owner,
      endpoint: info.endpoint,
      spID: parseInt(serviceId),
      type: serviceType,
      blocknumber: info.blocknumber,
      delegateOwnerWallet: info.delegateOwnerWallet
    }
  }

  async getServiceProviderInfoFromEndpoint (endpoint) {
    let requestUrl = urlJoin(endpoint, 'health_check')
    let axiosRequestObj = {
      url: requestUrl,
      method: 'get',
      timeout: 1000
    }

    const resp = await axios(axiosRequestObj)
    let serviceType
    try {
      serviceType = resp.data.data.service
    } catch (e) {
      serviceType = resp.data.service
    }

    let serviceProviderId = await this.getServiceProviderIdFromEndpoint(endpoint)
    let info = await this.getServiceEndpointInfo(serviceType, serviceProviderId)
    return info
  }
  
  async getServiceProviderIdsFromAddress (ownerAddress, serviceType) {
    const method = await this.getMethod('getServiceProviderIdsFromAddress',
    ownerAddress,
    Utils.utf8ToHex(serviceType)
    )
    let info = await method.call()
    return info
  }

  async getServiceProviderIdFromAddress (ownerAddress, serviceType) {
    const infos = await this.getServiceProviderIdsFromAddress(ownerAddress, serviceType)
    return infos[0]
  }

  async getServiceEndpointInfoFromAddress (ownerAddress, serviceType) {
    let spId = await this.getServiceProviderIdFromAddress(ownerAddress, serviceType)

    // cast this as an array for backwards compatibility because everything expects an array
    const spInfo = [await this.getServiceEndpointInfo(serviceType, spId)]
    return spInfo
  }

  async getServiceProviderList (serviceType) {
    let numberOfProviders = parseInt(await this.getTotalServiceTypeProviders(serviceType))

    const providerList = await Promise.all(
      range(1, numberOfProviders + 1).map(i =>
        this.getServiceEndpointInfo(serviceType, i)
      )
    )
    return providerList.filter(provider => provider.endpoint !== '')
  }
}

module.exports = ServiceProviderFactoryClient
