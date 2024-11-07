import { EIP712TypedData, MessageData } from 'eth-sig-util'
import { Account, createWalletClient, custom, defineChain } from 'viem'

import { getConfig } from '../../config/getConfig'
import { SdkConfig } from '../../types'
import { DiscoveryNodeSelector } from '../DiscoveryNodeSelector'

import type { AuthService } from './types'

// TODO: Move this?
// Add type declaration for window.ethereum
interface EthereumWindow extends Window {
  ethereum?: any
}

declare const window: EthereumWindow

export type ExternalWalletAuthConfig = {
  environment: SdkConfig['environment']
  discoveryNodeSelector: DiscoveryNodeSelector
}

const createClient = (account: Account, chainId: number, rpcUrl: string) => {
  const audiusChain = defineChain({
    id: chainId,
    name: 'Audius',
    network: 'Audius',
    nativeCurrency: {
      decimals: 18,
      name: '-',
      symbol: '-'
    },
    rpcUrls: {
      default: {
        http: [rpcUrl]
      },
      public: {
        http: [rpcUrl]
      }
    }
  })
  return createWalletClient({
    account,
    chain: audiusChain,
    transport: custom(window.ethereum!)
  })
}

/**
 * Uses external (browser) wallet as signer for transactions. Specifically targeting
 * Metamask for the moment.
 */
export class ExternalWalletAuth implements AuthService {
  private chainId: number
  private discoveryNodeSelector: DiscoveryNodeSelector
  private client?: ReturnType<typeof createClient>

  constructor({
    environment,
    discoveryNodeSelector
  }: ExternalWalletAuthConfig) {
    const {
      acdc: { chainId }
    } = getConfig(environment)
    this.chainId = chainId
    this.discoveryNodeSelector = discoveryNodeSelector
  }

  async getClient() {
    if (this.client) {
      return this.client
    }
    const rpcUrl = `${await this.discoveryNodeSelector.getSelectedEndpoint()}/chain`

    if (!window.ethereum) throw new Error('No window.ethereum found')

    const [account]: Account[] = await window.ethereum.request({
      method: 'eth_requestAccounts'
    })
    if (!account) throw new Error('No account returned from Wallet')
    this.client = createClient(account, this.chainId, rpcUrl)
    return this.client
  }

  getSharedSecret: (publicKey: string | Uint8Array) => Promise<Uint8Array> =
    async (_publicKey) => {
      throw new Error('ExternalWalletAuth does not support getSharedSecret()')
    }

  sign: (data: string | Uint8Array) => Promise<[Uint8Array, number]> = async (
    data
  ) => {
    const client = await this.getClient()
    const message = typeof data === 'string' ? data : { raw: data }
    const signed = await client.signMessage({ message })
    // Convert to buffer since calling code expects that...
    const buffer = new Uint8Array(Buffer.from(signed, 'utf-8'))
    return [buffer, buffer.length]
  }

  hashAndSign: (data: string) => Promise<string> = () => {
    throw new Error('hashAndSign not supported')
  }

  signTransaction: (
    data: MessageData<EIP712TypedData>['data']
  ) => Promise<string> = async (data) => {
    const client = await this.getClient()
    // TODO: Type of chainId is messing this up
    // @ts-ignore
    return client.signTypedData(data)
  }

  getAddress: () => Promise<string> = async () => {
    const client = await this.getClient()
    const [address] = await client.getAddresses()
    return address || ''
  }
}
