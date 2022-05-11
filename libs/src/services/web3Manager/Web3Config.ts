import type Web3 from 'web3'
import type { Providers } from '../../utils'
import type Wallet from 'ethereumjs-wallet'

export type Web3Config = {
  ownerWallet: Wallet
  providers: Providers
  useExternalWeb3: boolean
  internalWeb3Config: {
    web3ProviderEndpoints: string[]
    privateKey: string
  }
  externalWeb3Config: {
    web3: Web3
    ownerWallet: Wallet
  }
}
