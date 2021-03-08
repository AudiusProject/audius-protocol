const { promisify, callbackify } = require('util')
const Web3 = require('../web3')
const { shuffle } = require('lodash')

/**
 * web3 consumes a provider object on initialization
 * ref: https://github.com/ChainSafe/web3.js/blob/1.x/packages/web3/types/index.d.ts#L31
 * which references: https://github.com/ChainSafe/web3.js/blob/1.x/packages/web3-core/types/index.d.ts#L436
 * MultiProivder implements HttpProvider which can be consumed by web3
 * ref for HttpProvider: https://github.com/ChainSafe/web3.js/blob/1.x/packages/web3-providers-http/types/index.d.ts#L46-L66
 */
class MultiProvider extends Web3.providers.HttpProvider {
  /**
   * Creates a MultiProvider
   * @param {Array<string | Provider> | string} - The providers to use.
   */
  constructor (providers) {
    if (typeof providers === 'string') {
      providers = providers.split(',')
    } else if (!Array.isArray(providers)) {
      providers = [providers]
    }

    // The below line ensures that we support different types of providers i.e. comma separated strings, an array of strings or an array of providers.
    super(providers[0])
    providers = providers.map(provider => (new Web3(provider)).eth.currentProvider)

    if (!providers.every(provider => provider.sendAsync || provider.send)) {
      throw new Error('Some providers do not have a send method to use.')
    }

    this.providers = providers
    // We replace HttpProvider.send with a custom function that supports fallback providers.
    this.send = callbackify(this._send.bind(this)) // web3 only supports callback functions and not async
  }

  /**
   * @method _send
   * @param {Object} payload
   */
  async _send (payload) {
    for (const provider of shuffle(this.providers)) {
      try {
        const send = promisify((provider.sendAsync || provider.send).bind(provider))
        const result = await send(payload)
        return result
      } catch (e) {
        console.log(e)
      }
    }

    throw new Error('All requests failed')
  }
}

module.exports = MultiProvider
