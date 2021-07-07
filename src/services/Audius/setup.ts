import { AudiusClient } from './AudiusClient'
import audius, { Utils } from '@audius/libs'

declare global {
  interface Window {
    AudiusClient: any
    Audius: any
    Utils: any
    Web3: any
    audiusLibs: any
    web3: any
    ethereum: any
    dataWeb3: any
    configuredMetamaskWeb3: any
    isAccountMisconfigured: boolean
  }
}

const Web3 = window.Web3
window.Utils = Utils

const ethRegistryAddress = process.env.REACT_APP_ETH_REGISTRY_ADDRESS
const ethTokenAddress = process.env.REACT_APP_ETH_TOKEN_ADDRESS

const ethProviderUrl =
  process.env.REACT_APP_ETH_PROVIDER_URL || 'ws://localhost:8546'

const ethOwnerWallet = process.env.REACT_APP_ETH_OWNER_WALLET
const ethNetworkId = process.env.REACT_APP_ETH_NETWORK_ID

const DISCOVERY_NODE_ALLOW_LIST = new Set([
  'https://discoveryprovider2.audius.co',
  'https://discoveryprovider3.audius.co',
  'https://discoveryprovider.audius3.prod-us-west-2.staked.cloud',
  'https://discoveryprovider.audius7.prod-us-west-2.staked.cloud',
  'https://discoveryprovider.audius.prod-us-west-2.staked.cloud',
  'https://discoveryprovider.audius4.prod-us-west-2.staked.cloud',
  'https://discovery-a.mainnet.audius.radar.tech',
  'https://discovery-d.mainnet.audius.radar.tech',
  'https://discoveryprovider.audius6.prod-us-west-2.staked.cloud',
  'https://discoveryprovider.audius1.prod-us-west-2.staked.cloud',
  'https://discoveryprovider.audius2.prod-us-west-2.staked.cloud',
  'https://discoveryprovider.audius5.prod-us-west-2.staked.cloud',
  'https://audius-metadata-2.figment.io',
  'https://dn-jpn.audius.metadata.fyi',
  'https://dn-usa.audius.metadata.fyi',
  'https://audius-discovery-1.altego.net',
  'https://audius-disco.ams-x01.nl.supercache.org',
  'https://discovery-au-01.audius.openplayer.org',
  'https://dn1.monophonic.digital',
  'https://disc-gru01.audius.hashbeam.com',
  'https://audius-dp.nuremberg.creatorseed.com',
  'https://audius-dp.johannesburg.creatorseed.com',
  'https://discoveryprovider.audius.co',
  'https://dn2.monophonic.digital'
])

// Used to prevent two callbacks from firing triggering reload
let willReload = false

/**
 * Metamask sometimes returns null for window.ethereum.networkVersion,
 * so if this happens, try a second time after a slight delay
 */
const getMetamaskIsOnEthMainnet = async () => {
  let metamaskWeb3Network = window.ethereum.networkVersion
  if (metamaskWeb3Network === ethNetworkId) return true

  metamaskWeb3Network = await new Promise(resolve => {
    console.debug('Metamask network not matching, trying again')
    setTimeout(() => {
      resolve(window.ethereum.networkVersion)
    }, 2000)
  })

  return metamaskWeb3Network === ethNetworkId
}

export async function setup(this: AudiusClient): Promise<void> {
  if (!window.web3 || !window.ethereum) {
    // Metamask is not installed
    this.isViewOnly = true
    this.libs = await configureReadOnlyLibs()
  } else {
    // Turn off auto refresh (this causes infinite reload loops)
    window.ethereum.autoRefreshOnNetworkChange = false

    // Metamask is installed
    window.web3 = new Web3(window.ethereum)
    try {
      // Add reload listeners, but make sure the page is fully loaded first
      // 2s is a guess, but the issue is really hard to repro
      if (window.ethereum) {
        setTimeout(() => {
          // Reload anytime the accounts change
          window.ethereum.on('accountsChanged', () => {
            if (!willReload) {
              console.log('Account change')
              willReload = true
              window.location.reload()
            }
          })
          // Reload anytime the network changes
          window.ethereum.on('chainChanged', () => {
            console.log('Chain change')
            if (!willReload) {
              willReload = true
              window.location.reload()
            }
          })
        }, 2000)
      }

      const isOnMainnetEth = await getMetamaskIsOnEthMainnet()
      if (!isOnMainnetEth) {
        this.isMisconfigured = true
        this.libs = await configureReadOnlyLibs()
      } else {
        this.libs = await configureLibsWithAccount()
        this.hasValidAccount = true

        // Failed to pull necessary info from metamask, configure read only
        if (!this.libs) {
          this.libs = await configureReadOnlyLibs()
          this.isAccountMisconfigured = true
          this.hasValidAccount = false
        }
      }
    } catch (err) {
      console.error(err)
      this.libs = await configureReadOnlyLibs()
      this.isMisconfigured = true
    }
  }

  window.audiusLibs = this.libs
  this.isSetup = true
}

const configureReadOnlyLibs = async () => {
  const ethWeb3Config = audius.configEthWeb3(
    ethTokenAddress,
    ethRegistryAddress,
    ethProviderUrl,
    ethOwnerWallet
  )
  const discoveryProviderConfig = audius.configDiscoveryProvider(
    DISCOVERY_NODE_ALLOW_LIST
  )

  let audiusLibsConfig = {
    ethWeb3Config,
    discoveryProviderConfig,
    isServer: false
  }
  const libs = new audius(audiusLibsConfig)
  await libs.init()
  return libs
}

const configureLibsWithAccount = async () => {
  let configuredMetamaskWeb3 = await Utils.configureWeb3(
    window.web3.currentProvider,
    ethNetworkId,
    false
  )

  let metamaskAccounts: any = await new Promise(resolve => {
    configuredMetamaskWeb3.eth.getAccounts((...args: any) => {
      resolve(args[1])
    })
  })
  let metamaskAccount = metamaskAccounts[0]

  // Not connected or no accounts, return
  if (!metamaskAccount) {
    return null
  }
  let audiusLibsConfig = {
    ethWeb3Config: audius.configEthWeb3(
      ethTokenAddress,
      ethRegistryAddress,
      configuredMetamaskWeb3,
      metamaskAccount
    ),
    discoveryProviderConfig: audius.configDiscoveryProvider(
      DISCOVERY_NODE_ALLOW_LIST
    ),
    isServer: false
  }
  const libs = new audius(audiusLibsConfig)
  await libs.init()
  return libs
}
