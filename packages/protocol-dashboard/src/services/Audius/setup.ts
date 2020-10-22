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

export async function setup(this: AudiusClient): Promise<void> {
  if (!window.web3 || !window.ethereum) {
    // metamask is not installed
    this.isAccountMisconfgured = true
    this.libs = await configureReadOnlyLibs()
  } else {
    try {
      if (window.ethereum) {
        const isUnlocked = await window.ethereum._metamask.isUnlocked()
        if (!isUnlocked) {
          // If the user changes metamask accounts, reload and init
          window.ethereum.on('accountsChanged', () => {
            window.location.reload()
          })
        }
      }

      let metamaskWeb3Network = await getMetaMaskNetwork()
      if (metamaskWeb3Network !== ethNetworkId) {
        this.isAccountMisconfgured = true
        this.libs = await configureReadOnlyLibs()
      } else {
        this.libs = await configureLibsWithAccount()
        this.hasValidAccount = true
      }
    } catch (err) {
      this.libs = await configureReadOnlyLibs()
    }
  }

  window.audiusLibs = this.libs
  this.isSetup = true
}

const getMetaMaskNetwork = async () => {
  // Below is an async version of the web3 version check since metamask 0.20.7 getNetwork doesn't work async
  return new Promise(async (resolve, reject) => {
    window.web3.version.getNetwork((error: any, result: any) => {
      if (error) reject(error)
      resolve(result)
    })
  })
}

const configureReadOnlyLibs = async () => {
  const ethWeb3Config = audius.configEthWeb3(
    ethTokenAddress,
    ethRegistryAddress,
    ethProviderUrl,
    ethOwnerWallet
  )

  let audiusLibsConfig = {
    ethWeb3Config,
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
  let audiusLibsConfig = {
    ethWeb3Config: audius.configEthWeb3(
      ethTokenAddress,
      ethRegistryAddress,
      configuredMetamaskWeb3,
      metamaskAccount
    ),
    isServer: false
  }
  const libs = new audius(audiusLibsConfig)
  await libs.init()
  return libs
}
