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

    let audiusInstance = new AudiusLibs({
      discoveryProviderConfig: AudiusLibs.configDiscoveryProvider(),
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
      captchaConfig: { serviceKey: config.get('recaptchaServiceKey') }
    })

    await audiusInstance.init()
    this.audiusLibsInstance = audiusInstance
  }

  getAudiusLibs () {
    return this.audiusLibsInstance
  }
}

const audiusLibsWrapper = new AudiusLibsWrapper()

module.exports = audiusLibsWrapper
