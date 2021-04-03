import Web3Modal, { IProviderOptions } from 'web3modal'

const BITSKI_CLIENT_ID = process.env.REACT_APP_BITSKI_CLIENT_ID
const BITSKI_CALLBACK_URL = process.env.REACT_APP_BITSKI_CALLBACK_URL
const WEB3_NETWORK_ID = parseInt(process.env.REACT_APP_ETH_NETWORK_ID || '')
const ETH_PROVIDER_URLS = (process.env.REACT_APP_ETH_PROVIDER_URL || '').split(
  ','
)

type Config = {
  isBitkiEnabled: boolean
  isWalletConnectEnabled: boolean
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

export const createSession = async (config: Config): Promise<any> => {
  try {
    const Web3 = window.Web3

    const WalletConnectProvider = await loadWalletConnect()
    const Bitski = await loadBitski()

    const providerOptions: IProviderOptions = {}
    if (config.isBitkiEnabled && BITSKI_CLIENT_ID && BITSKI_CALLBACK_URL) {
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

    // Other provider options
    // torus: {
    //   package: Torus, // required
    //   options: {}
    // },
    // frame: {
    //   package: ethProvider // required
    // },

    const web3Modal = new Web3Modal({ providerOptions })

    const provider = await web3Modal.connect()

    const web3 = new Web3(provider)
    return web3
  } catch (err) {
    console.log({ err })
    if ('message' in err && err.message === 'Modal closed by user') {
      console.log('cloed by user')
    }
    console.log(err)
  }
}

export default createSession
