const { libs: AudiusLibs } = require('@audius/sdk-legacy/dist/libs')
const {
  setDefaultWasm
} = require('@certusone/wormhole-sdk/lib/cjs/solana/wasm')

const config = require('./config')
const registryAddress = config.get('registryAddress')
const entityManagerAddress = config.get('entityManagerAddress')
const web3ProviderUrl = config.get('web3Provider')
const Web3 = require('web3')

// Fixed address of the SPL token program
const SOLANA_TOKEN_ADDRESS = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'

class AudiusLibsWrapper {
  constructor() {
    this.audiusLibsInstance = null
    setDefaultWasm('node')
  }

  async init() {
    let web3Config
    if (config.get('environment') !== 'development') {
      web3Config = {
        registryAddress,
        useExternalWeb3: true,
        externalWeb3Config: {
          web3: new Web3(web3ProviderUrl),
          // this is a stopgap since libs external web3 init requires an ownerWallet
          // this is never actually used in the service's libs calls
          ownerWallet: config.get('relayerPublicKey')
        },
        entityManagerAddress
      }
    }

    const discoveryProviderWhitelist = config.get('discoveryProviderWhitelist')
      ? new Set(config.get('discoveryProviderWhitelist').split(','))
      : null

    const feePayerSecretKeys = config.get('solanaFeePayerWallets')
      ? config
          .get('solanaFeePayerWallets')
          .map((item) => item.privateKey)
          .map((key) => Uint8Array.from(key))
      : null

    const solanaWeb3Config = AudiusLibs.configSolanaWeb3({
      solanaClusterEndpoint: config.get('solanaEndpoint'),
      mintAddress: config.get('solanaMintAddress'),
      usdcMintAddress: config.get('solanaUSDCMintAddress'),
      solanaTokenAddress: SOLANA_TOKEN_ADDRESS,
      claimableTokenProgramAddress: config.get(
        'solanaClaimableTokenProgramAddress'
      ),
      rewardsManagerProgramId: config.get('solanaRewardsManagerProgramId'),
      rewardsManagerProgramPDA: config.get('solanaRewardsManagerProgramPDA'),
      rewardsManagerTokenPDA: config.get('solanaRewardsManagerTokenPDA'),
      // Never use the relay path in identity
      useRelay: false,
      feePayerSecretKeys,
      confirmationTimeout: config.get('solanaConfirmationTimeout')
    })

    const wormholeConfig = AudiusLibs.configWormhole({
      rpcHosts: config.get('wormholeRPCHosts'),
      solBridgeAddress: config.get('solBridgeAddress'),
      solTokenBridgeAddress: config.get('solTokenBridgeAddress'),
      ethBridgeAddress: config.get('ethBridgeAddress'),
      ethTokenBridgeAddress: config.get('ethTokenBridgeAddress')
    })

    const audiusInstance = new AudiusLibs({
      discoveryProviderConfig: {
        whitelist: discoveryProviderWhitelist
      },
      ethWeb3Config: AudiusLibs.configEthWeb3(
        config.get('ethTokenAddress'),
        config.get('ethRegistryAddress'),
        config.get('ethProviderUrl'),
        config.get('ethOwnerWallet')
      ),
      web3Config,
      isServer: true,
      captchaConfig: { serviceKey: config.get('recaptchaServiceKey') },
      solanaWeb3Config,
      wormholeConfig
    })

    await audiusInstance.init()
    this.audiusLibsInstance = audiusInstance
  }

  /**
   *
   * @returns {AudiusLibs | null}
   */
  getAudiusLibs() {
    return this.audiusLibsInstance
  }

  /**
   * Async getter for libs. Resolves when libs is initialized.
   * @returns {Promise<AudiusLibs>}
   */
  async getAudiusLibsAsync() {
    if (this.audiusLibsInstance) {
      return this.audiusLibsInstance
    }
    return new Promise((resolve) => {
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
