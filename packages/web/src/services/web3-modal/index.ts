import { getErrorMessage } from '@audius/common/utils'
import type { IProviderOptions } from 'web3modal'

import phantomIconPurpleSvg from 'assets/img/phantom-icon-purple.svg'
import walletLinkSvg from 'assets/img/wallet-link.svg'
import { env } from 'services/env'

const CHAIN_ID = env().ETH_NETWORK_ID
const BITSKI_CLIENT_ID = env().BITSKI_CLIENT_ID
const BITSKI_CALLBACK_URL = env().BITSKI_CALLBACK_URL
const WEB3_NETWORK_ID = parseInt(env().ETH_NETWORK_ID || '')
const ETH_PROVIDER_URLS = (env().ETH_PROVIDER_URL || '').split(',')

type Config = {
  isBitSkiEnabled: boolean
  isWalletConnectEnabled: boolean
  isWalletLinkEnabled: boolean
  isPhantomEnabled: boolean
}

class PassThrough {
  constructor(...args: any) {
    return args
  }
}

export const loadWalletConnect = async () => {
  const { default: WalletConnectProvider } = await import(
    '@walletconnect/web3-provider'
  )
  return WalletConnectProvider
}

export const loadBitski = async () => {
  const { Bitski } = await import('bitski')
  return Bitski
}

export const loadWalletLink = async () => {
  const { WalletLink } = await import('walletlink')
  return WalletLink
}

export const createSession = async (config: Config): Promise<any> => {
  try {
    const Web3 = window.Web3

    const WalletConnectProvider = await loadWalletConnect()
    const Bitski = await loadBitski()
    const WalletLink = await loadWalletLink()

    const providerOptions: IProviderOptions = {}
    if (config.isBitSkiEnabled && BITSKI_CLIENT_ID && BITSKI_CALLBACK_URL) {
      providerOptions.bitski = {
        package: Bitski, // required
        options: {
          clientId: BITSKI_CLIENT_ID,
          callbackUrl: BITSKI_CALLBACK_URL
        }
      }
    }
    if (config.isWalletConnectEnabled) {
      providerOptions.walletconnect = {
        package: WalletConnectProvider,
        options: {
          rpc: {
            [WEB3_NETWORK_ID]: ETH_PROVIDER_URLS[0]
          }
        }
      }
    }
    if (config.isWalletLinkEnabled) {
      providerOptions['custom-walletlink'] = {
        display: {
          logo: walletLinkSvg,
          name: 'WalletLink',
          description: 'Scan with WalletLink to connect'
        },
        options: {
          appName: 'Audius',
          networkUrl: ETH_PROVIDER_URLS[0],
          chainId: CHAIN_ID
        },
        package: WalletLink,
        connector: async (_, options) => {
          const { appName, networkUrl, chainId } = options
          const walletLink = new WalletLink({
            appName
          })
          const provider = walletLink.makeWeb3Provider(networkUrl, chainId)
          await provider.enable()
          return provider
        }
      }
    }
    if (config.isPhantomEnabled && window?.solana?.isPhantom) {
      providerOptions['custom-phantom'] = {
        display: {
          logo: phantomIconPurpleSvg,
          name: 'Phantom',
          description: 'Connect Solana account'
        },
        options: {},
        package: PassThrough,
        connector: async (...args: any) => {
          try {
            // Connect to solana web3
            await window.solana.connect()
            await new Promise((resolve) => setTimeout(resolve, 1000))
            return window.solana
          } catch (err) {
            console.error(err)
          }
        }
      }
    }

    const { default: Web3Modal } = await import('web3modal')
    const web3Modal = new Web3Modal({ providerOptions })

    const provider = await web3Modal.connect()

    const web3 = new Web3(provider)
    return web3
  } catch (error) {
    const errorMessage = getErrorMessage(error)
    if (errorMessage === 'Modal closed by user') {
      console.info('Web3 modal closed by user')
    }
  }
}
