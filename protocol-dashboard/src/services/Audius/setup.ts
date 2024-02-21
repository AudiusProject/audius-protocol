import { AudiusClient } from './AudiusClient'
import { libs as AudiusLibs, Utils } from '@audius/sdk/dist/web-libs'

declare global {
  interface Window {
    AudiusClient: any
    Audius: any
    Web3: any
    web3: any
    ethereum: any
    dataWeb3: any
    configuredMetamaskWeb3: any
    isAccountMisconfigured: boolean
  }
}

const Web3 = window.Web3

const identityServiceEndpoint = import.meta.env.VITE_IDENTITY_SERVICE_ENDPOINT
const registryAddress = import.meta.env.VITE_REGISTRY_ADDRESS
const ethRegistryAddress = import.meta.env.VITE_ETH_REGISTRY_ADDRESS
const ethTokenAddress = import.meta.env.VITE_ETH_TOKEN_ADDRESS
const claimDistributionContractAddress = import.meta.env
  .VITE_CLAIM_DISTRIBUTION_CONTRACT_ADDRESS
const wormholeContractAddress = import.meta.env.VITE_WORMHOLE_CONTRACT_ADDRESS
const entityManagerAddress = import.meta.env.VITE_ENTITY_MANAGER_ADDRESS

const ethProviderUrl =
  import.meta.env.VITE_ETH_PROVIDER_URL || 'ws://0.0.0.0:8546' // probably a better fallback is http://audius-protocol-eth-ganache-1

const ethOwnerWallet = import.meta.env.VITE_ETH_OWNER_WALLET
const ethNetworkId = import.meta.env.VITE_ETH_NETWORK_ID

const SOLANA_CLUSTER_ENDPOINT = import.meta.env.VITE_SOLANA_CLUSTER_ENDPOINT
const WAUDIO_MINT_ADDRESS = import.meta.env.VITE_WAUDIO_MINT_ADDRESS
const USDC_MINT_ADDRESS = import.meta.env.VITE_USDC_MINT_ADDRESS
const SOLANA_TOKEN_ADDRESS = import.meta.env.VITE_SOLANA_TOKEN_PROGRAM_ADDRESS
const CLAIMABLE_TOKEN_PDA = import.meta.env.VITE_CLAIMABLE_TOKEN_PDA
const SOLANA_FEE_PAYER_ADDRESS = import.meta.env.VITE_SOLANA_FEE_PAYER_ADDRESS

const CLAIMABLE_TOKEN_PROGRAM_ADDRESS = import.meta.env
  .VITE_CLAIMABLE_TOKEN_PROGRAM_ADDRESS
const REWARDS_MANAGER_PROGRAM_ID = import.meta.env
  .VITE_REWARDS_MANAGER_PROGRAM_ID
const REWARDS_MANAGER_PROGRAM_PDA = import.meta.env
  .VITE_REWARDS_MANAGER_PROGRAM_PDA
const REWARDS_MANAGER_TOKEN_PDA = import.meta.env.VITE_REWARDS_MANAGER_TOKEN_PDA

export const IS_PRODUCTION =
  import.meta.env.VITE_ETH_NETWORK_ID &&
  import.meta.env.VITE_ETH_NETWORK_ID === '1'

const IS_STAGING =
  import.meta.env.VITE_ETH_NETWORK_ID &&
  import.meta.env.VITE_ETH_NETWORK_ID === '11155111'

// Used to prevent two callbacks from firing triggering reload
let willReload = false

export const getMetamaskChainId = async () => {
  const chainId = await window.ethereum.request({ method: 'eth_chainId' })
  return parseInt(chainId, 16).toString()
}

/**
 * Metamask sometimes returns null chainId,
 * so if this happens, try a second time after a slight delay
 */
const getMetamaskIsOnEthMainnet = async () => {
  let chainId = await getMetamaskChainId()
  if (chainId === ethNetworkId) return true

  // Try a second time just in case metamask was being slow to understand itself
  chainId = await new Promise(resolve => {
    console.debug('Metamask network not matching, trying again')
    setTimeout(async () => {
      chainId = await getMetamaskChainId()
      resolve(chainId)
    }, 2000)
  })

  return chainId === ethNetworkId
}

export async function setup(this: AudiusClient): Promise<void> {
  if (!window.ethereum) {
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
            if (!willReload) {
              console.log('Chain change')
              willReload = true
              window.location.reload()
            }
          })
        }, 2000)
      }
      const isOnMainnetEth = await getMetamaskIsOnEthMainnet()
      if (!isOnMainnetEth) {
        this.isMisconfigured = true
        this.onMetaMaskAccountLoaded(null)
        this.libs = await configureReadOnlyLibs()
      } else {
        this.libs = await configureLibsWithAccount({
          onMetaMaskAccountLoaded: (account: string) => {
            if (!account) {
              this.isAccountMisconfigured = true
            }
            this.onMetaMaskAccountLoaded(account)
          }
        })
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
      this.isMisconfigured = true
      this.onMetaMaskAccountLoaded(null)
      this.libs = await configureReadOnlyLibs()
    }
  }

  window.audiusLibs = this.libs
  this.isSetup = true
  this.onSetupFinished()
}

