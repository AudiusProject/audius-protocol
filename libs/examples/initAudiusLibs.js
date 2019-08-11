const Web3 = require('web3')

const AudiusLibs = require('../src/index')
const dataContractsConfig = require('../data-contracts/config.json')
const ethContractsConfig = require('../eth-contracts/config.json')

const creatorNodeEndpoint = 'http://localhost:4000'
const identityServiceEndpoint = 'http://localhost:7000'
const dataWeb3ProviderEndpoint = 'http://localhost:8545'
const ethWeb3ProviderEndpoint = 'http://localhost:8546'
const isServer = true

async function initAudiusLibs (useExternalWeb3, ownerWalletOverride = null) {
  let audiusLibsConfig
  const ethWeb3 = new Web3(new Web3.providers.HttpProvider(ethWeb3ProviderEndpoint))
  if (useExternalWeb3) {
    const dataWeb3 = new Web3(new Web3.providers.HttpProvider(dataWeb3ProviderEndpoint))
    audiusLibsConfig = {
      // Network id does not need to be checked in the test environment.
      web3Config: AudiusLibs.configExternalWeb3(
        dataContractsConfig.registryAddress,
        dataWeb3,
        /* networkId */ null,
        ownerWalletOverride
      ),
      ethWeb3Config: AudiusLibs.configEthWeb3(
        ethContractsConfig.audiusTokenAddress,
        ethContractsConfig.registryAddress,
        ethWeb3,
        ethContractsConfig.ownerWallet
      ),
      discoveryProviderConfig: AudiusLibs.configDiscoveryProvider(true),
      creatorNodeConfig: AudiusLibs.configCreatorNode(creatorNodeEndpoint),
      isServer: isServer
    }
  } else {
    audiusLibsConfig = {
      web3Config: AudiusLibs.configInternalWeb3(dataContractsConfig.registryAddress, dataWeb3ProviderEndpoint),
      ethWeb3Config: AudiusLibs.configEthWeb3(
        ethContractsConfig.audiusTokenAddress,
        ethContractsConfig.registryAddress,
        ethWeb3,
        ethContractsConfig.ownerWallet),
      creatorNodeConfig: AudiusLibs.configCreatorNode(creatorNodeEndpoint),
      discoveryProviderConfig: AudiusLibs.configDiscoveryProvider(true),
      identityServiceConfig: AudiusLibs.configIdentityService(identityServiceEndpoint),
      isServer: isServer
    }
  }
  let audiusLibs = new AudiusLibs(audiusLibsConfig)

  await audiusLibs.init()
  return audiusLibs
}

module.exports = initAudiusLibs
