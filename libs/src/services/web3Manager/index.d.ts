import type Web3 from 'web3'
import type { provider as Provider } from 'web3-core'

export type Web3Config = {
  useExternalWeb3: boolean
  internalWeb3Config: {
    web3ProviderEndpoints: string[]
  }
}

class Web3Manager {
  getWalletAddress(): string
  sign(clientChallengeKey: string): Promise<string>
  provider(service: string, timeout: number): Provider
  getWeb3(): Web3
  setWeb3(web3: Web3)
  web3Config: Web3Config
  web3: Web3
}

export default Web3Manager
