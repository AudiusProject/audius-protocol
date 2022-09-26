const { libs: AudiusLibs } = require('@audius/sdk')

const config = require('../config')
const { logger: genericLogger } = require('../logging')

/**
 * Creates, initializes, and returns an audiusLibs instance
 *
 * Configures dataWeb3 to be internal to libs, logged in with delegatePrivateKey in order to write chain TX
 */
module.exports = async ({
  enableEthContracts = true,
  enableContracts = true,
  enableDiscovery = true,
  enableIdentity = true,
  logger = genericLogger
}) => {
  /**
   * Define all config variables
   */
  const ethProviderUrl = config.get('ethProviderUrl')
  const ethNetworkId = config.get('ethNetworkId')
  const discoveryProviderWhitelistConfig = config.get(
    'discoveryProviderWhitelist'
  )
  const identityService = config.get('identityService')
  const discoveryNodeUnhealthyBlockDiff = config.get(
    'discoveryNodeUnhealthyBlockDiff'
  )
  const ethTokenAddress = config.get('ethTokenAddress')
  const ethRegistryAddress = config.get('ethRegistryAddress')
  const ethOwnerWallet = config.get('ethOwnerWallet')
  const dataRegistryAddress = config.get('dataRegistryAddress')
  const dataProviderUrl = config.get('dataProviderUrl')
  const delegatePrivateKey = config.get('delegatePrivateKey')
  const oldDelegatePrivateKey = config.get('oldDelegatePrivateKey')
  const creatorNodeIsDebug = config.get('creatorNodeIsDebug')

  const discoveryProviderWhitelist = discoveryProviderWhitelistConfig
    ? new Set(discoveryProviderWhitelistConfig.split(','))
    : null

  /**
   * Configure ethWeb3
   */
  const ethWeb3 = await AudiusLibs.Utils.configureWeb3(
    ethProviderUrl,
    ethNetworkId,
    /* requiresAccount */ false
  )
  if (!ethWeb3) {
    throw new Error(
      'Failed to init audiusLibs due to ethWeb3 configuration error'
    )
  }

  /**
   * Create AudiusLibs instance
   */
  const audiusLibs = new AudiusLibs({
    ethWeb3Config: enableEthContracts
      ? AudiusLibs.configEthWeb3(
          ethTokenAddress,
          ethRegistryAddress,
          ethWeb3,
          ethOwnerWallet
        )
      : null,
    // AudiusContracts (enabled by enableContracts) needs web3Config
    web3Config: enableContracts
      ? AudiusLibs.configInternalWeb3(
          dataRegistryAddress,
          // pass as array
          [dataProviderUrl],
          // TODO - formatting this private key here is not ideal
          (oldDelegatePrivateKey || delegatePrivateKey).replace('0x', '')
        )
      : null,
    discoveryProviderConfig: enableDiscovery
      ? {
          whitelist: discoveryProviderWhitelist,
          unhealthyBlockDiff: discoveryNodeUnhealthyBlockDiff
        }
      : null,
    // If an identity service config is present, set up libs with the connection, otherwise do nothing
    identityServiceConfig: enableIdentity
      ? identityService
        ? AudiusLibs.configIdentityService(identityService)
        : undefined
      : null,
    isDebug: creatorNodeIsDebug,
    isServer: true,
    preferHigherPatchForPrimary: true,
    preferHigherPatchForSecondaries: true,
    logger
  })

  await audiusLibs.init()
  return audiusLibs
}