const configureReadOnlyLibs = async () => {
  // @ts-ignore
  const ethWeb3Config = AudiusLibs.configEthWeb3(
    ethTokenAddress!,
    ethRegistryAddress!,
    ethProviderUrl!,
    ethOwnerWallet!,
    claimDistributionContractAddress!,
    wormholeContractAddress!
  )
  // @ts-ignore
  const solanaWeb3Config = AudiusLibs.configSolanaWeb3({
    claimableTokenPDA: CLAIMABLE_TOKEN_PDA!,
    solanaClusterEndpoint: SOLANA_CLUSTER_ENDPOINT!,
    mintAddress: WAUDIO_MINT_ADDRESS!,
    usdcMintAddress: USDC_MINT_ADDRESS!,
    solanaTokenAddress: SOLANA_TOKEN_ADDRESS!,
    // @ts-ignore
    feePayerAddress: SOLANA_FEE_PAYER_ADDRESS!,
    claimableTokenProgramAddress: CLAIMABLE_TOKEN_PROGRAM_ADDRESS!,
    rewardsManagerProgramId: REWARDS_MANAGER_PROGRAM_ID!,
    rewardsManagerProgramPDA: REWARDS_MANAGER_PROGRAM_PDA!,
    rewardsManagerTokenPDA: REWARDS_MANAGER_TOKEN_PDA!,
    useRelay: true
  })

  const identityServiceConfig = {
    url: identityServiceEndpoint
  }

  const audiusLibsConfig = {
    ethWeb3Config,
    solanaWeb3Config,
    identityServiceConfig,
    discoveryProviderConfig: {},
    isServer: false,
    isDebug: !IS_PRODUCTION && !IS_STAGING
  }
  // @ts-ignore
  const libs = new AudiusLibs(audiusLibsConfig)
  await libs.init()
  return libs
}

const configWeb3 = async (web3Provider: any, networkId: string) => {
  const web3Instance = await Utils.configureWeb3(web3Provider, networkId, false)
  if (!web3Instance) {
    throw new Error('External web3 incorrectly configured')
  }
  const wallets = await web3Instance.eth.getAccounts()
  return {
    registryAddress,
    entityManagerAddress,
    useExternalWeb3: true,
    externalWeb3Config: {
      web3: web3Instance,
      ownerWallet: wallets[0]
    }
  }
}

const configureLibsWithAccount = async ({
  onMetaMaskAccountLoaded
}: {
  onMetaMaskAccountLoaded: (account: string) => void
}) => {
  // @ts-ignore
  // let configuredMetamaskWeb3 = await AudiusLibs.configExternalWeb3(
  //   registryAddress!,
  //   // window.web3.currentProvider,
  //   [window.ethereum],
  //    // Pass network version here for ethNetworkId. Libs uses an out of date network check
  //   //  window.ethereum.networkVersion,
  //   ethNetworkId!
  // )
  let configuredMetamaskWeb3 = await configWeb3(
    [window.ethereum],
    ethNetworkId!
  )
  console.log(configuredMetamaskWeb3)

  let metamaskAccounts: any = await new Promise(resolve => {
    configuredMetamaskWeb3.externalWeb3Config.web3.eth.getAccounts(
      (...args: any) => {
        resolve(args[1])
      }
    )
  })
  let metamaskAccount = metamaskAccounts[0]

  onMetaMaskAccountLoaded(metamaskAccount)

  // Not connected or no accounts, return
  if (!metamaskAccount) {
    return null
  }

  // @ts-ignore
  const ethWeb3Config = AudiusLibs.configEthWeb3(
    ethTokenAddress!,
    ethRegistryAddress!,
    configuredMetamaskWeb3.externalWeb3Config.web3,
    metamaskAccount,
    claimDistributionContractAddress!,
    wormholeContractAddress!
  )

  // @ts-ignore
  const solanaWeb3Config = AudiusLibs.configSolanaWeb3({
    claimableTokenPDA: CLAIMABLE_TOKEN_PDA!,
    solanaClusterEndpoint: SOLANA_CLUSTER_ENDPOINT!,
    mintAddress: WAUDIO_MINT_ADDRESS!,
    usdcMintAddress: USDC_MINT_ADDRESS!,
    solanaTokenAddress: SOLANA_TOKEN_ADDRESS!,
    // @ts-ignore
    feePayerAddress: SOLANA_FEE_PAYER_ADDRESS!,
    claimableTokenProgramAddress: CLAIMABLE_TOKEN_PROGRAM_ADDRESS!,
    rewardsManagerProgramId: REWARDS_MANAGER_PROGRAM_ID!,
    rewardsManagerProgramPDA: REWARDS_MANAGER_PROGRAM_PDA!,
    rewardsManagerTokenPDA: REWARDS_MANAGER_TOKEN_PDA!,
    useRelay: true
  })

  const audiusLibsConfig = {
    web3Config: configuredMetamaskWeb3,
    ethWeb3Config,
    solanaWeb3Config,
    // @ts-ignore
    identityServiceConfig: AudiusLibs.configIdentityService(
      identityServiceEndpoint!
    ),
    discoveryProviderConfig: {},
    isServer: false,
    isDebug: !IS_PRODUCTION && !IS_STAGING
  }
  // @ts-ignore
  const libs = new AudiusLibs(audiusLibsConfig)
  await libs.init()
  return libs
}
