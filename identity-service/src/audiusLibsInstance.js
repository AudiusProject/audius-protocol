const AudiusLibs = require('@audius/libs')

const config = require('./config')
const registryAddress = config.get('registryAddress')
const web3ProviderUrl = config.get('web3Provider')

class AudiusLibsWrapper {
  constructor () {
    this.audiusLibsInstance = null
  }

  async init () {
    const dataWeb3 = await AudiusLibs.Utils.configureWeb3(web3ProviderUrl, null, false)
    if (!dataWeb3) throw new Error('Web3 incorrectly configured')

    const discoveryProviderWhitelist = config.get('discoveryProviderWhitelist')
      ? new Set(config.get('discoveryProviderWhitelist').split(','))
      : null

    let audiusInstance = new AudiusLibs({
      discoveryProviderConfig: AudiusLibs.configDiscoveryProvider(discoveryProviderWhitelist),
      ethWeb3Config: AudiusLibs.configEthWeb3(
        config.get('ethTokenAddress'),
        config.get('ethRegistryAddress'),
        config.get('ethProviderUrl'),
        config.get('ethOwnerWallet')
      ),
      web3Config: {
        registryAddress,
        useExternalWeb3: true,
        externalWeb3Config: {
          web3: dataWeb3,
          // this is a stopgap since libs external web3 init requires an ownerWallet
          // this is never actually used in the service's libs calls
          ownerWallet: config.get('relayerPublicKey')
        }
      },
      isServer: true,
      captchaConfig: { serviceKey: config.get('recaptchaServiceKey') },
      solanaWeb3Config: AudiusLibs.configSolanaWeb3({
        solanaClusterEndpoint: config.get('solanaEndpoint'),
        shouldUseRelay: false,
        // TODO: this is a risky line, need to handle it not existing
        feePayerSecretKey: Uint8Array.from(config.get('solanaFeePayerWallet'))
      })
    })

    await audiusInstance.init()
    this.audiusLibsInstance = audiusInstance
  }

  getAudiusLibs () {
    return this.audiusLibsInstance
  }

  /**
   * Async getter for libs. Resolves when libs is initialized.
   */
  async getAudiusLibsAsync () {
    if (this.audiusLibsInstance) {
      return this.audiusLibsInstance
    }
    return new Promise(resolve => {
      const i = setInterval(() => {
        if (this.audiusLibsInstance) {
          clearInterval(i)
          resolve(this.audiusLibsInstance)
        }
      }, 1000)
    })
  }
}

const audiusLibsWrapper = new AudiusLibsWrapper()

module.exports = audiusLibsWrapper
