import * as util from 'util'

import { shuffle } from 'lodash'
import type { HttpProvider, AbstractProvider } from 'web3-core'
import type { JsonRpcPayload } from 'web3-core-helpers'

import Web3 from '../LibsWeb3'
const { callbackify, promisify } = util

const getSendMethod = (provider: HttpProvider | AbstractProvider) => {
  if ('sendAsync' in provider) {
    return provider.sendAsync
  }
  return provider.send
}

type Providers = [HttpProvider, ...Array<HttpProvider | AbstractProvider>]

/**
 * web3 consumes a provider object on initialization
 * ref: https://github.com/ChainSafe/web3.js/blob/1.x/packages/web3/types/index.d.ts#L31
 * which references: https://github.com/ChainSafe/web3.js/blob/1.x/packages/web3-core/types/index.d.ts#L436
 * MultiProvider implements HttpProvider which can be consumed by web3
 * ref for HttpProvider: https://github.com/ChainSafe/web3.js/blob/1.x/packages/web3-providers-http/types/index.d.ts#L46-L66
 */
export class MultiProvider extends Web3.providers.HttpProvider {
  providers: Providers
  /**
   * Creates a MultiProvider
   * @param {Array<string | Provider> | string} - The providers to use.
   */
  constructor(providers: string[] | string) {
    let web3Providers: string[]
    if (typeof providers === 'string') {
      web3Providers = providers.split(',')
    } else if (!Array.isArray(providers)) {
      web3Providers = [providers]
    } else {
      web3Providers = providers
    }

    // The below line ensures that we support different types of providers i.e. comma separated strings, an array of strings or an array of providers.
    const web3ProviderInstances = web3Providers.map(
      (provider) => new Web3(provider).eth.currentProvider
    ) as Providers
    super(web3ProviderInstances[0]?.host)

    if (!web3ProviderInstances.every(getSendMethod)) {
      throw new Error('Some providers do not have a send method to use.')
    }

    this.providers = web3ProviderInstances

    // We replace HttpProvider.send with a custom function that supports fallback providers.
    this.send = callbackify(this._send.bind(this)) // web3 only supports callback functions and not async
  }

  /**
   * @method _send
   * @param {Object} payload
   */
  async _send(payload: JsonRpcPayload) {
    let lastError: Error | null = null

    for (const provider of shuffle(this.providers)) {
      try {
        const send = promisify(getSendMethod(provider).bind(provider))
        const result = await send(payload)
        return result
      } catch (e) {
        lastError = e as Error
      }
    }

    throw lastError || new Error('No RPC providers found')
  }
}
