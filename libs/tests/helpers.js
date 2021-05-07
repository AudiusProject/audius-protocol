const nock = require('nock')

const Web3 = require('../src/web3')
const AudiusLibs = require('../src/index')
const dataContractsConfig = require('../data-contracts/config.json')
const ethContractsConfig = require('../eth-contracts/config.json')

const creatorNodeEndpoint = 'http://localhost:4000'
const discoveryProviderEndpoint = 'http://localhost:5000'
const identityServiceEndpoint = 'http://localhost:7000'
const dataWeb3ProviderEndpoint = 'http://localhost:8545'
const ethWeb3ProviderEndpoint = 'http://localhost:8546'
require('@openzeppelin/test-helpers/configure')({
  provider: ethWeb3ProviderEndpoint,
})
const isServer = true

const constants = {
  trackMetadataCID: 'QmSH5gJPHg9xLzV823ty8BSGyHNP6ty22bgLsv5MLY3kBq',
  trackMetadataCID2: 'QmSH5gJPHg9xLzV823ty8BSGyHNP6ty22bgLaaaaaaaaaa',
  creatorMetadataCID: 'QmTDhoEDLE3k3CE5bu4mF1ogsEVkPwEAM41KsN7hZX1eWY',
  '0x0': '0x0000000000000000000000000000000000000000000000000000000000000000',
  creatorNodeURL1: 'http://localhost:8000/',
  creatorNodeURL2: 'http://localhost:8001/',
  signatureData: 'Click sign to authenticate with creator node:1543885912',
  signatureAddress: '0x7d267e2f8dc64c53267c56dab55bf7050566baec',
  signature: '0xbb3ffe5f32950ace5c0a8ecb9c43ab836b7b7146a56e2519ac1c662e9b00bdcd7de9a3f3265206c54f0b8094f8ac8832d32d5852492c1aa3e9493e28ae3a31b91b',
  wallet: '0xdfdbe819b5710b750b3a00eb2fae8a59b85c66af',
  ethContractsConfig: ethContractsConfig
}

const dataWeb3 = new Web3(new Web3.providers.HttpProvider(dataWeb3ProviderEndpoint))
const ethWeb3 = new Web3(new Web3.providers.HttpProvider(ethWeb3ProviderEndpoint))

const audiusLibsConfig = {
  web3Config: AudiusLibs.configExternalWeb3(
    dataContractsConfig.registryAddress,
    dataWeb3
  ),
  ethWeb3Config: AudiusLibs.configEthWeb3(
    ethContractsConfig.audiusTokenAddress,
    ethContractsConfig.registryAddress,
    ethWeb3,
    ethContractsConfig.ownerWallet
  ),
  isServer: true
}

async function initializeLibConfig (ownerWallet) {
  return {
    web3Config: AudiusLibs.configExternalWeb3(
      dataContractsConfig.registryAddress,
      dataWeb3
    ),
    ethWeb3Config: AudiusLibs.configEthWeb3(
      ethContractsConfig.audiusTokenAddress,
      ethContractsConfig.registryAddress,
      ethWeb3,
      ownerWallet
    ),
    isServer: true
  }
}

const getRandomLocalhost = () => {
  return 'http://localhost:' + Math.floor(1000 + Math.random() * 9000)
}

const deregisterSPEndpoint = async (libs, account, type) => {
  let previousRegisteredId = await libs.ethContracts.ServiceProviderFactoryClient.getServiceProviderIdFromAddress(
    account,
    type)
  let prevSpInfo = await libs.ethContracts.ServiceProviderFactoryClient.getServiceEndpointInfo(
    type,
    previousRegisteredId)

  let path = '/version'
  let response = {
    service: type,
    version : '0.0.1'
  }

  if (type === 'discovery-provider') {
    path = '/health_check'
    response = {data: {...response}}
  }

  nock(prevSpInfo.endpoint)
    .get(path)
    .reply(200, response)
  let tx = await libs.ethContracts.ServiceProviderFactoryClient.deregister(
    type,
    prevSpInfo.endpoint)
}

module.exports = {
  constants,
  // Export configured libs instance
  audiusInstance: new AudiusLibs(audiusLibsConfig),
  // Export libs config for re-use
  audiusLibsConfig,
  initializeLibConfig,
  getRandomLocalhost,
  deregisterSPEndpoint
}
