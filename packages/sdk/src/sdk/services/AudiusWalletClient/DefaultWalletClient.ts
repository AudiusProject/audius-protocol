import type { AudiusWalletClient } from './types'

const NOT_INITIALIZED =
  'WalletClient not initialized - Please provide an apiKey and apiSecret, or a custom implementation of WalletClient'

export class DefaultWalletClient implements AudiusWalletClient {
  private readonly apiKey: string | null

  constructor(apiKey?: string) {
    this.apiKey = apiKey?.replace(/^0x/, '') ?? null
  }

  getSharedSecret = () => {
    throw new Error(NOT_INITIALIZED)
  }

  sign = () => {
    throw new Error(NOT_INITIALIZED)
  }

  signMessage = () => {
    throw new Error(NOT_INITIALIZED)
  }

  signTypedData = () => {
    throw new Error(NOT_INITIALIZED)
  }

  sendTransaction = () => {
    throw new Error(NOT_INITIALIZED)
  }

  getAddress: () => Promise<string> = async () => {
    if (!this.apiKey) {
      throw new Error(NOT_INITIALIZED)
    }
    return `0x${this.apiKey}`
  }
}
