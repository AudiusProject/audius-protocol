const { promisify, callbackify } = require('util')
const { shuffle } = require('lodash')

class MultiProvider {
  constructor (providers) {
    if (!providers.every(provider => provider.sendAsync || provider.send)) {
      throw new Error('Some providers do not have a send method to use.')
    }

    this.providers = providers
    this.send = callbackify(this._send.bind(this)) // web3 only supports callback functions and not async
  }

  _send (payload) {
    for (const provider of shuffle(this.providers)) {
      try {
        const send = promisify((provider.sendAsync || provider.send).bind(provider))
        return send(payload)
      } catch (e) {
        console.log(e)
      }
    }

    throw new Error('All requests failed')
  }

  /**
   * Returns the desired boolean.
   *
   * @method supportsSubscriptions
   * @returns {boolean}
   */
  supportsSubscriptions () {
    return this.providers.every(provider => provider.supportsSubscriptions())
  }
}

module.exports = MultiProvider
