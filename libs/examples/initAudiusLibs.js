const Web3 = require('../src/LibsWeb3')

const { libs: AudiusLibs } = require('../dist/index')
const dataContractsConfig = require('../src/data-contracts/config.json')
const ethContractsConfig = require('../src/eth-contracts/config.json')

const creatorNodeEndpoint = 'http://localhost:4000'
const identityServiceEndpoint = 'http://localhost:7000'
const dataWeb3ProviderEndpoints = [
  'http://localhost:8545',
  'http://localhost:8545'
]
const ethWeb3ProviderEndpoint = 'http://localhost:8546'
const isServer = true
const isDebug = true

async function initAudiusLibs(
  useExternalWeb3,
  ownerWalletOverride = null,
  ethOwnerWalletOverride = null,
  ownerWalletPrivateKey = null
) {
  let audiusLibsConfig
  const ethWallet =
    ethOwnerWalletOverride === null
      ? ethContractsConfig.ownerWallet
      : ethOwnerWalletOverride
  if (useExternalWeb3) {
    const dataWeb3 = new Web3(
      new Web3.providers.HttpProvider(dataWeb3ProviderEndpoints[0])
    )
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
        ethWeb3ProviderEndpoint,
        ethWallet
      ),
      discoveryProviderConfig: {
        whitelist: new Set(['http://docker.for.mac.localhost:5000'])
      },
      isServer,
      isDebug
    }
  } else {
    audiusLibsConfig = {
      web3Config: AudiusLibs.configInternalWeb3(
        dataContractsConfig.registryAddress,
        dataWeb3ProviderEndpoints,
        ownerWalletPrivateKey
      ),
      ethWeb3Config: AudiusLibs.configEthWeb3(
        ethContractsConfig.audiusTokenAddress,
        ethContractsConfig.registryAddress,
        ethWeb3ProviderEndpoint,
        ethContractsConfig.ownerWallet
      ),
      creatorNodeConfig: AudiusLibs.configCreatorNode(creatorNodeEndpoint),
      discoveryProviderConfig: {},
      identityServiceConfig: AudiusLibs.configIdentityService(
        identityServiceEndpoint
      ),
      isServer,
      isDebug
    }
  }
  const audiusLibs = new AudiusLibs(audiusLibsConfig)

  // we need this try/catch because sometimes we call init before a discprov has been brought up
  // in that case, handle that error and continue so we're unblocking scripts that depend on this libs instance for other functionality
  try {
    await audiusLibs.init()
  } catch (e) {
    console.error("Couldn't init libs", e)
  }
  return audiusLibs
}

module.exports = initAudiusLibs
