const Utils = require('../../utils')
const axios = require('axios')
const _ = require('lodash')

let urlJoin = require('proper-url-join')
if (urlJoin && urlJoin.default) urlJoin = urlJoin.default

class ServiceProviderFactoryClient {
  constructor (ethWeb3Manager, contractABI, contractRegistryKey, getRegistryAddress) {
    this.ethWeb3Manager = ethWeb3Manager
    this.contractABI = contractABI
    this.contractRegistryKey = contractRegistryKey
    this.getRegistryAddress = getRegistryAddress
    this.web3 = this.ethWeb3Manager.getWeb3()
  }

  async init () {
    this.contractAddress = await this.getRegistryAddress(this.contractRegistryKey)
    this.ServiceProviderFactory = new this.web3.eth.Contract(this.contractABI, this.contractAddress)
  }

  async register (serviceType, endpoint) {
    if (!Utils.isFQDN(endpoint)) {
      throw new Error('Not a fully qualified domain name!')
    }

    let requestUrl = urlJoin(endpoint, 'version')
    let axiosRequestObj = {
      url: requestUrl,
      method: 'get',
      timeout: 1000
    }
    const resp = await axios(axiosRequestObj)
    const endpointServiceType = resp.data.service
    if (serviceType !== endpointServiceType) {
      throw new Error('Attempting to register endpoint with mismatched service type')
    }

    let contractMethod = this.ServiceProviderFactory.methods.register(
      Utils.utf8ToHex(serviceType),
      endpoint)
    let tx = await this.ethWeb3Manager.sendTransaction(contractMethod, 1000000)
    return {
      txReceipt: tx,
      spID: parseInt(tx.events.RegisteredServiceProvider.returnValues._spID),
      serviceType: Utils.hexToUtf8(tx.events.RegisteredServiceProvider.returnValues._serviceType),
      owner: tx.events.RegisteredServiceProvider.returnValues._owner,
      endpoint: tx.events.RegisteredServiceProvider.returnValues._endpoint
    }
  }

  async deregister (serviceType, endpoint) {
    let requestUrl = urlJoin(endpoint, 'version')
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

    let contractMethod = this.ServiceProviderFactory.methods.deregister(
      Utils.utf8ToHex(serviceType),
      endpoint)
    let tx = await this.ethWeb3Manager.sendTransaction(contractMethod)
    return {
      txReceipt: tx,
      spID: parseInt(tx.events.DeregisteredServiceProvider.returnValues._spID),
      serviceType: Utils.hexToUtf8(tx.events.DeregisteredServiceProvider.returnValues._serviceType),
      owner: tx.events.DeregisteredServiceProvider.returnValues._owner,
      endpoint: tx.events.DeregisteredServiceProvider.returnValues._endpoint
    }
  }

  async getTotalServiceTypeProviders (serviceType) {
    return this.ServiceProviderFactory.methods.getTotalServiceTypeProviders(
      Utils.utf8ToHex(serviceType)
    ).call()
  }

  async getServiceProviderIdFromEndpoint (endpoint) {
    let info = await this.ServiceProviderFactory.methods.getServiceProviderIdFromEndpoint(
      Utils.keccak256(endpoint)
    ).call()
    return info
  }

  async getServiceProviderInfo (serviceType, serviceId) {
    let info = await this.ServiceProviderFactory.methods.getServiceProviderInfo(
      Utils.utf8ToHex(serviceType),
      serviceId
    ).call()
    return {
      owner: info.owner,
      endpoint: info.endpoint,
      spID: serviceId,
      type: serviceType,
      blocknumber: info.blocknumber
    }
  }

  async getServiceProviderInfoFromEndpoint (endpoint) {
    let requestUrl = urlJoin(endpoint, 'version')
    let axiosRequestObj = {
      url: requestUrl,
      method: 'get',
      timeout: 1000
    }

    const resp = await axios(axiosRequestObj)
    const serviceType = resp.data.service
    let serviceProviderId = await this.getServiceProviderIdFromEndpoint(endpoint)
    let info = await this.getServiceProviderInfo(serviceType, serviceProviderId)
    return info
  }

  async getServiceProviderIdsFromAddress (ownerAddress, serviceType) {
    let info = await this.ServiceProviderFactory.methods.getServiceProviderIdsFromAddress(
      ownerAddress,
      Utils.utf8ToHex(serviceType)
    ).call()
    return info
  }

  async getServiceProviderInfoFromAddress (ownerAddress, serviceType) {
    let idsList = await this.getServiceProviderIdsFromAddress(ownerAddress, serviceType)

    const spsInfo = await Promise.all(
      _.range(idsList.length).map(i =>
        this.getServiceProviderInfo(serviceType, idsList[i])
      )
    )
    return spsInfo
  }

  async getServiceProviderList (serviceType) {
    let numberOfProviders = parseInt(await this.getTotalServiceTypeProviders(serviceType))

    const providerList = await Promise.all(
      _.range(1, numberOfProviders + 1).map(i =>
        this.getServiceProviderInfo(serviceType, i)
      )
    )
    return providerList.filter(provider => provider.endpoint !== '')
  }
}

module.exports = ServiceProviderFactoryClient
